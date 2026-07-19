import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Expense from '../models/Expense';
import User from '../models/User';

// Helper function to calculate next due date based on frequency
function calculateNextDueDate(currentDate: Date, frequency: string): Date {
  const next = new Date(currentDate);
  if (frequency === 'daily') {
    next.setDate(next.getDate() + 1);
  } else if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else if (frequency === 'yearly') {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

// Background utility to auto-generate recurring expenses
async function processRecurringExpenses(userId: string) {
  try {
    const now = new Date();
    
    // Find all active recurring templates for this user where nextDueDate has passed or is now
    const recurringTemplates = await Expense.find({
      user: userId,
      isRecurring: true,
      nextDueDate: { $lte: now }
    });

    for (const template of recurringTemplates) {
      let nextDate = new Date(template.nextDueDate || template.date);
      
      // Safety check to avoid infinite loops if frequency is invalid
      if (!template.recurringFrequency || template.recurringFrequency === 'none') {
        continue;
      }

      // Create new expense instances up to the current date
      while (nextDate <= now) {
        const newExpense = new Expense({
          user: template.user,
          type: template.type,
          amount: template.amount,
          category: template.category,
          description: template.description,
          date: new Date(nextDate),
          paymentMethod: template.paymentMethod,
          paymentStatus: template.paymentStatus,
          notes: template.notes,
          upiId: template.upiId,
          isFavorite: template.isFavorite,
          isRecurring: false // Spawning copies that do not trigger recursive runs
        });
        await newExpense.save();
        
        // Advance the due date
        nextDate = calculateNextDueDate(nextDate, template.recurringFrequency);
      }

      // Update the main recurring template's nextDueDate
      template.nextDueDate = nextDate;
      await template.save();
    }
  } catch (error) {
    console.error('Error processing recurring expenses:', error);
  }
}

// @desc    Get all expenses/incomes for authenticated user
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Process recurring expenses automatically
    await processRecurringExpenses(req.user.id);

    // Extract pagination parameters
    const page = parseInt(req.query.page as string);
    const limit = parseInt(req.query.limit as string);

    // Build query filters
    const filterQuery: any = { user: req.user.id };

    if (req.query.type) {
      filterQuery.type = req.query.type;
    }

    if (req.query.category) {
      filterQuery.category = req.query.category;
    }

    if (req.query.paymentStatus) {
      filterQuery.paymentStatus = req.query.paymentStatus;
    }

    if (req.query.isFavorite === 'true') {
      filterQuery.isFavorite = true;
    }

    if (req.query.isRecurring === 'true') {
      filterQuery.isRecurring = true;
    }

    // Date range filtering
    if (req.query.startDate || req.query.endDate) {
      filterQuery.date = {};
      if (req.query.startDate) {
        const start = new Date(req.query.startDate as string);
        start.setHours(0, 0, 0, 0);
        filterQuery.date.$gte = start;
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate as string);
        end.setHours(23, 59, 59, 999);
        filterQuery.date.$lte = end;
      }
    }

    // Text search query in description or notes
    if (req.query.search) {
      filterQuery.$or = [
        { description: { $regex: req.query.search, $options: 'i' } },
        { notes: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Sorting parameters
    let sortQuery: any = { date: -1 }; // default: latest first
    if (req.query.sortBy) {
      const sortBy = req.query.sortBy as string;
      if (sortBy === 'highest') {
        sortQuery = { amount: -1 };
      } else if (sortBy === 'lowest') {
        sortQuery = { amount: 1 };
      } else if (sortBy === 'latest') {
        sortQuery = { date: -1 };
      } else if (sortBy === 'oldest') {
        sortQuery = { date: 1 };
      } else if (sortBy === 'alphabetical') {
        sortQuery = { description: 1 };
      }
    }

    // Return all if page parameter is not defined (backward compatibility)
    if (isNaN(page)) {
      const expenses = await Expense.find(filterQuery).sort(sortQuery);
      return res.status(200).json(expenses);
    }

    // Run paginated query
    const limitVal = isNaN(limit) ? 10 : limit;
    const totalItems = await Expense.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalItems / limitVal);
    const currentPage = page;

    const expenses = await Expense.find(filterQuery)
      .sort(sortQuery)
      .skip((page - 1) * limitVal)
      .limit(limitVal);

    res.status(200).json({
      expenses,
      pagination: {
        totalItems,
        totalPages,
        currentPage,
        limit: limitVal
      }
    });
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
    const {
      type,
      amount,
      category,
      description,
      date,
      paymentMethod,
      paymentStatus,
      notes,
      upiId,
      isFavorite,
      isRecurring,
      recurringFrequency
    } = req.body;

    if (amount === undefined || !category || !description || !paymentMethod) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const txDate = date ? new Date(date) : new Date();
    const frequency = isRecurring ? (recurringFrequency || 'monthly') : 'none';

    const expense = new Expense({
      user: req.user.id,
      type: type || 'expense',
      amount,
      category,
      description,
      date: txDate,
      paymentMethod,
      paymentStatus: paymentStatus || 'Paid',
      notes,
      upiId,
      isFavorite: isFavorite || false,
      isRecurring: isRecurring || false,
      recurringFrequency: frequency,
      nextDueDate: isRecurring ? calculateNextDueDate(txDate, frequency) : undefined
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
    const {
      type,
      amount,
      category,
      description,
      date,
      paymentMethod,
      paymentStatus,
      notes,
      upiId,
      isFavorite,
      isRecurring,
      recurringFrequency
    } = req.body;

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

    const wasRecurring = expense.isRecurring;
    const oldDate = expense.date;
    const oldFreq = expense.recurringFrequency;

    expense.type = type || expense.type;
    expense.amount = amount !== undefined ? amount : expense.amount;
    expense.category = category || expense.category;
    expense.description = description || expense.description;
    expense.date = date ? new Date(date) : expense.date;
    expense.paymentMethod = paymentMethod || expense.paymentMethod;
    expense.paymentStatus = paymentStatus || expense.paymentStatus;
    expense.notes = notes !== undefined ? notes : expense.notes;
    expense.upiId = upiId !== undefined ? upiId : expense.upiId;
    expense.isFavorite = isFavorite !== undefined ? isFavorite : expense.isFavorite;
    
    expense.isRecurring = isRecurring !== undefined ? isRecurring : expense.isRecurring;
    expense.recurringFrequency = isRecurring !== undefined
      ? (isRecurring ? (recurringFrequency || expense.recurringFrequency || 'monthly') : 'none')
      : expense.recurringFrequency;

    // Recalculate nextDueDate if isRecurring became true, or if date/frequency changed
    if (expense.isRecurring) {
      if (!wasRecurring || (date && new Date(date).getTime() !== oldDate.getTime()) || (recurringFrequency && recurringFrequency !== oldFreq)) {
        expense.nextDueDate = calculateNextDueDate(expense.date, expense.recurringFrequency);
      }
    } else {
      expense.nextDueDate = undefined;
    }

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
