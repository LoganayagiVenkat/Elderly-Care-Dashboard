import express from 'express';
import * as appointmentsController from '../controllers/appointmentsController.js';

const router = express.Router();

router.get('/specialists', appointmentsController.getAppointmentSpecialists);
router.get('/', appointmentsController.getAppointments);
router.post('/', appointmentsController.createAppointment);
router.patch('/:id/status', appointmentsController.updateAppointmentStatus);
router.delete('/:id', appointmentsController.deleteAppointment);

export default router;
