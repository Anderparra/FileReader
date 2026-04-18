import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '../types';
import { STORAGE_KEYS } from './StorageKeys';

export async function getAllContacts(): Promise<Contact[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
  return json ? (JSON.parse(json) as Contact[]) : [];
}

export async function saveContact(contact: Contact): Promise<void> {
  const all = await getAllContacts();
  const idx = all.findIndex((c) => c.id === contact.id);
  if (idx >= 0) all[idx] = contact;
  else all.push(contact);
  await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(all));
}

export async function deleteContact(id: string): Promise<void> {
  const all = await getAllContacts();
  await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(all.filter((c) => c.id !== id)));
}
