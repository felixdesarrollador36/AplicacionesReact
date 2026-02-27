import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Pdf from 'react-native-pdf';

type Document = {
  name: string;
  type: string;
};

type RootStackParamList = {
  DocumentViewer: {
    document: Document;
    documentUri: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'DocumentViewer'>;

export const DocumentViewerScreen = ({ route, navigation }: Props) => {
  const { document, documentUri } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const safeUri =
    documentUri?.startsWith('file://') ? documentUri : `file://${documentUri}`;

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: '#8B2635' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
      title: document.name,
    });
  }, [navigation, document.name]);

  if (document.type !== 'pdf') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Icon name="file-alert-outline" size={60} color="#8B2635" />
          <Text style={styles.message}>Solo se soporta PDF.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Icon name="alert-circle-outline" size={60} color="#8B2635" />
          <Text style={styles.message}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
            }}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#8B2635" />
          <Text style={styles.loadingText}>Cargando PDF...</Text>
        </View>
      )}
      <Pdf
        source={{ uri: safeUri }}
        onLoadComplete={() => setLoading(false)}
        onError={(e) => {
          setLoading(false);
          setError(`Error al abrir PDF: ${String(e)}`);
        }}
        style={styles.pdf}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  pdf: {
    flex: 1,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B2635',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  message: {
    color: '#1a1a1a',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#8B2635',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});