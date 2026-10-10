import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query, isDbConnected, testConnection, getDatabaseConfig } from './config/db.js';
import { initDatabase } from './scripts/initDb.js';

import authRoutes from './routes/auth.js';
import residentsRoutes from './routes/residents.js';
import caregiversRoutes from './routes/caregivers.js';
import medicationsRoutes from './routes/medications.js';
import appointmentsRoutes from './routes/appointments.js';
import carePlansRoutes from './routes/carePlans.js';
import emergencyRoutes from './routes/emergency.js';
import healthRoutes from './routes/health.js';
import activitiesRoutes from './routes/activities.js';
import documentsRoutes from './routes/documents.js';
import notificationsRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';
import chatbotRoutes from './routes/chatbot.js';
import specialistsRoutes from './routes/specialists.js';
import careDependencyMapRoutes from './routes/careDependencyMap.js';
import apiDocsRoutes from './routes/apiDocs.js';
import communicationRoutes from './routes/communication.js';
import voicemailsRoutes from './routes/voicemails.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

// ============================================================================
// CORS Configuration
// Allows requests from deployed Vercel frontend, custom domains, and localhost
// ============================================================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5001',
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server, health probes)
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = allowedOrigins.includes(origin);
    // Allow any *.vercel.app deployment (handles Vercel production & preview branches)
    const isVercelDomain = /^https:\/\/[a-z0-9-]+(\.vercel\.app)$/i.test(origin);

    if (isExplicitlyAllowed || isVercelDomain) {
      return callback(null, true);
    }

    if (!isProduction) {
      return callback(null, true);
    }

    console.warn(`[CORS] Rejected request from origin: ${origin}`);
    callback(new Error(`CORS policy: Access denied for origin ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-user-role',
    'x-user-caregiver-name',
    'x-user-resident-id',
    'x-user-doctor-name',
    'x-user-doctor-id'
  ]
};

app.use(cors(corsOptions));
app.use(express.json());

// ============================================================================
// Root Route: GET /
// Clean, professional HTML status page for Render backend service
// ============================================================================
app.get('/', (req, res) => {
  const acceptsHtml = req.accepts('html');
  const dbConfig = getDatabaseConfig();
  const dbConnected = isDbConnected();

  if (!acceptsHtml && req.accepts('json')) {
    return res.json({
      service: 'ElderCare Backend API',
      status: 'online',
      message: 'ElderCare REST API server is running.',
      healthCheck: '/api/health-check',
      docs: '/api/docs',
      database: {
        connected: dbConnected,
        mode: dbConnected ? 'mysql' : (isProduction ? 'disconnected' : 'in-memory-fallback')
      },
      timestamp: new Date().toISOString()
    });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ElderCare API — Backend Service</title>
  <style>
    :root {
      --bg: #F4F9F6;
      --card-bg: #FFFFFF;
      --forest-dark: #0A3728;
      --forest-primary: #0F5132;
      --mint: #E8F5EE;
      --mint-border: #C8E6D6;
      --text-main: #1C2826;
      --text-muted: #5C6F68;
      --green-live: #10B981;
      --amber: #D97706;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .container {
      width: 100%;
      max-width: 640px;
      background: var(--card-bg);
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(10, 55, 40, 0.08);
      border: 1px solid var(--mint-border);
      overflow: hidden;
    }
    .header {
      background: var(--forest-dark);
      color: #FFFFFF;
      padding: 32px 28px 24px;
      position: relative;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      background: var(--forest-primary);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .tagline {
      font-size: 13px;
      color: #A3CFBB;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 14px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #A7F3D0;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12.5px;
      font-weight: 600;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      background: var(--green-live);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--green-live);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.9); }
    }
    .body-content {
      padding: 28px;
    }
    .notice-card {
      background: var(--mint);
      border: 1px solid var(--mint-border);
      border-radius: 10px;
      padding: 16px 18px;
      margin-bottom: 24px;
      font-size: 13.5px;
      line-height: 1.5;
      color: var(--forest-dark);
    }
    .notice-card strong {
      color: var(--forest-dark);
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }
    .meta-item {
      background: #FAFCFA;
      border: 1px solid #E5EBE7;
      padding: 12px 14px;
      border-radius: 8px;
    }
    .meta-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 4px;
      font-weight: 600;
    }
    .meta-val {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-main);
    }
    .btn-group {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 11px 20px;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: var(--forest-primary);
      color: #FFFFFF;
    }
    .btn-primary:hover {
      background: var(--forest-dark);
    }
    .btn-secondary {
      background: #FFFFFF;
      color: var(--forest-dark);
      border: 1px solid var(--mint-border);
    }
    .btn-secondary:hover {
      background: var(--mint);
    }
    .footer {
      text-align: center;
      margin-top: 18px;
      font-size: 12px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="brand-icon">🌱</div>
        <div>
          <h1 class="title">ElderCare API</h1>
          <p class="tagline">Care Today, Brighter Tomorrows &bull; REST API Service</p>
        </div>
      </div>
      <div class="status-pill">
        <span class="status-dot"></span>
        Server Running &bull; Port ${PORT}
      </div>
    </div>
    <div class="body-content">
      <div class="notice-card">
        <strong>ℹ️ Backend API Service</strong>
        This is the REST API service powering the ElderCare System. The user-facing web application is deployed separately on Vercel.
      </div>
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Environment</div>
          <div class="meta-val">${isProduction ? 'Production' : 'Development'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Database Status</div>
          <div class="meta-val" style="color: ${dbConnected ? '#059669' : '#D97706'}">
            ${dbConnected ? '● MySQL Connected' : (isProduction ? '○ Awaiting Cloud MySQL' : '● In-Memory Fallback')}
          </div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Database Name</div>
          <div class="meta-val">${dbConfig.database || 'eldercare_db'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">API Version</div>
          <div class="meta-val">v1.0.0</div>
        </div>
      </div>
      <div class="btn-group">
        <a href="/api/health-check" class="btn btn-primary">
          Check API Health Status &rarr;
        </a>
        <a href="/api/docs" class="btn btn-secondary">
          View API Docs &rarr;
        </a>
      </div>
    </div>
  </div>
  <div class="footer">
    ElderCare Care Management System &bull; Render Backend Service
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

// ============================================================================
// API Health Check: GET /api/health-check
// Accurately reports server status and database connectivity
// ============================================================================
app.get('/api/health-check', async (req, res) => {
  try {
    const isLive = isDbConnected();
    const dbConfig = getDatabaseConfig();

    const healthData = {
      status: 'ok',
      service: 'ElderCare Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || (isProduction ? 'production' : 'development'),
      server: {
        status: 'online',
        port: Number(PORT)
      },
      database: {
        connected: isLive,
        mode: isLive ? 'mysql' : (isProduction ? 'disconnected' : 'in-memory-fallback'),
        status: isLive ? 'healthy' : (isProduction ? 'disconnected' : 'mock-active'),
        databaseName: dbConfig.database || 'eldercare_db',
        ssl: Boolean(dbConfig.ssl),
        configured: dbConfig.isConfigured
      }
    };

    if (!isLive && isProduction) {
      healthData.database.notice =
        'Production MySQL is not connected. Configure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (or DATABASE_URL) in Render Environment Variables for persistent data storage.';
    }

    return res.status(200).json(healthData);
  } catch (error) {
    return res.status(200).json({
      status: 'ok',
      service: 'ElderCare Backend API',
      timestamp: new Date().toISOString(),
      server: { status: 'online', port: Number(PORT) },
      database: {
        connected: false,
        status: 'error',
        message: error.message
      }
    });
  }
});

// ============================================================================
// Mount Application Routes
// ============================================================================
app.use('/api/auth', authRoutes);
app.use('/api/residents', residentsRoutes);
app.use('/api/caregivers', caregiversRoutes);
app.use('/api/medications', medicationsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/care-plans', carePlansRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/specialists', specialistsRoutes);
app.use('/api/care-dependency-map', careDependencyMapRoutes);
app.use('/api/docs', apiDocsRoutes);
app.use('/api/voicemails', voicemailsRoutes);
app.use('/api/communication', communicationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error.',
    code: err.code || undefined
  });
});

// ============================================================================
// Auto-initialize DB & Start Express Server
// ============================================================================
async function startServer() {
  const dbConfig = getDatabaseConfig();

  try {
    const connected = await testConnection();
    if (connected) {
      await initDatabase();
      console.log(`[Server] MySQL connected successfully to database \`${dbConfig.database}\``);
    } else if (isProduction) {
      console.warn('========================================================================');
      console.warn('[Server] WARNING: Remote MySQL database is not connected on Render.');
      console.warn('[Server] Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (or DATABASE_URL)');
      console.warn('[Server] in Render Environment Variables for persistent data storage.');
      console.warn('========================================================================');
    } else {
      console.log('[Server] Local MySQL offline. Running in development in-memory mode.');
    }
  } catch (dbErr) {
    console.warn('[Server] Database startup notice:', dbErr.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    const live = isDbConnected();
    console.log(`=================================================`);
    console.log(`  ElderCare Backend Server running on port ${PORT}`);
    console.log(`  Root URL:   http://0.0.0.0:${PORT}/`);
    console.log(`  API Health: http://0.0.0.0:${PORT}/api/health-check`);
    console.log(`  Database:   ${live ? 'MySQL (' + dbConfig.database + ')' : (isProduction ? 'Disconnected (Awaiting Render DB credentials)' : 'In-Memory Fallback')}`);
    console.log(`=================================================`);
  });
}

startServer();
