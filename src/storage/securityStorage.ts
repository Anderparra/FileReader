import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './StorageKeys';

export async function isSecurityEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_ENABLED);
  return v === 'true';
}

export async function setSecurityEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SECURITY_ENABLED, enabled ? 'true' : 'false');
}
