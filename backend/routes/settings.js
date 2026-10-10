import express from 'express';
import * as settingsController from '../controllers/settingsController.js';

const router = express.Router();

router.get('/:userId', settingsController.getSettings);
router.put('/:userId', settingsController.updateSettings);

export default router;
