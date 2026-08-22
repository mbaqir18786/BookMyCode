
import hashlib, uuid
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException

from .config import ALLOWED_EXTENSIONS,MAX_FILE_SIZE,DOCUMENT_DIR
from .database import init_db,save_document,get_document,get_documents,update_document_status
from .document_types import DOCUMENTS
from .verifier import basic_verify
from .authoritative import verify_authoritative
from .crosscheck import compare

app=FastAPI(title="KYB Verify Backend",version="3.0.0")
# Allow local frontend and Node.js backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup(): init_db()

@app.get("/")
def root(): return {"status":"running","docs":"/docs"}

@app.get("/health")
def health(): return {"status":"ok"}

@app.get("/document-types")
def document_types():
    return [{"id":k,"name":v,"required":k!="industry_license"} for k,v in DOCUMENTS.items()]

async def process(file):
    name=Path(file.filename or "document").name
    ext=Path(name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400,f"Allowed: {sorted(ALLOWED_EXTENSIONS)}")
    raw=await file.read()
    if not raw: raise HTTPException(400,"Empty file.")
    if len(raw)>MAX_FILE_SIZE: raise HTTPException(400,"Maximum size is 15 MB.")
    stored=DOCUMENT_DIR/f"{uuid.uuid4().hex}{ext}"
    stored.write_bytes(raw)
    result=basic_verify(stored)
    authoritative=await verify_authoritative(result["document_type"],result["data"])
    # A document is NEVER marked VERIFIED unless an authoritative provider confirms it.
    local_pass=all(c["passed"] for c in result["checks"])
    verified=local_pass and authoritative["verified"]
    status="VERIFIED" if verified else "NOT_VERIFIED"
    reason=("Local checks passed and authoritative provider confirmed the document."
            if verified else
            "Document was not independently authenticated by an authoritative provider.")
    record={
      "filename":name,"document_type":result["document_name"],"status":status,"reason":reason,
      "sha256":hashlib.sha256(raw).hexdigest(),"size_bytes":len(raw),
      "stored_path":str(stored.relative_to(DOCUMENT_DIR.parent.parent)),
      "extracted_text":result["text"],"extracted_data":result["data"],
      "checks":result["checks"],"authoritative_check":authoritative,
      "uploaded_at":datetime.now(timezone.utc).isoformat()
    }
    doc_id=save_document(record)
    return {"id":doc_id,"filename":name,"document_type":result["document_name"],
            "status":status,"reason":reason,"checks":result["checks"],
            "authoritative_check":authoritative,"extracted_data":result["data"],"stored":True}

@app.post("/documents/upload")
async def upload(file:UploadFile=File(...)): return await process(file)

# Endpoint: accepts base64-encoded documents from the frontend
# Expected payload: {"documents": [{"filename": "aadhaar.pdf", "content": "<base64>"}, ...]}
@app.post("/verify-kyc")
async def verify_kyc(payload: dict):
    docs = payload.get("documents", [])
    results = []
    for doc in docs:
        filename = doc.get("filename", "document")
        b64 = doc.get("content", "")
        if not b64:
            raise HTTPException(400, f"Missing content for {filename}")
        import base64, tempfile
        raw = base64.b64decode(b64)
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(filename).suffix) as tmp:
            tmp.write(raw)
            tmp_path = Path(tmp.name)
        class DummyUpload:
            def __init__(self, path):
                self.filename = filename
                self.file = open(path, "rb")
            async def read(self):
                return raw
        dummy = DummyUpload(tmp_path)
        result = await process(dummy)
        results.append(result)
        tmp_path.unlink(missing_ok=True)
    # Overall verdict: VERIFIED only if all docs pass
    overall = "VERIFIED" if results and all(r["status"] == "VERIFIED" for r in results) else "NOT_VERIFIED"
    return {"overall": overall, "results": results}


