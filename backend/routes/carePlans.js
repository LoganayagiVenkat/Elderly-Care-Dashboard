import express from 'express';
import * as carePlansController from '../controllers/carePlansController.js';

const router = express.Router();

router.get('/', carePlansController.getCarePlans);
router.post('/', carePlansController.createCarePlan);
router.patch('/:id/task', carePlansController.toggleCarePlanTask);
router.delete('/:id', carePlansController.deleteCarePlan);

export default router;
