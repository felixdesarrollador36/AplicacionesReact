# 🛠️ Documentación Técnica - Document Viewer App

## Arquitectura del Proyecto

Este proyecto sigue una arquitectura modular y escalable basada en las mejores prácticas de React Native.

### Capas de la Aplicación

```
┌─────────────────────────────────────┐
│      Presentación (Screens)         │  HomeScreen, DocumentViewerScreen
├─────────────────────────────────────┤
│      Navegación                     │  React Navigation
├─────────────────────────────────────┤
│      Componentes Reutilizables      │  DocumentCard, LoadingIndicator, etc.
├─────────────────────────────────────┤
│      Lógica de Negocio (Utils)      │  documentService, fileUtils
├─────────────────────────────────────┤
│      Tipos & Interfaces             │  TypeScript definitions
├─────────────────────────────────────┤
│      Expo & React Native APIs       │  FileSystem, DocumentPicker
└─────────────────────────────────────┘
```

## Flujo de Datos

### Flujo de Carga de Documentos

```
HomeScreen monta
    ↓
useFocusEffect dispara getLocalDocuments()
    ↓
documentService.getLocalDocuments() lee archivos
    ↓
fileUtils.getFileType() clasifica documentos
    ↓
setDocuments() actualiza estado
    ↓
FlatList renderiza DocumentCard[] con map
    ↓
Usuario ve lista de documentos
```

### Flujo de Apertura de Documento

```
Usuario toca DocumentCard
    ↓
handleOpenDocument() dispara navigation.navigate()
    ↓
DocumentViewerScreen recibe params (document, documentUri)
    ↓
PDF component carga archivo
    ↓
onLoadComplete() actualiza totalPages
    ↓
Usuario puede navegar entre páginas
```

## Componentes Clave

### HomeScreen
**Responsabilidad**: Gestionar lista de documentos
**Estado**:
- `documents`: Document[]
- `loading`: boolean
- `refreshing`: boolean

**Métodos**:
- `loadDocuments()`: Obtiene documentos del dispositivo
- `handleAddDocument()`: Abre selector de archivos
- `handleDeleteDocument()`: Elimina documento
- `handleShareDocument()`: Comparte documento

### DocumentViewerScreen
**Responsabilidad**: Visualizar documento seleccionado
**Estado**:
- `page`: número de página actual
- `totalPages`: total de páginas
- `loading`: boolean
- `error`: string | null

**Métodos**:
- `handlePageChange()`: Navega entre páginas
- `handleShare()`: Comparte documento

### DocumentCard
**Responsabilidad**: Mostrar tarjeta de documento
**Props**:
```typescript
interface DocumentCardProps {
  document: Document;
  onPress: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onShare?: (document: Document) => void;
}
```

## Servicios

### documentService.ts

#### getLocalDocuments(): Promise<Document[]>
Lee directorio de documentos del dispositivo y retorna lista filtrada.

```typescript
const documents = await getLocalDocuments();
// Retorna: Document[] ordenado por fecha modificación
```

#### pickDocument(): Promise<Document | null>
Abre diálogo para seleccionar documento.

```typescript
const newDoc = await pickDocument();
if (newDoc) {
  // Documento seleccionado y copiado
}
```

#### deleteDocument(path: string): Promise<boolean>
Elimina un documento del dispositivo.

```typescript
const success = await deleteDocument(documentPath);
```

### fileUtils.ts

#### getFileType(extension: string): 'pdf' | 'docx' | 'xlsx' | 'unknown'
Clasifica tipo de archivo por extensión.

```typescript
const type = getFileType('pdf'); // Retorna: 'pdf'
```

#### formatFileSize(bytes: number): string
Formatea bytes a unidades legibles.

```typescript
const size = formatFileSize(1048576); // Retorna: "1 MB"
```

#### formatDate(date: Date): string
Formatea fecha para mostrar en español.

```typescript
const formatted = formatDate(new Date()); // Retorna: "21 feb 2026, 14:30"
```

## Tipos TypeScript

### Document Interface
```typescript
interface Document {
  id: string;                    // Identificador único
  name: string;                  // Nombre del archivo
  path: string;                  // Ruta completa
  type: 'pdf' | 'docx' | 'xlsx' | 'unknown';
  size: number;                  // Tamaño en bytes
  createdAt: Date;
  modifiedAt: Date;
  mimeType: string;
}
```

## Navegación

### RootNavigator
Estructura de rutas:

```typescript
Stack.Navigator:
  ├── Home (HomeScreen)
  │   └── Props: undefined
  └── DocumentViewer (DocumentViewerScreen)
      └── Props: {
            document: Document;
            documentUri: string;
          }
```

### Parámetros de Navegación

