import * as FileSystem from 'expo-file-system';
import { Document } from '../types/index';

const DOCUMENT_EXTENSIONS = {
  pdf: 'pdf',
  docx: 'docx',
  xlsx: 'xlsx',
};

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export const getFileType = (
  extension: string,
): 'pdf' | 'docx' | 'xlsx' | 'unknown' => {
  const lowerExt = extension.toLowerCase();
  if (Object.keys(DOCUMENT_EXTENSIONS).includes(lowerExt)) {
    return lowerExt as 'pdf' | 'docx' | 'xlsx';
  }
  return 'unknown';
};

export const getMimeType = (type: string): string => {
  return MIME_TYPES[type] || 'application/octet-stream';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getDocumentIcon = (type: string): string => {
  switch (type) {
    case 'pdf':
      return 'file-pdf';
    case 'docx':
      return 'file-word';
    case 'xlsx':
      return 'file-excel';
    default:
      return 'file';
  }
};

export const isValidDocumentFile = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  return Object.keys(DOCUMENT_EXTENSIONS).includes(extension.toLowerCase());
};

export const getDocumentsDirectory = (): string => {
  return FileSystem.documentDirectory || '';
};
