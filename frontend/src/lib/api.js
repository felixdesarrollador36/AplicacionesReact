import dayjs from 'dayjs';
import {
  buildGoalRecord,
  buildNotificationRecord,
  buildReminderRecord,
  buildTransactionRecord,
  buildUserRecord,
  getLocalDataEngine,
} from './localData';

export const AUTH_STORAGE_KEY = 'finanzas_auth_v1';

let currentToken = '';
let currentUserId = '';

const buildToken = (userId) => `local:${userId}`;

const parseToken = (token) => {
  if (!token || !token.startsWith('local:')) {
    return '';
  }

  return token.slice(6);
};

const hashPassword = async (value) => {
  const content = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', content);
  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('');
};

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.response = {
    status,
    data: { message },
  };
  return error;
};

const ensureAuthenticatedUser = async () => {
  if (!currentUserId) {
    throw createHttpError(401, 'No autorizado');
  }

  const engine = await getLocalDataEngine();
  const user = await engine.findUserById(currentUserId);

  if (!user) {
    throw createHttpError(401, 'Token invalido o expirado');
  }

  return { engine, user };
};

const formatTransaction = (transaction) => ({
  id: transaction.id,
  type: transaction.type,
  amount: Number(transaction.amount),
  source: transaction.source ?? null,
  category: transaction.category ?? null,
  transaction_date: transaction.transactionDate,
  note: transaction.note ?? null,
  description: transaction.description ?? null,
  created_at: transaction.createdAt,
});

const formatGoal = (goal) => {
  const targetAmount = Number(goal.targetAmount);
  const currentAmount = Number(goal.currentAmount);

  return {
    id: goal.id,
    title: goal.title,
    targetAmount,
    currentAmount,
    deadline: goal.deadline || null,
    progress: targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0,
    completed: currentAmount >= targetAmount,
    created_at: goal.createdAt,
  };
};

const formatNotification = (notification) => ({
  id: notification.id,
  type: notification.type,
  message: notification.message,
  is_read: Boolean(notification.isRead),
  created_at: notification.createdAt,
});

const formatReminder = (reminder) => ({
  id: reminder.id,
  title: reminder.title,
  amount: reminder.amount,
  due_date: reminder.dueDate,
  frequency: reminder.frequency,
  last_triggered: reminder.lastTriggered,
  created_at: reminder.createdAt,
});

const isReminderDue = (reminder, today) => {
  const dueDate = dayjs(reminder.dueDate);
  const currentDate = dayjs(today);

  if (reminder.lastTriggered && dayjs(reminder.lastTriggered).isSame(currentDate, 'day')) {
    return false;
  }

  if (reminder.frequency === 'once') {
    return !currentDate.isBefore(dueDate, 'day');
  }

  return !currentDate.isBefore(dueDate, 'day') && dueDate.date() === currentDate.date();
};

const syncDueReminders = async (engine) => {
  const reminders = await engine.listAllReminders();
  const today = dayjs().format('YYYY-MM-DD');

  for (const reminder of reminders) {
    if (!isReminderDue(reminder, today)) {
      continue;
    }

    const amountText = reminder.amount ? ` por ${Number(reminder.amount).toFixed(2)}` : '';
    await engine.createNotification(
      buildNotificationRecord({
        userId: reminder.userId,
        type: 'payment_reminder',
        message: `Recordatorio: ${reminder.title}${amountText}`,
      }),
    );

    await engine.touchReminder(reminder.id, today);
  }
};

const getTransactionsForUser = async (engine, userId) => {
  const transactions = await engine.listTransactions(userId);
  return transactions.sort((left, right) => {
    const dateDiff = String(right.transactionDate).localeCompare(String(left.transactionDate));
    if (dateDiff !== 0) return dateDiff;
    return String(right.createdAt).localeCompare(String(left.createdAt));
  });
};

