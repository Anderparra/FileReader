import AsyncStorage from '@react-native-async-storage/async-storage';
import { Template } from '../types';
import { STORAGE_KEYS, templateHtmlKey } from './StorageKeys';

async function getIndex(): Promise<Template[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES);
  return json ? (JSON.parse(json) as Template[]) : [];
}

async function saveIndex(templates: Template[]): Promise<void> {
  const withoutHtml = templates.map(({ htmlContent: _, ...rest }) => ({
    ...rest,
    htmlContent: '',
  }));
  await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(withoutHtml));
}

export async function getAllTemplates(): Promise<Template[]> {
  const index = await getIndex();
  const htmlEntries = await Promise.all(
    index.map((t) => AsyncStorage.getItem(templateHtmlKey(t.id)))
  );
  return index.map((t, i) => ({ ...t, htmlContent: htmlEntries[i] ?? '' }));
}

export async function getTemplateById(id: string): Promise<Template | null> {
  const index = await getIndex();
  const meta = index.find((t) => t.id === id);
  if (!meta) return null;
  const html = await AsyncStorage.getItem(templateHtmlKey(id));
  return { ...meta, htmlContent: html ?? '' };
}

export async function saveTemplate(template: Template): Promise<void> {
  const index = await getIndex();
  const idx = index.findIndex((t) => t.id === template.id);
  const meta = { ...template, htmlContent: '' };
  if (idx >= 0) index[idx] = meta;
  else index.push(meta);
  await saveIndex(index);
  await AsyncStorage.setItem(templateHtmlKey(template.id), template.htmlContent);
}

export async function deleteTemplate(id: string): Promise<void> {
  const index = await getIndex();
  const updated = index.filter((t) => t.id !== id);
  await saveIndex(updated);
  await AsyncStorage.removeItem(templateHtmlKey(id));
}
