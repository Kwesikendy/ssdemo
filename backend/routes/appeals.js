'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const { appeals, candidates, groups } = require('../store');

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

// GET /api/v1/appeals
router.get('/', (req, res) => {
  const { page = 1, per_page = 10, status, group_id } = req.query;
  let allAppeals = Array.from(appeals.values());

  if (status) allAppeals = allAppeals.filter(a => a.status === status);
  if (group_id) allAppeals = allAppeals.filter(a => a.group_id === group_id);

  allAppeals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const { data, pagination } = paginate(allAppeals, page, per_page);
  return res.json({ success: true, appeals: data, pagination });
});

// POST /api/v1/appeals
router.post('/', (req, res) => {
  const { candidate_id, candidate_name, candidate_number, group_id, reason } = req.body;

  if (!reason) {
    return res.status(400).json({ success: false, error: { message: 'Reason is required' } });
  }

  const id = `appeal-${uuidv4()}`;
  const now = new Date().toISOString();

  let resolvedName = candidate_name;
  let resolvedNumber = candidate_number;
  let resolvedGroupId = group_id;
  let resolvedGroupName = 'Unknown';

  if (candidate_id) {
    const cand = candidates.get(candidate_id);
    if (cand) {
      resolvedName = cand.name;
      resolvedNumber = cand.candidate_number;
      resolvedGroupId = cand.group_id;
    }
  }

  if (resolvedGroupId) {
    const group = groups.get(resolvedGroupId);
    if (group) resolvedGroupName = group.name;
  }

  const appeal = {
    id,
    candidate_id: candidate_id || null,
    candidate_name: resolvedName || 'Unknown',
    candidate_number: resolvedNumber || 'N/A',
    group_id: resolvedGroupId || null,
    group_name: resolvedGroupName,
    reason,
    status: 'pending',
    tenant_id: req.user.tenant_id || 'demo-tenant',
    created_at: now,
    updated_at: now
  };

  appeals.set(id, appeal);
  return res.status(201).json({ success: true, data: appeal });
});

// GET /api/v1/appeals/:id
router.get('/:id', (req, res) => {
  const appeal = appeals.get(req.params.id);
  if (!appeal) {
    return res.status(404).json({ success: false, error: { message: 'Appeal not found' } });
  }
  return res.json({ success: true, data: appeal });
});

// PUT /api/v1/appeals/:id
router.put('/:id', (req, res) => {
  const appeal = appeals.get(req.params.id);
  if (!appeal) {
    return res.status(404).json({ success: false, error: { message: 'Appeal not found' } });
  }

  const { status, resolution_note } = req.body;
  const updated = {
    ...appeal,
    status: status || appeal.status,
    resolution_note: resolution_note || appeal.resolution_note,
    resolved_at: status && status !== 'pending' ? new Date().toISOString() : appeal.resolved_at,
    updated_at: new Date().toISOString()
  };

  appeals.set(req.params.id, updated);
  return res.json({ success: true, data: updated });
});

// DELETE /api/v1/appeals/:id
router.delete('/:id', (req, res) => {
  if (!appeals.has(req.params.id)) {
    return res.status(404).json({ success: false, error: { message: 'Appeal not found' } });
  }
  appeals.delete(req.params.id);
  return res.json({ success: true, message: 'Appeal deleted' });
});

module.exports = router;
