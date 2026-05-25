'use strict';

const express = require('express');
const authMiddleware = require('../middleware/auth');
const { notifications } = require('../store');

const router = express.Router();
router.use(authMiddleware);

// GET /api/v1/notifications
router.get('/', (req, res) => {
  const userId = req.user.id || 'demo-user';
  const userNotifs = Array.from(notifications.values())
    .filter(n => n.user_id === userId || n.user_id === 'demo-user')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const unread_count = userNotifs.filter(n => !n.read).length;

  return res.json({
    success: true,
    data: {
      notifications: userNotifs,
      unread_count
    }
  });
});

// POST /api/v1/notifications/:id/read
router.post('/:id/read', (req, res) => {
  const notif = notifications.get(req.params.id);
  if (!notif) {
    return res.status(404).json({ success: false, error: { message: 'Notification not found' } });
  }

  notif.read = true;
  notifications.set(req.params.id, notif);
  return res.json({ success: true, data: notif });
});

// POST /api/v1/notifications/read-all
router.post('/read-all', (req, res) => {
  const userId = req.user.id || 'demo-user';

  notifications.forEach((notif, id) => {
    if (notif.user_id === userId || notif.user_id === 'demo-user') {
      notif.read = true;
      notifications.set(id, notif);
    }
  });

  return res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = router;
