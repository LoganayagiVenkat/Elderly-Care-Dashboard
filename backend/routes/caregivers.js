import express from 'express';
import * as caregiversController from '../controllers/caregiversController.js';

const router = express.Router();

router.get('/', caregiversController.getCaregivers);
router.post('/', caregiversController.createCaregiver);
router.put('/:id', caregiversController.updateCaregiver);
router.delete('/:id', caregiversController.deleteCaregiver);

export default router;
