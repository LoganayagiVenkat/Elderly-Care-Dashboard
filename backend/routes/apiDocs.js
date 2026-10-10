import express from 'express';

const router = express.Router();

export const API_CATALOG = {
  info: {
    title: 'ElderCare RESTful Care Management API',
    version: '2.0.0',
    description: 'Enterprise API providing healthcare records, emergency triage dispatch, care dependency graphs, and AI assistance for elderly residency management.',
    authScheme: 'Bearer JWT (JSON Web Token)',
    environment: 'Node.js Express + MySQL 8.0 / MariaDB'
  },
  endpoints: [
    {
      group: 'Authentication & Session',
      routes: [
        { method: 'POST', path: '/api/auth/login', desc: 'Authenticate user with username and password, returns signed JWT token', auth: 'Public', body: { username: 'admin', password: 'admin' } },
        { method: 'POST', path: '/api/auth/register', desc: 'Create new user account (Admin, Caregiver, Family, Patient, Doctor)', auth: 'Public' },
        { method: 'POST', path: '/api/auth/google', desc: 'Authenticate via OAuth 2.0 / Google Profile credentials', auth: 'OAuth' },
        { method: 'GET', path: '/api/auth/me', desc: 'Retrieve authenticated session user using Bearer JWT', auth: 'Bearer JWT' },
        { method: 'GET', path: '/api/auth/verify-token', desc: 'Verify validity and expiration of current JWT token', auth: 'Bearer JWT' }
      ]
    },
    {
      group: 'Elderly Residents & Profiles',
      routes: [
        { method: 'GET', path: '/api/residents', desc: 'List elderly residents with optional role/caregiver scoping', auth: 'Public/Session' },
        { method: 'GET', path: '/api/residents/:id', desc: 'Retrieve comprehensive resident medical profile and vitals', auth: 'Public/Session' },
        { method: 'POST', path: '/api/residents', desc: 'Admit new elderly resident (Admin only)', auth: 'Admin' },
        { method: 'PUT', path: '/api/residents/:id', desc: 'Update resident medical condition, room, or emergency contact', auth: 'Staff' }
      ]
    },
    {
      group: 'Care Dependency Graph & Cascade Analysis',
      routes: [
        { method: 'GET', path: '/api/care-dependency-map/:residentId', desc: 'Compute visual topological dependency chains (Resident -> Medication -> Vital Spike -> Emergency SOS -> Specialist SLA Allocation)', auth: 'Role-scoped' }
      ]
    },
    {
      group: 'Emergency SOS & Specialist Dispatch Algorithm',
      routes: [
        { method: 'GET', path: '/api/emergency', desc: 'Retrieve all active and resolved emergency medical alerts', auth: 'Public/Session' },
        { method: 'POST', path: '/api/emergency/trigger', desc: 'Trigger Emergency SOS alert; runs automated medical specialty triage and dispatches conflict-free doctor slot', auth: 'Any' },
        { method: 'POST', path: '/api/emergency/:id/respond', desc: 'Acknowledge and mark SOS in-progress by on-duty caregiver', auth: 'Caregiver' },
        { method: 'POST', path: '/api/emergency/:id/resolve', desc: 'Log clinical resolution notes and clear emergency status', auth: 'Caregiver/Admin' }
      ]
    },
    {
      group: 'Medications & Adherence',
      routes: [
        { method: 'GET', path: '/api/medications', desc: 'List scheduled medications for today with status (pending/completed)', auth: 'Role-scoped' },
        { method: 'POST', path: '/api/medications', desc: 'Prescribe new medication regimen with dosage and timeslot', auth: 'Medical Staff' },
        { method: 'PATCH', path: '/api/medications/:id/status', desc: 'Record medication administration adherence', auth: 'Caregiver' }
      ]
    },
    {
      group: 'Doctor Appointments & Conflict-Free Slotting',
      routes: [
        { method: 'GET', path: '/api/appointments', desc: 'Fetch upcoming doctor visits and specialist consultations', auth: 'Public/Session' },
        { method: 'GET', path: '/api/specialists/:id/slots', desc: 'Calculate available 30-min consultation slots without double bookings', auth: 'Public' },
        { method: 'POST', path: '/api/appointments', desc: 'Book consultation slot with double-booking prevention', auth: 'Staff/Family' }
      ]
    },
    {
      group: 'Database-Grounded Multi-Lingual AI Assistant',
      routes: [
        { method: 'POST', path: '/api/chatbot', desc: 'Query clinical database in natural language (English / Tamil / Tanglish)', auth: 'Public/Session', body: { message: 'What is the latest BP for Lakshmi Devi?', lang: 'ta' } }
      ]
    },
    {
      group: 'System Health & Diagnostics',
      routes: [
        { method: 'GET', path: '/api/health-check', desc: 'Real-time database connectivity, port, and MySQL engine diagnostics', auth: 'Public' }
      ]
    }
  ]
};

// GET /api/docs
router.get('/', (req, res) => {
  return res.json({
    success: true,
    data: API_CATALOG,
    timestamp: new Date().toISOString()
  });
});

export default router;
