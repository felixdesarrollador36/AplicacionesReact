import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AwesomeAlert from 'react-native-awesome-alerts';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { saveErrorRecord, ErrorRecord } from '../services/storage';
import AudioRecorder from '../components/AudioRecorder';
import { scheduleNotification, requestPermissions } from '../services/notifications';

type AddErrorScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddError'>;

interface Props {
  navigation: AddErrorScreenNavigationProp;
}

const AddErrorScreen: React.FC<Props> = ({ navigation }) => {
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [lesson, setLesson] = useState('');
  const [audioUri, setAudioUri] = useState<string | undefined>();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [reminderDays, setReminderDays] = useState<number[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const toggleDay = (dayIndex: number) => {
    setReminderDays((prev: number[]) =>
      prev.includes(dayIndex) ? prev.filter((d: number) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const handleSave = async () => {
    if (!error.trim()) {
      Alert.alert('Error', 'Por favor describe el error.');
      return;
    }

    const record: ErrorRecord = {
      id: Date.now().toString(),
      error,
      reason,
      lesson,
      audioUri,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
      reminderDays,
      createdAt: new Date().toISOString(),
    };

    await saveErrorRecord(record);

    if (reminderEnabled && reminderTime) {
      try {
        await requestPermissions();
        const [hour, minute] = reminderTime.split(':').map(Number);
        if (reminderDays.length > 0) {
          // Programa una notificación para cada día seleccionado (Expo SDK 49+)
          for (const day of reminderDays) {
            try {
              await scheduleNotification(
                'Recordatorio de Error',
                `Recuerda: ${error}`,
                {
                  type: 'calendar',
                  repeats: true,
                  weekday: day + 1,
                  hour,
                  minute,
                } as any
              );
            } catch (err) {
              setAlertMessage('Error al programar la notificación: ' + (err instanceof Error ? err.message : String(err)));
              setShowAlert(true);
              return;
            }
          }
        } else {
          // Si no hay días seleccionados, programa una notificación diaria (Expo SDK 49+)
          await scheduleNotification(
            'Recordatorio de Error',
            `Recuerda: ${error}`,
            {
              type: 'calendar',
              repeats: true,
              hour,
              minute,
            } as any
          );
        }
      } catch (err) {
        setAlertMessage('Error al solicitar permisos o programar notificación: ' + (err instanceof Error ? err.message : String(err)));
        setShowAlert(true);
        return;
      }
    }

    setAlertMessage(`El error "${error}" ha sido registrado exitosamente.`);
    setShowAlert(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
      >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color="#333" />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Registrar Reflexión</Text>

      <Text style={styles.label}>¿Qué error cometí?</Text>
      <TextInput
        style={styles.input}
        value={error}
        onChangeText={setError}
        placeholder="Describe el error..."
        multiline
      />

      <Text style={styles.label}>¿Por qué ocurrió?</Text>
      <TextInput
        style={styles.input}
        value={reason}
        onChangeText={setReason}
        placeholder="Explica la razón..."
        multiline
      />

      <Text style={styles.label}>¿Qué aprendí?</Text>
      <TextInput
        style={styles.input}
        value={lesson}
        onChangeText={setLesson}
        placeholder="Reflexión aprendida..."
        multiline
      />

      <Text style={styles.label}>Grabar Audio (opcional)</Text>
      <AudioRecorder onRecordingComplete={setAudioUri} />

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Activar Recordatorio</Text>
        <TouchableOpacity
          style={[styles.switch, reminderEnabled && styles.switchOn]}
          onPress={() => setReminderEnabled(!reminderEnabled)}
        >
          <Text style={styles.switchText}>{reminderEnabled ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>

      {reminderEnabled && (
        <>
          <Text style={styles.label}>Hora del Recordatorio (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="Ej: 09:00"
          />

          <Text style={styles.label}>Días de la Semana</Text>
          <View style={styles.daysContainer}>
            {[0, 1, 2, 3].map((index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  reminderDays.includes(index) && styles.dayButtonSelected,
                ]}
                onPress={() => toggleDay(index)}
              >
                <Text
                  style={[
                    styles.dayText,
                    reminderDays.includes(index) && styles.dayTextSelected,
                  ]}
                >
                  {daysOfWeek[index]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.daysContainer}>
            {[4, 5, 6].map((index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  reminderDays.includes(index) && styles.dayButtonSelected,
                ]}
                onPress={() => toggleDay(index)}
              >
                <Text
                  style={[
                    styles.dayText,
                    reminderDays.includes(index) && styles.dayTextSelected,
                  ]}
                >
                  {daysOfWeek[index]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.7}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>

      <AwesomeAlert
        show={showAlert}
        showProgress={false}
        title="Guardado"
        message={alertMessage}
        closeOnTouchOutside={true}
        closeOnHardwareBackPress={false}
        showCancelButton={false}
        showConfirmButton={true}
        confirmText="OK"
        confirmButtonColor="#27ae60"
        onConfirmPressed={() => {
          setShowAlert(false);
          navigation.goBack();
        }}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fffaf3',
  },
  saveButtonFixed: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
    backgroundColor: '#ffb347',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: '#fffaf3', // tono cálido
  },  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
  },
  backText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 5,
  },  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5a3e36',
    textAlign: 'center',
    marginBottom: 20,
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  switch: {
    width: 70,
    height: 35,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
  },
  switchOn: {
    backgroundColor: '#ffb347',
  },
  switchText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  dayButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    margin: 2,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dayButtonSelected: {
    backgroundColor: '#ffb347',
    borderColor: '#ffb347',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#ffb347',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 36, // Espacio extra para barra de navegación
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default AddErrorScreen;