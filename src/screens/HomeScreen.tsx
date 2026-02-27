import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const carouselItems = [
    {
      title: 'Registra tus Errores',
      text: 'Anota cada error para aprender de él.',
      image: require('../../assets/image/registra.jpg'),
    },
    {
      title: 'Reflexiona y Crece',
      text: 'Analiza la causa y aprende lecciones.',
      image: require('../../assets/image/reflexiona.jpg'),
    },
    {
      title: 'Revisa tu Progreso',
      text: 'Ve tu historial y mejora continuamente.',
      image: require('../../assets/image/progreso.jpg'),
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const dailyQuotes = [
    "El error es el maestro más sabio; aprende de él y crece.",
    "Cada día es una oportunidad para ser mejor que ayer.",
    "La conciencia es el puente entre el error y el crecimiento.",
    "Reflexiona antes de actuar, pero actúa con intención.",
    "Los errores del pasado son lecciones para el futuro.",
  ];

  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const quoteIndex = dayOfYear % dailyQuotes.length;
  const dailyQuote = dailyQuotes[quoteIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % carouselItems.length;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [carouselItems.length]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={carouselItems}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(data, index) => ({
          length: Dimensions.get('window').width,
          offset: Dimensions.get('window').width * index,
          index,
        })}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.carouselItem}>
            <Image source={item.image} style={styles.carouselImage} />
            <Text style={styles.carouselTitle}>{item.title}</Text>
            <Text style={styles.carouselText}>{item.text}</Text>
          </View>
        )}
      />
      <Text style={styles.quote}>{dailyQuote}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('AddError')}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Registrar un Error</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Reflection')}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Escuchar Reflexión</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Stats')}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Ver Historial</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fffaf3', // tono cálido
  },
  quote: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 50,
    fontStyle: 'italic',
    color: '#5a3e36',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#ffb347',
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  carouselContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  carouselItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    height: 200,
    width: Dimensions.get('window').width * 0.9,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: Dimensions.get('window').width * 0.05,
  },
  carouselImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
  },
  carouselTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  carouselText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default HomeScreen;