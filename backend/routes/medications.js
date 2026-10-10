import express from 'express';
import * as medicationsController from '../controllers/medicationsController.js';

const router = express.Router();

router.get('/', medicationsController.getMedications);
router.post('/', medicationsController.createMedication);
router.patch('/:id/status', medicationsController.updateMedicationStatus);
router.delete('/:id', medicationsController.deleteMedication);

export default router;
