# Frontend PulseBudget

Aplicacion React + Tailwind CSS v4 para control de finanzas personales.

## Comandos

- npm run dev
- npm run build
- npm run lint

## Configuracion

1. La aplicacion ya funciona en modo local sin backend.
2. En Android usa SQLite nativo dentro de la app.
3. En navegador usa persistencia local para desarrollo.
4. Las variables VITE_API_URL y VITE_ANDROID_API_URL ya no son necesarias para el modo local.

## Uso en movil totalmente local

1. Crea tu cuenta directamente en la app instalada.
2. Todos los usuarios, movimientos, presupuestos, metas, notificaciones y recordatorios quedan guardados en el dispositivo.
3. Para generar un APK nuevo ejecuta:
	- npm run build:android
4. Si necesitas abrir Android Studio ejecuta:
	- npm run android:open

Con este flujo, la app instalada ya no depende de Render, MongoDB Atlas ni de tu red local.

## Modulos UI incluidos

- Autenticacion (login/registro)
- Dashboard con graficas
- Registro de ingresos y gastos
- Historial con filtros y paginacion
- Presupuestos con alertas
- Metas de ahorro con aportes
- Notificaciones y recordatorios
- Exportacion PDF y Excel
- Modo oscuro y diseno responsive
