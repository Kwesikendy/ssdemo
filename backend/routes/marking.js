'use strict';

const express = require('express');
const authMiddleware = require('../middleware/auth');
const { groups, markingJobs } = require('../store');

const router = express.Router();
router.use(authMiddleware);

// =============================================
// MARKING GROUPS MANAGEMENT
// Mounted at /api/v1/marking-groups
// =============================================

// GET /api/v1/marking-groups/progress
router.get('/progress', (req, res) => {
  const { uploads, candidates } = require('../store');
  const allGroups = Array.from(groups.values());
  const result = allGroups.map(group => {
    const groupUploads = Array.from(uploads.values()).filter(u => u.group_id === group.id);
    const groupCandidates = Array.from(candidates.values()).filter(c => c.group_id === group.id);
    const markedCount = groupCandidates.filter(c => c.status === 'marked').length;
    const totalPages = groupUploads.reduce((acc, u) => acc + (u.page_count || 0), 0);
    return {
      group_id: group.id,
      group_name: group.name,
      status: group.status || 'idle',
      uploads: groupUploads.length,
      scripts_total: groupCandidates.length,
      scripts_marked: markedCount,
      pages_total: totalPages,
      pages_done: group.status === 'completed' ? totalPages : markedCount * 3
    };
  });
  return res.json({ success: true, groups: result });
});

// POST /api/v1/marking-groups/start
router.post('/start', (req, res) => {
  const { group_ids } = req.body;
  if (!group_ids || !Array.isArray(group_ids)) {
    return res.status(400).json({ success: false, error: { message: 'group_ids array is required' } });
  }
  group_ids.forEach(gid => {
    const g = groups.get(gid);
    if (g) { g.status = 'processing'; groups.set(gid, g); }
  });
  return res.json({ success: true, message: 'Groups marking started' });
});

// POST /api/v1/marking-groups/pause
router.post('/pause', (req, res) => {
  const { group_ids } = req.body;
  if (!group_ids || !Array.isArray(group_ids)) {
    return res.status(400).json({ success: false, error: { message: 'group_ids array is required' } });
  }
  group_ids.forEach(gid => {
    const g = groups.get(gid);
    if (g) { g.status = 'paused'; groups.set(gid, g); }
  });
  return res.json({ success: true, message: 'Groups marking paused' });
});

// POST /api/v1/marking-groups/resume
router.post('/resume', (req, res) => {
  const { group_ids } = req.body;
  if (!group_ids || !Array.isArray(group_ids)) {
    return res.status(400).json({ success: false, error: { message: 'group_ids array is required' } });
  }
  group_ids.forEach(gid => {
    const g = groups.get(gid);
    if (g) { g.status = 'processing'; groups.set(gid, g); }
  });
  return res.json({ success: true, message: 'Groups marking resumed' });
});

// =============================================
// JOB STATUS
// This router is also mounted at /api/v1/marking-jobs
// GET /api/v1/marking-jobs/:jobId/status
// =============================================
router.get('/:jobId/status', (req, res) => {
  const job = markingJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ success: false, error: { message: 'Job not found' } });
  }
  return res.json({ success: true, data: job });
});

module.exports = router;
