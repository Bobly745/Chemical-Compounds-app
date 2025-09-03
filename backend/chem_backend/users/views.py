import json
from django.http import JsonResponse, HttpResponseBadRequest
from django.contrib.auth import get_user_model, authenticate, login, logout
from django.contrib.auth import update_session_auth_hash
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.contrib.auth.decorators import login_required
from django.middleware.csrf import get_token, rotate_token
from django.conf import settings

User = get_user_model()

# ---- CSRF bootstrap: sets csrftoken cookie if missing
@require_GET
@ensure_csrf_cookie
def csrf_token_view(request):
    # Renvoie aussi la valeur actuelle (utile en debug)
    return JsonResponse({"csrfToken": get_token(request)})

# ---- Register (POST, CSRF-protected)
@require_POST
@csrf_protect
def register_view(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not full_name or not email or not password:
        return JsonResponse({"error": "All fields are required"}, status=400)

    if User.objects.filter(email=email).exists():
        return JsonResponse({"error": "Email already exists"}, status=400)

    try:
        User.objects.create_user(email=email, full_name=full_name, password=password)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"message": "Account created successfully. Please log in."}, status=201)

# ---- Login (POST, CSRF-protected)
@require_POST
@csrf_protect
def login_view(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = authenticate(request, email=email, password=password)
    if user is None:
        return JsonResponse({"error": "Invalid credentials"}, status=401)

    # Upgrade 'guest' -> 'connected' au premier login si besoin
    if getattr(user, "role", None) == "guest":
        user.role = "connected"
        user.save(update_fields=["role"])

    login(request, user)  # crée la session + cookie 'sessionid'

    return JsonResponse({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "email": getattr(user, "email", ""),
            "full_name": getattr(user, "full_name", ""),
            "role": getattr(user, "role", ""),
        }
    })

# ---- Logout (POST, CSRF-protected) — supprime le cookie et régénère le token
@require_POST
@csrf_protect
def logout_view(request):
    # Invalider la session côté serveur
    logout(request)
    # Régénérer le token CSRF (l’ancien ne doit plus être utilisé)
    rotate_token(request)

    resp = JsonResponse({"message": "Logout successful"})
    # ⚠️ Django 5.x: pas de paramètre "secure" dans delete_cookie
    resp.delete_cookie(
        settings.SESSION_COOKIE_NAME,
        path=getattr(settings, "SESSION_COOKIE_PATH", "/"),
        domain=getattr(settings, "SESSION_COOKIE_DOMAIN", None),
        samesite=getattr(settings, "SESSION_COOKIE_SAMESITE", "Lax"),
    )
    return resp

# ---- Who am I (GET)
@require_GET
def me_view(request):
    if request.user.is_authenticated:
        u = request.user
        return JsonResponse({
            "authenticated": True,
            "user": {
                "id": u.id,
                "email": getattr(u, "email", ""),
                "full_name": getattr(u, "full_name", ""),
                "role": getattr(u, "role", ""),
            }
        })
    return JsonResponse({"authenticated": False}, status=401)

# ---- NEW: Update profile (POST, CSRF-protected, login required)
@require_POST
@csrf_protect
@login_required
def update_profile(request):
    """
    Met à jour le profil de l'utilisateur connecté (full_name obligatoire, email optionnel).
    Body JSON: { "full_name": "...", "email": "..." }
    """
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()

    if not full_name:
        return JsonResponse({"error": "Full name is required"}, status=400)

    u = request.user

    if email and email != u.email:
        if User.objects.filter(email=email).exclude(pk=u.pk).exists():
            return JsonResponse({"error": "Email already in use"}, status=400)
        u.email = email

    u.full_name = full_name
    if email:
        u.save(update_fields=["full_name", "email"])
    else:
        u.save(update_fields=["full_name"])

    return JsonResponse({
        "message": "Profile updated",
        "user": {
            "id": u.id,
            "email": getattr(u, "email", ""),
            "full_name": getattr(u, "full_name", ""),
            "role": getattr(u, "role", ""),
            "is_staff": getattr(u, "is_staff", False),
        }
    })

# ---- NEW: Change password (POST, CSRF-protected, login required)
@require_POST
@csrf_protect
@login_required
def change_password(request):
    """
    Change le mot de passe de l'utilisateur connecté.
    Body JSON: { "current_password": "...", "new_password": "..." }
    """
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if len(new_password) < 6:
        return JsonResponse({"error": "New password must be at least 6 characters"}, status=400)

    u = request.user
    if not u.check_password(current_password):
        return JsonResponse({"error": "Current password is incorrect"}, status=400)

    u.set_password(new_password)
    u.save(update_fields=["password"])
    # Rester connecté après changement de mot de passe
    update_session_auth_hash(request, u)

    return JsonResponse({"message": "Password updated"})
