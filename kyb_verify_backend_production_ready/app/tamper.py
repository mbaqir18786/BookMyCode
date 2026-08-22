
from pathlib import Path
import hashlib

def analyze(path):
    checks=[]
    raw=path.read_bytes()
    checks.append({"name":"file_hash","passed":bool(hashlib.sha256(raw).hexdigest()),"detail":"SHA-256 computed."})

    if path.suffix.lower()==".pdf":
        try:
            import fitz
            with fitz.open(path) as doc:
                pages=len(doc)
                meta=doc.metadata or {}
                checks.append({"name":"pdf_open","passed":True,"detail":f"{pages} page(s) opened successfully."})
                # Metadata anomalies are signals only, never proof of forgery.
                producer=(meta.get("producer") or "").lower()
                creator=(meta.get("creator") or "").lower()
                suspicious=("photoshop" in producer or "photoshop" in creator or
                            "canva" in producer or "canva" in creator)
                checks.append({
                    "name":"pdf_metadata_signal",
                    "passed":not suspicious,
                    "detail":"No common editing-software metadata signal detected." if not suspicious
                            else "Editing-software metadata signal detected."
                })
        except Exception as e:
            checks.append({"name":"pdf_open","passed":False,"detail":str(e)})
    return checks
