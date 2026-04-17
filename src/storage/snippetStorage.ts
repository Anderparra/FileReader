import AsyncStorage from '@react-native-async-storage/async-storage';
import { Snippet } from '../types';
import { STORAGE_KEYS } from './StorageKeys';

const DEFAULT_SNIPPETS: Snippet[] = [
  {
    id: 'default-1',
    title: 'Saludo formal',
    body: 'Respetuosamente me permito solicitar,',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: 'default-2',
    title: 'Cierre de oficio',
    body: 'Quedo atento a cualquier inquietud respecto a la presente solicitud.',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: 'default-3',
    title: 'Reserva legal',
    body:
      'De igual manera se transfiere la reserva legal de la información, teniendo en cuenta lo establecido en la Ley 1581/2012 y Ley 1712/2014.',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: 'default-4',
    title: 'Función constitucional',
    body:
      'En cumplimiento de la función constitucional de Policía Judicial (Artículo 250 numeral 8 C.P.C.),',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
];

export async function getAllSnippets(): Promise<Snippet[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEYS.SNIPPETS);
  if (!json) {
    await AsyncStorage.setItem(STORAGE_KEYS.SNIPPETS, JSON.stringify(DEFAULT_SNIPPETS));
    return DEFAULT_SNIPPETS;
  }
  return JSON.parse(json) as Snippet[];
}

export async function saveSnippet(snippet: Snippet): Promise<void> {
  const all = await getAllSnippets();
  const idx = all.findIndex((s) => s.id === snippet.id);
  if (idx >= 0) all[idx] = snippet;
  else all.push(snippet);
  await AsyncStorage.setItem(STORAGE_KEYS.SNIPPETS, JSON.stringify(all));
}

export async function deleteSnippet(id: string): Promise<void> {
  const all = await getAllSnippets();
  const filtered = all.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.SNIPPETS, JSON.stringify(filtered));
}

export async function replaceAllSnippets(snippets: Snippet[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SNIPPETS, JSON.stringify(snippets));
}
