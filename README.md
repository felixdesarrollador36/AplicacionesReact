# Visor de Documentos React Native

Una aplicación móvil profesional para visualizar y gestionar documentos PDF, Word (.docx) y Excel (.xlsx) en dispositivos Android e iOS.

## 🚀 Características Principales

- **Visualización de PDF**: Soporte completo para archivos PDF con zoom y navegación por páginas
- **Gestión de Documentos**: Agregar, eliminar y compartir documentos
- **Múltiples Formatos**: Soporte para PDF, Word (.docx) y Excel (.xlsx)
- **Interfaz Responsiva**: Diseño moderno y limpio que se adapta a todos los tamaños de pantalla
- **Navegación Intuitiva**: Sistema de navegación fluido con React Navigation
- **Compatible con Android e iOS**: Funciona perfectamente en ambas plataformas

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- npm o yarn
- Expo CLI: `npm install -g expo-cli`
- Para iOS: Xcode (en macOS)
- Para Android: Android Studio o SDK Tools

## 🛠️ Instalación

1. **Navega a la carpeta del proyecto**:
   ```bash
   cd "app pdf"
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Inicia la aplicación**:
   ```bash
   npm start
   # o
   yarn start
   ```

## 🚀 Ejecución en Dispositivos

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

### Web (Pruebas)
```bash
npm run web
```

## 📁 Estructura del Proyecto

```
app pdf/
├── src/
│   ├── screens/          # Pantallas de la aplicación
│   │   ├── HomeScreen.tsx
│   │   └── DocumentViewerScreen.tsx
│   ├── components/       # Componentes reutilizables
│   │   ├── DocumentCard.tsx
│   │   ├── LoadingIndicator.tsx
│   │   ├── EmptyState.tsx
│   │   └── Divider.tsx
│   ├── navigation/       # Configuración de navegación
│   │   └── RootNavigator.tsx
│   ├── utils/           # Utilidades y servicios
│   │   ├── fileUtils.ts
│   │   └── documentService.ts
│   └── types/           # Tipos TypeScript
│       └── index.ts
├── assets/              # Recursos (iconos, splash, etc.)
├── App.tsx              # Componente raíz
├── app.json             # Configuración de Expo
├── eas.json             # Configuración de Expo Application Services
├── babel.config.js      # Configuración de Babel
├── tsconfig.json        # Configuración de TypeScript
└── package.json         # Dependencias del proyecto
```

## 📦 Dependencias Principales

- **react-native-pdf**: Visualización de archivos PDF
- **react-native-file-viewer**: Visor de archivos múltiples
- **@react-navigation**: Sistema de navegación
- **expo**: Framework para desarrollo móvil
- **react-native-vector-icons**: Iconos Material Design
- **react-native-gesture-handler**: Manejo de gestos
- **react-native-reanimated**: Animaciones suaves

## 🎯 Funcionalidades

### Pantalla de Inicio (Home)
- Lista de documentos disponibles en el dispositivo
- Información de cada documento (nombre, tamaño, fecha)
- Botón para agregar nuevos documentos
- Opción para eliminar documentos
- Opción para compartir documentos
- Actualización con pull-to-refresh

### Visualización de Documentos
- Visor completo de PDF con zoom
- Navegación por páginas en PDF
- Mensajes informativos para formatos no soportados
- Opción para compartir el documento
- Barra de controles personalizada

## 🔐 Permisos Requeridos

### Android
- `READ_EXTERNAL_STORAGE`: Lectura de archivos del dispositivo
- `WRITE_EXTERNAL_STORAGE`: Escritura de archivos

### iOS
- Acceso al sistema de archivos del dispositivo

## 🌐 Configuración de Expo

El proyecto incluye configuración para EAS (Expo Application Services) que permite:
- Compilación en la nube para iOS y Android
- Gestión de compilaciones de producción
- Distribución automática

Edita `eas.json` para personalizar la configuración de compilación.

## 🎨 Personalización

### Colores
Los colores principales se pueden cambiar en los archivos de estilos:
- Azul primario: `#0066cc`
- Gris claro: `#f5f5f5`
- Texto oscuro: `#1a1a1a`

### Tipografía
Utiliza las fuentes por defecto del sistema operativo para mejor rendimiento.

## 🚨 Solución de Problemas

### La aplicación no inicia
1. Limpia la caché: `npm cache clean --force`
2. Reinstala dependencias: `rm -rf node_modules && npm install`
3. Limpia el caché de Expo: `expo cache clean`

### Problemas con permisos en Android
- Asegúrate de otorgar permisos al abrir la app
- En Android 6+, los permisos se solicitan en tiempo de ejecución

### PDF no se visualiza
- Verifica que el archivo PDF sea válido
- Intenta con otro PDF para descartar problemas del archivo

## 📱 Características Futuras

- [ ] Búsqueda de documentos
- [ ] Favoritos/Marcadores
- [ ] Anotaciones en PDF
- [ ] Sincronización en la nube
- [ ] Historial de documentos abiertos
- [ ] Visor integrado de Word y Excel
- [ ] Gestión de carpetas

## 📄 Licencia

Este proyecto es de uso libre. Siéntete libre de modificarlo según tus necesidades.

## 👨‍💻 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Haz un fork del proyecto
2. Crea una rama para tu feature
3. Envía un pull request

## 📞 Soporte

Si encuentras problemas o tienes sugerencias, por favor abre un issue en el repositorio.

---

Hecho con ❤️ usando React Native y Expo
