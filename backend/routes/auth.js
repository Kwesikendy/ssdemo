'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'smartscript-demo-secret';

function makeUser(email) {
  const parts = email.split('@')[0].split('.');
  return {
    id: 'demo-user',
    email,
    first_name: parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Admin',
    last_name: parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'User',
    role: 'admin',
    credits: 1000,
    plan: 'pro',
    tenant_id: 'demo-tenant'
  };
}

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: { message: 'Email is required' } });
  }

  const user = makeUser(email);
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
  const refresh_token = jwt.sign({ id: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    success: true,
    data: { token, refresh_token, user }
  });
});

// POST /api/v1/auth/register
router.post('/register', (req, res) => {
  const { email, password, first_name, last_name, plan } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: { message: 'Email is required' } });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, error: { message: 'Password must be at least 6 characters' } });
  }

  // Build user from provided fields or derive from email
  const parts = email.split('@')[0].split('.');
  const user = {
    id: `user-${uuidv4()}`,
    email,
    first_name: first_name || (parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'User'),
    last_name: last_name || (parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : ''),
    role: 'admin',
    credits: 1000,
    plan: plan || 'pro',
    tenant_id: `tenant-${uuidv4()}`
  };

  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
  const refresh_token = jwt.sign({ id: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });

  return res.status(201).json({
    success: true,
    data: { token, refresh_token, user }
  });
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, (req, res) => {
  return res.json({ success: true, data: req.user });
});

// POST /api/v1/auth/refresh
router.post('/refresh', (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ success: false, error: { message: 'refresh_token is required' } });
  }

  try {
    const decoded = jwt.verify(refresh_token, JWT_SECRET);
    const user = makeUser(decoded.email || 'admin@smartscript.demo');
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    const new_refresh = jwt.sign({ id: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      data: { token, refresh_token: new_refresh, user }
    });
  } catch (err) {
    return res.status(401).json({ success: false, error: { message: 'Invalid or expired refresh token' } });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
