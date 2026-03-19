import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { connectDb, disconnectDb, pingDb } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import budgetsRoutes from './routes/budgets.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import { startReminderJob } from './jobs/reminderJob.js';

dotenv.config();

const app = express();

const parseEnvList = (value = '') =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    ...parseEnvList(process.env.CORS_ORIGINS),
    'http://localhost:5173',
    'http://localhost',
    'capacitor://localhost',
    'ionic://localhost',
  ].filter(Boolean),
);

const allowedOriginPatterns = [
  /^https:\/\/.*\.vercel\.app$/i,
  /^https:\/\/.*\.onrender\.com$/i,
  /^https:\/\/.*\.netlify\.app$/i,
];

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.has(origin) ||
        allowedOriginPatterns.some((pattern) => pattern.test(origin))
      ) {
        callback(null, true);
        return;
      }

      callback(new Error('Origen no permitido por CORS'));
    },
  }),
);
app.use(express.json());

app.get('/api/health', async (_req, res, next) => {
  try {
    await pingDb();
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/notifications', notificationsRoutes);

app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Datos invalidos',
      details: err.flatten(),
    });
  }

  if (err?.code === '23505') {
    return res.status(409).json({
      message: 'Registro duplicado para esta informacion',
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      message: 'Registro duplicado para esta informacion',
    });
  }

  if (err?.statusCode && err?.message) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Error interno del servidor' });
});

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  await connectDb();

  app.listen(port, host, () => {
    startReminderJob();
    console.log(`API ejecutandose en http://localhost:${port} y LAN http://${host}:${port}`);
  });
};

startServer().catch((error) => {
  console.error('No se pudo iniciar la API:', error);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await disconnectDb();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await disconnectDb();
  process.exit(0);
});
