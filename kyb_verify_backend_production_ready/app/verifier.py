
from .document_types import DOCUMENTS, TERMS
from .extraction import extract_text, extract_fields
from .tamper import analyze

def detect(filename,text):
    t=(filename+"\n"+text).upper()
    scores={k:sum(1 for term in v if term.upper() in t) for k,v in TERMS.items()}
    best=max(scores,key=scores.get)
    return best if scores[best]>0 else "unknown"

def basic_verify(path):
    text,method=extract_text(path)
    dtype=detect(path.name,text)
    checks=[
      {"name":"file_readable","passed":path.exists() and path.stat().st_size>0,"detail":"File exists and is non-empty."},
      {"name":"text_available","passed":len(text)>=20,"detail":f"Extraction method: {method}."},
      {"name":"document_type","passed":dtype!="unknown","detail":DOCUMENTS.get(dtype,"Unknown")}
    ]
    data=extract_fields(text)
    if dtype=="business_pan":
        checks.append({"name":"pan_format","passed":"pan" in data,"detail":"PAN format found."})
    if dtype=="gst_certificate":
        checks.append({"name":"gstin_format","passed":"gstin" in data,"detail":"GSTIN format found."})
    if dtype in {"bank_statement","cancelled_cheque"}:
        t=text.upper()
        checks.append({"name":"bank_information","passed":"BANK" in t and ("ACCOUNT" in t or "IFSC" in t),
                       "detail":"Bank/account information found."})
    checks.extend(analyze(path))
    return {"document_type":dtype,"document_name":DOCUMENTS.get(dtype,"Unknown"),
            "text":text,"method":method,"data":data,"checks":checks}