const getBudgetUsage = async (engine, userId, month, year) => {
  const [budgets, transactions] = await Promise.all([
    engine.listBudgets(userId, month, year),
    getTransactionsForUser(engine, userId),
  ]);

  const spentByCategory = new Map();

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') continue;
    if (!transaction.category) continue;

    const transactionDate = dayjs(transaction.transactionDate);
    if (transactionDate.month() + 1 !== month || transactionDate.year() !== year) {
      continue;
    }

    spentByCategory.set(
      transaction.category,
      Number(spentByCategory.get(transaction.category) || 0) + Number(transaction.amount),
    );
  }

  return budgets.map((budget) => {
    const spentAmount = Number(spentByCategory.get(budget.category) || 0);
    const limitAmount = Number(budget.limitAmount);

    return {
      id: budget.id,
      category: budget.category,
      limitAmount,
      spentAmount,
      progress: limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0,
      exceeded: spentAmount > limitAmount,
    };
  });
};

const checkAndCreateBudgetAlert = async (engine, userId, category, transactionDate) => {
  const date = dayjs(transactionDate);
  const month = date.month() + 1;
  const year = date.year();

  const budgetItems = await getBudgetUsage(engine, userId, month, year);
  const budget = budgetItems.find((item) => item.category === category);

  if (!budget || !budget.exceeded) {
    return;
  }

  await engine.createNotification(
    buildNotificationRecord({
      userId,
      type: 'budget_alert',
      message: `Presupuesto excedido en ${category}: gastado ${budget.spentAmount.toFixed(2)} / limite ${budget.limitAmount.toFixed(2)}`,
    }),
  );
};

const listFilteredTransactions = async (engine, userId, params = {}) => {
  const items = await getTransactionsForUser(engine, userId);

  const filtered = items.filter((transaction) => {
    if (params.type && params.type !== 'all' && transaction.type !== params.type) {
      return false;
    }

    if (params.category && params.category !== 'all' && transaction.category !== params.category) {
      return false;
    }

    if (params.from && dayjs(transaction.transactionDate).isBefore(dayjs(params.from), 'day')) {
      return false;
    }

    if (params.to && dayjs(transaction.transactionDate).isAfter(dayjs(params.to), 'day')) {
      return false;
    }

    return true;
  });

  const numericPage = Math.max(Number(params.page || 1), 1);
  const numericPageSize = Math.min(Math.max(Number(params.pageSize || 20), 1), 500);
  const offset = (numericPage - 1) * numericPageSize;

  return {
    items: filtered.slice(offset, offset + numericPageSize).map(formatTransaction),
    total: filtered.length,
    page: numericPage,
    pageSize: numericPageSize,
  };
};

