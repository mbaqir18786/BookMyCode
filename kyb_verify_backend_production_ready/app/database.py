
import json, sqlite3
from .config import DB_PATH

def conn():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c

def init_db():
    with conn() as db:
        db.execute("""
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          document_type TEXT NOT NULL,
          status TEXT NOT NULL,
          reason TEXT NOT NULL,
          sha256 TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          stored_path TEXT NOT NULL,
          extracted_text TEXT NOT NULL,
          extracted_data TEXT NOT NULL,
          checks TEXT NOT NULL,
          authoritative_check TEXT NOT NULL,
          uploaded_at TEXT NOT NULL
        )
        """)
        db.execute("""
        CREATE TABLE IF NOT EXISTS verification_runs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          status TEXT NOT NULL,
          reason TEXT NOT NULL,
          checks TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
        """)
        db.commit()

def save_document(x):
    with conn() as db:
        cur = db.execute("""
        INSERT INTO documents
        (filename, document_type, status, reason, sha256, size_bytes,
         stored_path, extracted_text, extracted_data, checks,
         authoritative_check, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
          x["filename"], x["document_type"], x["status"], x["reason"],
          x["sha256"], x["size_bytes"], x["stored_path"],
          x["extracted_text"], json.dumps(x["extracted_data"], ensure_ascii=False),
          json.dumps(x["checks"], ensure_ascii=False),
          json.dumps(x["authoritative_check"], ensure_ascii=False),
          x["uploaded_at"]
        ))
        db.commit()
        return cur.lastrowid

def update_document_status(doc_id, status, reason, checks, authoritative):
    with conn() as db:
        db.execute("""
        UPDATE documents
        SET status=?, reason=?, checks=?, authoritative_check=?
        WHERE id=?
        """, (
          status, reason, json.dumps(checks, ensure_ascii=False),
          json.dumps(authoritative, ensure_ascii=False), doc_id
        ))
        db.commit()

def get_document(doc_id):
    with conn() as db:
        row = db.execute("SELECT * FROM documents WHERE id=?", (doc_id,)).fetchone()
    if not row: return None
    x = dict(row)
    for k in ("extracted_data", "checks", "authoritative_check"):
        x[k] = json.loads(x[k])
    return x

def get_documents():
    with conn() as db:
        rows = db.execute("SELECT * FROM documents ORDER BY id DESC").fetchall()
    out=[]
    for row in rows:
        x=dict(row)
        for k in ("extracted_data","checks","authoritative_check"):
            x[k]=json.loads(x[k])
        out.append(x)
    return out

def save_run(status, reason, checks, created_at):
    with conn() as db:
        cur=db.execute(
          "INSERT INTO verification_runs(status,reason,checks,created_at) VALUES(?,?,?,?)",
          (status,reason,json.dumps(checks, ensure_ascii=False),created_at)
        )
        db.commit()
        return cur.lastrowid
