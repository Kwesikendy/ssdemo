'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const { uploads, candidates, groups } = require('../store');
const { extractText } = require('../services/pdf');

const router = express.Router();
router.use(authMiddleware);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  }
});

function paginate(array, page, perPage) {
  const p = parseInt(page) || 1;
  const pp = parseInt(perPage) || 10;
  const total = array.length;
  const total_pages = Math.ceil(total / pp);
  const start = (p - 1) * pp;
  const data = array.slice(start, start + pp);
  return { data, pagination: { page: p, per_page: pp, total, total_pages } };
}

// GET /api/v1/uploads/stats
router.get('/stats', (req, res) => {
  const allUploads = Array.from(uploads.values());
  const allCandidates = Array.from(candidates.values());
  const markedScripts = allCandidates.filter(c => c.status === 'marked').length;

  return res.json({
    success: true,
    data: {
      total_uploads: allUploads.length,
      total_candidates: allCandidates.length,
      marked_scripts: markedScripts,
      total_scripts: allCandidates.length
    }
  });
});

// GET /api/v1/uploads/group/:groupId
router.get('/group/:groupId', (req, res) => {
  const { groupId } = req.params;
  const { page = 1, per_page = 10 } = req.query;

  if (!groups.has(groupId)) {
    return res.status(404).json({ success: false, error: { message: 'Group not found' } });
  }

  const groupUploads = Array.from(uploads.values()).filter(u => u.group_id === groupId);
  groupUploads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const { data, pagination } = paginate(groupUploads, page, per_page);
  return res.json({ success: true, uploads: data, pagination });
});

// POST /api/v1/uploads/group/:groupId
router.post('/group/:groupId', upload.single('file'), async (req, res) => {
  const { groupId } = req.params;

  if (!groups.has(groupId)) {
    return res.status(404).json({ success: false, error: { message: 'Group not found' } });
  }

  const { candidate_name, candidate_number } = req.body;
  if (!candidate_name || !candidate_number) {
    return res.status(400).json({ success: false, error: { message: 'candidate_name and candidate_number are required' } });
  }

  const uploadId = `upload-${uuidv4()}`;
  const candidateId = `cand-${uuidv4()}`;
  const now = new Date().toISOString();

  let scriptText = '';
  if (req.file) {
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext === '.pdf') {
      try {
        const fs = require('fs');
        const buffer = fs.readFileSync(req.file.path);
        scriptText = await extractText(buffer);
      } catch (e) {
        console.error('PDF extract error:', e.message);
      }
    }
  }

  const candidate = {
    id: candidateId,
    name: candidate_name,
    candidate_number,
    group_id: groupId,
    upload_id: uploadId,
    script_text: scriptText,
    result: null,
    status: 'pending',
    tenant_id: req.user.tenant_id || 'demo-tenant',
    created_at: now,
    updated_at: now
  };
  candidates.set(candidateId, candidate);

  const uploadRecord = {
    id: uploadId,
    group_id: groupId,
    filename: req.file ? req.file.filename : `${candidate_number}_script`,
    original_name: req.file ? req.file.originalname : `${candidate_number}_script`,
    candidate_name,
    candidate_number,
    candidate_id: candidateId,
    status: 'pending',
    page_count: 0,
    file_path: req.file ? req.file.path : null,
    tenant_id: req.user.tenant_id || 'demo-tenant',
    created_at: now,
    updated_at: now
  };
  uploads.set(uploadId, uploadRecord);

  // Update group upload count
  const group = groups.get(groupId);
  if (group) {
    group.upload_count = (group.upload_count || 0) + 1;
    groups.set(groupId, group);
  }

  return res.status(201).json({ success: true, data: { ...uploadRecord, candidate } });
});

// GET /api/v1/uploads/:uploadId
router.get('/:uploadId', (req, res) => {
  const upload = uploads.get(req.params.uploadId);
  if (!upload) {
    return res.status(404).json({ success: false, error: { message: 'Upload not found' } });
  }

  const candidate = upload.candidate_id ? candidates.get(upload.candidate_id) : null;
  return res.json({ success: true, data: { ...upload, candidate } });
});

module.exports = router;
