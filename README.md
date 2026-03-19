# PulseBudget - Finanzas Personales Fullstack

Aplicacion web moderna de finanzas personales para registrar ingresos y gastos, con dashboard visual, presupuestos, metas, notificaciones y exportaciones.

## Stack

- Frontend: React + Tailwind CSS v4 + Recharts + Framer Motion
- Backend: Node.js + Express
- Base de datos: MongoDB (Mongoose)
- Auth: JWT

## Funcionalidades implementadas

- Registro de ingresos:
  - Monto
  - Fuente
  - Fecha
  - Nota
- Registro de gastos:
  - Monto
  - Categoria
  - Fecha
  - Descripcion
- Dashboard:
  - Balance actual
  - Total ingresos del mes
  - Total gastos del mes
  - Ahorro mensual calculado automaticamente
  - Grafica de gastos por categoria
  - Grafica de evolucion mensual
- Historial:
  - Lista de transacciones
  - Filtros por fecha, tipo y categoria
  - Paginacion
- Presupuestos:
  - Limite por categoria y periodo
  - Progreso visual
  - Alertas al superar limite
- Metas:
  - Creacion de metas de ahorro
  - Aportes
  - Progreso visual por meta
- Notificaciones:
  - Alertas de gasto por presupuesto excedido
  - Recordatorios de pagos (unico y mensual)
- Extras:
  - Exportar historial a Excel
  - Exportar historial a PDF
  - Sistema de autenticacion (registro, login, sesion)
- UX/UI:
  - Estilo fintech moderno
  - Modo oscuro manual
  - Responsive (movil y desktop)
  - Animaciones suaves

## Estructura

- backend: API Express, SQL y logica de negocio
- frontend: app React + Tailwind

## Configuracion rapida

### 1) Backend

1. Copia archivo de entorno:
   - backend/.env.example -> backend/.env
2. Ajusta conexion MongoDB en MONGODB_URI.
3. Instala dependencias:
   - npm install
4. Aplica migracion (crea indices y colecciones):
   - npm run db:migrate
5. Inicia API:
   - npm run dev

API disponible en http://localhost:4000

### 2) Frontend

1. Copia archivo de entorno:
   - frontend/.env.example -> frontend/.env
2. Verifica URL de API en VITE_API_URL.
3. Instala dependencias:
   - npm install
4. Inicia frontend:
   - npm run dev

Frontend disponible en http://localhost:5173

## Endpoints principales

- Auth:
  - POST /api/auth/register
  - POST /api/auth/login
  - GET /api/auth/me
- Transacciones:
  - POST /api/transactions/income
  - POST /api/transactions/expense
  - GET /api/transactions
  - GET /api/transactions/categories
  - DELETE /api/transactions/:id
- Dashboard:
  - GET /api/dashboard/summary
  - GET /api/dashboard/expenses-by-category
  - GET /api/dashboard/monthly-evolution
- Presupuestos:
  - GET /api/budgets
  - POST /api/budgets
  - DELETE /api/budgets/:id
- Metas:
  - GET /api/goals
  - POST /api/goals
  - PATCH /api/goals/:id/contribute
  - DELETE /api/goals/:id
- Notificaciones:
  - GET /api/notifications
  - PATCH /api/notifications/:id/read
  - POST /api/notifications/reminders
  - GET /api/notifications/reminders

## Notas

- El job de recordatorios corre diariamente a las 09:00 (hora del servidor) usando node-cron.
- Si trabajas con MongoDB Atlas, usa el connection string SRV en MONGODB_URI.

## Despliegue en la nube (Render + MongoDB Atlas)

1. Sube el proyecto a un repositorio en GitHub.
2. En Render, crea un nuevo Blueprint apuntando al repositorio.
3. Render detectara automaticamente el archivo render.yaml de la raiz y creara:
  - Servicio backend Node.js.
4. En el servicio de Render configura la variable MONGODB_URI con tu URI de Atlas.
  - Formato: mongodb+srv://usuario:password@cluster.mongodb.net/pulsebudget
5. Espera a que termine el deploy y copia la URL publica del backend.
  - Ejemplo: https://tu-api.onrender.com
6. Actualiza frontend/.env con la URL publica:
  - VITE_API_URL=https://tu-api.onrender.com/api
  - VITE_ANDROID_API_URL=https://tu-api.onrender.com/api
7. Vuelve a generar el APK para que use la API en nube.

Con este flujo, el movil ya no depende de tu red local, firewall o PC encendida.
