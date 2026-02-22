import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Document } from '../types/index';
import { formatFileSize, formatDate, getDocumentIcon } from '../utils/fileUtils';

interface DocumentCardProps {
  document: Document;
  onPress: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onShare?: (document: Document) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onPress,
  onDelete,
  onShare,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(document)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>
          {document.type === 'pdf' ? '📄' : document.type === 'docx' ? '📝' : '📊'}
        </Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.documentName} numberOfLines={2}>
          {document.name}
        </Text>
        <Text style={styles.metadata}>
          {formatFileSize(document.size)} • {formatDate(document.modifiedAt)}
        </Text>
        <View style={styles.typeTag}>
          <Text style={styles.typeText}>{document.type.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {onShare && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onShare(document);
            }}
          >
            <Text style={styles.actionIcon}>📤</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(document);
            }}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  metadata: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
  },
  typeTag: {
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0066cc',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  iconText: {
    fontSize: 32,
  },
  actionIcon: {
    fontSize: 20,
  },
});
