import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
// @ts-ignore
import JSZip from 'jszip';
import { DocxResult, DetectedTable, TableKind } from './docxRenderer';

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function classifyXlsxTable(headerText: string): TableKind {
  const t = headerText.toLowerCase();
  const hasName = t.includes('nombre') || t.includes('apellido');
  const hasCedula = t.includes('identificaci') || t.includes('cédula') || t.includes('cedula') || t.includes('c.c.');
  const hasNit = t.includes('nit');
  if (hasName && hasNit) return 'legal_persons';
  if (hasName && hasCedula) return 'natural_persons';
  return 'generic';
}

async function loadSharedStrings(zip: any): Promise<string[]> {
  const ssFile = zip.file('xl/sharedStrings.xml');
  if (!ssFile) return [];
  const xml = await ssFile.async('string');
  const result: string[] = [];
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let m: RegExpExecArray | null;
  while ((m = siRegex.exec(xml)) !== null) {
    const block = m[1];
    const tMatches = [...block.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)];
    const text = tMatches.map((tm) => decodeXmlEntities(tm[1])).join('');
    result.push(text);
  }
  return result;
}

async function listSheetPaths(zip: any): Promise<string[]> {
  const wbFile = zip.file('xl/workbook.xml');
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (!wbFile || !relsFile) {
    const fallback = zip.file('xl/worksheets/sheet1.xml');
    return fallback ? ['xl/worksheets/sheet1.xml'] : [];
  }
  const wbXml = await wbFile.async('string');
  const relsXml = await relsFile.async('string');
  const sheets: { name: string; rid: string }[] = [];
  const sheetRegex = /<sheet\b[^>]*\bname="([^"]+)"[^>]*\br:id="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = sheetRegex.exec(wbXml)) !== null) {
    sheets.push({ name: m[1], rid: m[2] });
  }
  const paths: string[] = [];
  for (const s of sheets) {
    const relMatch = relsXml.match(
      new RegExp(`<Relationship\\b[^>]*Id="${s.rid}"[^>]*Target="([^"]+)"`)
    );
    if (relMatch) {
      const target = relMatch[1].replace(/^\/?/, '');
      const path = target.startsWith('xl/') ? target : `xl/${target}`;
      paths.push(path);
    }
  }
  return paths.length
    ? paths
    : zip.file('xl/worksheets/sheet1.xml')
    ? ['xl/worksheets/sheet1.xml']
    : [];
}

function cellRefToCol(ref: string): number {
  const m = ref.match(/^([A-Z]+)/);
  if (!m) return 0;
  let n = 0;
  for (const c of m[1]) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

async function renderSheet(
  zip: any,
  path: string,
  sharedStrings: string[]
): Promise<{ html: string; text: string; headerText: string }> {
  const file = zip.file(path);
  if (!file) return { html: '', text: '', headerText: '' };
  const xml = await file.async('string');

  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let htmlRows = '';
  let textRows = '';
  let headerText = '';
  let rowIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = rowRegex.exec(xml)) !== null) {
    const rowContent = m[1];
    const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g;
    const cells: { col: number; value: string }[] = [];
    let cm: RegExpExecArray | null;
    while ((cm = cellRegex.exec(rowContent)) !== null) {
      const attrs = cm[1] ?? cm[3] ?? '';
      const inner = cm[2] ?? '';
      const refMatch = attrs.match(/\br="([^"]+)"/);
      const col = refMatch ? cellRefToCol(refMatch[1]) : cells.length;
      const typeMatch = attrs.match(/\bt="([^"]+)"/);
      const type = typeMatch ? typeMatch[1] : 'n';
      let value = '';
      if (type === 's') {
        const vMatch = inner.match(/<v\b[^>]*>([\s\S]*?)<\/v>/);
        if (vMatch) {
          const idx = parseInt(vMatch[1], 10);
          value = sharedStrings[idx] ?? '';
        }
      } else if (type === 'inlineStr' || type === 'str') {
        const tMatches = [...inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)];
        value = tMatches.map((tm) => decodeXmlEntities(tm[1])).join('');
      } else {
        const vMatch = inner.match(/<v\b[^>]*>([\s\S]*?)<\/v>/);
        if (vMatch) value = decodeXmlEntities(vMatch[1]);
      }
      cells.push({ col, value });
    }
    if (cells.length === 0) continue;
    cells.sort((a, b) => a.col - b.col);
    const maxCol = cells[cells.length - 1].col;
    const grid: string[] = Array(maxCol + 1).fill('');
    for (const c of cells) grid[c.col] = c.value;
    htmlRows +=
      '<tr>' +
      grid
        .map(
          (v) =>
            `<td style="border:1px solid #888;padding:4pt 8pt;font-size:10pt;">${escapeHtml(
              v
            )}</td>`
        )
        .join('') +
      '</tr>';
    textRows += grid.join('\t') + '\n';
    if (rowIndex < 3) headerText += grid.join(' ') + ' ';
    rowIndex++;
  }

  const html = htmlRows
    ? `<table style="border-collapse:collapse;width:100%;margin:6pt 0;border:1px solid #666;">${htmlRows}</table>`
    : '';
  return { html, text: textRows.trim(), headerText };
}

export async function readXlsxFormatted(uri: string): Promise<DocxResult> {
  try {
    const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    const zip = await JSZip.loadAsync(base64, { base64: true });

    const sharedStrings = await loadSharedStrings(zip);
    const sheetPaths = await listSheetPaths(zip);

    let html = '';
    let text = '';
    const tables: DetectedTable[] = [];

    for (let i = 0; i < sheetPaths.length; i++) {
      const sheet = await renderSheet(zip, sheetPaths[i], sharedStrings);
      if (!sheet.html) continue;
      if (sheetPaths.length > 1) {
        html += `<h3 style="color:#003087;margin:12pt 0 6pt 0;">Hoja ${i + 1}</h3>`;
      }
      html += sheet.html;
      text += (text ? '\n\n' : '') + sheet.text;

      const kind = classifyXlsxTable(sheet.headerText);
      if (kind !== 'generic') {
        tables.push({ kind, html: sheet.html });
      }
    }

    const wrapped = `<div style="font-family:'Arial',sans-serif;font-size:10pt;line-height:1.4;color:#1a1a1a;">${html}</div>`;
    return { html: wrapped, text, tables, highlightedPhrases: [] };
  } catch {
    return { html: '', text: '', tables: [], highlightedPhrases: [] };
  }
}
