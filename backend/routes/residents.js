import express from 'express';
import * as residentsController from '../controllers/residentsController.js';

const router = express.Router();

router.get('/', residentsController.getResidents);
router.get('/:id', residentsController.getResidentById);
router.post('/', residentsController.createResident);
router.put('/:id', residentsController.updateResident);
router.delete('/:id', residentsController.deleteResident);

export default router;
