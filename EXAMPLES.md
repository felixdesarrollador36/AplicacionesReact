# 📚 Ejemplos y Guía de Extensión

## Ejemplos de Uso

### 1. Cómo Agregar Nuevas Librerías

```bash
# Usando npm
npm install nombre-paquete

# Usando Expo (recomendado)
npx expo install nombre-paquete
```

### 2. Crear un Nuevo Componente

**Archivo**: `src/components/MyNewComponent.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MyNewComponentProps {
  title: string;
  onPress?: () => void;
}

export const MyNewComponent: React.FC<MyNewComponentProps> = ({
  title,
  onPress,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
```

**Actualizar**: `src/components/index.ts`

```typescript
export { MyNewComponent } from './MyNewComponent';
```

### 3. Crear una Nueva Pantalla

**Archivo**: `src/screens/NewScreen.tsx`

```typescript
import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  NewScreen: undefined;
};

type NewScreenProps = NativeStackScreenProps<RootStackParamList, 'NewScreen'>;

export const NewScreen: React.FC<NewScreenProps> = ({ navigation }) => {
  React.useEffect(() => {
    navigation.setOptions({
      title: 'Nueva Pantalla',
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenido</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
});
```

## Guías de Extensión

### Agregar Búsqueda de Documentos

**Paso 1**: Instalar librería
```bash
npm install fuse.js
```

**Paso 2**: Crear Hook personalizado

```typescript
// src/hooks/useDocumentSearch.ts
import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Document } from '../types/index';

export const useDocumentSearch = (documents: Document[], query: string) => {
  const fuse = useMemo(
    () =>
      new Fuse(documents, {
        keys: ['name'],
        threshold: 0.3,
      }),
    [documents],
  );

  return useMemo(() => {
    if (!query) return documents;
    return fuse.search(query).map((result) => result.item);
  }, [query, fuse, documents]);
};
```

**Paso 3**: Usar en HomeScreen

```typescript
const [searchQuery, setSearchQuery] = useState('');
const filteredDocs = useDocumentSearch(documents, searchQuery);

// En el render:
<TextInput
  style={styles.searchInput}
  placeholder="Buscar documentos..."
  value={searchQuery}
  onChangeText={setSearchQuery}
/>
<FlatList
  data={filteredDocs}
  // ... resto del código
/>
```

### Implementar Dark Mode

**Paso 1**: Crear contexto de tema

```typescript
// src/context/ThemeContext.tsx
import React, { createContext, useState } from 'react';

export type ThemeName = 'light' | 'dark';

interface Theme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
}

const THEMES: Record<ThemeName, Theme> = {
  light: {
    primary: '#0066cc',
    secondary: '#f0f4ff',
    background: '#ffffff',
    text: '#1a1a1a',
    border: '#eeeeee',
  },
  dark: {
    primary: '#4d94ff',
    secondary: '#1a3a66',
    background: '#121212',
    text: '#ffffff',
    border: '#333333',
  },
};

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeName, setThemeName] = useState<ThemeName>('light');

  return (
    <ThemeContext.Provider
      value={{
        theme: THEMES[themeName],
        themeName,
        toggleTheme: () =>
          setThemeName((prev) => (prev === 'light' ? 'dark' : 'light')),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

**Paso 2**: Usar en componentes

```typescript
import { useTheme } from '../context/ThemeContext';

export const DocumentCard: React.FC<DocumentCardProps> = (props) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.background, borderColor: theme.border },
      ]}
    >
      {/* ... contenido ... */}
    </TouchableOpacity>
  );
};
```

### Agregar Almacenamiento Persistente

**Paso 1**: Instalar AsyncStorage

```bash
npx expo install @react-native-async-storage/async-storage
```

**Paso 2**: Crear servicio de almacenamiento

```typescript
// src/utils/storageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Document } from '../types/index';

const FAVORITES_KEY = '@app:favorites';

