import express from 'express';
import * as activitiesController from '../controllers/activitiesController.js';

const router = express.Router();

router.get('/', activitiesController.getActivities);
router.post('/', activitiesController.createActivity);

export default router;
