import express from 'express';
import {
  getVoicemails,
  createVoicemail,
  markVoicemailAsRead,
  deleteVoicemail
} from '../controllers/voicemailsController.js';

const router = express.Router();

router.get('/', getVoicemails);
router.post('/', createVoicemail);
router.patch('/:id/read', markVoicemailAsRead);
router.delete('/:id', deleteVoicemail);

export default router;
