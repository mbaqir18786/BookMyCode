const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { get, query, withTransaction } = require('../db/postgres');
const { getJwtSecret, requireAuth } = require('../middleware/auth');
const { sendOtp } = require('../services/otpSender');

const router = express.Router();
const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 3;
const PUBLIC_SIGNUP_ROLES = new Set(['farmer', 'seller']);

function normalizePhone(phone) {
  return String(phone || '').trim().replace(/[\s()-]/g, '');
}

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function isValidPhone(phone) {
  return /^\+?[1-9]\d{7,14}$/.test(phone);
}

function createToken(payload, type, expiresIn) {
  return jwt.sign({ ...payload, type }, getJwtSecret(), { expiresIn });
}

function publicUser(user) {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    username: user.username,
    phone: user.phone,
    email: user.email,
    district: user.district,
    state: user.state,
    kyc_status: user.kyc_status
  };
}

function hashOtp(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function sameSecret(left, right) {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function createOtp(phone, purpose) {
  const code = crypto.randomInt(100000, 1000000).toString();

  await query(
    `UPDATE otp_challenges
     SET consumed_at = NOW()
     WHERE phone = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [phone, purpose]
  );

  await query(
    `INSERT INTO otp_challenges (id, phone, purpose, otp_hash, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + ($5 * INTERVAL '1 minute'))`,
    [crypto.randomUUID(), phone, purpose, hashOtp(code), OTP_EXPIRY_MINUTES]
  );

  await sendOtp({ phone, code, purpose });
  return code;
}

async function verifyOtp(phone, purpose, code) {
  const challenge = await get(
    `SELECT * FROM otp_challenges
     WHERE phone = $1 AND purpose = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone, purpose]
  );

  if (!challenge || new Date(challenge.expires_at) <= new Date()) {
    return { error: 'OTP is invalid or expired' };
  }

  if (challenge.attempt_count >= MAX_OTP_ATTEMPTS) {
    return { error: 'Maximum OTP attempts exceeded' };
  }

  await query('UPDATE otp_challenges SET attempt_count = attempt_count + 1 WHERE id = $1', [challenge.id]);

  if (!/^\d{6}$/.test(String(code)) || !sameSecret(challenge.otp_hash, hashOtp(code))) {
    return { error: 'OTP is invalid or expired' };
  }

  await query('UPDATE otp_challenges SET consumed_at = NOW() WHERE id = $1', [challenge.id]);
  return { verified: true };
}

function requireBodyFields(body, fields) {
  return fields.every((field) => String(body[field] || '').trim());
}

router.post('/request-otp', async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!isValidPhone(phone)) return res.status(400).json({ error: 'A valid phone number is required' });

    const existingUser = await get('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existingUser) return res.status(409).json({ error: 'An account already exists for this phone number' });

    const code = await createOtp(phone, 'signup');
    // Always return OTP in response (demo mode — no SMS service configured)
    return res.json({ message: 'OTP sent successfully', phone, otp: code });
  } catch (error) {
    console.error('Signup OTP error:', error.message);
    return res.status(500).json({ error: 'Unable to send signup OTP' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const purpose = req.body.purpose || 'signup';
    if (!['signup', 'password_reset'].includes(purpose)) {
      return res.status(400).json({ error: 'Invalid OTP purpose' });
    }

    const result = await verifyOtp(phone, purpose, req.body.code || req.body.otp);
    if (result.error) return res.status(400).json({ error: result.error });

    const tokenType = purpose === 'signup' ? 'signup_verification' : 'password_reset';
    const verificationToken = createToken({ phone }, tokenType, '10m');
    return res.json({ verification_token: verificationToken, reset_token: verificationToken, phone });
  } catch (error) {
    console.error('Signup OTP verification error:', error.message);
    return res.status(500).json({ error: 'Unable to verify signup OTP' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const {
      verification_token: verificationToken,
      name,
      username,
      password,
      confirm_password: confirmPassword,
      role
    } = req.body;

    if (!verificationToken || !requireBodyFields(req.body, ['name', 'username', 'password', 'confirm_password', 'role'])) {
      return res.status(400).json({ error: 'All signup fields are required' });
    }

    if (!PUBLIC_SIGNUP_ROLES.has(role)) {
      return res.status(403).json({ error: 'This role cannot be created through public signup' });
    }

    if (password !== confirmPassword || password.length < 8) {
      return res.status(400).json({ error: 'Passwords must match and contain at least 8 characters' });
    }

    const verification = jwt.verify(verificationToken, getJwtSecret());
    if (verification.type !== 'signup_verification' || !verification.phone) {
      return res.status(400).json({ error: 'Invalid signup verification token' });
    }

    const normalizedUsername = normalizeUsername(username);
    const normalizedPhone = normalizePhone(verification.phone);
    const duplicate = await get(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR phone = $2',
      [normalizedUsername, normalizedPhone]
    );
    if (duplicate) return res.status(409).json({ error: 'Username or phone number is already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO users (id, role, name, username, phone, password_hash, phone_verified_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [crypto.randomUUID(), role, name.trim(), normalizedUsername, normalizedPhone, passwordHash]
      );
      return result.rows[0];
    });

    return res.status(201).json({ token: createToken({ sub: user.id, role: user.role }, 'access', '7d'), user: publicUser(user) });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Invalid or expired signup verification token' });
    }
    console.error('Signup error:', error.message);
    return res.status(500).json({ error: 'Unable to create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const identifier = String(req.body.identifier || '').trim();
    const password = String(req.body.password || '');
    if (!identifier || !password) return res.status(400).json({ error: 'Username, email, or phone and password are required' });

    const normalizedUser = normalizeUsername(identifier);
    const cleanDigits = identifier.replace(/\D/g, '');

    const user = await get(
      `SELECT * FROM users 
       WHERE LOWER(username) = LOWER($1) 
          OR LOWER(email) = LOWER($1)
          OR phone = $1
          OR ($2 <> '' AND (phone = $2 OR phone = '+91' || $2 OR phone = '+' || $2 OR REPLACE(REPLACE(phone, '+91', ''), '+', '') = $2))
       LIMIT 1`,
      [normalizedUser, cleanDigits]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = (user.password_hash && await bcrypt.compare(password, user.password_hash).catch(() => false))
      || password === user.password_hash;

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    return res.json({ token: createToken({ sub: user.id, role: user.role }, 'access', '7d'), user: publicUser(user) });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ error: 'Unable to log in' });
  }
});

router.post('/request-password-reset', async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!isValidPhone(phone)) return res.status(400).json({ error: 'A valid phone number is required' });

    const user = await get('SELECT id FROM users WHERE phone = $1', [phone]);
    if (!user) return res.status(404).json({ error: 'No account found for this phone number' });

    const code = await createOtp(phone, 'password_reset');
    // Always return OTP in response (demo mode — no SMS service configured)
    return res.json({ message: 'Password reset OTP sent successfully', phone, otp: code });
  } catch (error) {
    console.error('Password reset OTP error:', error.message);
    return res.status(500).json({ error: 'Unable to send password reset OTP' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { reset_token: resetToken, new_password: newPassword, confirm_password: confirmPassword } = req.body;
    if (!resetToken || !newPassword || !confirmPassword) return res.status(400).json({ error: 'All reset fields are required' });
    if (newPassword !== confirmPassword || newPassword.length < 8) return res.status(400).json({ error: 'Passwords must match and contain at least 8 characters' });

    const verification = jwt.verify(resetToken, getJwtSecret());
    if (verification.type !== 'password_reset' || !verification.phone) {
      return res.status(400).json({ error: 'Invalid password reset token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const result = await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE phone = $2', [passwordHash, verification.phone]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Account not found' });

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }
    console.error('Password reset error:', error.message);
    return res.status(500).json({ error: 'Unable to reset password' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = $1', [req.auth.sub]);
    if (!user) return res.status(401).json({ error: 'Authenticated user no longer exists' });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Auth user lookup error:', error.message);
    return res.status(500).json({ error: 'Unable to load authenticated user' });
  }
});

module.exports = router;