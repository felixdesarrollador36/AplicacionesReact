import { createElement, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  CircleAlert,
  Coins,
  Download,
  Goal,
  LogOut,
  Moon,
  PiggyBank,
  ShieldCheck,
  Sun,
  Trash2,
  Wallet,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AUTH_STORAGE_KEY, api, setAuthToken } from './lib/api';
import OcrCapture from './OcrCapture';

const CHART_COLORS = ['#0EA5E9', '#16A34A', '#EAB308', '#14532D', '#22C55E', '#0369A1'];
const PAGE_SIZE = 12;
const MODULE_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'movimientos', label: 'Movimientos' },
  { id: 'historial', label: 'Historial' },
  { id: 'presupuestos', label: 'Presupuestos' },
  { id: 'metas', label: 'Metas' },
  { id: 'notificaciones', label: 'Notificaciones' },
  { id: 'ocr', label: 'Captura OCR' },
 ];
const MODULE_IDS = new Set(MODULE_ITEMS.map((item) => item.id));

const getModuleFromHash = () => {
  if (typeof window === 'undefined') return 'dashboard';
  const hash = window.location.hash.replace('#', '').trim();
  return MODULE_IDS.has(hash) ? hash : 'dashboard';
};

const currencyFormatter = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
});

const monthFormatter = new Intl.DateTimeFormat('es-ES', {
  month: 'short',
  year: 'numeric',
});

const todayInput = () => new Date().toISOString().slice(0, 10);

const parseStoredAuth = () => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return { token: '', user: null };
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.user) {
      return { token: '', user: null };
    }

    return parsed;
  } catch {
    return { token: '', user: null };
  }
};

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const arrayBufferToBase64 = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

const formatMonthLabel = (value) => {
  if (!value || !value.includes('-')) return value;
  const [year, month] = value.split('-');
  return monthFormatter.format(new Date(Number(year), Number(month) - 1, 1));
};

const messageFromError = (error, fallbackMessage) => {
  return error?.response?.data?.message || fallbackMessage;
};

const MotionSection = motion.section;
const MotionDiv = motion.div;

const StatCard = ({ title, value, icon: Icon, tone }) => (
  <div
    className={clsx(
      'rounded-3xl border p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1',
      tone,
    )}
  >
    <div className="mb-4 flex items-center justify-between">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
        {title}
      </p>
      {createElement(Icon, { className: 'h-5 w-5' })}
    </div>
    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
  </div>
);

const Panel = ({ id, title, subtitle, actions, children }) => (
  <MotionSection
    id={id}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.35 }}
    className="panel rounded-3xl border border-white/65 bg-white/80 p-6 shadow-[0_25px_70px_-45px_rgba(15,23,42,.8)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/75"
  >
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
    {children}
  </MotionSection>
);

