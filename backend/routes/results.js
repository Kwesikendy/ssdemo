'use strict';

const express = require('express');
const authMiddleware = require('../middleware/auth');
const { candidates, groups, uploads } = require('../store');

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

function buildResult(candidate) {
  const group = groups.get(candidate.group_id);
  const upload = candidate.upload_id ? uploads.get(candidate.upload_id) : null;
  const totalScore = candidate.result?.total_score ?? null;
  const maxScore = candidate.result?.max_score ?? null;
  const pct = candidate.result?.percentage ?? null;
  return {
    id: candidate.id,
    candidate_id: candidate.id,
    candidate_name: candidate.name,
    candidate_number: candidate.candidate_number,
    // Frontend expects these field names:
    index_number: candidate.candidate_number
      ? `${candidate.candidate_number} — ${candidate.name}`
      : candidate.name || 'Unknown',
    total_awarded: totalScore,
    total_max: maxScore,
    percentage: pct,
    updated_at_unix: candidate.updated_at
      ? Math.floor(new Date(candidate.updated_at).getTime() / 1000)
      : null,
    // Extra fields
    group_id: candidate.group_id,
    group_name: group ? group.name : 'Unknown',
    upload_id: candidate.upload_id,
    filename: upload ? upload.filename : null,
    status: candidate.status,
    total_score: totalScore,
    max_score: maxScore,
    overall_feedback: candidate.result?.overall_feedback ?? null,
    questions: candidate.result?.questions ?? [],
    created_at: candidate.created_at,
    updated_at: candidate.updated_at
  };
}

function computeStats(groupCandidates) {
  const marked = groupCandidates.filter(c => c.status === 'marked' && c.result?.percentage != null);
  const percentages = marked.map(c => c.result.percentage);
  const avg = percentages.length > 0
    ? Math.round(percentages.reduce((s, p) => s + p, 0) / percentages.length)
    : 0;
  const passRate = percentages.length > 0
    ? Math.round((percentages.filter(p => p >= 50).length / percentages.length) * 100)
    : 0;
  const highest = percentages.length > 0 ? Math.max(...percentages) : 0;
  return {
    average_score: avg,
    pass_rate: passRate,
    highest_score: highest,
    completed_candidates: marked.length,
    total_candidates: groupCandidates.length
  };
}

// GET /api/v1/results
router.get('/', (req, res) => {
  const { page = 1, per_page = 10, search, status } = req.query;
  let allCandidates = Array.from(candidates.values());

  if (search) {
    const q = search.toLowerCase();
    allCandidates = allCandidates.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.candidate_number.toLowerCase().includes(q)
    );
  }

  if (status) {
    allCandidates = allCandidates.filter(c => c.status === status);
  }

  allCandidates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const { data, pagination } = paginate(allCandidates, page, per_page);
  const results = data.map(buildResult);

  return res.json({ success: true, results, pagination });
});

// GET /api/v1/results/group/:groupId
router.get('/group/:groupId', (req, res) => {
  const { groupId } = req.params;
  const { page = 1, per_page = 10 } = req.query;

  if (!groups.has(groupId)) {
    return res.status(404).json({ success: false, error: { message: 'Group not found' } });
  }

  let groupCandidates = Array.from(candidates.values()).filter(c => c.group_id === groupId);
  groupCandidates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const { data, pagination } = paginate(groupCandidates, page, per_page);
  const results = data.map(buildResult);

  return res.json({ success: true, results, pagination });
});

// GET /api/v1/results/candidates/:candidateId
router.get('/candidates/:candidateId', (req, res) => {
  const candidate = candidates.get(req.params.candidateId);
  if (!candidate) {
    return res.status(404).json({ success: false, error: { message: 'Candidate not found' } });
  }
  return res.json({ success: true, data: buildResult(candidate) });
});

// GET /api/v1/results/groups  — alias: list all groups with result summary
router.get('/groups', (req, res) => {
  const { search } = req.query;
  let allGroups = Array.from(groups.values());
  if (search) {
    const q = search.toLowerCase();
    allGroups = allGroups.filter(g => g.name.toLowerCase().includes(q));
  }
  const result = allGroups.map(g => {
    const groupCandidates = Array.from(candidates.values()).filter(c => c.group_id === g.id);
    const marked = groupCandidates.filter(c => c.status === 'marked');
    const avgScore = marked.length > 0
      ? Math.round(marked.reduce((sum, c) => sum + (c.result?.percentage || 0), 0) / marked.length)
      : null;
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      total_candidates: groupCandidates.length,
      marked_count: marked.length,
      avg_score: avgScore,
      status: g.status,
      created_at: g.created_at
    };
  });
  return res.json({ success: true, groups: result, data: result });
});

// GET /api/v1/results/groups/:groupId/results  — alias for per-group results
router.get('/groups/:groupId/results', (req, res) => {
  const { groupId } = req.params;
  const { page = 1, per_page = 10, search } = req.query;

  if (!groups.has(groupId)) {
    return res.status(404).json({ success: false, error: { message: 'Group not found' } });
  }

  let groupCandidates = Array.from(candidates.values()).filter(c => c.group_id === groupId);

  if (search) {
    const q = search.toLowerCase();
    groupCandidates = groupCandidates.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.candidate_number && c.candidate_number.toLowerCase().includes(q))
    );
  }

  groupCandidates.sort((a, b) => (b.result?.percentage || 0) - (a.result?.percentage || 0));
  const stats = computeStats(groupCandidates);
  const { data, pagination } = paginate(groupCandidates, page, per_page);
  const results = data.map(buildResult);
  return res.json({ success: true, results, pagination, stats });
});

// GET /api/v1/results/groups/:groupId/export.csv  — CSV download
router.get('/groups/:groupId/export.csv', (req, res) => {
  const { groupId } = req.params;
  if (!groups.has(groupId)) {
    return res.status(404).json({ success: false, error: { message: 'Group not found' } });
  }

  const groupCandidates = Array.from(candidates.values()).filter(c => c.group_id === groupId);
  const group = groups.get(groupId);

  const rows = groupCandidates.map(c => {
    const r = c.result || {};
    return [
      c.candidate_number || '',
      c.name || '',
      r.total_score ?? '',
      r.max_score ?? '',
      r.percentage ?? '',
      c.status || '',
      (r.overall_feedback || '').replace(/,/g, ';').replace(/\n/g, ' ')
    ].join(',');
  });

  const csv = [
    'Candidate Number,Name,Score,Max Score,Percentage,Status,Feedback',
    ...rows
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${group.name}-results.csv"`);
  return res.send(csv);
});

module.exports = router;

