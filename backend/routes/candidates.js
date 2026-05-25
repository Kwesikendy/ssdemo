'use strict';

const express = require('express');
const authMiddleware = require('../middleware/auth');
const { candidates, uploads, groups } = require('../store');

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

// GET /api/v1/candidates
router.get('/', (req, res) => {
  const { page = 1, per_page = 10, group_id, search } = req.query;
  let allCandidates = Array.from(candidates.values());

  if (group_id) {
    allCandidates = allCandidates.filter(c => c.group_id === group_id);
  }

  if (search) {
    const q = search.toLowerCase();
    allCandidates = allCandidates.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.candidate_number.toLowerCase().includes(q)
    );
  }

  allCandidates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const { data, pagination } = paginate(allCandidates, page, per_page);
  return res.json({ success: true, candidates: data, pagination });
});

// GET /api/v1/candidates/:candidateId
router.get('/:candidateId', (req, res) => {
  const candidate = candidates.get(req.params.candidateId);
  if (!candidate) {
    return res.status(404).json({ success: false, error: { message: 'Candidate not found' } });
  }
  const group = groups.get(candidate.group_id);
  const upload = candidate.upload_id ? uploads.get(candidate.upload_id) : null;
  return res.json({ success: true, data: { ...candidate, group, upload } });
});

// GET /api/v1/candidates/:candidateId/pages
router.get('/:candidateId/pages', (req, res) => {
  const candidate = candidates.get(req.params.candidateId);
  if (!candidate) {
    return res.status(404).json({ success: false, error: { message: 'Candidate not found' } });
  }

  const upload = candidate.upload_id ? uploads.get(candidate.upload_id) : null;
  const pageCount = upload ? (upload.page_count || 1) : 1;

  // Generate mock pages from script text
  const pages = [];
  const lines = (candidate.script_text || '').split('\n');
  const linesPerPage = Math.max(1, Math.ceil(lines.length / pageCount));

  for (let i = 0; i < pageCount; i++) {
    const pageLines = lines.slice(i * linesPerPage, (i + 1) * linesPerPage);
    pages.push({
      id: `page-${i + 1}`,
      page_number: i + 1,
      content: pageLines.join('\n'),
      image_url: null
    });
  }

  return res.json({ success: true, data: { candidate_id: req.params.candidateId, pages } });
});

module.exports = router;
