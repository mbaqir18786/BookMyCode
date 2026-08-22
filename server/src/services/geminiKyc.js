// server/src/services/geminiKyc.js
// Uses Google Gemini to validate KYC document numbers and return a structured verdict.

const https = require('https');

const MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-pro-latest'
];

function callGemini(prompt) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return reject(new Error('GEMINI_API_KEY not set'));

    const bodyObj = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 512, temperature: 0.1 }
    };
    const body = JSON.stringify(bodyObj);

    let attempt = 0;
    function tryModel() {
      if (attempt >= MODELS.length) return reject(new Error('All Gemini models exhausted'));
      const model = MODELS[attempt++];
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) { console.log(`[GeminiKYC] ${model} failed:`, parsed.error.message); return tryModel(); }
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) return tryModel();
            resolve(text);
          } catch (e) { tryModel(); }
        });
      });
      req.on('error', () => tryModel());
      req.write(body);
      req.end();
    }
    tryModel();
  });
}

/**
 * Validates KYC data using Gemini AI.
 * Returns { verdict: 'APPROVED'|'REJECTED', reason: string, confidence: number }
 */
async function verifyKycWithAI({ business_name, seller_type, aadhar_no, pan_no, gst_no, udyam_no, address }) {
  const prompt = `You are a KYC verification AI for an Indian agricultural platform. 
Analyze the following business registration data and validate it.

Business Name: ${business_name || 'N/A'}
Seller Type: ${seller_type || 'N/A'}
Address: ${address || 'N/A'}
Aadhaar Number: ${aadhar_no || 'Not provided'}
PAN Number: ${pan_no || 'Not provided'}
GSTIN: ${gst_no || 'Not provided'}
Udyam Registration: ${udyam_no || 'Not provided'}

Validation Rules:
- Aadhaar: Must be 12 digits
- PAN: Must be 10 characters, format AAAAA9999A (5 letters, 4 digits, 1 letter)
- GSTIN: Must be 15 characters, format: 2-digit state code + 10-digit PAN + 1 digit + 1 letter + 1 digit/letter
- Udyam: Must start with UDYAM- followed by state code and numbers

Return ONLY a JSON object (no markdown, no extra text) in this exact format:
{
  "verdict": "APPROVED" or "REJECTED",
  "confidence": <number 0-100>,
  "reason": "<one clear sentence explaining the decision>",
  "checks": {
    "aadhaar": "<VALID|INVALID|NOT_PROVIDED>",
    "pan": "<VALID|INVALID|NOT_PROVIDED>",
    "gstin": "<VALID|INVALID|NOT_PROVIDED>",
    "udyam": "<VALID|INVALID|NOT_PROVIDED>"
  }
}

Approve if at least Aadhaar AND one of (PAN, GSTIN, Udyam) are valid. Reject otherwise.`;

  try {
    const raw = await callGemini(prompt);
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);
    return {
      verdict: result.verdict === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      confidence: result.confidence || 0,
      reason: result.reason || 'AI analysis complete.',
      checks: result.checks || {}
    };
  } catch (e) {
    console.error('[GeminiKYC] Parse error:', e.message);
    // Fallback: basic format validation
    const aadhaarOk = /^\d{12}$/.test(aadhar_no || '');
    const panOk = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan_no || '');
    const gstOk = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(gst_no || '');
    const udyamOk = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(udyam_no || '');
    const approved = aadhaarOk && (panOk || gstOk || udyamOk);
    return {
      verdict: approved ? 'APPROVED' : 'REJECTED',
      confidence: 70,
      reason: approved
        ? 'Basic format validation passed for Aadhaar and at least one business document.'
        : 'One or more document numbers have invalid format.',
      checks: {
        aadhaar: aadhaarOk ? 'VALID' : (aadhar_no ? 'INVALID' : 'NOT_PROVIDED'),
        pan: panOk ? 'VALID' : (pan_no ? 'INVALID' : 'NOT_PROVIDED'),
        gstin: gstOk ? 'VALID' : (gst_no ? 'INVALID' : 'NOT_PROVIDED'),
        udyam: udyamOk ? 'VALID' : (udyam_no ? 'INVALID' : 'NOT_PROVIDED')
      }
    };
  }
}

module.exports = { verifyKycWithAI };
