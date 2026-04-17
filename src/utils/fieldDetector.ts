import { readAsStringAsync, EncodingType } from 'expo-file-system';
import { Field, FieldType } from '../types';
import { FIELD_PATTERNS, SEMANTIC_RULES } from '../constants/fieldPatterns';
// @ts-ignore
import JSZip from 'jszip';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

function inferType(label: string): FieldType {
  const normalized = label.toLowerCase();
  for (const rule of SEMANTIC_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      return rule.type;
    }
  }
  return 'text';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface RawMatch {
  placeholder: string;
  label: string;
  type: FieldType;
}

function detectRawMatches(text: string): RawMatch[] {
  const matches: RawMatch[] = [];
  const seen = new Set<string>();

  for (const pattern of FIELD_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const placeholder = m[0];
      const rawLabel = m[1] ?? pattern.labelHint;
      const label = rawLabel
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();

      const normalizedKey = label.toLowerCase().trim();
      if (seen.has(normalizedKey)) continue;
      seen.add(normalizedKey);

      const type = pattern.type !== 'text' ? pattern.type : inferType(label);
      matches.push({ placeholder, label, type });
    }
  }

  return matches;
}

function buildHtmlContent(rawText: string, fields: Field[]): string {
  let html = escapeHtml(rawText).replace(/\n/g, '<br/>');
  for (const field of fields) {
    const escaped = escapeHtml(field.placeholder);
    const token = `{{${field.id}}}`;
    html = html.split(escaped).join(token);
  }
  return `<p style="font-family:'Times New Roman',serif;font-size:12pt;line-height:1.6;">${html}</p>`;
}

async function readTxt(uri: string): Promise<string> {
  return readAsStringAsync(uri, { encoding: EncodingType.UTF8 });
}

async function readDocx(uri: string): Promise<string> {
  try {
    const base64 = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });
    const zip = await JSZip.loadAsync(base64, { base64: true });
    const xmlFile = zip.file('word/document.xml');
    if (!xmlFile) return '';
    const xml = await xmlFile.async('string');
    return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

export interface DetectionResult {
  fields: Field[];
  htmlContent: string;
  rawText: string;
}

export async function detectFieldsFromFile(
  uri: string,
  fileName: string
): Promise<DetectionResult> {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

  let rawText = '';
  if (ext === 'txt' || ext === 'html' || ext === 'htm') {
    rawText = await readTxt(uri);
  } else if (ext === 'docx') {
    rawText = await readDocx(uri);
  } else {
    rawText = await readTxt(uri).catch(() => '');
  }

  const rawMatches = detectRawMatches(rawText);
  const fields: Field[] = rawMatches.map((m, i) => ({
    id: uuidv4(),
    label: m.label,
    placeholder: m.placeholder,
    type: m.type,
    required: false,
    order: i,
  }));

  const htmlContent = buildHtmlContent(rawText, fields);
  return { fields, htmlContent, rawText };
}

export function buildTemplateFromScratch(fields: Field[]): string {
  const rows = fields
    .map((f) => `<p><strong>${escapeHtml(f.label)}:</strong> {{${f.id}}}</p>`)
    .join('\n');
  return rows;
}
