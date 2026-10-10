import express from 'express';
import * as emergencyController from '../controllers/emergencyController.js';

const router = express.Router();

router.get('/', emergencyController.getEmergencyAlerts);
router.get('/mappings', emergencyController.getEmergencyMappings);
router.get('/specialists', emergencyController.getEmergencySpecialists);
router.post('/trigger', emergencyController.triggerEmergency);
router.post('/report', emergencyController.triggerEmergency);
router.post('/:id/respond', emergencyController.respondToEmergency);
router.post('/:id/resolve', emergencyController.resolveEmergency);
router.delete('/:id', emergencyController.deleteEmergency);

export default router;
