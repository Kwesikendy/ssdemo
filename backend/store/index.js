'use strict';

const groups = new Map();
const schemes = new Map();
const uploads = new Map();
const candidates = new Map();
const markingJobs = new Map();
const anomalies = new Map();
const appeals = new Map();
const notifications = new Map();

function seedData() {
  const now = new Date();
  const recent = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const older = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  // Groups
  groups.set('group-1', {
    id: 'group-1',
    name: 'Mathematics 2025',
    description: 'Final exam scripts',
    has_math: true,
    status: 'idle',
    upload_count: 3,
    scheme_count: 1,
    tenant_id: 'demo-tenant',
    created_at: recent.toISOString(),
    updated_at: recent.toISOString()
  });

  groups.set('group-2', {
    id: 'group-2',
    name: 'English Literature',
    description: 'Mid-term essays',
    has_math: false,
    status: 'idle',
    upload_count: 2,
    scheme_count: 0,
    tenant_id: 'demo-tenant',
    created_at: older.toISOString(),
    updated_at: older.toISOString()
  });

  // Marking Scheme
  schemes.set('scheme-1', {
    id: 'scheme-1',
    name: 'Math Final Marking Scheme',
    subject: 'Mathematics',
    group_ids: ['group-1'],
    groups: [{ id: 'group-1', name: 'Mathematics 2025' }],
    is_active: true,
    has_math: true,
    scheme_text: 'Q1 (10 marks): Solve 2x+5=15. Answer: x=5.\nQ2 (15 marks): Find the area of a circle with radius 7cm. Answer: 153.94 cm^2.\nQ3 (20 marks): Differentiate f(x) = 3x^3 + 2x^2 - 5x + 1. Answer: f\'(x) = 9x^2 + 4x - 5.\nQ4 (25 marks): Solve the quadratic equation x^2-7x+12=0. Answer: x=3 or x=4.\nQ5 (30 marks): Find all solutions to sin(x)=0.5 for 0<=x<=2*pi. Answer: x=pi/6 or x=5*pi/6.',
    custom_instructions: 'Award partial marks for correct method even if answer is wrong. Show all working.',
    questions: [
      { id: 'q1', question_number: 1, question_text: 'Solve 2x+5=15', expected_answer: 'x=5', marks: 10 },
      { id: 'q2', question_number: 2, question_text: 'Area of circle r=7cm', expected_answer: '153.94 cm^2', marks: 15 },
      { id: 'q3', question_number: 3, question_text: 'Differentiate f(x)=3x^3+2x^2-5x+1', expected_answer: '9x^2+4x-5', marks: 20 },
      { id: 'q4', question_number: 4, question_text: 'Solve x^2-7x+12=0', expected_answer: 'x=3 or x=4', marks: 25 },
      { id: 'q5', question_number: 5, question_text: 'Trigonometry: sin(x)=0.5 for 0<=x<=2pi', expected_answer: 'pi/6 and 5pi/6', marks: 30 }
    ],
    total_marks: 100,
    tenant_id: 'demo-tenant',
    created_at: recent.toISOString(),
    updated_at: recent.toISOString()
  });

  // Candidates
  candidates.set('cand-1', {
    id: 'cand-1',
    name: 'Alice Johnson',
    candidate_number: 'SS001',
    group_id: 'group-1',
    upload_id: 'upload-1',
    script_text: 'Q1: 2x+5=15, 2x=10, x=5\nQ2: Area = pi*7^2 = 153.94 cm^2\nQ3: f(x)=3x^3+2x^2-5x+1, f\'(x)=9x^2+4x-5\nQ4: x^2-7x+12=0, (x-3)(x-4)=0, x=3 or x=4\nQ5: sin(x)=0.5, x=30 or 150 degrees = pi/6 or 5pi/6',
    result: {
      total_score: 95,
      max_score: 100,
      percentage: 95,
      questions: [
        { number: 1, score: 10, max_marks: 10, feedback: 'Correct' },
        { number: 2, score: 15, max_marks: 15, feedback: 'Correct' },
        { number: 3, score: 18, max_marks: 20, feedback: 'Minor error in sign' },
        { number: 4, score: 25, max_marks: 25, feedback: 'Perfect' },
        { number: 5, score: 27, max_marks: 30, feedback: 'Correct values, missing radians explanation' }
      ],
      overall_feedback: 'Excellent performance. Minor arithmetic errors in Q3 and Q5.'
    },
    status: 'marked',
    tenant_id: 'demo-tenant',
    created_at: recent.toISOString(),
    updated_at: recent.toISOString()
  });

  candidates.set('cand-2', {
    id: 'cand-2',
    name: 'Benjamin Osei',
    candidate_number: 'SS002',
    group_id: 'group-1',
    upload_id: 'upload-2',
    script_text: 'Q1: x=5\nQ2: 154 cm^2\nQ3: 9x^2+4x-5\nQ4: x=3 or x=4\nQ5: x=pi/6',
    result: {
      total_score: 72,
      max_score: 100,
      percentage: 72,
      questions: [
        { number: 1, score: 8, max_marks: 10, feedback: 'No working shown' },
        { number: 2, score: 13, max_marks: 15, feedback: 'Close approximation, minor rounding' },
        { number: 3, score: 20, max_marks: 20, feedback: 'Perfect' },
        { number: 4, score: 25, max_marks: 25, feedback: 'Correct' },
        { number: 5, score: 6, max_marks: 30, feedback: 'Only found one solution, missed x=5pi/6' }
      ],
      overall_feedback: 'Good but needs to show working. Missed second solution in Q5.'
    },
    status: 'marked',
    tenant_id: 'demo-tenant',
    created_at: recent.toISOString(),
    updated_at: recent.toISOString()
  });

  candidates.set('cand-3', {
    id: 'cand-3',
    name: 'Chloe Mensah',
    candidate_number: 'SS003',
    group_id: 'group-1',
    upload_id: 'upload-3',
    script_text: 'Q1: x=4\nQ2: Area = 2*pi*r = 44 cm\nQ3: 9x+4\nQ4: x=3\nQ5: x=0.5',
    result: {
      total_score: 28,
      max_score: 100,
      percentage: 28,
      questions: [
        { number: 1, score: 0, max_marks: 10, feedback: 'Incorrect answer, arithmetic error' },
        { number: 2, score: 0, max_marks: 15, feedback: 'Used circumference formula instead of area' },
        { number: 3, score: 5, max_marks: 20, feedback: 'Forgot chain rule on x^2 terms' },
        { number: 4, score: 15, max_marks: 25, feedback: 'Found only one root, incomplete' },
        { number: 5, score: 8, max_marks: 30, feedback: 'Incorrectly interpreted sin inverse, x=0.5 is not an angle' }
      ],
      overall_feedback: 'Needs significant improvement. Recommend revision of calculus and trigonometry.'
    },
    status: 'marked',
    tenant_id: 'demo-tenant',
    created_at: recent.toISOString(),
    updated_at: recent.toISOString()
  });

  // Uploads
  uploads.set('upload-1', {
    id: 'upload-1',
    group_id: 'group-1',
    filename: 'alice_johnson_script.pdf',
    original_name: 'alice_johnson_script.pdf',
    candidate_name: 'Alice Johnson',
    candidate_number: 'SS001',
    candidate_id: 'cand-1',
    status: 'completed',
    page_count: 4,
    file_path: null,
    tenant_id: 'demo-tenant',
    created_at: recent.toISOString(),
    updated_at: recent.toISOString()
  });

  uploads.set('upload-2', {
    id: 'upload-2',
    group_id: 'group-1',
    filename: 'benjamin_osei_script.pdf',
    original_name: 'benjamin_osei_script.pdf',
    candidate_name: 'Benjamin Osei',
    candidate_number: 'SS002',
    candidate_id: 'cand-2',
    status: 'completed',
    page_count: 3,
    file_path: null,
    tenant_id: 'demo-tenant',
    created_at: recent.toISOString(),
    updated_at: recent.toISOString()
  });

  uploads.set('upload-3', {
    id: 'upload-3',
    group_id: 'group-1',
    filename: 'chloe_mensah_script.pdf',
    original_name: 'chloe_mensah_script.pdf',
    candidate_name: 'Chloe Mensah',
    candidate_number: 'SS003',
    candidate_id: 'cand-3',
    status: 'completed',
    page_count: 2,
    file_path: null,
    tenant_id: 'demo-tenant',
    created_at: recent.toISOString(),
    updated_at: recent.toISOString()
  });

  // Anomalies
  anomalies.set('anom-1', {
    id: 'anom-1',
    group_id: 'group-1',
    group_name: 'Mathematics 2025',
    candidate_id: 'cand-3',
    candidate_name: 'Chloe Mensah',
    candidate_number: 'SS003',
    type: 'suspicious_similarity',
    severity: 'high',
    description: 'High similarity detected between candidate SS003 and SS002 in Q4 responses',
    status: 'unresolved',
    tenant_id: 'demo-tenant',
    created_at: recent.toISOString(),
    updated_at: recent.toISOString()
  });

  anomalies.set('anom-2', {
    id: 'anom-2',
    group_id: 'group-1',
    group_name: 'Mathematics 2025',
    candidate_id: 'cand-2',
    candidate_name: 'Benjamin Osei',
    candidate_number: 'SS002',
    type: 'missing_pages',
    severity: 'medium',
    description: 'Page 3 appears to be missing from the uploaded script',
    status: 'unresolved',
    tenant_id: 'demo-tenant',
    created_at: recent.toISOString(),
    updated_at: recent.toISOString()
  });

  // Appeals
  appeals.set('appeal-1', {
    id: 'appeal-1',
    candidate_id: 'cand-3',
    candidate_name: 'Chloe Mensah',
    candidate_number: 'SS003',
    group_id: 'group-1',
    group_name: 'Mathematics 2025',
    reason: 'I believe my Q3 working was correct but the marker did not award partial marks',
    status: 'pending',
    tenant_id: 'demo-tenant',
    created_at: recent.toISOString(),
    updated_at: recent.toISOString()
  });

  // Notifications
  notifications.set('notif-1', {
    id: 'notif-1',
    user_id: 'demo-user',
    title: 'Marking Complete',
    message: 'Mathematics 2025 group marking has been completed. 3 scripts marked.',
    type: 'success',
    read: false,
    created_at: recent.toISOString()
  });

  notifications.set('notif-2', {
    id: 'notif-2',
    user_id: 'demo-user',
    title: 'Anomaly Detected',
    message: 'High similarity anomaly detected in Mathematics 2025 group for candidate SS003.',
    type: 'warning',
    read: false,
    created_at: recent.toISOString()
  });

  notifications.set('notif-3', {
    id: 'notif-3',
    user_id: 'demo-user',
    title: 'New Appeal Submitted',
    message: 'Chloe Mensah has submitted an appeal for Mathematics 2025.',
    type: 'info',
    read: true,
    created_at: older.toISOString()
  });
}

seedData();

module.exports = { groups, schemes, uploads, candidates, markingJobs, anomalies, appeals, notifications };
