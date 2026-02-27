import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getErrorRecords, deleteErrorRecord, ErrorRecord } from '../services/storage';

type StatsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Stats'>;

interface Props {
  navigation: StatsScreenNavigationProp;
}

const StatsScreen: React.FC<Props> = ({ navigation }: Props) => {
  const [records, setRecords] = useState<ErrorRecord[]>([]);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadRecords);
    return unsubscribe;
  }, [navigation]);

  const loadRecords = async () => {
    const data = await getErrorRecords();
    setRecords(
      data.sort(
        (a: ErrorRecord, b: ErrorRecord) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  };

  const handleDelete = (id: string, errorText: string) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de eliminar el error "${errorText}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => performDelete(id, errorText),
        },
      ]
    );
  };

  const performDelete = async (id: string, errorText: string) => {
    try {
      await deleteErrorRecord(id);
      await loadRecords();
      Alert.alert('Eliminado', `El error "${errorText}" ha sido eliminado exitosamente.`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el registro: ' + (error as Error).message);
    }
  };

  // Estadísticas simples
  const totalErrors = records.length;
  const errorTypes = records.reduce((acc: Record<string, number>, record: ErrorRecord) => {
    acc[record.error] = (acc[record.error] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostFrequentError = Object.keys(errorTypes).reduce(
    (a, b) => (errorTypes[a] > errorTypes[b] ? a : b),
    ''
  );

  const renderItem = ({ item }: { item: ErrorRecord }) => (
    <View style={styles.recordItem}>
      <TouchableOpacity
        style={styles.recordContent}
        onPress={() => navigation.navigate('ErrorDetail', { record: item })}
      >
        <Text style={styles.recordError}>{item.error}</Text>
        <Text style={styles.recordDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id, item.error)}
      >
        <Text style={styles.deleteButtonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color="#333" />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Historial y Progreso</Text>
      <View style={styles.statsContainer}>
        <Text style={styles.stat}>Total de errores registrados: {totalErrors}</Text>
        {mostFrequentError && (
          <Text style={styles.stat}>Error más frecuente: {mostFrequentError}</Text>
        )}
      </View>
      <FlatList
        data={records}
        keyExtractor={(item: ErrorRecord) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No hay registros aún.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: '#fffaf3', // tono cálido
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
  },
  backText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#5a3e36',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  stat: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
    fontWeight: '500',
  },
  recordItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  recordContent: {
    flex: 1,
  },
  recordError: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
});

export default StatsScreen;