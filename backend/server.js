'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const groupsRoutes = require('./routes/groups');
const uploadsRoutes = require('./routes/uploads');
const schemesRoutes = require('./routes/schemes');
const markingRoutes = require('./routes/marking');
const markingJobsRoutes = require('./routes/markingJobs');
const resultsRoutes = require('./routes/results');
const candidatesRoutes = require('./routes/candidates');
const anomaliesRoutes = require('./routes/anomalies');
const appealsRoutes = require('./routes/appeals');
const dashboardRoutes = require('./routes/dashboard');
const notificationsRoutes = require('./routes/notifications');
const accountRoutes = require('./routes/account');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS - allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SmartScript Backend', version: '1.0.0', timestamp: new Date().toISOString() });
});

// =============================================
// API Routes
// =============================================

// Auth
app.use('/api/v1/auth', authRoutes);

// Groups CRUD (GET, POST, PUT, DELETE, stats)
app.use('/api/v1/groups', groupsRoutes);

// AI marking job start - POST /api/v1/groups/:groupId/marking-jobs/start
// Mounted on /api/v1/groups so :groupId works
app.use('/api/v1/groups', markingJobsRoutes);

// Uploads
app.use('/api/v1/uploads', uploadsRoutes);

// Marking Schemes
app.use('/api/v1/marking-schemes', schemesRoutes);

// Marking groups management (progress, start, pause, resume)
app.use('/api/v1/marking-groups', markingRoutes);

// Marking jobs status - GET /api/v1/marking-jobs/:jobId/status
app.use('/api/v1/marking-jobs', markingRoutes);

// Results
app.use('/api/v1/results', resultsRoutes);

// Candidates
app.use('/api/v1/candidates', candidatesRoutes);

// Anomalies
app.use('/api/v1/anomalies', anomaliesRoutes);

// Appeals
app.use('/api/v1/appeals', appealsRoutes);

// Dashboard
app.use('/api/v1/dashboard', dashboardRoutes);

// Notifications
app.use('/api/v1/notifications', notificationsRoutes);

// Account
app.use('/api/v1/account', accountRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: { message: `Route ${req.method} ${req.path} not found` } });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, error: { message: 'File too large. Max 50MB.' } });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, error: { message: err.message } });
  }
  return res.status(500).json({ success: false, error: { message: err.message || 'Internal server error' } });
});

app.listen(PORT, () => {
  console.log(`\n====================================`);
  console.log(`  SmartScript Backend v1.0.0`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  API:    http://localhost:${PORT}/api/v1`);
  console.log(`====================================\n`);
});

module.exports = app;
