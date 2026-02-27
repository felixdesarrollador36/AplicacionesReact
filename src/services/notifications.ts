import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar el manejador de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Solicitar permisos
export const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Se necesitan permisos para notificaciones.');
  }
};

// Programar una notificación
export const scheduleNotification = async (
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger,
  });
};

// Cancelar todas las notificaciones
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};