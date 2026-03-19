import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { getBudgetUsage } from '../services/budgetService.js';
import { Budget } from '../models/index.js';

const router = Router();

router.use(authMiddleware);

const budgetSchema = z.object({
  category: z.string().min(2),
  limitAmount: z.number().positive(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const month = Number(req.query.month ?? now.getMonth() + 1);
    const year = Number(req.query.year ?? now.getFullYear());

    const items = await getBudgetUsage({
      userId: req.user.id,
      month,
      year,
    });

    return res.json({ items, month, year });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = budgetSchema.parse(req.body);

    const budget = await Budget.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(req.user.id),
        category: payload.category,
        month: payload.month,
        year: payload.year,
      },
      {
        $set: {
          limitAmount: payload.limitAmount,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return res.status(201).json({
      budget: {
        id: budget._id.toString(),
        category: budget.category,
        limitAmount: Number(budget.limitAmount),
        month: budget.month,
        year: budget.year,
      },
    });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await Budget.deleteOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.user.id),
    });

    return res.status(204).send();
  }),
);

export default router;
