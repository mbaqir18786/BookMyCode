
# KYB Verify Backend — production-ready verification architecture

## What is implemented

- 15-document KYB catalogue
- PDF, JPG/JPEG, PNG, WEBP and DOCX intake
- Original file storage
- SQLite persistence
- PDF/DOCX text extraction
- Image OCR through Tesseract
- Document-type detection
- PAN/GSTIN extraction
- Basic document-quality checks
- PDF metadata tamper signal
- Cross-document PAN/GSTIN/name consistency checks
- Authoritative-provider adapter layer
- Final `VERIFIED` is impossible unless the authoritative provider returns `verified: true`

## Critical setup for real authenticity verification

The GST/MCA/bank systems require authorized access. This backend therefore does NOT pretend that local OCR proves authenticity.

Copy `.env.example` to `.env` and configure the provider endpoints/credentials issued to your organization.

Provider response contract:

```json
{"verified": true, "source":"provider", "reference_id":"..."}
```

or:

```json
{"verified": false, "source":"provider", "reason":"..."}
```

### GST

The GST portal itself provides taxpayer search by GSTIN and can show legal name, trade name, registration date, constitution, principal place of business and status. The GST ecosystem also provides API routes through authorized providers/GSPs. Your organization must obtain API access/credentials before the backend can perform live authoritative checks.

### MCA/ROC

Configure an authorized MCA/company-data provider endpoint. Do not scrape MCA pages or bypass CAPTCHA/login controls.

### Bank

Configure your bank/account-verification provider endpoint. Bank verification requires authorized access and should not be simulated.

## OCR on Windows

Install Tesseract OCR separately and put `tesseract.exe` on PATH. If OCR cannot run, image documents will not be marked VERIFIED.

## Important

Tamper heuristics and OCR are signals, not proof of authenticity. The authoritative provider is the final gate for VERIFIED.
