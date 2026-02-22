import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Text,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Document } from '../types';

type RootStackParamList = {
  Home: undefined;
  DocumentViewer: {
    document: Document;
    documentUri: string;
  };
};

type Props = NativeStackScreenProps<
  RootStackParamList,
  'DocumentViewer'
>;

export const DocumentViewerScreen = ({
  route,
  navigation,
}: Props) => {
  const { document, documentUri } = route.params;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: document.name,
    });
  }, [navigation, document.name]);

  const handleShare = () => {
    Alert.alert('Compartir', `Compartiendo: ${document.name}`);
  };

  if (document.type !== 'pdf') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.message}>
          Este tipo de documento no es soportado.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <ActivityIndicator
          size="large"
          color="#0066cc"
          style={styles.loader}
        />
      )}

      <WebView
        source={{ uri: documentUri }}
        style={{ flex: 1 }}
        onLoadEnd={() => setLoading(false)}
      />

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Icon name="share-variant" size={24} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    zIndex: 1,
  },
  shareButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 30,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
  },
});