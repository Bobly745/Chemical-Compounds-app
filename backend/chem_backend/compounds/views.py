# compounds/views.py
import json
from typing import Optional

from django.db.models import Q
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404

from .models import Compound


# ---------- Helpers ----------

def serialize_compound(c: Compound, request=None) -> dict:
    """
    Serialize a Compound to JSON.
    - Inclut l'URL absolue du fichier si `request` est fourni.
    """
    data = {
        "id": c.id,
        "name": c.name,
        "formula": c.formula,
        "smiles": c.smiles,
        "molecular_weight": c.molecular_weight,
        "description": c.description or "",
        "is_public": c.is_public,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        "owner": {"id": c.owner_id, "email": getattr(c.owner, "email", None)},
    }
    if c.structure_file:
        url = c.structure_file.url
        data["structure_file_url"] = request.build_absolute_uri(url) if request else url
    else:
        data["structure_file_url"] = None
    return data


def apply_search(qs, q: Optional[str]):
    """
    Filtre la queryset selon ?q= (name, formula, smiles, description).
    """
    if not q:
        return qs
    q = q.strip()
    return qs.filter(
        Q(name__icontains=q) |
        Q(formula__icontains=q) |
        Q(smiles__icontains=q) |
        Q(description__icontains=q)
    )


def apply_pagination(qs, request):
    """
    Applique ?limit=&offset= (limite [1..100]).
    """
    try:
        limit = int(request.GET.get("limit", 20))
        offset = int(request.GET.get("offset", 0))
    except ValueError:
        limit, offset = 20, 0
    limit = max(1, min(limit, 100))
    offset = max(0, offset)
    total = qs.count()
    items = list(qs[offset: offset + limit])
    return total, offset, limit, items


def parse_json_body(request):
    try:
        return json.loads(request.body.decode("utf-8"))
    except Exception:
        return None


def get_data_from_request(request):
    """
    Supporte JSON et multipart/form-data.
    Retourne (data_dict, file_or_None).
    """
    content_type = (request.META.get("CONTENT_TYPE") or "")
    if content_type.startswith("multipart/form-data"):
        data = request.POST.dict()
        fileobj = request.FILES.get("structure_file")
        return data, fileobj
    # JSON
    data = parse_json_body(request)
    return (data or {}), None


def parse_bool(v, default=False):
    if v is None:
        return default
    return str(v).lower() in ("1", "true", "yes", "on")


# ---------- Views ----------

@require_GET
def get_all_compounds(request):
    """
    PUBLIC: liste tous les composés publics.
    GET /api/compounds/public/?q=&limit=&offset=
    """
    qs = Compound.objects.filter(is_public=True).order_by("name")
    qs = apply_search(qs, request.GET.get("q"))
    total, offset, limit, items = apply_pagination(qs, request)
    return JsonResponse({
        "total": total,
        "offset": offset,
        "limit": limit,
        "results": [serialize_compound(c, request) for c in items],
    })


@require_GET
@login_required
def get_compounds(request):
    """
    PRIVATE: liste les composés accessibles aux utilisateurs connectés.
    Désormais : TOUS les composés (peu importe le rôle).
    GET /api/compounds/private/?q=&limit=&offset=
    """
    qs = Compound.objects.all()  # ← plus de filtrage par owner/role
    qs = apply_search(qs.order_by("name"), request.GET.get("q"))
    total, offset, limit, items = apply_pagination(qs, request)
    return JsonResponse({
        "total": total,
        "offset": offset,
        "limit": limit,
        "results": [serialize_compound(c, request) for c in items],
    })



@require_POST
@csrf_protect
@login_required
def add_compound(request):
    """
    Crée un composé.
    POST /api/compounds/add/
    Corps JSON ou multipart/form-data :
      - Requis : name, formula, smiles
      - Optionnels : molecular_weight (float), description (str), is_public (bool), structure_file (file)
    """
    data, fileobj = get_data_from_request(request)
    if data is None:
        return HttpResponseBadRequest("Invalid payload")

    name = (data.get("name") or "").strip()
    formula = (data.get("formula") or "").strip()
    smiles = (data.get("smiles") or "").strip()
    description = (data.get("description") or "").strip()
    is_public = parse_bool(data.get("is_public"), default=True)

    # molecular_weight est optionnel (FloatField null=True, blank=True)
    mw = data.get("molecular_weight")
    molecular_weight = None
    if mw not in (None, ""):
        try:
            molecular_weight = float(mw)
        except (TypeError, ValueError):
            return JsonResponse({"error": "molecular_weight must be a number"}, status=400)

    if not name:
        return JsonResponse({"error": "name is required"}, status=400)
    if not formula:
        return JsonResponse({"error": "formula is required"}, status=400)
    if not smiles:
        return JsonResponse({"error": "smiles is required"}, status=400)

    comp = Compound.objects.create(
        name=name,
        formula=formula,
        smiles=smiles,
        molecular_weight=molecular_weight,
        description=description,
        is_public=is_public,
        owner=request.user,
        structure_file=fileobj if fileobj else None,
    )
    return JsonResponse({"message": "Created", "compound": serialize_compound(comp, request)}, status=201)


@require_POST
@csrf_protect
@login_required
def update_compound(request, compound_id: int):
    """
    Met à jour un composé (owner ou staff).
    POST /api/compounds/<id>/update/
    Corps JSON ou multipart/form-data.
    - Pour retirer le fichier : 'remove_structure_file' = true/1/yes/on
    """
    comp = get_object_or_404(Compound, pk=compound_id)
    if comp.owner_id != request.user.id:
        return JsonResponse({"error": "Forbidden"}, status=403)


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

    # Fichier
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
def delete_compound(request, compound_id: int):
    """
    Supprime un composé (owner ou staff).
    POST /api/compounds/<id>/delete/
    """
    comp = get_object_or_404(Compound, pk=compound_id)
    if comp.owner_id != request.user.id:
        return JsonResponse({"error": "Forbidden"}, status=403)


    if comp.structure_file:
        comp.structure_file.delete(save=False)
    comp.delete()
    return JsonResponse({"message": "Deleted"})
    

# ---------- (Optionnel) Détail ----------
# Si tu veux un endpoint de détail, ajoute la route dans compounds/urls.py :
# path('<int:compound_id>/', views.get_compound_detail, name='compound_detail')

@require_GET
def get_compound_detail(request, compound_id: int):
    """
    Détail d’un composé.
    - Si l’utilisateur est connecté → accès à tous les composés.
    - Si non connecté → uniquement aux composés publics.
    """
    comp = get_object_or_404(Compound, pk=compound_id)

    # Non connecté + composé privé → 404
    if (not request.user.is_authenticated) and (not comp.is_public):
        return JsonResponse({"error": "Not found"}, status=404)

    return JsonResponse({"compound": serialize_compound(comp, request)})
