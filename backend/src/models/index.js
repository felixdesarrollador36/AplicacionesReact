import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    type: { type: String, enum: ['income', 'expense'], required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    source: { type: String, default: null },
    category: { type: String, default: null, index: true },
    transactionDate: { type: Date, required: true, index: true },
    note: { type: String, default: null },
    description: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

transactionSchema.index({ userId: 1, transactionDate: -1, createdAt: -1 });

const budgetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    category: { type: String, required: true, trim: true },
    limitAmount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000, max: 2100 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

const goalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    title: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, required: true, min: 0, default: 0 },
    deadline: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, required: true, default: false, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

const paymentReminderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, default: null },
    dueDate: { type: Date, required: true, index: true },
    frequency: { type: String, enum: ['once', 'monthly'], default: 'once' },
    lastTriggered: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Transaction =
  mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
export const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);
export const Goal = mongoose.models.Goal || mongoose.model('Goal', goalSchema);
export const Notification =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export const PaymentReminder =
  mongoose.models.PaymentReminder || mongoose.model('PaymentReminder', paymentReminderSchema);
