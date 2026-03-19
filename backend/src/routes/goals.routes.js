import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { Goal } from '../models/index.js';

const router = Router();

router.use(authMiddleware);

const goalSchema = z.object({
  title: z.string().min(2),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative().optional(),
  deadline: z.string().optional(),
});

const contributionSchema = z.object({
  amount: z.number().positive(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const goals = await Goal.find({
      userId: new mongoose.Types.ObjectId(req.user.id),
    })
      .sort({ createdAt: -1 })
      .lean();

    const items = goals.map((goal) => {
      const targetAmount = Number(goal.targetAmount);
      const currentAmount = Number(goal.currentAmount);

      return {
        id: goal._id.toString(),
        title: goal.title,
        targetAmount,
        currentAmount,
        deadline: goal.deadline ? dayjs(goal.deadline).format('YYYY-MM-DD') : null,
        progress: targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0,
        completed: currentAmount >= targetAmount,
      };
    });

    return res.json({ items });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = goalSchema.parse(req.body);

    const goal = await Goal.create({
      userId: new mongoose.Types.ObjectId(req.user.id),
      title: payload.title,
      targetAmount: payload.targetAmount,
      currentAmount: payload.currentAmount ?? 0,
      deadline: payload.deadline ? dayjs(payload.deadline).startOf('day').toDate() : null,
    });

    return res.status(201).json({
      goal: {
        id: goal._id.toString(),
        title: goal.title,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
        deadline: goal.deadline ? dayjs(goal.deadline).format('YYYY-MM-DD') : null,
        created_at: goal.createdAt,
      },
    });
  }),
);

router.patch(
  '/:id/contribute',
  asyncHandler(async (req, res) => {
    const payload = contributionSchema.parse(req.body);

    const goal = await Goal.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: new mongoose.Types.ObjectId(req.user.id),
      },
      {
        $inc: {
          currentAmount: payload.amount,
        },
      },
      {
        new: true,
      },
    ).lean();

    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada' });
    }

    return res.json({
      goal: {
        id: goal._id.toString(),
        title: goal.title,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
        deadline: goal.deadline ? dayjs(goal.deadline).format('YYYY-MM-DD') : null,
        created_at: goal.createdAt,
      },
    });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await Goal.deleteOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.user.id),
    });

    return res.status(204).send();
  }),
);

export default router;
