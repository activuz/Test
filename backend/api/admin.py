from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, OTPCode

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ("email", "provider", "onboarding_completed", "iq_score", "date_joined", "is_staff")
    list_filter = ("onboarding_completed", "provider", "is_staff", "is_superuser", "is_active")
    fieldsets = (
        (None, {"fields": ("email", "password", "provider")}),
        ("Onboarding Info", {"fields": ("onboarding_completed", "onboarding_data", "onboarding_progress", "chat_history", "iq_score", "psychological_profile")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    # The fields to be used in displaying the User.
    # These override the definitions on the base UserAdmin
    # that reference specific fields on auth.User.
    readonly_fields = ("date_joined", "last_login")
    search_fields = ("email",)
    ordering = ("email",)

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(OTPCode)
