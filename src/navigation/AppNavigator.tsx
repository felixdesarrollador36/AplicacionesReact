import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importar las pantallas
import HomeScreen from '../screens/HomeScreen';
import AddErrorScreen from '../screens/AddErrorScreen';
import RecordingsScreen from '../screens/RecordingsScreen';
import ReflectionScreen from '../screens/ReflectionScreen';
import StatsScreen from '../screens/StatsScreen';
import ErrorDetailScreen from '../screens/ErrorDetailScreen';
import { ErrorRecord } from '../services/storage';

// Definir los tipos de navegación
export type RootStackParamList = {
  Home: undefined;
  AddError: undefined;
  Recordings: undefined;
  Reflection: undefined;
  Stats: undefined;
  ErrorDetail: { record: ErrorRecord };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
        <Stack.Screen name="AddError" component={AddErrorScreen} options={{ title: 'Registrar Error' }} />
        <Stack.Screen name="Recordings" component={RecordingsScreen} options={{ title: 'Grabaciones' }} />
        <Stack.Screen name="Reflection" component={ReflectionScreen} options={{ title: 'Reflexión Rápida' }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Historial y Progreso' }} />
        <Stack.Screen name="ErrorDetail" component={ErrorDetailScreen} options={{ title: 'Detalle del Error' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;