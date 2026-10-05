import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { registerPushToken } from './notifications.service';
import { tokenStorage } from '@/core/auth/tokenStorage';

const key = (accountId: string) => `BOSKO_PUSH_v1:${accountId}`;
export async function readPushPreference(accountId: string) {
  return (await AsyncStorage.getItem(key(accountId))) !== 'off';
}
export async function savePushPreference(accountId: string, enabled: boolean) {
  await AsyncStorage.setItem(key(accountId), enabled ? 'on' : 'off');
}
export async function registerDeviceForPush() {
  const version = tokenStorage.getSessionVersion();
  if (!Device.isDevice || Platform.OS === 'web') throw new Error('Las notificaciones requieren un dispositivo iOS o Android.');
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', {
    name: 'Bosko', importance: Notifications.AndroidImportance.MAX, sound: 'default',
  });
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') throw new Error('Activá el permiso de notificaciones de Bosko en los ajustes del dispositivo.');
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('No se pudo configurar este dispositivo para notificaciones.');
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  if (version !== tokenStorage.getSessionVersion() || !tokenStorage.getAccessToken()) return;
  await registerPushToken(data, Platform.OS as 'ios' | 'android');
}
