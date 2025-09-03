from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        if not full_name:
            raise ValueError("Full name is required")

        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)

        # For classic password login, enforce a non-empty password:
        if not password:
            raise ValueError("Password is required for local accounts")
            # If you really want to allow SSO-only users, you could do:
            # user.set_unusable_password()
            # return user

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        if not password:
            raise ValueError("Superuser must have a password.")

        return self.create_user(email, full_name, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ("guest", "Guest"),
        ("connected", "Connected"),
        ("admin", "Admin"),
    ]

    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="guest")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = CustomUserManager()

    def __str__(self):
        return self.email

    # Optional helpers
    def get_full_name(self):
        return self.full_name

    def get_short_name(self):
        return self.full_name.split(" ")[0] if self.full_name else self.email

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        indexes = [
            models.Index(fields=["role"]),  # utile si tu filtres souvent par rôle
        ]
