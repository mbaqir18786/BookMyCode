async function sendOtp({ phone, code, purpose }) {
  if (process.env.OTP_SENDER === 'twilio') {
    throw new Error('Twilio OTP sender is not configured in this branch.');
  }

  if (process.env.OTP_SENDER === 'development' && process.env.NODE_ENV !== 'production') {
    console.log(`[DEV OTP] Phone: ${phone} | OTP: ${code}`);
  }

  return { provider: 'development-fallback', accepted: true };
}

module.exports = { sendOtp };