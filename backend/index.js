import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query, isDbConnected, testConnection } from './config/db.js';
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
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Health Check & Database Status
app.get('/api/health-check', async (req, res) => {
  try {
    if (!isDbConnected()) {
      await testConnection();
    }
    const isLive = isDbConnected();
    return res.json({
      status: 'ok',
      connected: isLive,
      database: isLive ? 'connected' : 'mock',
      mode: isLive ? 'mysql' : 'in-memory-fallback',
      dbName: process.env.DB_NAME || 'eldercare_db',
      dbHost: process.env.DB_HOST || 'localhost',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.json({
      status: 'ok',
      connected: false,
      database: 'mock',
      mode: 'in-memory-fallback',
      dbName: process.env.DB_NAME || 'eldercare_db',
      dbHost: process.env.DB_HOST || 'localhost',
      timestamp: new Date().toISOString()
    });
  }
});

// Mount Routes
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
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// Auto-initialize DB and start listening
async function startServer() {
  let isMySQL = false;
  try {
    await testConnection();
    await initDatabase();
    isMySQL = true;
  } catch (dbErr) {
    console.log('[Server] MySQL is not currently running. Switched to high-availability in-memory mode:', dbErr.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    const live = isMySQL || isDbConnected();
    console.log(`=================================================`);
    console.log(`  ElderCare Backend Server running on port ${PORT}`);
    console.log(`  API Health: http://localhost:${PORT}/api/health-check`);
    console.log(`  Database Mode: ${live ? 'MySQL (' + (process.env.DB_NAME || 'eldercare_db') + ')' : 'In-Memory High Availability Fallback'}`);
    console.log(`=================================================`);
  });
}

startServer();
