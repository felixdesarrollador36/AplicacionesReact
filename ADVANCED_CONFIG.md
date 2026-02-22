# Configuración Avanzada y Dependencias Opcionales

## 🔧 Dependencias Opcionales

### Para Búsqueda Avanzada
```bash
npm install fuse.js
# Búsqueda fuzzy en documentos
```

### Para Estado Global
```bash
npm install zustand
# Store alternativo a Redux (ya preparado en el proyecto)
```

### Para Almacenamiento Persistente
```bash
npx expo install @react-native-async-storage/async-storage
# Para guardar favoritos, historial, etc.
```

### Para Animaciones Avanzadas
```bash
npm install react-native-reanimated
# Ya incluido en dependencias
```

### Para Visor Word/Excel Nativo
```bash
npx expo install react-native-document-view
# Alternativa a react-native-file-viewer
```

### Para Compartir Documentos
```bash
npx expo install expo-sharing
# Compartir archivos en la app
```

### Para Analytics
```bash
npx expo install firebase
# Tracking de eventos y comportamiento
```

### Para Testing
```bash
npm install --save-dev @testing-library/react-native
npm install --save-dev jest
npm install --save-dev @types/jest
```

## 🎨 Temas Personalizados

### Agregar Soporte para Light/Dark Mode

1. **Crear archivo de temas**:
```typescript
// src/themes/index.ts
export const LIGHT_THEME = {
  primary: '#0066cc',
  background: '#ffffff',
  text: '#1a1a1a',
  surface: '#f5f5f5',
};

export const DARK_THEME = {
  primary: '#4d94ff',
  background: '#121212',
  text: '#ffffff',
  surface: '#1e1e1e',
};
```

2. **Usar en componentes**:
```typescript
import { useColorScheme } from 'react-native';
import { LIGHT_THEME, DARK_THEME } from '../themes';

const colorScheme = useColorScheme();
const theme = colorScheme === 'dark' ? DARK_THEME : LIGHT_THEME;
```

## 📱 Configuración de Dispositivos Específicos

### Android
```json
{
  "android": {
    "package": "com.documentviewer.app",
    "versionCode": 1,
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    },
    "permissions": [
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE"
    ]
  }
}
```

### iOS
```json
{
  "ios": {
    "bundleIdentifier": "com.documentviewer.app",
    "buildNumber": "1.0.0",
    "supportsTabletMode": true,
    "infoPlist": {
      "NSLocalizedDescription": "Ver documentos en tu dispositivo"
    }
  }
}
```

## 🔐 Gestión de Permisos

### Solicitar Permisos en Tiempo de Ejecución

```typescript
// src/utils/permissionService.ts
import * as FileSystem from 'expo-file-system';

export const requestStoragePermissions = async (): Promise<boolean> => {
  try {
    // Android 6+ requires runtime permissions
    // Este código está simplificado para Expo
    return true;
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};

export const checkStoragePermission = async (): Promise<boolean> => {
  try {
    const dir = FileSystem.documentDirectory;
    return dir !== null;
  } catch {
    return false;
  }
};
```

## 🚀 Build para Producción

### Compilar con EAS

```bash
# Setup inicial
eas build --platform android --type production
eas build --platform ios --type production

# Enviar a tiendas
eas submit --platform android
eas submit --platform ios
```

### Configuración EAS Avanzada

```json
{
  "build": {
    "production": {
      "distribution": "store",
      "ios": {
        "cocoapods": {
          "podspecPath": "ios/Pods/Podfile.lock"
        }
      },
      "android": {
        "buildType": "apk",
        "config": {
          "versions": {
            "targetSdkVersion": "34"
          }
        }
      }
    }
  }
}
```

## 🔄 Integración Continua

### GitHub Actions

```yaml
# .github/workflows/build.yml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run lint
      - run: npm run test
```

## 📊 Monitoreo y Debugging

### Configurar Flipper (Debugger oficial)

1. Descargar Flipper: https://fbflipper.com
2. Abrir la app con Expo
3. Flipper se conectará automáticamente
4. Ver logs, network, storage, etc.

