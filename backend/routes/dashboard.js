'use strict';

const express = require('express');
const authMiddleware = require('../middleware/auth');
const { groups, uploads, schemes, candidates } = require('../store');

const router = express.Router();
router.use(authMiddleware);

// GET /api/v1/dashboard/stats
router.get('/stats', (req, res) => {
  const allUploads = Array.from(uploads.values());
  const allCandidates = Array.from(candidates.values());
  const allSchemes = Array.from(schemes.values());

  // Recent uploads with group name
  const recentUploads = allUploads
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map(u => {
      const group = groups.get(u.group_id);
      const groupCandidates = allCandidates.filter(c => c.upload_id === u.id);
      return {
        id: u.id,
        filename: u.filename || u.original_name,
        group_name: group ? group.name : 'Unknown',
        group_id: u.group_id,
        candidate_count: groupCandidates.length || 1,
        status: u.status,
        created_at: u.created_at
      };
    });

  const markedCount = allCandidates.filter(c => c.status === 'marked').length;

  return res.json({
    success: true,
    data: {
      uploads: allUploads.length,
      candidates: allCandidates.length,
      marking_schemes: allSchemes.length,
      marked_scripts: markedCount,
      pending_scripts: allCandidates.length - markedCount,
      groups: Array.from(groups.values()).length,
      recent_uploads: recentUploads
    }
  });
});

module.exports = router;
