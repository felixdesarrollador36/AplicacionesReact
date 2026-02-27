import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type ReflectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Reflection'>;

interface Props {
  navigation: ReflectionScreenNavigationProp;
}

const ReflectionScreen: React.FC<Props> = ({ navigation }) => {
  const questions = [
    '¿Esto me acerca o me aleja de quien quiero ser?',
    '¿Ya cometí este error antes?',
    '¿Vale la pena repetirlo?',
  ];

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playReflection = async () => {
    if (sound) {
      await sound.unloadAsync();
    }
    // Replace with local audio if available, e.g., require('../../assets/audio/reflection.mp3')
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' } // Placeholder audio URL
    );
    setSound(newSound);
    setIsPlaying(true);
    await newSound.playAsync();
    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        setIsPlaying(false);
      }
    });
  };

  const stopReflection = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reflexión Rápida</Text>
      {questions.map((question, index) => (
        <View key={index} style={styles.questionContainer}>
          <Text style={styles.question}>{question}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={isPlaying ? stopReflection : playReflection}
          >
            <Text style={styles.buttonText}>
              {isPlaying ? 'Detener Reflexión' : 'Escuchar Reflexión'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: '#fffaf3', // tono cálido
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
    color: '#5a3e36',
  },
  questionContainer: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  question: {
    fontSize: 17,
    marginBottom: 12,
    color: '#333',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#ffb347', // naranja cálido
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 25,
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ReflectionScreen;