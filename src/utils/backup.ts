import {
  documentDirectory,
  writeAsStringAsync,
  readAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../storage/StorageKeys';
import { ChecklistRun, Contact, InvestigatorProfile, SavedDocument, Snippet, Template } from '../types';

interface BackupPayload {
  version: 1 | 2;
  createdAt: string;
  profile: InvestigatorProfile | null;
  templates: Template[];
  documents: SavedDocument[];
  snippets: Snippet[];
  contacts?: Contact[];
  checklistRuns?: ChecklistRun[];
}

async function readJson<T>(key: string): Promise<T | null> {
  const s = await AsyncStorage.getItem(key);
  return s ? (JSON.parse(s) as T) : null;
}

export async function exportBackup(): Promise<string> {
  const [profile, templates, documents, snippets, contacts, checklistRuns] = await Promise.all([
    readJson<InvestigatorProfile>(STORAGE_KEYS.INVESTIGATOR_PROFILE),
    readJson<Template[]>(STORAGE_KEYS.TEMPLATES),
    readJson<SavedDocument[]>(STORAGE_KEYS.DOCUMENTS),
    readJson<Snippet[]>(STORAGE_KEYS.SNIPPETS),
    readJson<Contact[]>(STORAGE_KEYS.CONTACTS),
    readJson<ChecklistRun[]>(STORAGE_KEYS.CHECKLIST_RUNS),
  ]);

  const payload: BackupPayload = {
    version: 2,
    createdAt: new Date().toISOString(),
    profile: profile ?? null,
    templates: templates ?? [],
    documents: documents ?? [],
    snippets: snippets ?? [],
    contacts: contacts ?? [],
    checklistRuns: checklistRuns ?? [],
  };

  const dir = documentDirectory ?? '';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileUri = `${dir}gestion-documental-backup-${stamp}.json`;
  await writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
    encoding: EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Guardar copia de seguridad',
    });
  }
  return fileUri;
}

export async function importBackup(fileUri: string): Promise<void> {
  const raw = await readAsStringAsync(fileUri, { encoding: EncodingType.UTF8 });
  const parsed: BackupPayload = JSON.parse(raw);
  if (!parsed || (parsed.version !== 1 && parsed.version !== 2)) {
    throw new Error('El archivo no es una copia de seguridad válida.');
  }
  const tasks: Promise<void>[] = [];
  if (parsed.profile) {
    tasks.push(AsyncStorage.setItem(STORAGE_KEYS.INVESTIGATOR_PROFILE, JSON.stringify(parsed.profile)));
  }
  tasks.push(AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(parsed.templates ?? [])));
  tasks.push(AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(parsed.documents ?? [])));
  tasks.push(AsyncStorage.setItem(STORAGE_KEYS.SNIPPETS, JSON.stringify(parsed.snippets ?? [])));
  if (parsed.contacts) {
    tasks.push(AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(parsed.contacts)));
  }
  if (parsed.checklistRuns) {
    tasks.push(AsyncStorage.setItem(STORAGE_KEYS.CHECKLIST_RUNS, JSON.stringify(parsed.checklistRuns)));
  }
  await Promise.all(tasks);
}
