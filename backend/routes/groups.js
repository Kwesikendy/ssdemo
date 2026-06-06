'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const { groups, uploads, candidates, schemes, markingJobs, notifications } = require('../store');
const { markScript } = require('../services/groq');
const { extractText } = require('../services/pdf');

const router = express.Router();
router.use(authMiddleware);

// Multer setup for group uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.txt'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF and image files are allowed'));
  }
});

function paginate(array, page, perPage) {
  const p = parseInt(page) || 1;
  const pp = parseInt(perPage) || 10;
  const total = array.length;
  const total_pages = Math.ceil(total / pp);
  const start = (p - 1) * pp;
  return { data: array.slice(start, start + pp), pagination: { page: p, per_page: pp, total, total_pages } };
}

// GET /api/v1/groups/stats
router.get('/stats', (req, res) => {
  const allGroups = Array.from(groups.values());
  const allUploads = Array.from(uploads.values());
  const activeGroups = allGroups.filter(g => g.status === 'processing').length;
  return res.json({
    success: true,
    data: { total_groups: allGroups.length, total_uploads: allUploads.length, active_groups: activeGroups, groups_change: 2, uploads_change: 5 }
  });
});

// GET /api/v1/groups
router.get('/', (req, res) => {
  const { page = 1, per_page = 10, search, sort_by = 'created_at', sort_order = 'desc' } = req.query;
  let allGroups = Array.from(groups.values());
  if (search) {
    const q = search.toLowerCase();
    allGroups = allGroups.filter(g => g.name.toLowerCase().includes(q) || (g.description && g.description.toLowerCase().includes(q)));
  }
  allGroups.sort((a, b) => {
    const cmp = (a[sort_by] || '') < (b[sort_by] || '') ? -1 : (a[sort_by] || '') > (b[sort_by] || '') ? 1 : 0;
    return sort_order === 'asc' ? cmp : -cmp;
  });
  const { data, pagination } = paginate(allGroups, page, per_page);
  return res.json({ success: true, groups: data, pagination });
});

// POST /api/v1/groups
router.post('/', (req, res) => {
  const { name, description, has_math } = req.body;
  if (!name) return res.status(400).json({ success: false, error: { message: 'Group name is required' } });
  const id = `group-${uuidv4()}`;
  const now = new Date().toISOString();
  const group = { id, name, description: description || '', has_math: has_math === true || has_math === 'true', status: 'idle', upload_count: 0, scheme_count: 0, tenant_id: req.user.tenant_id || 'demo-tenant', created_at: now, updated_at: now };
  groups.set(id, group);
  return res.status(201).json({ success: true, data: group });
});

// GET /api/v1/groups/:id/candidates  — called by GroupUploadsPage
router.get('/:id/candidates', (req, res) => {
  const { id } = req.params;
  const { page = 1, per_page = 10, search, sort_by = 'created_at', sort_order = 'desc' } = req.query;
  if (!groups.has(id)) return res.status(404).json({ success: false, error: { message: 'Group not found' } });

  let groupCandidates = Array.from(candidates.values()).filter(c => c.group_id === id);
  if (search) {
    const q = search.toLowerCase();
    groupCandidates = groupCandidates.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.candidate_number && c.candidate_number.toLowerCase().includes(q))
    );
  }
  groupCandidates.sort((a, b) => {
    const cmp = (a[sort_by] || '') < (b[sort_by] || '') ? -1 : (a[sort_by] || '') > (b[sort_by] || '') ? 1 : 0;
    return sort_order === 'asc' ? cmp : -cmp;
  });

  // Map to what frontend expects
  const mapped = groupCandidates.map(c => ({
    ...c,
    index_number: c.candidate_number ? `${c.candidate_number} — ${c.name}` : c.name,
    page_count: c.page_count || 1,
    bound_pages: c.bound_pages || 1,
  }));

  const { data, pagination } = paginate(mapped, page, per_page);
  return res.json({ success: true, candidates: data, pagination });
});

