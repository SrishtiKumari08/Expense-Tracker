import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController';

const router = Router();

// Apply auth protection to all routes
router.use(protect);

router.route('/')
  .get(getExpenses as any)
  .post(createExpense as any);

router.route('/:id')
  .put(updateExpense as any)
  .delete(deleteExpense as any);

export default router;
