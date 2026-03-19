import dayjs from 'dayjs';
import mongoose from 'mongoose';
import { Budget, Transaction } from '../models/index.js';
import { createNotification } from './notificationService.js';

export const getBudgetUsage = async ({ userId, month, year }) => {
  const mongoUserId = new mongoose.Types.ObjectId(userId);
  const periodStart = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month');
  const periodEnd = periodStart.endOf('month');

  const [budgets, spentByCategory] = await Promise.all([
    Budget.find({
      userId: mongoUserId,
      month,
      year,
    })
      .sort({ category: 1 })
      .lean(),
    Transaction.aggregate([
      {
        $match: {
          userId: mongoUserId,
          type: 'expense',
          transactionDate: {
            $gte: periodStart.toDate(),
            $lte: periodEnd.toDate(),
          },
          category: { $nin: [null, ''] },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  const spentMap = new Map(
    spentByCategory.map((item) => [item._id, Number(item.total || 0)]),
  );

  return budgets.map((budget) => {
    const spent = spentMap.get(budget.category) || 0;
    const limit = Number(budget.limitAmount);
    const progress = limit > 0 ? (spent / limit) * 100 : 0;

    return {
      id: budget._id.toString(),
      category: budget.category,
      limitAmount: limit,
      spentAmount: spent,
      progress,
      exceeded: spent > limit,
    };
  });
};

export const checkAndCreateBudgetAlert = async ({ userId, category, transactionDate }) => {
  const date = new Date(transactionDate);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const mongoUserId = new mongoose.Types.ObjectId(userId);

  const budget = await Budget.findOne({
    userId: mongoUserId,
    category,
    month,
    year,
  }).lean();

  if (!budget) {
    return null;
  }

  const periodStart = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month');
  const periodEnd = periodStart.endOf('month');

  const [spentSummary] = await Transaction.aggregate([
    {
      $match: {
        userId: mongoUserId,
        type: 'expense',
        category,
        transactionDate: {
          $gte: periodStart.toDate(),
          $lte: periodEnd.toDate(),
        },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  const spent = Number(spentSummary?.total || 0);
  const limit = Number(budget.limitAmount);

  if (spent > limit) {
    return createNotification({
      userId,
      type: 'budget_alert',
      message: `Presupuesto excedido en ${category}: gastado ${spent.toFixed(2)} / limite ${limit.toFixed(2)}`,
    });
  }

  return null;
};
