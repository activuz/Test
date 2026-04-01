"""
Khan Academy - Kurslarni Yuklovchi Skript (loginsiz)
Selenium + Python yordamida kurslar ma'lumotlarini JSON formatda saqlaydi.

O'rnatish:
    pip install selenium webdriver-manager

Ishlatish:
    python khanacademy_scraper.py
"""

import json
import time
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

# ──────────────────────────────────────────────
# SOZLAMALAR
# ──────────────────────────────────────────────
COURSE_URLS = [
    "https://www.khanacademy.org/math/algebra",
    "https://www.khanacademy.org/science/physics",
    "https://www.khanacademy.org/computing/computer-science",
    # ... qo'shimcha URL'larni shu yerga qo'shing
]

OUTPUT_FILE = "khanacademy_courses.json"
HEADLESS    = False   # True = brauzer oynasiz ishlaydi
# ──────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# BRAUZER
# ──────────────────────────────────────────────

def build_driver(headless: bool = False) -> webdriver.Chrome:
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1400,900")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=opts)
    driver.execute_cdp_cmd(
        "Page.addScriptToEvaluateOnNewDocument",
        {"source": "Object.defineProperty(navigator,'webdriver',{get:()=>undefined})"},
    )
    return driver


# ──────────────────────────────────────────────
# KURS MA'LUMOTLARINI OLISH
# ──────────────────────────────────────────────

def safe_text(driver, selector: str, default: str = "") -> str:
    try:
        el = driver.find_element(By.CSS_SELECTOR, selector)
        return el.text.strip()
    except NoSuchElementException:
        return default


def scrape_course(driver: webdriver.Chrome, url: str) -> Optional[dict]:
    log.info(f"  Yuklanmoqda: {url}")
    try:
        driver.get(url)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        time.sleep(2)
    except TimeoutException:
        log.warning(f"  ⚠️  Sahifa yuklanmadi: {url}")
        return None

    # Sarlavha
    title = safe_text(driver, "h1") or safe_text(driver, "[data-test-id='topic-page-title']")

    # Tavsif
    description = ""
    try:
        meta = driver.find_element(By.CSS_SELECTOR, "meta[name='description']")
        description = meta.get_attribute("content") or ""
    except NoSuchElementException:
        description = safe_text(driver, "[data-test-id='topic-page-description'], .description")

    # Subject (URL dan)
    parts = url.rstrip("/").split("/")
    subject = parts[4] if len(parts) > 4 else "unknown"

    # Unitlar
    units = []
    unit_selectors = [
        "[data-test-id='topic-item']",
        ".topic-list-item",
        "[class*='unitCard']",
        "li[data-type='unit']",
    ]

    unit_elements = []
    for sel in unit_selectors:
        unit_elements = driver.find_elements(By.CSS_SELECTOR, sel)
        if unit_elements:
            break

    if not unit_elements:
        unit_elements = driver.find_elements(
            By.CSS_SELECTOR, "h2, h3, [class*='unit'], [class*='chapter']"
        )

    total_lessons = 0
    for el in unit_elements:
        try:
            unit_title = el.text.strip().split("\n")[0]
            if not unit_title or len(unit_title) < 2:
                continue

            lessons = []
            try:
                lesson_els = el.find_elements(
                    By.CSS_SELECTOR,
                    "a[href*='/v/'], a[href*='/e/'], a[href*='/a/'], "
                    "[data-test-id='lesson'], .lesson-item"
                )
                lessons = [l.text.strip() for l in lesson_els if l.text.strip()]
            except Exception:
                pass

            total_lessons += len(lessons)
            units.append({
                "title": unit_title,
                "lessons": lessons,
                "lesson_count": len(lessons),
            })
        except Exception:
            continue

    log.info(f"  ✅ '{title}' — {len(units)} ta unit, {total_lessons} ta dars")

    return {
        "url": url,
        "title": title,
        "description": description,
        "subject": subject,
        "units": units,
        "total_units": len(units),
        "total_lessons": total_lessons,
        "scraped_at": datetime.now().isoformat(),
    }


# ──────────────────────────────────────────────
# ASOSIY FUNKSIYA 
# ──────────────────────────────────────────────

def main():
    driver = build_driver(headless=HEADLESS)
    results = []

    try:
        log.info(f"📚 {len(COURSE_URLS)} ta kurs yuklanmoqda...\n")
        for i, url in enumerate(COURSE_URLS, 1):
            log.info(f"[{i}/{len(COURSE_URLS)}] {url}")
            data = scrape_course(driver, url)
            if data:
                results.append(data)
            time.sleep(1.5)
    finally:
        driver.quit()

    output_path = Path(OUTPUT_FILE)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({"total_courses": len(results), "courses": results}, f, ensure_ascii=False, indent=2)

    log.info(f"\n✅ Yakunlandi! {len(results)} ta kurs '{output_path}' fayliga saqlandi.")


if __name__ == "__main__":
    main()