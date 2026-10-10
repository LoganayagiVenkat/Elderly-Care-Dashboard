import express from 'express';
import * as healthController from '../controllers/healthController.js';

const router = express.Router();

router.get('/overview', healthController.getHealthOverview);
router.get('/records', healthController.getCareRecords);
router.get('/records/:residentId', healthController.getResidentCareRecords);
router.post('/records', healthController.insertCareRecord);
router.delete('/records/:recordId', healthController.deleteCareRecord);
router.get('/:residentId', healthController.getResidentVitals);
router.post('/:residentId', healthController.recordResidentVitals);

export default router;