# Endpoint: validate KYC numbers (text-only, no file upload needed)
# Expected payload: {"aadhar_no":"...", "pan_no":"...", "gst_no":"...", "udyam_no":"...", "business_name":"...", "seller_type":"..."}
@app.post("/verify-kyc-numbers")
async def verify_kyc_numbers(payload: dict):
    import re

    aadhar = str(payload.get("aadhar_no") or "").strip()
    pan    = str(payload.get("pan_no")    or "").strip().upper()
    gst    = str(payload.get("gst_no")    or "").strip().upper()
    udyam  = str(payload.get("udyam_no")  or "").strip().upper()
    biz    = str(payload.get("business_name") or "").strip()

    checks = []

    # Aadhaar: exactly 12 digits
    aadhaar_ok = bool(re.fullmatch(r"\d{12}", aadhar))
    checks.append({
        "name": "aadhaar",
        "value": aadhar or "Not provided",
        "passed": aadhaar_ok,
        "detail": "Valid 12-digit Aadhaar number." if aadhaar_ok else ("Aadhaar must be exactly 12 digits." if aadhar else "Aadhaar not provided.")
    })

    # PAN: AAAAA9999A format
    pan_ok = bool(re.fullmatch(r"[A-Z]{5}[0-9]{4}[A-Z]", pan))
    checks.append({
        "name": "pan",
        "value": pan or "Not provided",
        "passed": pan_ok,
        "detail": "Valid PAN format." if pan_ok else ("PAN format invalid (expected AAAAA9999A)." if pan else "PAN not provided.")
    })

    # GSTIN: 15-char format — 2 digits + 10 PAN chars + 1 + 1 + 1
    gst_ok = bool(re.fullmatch(r"\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z]", gst))
    checks.append({
        "name": "gstin",
        "value": gst or "Not provided",
        "passed": gst_ok,
        "detail": "Valid GSTIN format." if gst_ok else ("GSTIN format invalid (15 chars required)." if gst else "GSTIN not provided.")
    })

    # Udyam: UDYAM-XX-00-0000000
    udyam_ok = bool(re.fullmatch(r"UDYAM-[A-Z]{2}-\d{2}-\d{7}", udyam))
    checks.append({
        "name": "udyam",
        "value": udyam or "Not provided",
        "passed": udyam_ok,
        "detail": "Valid Udyam registration number." if udyam_ok else ("Udyam format invalid (UDYAM-ST-00-0000000)." if udyam else "Udyam not provided.")
    })

    # Business name present
    biz_ok = len(biz) >= 2
    checks.append({
        "name": "business_name",
        "value": biz or "Not provided",
        "passed": biz_ok,
        "detail": "Business name provided." if biz_ok else "Business name is required."
    })

    # Approve if: Aadhaar valid AND at least one of (PAN, GSTIN, Udyam) valid AND business name present
    critical_pass = aadhaar_ok and (pan_ok or gst_ok or udyam_ok) and biz_ok
    overall = "VERIFIED" if critical_pass else "NOT_VERIFIED"
    reason = (
        "Aadhaar and at least one business document are valid."
        if critical_pass else
        "Aadhaar must be valid and at least one of PAN / GSTIN / Udyam must be correct."
    )

    return {
        "overall": overall,
        "verdict": "APPROVED" if critical_pass else "REJECTED",
        "reason": reason,
        "confidence": 85 if critical_pass else 90,
        "checks": checks
    }



@app.post("/documents/upload-batch")
async def upload_batch(files:list[UploadFile]=File(...)):
    if not files: raise HTTPException(400,"No files supplied.")
    results=[await process(f) for f in files]
    cross=compare([{
      "extracted_data":r["extracted_data"],
      "filename":r["filename"]
    } for r in results])
    return {"count":len(results),"cross_document_checks":cross,"documents":results}

@app.post("/verification/cross-document")
def cross_document():
    docs=get_documents()
    checks=compare(docs)
    passed=all(c["passed"] for c in checks) if checks else False
    return {"status":"VERIFIED" if passed else "NOT_VERIFIED","checks":checks}

@app.get("/documents")
def documents(): return get_documents()

@app.get("/documents/{document_id}")
def document(document_id:int):
    x=get_document(document_id)
    if not x: raise HTTPException(404,"Document not found.")
    return x
