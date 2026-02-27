import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Document = {
  id: string;
  name: string;
  type: string;
  uri: string;
};

type RootStackParamList = {
  Home: undefined;
  DocumentViewer: {
    document: Document;
    documentUri: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen = ({ navigation }: Props) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePickDocument = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const docDir = FileSystem.documentDirectory;
        const filename = asset.name;
        const destPath = `${docDir}${filename}`;

        await FileSystem.copyAsync({
          from: asset.uri,
          to: destPath,
        });

        const newDoc: Document = {
          id: Date.now().toString(),
          name: filename,
          type: 'pdf',
          uri: destPath,
        };

        setDocuments([newDoc, ...documents]);
        Alert.alert('Éxito', `${filename} agregado correctamente`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDocument = (doc: Document) => {
    navigation.navigate('DocumentViewer', {
      document: doc,
      documentUri: doc.uri,
    });
  };

  const handleDeleteDocument = async (doc: Document) => {
    try {
      await FileSystem.deleteAsync(doc.uri);
      setDocuments(documents.filter((d) => d.id !== doc.id));
      Alert.alert('Éxito', 'Documento eliminado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el documento');
    }
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => handleOpenDocument(item)}
    >
      <View style={styles.cardContent}>
        <Icon name="file-pdf-box" size={40} color="#8B2635" />
        <View style={styles.docInfo}>
          <Text style={styles.docName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.docType}>PDF</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteDocument(item)}
      >
        <Icon name="trash-can-outline" size={20} color="#8B2635" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Documentos</Text>
        <Text style={styles.subtitle}>Visualiza y gestiona tus PDFs</Text>
      </View>

      {/* Documents List */}
      {documents.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="file-document-outline" size={80} color="#8B2635" />
          <Text style={styles.emptyTitle}>No hay documentos</Text>
          <Text style={styles.emptySubtitle}>
            Añade tu primer PDF para comenzar
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handlePickDocument}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" size="large" />
        ) : (
          <>
            <Icon name="plus" size={28} color="#ffffff" />
            <Text style={styles.addButtonText}>Añadir PDF</Text>
          </>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#8B2635',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#f0f0f0',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#8B2635',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docInfo: {
    marginLeft: 16,
    flex: 1,
  },
  docName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  docType: {
    fontSize: 12,
    color: '#8B2635',
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#8B2635',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 5,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});