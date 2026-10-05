import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';
//import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.post('/refresh', refreshToken);

router.post('/forgot-password', forgotPassword);

router.post('/verify-otp', verifyOtp);

router.post('/reset-password', resetPassword);

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email role');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

router.post('/logout', logoutUser);

export default router;
