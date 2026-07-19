import { Request, Response } from 'express';
import User from '../models/User';
import Expense from '../models/Expense';
import jwt from 'jsonwebtoken';

// Helper function to generate JWT
const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback_jwt_secret_for_dev_only_123';
  return jwt.sign({ id }, secret, {
    expiresIn: '30d', // 30 days validity
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req: Request, res: Response): Promise<void | Response> => {
  const { name, email, password } = req.body;

  try {
    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // 3. Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id.toString()),
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data received' });
    }
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error, registration failed' });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req: Request, res: Response): Promise<void | Response> => {
  const { email, password } = req.body;

  try {
    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter both email and password' });
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Verify password
    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id.toString()),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error, login failed' });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = async (req: any, res: Response): Promise<void | Response> => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({ message: 'Server error, failed to retrieve profile' });
  }
};

/**
 * @desc    Update user monthly budget
 * @route   PUT /api/auth/budget
 * @access  Private
 */
export const updateMonthlyBudget = async (req: any, res: Response): Promise<void | Response> => {
  try {
    const { budget } = req.body;
    if (budget === undefined || budget < 0) {
      return res.status(400).json({ message: 'Please provide a valid budget amount greater than or equal to 0' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { monthlyBudget: budget },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Update monthly budget error:', error);
    return res.status(500).json({ message: 'Server error, failed to update budget' });
  }
};

/**
 * @desc    Update user profile details
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req: any, res: Response): Promise<void | Response> => {
  try {
    const { name, email, profilePicture } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check email uniqueness if email is changed
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }
    }

    user.name = name;
    user.email = email.toLowerCase();
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
    }

    const updatedUser = await user.save();
    
    // Convert to object and strip password before sending
    const userResponse = updatedUser.toObject();
    delete (userResponse as any).password;

    return res.json(userResponse);
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error, failed to update profile' });
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/auth/password
 * @access  Private
 */
export const changePassword = async (req: any, res: Response): Promise<void | Response> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please enter both current and new passwords' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare with current password
    const isMatch = await (user as any).comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error, failed to update password' });
  }
};

/**
 * @desc    Delete user account and all their transactions
 * @route   DELETE /api/auth/account
 * @access  Private
 */
export const deleteAccount = async (req: any, res: Response): Promise<void | Response> => {
  try {
    const userId = req.user.id;

    // Delete all expenses of the user
    await Expense.deleteMany({ user: userId });

    // Delete the user record
    const userDeleted = await User.findByIdAndDelete(userId);
    if (!userDeleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'Account and transactions deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ message: 'Server error, failed to delete account' });
  }
};
