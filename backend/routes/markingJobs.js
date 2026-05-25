'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const { groups, uploads, candidates, schemes, markingJobs, notifications } = require('../store');
const { markScript } = require('../services/groq');

const router = express.Router();
router.use(authMiddleware);

// POST /api/v1/groups/:groupId/marking-jobs/start
// This router is mounted at /api/v1/groups
router.post('/:groupId/marking-jobs/start', async (req, res) => {
  const { groupId } = req.params;
  const group = groups.get(groupId);

  if (!group) {
    return res.status(404).json({ success: false, error: { message: 'Group not found' } });
  }

  const jobId = `job-${uuidv4()}`;
  const now = new Date().toISOString();

  const job = {
    id: jobId,
    group_id: groupId,
    status: 'running',
    progress: 0,
    status_message: 'Starting marking process...',
    results: [],
    created_at: now,
    updated_at: now
  };

  markingJobs.set(jobId, job);
  group.status = 'processing';
  groups.set(groupId, group);

  setImmediate(() => runMarkingJob(jobId, groupId));

  return res.json({ success: true, data: { job: { id: jobId, status: 'running' } } });
});

async function runMarkingJob(jobId, groupId) {
  const updateJob = (updates) => {
    const j = markingJobs.get(jobId);
    if (j) {
      Object.assign(j, updates, { updated_at: new Date().toISOString() });
      markingJobs.set(jobId, j);
    }
  };

  try {
    const groupScheme = Array.from(schemes.values()).find(s =>
      s.group_ids && s.group_ids.includes(groupId)
    );

    const groupCandidates = Array.from(candidates.values()).filter(c => c.group_id === groupId);

    if (groupCandidates.length === 0) {
      updateJob({ status: 'completed', progress: 100, status_message: 'No candidates to mark.' });
      const g = groups.get(groupId);
      if (g) { g.status = 'idle'; groups.set(groupId, g); }
      return;
    }

    if (!groupScheme) {
      updateJob({ status: 'failed', status_message: 'No marking scheme found for this group.' });
      const g = groups.get(groupId);
      if (g) { g.status = 'idle'; groups.set(groupId, g); }
      return;
    }

    const total = groupCandidates.length;
    const jobResults = [];

    for (let i = 0; i < groupCandidates.length; i++) {
      const candidate = groupCandidates[i];

      updateJob({
        progress: Math.round((i / total) * 85),
        status_message: `Marking script for ${candidate.name} (${i + 1}/${total})...`
      });

      try {
        if (candidate.script_text) {
          const result = await markScript(
            groupScheme.scheme_text,
            candidate.script_text,
            groupScheme.custom_instructions
          );

          candidate.result = result;
          candidate.status = 'marked';
          candidate.updated_at = new Date().toISOString();
          candidates.set(candidate.id, candidate);

          const uploadRecord = uploads.get(candidate.upload_id);
          if (uploadRecord) {
            uploadRecord.status = 'completed';
            uploadRecord.updated_at = new Date().toISOString();
            uploads.set(candidate.upload_id, uploadRecord);
          }

          jobResults.push({ candidate_id: candidate.id, candidate_name: candidate.name, result });
        } else {
          candidate.status = 'error';
          candidate.updated_at = new Date().toISOString();
          candidates.set(candidate.id, candidate);
        }
      } catch (markErr) {
        console.error(`Error marking candidate ${candidate.id}:`, markErr.message);
        candidate.status = 'error';
        candidate.updated_at = new Date().toISOString();
        candidates.set(candidate.id, candidate);
      }
    }

    updateJob({
      status: 'completed',
      progress: 100,
      status_message: `Marking completed. ${total} scripts processed.`,
      results: jobResults
    });

    const g = groups.get(groupId);
    if (g) { g.status = 'completed'; groups.set(groupId, g); }

    const notifId = `notif-${uuidv4()}`;
    notifications.set(notifId, {
      id: notifId,
      user_id: 'demo-user',
      title: 'Marking Complete',
      message: `Marking for group "${g ? g.name : groupId}" completed. ${total} scripts marked.`,
      type: 'success',
      read: false,
      created_at: new Date().toISOString()
    });

  } catch (err) {
    console.error('Marking job error:', err);
    const j = markingJobs.get(jobId);
    if (j) { j.status = 'failed'; j.status_message = `Error: ${err.message}`; j.updated_at = new Date().toISOString(); markingJobs.set(jobId, j); }
    const g = groups.get(groupId);
    if (g) { g.status = 'idle'; groups.set(groupId, g); }
  }
}

module.exports = router;
