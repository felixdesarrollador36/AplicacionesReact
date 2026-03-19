import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { checkAndCreateBudgetAlert } from '../services/budgetService.js';
import { Transaction } from '../models/index.js';

const router = Router();

router.use(authMiddleware);

const incomeSchema = z.object({
  amount: z.number().positive(),
  source: z.string().min(2),
  date: z.string().min(4),
  note: z.string().optional(),
});

const expenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(2),
  date: z.string().min(4),
  description: z.string().optional(),
});

const toTransactionResponse = (transaction) => ({
  id: transaction._id.toString(),
  type: transaction.type,
  amount: Number(transaction.amount),
  source: transaction.source ?? null,
  category: transaction.category ?? null,
  transaction_date: dayjs(transaction.transactionDate).format('YYYY-MM-DD'),
  note: transaction.note ?? null,
  description: transaction.description ?? null,
  created_at: transaction.createdAt,
});

router.post(
  '/income',
  asyncHandler(async (req, res) => {
    const payload = incomeSchema.parse(req.body);

    const transaction = await Transaction.create({
      userId: new mongoose.Types.ObjectId(req.user.id),
      type: 'income',
      amount: payload.amount,
      source: payload.source,
      transactionDate: dayjs(payload.date).startOf('day').toDate(),
      note: payload.note ?? null,
    });

    return res.status(201).json({ transaction: toTransactionResponse(transaction) });
  }),
);

router.post(
  '/expense',
  asyncHandler(async (req, res) => {
    const payload = expenseSchema.parse(req.body);

    const transaction = await Transaction.create({
      userId: new mongoose.Types.ObjectId(req.user.id),
      type: 'expense',
      amount: payload.amount,
      category: payload.category,
      transactionDate: dayjs(payload.date).startOf('day').toDate(),
      description: payload.description ?? null,
    });

    await checkAndCreateBudgetAlert({
      userId: req.user.id,
      category: payload.category,
      transactionDate: payload.date,
    });

    return res.status(201).json({ transaction: toTransactionResponse(transaction) });
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { from, to, type, category, page = '1', pageSize = '20' } = req.query;

    const where = {
      userId: new mongoose.Types.ObjectId(req.user.id),
    };

    if (type && ['income', 'expense'].includes(type)) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (from || to) {
      where.transactionDate = {};

      if (from) {
        where.transactionDate.$gte = dayjs(from).startOf('day').toDate();
      }

      if (to) {
        where.transactionDate.$lte = dayjs(to).endOf('day').toDate();
      }
    }

    const numericPage = Math.max(Number(page), 1);
    const numericPageSize = Math.min(Math.max(Number(pageSize), 1), 100);
    const offset = (numericPage - 1) * numericPageSize;

    const [items, total] = await Promise.all([
      Transaction.find(where)
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(offset)
        .limit(numericPageSize)
        .lean(),
      Transaction.countDocuments(where),
    ]);

    return res.json({
      items: items.map(toTransactionResponse),
      total,
      page: numericPage,
      pageSize: numericPageSize,
    });
  }),
);

router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const categories = await Transaction.distinct('category', {
      userId: new mongoose.Types.ObjectId(req.user.id),
      category: { $nin: [null, ''] },
    });

    categories.sort((a, b) => a.localeCompare(b));

    return res.json({ categories });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await Transaction.deleteOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.user.id),
    });

    return res.status(204).send();
  }),
);

export default router;