**Para ir a DocumentViewer**:
```typescript
navigation.navigate('DocumentViewer', {
  document: documentObject,
  documentUri: documentPath
});
```

## Permisos

### Android
En `app.json`:
```json
"android": {
  "permissions": [
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE"
  ]
}
```

### iOS
En `app.json`:
```json
"ios": {
  "infoPlist": {
    "NSLocalizedDescription": "Permitir acceso a documentos"
  }
}
```

## Styles & Theming

### Paleta de Colores

```
Primario:     #0066cc (Azul)
Secundario:   #f0f4ff (Azul claro)
Fondo:        #f5f5f5 (Gris muy claro)
Texto oscuro: #1a1a1a
Texto medio:  #666666
Texto claro:  #999999
Borde:        #eeeeee
Error:        #ff3333
Advertencia:  #ff9800
```

### Espacios Comunes

```
- Padding card: 16
- Margin vertical: 8
- Border radius: 8 o 12
- Elevación: 2 (Android)
- Shadow: black 10% opacity
```

## Optimización de Performance

### Mejoras Implementadas

1. **Memoization**: DocumentCard usa `TouchableOpacity` con `activeOpacity`
2. **FlatList Optimization**:
   - keyExtractor asegura identidad única
   - renderItem solo renderiza items visibles
3. **Navigation Optimization**:
   - screenOptions cacheadas
   - Animaciones habilitadas pero optimizadas
4. **Type Safety**: TypeScript previene errores en runtime

### Recomendaciones Futuras

- Usar `React.memo()` en componentes que no cambian
- Implementar `useMemo()` para cálculos pesados
- Lazy loading para listas muy largas
- Caché de imagenes/thumbnails

## Depuración

### Herramientas Disponibles

1. **Flipper**: Debugger oficial de React Native
2. **React DevTools**: Inspector de componentes
3. **Expo DevTools**: Accesible con `j` en terminal
4. **Redux DevTools**: (Preparado para expansión futura)

### Logs Útiles

```typescript
// En documentService.ts
console.log('Documentos cargados:', documents.length);
console.error('Error al cargar:', error);

// En HomeScreen.tsx
console.log('Documento seleccionado:', document.name);
```

## Testeo

### Estructura Recomendada

```
__tests__/
├── utils/
│   ├── fileUtils.test.ts
│   └── documentService.test.ts
├── screens/
│   ├── HomeScreen.test.tsx
│   └── DocumentViewerScreen.test.tsx
└── components/
    └── DocumentCard.test.tsx
```

### Ejemplo de Test

```typescript
describe('getFileType', () => {
  it('should return pdf for pdf extension', () => {
    expect(getFileType('pdf')).toBe('pdf');
  });

  it('should return unknown for unknown extension', () => {
    expect(getFileType('xyz')).toBe('unknown');
  });
});
```

## Extensiones Futuras

### Características Planeadas

1. **Búsqueda de Documentos**
   - Archivo: `src/screens/SearchScreen.tsx`
   - Usar: `fuse.js` para búsqueda fuzzy

2. **Favoritos**
   - Store: Usar Zustand o AsyncStorage
   - Implementar: Star icon en DocumentCard

3. **Anotaciones en PDF**
   - Librería: `react-native-pdf-lib`
   - UI: Toolbar con herramientas de dibujo

4. **Caché de Thumbnails**
   - Archivo: `src/utils/cacheService.ts`
   - Usar: `react-native-fs` o expo-file-system

5. **Dark Mode**
   - Implementar: useColorScheme hook
   - Temas: Light y Dark en estilos

## Configuración de Build

### EAS Build (Expo)

Archivo `eas.json` configurado para:
- **Development**: Modo desarrollo local
- **Preview**: Compilación para probar antes de producción
- **Production**: Build final para App Store/Play Store

### Comandos

```bash
# Compilar para Android
eas build --platform android

# Compilar para iOS
eas build --platform ios

# Compilar ambas plataformas
eas build --platform all

# Enviar a stores
eas submit
```

## Troubleshooting Avanzado

### Problema: Documentos no aparecen
**Causa**: Permiso de lectura no otorgado
**Solución**: 
```typescript
// Agregar solicitud de permisos
import * as FileSystem from 'expo-file-system';
const dir = FileSystem.documentDirectory;
```

### Problema: PDF se ve borroso
**Causa**: Escala incorrecta
**Solución**: Ajustar `scale` y `maxScale` en PDF component

### Problema: App se congela al abrir grande PDF
**Causa**: Archivo muy pesado
**Solución**: Implementar lazy loading o división de páginas

---

Para más información, consulta:
- `README.md` - Documentación de usuario
- `QUICK_START.md` - Guía rápida
- [Expo Docs](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
