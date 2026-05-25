'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smartscript-demo-secret';

const DEMO_USER = {
  id: 'demo-user',
  email: 'admin@smartscript.demo',
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
  credits: 1000,
  plan: 'pro',
  tenant_id: 'demo-tenant'
};

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, error: { message: 'No authorization header provided' } });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, error: { message: 'Authorization header must be Bearer token' } });
  }

  const token = parts[1];

  // Allow mock token for backwards compatibility
  if (token === 'mock-jwt-token') {
    req.user = DEMO_USER;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: { message: 'Invalid or expired token' } });
  }
}

module.exports = authMiddleware;
module.exports.DEMO_USER = DEMO_USER;
