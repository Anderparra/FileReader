import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChecklistRun } from '../types';
import { STORAGE_KEYS } from './StorageKeys';

export async function getAllChecklistRuns(): Promise<ChecklistRun[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEYS.CHECKLIST_RUNS);
  return json ? (JSON.parse(json) as ChecklistRun[]) : [];
}

export async function saveChecklistRun(run: ChecklistRun): Promise<void> {
  const all = await getAllChecklistRuns();
  const idx = all.findIndex((r) => r.id === run.id);
  if (idx >= 0) all[idx] = run;
  else all.push(run);
  await AsyncStorage.setItem(STORAGE_KEYS.CHECKLIST_RUNS, JSON.stringify(all));
}

export async function deleteChecklistRun(id: string): Promise<void> {
  const all = await getAllChecklistRuns();
  await AsyncStorage.setItem(
    STORAGE_KEYS.CHECKLIST_RUNS,
    JSON.stringify(all.filter((r) => r.id !== id)),
  );
}