// POST /api/v1/groups/:id/uploads  — called by GroupUploadsPage upload modal
router.post('/:id/uploads', upload.array('files', 50), async (req, res) => {
  const { id: groupId } = req.params;
  if (!groups.has(groupId)) return res.status(404).json({ success: false, error: { message: 'Group not found' } });

  const files = req.files || [];
  if (files.length === 0) return res.status(400).json({ success: false, error: { message: 'No files uploaded' } });

  const now = new Date().toISOString();
  const created = [];
  const totalExisting = Array.from(candidates.values()).filter(c => c.group_id === groupId).length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const uploadId = `upload-${uuidv4()}`;
    const candidateId = `cand-${uuidv4()}`;

    // Derive readable candidate name from filename
    const baseName = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim() || `Candidate ${totalExisting + i + 1}`;
    const candidateNumber = `SS${String(totalExisting + i + 1).padStart(3, '0')}`;

    // Try to extract text from PDF or TXT
    let scriptText = `Exam script for ${baseName}.`;
    let is_txt_upload = false;
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf') {
      try {
        const fs = require('fs');
        const buffer = fs.readFileSync(file.path);
        const extracted = await extractText(buffer);
        if (extracted && extracted.trim().length > 20) scriptText = extracted;
      } catch (e) {
        console.error('PDF extract error:', e.message);
      }
    } else if (ext === '.txt') {
      try {
        const fs = require('fs');
        scriptText = fs.readFileSync(file.path, 'utf8');
        is_txt_upload = true;
      } catch (e) {
        console.error('TXT read error:', e.message);
      }
    }

    const candidate = {
      id: candidateId, name: baseName, candidate_number: candidateNumber,
      group_id: groupId, upload_id: uploadId, script_text: scriptText, is_txt_upload: is_txt_upload,
      result: null, status: 'pending', page_count: 1, bound_pages: 1,
      tenant_id: req.user.tenant_id || 'demo-tenant', created_at: now, updated_at: now
    };
    candidates.set(candidateId, candidate);

    const uploadRecord = {
      id: uploadId, group_id: groupId, filename: file.filename,
      original_name: file.originalname, candidate_name: baseName,
      candidate_number: candidateNumber, candidate_id: candidateId,
      status: 'pending', page_count: 1, file_path: file.path,
      tenant_id: req.user.tenant_id || 'demo-tenant', created_at: now, updated_at: now
    };
    uploads.set(uploadId, uploadRecord);
    created.push(uploadRecord);
  }

  // Update group upload count
  const group = groups.get(groupId);
  if (group) { group.upload_count = (group.upload_count || 0) + files.length; groups.set(groupId, group); }

  return res.status(201).json({ success: true, data: created, count: created.length });
});

