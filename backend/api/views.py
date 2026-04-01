import json
import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import authenticate
from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests

from .models import CustomUser, OTPCode
from .serializers import (
    UserSerializer, RegisterRequest, OTPVerifyRequest, 
    LoginRequest, GoogleLoginRequest, UpdateUserRequest
)
from .utils import send_otp_email, call_ollama

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RegisterRequest(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        if CustomUser.objects.filter(email=email).exists():
            return Response({"detail": "Ushbu email allaqachon mavjud"}, status=status.HTTP_400_BAD_REQUEST)
        
        # OTP logic
        code = f"{random.randint(100000, 999999)}"
        # We store the password hash temporarily in OTP table
        from django.contrib.auth.hashers import make_password
        hashed_pw = make_password(password)
        expires = timezone.now() + timedelta(minutes=5)
        
        OTPCode.objects.update_or_create(
            email=email,
            defaults={"code": code, "password_hash": hashed_pw, "expires_at": expires}
        )
        
        send_otp_email(email, code)
        return Response({
            "message": "Emailingizga 6 xonali tasdiq kod yuborildi", 
            "requiresOtp": True, 
            "email": email
        })

class VerifyOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = OTPVerifyRequest(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        
        try:
            otp = OTPCode.objects.get(email=email)
        except OTPCode.DoesNotExist:
            return Response({"detail": "Qayta ro'yxatdan o'ting"}, status=status.HTTP_400_BAD_REQUEST)
            
        if otp.code != code:
            return Response({"detail": "Tasdiq kodi xato"}, status=status.HTTP_400_BAD_REQUEST)
            
        if timezone.now() > otp.expires_at:
            return Response({"detail": "Tasdiqlash kodi vaqti tugagan, qayta urinib ko'ring"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Success! Create User
        user = CustomUser.objects.create(
            email=email,
            password=otp.password_hash,
            provider='email'
        )
        otp.delete()
        
        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Muvaffaqiyatli!",
            "accessToken": str(refresh.access_token),
            "email": email
        })

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginRequest(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(email=serializer.validated_data['email'], password=serializer.validated_data['password'])
        if not user:
            return Response({"detail": "Email yoki parol noto'g'ri"}, status=status.HTTP_400_BAD_REQUEST)
            
        refresh = RefreshToken.for_user(user)
        return Response({
            "accessToken": str(refresh.access_token),
            "email": user.email,
            "onboardingData": user.onboarding_data,
            "onboardingCompleted": user.onboarding_completed,
            "onboardingProgress": user.onboarding_progress,
            "chatHistory": user.chat_history,
            "iqScore": user.iq_score,
            "psychologicalProfile": user.psychological_profile
        })

class GoogleAuthView(views.APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        credential = request.data.get('credential')
        try:
            idinfo = id_token.verify_oauth2_token(credential, requests.Request(), settings.GOOGLE_CLIENT_ID)
            email = idinfo['email']
            
            user, created = CustomUser.objects.get_or_create(email=email, defaults={
                'provider': 'google',
                'password': 'random_google_oauth_pass' # Placeholder
            })
            
            refresh = RefreshToken.for_user(user)
            return Response({
                "accessToken": str(refresh.access_token),
                "email": user.email,
                "onboardingData": user.onboarding_data,
                "onboardingCompleted": user.onboarding_completed,
                "onboardingProgress": user.onboarding_progress,
                "chatHistory": user.chat_history,
                "iqScore": user.iq_score,
                "psychologicalProfile": user.psychological_profile
            })
        except Exception as e:
            return Response({"detail": f"Google xatosi: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class MeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            "email": user.email,
            "onboardingData": user.onboarding_data,
            "onboardingCompleted": user.onboarding_completed,
            "onboardingProgress": user.onboarding_progress,
            "iqScore": user.iq_score,
            "psychologicalProfile": user.psychological_profile
        })

class UserUpdateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        data = request.data
        
        if 'onboardingData' in data:
            user.onboarding_data = data['onboardingData']
        if 'onboardingCompleted' in data:
            user.onboarding_completed = data['onboardingCompleted']
        if 'onboardingProgress' in data:
            user.onboarding_progress = data['onboardingProgress']
        if 'chatHistory' in data:
            user.chat_history = data['chatHistory']
        if 'iqScore' in data:
            user.iq_score = data['iqScore']
        if 'psychologicalProfile' in data:
            user.psychological_profile = data['psychologicalProfile']
            
        user.save()
        return Response({"message": "Saqlandi"})

# AI VIEWS
class AskQuestionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        question = request.data.get('question')
        options = request.data.get('options', [])
        history = request.data.get('chatHistory', [])
        
        prompt = f"[TIZIM TOPSHIRIG'I: Suhbatdoshdan quyidagi narsani so'rashing kerak: '{question}'."
        if options:
            if isinstance(options[0], dict):
                opt_texts = [o.get("text", f"Rasm: {o.get('id')}") for o in options]
                prompt += f" Javob berishini osonlashtirish uchun ushbu variantlarni aytib o't: {', '.join(opt_texts)}."
            else:
                prompt += f" Javob berishini osonlashtirish uchun ushbu variantlarni aytib o't: {', '.join(options)}."
        prompt += " O'z rolingda, juda QISQA va xushmuomalalik bilan faqat savolni o'zini (yoki qisqa tushuntirish bilan) ber]"
        
        content = call_ollama(prompt, history) or f"Savol: {question}"
        return Response({"response": content})

class ExtractDetailsView(views.APIView):
    permission_classes = [permissions.AllowAny] # No token needed for background NLP
    
    def post(self, request):
        answer = request.data.get('userAnswer')
        fields = request.data.get('availableFields', [])
        
        fields_str = ""
        for f in fields:
            fields_str += f"- {f['field']} (savol: {f['question']}, turi: {f['type']})\n"
        
        prompt = f"""Foydalanuvchi matni: "{answer}"
Vazifang: Ushbu matndan quyidagi maydonlarga mos keladigan ma'lumotlarni ajratib ol (agar bor bo'lsa):
{fields_str}
Qoidalar: ... (previous rules from main.py) ...
JSON:"""
        
        # Using full rules as in main.py for reliability
        prompt += """\n1) Faqat matnda aniq ko'rsatilgan ma'lumotlarni ol.\n2) Agar ma'lumot bo'lmasa, uni qoldirib ket.\n3) Javobni FAQAT JSON formatida qaytar.\n4) JSON formati: {"field_name": "value", ...}.\n5) Agar maydon 'date' bo'lsa, uni 'YYYY-MM-DD' formatiga o'tkazishga harakat qil.\n6) Agar 'select' bo'lsa, variantlarga eng mosini tanla."""

        content = call_ollama(prompt)
        try:
            # Clean AI response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            data = json.loads(content.strip())
        except:
            data = {}
            
        return Response(data)

class EvaluateAnswerView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        question = request.data.get('question')
        ans = request.data.get('userAnswer')
        fType = request.data.get('fieldType', 'text')
        options = request.data.get('options', [])
        
        evalPrompt = f"Savol: '{question}'\\nFoydalanuvchining xom javobi: '{ans}'\\n"
        # ... logic inherited from main.py ...
        evalPrompt += "1) Agar foydalanuvchi savolga yetarlicha mos javob bergan bo'lsa, 'VALID: <javob>' deb qaytar.\n2) Aks holda 'INVALID' deb javob ber."
        
        content = call_ollama(evalPrompt) or f"VALID: {ans}"
        return Response({"response": content})

class GenerateProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        email = request.data.get('email')
        data = request.data.get('onboardingData')
        score = request.data.get('iqScore')
        
        prompt = f"Foydalanuvchi ma'lumoti: {json.dumps(data)}\nIQ natija: {score}/47\nIltimos batafsil psixologik profilni JSON formatda qaytaring."
        
        content = call_ollama(prompt)
        try:
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            profileData = json.loads(content.strip())
            
            # Save to user
            user = CustomUser.objects.get(email=email)
            user.psychological_profile = profileData
            user.save()
        except:
            profileData = {"summary": "Tahlil kutilmoqda..."}
            
        return Response({"profile": profileData})
