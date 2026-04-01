import os
import json
import sqlite3
import jwt
import smtplib
import bcrypt
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama
from google.oauth2 import id_token
from google.auth.transport import requests
from dotenv import load_dotenv

# Load ENV
load_dotenv()

# Conf
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "b3n91x8z3v_super_secret_key_please_change")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 kun
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
OLLAMA_MODEL = "gemini-3-flash-preview:latest"

# SMTP
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_APP_PASSWORD = os.getenv("SMTP_APP_PASSWORD", "")
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

app = FastAPI(title="HamrohAi API")

# Allows React frontend to access the server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== DATABASE SETUP =====
DB_FILE = "hamrohai.db"

def init_db():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            provider TEXT DEFAULT 'email',
            onboarding_completed BOOLEAN DEFAULT 0,
            onboarding_data TEXT,
            onboarding_progress TEXT,
            chat_history TEXT,
            iq_score INTEGER DEFAULT 0,
            psychological_profile TEXT
        )
    ''')
    # Migrate if needed (for development)
    try:
        c.execute("ALTER TABLE users ADD COLUMN onboarding_progress TEXT")
    except sqlite3.OperationalError:
        pass # Column already exists
    try:
        c.execute("ALTER TABLE users ADD COLUMN chat_history TEXT")
    except sqlite3.OperationalError:
        pass # Column already exists
    c.execute('''
        CREATE TABLE IF NOT EXISTS otp_codes (
            email TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            expires_at DATETIME NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# ===== AUTH UTILS =====
def send_otp_email(to_email: str, code: str):
    if not SMTP_EMAIL or not SMTP_APP_PASSWORD:
        print(f"!!! DIQQAT !!! SMTP ishga tushmagan. {to_email} ga mo'ljallangan kod: {code}")
        return True
        
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email
        msg['Subject'] = "HamrohAi - Tasdiqlash Kodi"
        
        body = f"Assalomu alaykum,\n\nSizning ro'yxatdan o'tish uchun tasdiqlash kodingiz: {code}\nChet shaxslarga bermang!"
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"SMTP Error: {e}")
        return False

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ===== MODELS =====
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str

class VerifyOtpRequest(BaseModel):
    email: str
    code: str

class GoogleLogin(BaseModel):
    credential: str

class ChatMessage(BaseModel):
    role: str
    content: str

class AskRequest(BaseModel):
    question: str
    options: Optional[List[Any]] = []
    chatHistory: List[ChatMessage] = []

class EvaluateRequest(BaseModel):
    question: str
    options: Optional[List[Any]] = []
    userAnswer: str
    fieldType: str = "text"

class ProfileGenRequest(BaseModel):
    email: str
    onboardingData: Dict[str, Any]
    iqScore: int

class UpdateUserRequest(BaseModel):
    onboardingData: Optional[Dict[str, Any]] = None
    onboardingCompleted: Optional[bool] = None
    onboardingProgress: Optional[str] = None
    chatHistory: Optional[List[Dict[str, Any]]] = None
    iqScore: Optional[int] = None
    psychologicalProfile: Optional[str] = None


