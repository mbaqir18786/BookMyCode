
import re
from pathlib import Path

def extract_text(path):
    ext=path.suffix.lower()
    if ext==".pdf":
        import fitz
        with fitz.open(path) as pdf:
            return "\n".join(p.get_text("text") for p in pdf).strip(), "pdf_text"
    if ext==".docx":
        from docx import Document
        d=Document(path)
        return "\n".join(p.text for p in d.paragraphs).strip(), "docx_text"
    try:
        import pytesseract
        from PIL import Image
        return pytesseract.image_to_string(Image.open(path)).strip(), "ocr"
    except Exception:
        return "", "ocr_unavailable"

def normalize(s):
    return re.sub(r"\s+"," ",s.upper()).strip()

def extract_fields(text):
    t=normalize(text)
    out={}
    m=re.search(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b",t)
    if m: out["pan"]=m.group()
    m=re.search(r"\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9]Z[0-9A-Z]\b",t)
    if m: out["gstin"]=m.group()
    m=re.search(r"\b[UL]\d{6,8}\b",t)
    if m: out["cin_or_llpin_candidate"]=m.group()
    return out
