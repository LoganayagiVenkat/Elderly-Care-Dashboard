import express from 'express';
import * as authController from '../controllers/auth/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Authentication Endpoints
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/reset-password', authController.resetPassword);
router.get('/find-user', authController.findUser);
router.put('/profile', authController.updateProfile);
router.post('/google', authController.googleLogin);
router.post('/google/register', authController.googleRegister);

// Protected JWT Verification & Profile Endpoints
router.get('/me', authenticateToken, authController.getMe);
router.get('/verify-token', authenticateToken, authController.verifyToken);

export default router;
