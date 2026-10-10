// backend/routes/communication.js
import express from 'express';
import {
  sendWhatsApp,
  makeVoiceCall,
  getConversations,
  getMessages,
  sendMessage,
  getEmergencyLogs,
  dispatchEmergency
} from '../controllers/communicationController.js';

const router = express.Router();

// Conversations & Chat
router.get('/conversations', getConversations);
router.get('/messages', getMessages);
router.post('/messages', sendMessage);

// Emergency dispatches & logs
router.get('/emergency-logs', getEmergencyLogs);
router.post('/emergency-dispatch', dispatchEmergency);

// Legacy WhatsApp & Voice
router.post('/whatsapp', sendWhatsApp);
router.post('/voice', makeVoiceCall);

export default router;

