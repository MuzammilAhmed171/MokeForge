import express from 'express';
import {
  signup,
  login,
  verifyEmail,
  resendOTP,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  logout
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/verify-email', protect, verifyEmail);
router.post('/resend-otp', protect, resendOTP);
router.post('/logout', protect, logout);

export default router;