# ===== DEPENDENCY: GET CURRENT USER =====
def get_current_user_email(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ===== AUTH ROUTES =====
@app.post("/api/auth/register")
def register(user: UserRegister, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute("SELECT * FROM users WHERE email=?", (user.email,))
    if c.fetchone():
        raise HTTPException(status_code=400, detail="Ushbu email allaqachon mavjud")
    
    # Generate OTP Code
    code = f"{random.randint(100000, 999999)}"
    hashed_pw = get_password_hash(user.password)
    expires = datetime.utcnow() + timedelta(minutes=5)
    
    # Save to otp table
    c.execute("INSERT OR REPLACE INTO otp_codes (email, code, password_hash, expires_at) VALUES (?, ?, ?, ?)", (user.email, code, hashed_pw, expires))
    db.commit()

    # Send OTP
    send_otp_email(user.email, code)
    
    return {"message": "Emailingizga 6 xonali tasdiq kod yuborildi", "requiresOtp": True, "email": user.email}

@app.post("/api/auth/verify-otp")
def verify_otp(req: VerifyOtpRequest, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    
    # Check OTP
    c.execute("SELECT * FROM otp_codes WHERE email=?", (req.email,))
    row = c.fetchone()
    if not row:
        raise HTTPException(status_code=400, detail="Qayta ro'yxatdan o'ting")
        
    if str(row["code"]) != str(req.code):
        raise HTTPException(status_code=400, detail="Tasdiq kodi xato")
        
    # Check expiry
    expires_at = datetime.fromisoformat(row["expires_at"])
    if datetime.utcnow() > expires_at:
        raise HTTPException(status_code=400, detail="Tasdiqlash kodi vaqti tugagan, qayta urinib ko'ring")
        
    # Valid, create user
    c.execute("INSERT INTO users (email, password, provider) VALUES (?, ?, ?)", (req.email, row["password_hash"], 'email'))
    c.execute("DELETE FROM otp_codes WHERE email=?", (req.email,))
    db.commit()

    token = create_access_token({"sub": req.email}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"message": "Muvaffaqiyatli!", "accessToken": token, "email": req.email}

@app.post("/api/auth/login")
def login(user: UserLogin, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute("SELECT * FROM users WHERE email=? AND provider='email'", (user.email,))
    row = c.fetchone()
    
    if not row or not verify_password(user.password, row["password"]):
        raise HTTPException(status_code=400, detail="Email yoki parol noto'g'ri")
    
    token = create_access_token({"sub": row["email"]}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {
        "accessToken": token,
        "email": row["email"],
        "onboardingData": json.loads(row["onboarding_data"]) if row["onboarding_data"] else None,
        "onboardingCompleted": bool(row["onboarding_completed"]),
        "onboardingProgress": row["onboarding_progress"],
        "chatHistory": json.loads(row["chat_history"]) if row["chat_history"] else None,
        "iqScore": row["iq_score"],
        "psychologicalProfile": json.loads(row["psychological_profile"]) if row["psychological_profile"] else None
    }

@app.post("/api/auth/google")
def google_auth(req: GoogleLogin, db: sqlite3.Connection = Depends(get_db)):
    try:
        print("GOOGLE_AUTH STEP 1: Starting")
        # Verify Token With Google
        try:
            idinfo = id_token.verify_oauth2_token(req.credential, requests.Request(), GOOGLE_CLIENT_ID)
        except Exception as e:
            print(f"STEP 1 FAILED (id_token.verify): {type(e)} {e}")
            raise ValueError(f"id_token_error: {e}")

        email = idinfo['email']
        print(f"GOOGLE_AUTH STEP 2: Email extracted ({email})")
        
        c = db.cursor()
        c.execute("SELECT * FROM users WHERE email=?", (email,))
        row = c.fetchone()
        
        # User not found -> Register
        if not row:
            print("GOOGLE_AUTH STEP 3: User not found, registering")
            try:
                hashed_pw = get_password_hash("random_google_oauth_pass")
            except Exception as e:
                print(f"STEP 3 FAILED (get_password_hash): {type(e)} {e}")
                raise ValueError(f"bcrypt_error: {e}")
                
            c.execute("INSERT INTO users (email, password, provider) VALUES (?, ?, ?)", (email, hashed_pw, 'google'))
            db.commit()
            
            # Fetch newly created user info
            c.execute("SELECT * FROM users WHERE email=?", (email,))
            row = c.fetchone()

        print("GOOGLE_AUTH STEP 4: Creating access token")
        try:
            token = create_access_token({"sub": email}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        except Exception as e:
            print(f"STEP 4 FAILED (create_access_token): {type(e)} {e}")
            raise ValueError(f"token_error: {e}")
            
        print("GOOGLE_AUTH STEP 5: Success")
        return {
            "accessToken": token,
            "email": row["email"],
            "onboardingData": json.loads(row["onboarding_data"]) if row["onboarding_data"] else None,
            "onboardingCompleted": bool(row["onboarding_completed"]),
            "onboardingProgress": row["onboarding_progress"],
            "chatHistory": json.loads(row["chat_history"]) if row["chat_history"] else None,
            "iqScore": row["iq_score"],
            "psychologicalProfile": json.loads(row["psychological_profile"]) if row["psychological_profile"] else None
        }
    except ValueError as val_err:
        print(f"GOOGLE AUTH ERROR: {str(val_err)}")
        print(f"CURRENT CLIENT ID: {GOOGLE_CLIENT_ID}")
        raise HTTPException(status_code=400, detail=f"Google xatosi: {str(val_err)}")


@app.get("/api/auth/me")
def get_me(user_email: str = Depends(get_current_user_email), db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute("SELECT * FROM users WHERE email=?", (user_email,))
    row = c.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "email": row["email"],
        "onboardingData": json.loads(row["onboarding_data"]) if row["onboarding_data"] else None,
        "onboardingCompleted": bool(row["onboarding_completed"]),
        "onboardingProgress": row["onboarding_progress"],
        "iqScore": row["iq_score"],
        "psychologicalProfile": json.loads(row["psychological_profile"]) if row["psychological_profile"] else None
    }


# ===== USER ROUTES =====
@app.post("/api/user/update")
def update_user(req: UpdateUserRequest, user_email: str = Depends(get_current_user_email), db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    
    updates = []
    params = []
    
    if req.onboardingData is not None:
        updates.append("onboarding_data = ?")
        params.append(json.dumps(req.onboardingData))
    if req.onboardingCompleted is not None:
        updates.append("onboarding_completed = ?")
        params.append(1 if req.onboardingCompleted else 0)
    if req.onboardingProgress is not None:
        updates.append("onboarding_progress = ?")
        params.append(req.onboardingProgress)
    if req.chatHistory is not None:
        updates.append("chat_history = ?")
        params.append(json.dumps(req.chatHistory))
    if req.iqScore is not None:
        updates.append("iq_score = ?")
        params.append(req.iqScore)
    if req.psychologicalProfile is not None:
        updates.append("psychological_profile = ?")
        params.append(req.psychologicalProfile)
        
    if not updates:
        return {"message": "No updates provided"}
        
    query = f"UPDATE users SET {', '.join(updates)} WHERE email = ?"
    params.append(user_email)
    
    c.execute(query, tuple(params))
    db.commit()
    return {"message": "Saqlandi"}


# ===== OLLAMA AI ROUTES =====
class ExtractRequest(BaseModel):
    userAnswer: str
    availableFields: List[dict]

@app.post("/api/chat/extract")
def chat_extract(req: ExtractRequest):
    try:
        fields_str = ""
        for f in req.availableFields:
            fields_str += f"- {f['field']} (savol: {f['question']}, turi: {f['type']})\n"
        
        prompt = f"""Foydalanuvchi matni: "{req.userAnswer}"

Vazifang: Ushbu matndan quyidagi maydonlarga mos keladigan ma'lumotlarni ajratib ol (agar bor bo'lsa):
{fields_str}

Qoidalar:
1) Faqat matnda aniq ko'rsatilgan ma'lumotlarni ol.
2) Agar ma'lumot bo'lmasa, uni qoldirib ket.
3) Javobni FAQAT JSON formatida qaytar, hech qanday tushuntirishsiz.
4) JSON formati: {{"field_name": "value", ...}}. Field nomlari tepadagi ro'yxatdagidek bo'lishi SHART (masalan: 'name', 'birth_date' va h.k.).
5) Agar maydon 'date' bo'lsa, uni 'YYYY-MM-DD' formatiga o'tkazishga harakat qil.
6) Agar 'select' bo'lsa, variantlarga eng mosini tanla. Foydalanuvchi tanlovi variantlardan farq qilsa ham eng mantiqiy variantni kalit sifatida qaytar.

JSON:"""
        
        messages = [{"role": "user", "content": prompt}]
        res = ollama.chat(model=OLLAMA_MODEL, messages=messages)
        content = res.get("message", {}).get("content", "{}")
        
        # Clean potential markdown from AI
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
            
        return json.loads(content.strip())
    except Exception as e:
        print(f"EXTRACT ERROR: {str(e)}")
        return {}

@app.post("/api/chat/ask")
def chat_ask(req: AskRequest, user_email: str = Depends(get_current_user_email)):
    print(f"CHAT_ASK: Received request from {user_email}")
    try:
        prompt = f"[TIZIM TOPSHIRIG'I: Suhbatdoshdan quyidagi narsani so'rashing kerak: '{req.question}'."
        if req.options:
            if isinstance(req.options[0], dict):
                opt_texts = [o.get("text", f"Rasm: {o.get('id')}") for o in req.options]
                prompt += f" Javob berishini osonlashtirish uchun ushbu variantlarni aytib o't: {', '.join(opt_texts)}."
            else:
                prompt += f" Javob berishini osonlashtirish uchun ushbu variantlarni aytib o't: {', '.join(req.options)}."
        prompt += " O'z rolingda, juda QISQA va xushmuomalalik bilan faqat savolni o'zini (yoki qisqa tushuntirish bilan) ber]"
        
        # Format history for Ollama
        messages = [{"role": "system", "content": "Sen insonlarga onboarding jaryonida yordam beruvchi xushmuomala, ochiqko'ngil botsan. Javoblaring juda qisqa bo'lsin."}]
        for msg in req.chatHistory:
            if msg.role != "system":
                messages.append({"role": msg.role, "content": msg.content})
        
        # Send new prompt
        messages.append({"role": "user", "content": prompt})
        
        print(f"CHAT_ASK: Calling Ollama with model {OLLAMA_MODEL}")
        response = ollama.chat(model=OLLAMA_MODEL, messages=messages)
        content = response.get("message", {}).get("content", f"Savol: {req.question}")
        print(f"CHAT_ASK: Success! Response length: {len(content)}")
        return {"response": content}
    except Exception as e:
        print(f"CHAT_ASK ERROR: {str(e)}")
        return {"response": f"Savol: {req.question}"}


@app.post("/api/chat/evaluate")
def chat_evaluate(req: EvaluateRequest):
    try:
        evalPrompt = f"Savol: '{req.question}'\\nFoydalanuvchining xom javobi: '{req.userAnswer}'\\n\\n"
        if req.fieldType == "date":
            evalPrompt += "- DIQQAT! Turi SANA (date) bolgani uchun albatta yil (sana) ham korsatilishi shart! Agar foydalanuvchi faqat kun va oyni yozgan bo'lsa (masalan: '5 avgust'), buni albatta INVALID deb bahola!\\n\\n"

        if req.options:
            if isinstance(req.options[0], dict):
                optKeys = [str(o.get("id", o.get("text"))) for o in req.options]
                evalPrompt += f"Mumkin bo'lgan variantlar: {', '.join(optKeys)}.\\n"
            else:
                evalPrompt += f"Mumkin bo'lgan variantlar: {', '.join(req.options)}.\\n"

        evalPrompt += """Vazifang:
1) Agar foydalanuvchi savolga yetarlicha mos javob bergan bo'lsa, "VALID: <qisqa qilib aniq javobni yozing>" deb qaytar. (Agar variantlar bo'lsa, faqatgina eng mosiga tegishli matn/id ni qaytar).
2) Agar foydalanuvchi "bilmayman", "istamayman", "kerak emas", "puling bormi" kabi rad etuvchi yoki savolga mutlaqo aloqasiz xatosiz narsalarni yozgan bo'lsa, "INVALID" deb qaytargin.
Faqat shu ikki xil formatdan birida javob ber, hech qanday qo'shimcha izoh yozma!"""
        
        messages = [{"role": "user", "content": evalPrompt}]
        res = ollama.chat(model=OLLAMA_MODEL, messages=messages)
        
        return {"response": res.get("message", {}).get("content", f"VALID: {req.userAnswer}")}
    except Exception as e:
        print(e)
        return {"response": f"VALID: {req.userAnswer}"}

@app.post("/api/profile/generate")
def profile_generate(req: ProfileGenRequest, db: sqlite3.Connection = Depends(get_db)):
    try:
        prompt = f"""Iltimos, foydalanuvchining quyidagi ma'lumotlari asosida uning batafsil psixologik profilini hamda unga mos keladigan ta'lim fanlarini bering.
Foydalanuvchi haqida:
- Hamma ma'lumoti: {json.dumps(req.onboardingData)}
- IQ testi natijasi: {req.iqScore}/47

Javobingizni quyidagi JSON formatida qat'iy saqlab qaytaring, matnsiz:
{{
  "summary": "Foydalanuvchining umumiy xarakteristikasi (2-3 ta gap)",
  "strengths": ["Kuchli tomon1", "Kuchli tomon2"],
  "recommendedSubjects": [
    {{
      "name": "Dars nomi (masalan, Kvant fizikasi)",
      "reason": "Nega yozilganligi (foydalanuvchi qiziqishi/qobiliyatiga ko'ra)"
    }}
  ]
}}"""
        messages = [{"role": "user", "content": prompt}]
        res = ollama.chat(model=OLLAMA_MODEL, messages=messages)
        
        text = res.get("message", {}).get("content", "")
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        profileData = json.loads(text.strip())
        
        # Save to DB immediately
        c = db.cursor()
        c.execute("UPDATE users SET psychological_profile=? WHERE email=?", (json.dumps(profileData), req.email))
        db.commit()
        
        return {"profile": profileData}
    except Exception as e:
        print(e)
        return {"profile": {
            "summary": "Sizning tahlilingiz hozircha tayyor emas, lekin keyinroq sinab ko'rsangiz bo'ladi.",
            "strengths": ["Mantiq"],
            "recommendedSubjects": [ {"name": "Matematika", "reason": "Tavsiya."} ]
        }}
