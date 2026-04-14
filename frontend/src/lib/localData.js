import dayjs from 'dayjs';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'pulsebudget_local';
const WEB_STORAGE_KEY = 'pulsebudget_local_web_v1';

const schemaStatements = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  source TEXT,
  category TEXT,
  transaction_date TEXT NOT NULL,
  note TEXT,
  description TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  limit_amount REAL NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, category, month, year)
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL NOT NULL,
  deadline TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_reminders (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  amount REAL,
  due_date TEXT NOT NULL,
  frequency TEXT NOT NULL,
  last_triggered TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminders_user_due ON payment_reminders(user_id, due_date);
`;

const sqliteConnection = Capacitor.isNativePlatform()
  ? new SQLiteConnection(CapacitorSQLite)
  : null;

let databasePromise;
let enginePromise;

const defaultState = () => ({
  users: [],
  transactions: [],
  budgets: [],
  goals: [],
  notifications: [],
  reminders: [],
});

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const nowIso = () => new Date().toISOString();

const toDayString = (value) => dayjs(value).format('YYYY-MM-DD');

const mapUserRow = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
  };
};

const mapTransactionRow = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    userId: String(row.userId),
    type: row.type,
    amount: Number(row.amount),
    source: row.source ?? null,
    category: row.category ?? null,
    transactionDate: row.transactionDate,
    note: row.note ?? null,
    description: row.description ?? null,
    createdAt: row.createdAt,
  };
};

const mapBudgetRow = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    userId: String(row.userId),
    category: row.category,
    limitAmount: Number(row.limitAmount),
    month: Number(row.month),
    year: Number(row.year),
    createdAt: row.createdAt,
  };
};

const mapGoalRow = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    userId: String(row.userId),
    title: row.title,
    targetAmount: Number(row.targetAmount),
    currentAmount: Number(row.currentAmount),
    deadline: row.deadline ?? null,
    createdAt: row.createdAt,
  };
};

const mapNotificationRow = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    userId: String(row.userId),
    type: row.type,
    message: row.message,
    isRead: Boolean(Number(row.isRead)),
    createdAt: row.createdAt,
  };
};

const mapReminderRow = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    userId: String(row.userId),
    title: row.title,
    amount: row.amount == null ? null : Number(row.amount),
    dueDate: row.dueDate,
    frequency: row.frequency,
    lastTriggered: row.lastTriggered ?? null,
    createdAt: row.createdAt,
  };
};

const sortByNewestDate = (left, right, primaryField) => {
  const primaryDiff = String(right[primaryField]).localeCompare(String(left[primaryField]));
  if (primaryDiff !== 0) return primaryDiff;
  return String(right.createdAt).localeCompare(String(left.createdAt));
};

const loadWebState = () => {
  try {
    const raw = window.localStorage.getItem(WEB_STORAGE_KEY);
    if (!raw) {
      return defaultState();
    }

    const parsed = JSON.parse(raw);
    return {
      ...defaultState(),
      ...parsed,
    };
  } catch {
    return defaultState();
  }
};

const saveWebState = (state) => {
  window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(state));
};

const createWebEngine = () => {
  const getState = () => loadWebState();

  const updateState = (updater) => {
    const nextState = updater(getState());
    saveWebState(nextState);
    return nextState;
  };

  return {
    async findUserByEmail(email) {
      const normalizedEmail = email.toLowerCase();
      return getState().users.find((user) => user.email === normalizedEmail) || null;
    },
    async findUserById(id) {
      return getState().users.find((user) => user.id === id) || null;
    },
    async createUser(user) {
      updateState((state) => ({
        ...state,
        users: [...state.users, user],
      }));
      return user;
    },
    async listTransactions(userId) {
      return getState().transactions
        .filter((transaction) => transaction.userId === userId)
        .sort((left, right) => sortByNewestDate(left, right, 'transactionDate'));
    },
    async createTransaction(transaction) {
      updateState((state) => ({
        ...state,
        transactions: [...state.transactions, transaction],
      }));
      return transaction;
    },
    async deleteTransaction(userId, transactionId) {
      updateState((state) => ({
        ...state,
        transactions: state.transactions.filter(
          (transaction) => !(transaction.id === transactionId && transaction.userId === userId),
        ),
      }));
    },
    async listBudgets(userId, month, year) {
      return getState().budgets
        .filter((budget) => budget.userId === userId && budget.month === month && budget.year === year)
        .sort((left, right) => left.category.localeCompare(right.category));
    },
    async upsertBudget(budgetInput) {
      let storedBudget = null;

      updateState((state) => {
        const existing = state.budgets.find(
          (budget) =>
            budget.userId === budgetInput.userId &&
            budget.category === budgetInput.category &&
            budget.month === budgetInput.month &&
            budget.year === budgetInput.year,
        );

        if (existing) {
          storedBudget = { ...existing, limitAmount: budgetInput.limitAmount };
          return {
            ...state,
            budgets: state.budgets.map((budget) =>
              budget.id === existing.id ? storedBudget : budget,
            ),
          };
        }

        storedBudget = {
          id: createId(),
          createdAt: nowIso(),
          ...budgetInput,
        };

        return {
          ...state,
          budgets: [...state.budgets, storedBudget],
        };
      });

      return storedBudget;
    },
    async deleteBudget(userId, budgetId) {
      updateState((state) => ({
        ...state,
        budgets: state.budgets.filter((budget) => !(budget.id === budgetId && budget.userId === userId)),
      }));
    },
    async listGoals(userId) {
      return getState().goals
        .filter((goal) => goal.userId === userId)
        .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
    },
    async createGoal(goal) {
      updateState((state) => ({
        ...state,
        goals: [...state.goals, goal],
      }));
      return goal;
    },
    async incrementGoal(userId, goalId, amount) {
      let updatedGoal = null;

      updateState((state) => ({
        ...state,
        goals: state.goals.map((goal) => {
          if (goal.id !== goalId || goal.userId !== userId) {
            return goal;
          }

          updatedGoal = {
            ...goal,
            currentAmount: Number(goal.currentAmount) + Number(amount),
          };

          return updatedGoal;
        }),
      }));

      return updatedGoal;
    },
    async deleteGoal(userId, goalId) {
      updateState((state) => ({
        ...state,
        goals: state.goals.filter((goal) => !(goal.id === goalId && goal.userId === userId)),
      }));
    },
    async listNotifications(userId) {
      return getState().notifications
        .filter((notification) => notification.userId === userId)
        .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
    },
    async countUnreadNotifications(userId) {
      return getState().notifications.filter(
        (notification) => notification.userId === userId && !notification.isRead,
      ).length;
    },
    async createNotification(notification) {
      updateState((state) => ({
        ...state,
        notifications: [...state.notifications, notification],
      }));
      return notification;
    },
    async markNotificationRead(userId, notificationId) {
      updateState((state) => ({
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === notificationId && notification.userId === userId
            ? { ...notification, isRead: true }
            : notification,
        ),
      }));
    },
    async listReminders(userId) {
      return getState().reminders
        .filter((reminder) => reminder.userId === userId)
        .sort((left, right) => String(left.dueDate).localeCompare(String(right.dueDate)));
    },
    async listAllReminders() {
      return [...getState().reminders];
    },
    async createReminder(reminder) {
      updateState((state) => ({
        ...state,
        reminders: [...state.reminders, reminder],
      }));
      return reminder;
    },
    async touchReminder(reminderId, lastTriggered) {
      updateState((state) => ({
        ...state,
        reminders: state.reminders.map((reminder) =>
          reminder.id === reminderId ? { ...reminder, lastTriggered } : reminder,
        ),
      }));
    },
  };
};

const getNativeDatabase = async () => {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = (async () => {
    const consistency = await sqliteConnection.checkConnectionsConsistency().catch(() => ({ result: false }));
    const isConnection = await sqliteConnection.isConnection(DB_NAME, false).catch(() => ({ result: false }));

    const db = consistency.result && isConnection.result
      ? await sqliteConnection.retrieveConnection(DB_NAME, false)
      : await sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', 1, false);

    await db.open();
    await db.execute(schemaStatements);
    return db;
  })();

  return databasePromise;
};

const createNativeEngine = () => {
  const query = async (statement, values = []) => {
    const db = await getNativeDatabase();
    const result = await db.query(statement, values);
    return result.values || [];
  };

  const run = async (statement, values = []) => {
    const db = await getNativeDatabase();
    await db.run(statement, values);
  };

  return {
    async findUserByEmail(email) {
      const rows = await query(
        `SELECT id, name, email, password_hash AS passwordHash, created_at AS createdAt
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [email.toLowerCase()],
      );

      return mapUserRow(rows[0]);
    },
    async findUserById(id) {
      const rows = await query(
        `SELECT id, name, email, password_hash AS passwordHash, created_at AS createdAt
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [id],
      );

      return mapUserRow(rows[0]);
    },
    async createUser(user) {
      await run(
        `INSERT INTO users (id, name, email, password_hash, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, user.name, user.email, user.passwordHash, user.createdAt],
      );

      return user;
    },
    async listTransactions(userId) {
      const rows = await query(
        `SELECT id, user_id AS userId, type, amount, source, category,
                transaction_date AS transactionDate, note, description, created_at AS createdAt
         FROM transactions
         WHERE user_id = ?
         ORDER BY transaction_date DESC, created_at DESC`,
        [userId],
      );

      return rows.map(mapTransactionRow);
    },
    async createTransaction(transaction) {
      await run(
        `INSERT INTO transactions (
           id, user_id, type, amount, source, category, transaction_date, note, description, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.userId,
          transaction.type,
          transaction.amount,
          transaction.source,
          transaction.category,
          transaction.transactionDate,
          transaction.note,
          transaction.description,
          transaction.createdAt,
        ],
      );

      return transaction;
    },
    async deleteTransaction(userId, transactionId) {
      await run('DELETE FROM transactions WHERE id = ? AND user_id = ?', [transactionId, userId]);
    },
    async listBudgets(userId, month, year) {
      const rows = await query(
        `SELECT id, user_id AS userId, category, limit_amount AS limitAmount,
                month, year, created_at AS createdAt
         FROM budgets
         WHERE user_id = ? AND month = ? AND year = ?
         ORDER BY category ASC`,
        [userId, month, year],
      );

      return rows.map(mapBudgetRow);
    },
    async upsertBudget(budgetInput) {
      const existingRows = await query(
        `SELECT id, user_id AS userId, category, limit_amount AS limitAmount,
                month, year, created_at AS createdAt
         FROM budgets
         WHERE user_id = ? AND category = ? AND month = ? AND year = ?
         LIMIT 1`,
        [budgetInput.userId, budgetInput.category, budgetInput.month, budgetInput.year],
      );

      const existing = mapBudgetRow(existingRows[0]);

      if (existing) {
        await run('UPDATE budgets SET limit_amount = ? WHERE id = ?', [budgetInput.limitAmount, existing.id]);
        return {
          ...existing,
          limitAmount: Number(budgetInput.limitAmount),
        };
      }

      const budget = {
        id: createId(),
        createdAt: nowIso(),
        ...budgetInput,
      };

      await run(
        `INSERT INTO budgets (id, user_id, category, limit_amount, month, year, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          budget.id,
          budget.userId,
          budget.category,
          budget.limitAmount,
          budget.month,
          budget.year,
          budget.createdAt,
        ],
      );

      return budget;
    },
    async deleteBudget(userId, budgetId) {
      await run('DELETE FROM budgets WHERE id = ? AND user_id = ?', [budgetId, userId]);
    },
    async listGoals(userId) {
      const rows = await query(
        `SELECT id, user_id AS userId, title, target_amount AS targetAmount,
                current_amount AS currentAmount, deadline, created_at AS createdAt
         FROM goals
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId],
      );

      return rows.map(mapGoalRow);
    },
    async createGoal(goal) {
      await run(
        `INSERT INTO goals (id, user_id, title, target_amount, current_amount, deadline, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [goal.id, goal.userId, goal.title, goal.targetAmount, goal.currentAmount, goal.deadline, goal.createdAt],
      );

      return goal;
    },
    async incrementGoal(userId, goalId, amount) {
      const rows = await query(
        `SELECT id, user_id AS userId, title, target_amount AS targetAmount,
                current_amount AS currentAmount, deadline, created_at AS createdAt
         FROM goals
         WHERE id = ? AND user_id = ?
         LIMIT 1`,
        [goalId, userId],
      );

      const goal = mapGoalRow(rows[0]);
      if (!goal) {
        return null;
      }

      const currentAmount = Number(goal.currentAmount) + Number(amount);
      await run('UPDATE goals SET current_amount = ? WHERE id = ?', [currentAmount, goalId]);

      return {
        ...goal,
        currentAmount,
      };
    },
    async deleteGoal(userId, goalId) {
      await run('DELETE FROM goals WHERE id = ? AND user_id = ?', [goalId, userId]);
    },
    async listNotifications(userId) {
      const rows = await query(
        `SELECT id, user_id AS userId, type, message, is_read AS isRead, created_at AS createdAt
         FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId],
      );

      return rows.map(mapNotificationRow);
    },
    async countUnreadNotifications(userId) {
      const rows = await query(
        'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId],
      );

      return Number(rows[0]?.total || 0);
    },
    async createNotification(notification) {
      await run(
        `INSERT INTO notifications (id, user_id, type, message, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          notification.id,
          notification.userId,
          notification.type,
          notification.message,
          notification.isRead ? 1 : 0,
          notification.createdAt,
        ],
      );

      return notification;
    },
    async markNotificationRead(userId, notificationId) {
      await run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notificationId, userId]);
    },
    async listReminders(userId) {
      const rows = await query(
        `SELECT id, user_id AS userId, title, amount, due_date AS dueDate,
                frequency, last_triggered AS lastTriggered, created_at AS createdAt
         FROM payment_reminders
         WHERE user_id = ?
         ORDER BY due_date ASC`,
        [userId],
      );

      return rows.map(mapReminderRow);
    },
    async listAllReminders() {
      const rows = await query(
        `SELECT id, user_id AS userId, title, amount, due_date AS dueDate,
                frequency, last_triggered AS lastTriggered, created_at AS createdAt
         FROM payment_reminders`,
      );

      return rows.map(mapReminderRow);
    },
    async createReminder(reminder) {
      await run(
        `INSERT INTO payment_reminders (
           id, user_id, title, amount, due_date, frequency, last_triggered, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reminder.id,
          reminder.userId,
          reminder.title,
          reminder.amount,
          reminder.dueDate,
          reminder.frequency,
          reminder.lastTriggered,
          reminder.createdAt,
        ],
      );

      return reminder;
    },
    async touchReminder(reminderId, lastTriggered) {
      await run('UPDATE payment_reminders SET last_triggered = ? WHERE id = ?', [lastTriggered, reminderId]);
    },
  };
};

export const getLocalDataEngine = async () => {
  if (!enginePromise) {
    enginePromise = Promise.resolve(
      Capacitor.isNativePlatform() ? createNativeEngine() : createWebEngine(),
    );
  }

  return enginePromise;
};

export const buildUserRecord = ({ name, email, passwordHash }) => ({
  id: createId(),
  name: name.trim(),
  email: email.trim().toLowerCase(),
  passwordHash,
  createdAt: nowIso(),
});

export const buildTransactionRecord = ({ userId, type, amount, source, category, date, note, description }) => ({
  id: createId(),
  userId,
  type,
  amount: Number(amount),
  source: source ?? null,
  category: category ?? null,
  transactionDate: toDayString(date),
  note: note ?? null,
  description: description ?? null,
  createdAt: nowIso(),
});

export const buildGoalRecord = ({ userId, title, targetAmount, currentAmount, deadline }) => ({
  id: createId(),
  userId,
  title: title.trim(),
  targetAmount: Number(targetAmount),
  currentAmount: Number(currentAmount || 0),
  deadline: deadline ? toDayString(deadline) : null,
  createdAt: nowIso(),
});

export const buildReminderRecord = ({ userId, title, amount, dueDate, frequency }) => ({
  id: createId(),
  userId,
  title: title.trim(),
  amount: amount == null ? null : Number(amount),
  dueDate: toDayString(dueDate),
  frequency,
  lastTriggered: null,
  createdAt: nowIso(),
});

export const buildNotificationRecord = ({ userId, type, message }) => ({
  id: createId(),
  userId,
  type,
  message,
  isRead: false,
  createdAt: nowIso(),
});