// POST /api/v1/groups/:id/marking-jobs/start — trigger AI marking
router.post('/:id/marking-jobs/start', async (req, res) => {
  const { id: groupId } = req.params;
  const group = groups.get(groupId);
  if (!group) return res.status(404).json({ success: false, error: { message: `Group '${groupId}' not found` } });

  const { v4: uuidv4 } = require('uuid');
  const jobId = `job-${uuidv4()}`;
  const now = new Date().toISOString();
  const job = { id: jobId, group_id: groupId, status: 'running', progress: 0, status_message: 'Starting...', results: [], created_at: now, updated_at: now };
  markingJobs.set(jobId, job);
  group.status = 'processing';
  groups.set(groupId, group);

  // Run async in background
  setImmediate(async () => {
    const updateJob = (u) => { const j = markingJobs.get(jobId); if (j) { Object.assign(j, u, { updated_at: new Date().toISOString() }); markingJobs.set(jobId, j); } };
    try {
      const groupScheme = Array.from(schemes.values()).find(s => s.group_ids && s.group_ids.includes(groupId));
      const groupCandidates = Array.from(candidates.values()).filter(c => c.group_id === groupId);

      if (groupCandidates.length === 0) {
        updateJob({ status: 'failed', status_message: 'No candidates uploaded to this group yet.' });
        group.status = 'idle'; groups.set(groupId, group); return;
      }
      if (!groupScheme) {
        updateJob({ status: 'failed', status_message: 'No marking scheme linked to this group. Go to Schemes and link one first.' });
        group.status = 'idle'; groups.set(groupId, group); return;
      }

      const total = groupCandidates.length;
      const jobResults = [];
      for (let i = 0; i < groupCandidates.length; i++) {
        const candidate = groupCandidates[i];
        updateJob({ progress: Math.round((i / total) * 85), status_message: `Marking ${candidate.name} (${i + 1}/${total})...` });
        try {
          let result;
          if (candidate.is_txt_upload && candidate.script_text && candidate.script_text.includes('=====')) {
            const parts = candidate.script_text.split('=====');
            const scoreCsv = parts[1] ? parts[1].trim() : '';
            const questionCsv = parts[2] ? parts[2].trim() : '';
            
            const scoreLines = scoreCsv.split('\n').filter(l => l.trim());
            const questionLines = questionCsv.split('\n').filter(l => l.trim());
            
            const totalScore = scoreLines.length > 1 ? parseFloat(scoreLines[1].split(',')[1]) : 0;
            
            const questions = questionLines.slice(1).map(line => {
              const cols = line.split(',');
              return {
                question_number: parseInt(cols[0]),
                awarded: parseFloat(cols[1]),
                max_marks: parseFloat(cols[2]),
                feedback: cols[3] ? cols[3].trim() : ''
              };
            });
            
            const maxScore = questions.reduce((sum, q) => sum + q.max_marks, 0);
            const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
            
            result = {
              total_score: totalScore,
              max_score: maxScore,
              percentage: percentage,
              questions: questions,
              overall_feedback: `Score: ${totalScore}/${maxScore} (${percentage}%)`
            };
          } else {
            const scriptText = candidate.script_text || `Student answers for ${candidate.name}`;
            result = await markScript(groupScheme.scheme_text, scriptText, groupScheme.custom_instructions);
          }
          candidate.result = result; candidate.status = 'marked'; candidate.updated_at = new Date().toISOString();
          candidates.set(candidate.id, candidate);
          const up = uploads.get(candidate.upload_id);
          if (up) { up.status = 'completed'; up.updated_at = new Date().toISOString(); uploads.set(candidate.upload_id, up); }
          jobResults.push({ candidate_id: candidate.id, candidate_name: candidate.name, result });
        } catch (e) {
          console.error(`Error marking ${candidate.name}:`, e.message);
          candidate.status = 'error'; candidate.updated_at = new Date().toISOString(); candidates.set(candidate.id, candidate);
        }
      }
      updateJob({ status: 'completed', progress: 100, status_message: `Done! ${total} scripts marked.`, results: jobResults });
      group.status = 'completed'; groups.set(groupId, group);
      const { v4: uid } = require('uuid');
      const nid = `notif-${uid()}`;
      notifications.set(nid, { id: nid, user_id: 'demo-user', title: 'Marking Complete', message: `"${group.name}" — ${total} scripts marked.`, type: 'success', read: false, is_read: false, created_at: new Date().toISOString() });
    } catch (err) {
      console.error('Marking job error:', err);
      updateJob({ status: 'failed', status_message: `Error: ${err.message}` });
      group.status = 'idle'; groups.set(groupId, group);
    }
  });

  return res.json({ success: true, data: { job: { id: jobId, status: 'running' } } });
});


// GET /api/v1/groups/:id
router.get('/:id', (req, res) => {
  const group = groups.get(req.params.id);
  if (!group) return res.status(404).json({ success: false, error: { message: 'Group not found' } });
  return res.json({ success: true, data: group });
});

// PUT /api/v1/groups/:id
router.put('/:id', (req, res) => {
  const group = groups.get(req.params.id);
  if (!group) return res.status(404).json({ success: false, error: { message: 'Group not found' } });
  const { name, description, has_math } = req.body;
  const updated = { ...group, name: name ?? group.name, description: description ?? group.description, has_math: has_math !== undefined ? (has_math === true || has_math === 'true') : group.has_math, updated_at: new Date().toISOString() };
  groups.set(req.params.id, updated);
  return res.json({ success: true, data: updated });
});

// DELETE /api/v1/groups/:id
router.delete('/:id', (req, res) => {
  if (!groups.has(req.params.id)) return res.status(404).json({ success: false, error: { message: 'Group not found' } });
  groups.delete(req.params.id);
  return res.json({ success: true, message: 'Group deleted successfully' });
});

module.exports = router;
