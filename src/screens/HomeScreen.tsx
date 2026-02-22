import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Document } from '../types/index';
import {
  DocumentCard,
  LoadingIndicator,
  EmptyState,
} from '../components/index';
import {
  getLocalDocuments,
  pickDocument,
  deleteDocument,
  shareDocument,
} from '../utils/documentService';

type RootStackParamList = {
  Home: undefined;
  DocumentViewer: {
    document: Document;
    documentUri: string;
  };
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await getLocalDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'No se pudieron cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const handleAddDocument = async () => {
    const newDocument = await pickDocument();
    if (newDocument) {
      Alert.alert('Éxito', `${newDocument.name} se agregó correctamente`);
      await loadDocuments();
    } else {
      Alert.alert(
        'Información',
        'No se seleccionó ningún documento o el tipo no es soportado',
      );
    }
  };

  const handleDeleteDocument = (document: Document) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Deseas eliminar "${document.name}"?`,
      [
        {
          text: 'Cancelar',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          onPress: async () => {
            const success = await deleteDocument(document.path);
            if (success) {
              Alert.alert('Éxito', 'Documento eliminado');
              await loadDocuments();
            } else {
              Alert.alert('Error', 'No se pudo eliminar el documento');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const handleShareDocument = async (document: Document) => {
    try {
      await shareDocument(document.path);
      Alert.alert('Información', 'Función de compartir en desarrollo');
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir el documento');
    }
  };

  const handleOpenDocument = (document: Document) => {
    navigation.navigate('DocumentViewer', {
      document,
      documentUri: document.path,
    });
  };

  // Load documents on screen focus
  useFocusEffect(
    React.useCallback(() => {
      loadDocuments();
    }, []),
  );

  // Initial load
  useEffect(() => {
    loadDocuments();
  }, []);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View>
        <Text style={styles.headerTitle}>Documentos</Text>
        <Text style={styles.headerSubtitle}>
          {documents.length} documento{documents.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <Text style={styles.headerIcon}>📄</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {documents.length === 0 ? (
          <EmptyState
            icon="folder-open"
            title="No hay documentos"
            description="Agrega tus primeros documentos para comenzar"
            actionText="Agregar Documento"
            onAction={handleAddDocument}
          />
        ) : (
          <FlatList
            data={documents}
            renderItem={({ item }) => (
              <DocumentCard
                document={item}
                onPress={handleOpenDocument}
                onDelete={handleDeleteDocument}
                onShare={handleShareDocument}
              />
            )}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            scrollEnabled={true}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {documents.length > 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleAddDocument}
        >
          <Text style={styles.fabText}>➕</Text>
        </TouchableOpacity>
      )}
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
  },
  listContent: {
    paddingBottom: 100,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  headerIcon: {   // 👈 AGREGA ESTO
    fontSize: 32,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontSize: 32,
  },
});
