
import re

def compare(records):
    checks=[]
    pans={r["extracted_data"].get("pan") for r in records if r["extracted_data"].get("pan")}
    gstins={r["extracted_data"].get("gstin") for r in records if r["extracted_data"].get("gstin")}

    if len(pans)>1:
        checks.append({"name":"pan_consistency","passed":False,"detail":"Different PAN values were extracted."})
    elif len(pans)==1:
        checks.append({"name":"pan_consistency","passed":True,"detail":"PAN is consistent across extracted documents."})

    if len(gstins)>1:
        checks.append({"name":"gstin_consistency","passed":False,"detail":"Different GSTIN values were extracted."})
    elif len(gstins)==1:
        checks.append({"name":"gstin_consistency","passed":True,"detail":"GSTIN is consistent across extracted documents."})

    # Compare exact normalized organization names where a provider/document extractor supplies them.
    names=[r["extracted_data"].get("business_name") for r in records if r["extracted_data"].get("business_name")]
    if len(set(n.upper().strip() for n in names))>1:
        checks.append({"name":"business_name_consistency","passed":False,"detail":"Business names conflict."})
    elif names:
        checks.append({"name":"business_name_consistency","passed":True,"detail":"Business name is consistent."})

    return checks
