import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedDocument } from '../types';
import { STORAGE_KEYS } from './StorageKeys';

export async function getAllDocuments(): Promise<SavedDocument[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS);
  return json ? (JSON.parse(json) as SavedDocument[]) : [];
}

export async function getDocumentById(id: string): Promise<SavedDocument | null> {
  const docs = await getAllDocuments();
  return docs.find((d) => d.id === id) ?? null;
}

export async function saveDocument(doc: SavedDocument): Promise<void> {
  const docs = await getAllDocuments();
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) docs[idx] = doc;
  else docs.push(doc);
  await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
}

export async function deleteDocument(id: string): Promise<void> {
  const docs = await getAllDocuments();
  const updated = docs.filter((d) => d.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updated));
}