const AuthScreen = ({
  authMode,
  authForm,
  onModeChange,
  onFormChange,
  onSubmit,
  isSubmitting,
  theme,
  onThemeToggle,
}) => (
  <div className="relative min-h-screen overflow-hidden bg-slate-100 px-4 py-10 dark:bg-slate-950">
    <div className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full bg-emerald-500/35 blur-3xl" />
    <div className="pointer-events-none absolute -right-12 top-1/4 h-72 w-72 rounded-full bg-amber-300/35 blur-3xl dark:bg-sky-500/20" />

    <div className="mx-auto flex max-w-5xl items-center justify-between px-2 pb-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          Finanzas personales
        </p>
        <h1 className="font-display mt-2 text-4xl font-black text-slate-900 dark:text-white">
          Control total de tu dinero
        </h1>
      </div>
      <button
        type="button"
        onClick={onThemeToggle}
        className="rounded-2xl border border-white/70 bg-white/70 p-3 text-slate-700 transition-colors hover:bg-white dark:border-white/15 dark:bg-slate-900/75 dark:text-slate-100"
        aria-label="Cambiar tema"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </div>

    <MotionDiv
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2"
    >
      <article className="rounded-3xl border border-white/70 bg-white/70 p-8 shadow-[0_20px_60px_-40px_rgba(14,116,144,.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70">
        <p className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
          Lo que incluye
        </p>
        <ul className="space-y-5">
          <li className="flex items-start gap-3">
            <Wallet className="mt-1 h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Dashboard en tiempo real</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Balance, ingresos, gastos y ahorro mensual con graficas interactivas.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <PiggyBank className="mt-1 h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Presupuestos y metas</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Limites por categoria, alertas automaticas y avance de ahorro visual.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Autenticacion segura</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Inicio de sesion con token y sesion persistente para cada usuario.
              </p>
            </div>
          </li>
        </ul>
      </article>

      <article className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_25px_70px_-45px_rgba(15,23,42,.8)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/75">
        <div className="mb-6 flex gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => onModeChange('login')}
            className={clsx(
              'w-1/2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
              authMode === 'login'
                ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-300',
            )}
          >
            Iniciar sesion
          </button>
          <button
            type="button"
            onClick={() => onModeChange('register')}
            className={clsx(
              'w-1/2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
              authMode === 'register'
                ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-300',
            )}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {authMode === 'register' ? (
            <label className="block text-sm text-slate-700 dark:text-slate-200">
              Nombre
              <input
                type="text"
                name="name"
                value={authForm.name}
                onChange={onFormChange}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
          ) : null}

          <label className="block text-sm text-slate-700 dark:text-slate-200">
            Correo
            <input
              type="email"
              name="email"
              value={authForm.email}
              onChange={onFormChange}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>

          <label className="block text-sm text-slate-700 dark:text-slate-200">
            Contrasena
            <input
              type="password"
              name="password"
              value={authForm.password}
              onChange={onFormChange}
              required
              minLength={6}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-65 dark:bg-emerald-500 dark:text-slate-900 dark:hover:bg-emerald-400"
          >
            {isSubmitting ? 'Procesando...' : authMode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </article>
    </MotionDiv>
  </div>
);

function App() {
  const [ocrResult, setOcrResult] = useState(null);
  const [auth, setAuth] = useState(parseStoredAuth);
  const [theme, setTheme] = useState(() => {
    const saved = window.localStorage.getItem('finanzas_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [activeModule, setActiveModule] = useState(getModuleFromHash);

  const [summary, setSummary] = useState({
    balance: 0,
    monthIncome: 0,
    monthExpense: 0,
    monthSavings: 0,
  });
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [monthlyEvolution, setMonthlyEvolution] = useState([]);
  const [categories, setCategories] = useState([]);

  const [transactions, setTransactions] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ from: '', to: '', type: 'all', category: 'all' });

  const now = new Date();
  const [budgetPeriod, setBudgetPeriod] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [reminders, setReminders] = useState([]);

  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    source: '',
    date: todayInput(),
    note: '',
  });
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '',
    date: todayInput(),
    description: '',
  });
  const [budgetForm, setBudgetForm] = useState({
    category: '',
    limitAmount: '',
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
  });
  const [goalForm, setGoalForm] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
  });
  const [contributions, setContributions] = useState({});
  const [reminderForm, setReminderForm] = useState({
    title: '',
    amount: '',
    dueDate: todayInput(),
    frequency: 'once',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Number(totalTransactions) / PAGE_SIZE)),
    [totalTransactions],
  );

  const filterParams = useMemo(() => {
    const params = {};

    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.type !== 'all') params.type = filters.type;
    if (filters.category !== 'all') params.category = filters.category;

    return params;
  }, [filters.from, filters.to, filters.type, filters.category]);

  useEffect(() => {
    const syncModuleFromHash = () => {
      setActiveModule(getModuleFromHash());
    };

    syncModuleFromHash();
    window.addEventListener('hashchange', syncModuleFromHash);

    return () => {
      window.removeEventListener('hashchange', syncModuleFromHash);
    };
  }, []);

  useEffect(() => {
    setAuthToken(auth.token);
    if (auth.token) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
      return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [auth]);

  useEffect(() => {
    window.localStorage.setItem('finanzas_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!auth.token) return;

    let isCancelled = false;

    const loadAll = async () => {
      setIsLoading(true);
      setError('');

      try {
        const requests = [
          api.get('/dashboard/summary'),
          api.get('/dashboard/expenses-by-category'),
          api.get('/dashboard/monthly-evolution'),
          api.get('/transactions', {
            params: {
              ...filterParams,
              page,
              pageSize: PAGE_SIZE,
            },
          }),
          api.get('/transactions/categories'),
          api.get('/budgets', {
            params: { month: budgetPeriod.month, year: budgetPeriod.year },
          }),
          api.get('/goals'),
          api.get('/notifications'),
          api.get('/notifications/reminders'),
        ];

        const [
          summaryResponse,
          categoryResponse,
          monthlyResponse,
          transactionsResponse,
          categoriesResponse,
          budgetsResponse,
          goalsResponse,
          notificationsResponse,
          remindersResponse,
        ] = await Promise.all(requests);

        if (isCancelled) return;

        setSummary(summaryResponse.data);
        setExpensesByCategory(categoryResponse.data.items || []);
        setMonthlyEvolution(monthlyResponse.data.items || []);

        setTransactions(transactionsResponse.data.items || []);
        setTotalTransactions(transactionsResponse.data.total || 0);

        setCategories(categoriesResponse.data.categories || []);
        setBudgets(budgetsResponse.data.items || []);
        setGoals(goalsResponse.data.items || []);
        setNotifications(notificationsResponse.data.items || []);
        setUnreadNotifications(notificationsResponse.data.unread || 0);
        setReminders(remindersResponse.data.items || []);
      } catch (requestError) {
        if (isCancelled) return;

        if (requestError?.response?.status === 401) {
          setAuth({ token: '', user: null });
          setToast('La sesion expiro. Ingresa nuevamente.');
          return;
        }

        setError(messageFromError(requestError, 'No se pudo cargar la informacion.'));
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAll();

    return () => {
      isCancelled = true;
    };
  }, [auth.token, page, filterParams, budgetPeriod.month, budgetPeriod.year, reloadKey]);

  useEffect(() => {
    setBudgetForm((prev) => ({
      ...prev,
      month: String(budgetPeriod.month),
      year: String(budgetPeriod.year),
    }));
  }, [budgetPeriod.month, budgetPeriod.year]);

  const runAction = async (loadingKey, action, successMessage) => {
    setActionLoading(loadingKey);
    setError('');

    try {
      await action();
      setToast(successMessage);
      setReloadKey((prev) => prev + 1);
    } catch (requestError) {
      setError(messageFromError(requestError, 'Ocurrio un error al procesar la accion.'));
    } finally {
      setActionLoading('');
    }
  };

  const onAuthFormChange = (event) => {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  const onAuthSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setActionLoading('auth');

    try {
      const payload =
        authMode === 'login'
          ? {
              email: authForm.email,
              password: authForm.password,
            }
          : {
              name: authForm.name,
              email: authForm.email,
              password: authForm.password,
            };

      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const response = await api.post(endpoint, payload);

      setAuth({
        token: response.data.token,
        user: response.data.user,
      });

      setAuthForm({ name: '', email: '', password: '' });
      setToast(authMode === 'login' ? 'Bienvenido nuevamente.' : 'Cuenta creada correctamente.');
    } catch (requestError) {
      setError(messageFromError(requestError, 'No fue posible autenticar tu cuenta.'));
    } finally {
      setActionLoading('');
    }
  };

  const onLogout = () => {
    setAuth({ token: '', user: null });
    setToast('Sesion cerrada.');
  };

  const onIncomeSubmit = async (event) => {
    event.preventDefault();

    await runAction(
      'income',
      async () => {
        await api.post('/transactions/income', {
          amount: Number(incomeForm.amount),
          source: incomeForm.source,
          date: incomeForm.date,
          note: incomeForm.note || undefined,
        });

        setIncomeForm({ amount: '', source: '', date: todayInput(), note: '' });
        setPage(1);
      },
      'Ingreso registrado.',
    );
  };

  const onExpenseSubmit = async (event) => {
    event.preventDefault();

    await runAction(
      'expense',
      async () => {
        await api.post('/transactions/expense', {
          amount: Number(expenseForm.amount),
          category: expenseForm.category,
          date: expenseForm.date,
          description: expenseForm.description || undefined,
        });

        setExpenseForm({ amount: '', category: '', date: todayInput(), description: '' });
        setPage(1);
      },
      'Gasto registrado y presupuesto actualizado.',
    );
  };

  const onDeleteTransaction = async (transactionId) => {
    await runAction(
      `delete-${transactionId}`,
      async () => {
        await api.delete(`/transactions/${transactionId}`);
      },
      'Transaccion eliminada.',
    );
  };

  const onSetBudget = async (event) => {
    event.preventDefault();

    await runAction(
      'budget',
      async () => {
        await api.post('/budgets', {
          category: budgetForm.category,
          limitAmount: Number(budgetForm.limitAmount),
          month: Number(budgetForm.month),
          year: Number(budgetForm.year),
        });

        setBudgetForm((prev) => ({ ...prev, category: '', limitAmount: '' }));
      },
      'Presupuesto guardado.',
    );
  };

  const onDeleteBudget = async (budgetId) => {
    await runAction(
      `delete-budget-${budgetId}`,
      async () => {
        await api.delete(`/budgets/${budgetId}`);
      },
      'Presupuesto eliminado.',
    );
  };

  const onCreateGoal = async (event) => {
    event.preventDefault();

    await runAction(
      'goal',
      async () => {
        await api.post('/goals', {
          title: goalForm.title,
          targetAmount: Number(goalForm.targetAmount),
          currentAmount: goalForm.currentAmount ? Number(goalForm.currentAmount) : 0,
          deadline: goalForm.deadline || undefined,
        });

        setGoalForm({ title: '', targetAmount: '', currentAmount: '', deadline: '' });
      },
      'Meta creada con exito.',
    );
  };

  const onDeleteGoal = async (goalId) => {
    await runAction(
      `delete-goal-${goalId}`,
      async () => {
        await api.delete(`/goals/${goalId}`);
      },
      'Meta eliminada.',
    );
  };

  const onContributeGoal = async (goalId) => {
    const value = Number(contributions[goalId] || 0);
    if (!value || value <= 0) {
      setError('Ingresa un monto valido para aportar a la meta.');
      return;
    }

    await runAction(
      `contribute-goal-${goalId}`,
      async () => {
        await api.patch(`/goals/${goalId}/contribute`, { amount: value });
        setContributions((prev) => ({ ...prev, [goalId]: '' }));
      },
      'Aporte registrado en la meta.',
    );
  };

  const onCreateReminder = async (event) => {
    event.preventDefault();

    await runAction(
      'reminder',
      async () => {
        await api.post('/notifications/reminders', {
          title: reminderForm.title,
          amount: reminderForm.amount ? Number(reminderForm.amount) : undefined,
          dueDate: reminderForm.dueDate,
          frequency: reminderForm.frequency,
        });

        setReminderForm({
          title: '',
          amount: '',
          dueDate: todayInput(),
          frequency: 'once',
        });
      },
      'Recordatorio creado.',
    );
  };

  const onMarkNotificationAsRead = async (notificationId) => {
    await runAction(
      `notification-${notificationId}`,
      async () => {
        await api.patch(`/notifications/${notificationId}/read`);
      },
      'Notificacion marcada como leida.',
    );
  };

  const getRowsForExport = async () => {
    const response = await api.get('/transactions', {
      params: { ...filterParams, page: 1, pageSize: 500 },
    });

    return response.data.items || [];
  };

  const saveAndShareNativeFile = async (fileName, mimeType, arrayBuffer) => {
    const base64Data = arrayBufferToBase64(arrayBuffer);

    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
      recursive: true,
    });

    const fileUri = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Cache,
    });

    await Share.share({
      title: fileName,
      text: 'Archivo exportado desde CashControl',
      url: fileUri.uri,
      dialogTitle: 'Compartir archivo',
      files: [fileUri.uri],
      mimeType,
    });
  };

  const onExportExcel = async () => {
    setActionLoading('excel');
    setError('');

    try {
      const exportRows = await getRowsForExport();
      const data = exportRows.map((item) => ({
        Tipo: item.type === 'income' ? 'Ingreso' : 'Gasto',
        Monto: Number(item.amount),
        Fecha: item.transaction_date,
        Fuente: item.source || '-',
        Categoria: item.category || '-',
        Nota: item.note || item.description || '-',
      }));

      const sheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, 'Historial');

      const fileName = `historial-finanzas-${todayInput()}.xlsx`;

      if (Capacitor.isNativePlatform()) {
        const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        await saveAndShareNativeFile(
          fileName,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          excelData,
        );
      } else {
        XLSX.writeFile(workbook, fileName);
      }

      setToast('Exportacion Excel generada.');
    } catch (requestError) {
      setError(messageFromError(requestError, 'No se pudo exportar el archivo Excel.'));
    } finally {
      setActionLoading('');
    }
  };

  const onExportPdf = async () => {
    setActionLoading('pdf');
    setError('');

    try {
      const exportRows = await getRowsForExport();
      const pdf = new jsPDF({ orientation: 'portrait' });

      pdf.setFontSize(16);
      pdf.text('Historial de Finanzas', 14, 18);
      pdf.setFontSize(11);
      pdf.text(`Fecha de exportacion: ${todayInput()}`, 14, 26);

      autoTable(pdf, {
        startY: 32,
        head: [['Tipo', 'Monto', 'Fecha', 'Fuente/Categoria', 'Detalle']],
        body: exportRows.map((item) => [
          item.type === 'income' ? 'Ingreso' : 'Gasto',
          formatCurrency(item.amount),
          item.transaction_date,
          item.type === 'income' ? item.source || '-' : item.category || '-',
          item.note || item.description || '-',
        ]),
        styles: {
          fontSize: 9,
        },
        headStyles: {
          fillColor: [38, 70, 83],
        },
      });

      const fileName = `historial-finanzas-${todayInput()}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const pdfData = pdf.output('arraybuffer');
        await saveAndShareNativeFile(fileName, 'application/pdf', pdfData);
      } else {
        pdf.save(fileName);
      }

      setToast('Exportacion PDF generada.');
    } catch (requestError) {
      setError(messageFromError(requestError, 'No se pudo exportar el PDF.'));
    } finally {
      setActionLoading('');
    }
  };

  if (!auth.token) {
    return (
      <AuthScreen
        authMode={authMode}
        authForm={authForm}
        onModeChange={setAuthMode}
        onFormChange={onAuthFormChange}
        onSubmit={onAuthSubmit}
        isSubmitting={actionLoading === 'auth'}
        theme={theme}
        onThemeToggle={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-100 pb-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-72 h-80 w-80 rounded-full bg-amber-300/25 blur-3xl dark:bg-emerald-500/20" />

      <header className="sticky top-0 z-20 border-b border-white/55 bg-slate-100/75 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              Panel financiero
            </p>
            <h1 className="font-display text-2xl font-black text-slate-900 dark:text-white">CashControl</h1>
          </div>

          <nav className="hidden gap-2 xl:flex">
            {MODULE_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveModule(item.id)}
                className={clsx(
                  'rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
                  item.id === activeModule
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-200'
                    : 'border-slate-200 bg-white/80 text-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:text-emerald-300',
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className="rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-700 transition-colors hover:bg-white dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <span className="rounded-xl border border-slate-200 bg-white/85 px-3 py-1.5 text-sm dark:border-white/10 dark:bg-slate-900">
              {auth.user?.name}
            </span>

            <div className="relative rounded-xl border border-slate-200 bg-white/85 px-3 py-1.5 text-sm dark:border-white/10 dark:bg-slate-900">
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadNotifications}
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-emerald-500 dark:text-slate-900 dark:hover:bg-emerald-400"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 pt-6 lg:px-8">
        {/* <OcrCapture onResult={setOcrResult} /> */}
        {/* Bloque antiguo de resultado OCR individual eliminado */}
        {activeModule === 'ocr' && (
          <>
            <OcrCapture onResult={setOcrResult} />
            {Array.isArray(ocrResult) && ocrResult.length > 0 && (
              <div className="my-4 p-4 border rounded bg-green-50 text-green-900">
                <b>Resultados detectados:</b>
                {ocrResult.map((res, idx) => (
                  <div key={idx} className="mb-2 p-2 border-b last:border-b-0">
                    <div><b>Texto:</b> {res.text}</div>
                    <div><b>Monto:</b> {res.monto}</div>
                    <div><b>Tipo:</b> {res.tipo}</div>
                    <div className="flex gap-2 mt-2">
                      {res.tipo === 'ingreso' && (
                        <button
                          className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          disabled={actionLoading === `ocr-income-${idx}`}
                          onClick={async () => {
                            setActionLoading(`ocr-income-${idx}`);
                            setError('');
                            try {
                              await api.post('/transactions/income', {
                                amount: res.monto,
                                source: 'OCR',
                                date: todayInput(),
                                note: res.text,
                              });
                              setToast('Ingreso guardado.');
                              setOcrResult((prev) => prev.filter((_, i) => i !== idx));
                              setReloadKey((prev) => prev + 1);
                            } catch (err) {
                              setError('No se pudo guardar el ingreso.');
                            } finally {
                              setActionLoading('');
                            }
                          }}
                        >
                          Guardar como ingreso
                        </button>
                      )}
                      {res.tipo === 'gasto' && (
                        <button
                          className="px-3 py-1 bg-rose-600 text-white rounded hover:bg-rose-700"
                          disabled={actionLoading === `ocr-expense-${idx}`}
                          onClick={async () => {
                            setActionLoading(`ocr-expense-${idx}`);
                            setError('');
                            try {
                              await api.post('/transactions/expense', {
                                amount: res.monto,
                                category: 'OCR',
                                date: todayInput(),
                                description: res.text,
                              });
                              setToast('Gasto guardado.');
                              setOcrResult((prev) => prev.filter((_, i) => i !== idx));
                              setReloadKey((prev) => prev + 1);
                            } catch (err) {
                              setError('No se pudo guardar el gasto.');
                            } finally {
                              setActionLoading('');
                            }
                          }}
                        >
                          Guardar como gasto
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  className="mt-2 px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  onClick={() => setOcrResult(null)}
                >
                  Cancelar todo
                </button>
              </div>
            )}
          </>
        )}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 xl:hidden">
          {MODULE_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveModule(item.id)}
              className={clsx(
                'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
                item.id === activeModule
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-200'
                  : 'border-slate-200 bg-white/80 text-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:text-emerald-300',
              )}
            >
              {item.label}
            </a>
          ))}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {toast ? (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/45 dark:text-emerald-200">
            {toast}
          </div>
        ) : null}

        {activeModule === 'dashboard' ? (
          <Panel
            id="dashboard"
            title="Dashboard"
            subtitle="Vision general de tu salud financiera"
          >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Balance actual"
              value={formatCurrency(summary.balance)}
              icon={Wallet}
              tone="border-emerald-200/80 bg-emerald-50/75 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200"
            />
            <StatCard
              title="Ingresos del mes"
              value={formatCurrency(summary.monthIncome)}
              icon={ArrowUpCircle}
              tone="border-emerald-200/80 bg-emerald-50/75 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200"
            />
            <StatCard
              title="Gastos del mes"
              value={formatCurrency(summary.monthExpense)}
              icon={ArrowDownCircle}
              tone="border-rose-200/80 bg-rose-50/75 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200"
            />
            <StatCard
              title="Ahorro automatico"
              value={formatCurrency(summary.monthSavings)}
              icon={PiggyBank}
              tone="border-amber-200/80 bg-amber-50/75 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200"
            />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-900/70">
              <h3 className="mb-3 font-semibold">Gastos por categoria (mes actual)</h3>
              <div className="h-72">
                {expensesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        dataKey="total"
                        nameKey="category"
                        outerRadius={100}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-300">
                    Registra gastos para visualizar la grafica.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-900/70">
              <h3 className="mb-3 font-semibold">Evolucion mensual</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyEvolution} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.35)" />
                    <XAxis dataKey="month" tickFormatter={formatMonthLabel} />
                    <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                    <Tooltip
                      labelFormatter={(value) => formatMonthLabel(value)}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="income" name="Ingresos" stroke="#2A9D8F" strokeWidth={3} />
                    <Line type="monotone" dataKey="expense" name="Gastos" stroke="#E76F51" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          </Panel>
        ) : null}

        {activeModule === 'movimientos' ? (
          <Panel id="movimientos" title="Registro de movimientos" subtitle="Captura ingresos y gastos de forma rapida">
          <div className="grid gap-4 xl:grid-cols-2">
            <form
              onSubmit={onIncomeSubmit}
              className="space-y-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/25"
            >
              <h3 className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-200">
                <ArrowUpCircle className="h-5 w-5" />
                Nuevo ingreso
              </h3>
              <label className="block text-sm">
                Monto
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={incomeForm.amount}
                  onChange={(event) => setIncomeForm((prev) => ({ ...prev, amount: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-emerald-900 dark:bg-slate-900"
                />
              </label>
              <label className="block text-sm">
                Fuente
                <input
                  type="text"
                  required
                  value={incomeForm.source}
                  onChange={(event) => setIncomeForm((prev) => ({ ...prev, source: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-emerald-900 dark:bg-slate-900"
                />
              </label>
              <label className="block text-sm">
                Fecha
                <input
                  type="date"
                  required
                  value={incomeForm.date}
                  onChange={(event) => setIncomeForm((prev) => ({ ...prev, date: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-emerald-900 dark:bg-slate-900"
                />
              </label>
              <label className="block text-sm">
                Nota
                <textarea
                  rows={2}
                  value={incomeForm.note}
                  onChange={(event) => setIncomeForm((prev) => ({ ...prev, note: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-emerald-900 dark:bg-slate-900"
                />
              </label>
              <button
                type="submit"
                disabled={actionLoading === 'income'}
                className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-65"
              >
                {actionLoading === 'income' ? 'Guardando...' : 'Guardar ingreso'}
              </button>
            </form>

            <form
              onSubmit={onExpenseSubmit}
              className="space-y-3 rounded-2xl border border-rose-200/80 bg-rose-50/60 p-4 dark:border-rose-900/70 dark:bg-rose-950/25"
            >
              <h3 className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-200">
                <ArrowDownCircle className="h-5 w-5" />
                Nuevo gasto
              </h3>
              <label className="block text-sm">
                Monto
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={expenseForm.amount}
                  onChange={(event) => setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 outline-none ring-rose-500 focus:ring-2 dark:border-rose-900 dark:bg-slate-900"
                />
              </label>
              <label className="block text-sm">
                Categoria
                <input
                  type="text"
                  required
                  value={expenseForm.category}
                  onChange={(event) => setExpenseForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 outline-none ring-rose-500 focus:ring-2 dark:border-rose-900 dark:bg-slate-900"
                />
              </label>
              <label className="block text-sm">
                Fecha
                <input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={(event) => setExpenseForm((prev) => ({ ...prev, date: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 outline-none ring-rose-500 focus:ring-2 dark:border-rose-900 dark:bg-slate-900"
                />
              </label>
              <label className="block text-sm">
                Descripcion
                <textarea
                  rows={2}
                  value={expenseForm.description}
                  onChange={(event) => setExpenseForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 outline-none ring-rose-500 focus:ring-2 dark:border-rose-900 dark:bg-slate-900"
                />
              </label>
              <button
                type="submit"
                disabled={actionLoading === 'expense'}
                className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-65"
              >
                {actionLoading === 'expense' ? 'Guardando...' : 'Guardar gasto'}
              </button>
            </form>
          </div>
          </Panel>
        ) : null}

        {activeModule === 'historial' ? (
          <Panel
            id="historial"
            title="Historial"
            subtitle="Filtra movimientos por fecha, tipo y categoria"
            actions={[
            <button
              key="excel"
              type="button"
              onClick={onExportExcel}
              disabled={actionLoading === 'excel'}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-65 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
            >
              <Download className="h-4 w-4" />
              {actionLoading === 'excel' ? 'Exportando...' : 'Exportar Excel'}
            </button>,
            <button
              key="pdf"
              type="button"
              onClick={onExportPdf}
              disabled={actionLoading === 'pdf'}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-65 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
            >
              <Download className="h-4 w-4" />
              {actionLoading === 'pdf' ? 'Exportando...' : 'Exportar PDF'}
            </button>,
          ]}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="text-sm">
              Desde
              <input
                type="date"
                value={filters.from}
                onChange={(event) => {
                  setFilters((prev) => ({ ...prev, from: event.target.value }));
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
              />
            </label>
            <label className="text-sm">
              Hasta
              <input
                type="date"
                value={filters.to}
                onChange={(event) => {
                  setFilters((prev) => ({ ...prev, to: event.target.value }));
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
              />
            </label>
            <label className="text-sm">
              Tipo
              <select
                value={filters.type}
                onChange={(event) => {
                  setFilters((prev) => ({ ...prev, type: event.target.value }));
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
              >
                <option value="all">Todos</option>
                <option value="income">Ingresos</option>
                <option value="expense">Gastos</option>
              </select>
            </label>
            <label className="text-sm xl:col-span-2">
              Categoria
              <select
                value={filters.category}
                onChange={(event) => {
                  setFilters((prev) => ({ ...prev, category: event.target.value }));
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
              >
                <option value="all">Todas</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-900">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Tipo</th>
                    <th className="px-3 py-2 text-left font-semibold">Monto</th>
                    <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                    <th className="px-3 py-2 text-left font-semibold">Categoria / Fuente</th>
                    <th className="px-3 py-2 text-left font-semibold">Descripcion / Nota</th>
                    <th className="px-3 py-2 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-slate-500 dark:text-slate-300">
                        No hay transacciones para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-t border-slate-200 dark:border-white/10">
                        <td className="px-3 py-3">
                          <span
                            className={clsx(
                              'rounded-full px-2 py-1 text-xs font-semibold',
                              transaction.type === 'income'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-200',
                            )}
                          >
                            {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-semibold">{formatCurrency(transaction.amount)}</td>
                        <td className="px-3 py-3">{transaction.transaction_date}</td>
                        <td className="px-3 py-3">{transaction.source || transaction.category || '-'}</td>
                        <td className="max-w-xs truncate px-3 py-3">{transaction.note || transaction.description || '-'}</td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(transaction.id)}
                            disabled={actionLoading === `delete-${transaction.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-400 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-65 dark:border-white/10 dark:text-slate-200"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-slate-500 dark:text-slate-300">
              Mostrando pagina {page} de {totalPages} ({totalTransactions} movimientos)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10"
              >
                Siguiente
              </button>
            </div>
          </div>
          </Panel>
        ) : null}

        {activeModule === 'presupuestos' ? (
          <Panel id="presupuestos" title="Presupuestos" subtitle="Define limites por categoria y sigue su progreso mensual">
          <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
            <form onSubmit={onSetBudget} className="space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/65">
              <label className="block text-sm">
                Categoria
                <input
                  type="text"
                  required
                  value={budgetForm.category}
                  onChange={(event) => setBudgetForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
                />
              </label>
              <label className="block text-sm">
                Limite
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={budgetForm.limitAmount}
                  onChange={(event) => setBudgetForm((prev) => ({ ...prev, limitAmount: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Mes
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={budgetForm.month}
                    onChange={(event) => setBudgetForm((prev) => ({ ...prev, month: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
                  />
                </label>
                <label className="text-sm">
                  Anio
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    required
                    value={budgetForm.year}
                    onChange={(event) => setBudgetForm((prev) => ({ ...prev, year: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={actionLoading === 'budget'}
                className="w-full rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-65 dark:bg-emerald-500 dark:text-slate-900 dark:hover:bg-emerald-400"
              >
                {actionLoading === 'budget' ? 'Guardando...' : 'Guardar presupuesto'}
              </button>
            </form>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/65">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">Progreso por categoria</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={budgetPeriod.month}
                    onChange={(event) =>
                      setBudgetPeriod((prev) => ({ ...prev, month: Number(event.target.value) || prev.month }))
                    }
                    className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none dark:border-white/10 dark:bg-slate-900"
                  />
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={budgetPeriod.year}
                    onChange={(event) =>
                      setBudgetPeriod((prev) => ({ ...prev, year: Number(event.target.value) || prev.year }))
                    }
                    className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none dark:border-white/10 dark:bg-slate-900"
                  />
                </div>
              </div>

              {budgets.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                  No hay presupuestos configurados para este periodo.
                </p>
              ) : (
                budgets.map((budget) => (
                  <div key={budget.id} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{budget.category}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">
                          {formatCurrency(budget.spentAmount)} de {formatCurrency(budget.limitAmount)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteBudget(budget.id)}
                        disabled={actionLoading === `delete-budget-${budget.id}`}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-rose-400 hover:text-rose-700 dark:border-white/10 dark:text-slate-200"
                      >
                        Eliminar
                      </button>
                    </div>

                    <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all',
                          budget.exceeded ? 'bg-rose-500' : 'bg-emerald-500',
                        )}
                        style={{ width: `${Math.min(budget.progress, 100)}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span>{Math.round(budget.progress)}%</span>
                      {budget.exceeded ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-300">
                          <CircleAlert className="h-3.5 w-3.5" />
                          Limite superado
                        </span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-300">Dentro del limite</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          </Panel>
        ) : null}

        {activeModule === 'metas' ? (
          <Panel id="metas" title="Metas de ahorro" subtitle="Visualiza progreso y agrega aportes facilmente">
          <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
            <form onSubmit={onCreateGoal} className="space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/65">
              <label className="block text-sm">
                Titulo
                <input
                  type="text"
                  required
                  value={goalForm.title}
                  onChange={(event) => setGoalForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
                />
              </label>
              <label className="block text-sm">
                Monto objetivo
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={goalForm.targetAmount}
                  onChange={(event) => setGoalForm((prev) => ({ ...prev, targetAmount: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
                />
              </label>
              <label className="block text-sm">
                Monto actual (opcional)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={goalForm.currentAmount}
                  onChange={(event) => setGoalForm((prev) => ({ ...prev, currentAmount: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
                />
              </label>
              <label className="block text-sm">
                Fecha limite (opcional)
                <input
                  type="date"
                  value={goalForm.deadline}
                  onChange={(event) => setGoalForm((prev) => ({ ...prev, deadline: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
                />
              </label>

              <button
                type="submit"
                disabled={actionLoading === 'goal'}
                className="w-full rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-65 dark:bg-emerald-500 dark:text-slate-900 dark:hover:bg-emerald-400"
              >
                {actionLoading === 'goal' ? 'Guardando...' : 'Crear meta'}
              </button>
            </form>

            <div className="grid gap-3 md:grid-cols-2">
              {goals.length === 0 ? (
                <p className="md:col-span-2 rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                  Crea tu primera meta de ahorro.
                </p>
              ) : (
                goals.map((goal) => (
                  <article key={goal.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/65">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{goal.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">
                          {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(goal.id)}
                        disabled={actionLoading === `delete-goal-${goal.id}`}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-rose-400 hover:text-rose-700 dark:border-white/10 dark:text-slate-200"
                      >
                        Eliminar
                      </button>
                    </div>

                    <div className="mb-1 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all"
                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
                      />
                    </div>
                    <p className="mb-3 text-xs text-slate-500 dark:text-slate-300">
                      {Math.round(goal.progress)}% completado
                      {goal.deadline ? ` â€¢ Meta al ${goal.deadline}` : ''}
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Aportar"
                        value={contributions[goal.id] || ''}
                        onChange={(event) =>
                          setContributions((prev) => ({ ...prev, [goal.id]: event.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => onContributeGoal(goal.id)}
                        disabled={actionLoading === `contribute-goal-${goal.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-65"
                      >
                        <Goal className="h-4 w-4" />
                        Aportar
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
          </Panel>
        ) : null}

        {activeModule === 'notificaciones' ? (
          <Panel id="notificaciones" title="Notificaciones y recordatorios" subtitle="Alertas de gasto y pagos programados">
          <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
            <form onSubmit={onCreateReminder} className="space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/65">
              <h3 className="font-semibold">Nuevo recordatorio de pago</h3>
              <label className="block text-sm">
                Titulo
                <input
                  type="text"
                  required
                  value={reminderForm.title}
                  onChange={(event) => setReminderForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
                />
              </label>
              <label className="block text-sm">
                Monto (opcional)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={reminderForm.amount}
                  onChange={(event) => setReminderForm((prev) => ({ ...prev, amount: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
                />
              </label>
              <label className="block text-sm">
                Fecha
                <input
                  type="date"
                  required
                  value={reminderForm.dueDate}
                  onChange={(event) => setReminderForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
                />
              </label>
              <label className="block text-sm">
                Frecuencia
                <select
                  value={reminderForm.frequency}
                  onChange={(event) => setReminderForm((prev) => ({ ...prev, frequency: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-emerald-500 focus:ring-2 dark:border-white/10 dark:bg-slate-900"
                >
                  <option value="once">Una sola vez</option>
                  <option value="monthly">Mensual</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={actionLoading === 'reminder'}
                className="w-full rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-65 dark:bg-emerald-500 dark:text-slate-900 dark:hover:bg-emerald-400"
              >
                {actionLoading === 'reminder' ? 'Guardando...' : 'Crear recordatorio'}
              </button>
            </form>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/65">
                <h3 className="mb-3 font-semibold">Recordatorios activos</h3>
                <div className="space-y-2">
                  {reminders.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-300">No hay recordatorios activos.</p>
                  ) : (
                    reminders.map((reminder) => (
                      <div key={reminder.id} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                        <p className="font-medium">{reminder.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">
                          {reminder.frequency === 'monthly' ? 'Mensual' : 'Unico'} â€¢ {reminder.due_date}
                        </p>
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          {reminder.amount ? formatCurrency(reminder.amount) : 'Sin monto definido'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/65">
                <h3 className="mb-3 font-semibold">Centro de alertas</h3>
                <div className="space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-300">Sin notificaciones nuevas.</p>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={clsx(
                          'rounded-xl border p-3',
                          notification.is_read
                            ? 'border-slate-200 opacity-65 dark:border-white/10'
                            : 'border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/20',
                        )}
                      >
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">{notification.type}</p>
                          {!notification.is_read ? (
                            <button
                              type="button"
                              onClick={() => onMarkNotificationAsRead(notification.id)}
                              disabled={actionLoading === `notification-${notification.id}`}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-white/10 dark:text-slate-200"
                            >
                              Marcar leida
                            </button>
                          ) : null}
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-200">{notification.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          </Panel>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
            Actualizando datos...
          </div>
        ) : null}

        <footer className="px-1 pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-300/75 bg-white/70 px-3 py-1 dark:border-white/10 dark:bg-slate-900/60">
            <Coins className="h-3.5 w-3.5" />
            Finanzas personales modernas con React, Tailwind, Express y PostgreSQL.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;

