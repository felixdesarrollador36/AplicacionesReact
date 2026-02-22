import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Document } from '../types/index';
import {
  getFileExtension,
  getFileType,
  getMimeType,
  isValidDocumentFile,
  getDocumentsDirectory,
} from './fileUtils';

export const getLocalDocuments = async (): Promise<Document[]> => {
  try {
    if (Platform.OS === 'web') {
      return [];
    }

    const documentsDir = getDocumentsDirectory();
    if (!documentsDir) return [];

    const files = await FileSystem.readDirectoryAsync(documentsDir);
    const documents: Document[] = [];

    for (const file of files) {
      if (!isValidDocumentFile(file)) continue;

      try {
        const filePath = `${documentsDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.exists && !fileInfo.isDirectory) {
          const extension = getFileExtension(file);
          const type = getFileType(extension);

          documents.push({
            id: file,
            name: file,
            path: filePath,
            type,
            size: fileInfo.size || 0,
            createdAt: new Date(fileInfo.modificationTime || 0),
            modifiedAt: new Date(fileInfo.modificationTime || 0),
            mimeType: getMimeType(type),
          });
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }

    return documents.sort(
      (a, b) =>
        new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime(),
    );
  } catch (error) {
    console.error('Error reading documents directory:', error);
    return [];
  }
};

export const pickDocument = async (): Promise<Document | null> => {
  try {
    if (Platform.OS === 'web') {
      Alert.alert('No disponible', 'La selección de documentos no está disponible en web');
      return null;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
    });

    if (result.canceled) return null;

    const documentAsset = result.assets[0];
    const extension = getFileExtension(documentAsset.name);
    const type = getFileType(extension);

    if (type === 'unknown') {
      throw new Error('Tipo de documento no soportado');
    }

    const fileName = documentAsset.name;
    const documentsDir = getDocumentsDirectory();
    const newPath = `${documentsDir}${fileName}`;

    // Copy file to app documents directory
    await FileSystem.copyAsync({
      from: documentAsset.uri,
      to: newPath,
    });

    const fileInfo = await FileSystem.getInfoAsync(newPath);

      return {
      id: fileName,
      name: fileName,
      path: newPath,
      type,
      size: 0,
      createdAt: new Date(),
      modifiedAt: new Date(),
      mimeType: getMimeType(type),
    };
  } catch (error) {
    console.error('Error picking document:', error);
    return null;
  }
};

export const deleteDocument = async (documentPath: string): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      return false;
    }

    await FileSystem.deleteAsync(documentPath);
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};

export const shareDocument = async (documentUri: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      Alert.alert('No disponible', 'Compartir no está disponible en web');
      return;
    }

    console.log('Share functionality for:', documentUri);
  } catch (error) {
    console.error('Error sharing document:', error);
  }
};