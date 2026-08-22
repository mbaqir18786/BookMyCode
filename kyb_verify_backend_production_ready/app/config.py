
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATA_DIR = BASE_DIR / "data"
DOCUMENT_DIR = BASE_DIR / "storage" / "documents"
DB_PATH = DATA_DIR / "kyb.sqlite3"

DATA_DIR.mkdir(parents=True, exist_ok=True)
DOCUMENT_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 15 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".docx"}

GST_VERIFY_URL = os.getenv("GST_VERIFY_URL", "").strip()
GST_VERIFY_TOKEN = os.getenv("GST_VERIFY_TOKEN", "").strip()
MCA_VERIFY_URL = os.getenv("MCA_VERIFY_URL", "").strip()
MCA_VERIFY_TOKEN = os.getenv("MCA_VERIFY_TOKEN", "").strip()
BANK_VERIFY_URL = os.getenv("BANK_VERIFY_URL", "").strip()
BANK_VERIFY_TOKEN = os.getenv("BANK_VERIFY_TOKEN", "").strip()
AUTH_VERIFY_URL = os.getenv("AUTH_VERIFY_URL", "").strip()
AUTH_VERIFY_TOKEN = os.getenv("AUTH_VERIFY_TOKEN", "").strip()
