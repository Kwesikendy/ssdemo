'use strict';

const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// In-memory account preferences store
const accountPreferences = new Map();

// GET /api/v1/account
router.get('/', (req, res) => {
  const prefs = accountPreferences.get(req.user.id || 'demo-user') || {};
  return res.json({
    success: true,
    data: {
      ...req.user,
      preferences: prefs,
      organization: {
        id: 'demo-tenant',
        name: 'SmartScript Demo',
        plan: 'pro',
        credits_remaining: 1000,
        credits_used: 250
      }
    }
  });
});

// PUT /api/v1/account
router.put('/', (req, res) => {
  const { first_name, last_name, email } = req.body;
  const updated = {
    ...req.user,
    first_name: first_name || req.user.first_name,
    last_name: last_name || req.user.last_name,
    email: email || req.user.email,
    updated_at: new Date().toISOString()
  };

  return res.json({ success: true, data: updated });
});

// POST /api/v1/account/preferences
router.post('/preferences', (req, res) => {
  const userId = req.user.id || 'demo-user';
  const existing = accountPreferences.get(userId) || {};
  const updated = { ...existing, ...req.body, updated_at: new Date().toISOString() };
  accountPreferences.set(userId, updated);

  return res.json({ success: true, data: { preferences: updated } });
});

module.exports = router;
