import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Expense from '../models/Expense';
import User from '../models/User';

// @desc    Get all expenses/incomes for authenticated user
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Server error fetching expenses' });
  }
};

// @desc    Create a new expense/income
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { type, amount, category, description, date, paymentMethod, paymentStatus, notes, upiId } = req.body;

    if (amount === undefined || !category || !description || !paymentMethod) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const expense = new Expense({
      user: req.user.id,
      type: type || 'expense',
      amount,
      category,
      description,
      date: date || new Date(),
      paymentMethod,
      paymentStatus: paymentStatus || 'Paid',
      notes,
      upiId,
    });

    // Auto-save custom category to User's customCategories if not a default
    const defaults = ['Food', 'Shopping', 'Travel', 'Rent', 'Entertainment', 'Bills', 'Medical', 'Education', 'Salary', 'Others'];
    if (category && !defaults.includes(category)) {
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { customCategories: category }
      });
    }

    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Server error creating expense' });
  }
};

// @desc    Update an existing expense/income
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { id } = req.params;
    const { type, amount, category, description, date, paymentMethod, paymentStatus, notes, upiId } = req.body;

    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check user ownership
    if (expense.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this expense' });
    }

    // Auto-save custom category to User's customCategories if updated and not a default
    if (category && category !== expense.category) {
      const defaults = ['Food', 'Shopping', 'Travel', 'Rent', 'Entertainment', 'Bills', 'Medical', 'Education', 'Salary', 'Others'];
      if (!defaults.includes(category)) {
        await User.findByIdAndUpdate(req.user.id, {
          $addToSet: { customCategories: category }
        });
      }
    }

    expense.type = type || expense.type;
    expense.amount = amount !== undefined ? amount : expense.amount;
    expense.category = category || expense.category;
    expense.description = description || expense.description;
    expense.date = date || expense.date;
    expense.paymentMethod = paymentMethod || expense.paymentMethod;
    expense.paymentStatus = paymentStatus || expense.paymentStatus;
    expense.notes = notes !== undefined ? notes : expense.notes;
    expense.upiId = upiId !== undefined ? upiId : expense.upiId;

    const updatedExpense = await expense.save();
    res.status(200).json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Server error updating expense' });
  }
};

// @desc    Delete an expense/income
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const { id } = req.params;

    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check user ownership
    if (expense.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    await expense.deleteOne();
    res.status(200).json({ message: 'Expense removed successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Server error deleting expense' });
  }
};
