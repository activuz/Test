from django.urls import path
from .views import (
    RegisterView, VerifyOTPView, LoginView, GoogleAuthView, 
    MeView, UserUpdateView, AskQuestionView, ExtractDetailsView, 
    EvaluateAnswerView, GenerateProfileView
)

urlpatterns = [
    # Auth
    path('auth/register', RegisterView.as_view(), name='register'),
    path('auth/verify-otp', VerifyOTPView.as_view(), name='verify-otp'),
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/google', GoogleAuthView.as_view(), name='google-auth'),
    path('auth/me', MeView.as_view(), name='me'),
    
    # User
    path('user/update', UserUpdateView.as_view(), name='user-update'),
    
    # AI/Chat
    path('chat/ask', AskQuestionView.as_view(), name='chat-ask'),
    path('chat/extract', ExtractDetailsView.as_view(), name='chat-extract'),
    path('chat/evaluate', EvaluateAnswerView.as_view(), name='chat-evaluate'),
    path('profile/generate', GenerateProfileView.as_view(), name='profile-generate'),
]
