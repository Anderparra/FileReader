import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
// @ts-ignore
import JSZip from 'jszip';

export interface DocxResult {
  html: string;
  text: string;
  tables: DetectedTable[];
}

export type TableKind = 'natural_persons' | 'legal_persons' | 'generic';

export interface DetectedTable {
  kind: TableKind;
  html: string;
}

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

interface RenderContext {
  /** Map of rId → data URI for embedded images */
  imageMap: Record<string, string>;
  /** Accumulated detected tables, filled while parsing */
  detectedTables: DetectedTable[];
}

function classifyTable(headerText: string): TableKind {
  const t = headerText.toLowerCase();
  const hasName = t.includes('nombre') || t.includes('apellido');
  const hasCedula = t.includes('identificaci') || t.includes('cédula') || t.includes('cedula') || t.includes('c.c.');
  const hasNit = t.includes('nit');
  if (hasName && hasNit) return 'legal_persons';
  if (hasName && hasCedula) return 'natural_persons';
  if (hasName && (t.includes('nro') || t.includes('no.') || t.includes('#')) && !hasNit) return 'natural_persons';
  return 'generic';
}

function parseRun(runXml: string, ctx: RenderContext): { html: string; text: string } {
  const rPrMatch = runXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
  const rPr = rPrMatch ? rPrMatch[1] : '';

  const bold = /<w:b(\s|\/>)/.test(rPr) && !/<w:b\b[^>]*w:val="(0|false)"/.test(rPr);
  const italic = /<w:i(\s|\/>)/.test(rPr) && !/<w:i\b[^>]*w:val="(0|false)"/.test(rPr);
  const underline = /<w:u\s/.test(rPr);
  const strike = /<w:strike(\s|\/>)/.test(rPr);
  const sizeMatch = rPr.match(/<w:sz\s+w:val="(\d+)"/);
  const colorMatch = rPr.match(/<w:color\s+w:val="([A-Fa-f0-9]{6})"/);
  const fontMatch = rPr.match(/<w:rFonts[^>]*w:ascii="([^"]+)"/);
  const highlightMatch = rPr.match(/<w:highlight\s+w:val="([^"]+)"/);

  const styles: string[] = [];
  if (bold) styles.push('font-weight:bold');
  if (italic) styles.push('font-style:italic');
  if (underline) styles.push('text-decoration:underline');
  if (strike) styles.push('text-decoration:line-through');
  if (sizeMatch) styles.push(`font-size:${parseInt(sizeMatch[1], 10) / 2}pt`);
  if (colorMatch) {
    const c = colorMatch[1].toLowerCase();
    if (c !== 'auto' && c !== '000000') styles.push(`color:#${colorMatch[1]}`);
  }
  if (fontMatch) styles.push(`font-family:'${fontMatch[1]}',serif`);
  if (highlightMatch) {
    const map: Record<string, string> = {
      yellow: '#ffff00', green: '#00ff00', cyan: '#00ffff',
      magenta: '#ff00ff', red: '#ff0000', blue: '#0000ff',
      white: '#ffffff', darkBlue: '#000080', darkCyan: '#008080',
      darkGreen: '#008000', darkMagenta: '#800080', darkRed: '#800000',
      darkYellow: '#808000', darkGray: '#808080', lightGray: '#c0c0c0',
    };
    const hl = map[highlightMatch[1]] ?? highlightMatch[1];
    styles.push(`background-color:${hl}`);
  }

  const parts: string[] = [];
  let plainText = '';

  const tokenRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:br\b[^>]*\/?>|<w:tab\b[^>]*\/?>|<w:drawing\b[\s\S]*?<\/w:drawing>|<w:pict\b[\s\S]*?<\/w:pict>/g;
  let tm: RegExpExecArray | null;
  while ((tm = tokenRegex.exec(runXml)) !== null) {
    const tag = tm[0];
    // tm[1] is only defined when the <w:t>...</w:t> alternation matched.
    // Checking tag.startsWith('<w:t') would also accept <w:tab/> and crash below.
    if (tm[1] !== undefined) {
      const text = decodeXmlEntities(tm[1]);
      parts.push(escapeHtml(text));
      plainText += text;
    } else if (tag.startsWith('<w:br')) {
      parts.push('<br/>');
      plainText += '\n';
    } else if (tag.startsWith('<w:tab')) {
      parts.push('&emsp;');
      plainText += '\t';
    } else if (tag.startsWith('<w:drawing') || tag.startsWith('<w:pict')) {
      const blipMatch = tag.match(/r:embed="([^"]+)"|r:id="([^"]+)"/);
      const rId = blipMatch ? (blipMatch[1] ?? blipMatch[2]) : '';
      const dataUri = ctx.imageMap[rId];
      const cxMatch = tag.match(/<wp:extent\s+cx="(\d+)"\s+cy="(\d+)"/);
      let dimStyle = 'max-width:100%;height:auto;';
      if (cxMatch) {
        const widthPx = Math.round(parseInt(cxMatch[1], 10) / 9525);
        const heightPx = Math.round(parseInt(cxMatch[2], 10) / 9525);
        dimStyle = `width:${widthPx}px;height:${heightPx}px;max-width:100%;`;
      }
      if (dataUri) {
        parts.push(`<img src="${dataUri}" style="${dimStyle}" alt=""/>`);
      }
    }
  }

  let html = parts.join('');
  if (styles.length && plainText.length > 0) {
    html = `<span style="${styles.join(';')}">${html}</span>`;
  }
  return { html, text: plainText };
}

