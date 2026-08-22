async function sendOtp({ phone, code, purpose }) {
  // Development/demo mode: log to console
  console.log(`[OTP] Phone: ${phone} | Code: ${code} | Purpose: ${purpose}`);
  return { provider: 'development-bypass', accepted: true };
}

module.exports = { sendOtp };