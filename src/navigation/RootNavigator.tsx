import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen, DocumentViewerScreen } from '../screens/index';
import { Document } from '../types/index';

export type RootStackParamList = {
  Home: undefined;
  DocumentViewer: {
    document: Document;
    documentUri: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#0066cc',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          contentStyle: {   // 👈 use this instead of cardStyle
      backgroundColor: '#ffffff',
    },

        }}
      >
    <Stack.Screen
  name="Home"
  component={HomeScreen}
  options={{
    headerShown: false,
    animation: 'fade', // 👈 valid values: 'default', 'fade', 'flip', 'none', 'slide_from_right', etc.
  }}
/>

<Stack.Screen
  name="DocumentViewer"
  component={DocumentViewerScreen}
  options={{
    headerShown: true,
    animation: 'slide_from_right',
    headerBackTitleVisible: false,
  }}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};
