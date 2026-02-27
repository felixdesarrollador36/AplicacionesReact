import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AwesomeAlert from 'react-native-awesome-alerts';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { updateErrorRecord, ErrorRecord } from '../services/storage';
import AudioRecorder from '../components/AudioRecorder';

type ErrorDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ErrorDetail'>;
type ErrorDetailScreenRouteProp = RouteProp<RootStackParamList, 'ErrorDetail'>;

interface Props {
  navigation: ErrorDetailScreenNavigationProp;
  route: ErrorDetailScreenRouteProp;
}

const ErrorDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { record } = route.params;
  const [error, setError] = useState(record.error);
  const [reason, setReason] = useState(record.reason);
  const [lesson, setLesson] = useState(record.lesson);
  const [audioUri, setAudioUri] = useState<string | undefined>(record.audioUri);
  const [isEditing, setIsEditing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleSave = async () => {
    const updatedRecord: ErrorRecord = {
      ...record,
      error,
      reason,
      lesson,
      audioUri,
    };
    await updateErrorRecord(record.id, updatedRecord);
    setAlertMessage(`El error "${error}" ha sido actualizado exitosamente.`);
    setShowAlert(true);
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color="#333" />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Detalle del Error</Text>

      <Text style={styles.label}>¿Qué error cometí?</Text>
      <TextInput
        style={styles.input}
        value={error}
        onChangeText={setError}
        editable={isEditing}
        multiline
      />

      <Text style={styles.label}>¿Por qué ocurrió?</Text>
      <TextInput
        style={styles.input}
        value={reason}
        onChangeText={setReason}
        editable={isEditing}
        multiline
      />

      <Text style={styles.label}>¿Qué aprendí?</Text>
      <TextInput
        style={styles.input}
        value={lesson}
        onChangeText={setLesson}
        editable={isEditing}
        multiline
      />

      {audioUri && (
        <>
          <Text style={styles.label}>Audio Grabado</Text>
          <AudioRecorder onRecordingComplete={setAudioUri} initialUri={audioUri} />
        </>
      )}

      <View style={styles.buttonContainer}>
        {isEditing ? (
          <>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        )}
      </View>

      <AwesomeAlert
        show={showAlert}
        showProgress={false}
        title="Actualizado"
        message={alertMessage}
        closeOnTouchOutside={true}
        closeOnHardwareBackPress={false}
        showCancelButton={false}
        showConfirmButton={true}
        confirmText="OK"
        confirmButtonColor="#27ae60"
        onConfirmPressed={() => {
          setShowAlert(false);
          setIsEditing(false);
          navigation.goBack();
        }}
      />
    </ScrollView>
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
    color: '#5a3e36',
    textAlign: 'center',
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonContainer: {
    marginTop: 30,
  },
  editButton: {
    backgroundColor: '#ffb347',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default ErrorDetailScreen;