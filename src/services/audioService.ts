import { Audio } from 'expo-av';

// Reproducir audio desde URI
export const playAudio = async (uri: string) => {
  try {
    const { sound } = await Audio.Sound.createAsync({ uri });
    await sound.playAsync();
    return sound;
  } catch (error) {
    console.error('Error playing audio:', error);
  }
};

// Detener audio
export const stopAudio = async (sound: Audio.Sound) => {
  await sound.stopAsync();
  await sound.unloadAsync();
};