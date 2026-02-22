# 📱 Guía Rápida de Inicio - Document Viewer App

## ✅ Prerrequisitos Instalados

Asegúrate de tener lo siguiente:
- Node.js 18+ ([descargar](https://nodejs.org))
- npm (incluido con Node.js)
- Expo CLI: `npm install -g expo-cli`
- Android Studio o Xcode (opcional, para emuladores)

## 🚀 Pasos para Empezar

### 1. Instalar Dependencias
```bash
cd "app pdf"
npm install
```

### 2. Iniciar el Servidor Expo
```bash
npm start
```

Esto abrirá el menú interactivo de Expo. Verás opciones como:
```
› Press w to open web
› Press a to open Android
› Press i to open iOS simulator
› Press j to open debugger
› Press r to reload app
› Press m to toggle menu
```

### 3. Ejecutar en tu Dispositivo/Emulador

#### Opción A: Usando Emulador Android
```bash
npm run android
```

#### Opción B: Usando Simulador iOS (macOS)
```bash
npm run ios
```

#### Opción C: Usando tu Teléfono Real
1. Descarga la app "Expo Go" desde Play Store o App Store
2. Escanea el código QR que aparece en la terminal
3. La app se abrirá automáticamente

#### Opción D: Web (Pruebas rápidas)
```bash
npm run web
```

## 📂 Estructura Principal

```
app pdf/
├── src/
│   ├── screens/        → Las 2 pantallas principales
│   ├── components/     → Componentes reutilizables
│   ├── navigation/     → Configuración de rutas
│   ├── utils/         → Funciones auxiliares
│   └── types/         → Tipos TypeScript
├── App.tsx            → Componente raíz
├── app.json           → Configuración Expo
└── package.json       → Dependencias
```

## 🎮 Funcionalidades Principales

### 📄 Pantalla de Inicio
- Ver lista de documentos
- Agregar nuevos documentos (botón +)
- Eliminar documentos (ícono papelera)
- Compartir documentos (ícono compartir)
- Pull to refresh (deslizar hacia abajo)

### 👁️ Visor de Documentos
- Ver PDFs con zoom
- Navegar entre páginas (< >)
- Compartir documento
- Volver a la lista

## 🔧 Solución de Problemas

### Error: "Command not found: expo"
```bash
npm install -g expo-cli
```

### Error: "Port 8081 is already in use"
```bash
npm start -- --clear
```

### Cambios no se reflejan
Presiona `r` en la terminal para recargar

### Error con dependencias
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📦 Agregar Más Dependencias

Si necesitas agregar paquetes:
```bash
npm install nombre-del-paquete
# o
npx expo install nombre-del-paquete
```

## 🏗️ Compilación para Producción

Con EAS (Expo Application Services):
```bash
npm install -g eas-cli
eas login
eas build --platform android
eas build --platform ios
```

## 🎨 Personalización

Edita estos archivos para cambiar colores y estilos:
- `src/screens/HomeScreen.tsx` - Colores del header
- `src/screens/DocumentViewerScreen.tsx` - Colores del visor
- `src/components/DocumentCard.tsx` - Estilos de tarjetas

Color primario actual: `#0066cc`

## 💡 Tips Útiles

1. **Depuración en Chrome**: Presiona `j` cuando la app esté corriendo
2. **Modo oscuro**: Cambiar en `app.json`: `"userInterfaceStyle": "dark"`
3. **Logs**: Abre la terminal de Expo para ver console.log()
4. **Hot Reload**: Los cambios en JavaScript se cargan automáticamente

## 📚 Recursos Útiles

- [Documentación de Expo](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [TypeScript en React Native](https://www.typescriptlang.org)

## 🆘 Necesitas Ayuda?

1. Verifica `README.md` para documentación completa
2. Abre una issue en GitHub
3. Consulta los logs en la terminal

---

**¡Listo para empezar!** 🎉

Ejecuta `npm start` y elige cómo quieres probar la app.
