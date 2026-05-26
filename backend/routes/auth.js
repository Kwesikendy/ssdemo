'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'smartscript-demo-secret';

// Hardcoded demo credentials — override via Render env vars if needed
const DEMO_EMAIL = (process.env.DEMO_EMAIL || 'admin@smartscript.demo').toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'SmartScript2025!';

const DEMO_USER = {
  id: 'demo-user',
  email: DEMO_EMAIL,
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
  credits: 1000,
  plan: 'pro',
  tenant_id: 'demo-tenant'
};

function makeTokens() {
  const token = jwt.sign(DEMO_USER, JWT_SECRET, { expiresIn: '24h' });
  const refresh_token = jwt.sign({ id: DEMO_USER.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
  return { token, refresh_token };
}

function checkCredentials(email, password) {
  return (
    email && password &&
    email.toLowerCase().trim() === DEMO_EMAIL &&
    password === DEMO_PASSWORD
  );
}

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: { message: 'Email and password are required' } });
  }
  if (!checkCredentials(email, password)) {
    return res.status(401).json({ success: false, error: { message: 'Invalid email or password' } });
  }
  const { token, refresh_token } = makeTokens();
  return res.json({ success: true, data: { token, refresh_token, user: DEMO_USER } });
});

// POST /api/v1/auth/register — locked, only demo credentials accepted
router.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!checkCredentials(email, password)) {
    return res.status(403).json({
      success: false,
      error: { message: 'Registration is not open. Please sign in with the provided credentials.' }
    });
  }
  const { token, refresh_token } = makeTokens();
  return res.status(201).json({ success: true, data: { token, refresh_token, user: DEMO_USER } });
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, (req, res) => {
  return res.json({ success: true, data: DEMO_USER });
});

// POST /api/v1/auth/refresh
router.post('/refresh', (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ success: false, error: { message: 'refresh_token is required' } });
  }
  try {
    jwt.verify(refresh_token, JWT_SECRET);
    const { token, refresh_token: new_refresh } = makeTokens();
    return res.json({ success: true, data: { token, refresh_token: new_refresh, user: DEMO_USER } });
  } catch (err) {
    return res.status(401).json({ success: false, error: { message: 'Invalid or expired refresh token' } });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
