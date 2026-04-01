import os
import sqlite3
import json
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hamrohai_backend.settings')
django.setup()

from api.models import CustomUser

DB_FILE = "hamrohai.db"

def migrate():
    if not os.path.exists(DB_FILE):
        print(f"Baza topilmadi: {DB_FILE}")
        return

    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    try:
        c.execute("SELECT * FROM users")
        rows = c.fetchall()
        print(f"Jami {len(rows)} foydalanuvchi topildi. Migratsiya boshlanmoqda...")

        for row in rows:
            email = row['email']
            
            # Check if already exists in Django format
            if CustomUser.objects.filter(email=email).exists():
                print(f"O'tkazib yuborildi: {email} (allaqachon mavjud)")
                continue

            # Create User object
            user = CustomUser(
                email=email,
                password=row['password'], # Keeping the same hash
                provider=row['provider'] or 'email',
                onboarding_completed=bool(row['onboarding_completed']),
                onboarding_progress=row['onboarding_progress'],
                iq_score=row['iq_score'] or 0,
                is_active=True,
                is_staff=False,
                is_superuser=False,
                date_joined=datetime.now()
            )

            # JSON fields
            if row['onboarding_data']:
                user.onboarding_data = json.loads(row['onboarding_data'])
            if row['chat_history']:
                user.chat_history = json.loads(row['chat_history'])
            if row['psychological_profile']:
                user.psychological_profile = json.loads(row['psychological_profile'])

            user.save()
            print(f"Muvaffaqiyatli: {email}")

        print("Migratsiya tugadi! Jamai foydalanuvchilar soni yangi bazada hammasi to'g'ri ko'rinadi.")
    except sqlite3.OperationalError as e:
        print(f"Xatolik (balki jadval yo'qdir): {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