function parseParagraph(pXml: string, ctx: RenderContext): { html: string; text: string } {
  const pPrMatch = pXml.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/);
  const pPr = pPrMatch ? pPrMatch[1] : '';
  const alignMatch = pPr.match(/<w:jc\s+w:val="([^"]+)"/);
  const alignMap: Record<string, string> = {
    center: 'center', right: 'right', both: 'justify', left: 'left',
  };
  const align = alignMatch ? alignMap[alignMatch[1]] : undefined;

  const styles: string[] = ['margin:0 0 6pt 0'];
  if (align) styles.push(`text-align:${align}`);

  const runRegex = /<w:r(?![A-Za-z])[^>]*>[\s\S]*?<\/w:r>/g;
  let innerHtml = '';
  let text = '';
  let m: RegExpExecArray | null;
  while ((m = runRegex.exec(pXml)) !== null) {
    const r = parseRun(m[0], ctx);
    innerHtml += r.html;
    text += r.text;
  }

  return {
    html: `<p style="${styles.join(';')}">${innerHtml || '&nbsp;'}</p>`,
    text: text + '\n',
  };
}

function parseTable(tblXml: string, ctx: RenderContext): { html: string; text: string } {
  const rowRegex = /<w:tr(?![A-Za-z])[^>]*>[\s\S]*?<\/w:tr>/g;
  let html =
    '<table style="border-collapse:collapse;width:100%;margin:6pt 0;border:1px solid #666;">';
  let text = '';
  let headerText = '';
  let allText = '';
  let rowIndex = 0;
  let rm: RegExpExecArray | null;
  while ((rm = rowRegex.exec(tblXml)) !== null) {
    const rowXml = rm[0];
    const cellRegex = /<w:tc(?![A-Za-z])[^>]*>([\s\S]*?)<\/w:tc>/g;
    html += '<tr>';
    let cm: RegExpExecArray | null;
    while ((cm = cellRegex.exec(rowXml)) !== null) {
      const cellContent = cm[1];
      const { html: cellHtml, text: cellText } = parseBlocks(cellContent, ctx);
      html += `<td style="border:1px solid #666;padding:4pt 6pt;vertical-align:top;">${cellHtml}</td>`;
      text += cellText + '\t';
      if (rowIndex < 3) headerText += cellText + ' ';
      allText += cellText + ' ';
    }
    html += '</tr>';
    text += '\n';
    rowIndex++;
  }
  html += '</table>';

  let kind = classifyTable(headerText);
  if (kind === 'generic') {
    // fall back: scan the whole table text for discriminating keywords
    kind = classifyTable(allText);
  }
  if (kind !== 'generic') {
    ctx.detectedTables.push({ kind, html });
  }
  return { html, text };
}

function parseBlocks(xml: string, ctx: RenderContext): { html: string; text: string } {
  const blockRegex = /<w:(p|tbl)(?![A-Za-z])[^>]*>[\s\S]*?<\/w:\1>/g;
  let html = '';
  let text = '';
  let m: RegExpExecArray | null;
  while ((m = blockRegex.exec(xml)) !== null) {
    const block = m[0];
    if (block.startsWith('<w:p')) {
      const r = parseParagraph(block, ctx);
      html += r.html;
      text += r.text;
    } else {
      const r = parseTable(block, ctx);
      html += r.html;
      text += r.text;
    }
  }
  return { html, text };
}

async function buildImageMap(zip: any): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const relsFile = zip.file('word/_rels/document.xml.rels');
  if (!relsFile) return map;
  const relsXml = await relsFile.async('string');
  const relRegex = /<Relationship\b[^>]*Id="([^"]+)"[^>]*Type="([^"]+)"[^>]*Target="([^"]+)"/g;
  const imageRels: { id: string; target: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = relRegex.exec(relsXml)) !== null) {
    const [, id, type, target] = m;
    if (type.includes('/image')) {
      imageRels.push({ id, target });
    }
  }

  for (const { id, target } of imageRels) {
    const clean = target.replace(/^\.\//, '');
    const path = clean.startsWith('media/') || clean.startsWith('word/')
      ? (clean.startsWith('word/') ? clean : `word/${clean}`)
      : `word/${clean}`;
    const file = zip.file(path);
    if (!file) continue;
    const b64 = await file.async('base64');
    const ext = (target.split('.').pop() || 'png').toLowerCase();
    const mime =
      ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
      ext === 'gif' ? 'image/gif' :
      ext === 'svg' ? 'image/svg+xml' :
      ext === 'bmp' ? 'image/bmp' :
      'image/png';
    map[id] = `data:${mime};base64,${b64}`;
  }
  return map;
}

export async function readDocxFormatted(uri: string): Promise<DocxResult> {
  try {
    const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    const zip = await JSZip.loadAsync(base64, { base64: true });
    const docFile = zip.file('word/document.xml');
    if (!docFile) return { html: '', text: '', tables: [] };

    const xml = await docFile.async('string');
    const imageMap = await buildImageMap(zip);
    const ctx: RenderContext = { imageMap, detectedTables: [] };

    const bodyMatch = xml.match(/<w:body>([\s\S]*)<\/w:body>/);
    const body = bodyMatch ? bodyMatch[1] : xml;

    const { html, text } = parseBlocks(body, ctx);

    const wrapped = `<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.4;color:#1a1a1a;">${html}</div>`;
    return {
      html: wrapped,
      text: text.replace(/\n{3,}/g, '\n\n').trim(),
      tables: ctx.detectedTables,
    };
  } catch {
    return { html: '', text: '', tables: [] };
  }
}
