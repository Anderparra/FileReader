import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { Field, FieldType } from '../types';
import { FIELD_PATTERNS, NAME_STOPWORDS, SEMANTIC_RULES } from '../constants/fieldPatterns';
import { readDocxFormatted } from './docxRenderer';
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

function isInstitutionalName(match: string): boolean {
  const words = match.split(/\s+/);
  return words.some((w) => NAME_STOPWORDS.has(w.toUpperCase()));
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(' ')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function detectRawMatches(text: string): RawMatch[] {
  const matches: RawMatch[] = [];
  const seenKeys = new Set<string>();
  const labelCounts = new Map<string, number>();

  for (const pattern of FIELD_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    const mode = pattern.mode ?? 'placeholder';
    let m: RegExpExecArray | null;

    while ((m = regex.exec(text)) !== null) {
      const full = m[0];
      const placeholder = full;

      let label: string;
      if (mode === 'value') {
        if (pattern.labelHint === 'Nombre completo' && isInstitutionalName(full)) continue;
        label = pattern.labelHint;
      } else {
        const rawLabel = m[1] ?? pattern.labelHint;
        label = rawLabel
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .trim();
      }

      const key = `${label.toLowerCase()}::${placeholder}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      let finalLabel = label;
      if (mode === 'value') {
        const count = (labelCounts.get(label) ?? 0) + 1;
        labelCounts.set(label, count);
        if (count > 1) {
          const preview = titleCase(full.slice(0, 25));
          finalLabel = `${label} (${preview}${full.length > 25 ? '…' : ''})`;
        }
      }

      const type = pattern.type !== 'text' ? pattern.type : inferType(finalLabel);
      matches.push({ placeholder, label: finalLabel, type });
    }
  }

  return matches;
}

function substitutePlaceholdersInHtml(html: string, fields: Field[]): string {
  const sortedFields = [...fields].sort((a, b) => b.placeholder.length - a.placeholder.length);
  let out = html;
  for (const field of sortedFields) {
    const token = `{{${field.id}}}`;
    const escaped = escapeHtml(field.placeholder);
    if (out.includes(escaped)) {
      out = out.split(escaped).join(token);
    } else if (out.includes(field.placeholder)) {
      out = out.split(field.placeholder).join(token);
    }
  }
  return out;
}

function buildFallbackHtml(rawText: string, fields: Field[]): string {
  let html = escapeHtml(rawText).replace(/\n/g, '<br/>');
  html = substitutePlaceholdersInHtml(html, fields);
  return `<div style="font-family:'Times New Roman',serif;font-size:12pt;line-height:1.6;">${html}</div>`;
}

async function readTxt(uri: string): Promise<string> {
  return readAsStringAsync(uri, { encoding: EncodingType.UTF8 });
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
  let sourceHtml: string | null = null;

  let detectedTables: { kind: 'natural_persons' | 'legal_persons'; html: string }[] = [];

  if (ext === 'txt' || ext === 'html' || ext === 'htm') {
    rawText = await readTxt(uri);
  } else if (ext === 'docx') {
    const docx = await readDocxFormatted(uri);
    rawText = docx.text;
    sourceHtml = docx.html;
    detectedTables = docx.tables.filter(
      (t) => t.kind === 'natural_persons' || t.kind === 'legal_persons'
    ) as typeof detectedTables;
  } else {
    rawText = await readTxt(uri).catch(() => '');
  }

  const rawMatches = detectRawMatches(rawText);
  const textFields: Field[] = rawMatches.map((m, i) => ({
    id: uuidv4(),
    label: m.label,
    placeholder: m.placeholder,
    type: m.type,
    required: false,
    order: i,
  }));

  let naturalCount = 0;
  let legalCount = 0;
  const tableFields: Field[] = detectedTables.map((t, i) => {
    const isNat = t.kind === 'natural_persons';
    const idx = isNat ? ++naturalCount : ++legalCount;
    return {
      id: uuidv4(),
      label: isNat
        ? `Tabla de personas naturales${idx > 1 ? ` #${idx}` : ''}`
        : `Tabla de personas jurídicas${idx > 1 ? ` #${idx}` : ''}`,
      placeholder: t.html,
      type: isNat ? 'natural_persons_table' : 'legal_persons_table',
      required: false,
      order: textFields.length + i,
    };
  });

  const fields = [...textFields, ...tableFields];

  const htmlContent = sourceHtml
    ? substitutePlaceholdersInHtml(sourceHtml, fields)
    : buildFallbackHtml(rawText, fields);

  return { fields, htmlContent, rawText };
}

export function buildTemplateFromScratch(fields: Field[]): string {
  const rows = fields
    .map((f) => `<p><strong>${escapeHtml(f.label)}:</strong> {{${f.id}}}</p>`)
    .join('\n');
  return rows;
}
