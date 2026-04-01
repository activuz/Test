import os
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.conf import settings
import ollama

def send_otp_email(to_email: str, code: str):
    smtp_email = settings.SMTP_EMAIL
    smtp_password = settings.SMTP_APP_PASSWORD
    
    if not smtp_email or not smtp_password:
        print(f"!!! DIQQAT !!! SMTP ishga tushmagan. {to_email} ga mo'ljallangan kod: {code}")
        return True
        
    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_email
        msg['To'] = to_email
        msg['Subject'] = "HamrohAi - Tasdiqlash Kodi"
        
        body = f"Assalomu alaykum,\n\nSizning ro'yxatdan o'tish uchun tasdiqlash kodingiz: {code}\nChet shaxslarga bermang!"
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"SMTP Error: {e}")
        return False

def call_ollama(prompt, messages=[]):
    try:
        # Build message history
        full_messages = [{"role": "system", "content": "Sen insonlarga onboarding jaryonida yordam beruvchi xushmuomala, ochiqko'ngil botsan. Javoblaring juda qisqa bo'lsin."}]
        for m in messages:
            if m.get('role') != 'system':
                full_messages.append({"role": m['role'], "content": m['content']})
        
        full_messages.append({"role": "user", "content": prompt})
        
        response = ollama.chat(model=settings.OLLAMA_MODEL, messages=full_messages)
        return response.get("message", {}).get("content", "")
    except Exception as e:
        print(f"Ollama Error: {e}")
        return None
