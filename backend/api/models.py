from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email must be provided")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    username = None # Email is the username
    email = models.EmailField("email", unique=True)
    
    # Custom fields mapping FastAPI structure
    provider = models.CharField(max_length=20, default='email')
    onboarding_completed = models.BooleanField(default=False)
    onboarding_data = models.JSONField(null=True, blank=True)
    onboarding_progress = models.TextField(null=True, blank=True)
    chat_history = models.JSONField(null=True, blank=True)
    iq_score = models.IntegerField(default=0)
    psychological_profile = models.JSONField(null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

class OTPCode(models.Model):
    email = models.EmailField(primary_key=True)
    code = models.CharField(max_length=10)
    password_hash = models.TextField()
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"{self.email} - {self.code}"
