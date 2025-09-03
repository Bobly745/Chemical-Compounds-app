# users/admin_views.py
import json
from typing import Optional

from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import JsonResponse, HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_GET, require_POST

from compounds.models import Compound

# Réutilisation de helpers côté compounds
from compounds.views import (
    serialize_compound,
    get_data_from_request,
    parse_bool,
    apply_pagination as _apply_pagination_compounds,
    apply_search as _apply_search_compounds,
)

User = get_user_model()


# ------------ Helpers ------------
def is_admin(user) -> bool:
    return bool(user and user.is_authenticated and (getattr(user, "is_staff", False) or getattr(user, "role", "") == "admin"))

def admin_forbidden():
    return JsonResponse({"error": "Forbidden"}, status=403)

def parse_json(request):
    try:
        return json.loads(request.body.decode("utf-8"))
    except Exception:
        return None

def apply_pagination(qs, request):
    try:
        limit = int(request.GET.get("limit", 50))
        offset = int(request.GET.get("offset", 0))
    except ValueError:
        limit, offset = 50, 0
    limit = max(1, min(limit, 100))
    offset = max(0, offset)
    total = qs.count()
    items = list(qs[offset: offset + limit])
    return total, offset, limit, items


# ------------ Users Admin API ------------
@require_GET
@login_required
def admin_list_users(request):
    if not is_admin(request.user):
        return admin_forbidden()

    q = (request.GET.get("q") or "").strip()
    qs = User.objects.all().order_by("-is_staff", "email")
    if q:
        qs = qs.filter(Q(email__icontains=q) | Q(full_name__icontains=q))

    total, offset, limit, items = apply_pagination(qs, request)
    results = []
    for u in items:
        results.append({
            "id": u.id,
            "email": getattr(u, "email", None),
            "full_name": getattr(u, "full_name", None),
            "role": getattr(u, "role", None),
            "is_staff": bool(getattr(u, "is_staff", False)),
            "is_active": bool(getattr(u, "is_active", True)),
            "date_joined": getattr(u, "date_joined", None).isoformat() if getattr(u, "date_joined", None) else None,
            "last_login": getattr(u, "last_login", None).isoformat() if getattr(u, "last_login", None) else None,
        })

    return JsonResponse({"total": total, "offset": offset, "limit": limit, "results": results})


@require_POST
@csrf_protect
@login_required
def admin_set_active(request, user_id: int):
    """
    Active/Désactive un utilisateur (sans suppression).
    Garde-fous: pas d'auto-désactivation, et on ne désactive pas le **dernier** admin.
    Body JSON: { "is_active": true|false }
    """
    if not is_admin(request.user):
        return admin_forbidden()

    target = get_object_or_404(User, pk=user_id)
    data = parse_json(request)
    if not isinstance(data, dict) or "is_active" not in data:
        return HttpResponseBadRequest("Invalid payload")

    new_active = parse_bool(data.get("is_active"))

    # Pas d'auto-désactivation
    if target.id == request.user.id and not new_active:
        return JsonResponse({"error": "You cannot deactivate your own account."}, status=400)

    # On ne désactive pas le dernier admin
    is_target_admin = bool(getattr(target, "is_staff", False) or getattr(target, "role", "") == "admin")
    if is_target_admin and not new_active:
        admins_qs = User.objects.filter(Q(is_staff=True) | Q(role="admin"), is_active=True).exclude(pk=target.pk)
        if admins_qs.count() == 0:
            return JsonResponse({"error": "Cannot deactivate the last active administrator."}, status=400)

    target.is_active = new_active
    target.save(update_fields=["is_active"])

    return JsonResponse({
        "message": "Updated",
        "user": {
            "id": target.id,
            "email": target.email,
            "full_name": getattr(target, "full_name", None),
            "role": getattr(target, "role", None),
            "is_staff": bool(target.is_staff),
            "is_active": bool(target.is_active),
        }
    })


@require_POST
@csrf_protect
@login_required
def admin_set_admin(request, user_id: int):
    if not is_admin(request.user):
        return admin_forbidden()

    target = get_object_or_404(User, pk=user_id)
    data = parse_json(request)
    if not isinstance(data, dict) or "is_admin" not in data:
        return HttpResponseBadRequest("Invalid payload")

    make_admin = parse_bool(data.get("is_admin"))

    if make_admin:
        target.is_staff = True
        if getattr(target, "role", None) != "admin":
            target.role = "admin"
        target.save(update_fields=["is_staff", "role"])
    else:
        # ne pas rétrograder le dernier admin actif
        others_admins = User.objects.filter(Q(is_staff=True) | Q(role="admin"), is_active=True).exclude(pk=target.pk)
        if others_admins.count() == 0:
            return JsonResponse({"error": "Cannot demote the last administrator."}, status=400)
        target.is_staff = False
        if getattr(target, "role", None) == "admin":
            target.role = "connected"
            target.save(update_fields=["is_staff", "role"])
        else:
            target.save(update_fields=["is_staff"])

    return JsonResponse({
        "message": "Updated",
        "user": {
            "id": target.id,
            "email": target.email,
            "full_name": getattr(target, "full_name", None),
            "role": getattr(target, "role", None),
            "is_staff": bool(target.is_staff),
            "is_active": bool(target.is_active),
        }
    })


# ------------ Compounds Admin API ------------
@require_GET
@login_required
def admin_list_compounds(request):
    if not is_admin(request.user):
        return admin_forbidden()

    qs = Compound.objects.all().order_by("name")
    qs = _apply_search_compounds(qs, request.GET.get("q"))
    total, offset, limit, items = _apply_pagination_compounds(qs, request)
    return JsonResponse({
        "total": total,
        "offset": offset,
        "limit": limit,
        "results": [serialize_compound(c, request) for c in items],
    })


@require_POST
@csrf_protect
@login_required
def admin_update_compound(request, compound_id: int):
    if not is_admin(request.user):
        return admin_forbidden()

    comp = get_object_or_404(Compound, pk=compound_id)
    data, fileobj = get_data_from_request(request)
    if data is None:
        return HttpResponseBadRequest("Invalid payload")

    if "name" in data:
        comp.name = (data.get("name") or "").strip()
    if "formula" in data:
        comp.formula = (data.get("formula") or "").strip()
    if "smiles" in data:
        comp.smiles = (data.get("smiles") or "").strip()
    if "description" in data:
        comp.description = (data.get("description") or "").strip()

    if "molecular_weight" in data:
        mw = data.get("molecular_weight")
        if mw in (None, ""):
            comp.molecular_weight = None
        else:
            try:
                comp.molecular_weight = float(mw)
            except (TypeError, ValueError):
                return JsonResponse({"error": "molecular_weight must be a number"}, status=400)

    if "is_public" in data:
        comp.is_public = parse_bool(data.get("is_public"))

    if fileobj is not None:
        comp.structure_file = fileobj
    else:
        remove_flag = parse_bool(data.get("remove_structure_file"))
        if remove_flag and comp.structure_file:
            comp.structure_file.delete(save=False)
            comp.structure_file = None

    comp.save()
    return JsonResponse({"message": "Updated", "compound": serialize_compound(comp, request)})


@require_POST
@csrf_protect
@login_required
def admin_delete_compound(request, compound_id: int):
    if not is_admin(request.user):
        return admin_forbidden()

    comp = get_object_or_404(Compound, pk=compound_id)
    if comp.structure_file:
        comp.structure_file.delete(save=False)
    comp.delete()
    return JsonResponse({"message": "Deleted"})
