import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type RecordingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Recordings'>;

interface Props {
  navigation: RecordingsScreenNavigationProp;
}

const RecordingsScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grabaciones</Text>
      <Text style={styles.text}>Aquí se mostrarían las grabaciones de audio asociadas a los errores.</Text>
      {/* Implementar lista de grabaciones si es necesario */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});

export default RecordingsScreen;