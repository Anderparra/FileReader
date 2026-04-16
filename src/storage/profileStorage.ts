import AsyncStorage from '@react-native-async-storage/async-storage';
import { InvestigatorProfile } from '../types';
import { STORAGE_KEYS } from './StorageKeys';

export async function getProfile(): Promise<InvestigatorProfile | null> {
  const json = await AsyncStorage.getItem(STORAGE_KEYS.INVESTIGATOR_PROFILE);
  return json ? (JSON.parse(json) as InvestigatorProfile) : null;
}

export async function saveProfile(profile: InvestigatorProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.INVESTIGATOR_PROFILE, JSON.stringify(profile));
}
