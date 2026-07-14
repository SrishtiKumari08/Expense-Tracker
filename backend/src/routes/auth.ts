import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateMonthlyBudget,
} from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.put('/budget', protect, updateMonthlyBudget as any);

export default router;
