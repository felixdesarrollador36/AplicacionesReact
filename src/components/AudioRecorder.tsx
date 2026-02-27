import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface Props {
  onRecordingComplete: (uri: string) => void;
  initialUri?: string;
}

const AudioRecorder: React.FC<Props> = ({ onRecordingComplete, initialUri }) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);

  useEffect(() => {
    // Solicitar permisos al montar
    const getPermissions = async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Se necesitan permisos para grabar audio.');
      }
    };
    getPermissions();

    if (initialUri) {
      setRecordedUri(initialUri);
    }

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [initialUri]);

  const startRecording = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      if (status !== 'granted') {
        alert('Se necesitan permisos para grabar audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const recordingOptions = {
        isMeteringEnabled: true,
        android: {
          extension: '.m4a',
          outputFormat: 2, // MPEG_4
          audioEncoder: 3, // AAC
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: 127, // HIGH
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      alert('Error al iniciar la grabación: ' + (err as Error).message);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordedUri(uri);
    if (uri) {
      onRecordingComplete(uri);
    }
    setRecording(null);
  };

  const playRecording = async () => {
    if (!recordedUri) return;

    const { sound } = await Audio.Sound.createAsync({ uri: recordedUri });
    setSound(sound);
    setIsPlaying(true);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        setIsPlaying(false);
      }
    });
  };

  const stopPlaying = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isRecording && styles.recording]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? 'Detener Grabación' : 'Grabar Audio'}
        </Text>
      </TouchableOpacity>

      {recordedUri && (
        <TouchableOpacity
          style={[styles.button, isPlaying && styles.playing]}
          onPress={isPlaying ? stopPlaying : playRecording}
        >
          <Text style={styles.buttonText}>
            {isPlaying ? 'Detener Reproducción' : 'Reproducir Audio'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#4a90e2',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  recording: {
    backgroundColor: '#e74c3c',
  },
  playing: {
    backgroundColor: '#27ae60',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default AudioRecorder;