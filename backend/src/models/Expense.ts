import { Schema, model, Document } from 'mongoose';

export interface IExpense extends Document {
  user: Schema.Types.ObjectId;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date: Date;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer';
  paymentStatus: 'Paid' | 'Pending';
  notes?: string;
  upiId?: string;
  isFavorite: boolean;
  isRecurring: boolean;
  recurringFrequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['expense', 'income'],
      default: 'expense',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Bank Transfer'],
      required: [true, 'Payment method is required'],
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Paid',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    upiId: {
      type: String,
      trim: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none',
    },
    nextDueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Expense = model<IExpense>('Expense', expenseSchema);
export default Expense;
