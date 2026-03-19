import { Router } from 'express';
import dayjs from 'dayjs';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { Transaction } from '../models/index.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const monthStart = dayjs().startOf('month').toDate();
    const nextMonthStart = dayjs(monthStart).add(1, 'month').toDate();

    const [allTotals] = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    const [monthTotals] = await Transaction.aggregate([
      {
        $match: {
          userId,
          transactionDate: {
            $gte: monthStart,
            $lt: nextMonthStart,
          },
        },
      },
      {
        $group: {
          _id: null,
          monthIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          monthExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    const totalIncome = Number(allTotals?.totalIncome || 0);
    const totalExpense = Number(allTotals?.totalExpense || 0);
    const monthIncome = Number(monthTotals?.monthIncome || 0);
    const monthExpense = Number(monthTotals?.monthExpense || 0);

    return res.json({
      balance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      monthIncome,
      monthExpense,
      monthSavings: monthIncome - monthExpense,
    });
  }),
);

router.get(
  '/expenses-by-category',
  asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const monthStart = dayjs().startOf('month').toDate();
    const nextMonthStart = dayjs(monthStart).add(1, 'month').toDate();

    const result = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          category: { $nin: [null, ''] },
          transactionDate: {
            $gte: monthStart,
            $lt: nextMonthStart,
          },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return res.json({
      items: result.map((row) => ({
        category: row._id,
        total: Number(row.total || 0),
      })),
    });
  }),
);

router.get(
  '/monthly-evolution',
  asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const startMonth = dayjs().startOf('month').subtract(5, 'month');

    const result = await Transaction.aggregate([
      {
        $match: {
          userId,
          transactionDate: {
            $gte: startMonth.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    const monthMap = new Map(
      result.map((item) => [
        `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        {
          income: Number(item.income || 0),
          expense: Number(item.expense || 0),
        },
      ]),
    );

    const items = [];
    for (let i = 5; i >= 0; i -= 1) {
      const monthDate = dayjs().startOf('month').subtract(i, 'month');
      const key = monthDate.format('YYYY-MM');
      const values = monthMap.get(key) || { income: 0, expense: 0 };

      items.push({
        month: key,
        income: values.income,
        expense: values.expense,
      });
    }

    return res.json({
      items,
    });
  }),
);

export default router;