const handlers = {
  async post(path, payload) {
    if (path === '/auth/register') {
      const engine = await getLocalDataEngine();
      const email = payload.email.trim().toLowerCase();
      const existing = await engine.findUserByEmail(email);

      if (existing) {
        throw createHttpError(409, 'El correo ya esta registrado');
      }

      const passwordHash = await hashPassword(payload.password);
      const user = await engine.createUser(
        buildUserRecord({
          name: payload.name,
          email,
          passwordHash,
        }),
      );

      return {
        token: buildToken(user.id),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    }

    if (path === '/auth/login') {
      const engine = await getLocalDataEngine();
      const email = payload.email.trim().toLowerCase();
      const user = await engine.findUserByEmail(email);

      if (!user) {
        throw createHttpError(401, 'Credenciales invalidas');
      }

      const passwordHash = await hashPassword(payload.password);

      if (passwordHash !== user.passwordHash) {
        throw createHttpError(401, 'Credenciales invalidas');
      }

      return {
        token: buildToken(user.id),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    }

    if (path === '/transactions/income') {
      const { engine, user } = await ensureAuthenticatedUser();
      const transaction = await engine.createTransaction(
        buildTransactionRecord({
          userId: user.id,
          type: 'income',
          amount: payload.amount,
          source: payload.source,
          date: payload.date,
          note: payload.note,
        }),
      );

      return { transaction: formatTransaction(transaction) };
    }

    if (path === '/transactions/expense') {
      const { engine, user } = await ensureAuthenticatedUser();
      const transaction = await engine.createTransaction(
        buildTransactionRecord({
          userId: user.id,
          type: 'expense',
          amount: payload.amount,
          category: payload.category,
          date: payload.date,
          description: payload.description,
        }),
      );

      await checkAndCreateBudgetAlert(engine, user.id, payload.category, payload.date);

      return { transaction: formatTransaction(transaction) };
    }

    if (path === '/budgets') {
      const { engine, user } = await ensureAuthenticatedUser();
      const budget = await engine.upsertBudget({
        userId: user.id,
        category: payload.category,
        limitAmount: Number(payload.limitAmount),
        month: Number(payload.month),
        year: Number(payload.year),
      });

      return {
        budget: {
          id: budget.id,
          category: budget.category,
          limitAmount: Number(budget.limitAmount),
          month: budget.month,
          year: budget.year,
        },
      };
    }

    if (path === '/goals') {
      const { engine, user } = await ensureAuthenticatedUser();
      const goal = await engine.createGoal(
        buildGoalRecord({
          userId: user.id,
          title: payload.title,
          targetAmount: payload.targetAmount,
          currentAmount: payload.currentAmount,
          deadline: payload.deadline,
        }),
      );

      return { goal: formatGoal(goal) };
    }

    if (path === '/notifications/reminders') {
      const { engine, user } = await ensureAuthenticatedUser();
      const reminder = await engine.createReminder(
        buildReminderRecord({
          userId: user.id,
          title: payload.title,
          amount: payload.amount,
          dueDate: payload.dueDate,
          frequency: payload.frequency,
        }),
      );

      await engine.createNotification(
        buildNotificationRecord({
          userId: user.id,
          type: 'payment_setup',
          message: `Recordatorio creado: ${payload.title}`,
        }),
      );

      return { reminder: formatReminder(reminder) };
    }

    throw createHttpError(404, 'Operacion no soportada');
  },
  async get(path, options = {}) {
    if (path === '/auth/me') {
      const { user } = await ensureAuthenticatedUser();
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.createdAt,
        },
      };
    }

    const { engine, user } = await ensureAuthenticatedUser();
    await syncDueReminders(engine);

    if (path === '/dashboard/summary') {
      const transactions = await getTransactionsForUser(engine, user.id);
      const monthStart = dayjs().startOf('month');
      const nextMonthStart = monthStart.add(1, 'month');

      const totalIncome = transactions
        .filter((item) => item.type === 'income')
        .reduce((sum, item) => sum + Number(item.amount), 0);
      const totalExpense = transactions
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount), 0);

      const monthTransactions = transactions.filter((item) => {
        const date = dayjs(item.transactionDate);
        return !date.isBefore(monthStart, 'day') && date.isBefore(nextMonthStart, 'day');
      });

      const monthIncome = monthTransactions
        .filter((item) => item.type === 'income')
        .reduce((sum, item) => sum + Number(item.amount), 0);
      const monthExpense = monthTransactions
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount), 0);

      return {
        balance: totalIncome - totalExpense,
        totalIncome,
        totalExpense,
        monthIncome,
        monthExpense,
        monthSavings: monthIncome - monthExpense,
      };
    }

    if (path === '/dashboard/expenses-by-category') {
      const transactions = await getTransactionsForUser(engine, user.id);
      const monthStart = dayjs().startOf('month');
      const nextMonthStart = monthStart.add(1, 'month');
      const totals = new Map();

      for (const item of transactions) {
        const date = dayjs(item.transactionDate);
        if (item.type !== 'expense' || !item.category) continue;
        if (date.isBefore(monthStart, 'day') || !date.isBefore(nextMonthStart, 'day')) continue;

        totals.set(item.category, Number(totals.get(item.category) || 0) + Number(item.amount));
      }

      return {
        items: [...totals.entries()]
          .map(([category, total]) => ({ category, total }))
          .sort((left, right) => right.total - left.total),
      };
    }

    if (path === '/dashboard/monthly-evolution') {
      const transactions = await getTransactionsForUser(engine, user.id);
      const monthMap = new Map();

      for (const item of transactions) {
        const key = dayjs(item.transactionDate).format('YYYY-MM');
        const current = monthMap.get(key) || { income: 0, expense: 0 };

        if (item.type === 'income') {
          current.income += Number(item.amount);
        } else {
          current.expense += Number(item.amount);
        }

        monthMap.set(key, current);
      }

      const items = [];
      for (let index = 5; index >= 0; index -= 1) {
        const monthDate = dayjs().startOf('month').subtract(index, 'month');
        const key = monthDate.format('YYYY-MM');
        const values = monthMap.get(key) || { income: 0, expense: 0 };

        items.push({
          month: key,
          income: values.income,
          expense: values.expense,
        });
      }

      return { items };
    }

    if (path === '/transactions') {
      return listFilteredTransactions(engine, user.id, options.params || {});
    }

    if (path === '/transactions/categories') {
      const transactions = await getTransactionsForUser(engine, user.id);
      const categories = [...new Set(
        transactions
          .map((item) => item.category)
          .filter((category) => category && category.trim()),
      )].sort((left, right) => left.localeCompare(right));

      return { categories };
    }

    if (path === '/budgets') {
      const now = new Date();
      const month = Number(options.params?.month ?? now.getMonth() + 1);
      const year = Number(options.params?.year ?? now.getFullYear());

      return {
        items: await getBudgetUsage(engine, user.id, month, year),
        month,
        year,
      };
    }

    if (path === '/goals') {
      const goals = await engine.listGoals(user.id);
      return { items: goals.map(formatGoal) };
    }

    if (path === '/notifications') {
      const [items, unread] = await Promise.all([
        engine.listNotifications(user.id),
        engine.countUnreadNotifications(user.id),
      ]);

      return {
        items: items.map(formatNotification),
        unread,
      };
    }

    if (path === '/notifications/reminders') {
      const reminders = await engine.listReminders(user.id);
      return { items: reminders.map(formatReminder) };
    }

    throw createHttpError(404, 'Operacion no soportada');
  },
  async delete(path) {
    const { engine, user } = await ensureAuthenticatedUser();

    if (path.startsWith('/transactions/')) {
      await engine.deleteTransaction(user.id, path.slice('/transactions/'.length));
      return null;
    }

    if (path.startsWith('/budgets/')) {
      await engine.deleteBudget(user.id, path.slice('/budgets/'.length));
      return null;
    }

    if (path.startsWith('/goals/')) {
      await engine.deleteGoal(user.id, path.slice('/goals/'.length));
      return null;
    }

    throw createHttpError(404, 'Operacion no soportada');
  },
  async patch(path, payload) {
    const { engine, user } = await ensureAuthenticatedUser();

    if (path.startsWith('/goals/') && path.endsWith('/contribute')) {
      const goalId = path.slice('/goals/'.length, -'/contribute'.length);
      const goal = await engine.incrementGoal(user.id, goalId, payload.amount);

      if (!goal) {
        throw createHttpError(404, 'Meta no encontrada');
      }

      return { goal: formatGoal(goal) };
    }

    if (path.startsWith('/notifications/') && path.endsWith('/read')) {
      const notificationId = path.slice('/notifications/'.length, -'/read'.length);
      await engine.markNotificationRead(user.id, notificationId);
      return null;
    }

    throw createHttpError(404, 'Operacion no soportada');
  },
};

const wrapResponse = async (handler) => {
  const data = await handler();
  return { data };
};

export const api = {
  get(path, options) {
    return wrapResponse(() => handlers.get(path, options));
  },
  post(path, payload) {
    return wrapResponse(() => handlers.post(path, payload));
  },
  delete(path) {
    return wrapResponse(() => handlers.delete(path));
  },
  patch(path, payload) {
    return wrapResponse(() => handlers.patch(path, payload));
  },
};

export const setAuthToken = (token) => {
  currentToken = token || '';
  currentUserId = parseToken(currentToken);
};
