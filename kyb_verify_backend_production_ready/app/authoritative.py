
import httpx
from .config import (
    GST_VERIFY_URL,GST_VERIFY_TOKEN,MCA_VERIFY_URL,MCA_VERIFY_TOKEN,
    BANK_VERIFY_URL,BANK_VERIFY_TOKEN,AUTH_VERIFY_URL,AUTH_VERIFY_TOKEN
)

async def call(url, token, payload):
    if not url:
        return {"configured":False,"verified":False,"reason":"Authoritative verification endpoint is not configured."}
    headers={"Content-Type":"application/json"}
    if token: headers["Authorization"]=f"Bearer {token}"
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r=await client.post(url,json=payload,headers=headers)
            if r.status_code>=400:
                return {"configured":True,"verified":False,"reason":f"Provider returned HTTP {r.status_code}."}
            data=r.json()
            # Provider contract: return {"verified": true/false, ...}
            verified=bool(data.get("verified") is True)
            return {"configured":True,"verified":verified,"provider_response":data,
                    "reason":"Authoritative provider confirmed the record." if verified
                            else "Authoritative provider did not confirm the record."}
    except Exception as e:
        return {"configured":True,"verified":False,"reason":f"Provider request failed: {e}"}

async def verify_authoritative(doc_type, data):
    if doc_type=="gst_certificate" and data.get("gstin"):
        return await call(GST_VERIFY_URL,GST_VERIFY_TOKEN,{"gstin":data["gstin"]})
    if doc_type=="mca_roc" and (data.get("cin_or_llpin_candidate")):
        return await call(MCA_VERIFY_URL,MCA_VERIFY_TOKEN,{"cin_or_llpin":data["cin_or_llpin_candidate"]})
    if doc_type in {"bank_statement","cancelled_cheque"}:
        return await call(BANK_VERIFY_URL,BANK_VERIFY_TOKEN,data)
    return await call(AUTH_VERIFY_URL,AUTH_VERIFY_TOKEN,{"document_type":doc_type,"data":data})