export const getFavorites = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const addFavorite = async (documentId: string): Promise<void> => {
  try {
    const favorites = await getFavorites();
    if (!favorites.includes(documentId)) {
      favorites.push(documentId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Error adding favorite:', error);
  }
};

export const removeFavorite = async (documentId: string): Promise<void> => {
  try {
    const favorites = await getFavorites();
    const updated = favorites.filter((id) => id !== documentId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
};

export const isFavorite = async (documentId: string): Promise<boolean> => {
  const favorites = await getFavorites();
  return favorites.includes(documentId);
};
```

**Paso 3**: Usar en componentes

```typescript
const [isFav, setIsFav] = useState(false);

useEffect(() => {
  isFavorite(document.id).then(setIsFav);
}, [document.id]);

const handleToggleFavorite = async () => {
  if (isFav) {
    await removeFavorite(document.id);
  } else {
    await addFavorite(document.id);
  }
  setIsFav(!isFav);
};
```

### Implementar Caché de Documentos

```typescript
// src/utils/cacheService.ts
import * as FileSystem from 'expo-file-system';

const CACHE_DIR = FileSystem.cacheDirectory + 'documents/';

export const initCacheDir = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, {
        intermediates: true,
      });
    }
  } catch (error) {
    console.error('Error initializing cache:', error);
  }
};

export const cacheDocument = async (
  sourceUri: string,
  filename: string,
): Promise<string> => {
  const cacheUri = CACHE_DIR + filename;
  try {
    await FileSystem.copyAsync({
      from: sourceUri,
      to: cacheUri,
    });
    return cacheUri;
  } catch (error) {
    console.error('Error caching document:', error);
    throw error;
  }
};

export const clearCache = async (): Promise<void> => {
  try {
    await FileSystem.deleteAsync(CACHE_DIR);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
```

### Agregar Analytics

**Paso 1**: Instalar Firebase (o alternativa)

```bash
npx expo install firebase
```

**Paso 2**: Crear servicio de analytics

```typescript
// src/utils/analyticsService.ts
import * as Analytics from 'expo-firebase-analytics';

export const logOpenDocument = async (documentName: string): Promise<void> => {
  try {
    await Analytics.logEvent('open_document', {
      document_name: documentName,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

export const logAddDocument = async (fileType: string): Promise<void> => {
  try {
    await Analytics.logEvent('add_document', {
      file_type: fileType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analytics error:', error);
  }
};
```

**Paso 3**: Usar en pantallas

```typescript
const handleOpenDocument = async (document: Document) => {
  await logOpenDocument(document.name);
  navigation.navigate('DocumentViewer', {
    document,
    documentUri: document.path,
  });
};
```

## Patrón de Componente Avanzado

### Crear un Selector de Documentos Reutilizable

```typescript
// src/components/DocumentSelector.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { Document } from '../types/index';
import { DocumentCard } from './DocumentCard';

interface DocumentSelectorProps {
  documents: Document[];
  visible: boolean;
  onSelect: (document: Document) => void;
  onClose: () => void;
  filterType?: 'pdf' | 'docx' | 'xlsx';
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  documents,
  visible,
  onSelect,
  onClose,
  filterType,
}) => {
  const filtered = filterType
    ? documents.filter((d) => d.type === filterType)
    : documents;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <FlatList
          data={filtered}
          renderItem={({ item }) => (
            <DocumentCard
              document={item}
              onPress={onSelect}
            />
          )}
          keyExtractor={(item) => item.id}
        />
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    padding: 16,
    backgroundColor: '#0066cc',
    alignItems: 'center',
  },
  closeText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
```

## Testing - Ejemplo Completo

```typescript
// __tests__/utils/fileUtils.test.ts
import {
  getFileType,
  formatFileSize,
  getFileExtension,
} from '../../src/utils/fileUtils';

describe('fileUtils', () => {
  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('file.docx')).toBe('docx');
    });

    it('should handle files without extension', () => {
      expect(getFileExtension('README')).toBe('');
    });
  });

  describe('getFileType', () => {
    it('should classify pdf files', () => {
      expect(getFileType('pdf')).toBe('pdf');
    });

    it('should return unknown for unsupported types', () => {
      expect(getFileType('exe')).toBe('unknown');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
    });

    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });
  });
});
```

---

¡Espero que estos ejemplos te ayuden a extender la aplicación! 🚀
