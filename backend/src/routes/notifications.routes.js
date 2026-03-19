import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { createNotification } from '../services/notificationService.js';
import { Notification, PaymentReminder } from '../models/index.js';

const router = Router();

router.use(authMiddleware);

const reminderSchema = z.object({
  title: z.string().min(2),
  amount: z.number().positive().optional(),
  dueDate: z.string().min(4),
  frequency: z.enum(['once', 'monthly']).default('once'),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const [items, unread] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return res.json({
      items: items.map((item) => ({
        id: item._id.toString(),
        type: item.type,
        message: item.message,
        is_read: item.isRead,
        created_at: item.createdAt,
      })),
      unread,
    });
  }),
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await Notification.updateOne(
      {
        _id: req.params.id,
        userId: new mongoose.Types.ObjectId(req.user.id),
      },
      {
        $set: { isRead: true },
      },
    );

    return res.status(204).send();
  }),
);

router.post(
  '/reminders',
  asyncHandler(async (req, res) => {
    const payload = reminderSchema.parse(req.body);

    const reminder = await PaymentReminder.create({
      userId: new mongoose.Types.ObjectId(req.user.id),
      title: payload.title,
      amount: payload.amount ?? null,
      dueDate: dayjs(payload.dueDate).startOf('day').toDate(),
      frequency: payload.frequency,
    });

    await createNotification({
      userId: req.user.id,
      type: 'payment_setup',
      message: `Recordatorio creado: ${payload.title}`,
    });

    return res.status(201).json({
      reminder: {
        id: reminder._id.toString(),
        title: reminder.title,
        amount: reminder.amount,
        due_date: dayjs(reminder.dueDate).format('YYYY-MM-DD'),
        frequency: reminder.frequency,
        created_at: reminder.createdAt,
      },
    });
  }),
);

router.get(
  '/reminders',
  asyncHandler(async (req, res) => {
    const reminders = await PaymentReminder.find({
      userId: new mongoose.Types.ObjectId(req.user.id),
    })
      .sort({ dueDate: 1 })
      .lean();

    return res.json({
      items: reminders.map((item) => ({
        id: item._id.toString(),
        title: item.title,
        amount: item.amount,
        due_date: dayjs(item.dueDate).format('YYYY-MM-DD'),
        frequency: item.frequency,
        last_triggered: item.lastTriggered
          ? dayjs(item.lastTriggered).format('YYYY-MM-DD')
          : null,
        created_at: item.createdAt,
      })),
    });
  }),
);

export default router;
