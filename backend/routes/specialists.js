import express from 'express';
import * as specialistsController from '../controllers/specialistsController.js';

const router = express.Router();

router.get('/', specialistsController.getSpecialists);
router.get('/doctor-dashboard', specialistsController.getDoctorDashboard);
router.get('/week-view', specialistsController.getWeekView);
router.get('/availability', specialistsController.getAvailability);
router.get('/:id/availability', specialistsController.getDoctorAvailability);
router.get('/:id/slots', specialistsController.getSpecialistSlots);
router.post('/availability', specialistsController.createAvailability);
router.patch('/availability/:id', specialistsController.updateAvailability);
router.delete('/availability/:id', specialistsController.deleteAvailability);

export default router;

