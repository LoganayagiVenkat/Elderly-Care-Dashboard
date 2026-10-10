import express from 'express';
import * as notificationsController from '../controllers/notificationsController.js';

const router = express.Router();

router.get('/', notificationsController.getNotifications);
router.post('/', notificationsController.createNotification);
router.patch('/:id/read', notificationsController.markNotificationRead);
router.patch('/read-all', notificationsController.markAllNotificationsRead);
router.delete('/:id', notificationsController.deleteNotification);

export default router;
