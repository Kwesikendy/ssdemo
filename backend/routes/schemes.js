'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const { schemes, groups } = require('../store');
const { extractText } = require('../services/pdf');
const { parseSchemeQuestions } = require('../services/groq');

const router = express.Router();
router.use(authMiddleware);

// Use memory storage for scheme PDFs
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }
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

// GET /api/v1/marking-schemes/stats
router.get('/stats', (req, res) => {
  const allSchemes = Array.from(schemes.values());
  return res.json({
    success: true,
    data: {
      total_schemes: allSchemes.length,
      active_schemes: allSchemes.filter(s => s.is_active).length,
      total_questions: allSchemes.reduce((acc, s) => acc + (s.questions ? s.questions.length : 0), 0)
    }
  });
});

// GET /api/v1/marking-schemes
router.get('/', (req, res) => {
  const { page = 1, per_page = 10, search, group_id } = req.query;
  let allSchemes = Array.from(schemes.values());

  if (search) {
    const q = search.toLowerCase();
    allSchemes = allSchemes.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.subject && s.subject.toLowerCase().includes(q))
    );
  }

  if (group_id) {
    allSchemes = allSchemes.filter(s => s.group_ids && s.group_ids.includes(group_id));
  }

  allSchemes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const { data, pagination } = paginate(allSchemes, page, per_page);
  return res.json({ success: true, schemes: data, pagination });
});

// POST /api/v1/marking-schemes
// Accepts both JSON body and multipart/form-data
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { name, subject, has_math, custom_instructions } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: { message: 'Scheme name is required' } });
    }

    // group_ids can be an array (JSON body) or JSON string (form-data)
    let group_ids = [];
    try {
      const rawGroupIds = req.body.group_ids;
      if (Array.isArray(rawGroupIds)) {
        group_ids = rawGroupIds;
      } else if (typeof rawGroupIds === 'string') {
        group_ids = JSON.parse(rawGroupIds);
      }
    } catch (e) {
      group_ids = [];
    }

    // Build groups array for display
    const groupsArray = group_ids.map(gid => {
      const g = groups.get(gid);
      return g ? { id: g.id, name: g.name } : { id: gid, name: 'Unknown Group' };
    });

    // Extract scheme text from file or body
    let scheme_text = req.body.scheme_text || '';
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === '.pdf') {
        scheme_text = await extractText(req.file.buffer);
      }
    }

    // Parse questions with Groq if we have scheme text
    let questions = [];
    let total_marks = 0;

    if (scheme_text && scheme_text.trim()) {
      try {
        const parsed = await parseSchemeQuestions(scheme_text);
        questions = (parsed.questions || []).map((q, i) => ({
          id: `q${i + 1}-${uuidv4()}`,
          question_number: q.question_number || i + 1,
          question_text: q.question_text || '',
          expected_answer: q.expected_answer || '',
          marks: q.marks || 0
        }));
        total_marks = parsed.total_marks || questions.reduce((acc, q) => acc + (q.marks || 0), 0);
      } catch (e) {
        console.error('Error parsing questions with Groq:', e.message);
        // Continue without parsed questions
      }
    }

    const id = `scheme-${uuidv4()}`;
    const now = new Date().toISOString();
    const scheme = {
      id,
      name,
      subject: subject || '',
      group_ids,
      groups: groupsArray,
      is_active: true,
      has_math: has_math === true || has_math === 'true',
      scheme_text,
      custom_instructions: custom_instructions || '',
      questions,
      total_marks,
      tenant_id: req.user.tenant_id || 'demo-tenant',
      created_at: now,
      updated_at: now
    };

    schemes.set(id, scheme);

    // Update group scheme counts
    group_ids.forEach(gid => {
      const g = groups.get(gid);
      if (g) {
        g.scheme_count = (g.scheme_count || 0) + 1;
        groups.set(gid, g);
      }
    });

    return res.status(201).json({ success: true, data: scheme });
  } catch (err) {
    console.error('Error creating scheme:', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/v1/marking-schemes/:id/download
router.get('/:id/download', (req, res) => {
  const scheme = schemes.get(req.params.id);
  if (!scheme) {
    return res.status(404).json({ success: false, error: { message: 'Marking scheme not found' } });
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${scheme.name.replace(/\s/g, '_')}.json"`);
  return res.json(scheme);
});

// GET /api/v1/marking-schemes/:id
router.get('/:id', (req, res) => {
  const scheme = schemes.get(req.params.id);
  if (!scheme) {
    return res.status(404).json({ success: false, error: { message: 'Marking scheme not found' } });
  }
  return res.json({ success: true, data: scheme });
});

// PUT /api/v1/marking-schemes/:id
router.put('/:id', upload.single('file'), async (req, res) => {
  const scheme = schemes.get(req.params.id);
  if (!scheme) {
    return res.status(404).json({ success: false, error: { message: 'Marking scheme not found' } });
  }

  const { name, subject, has_math, custom_instructions, is_active } = req.body;

  let group_ids = scheme.group_ids;
  try {
    if (req.body.group_ids) {
      group_ids = Array.isArray(req.body.group_ids) ? req.body.group_ids : JSON.parse(req.body.group_ids);
    }
  } catch (e) {}

  const groupsArray = group_ids.map(gid => {
    const g = groups.get(gid);
    return g ? { id: g.id, name: g.name } : { id: gid, name: 'Unknown Group' };
  });

  let scheme_text = req.body.scheme_text !== undefined ? req.body.scheme_text : scheme.scheme_text;
  if (req.file) {
    scheme_text = await extractText(req.file.buffer);
  }

  const updated = {
    ...scheme,
    name: name !== undefined ? name : scheme.name,
    subject: subject !== undefined ? subject : scheme.subject,
    has_math: has_math !== undefined ? (has_math === true || has_math === 'true') : scheme.has_math,
    custom_instructions: custom_instructions !== undefined ? custom_instructions : scheme.custom_instructions,
    is_active: is_active !== undefined ? (is_active === true || is_active === 'true') : scheme.is_active,
    group_ids,
    groups: groupsArray,
    scheme_text,
    updated_at: new Date().toISOString()
  };

  schemes.set(req.params.id, updated);
  return res.json({ success: true, data: updated });
});

// DELETE /api/v1/marking-schemes/:id
router.delete('/:id', (req, res) => {
  if (!schemes.has(req.params.id)) {
    return res.status(404).json({ success: false, error: { message: 'Marking scheme not found' } });
  }
  schemes.delete(req.params.id);
  return res.json({ success: true, message: 'Marking scheme deleted successfully' });
});

module.exports = router;
