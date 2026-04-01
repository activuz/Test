from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'email', 
            'onboarding_data', 
            'onboarding_completed', 
            'onboarding_progress', 
            'chat_history', 
            'iq_score', 
            'psychological_profile'
        ]

class RegisterRequest(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class OTPVerifyRequest(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField()

class LoginRequest(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class GoogleLoginRequest(serializers.Serializer):
    credential = serializers.CharField()

class UpdateUserRequest(serializers.Serializer):
    onboardingData = serializers.JSONField(required=False, allow_null=True)
    onboardingCompleted = serializers.BooleanField(required=False, allow_null=True)
    onboardingProgress = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    chatHistory = serializers.JSONField(required=False, allow_null=True)
    iqScore = serializers.IntegerField(required=False, allow_null=True)
    psychologicalProfile = serializers.JSONField(required=False, allow_null=True)
