'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const { anomalies, groups } = require('../store');

const router = express.Router();
router.use(authMiddleware);

function paginate(array, page, perPage) {
  const p = parseInt(page) || 1;
  const pp = parseInt(perPage) || 10;
  const total = array.length;
  const total_pages = Math.ceil(total / pp);
  const start = (p - 1) * pp;
  const data = array.slice(start, start + pp);
  return { data, pagination: { page: p, per_page: pp, total, total_pages } };
}

// GET /api/v1/anomalies/groups  - must come before /:groupId
router.get('/groups', (req, res) => {
  const allAnomalies = Array.from(anomalies.values());
  const groupMap = {};

  allAnomalies.forEach(a => {
    if (!groupMap[a.group_id]) {
      groupMap[a.group_id] = {
        group_id: a.group_id,
        group_name: a.group_name,
        anomaly_count: 0
      };
    }
    groupMap[a.group_id].anomaly_count++;
  });

  return res.json({ success: true, data: Object.values(groupMap) });
});

// GET /api/v1/anomalies/exam/:examId
router.get('/exam/:examId', (req, res) => {
  const { examId } = req.params;
  const { page = 1, per_page = 10 } = req.query;

  const examAnomalies = Array.from(anomalies.values()).filter(a =>
    a.group_id === examId || a.candidate_id === examId
  );

  const { data, pagination } = paginate(examAnomalies, page, per_page);
  return res.json({ success: true, anomalies: data, pagination });
});

// GET /api/v1/anomalies
router.get('/', (req, res) => {
  const { page = 1, per_page = 10, group_id, status, severity } = req.query;
  let allAnomalies = Array.from(anomalies.values());

  if (group_id) allAnomalies = allAnomalies.filter(a => a.group_id === group_id);
  if (status) allAnomalies = allAnomalies.filter(a => a.status === status);
  if (severity) allAnomalies = allAnomalies.filter(a => a.severity === severity);

  allAnomalies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const { data, pagination } = paginate(allAnomalies, page, per_page);
  return res.json({ success: true, anomalies: data, pagination });
});

// GET /api/v1/anomalies/:groupId  - anomalies for a specific group
router.get('/:groupId', (req, res) => {
  const { groupId } = req.params;
  const { page = 1, per_page = 10 } = req.query;

  const groupAnomalies = Array.from(anomalies.values()).filter(a => a.group_id === groupId);
  groupAnomalies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const { data, pagination } = paginate(groupAnomalies, page, per_page);
  return res.json({ success: true, anomalies: data, pagination });
});

// POST /api/v1/anomalies/:anomalyId/resolve
router.post('/:anomalyId/resolve', (req, res) => {
  const anomaly = anomalies.get(req.params.anomalyId);
  if (!anomaly) {
    return res.status(404).json({ success: false, error: { message: 'Anomaly not found' } });
  }

  const updated = {
    ...anomaly,
    status: 'resolved',
    resolved_at: new Date().toISOString(),
    resolution_note: req.body.note || 'Resolved by admin',
    updated_at: new Date().toISOString()
  };

  anomalies.set(req.params.anomalyId, updated);
  return res.json({ success: true, data: updated });
});

module.exports = router;