### Remote Debugging

```typescript
// En app.json
{
  "expo": {
    "plugins": [
      ["expo-dev-client"]
    ]
  }
}
```

## 🎯 Optimización de Performance

### Lazy Loading de Documentos

```typescript
// src/screens/HomeScreen.tsx
const [page, setPage] = useState(1);
const PAGE_SIZE = 20;

const displayedDocuments = documents.slice(0, page * PAGE_SIZE);

const handleEndReached = () => {
  if (displayedDocuments.length < documents.length) {
    setPage(prev => prev + 1);
  }
};

// En FlatList:
<FlatList
  onEndReached={handleEndReached}
  onEndReachedThreshold={0.5}
/>
```

### Memoization de Componentes

```typescript
import { memo } from 'react';

export const DocumentCard = memo((props: DocumentCardProps) => {
  // Component content
}, (prevProps, nextProps) => {
  return prevProps.document.id === nextProps.document.id;
});
```

### Reducir Tamaño de Bundle

```bash
# Analizar tamaño
npm run build -- --analyze

# Usar versiones ligeras
npm install react-native-vector-icons@9.0.0  # Más ligero
```

## 🔒 Seguridad

### Encriptación de Almacenamiento

```bash
npm install expo-secure-store
```

```typescript
// src/utils/secureStorage.ts
import * as SecureStore from 'expo-secure-store';

export const saveSecureData = async (key: string, value: string) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Error saving secure data:', error);
  }
};
```

## 📈 Analytics Avanzado

### Implementar Firebase Analytics

```bash
npm install firebase @react-native-firebase/app @react-native-firebase/analytics
```

```typescript
// src/utils/analyticsService.ts
import analytics from '@react-native-firebase/analytics';

export const logEvent = async (eventName: string, params?: any) => {
  try {
    await analytics().logEvent(eventName, params);
  } catch (error) {
    console.error('Analytics error:', error);
  }
};
```

## 🧪 Testing Avanzado

### Configurar Jest

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/setup-tests.js'],
};
```

### Test de Componentes

```typescript
// __tests__/components/DocumentCard.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { DocumentCard } from '../../src/components/DocumentCard';

const mockDocument = {
  id: '1',
  name: 'test.pdf',
  type: 'pdf',
  // ... otros campos
};

test('renders document name', () => {
  const { getByText } = render(
    <DocumentCard document={mockDocument} onPress={() => {}} />
  );
  expect(getByText('test.pdf')).toBeTruthy();
});
```

## 🌐 Internacionalización (i18n)

### Instalar i18n

```bash
npm install i18next react-i18next
```

### Configurar

```typescript
// src/i18n/translations/es.json
{
  "home": {
    "title": "Documentos",
    "noDocuments": "No hay documentos",
    "addDocument": "Agregar Documento"
  }
}

// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './translations/es.json';
import en from './translations/en.json';

i18n.use(initReactI18next).init({
  resources: { es, en },
  lng: 'es',
  interpolation: { escapeValue: false },
});
```

## 📱 Soporte Multi-Plataforma

### Archivos Específicos de Plataforma

```
// src/utils/platform.ts
import { Platform } from 'react-native';

export const getFileExtensionByPlatform = (filename: string) => {
  if (Platform.OS === 'ios') {
    // Lógica iOS
  } else {
    // Lógica Android
  }
};
```

### Componentes Específicos de Plataforma

```typescript
import { Platform } from 'react-native';

const PlatformSpecificComponent = Platform.select({
  ios: () => require('./IOSComponent').default,
  android: () => require('./AndroidComponent').default,
})();
```

## 🎬 Próximos Pasos

1. Instala las dependencias necesarias con `npm install`
2. Personaliza los temas en `src/themes/`
3. Implementa features opcionales según necesites
4. Prueba en dispositivos reales
5. Compila y publica en las tiendas

Para más información, consulta:
- [Expo Docs](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [EAS Docs](https://docs.expo.dev/build/introduction/)

---

**Última actualización**: Febrero 2026  
**Versión**: 1.0.0  
**Status**: ✅ Listo para producción
