import { DocumentAttachment, DocumentFieldValue, InvestigatorProfile, LegalPerson, NaturalPerson, Template } from '../types';

export interface RenderOptions {
  attachments?: DocumentAttachment[];
  caseRef?: string;
  /** Pre-resolved data URI for the profile signature, avoids file:// issues */
  signatureDataUri?: string;
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function naturalPersonsTable(persons: NaturalPerson[]): string {
  const rows = persons
    .map(
      (p, i) =>
        `<tr><td style="padding:6px 10px;border:1px solid #aaa;text-align:center;">${i + 1}</td>
         <td style="padding:6px 10px;border:1px solid #aaa;">${escapeHtml(p.name)}</td>
         <td style="padding:6px 10px;border:1px solid #aaa;">${escapeHtml(p.cedula)}</td></tr>`
    )
    .join('');
  return `
    <table style="border-collapse:collapse;width:100%;margin:8px 0;">
      <thead>
        <tr style="background-color:#003087;color:#fff;">
          <th style="padding:8px 10px;border:1px solid #aaa;width:40px;">Nro.</th>
          <th style="padding:8px 10px;border:1px solid #aaa;">NOMBRE Y APELLIDOS</th>
          <th style="padding:8px 10px;border:1px solid #aaa;">IDENTIFICACIÓN</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="3" style="padding:8px;text-align:center;border:1px solid #aaa;">—</td></tr>'}</tbody>
    </table>`;
}

function legalPersonsTable(persons: LegalPerson[]): string {
  const rows = persons
    .map(
      (p, i) =>
        `<tr><td style="padding:6px 10px;border:1px solid #aaa;text-align:center;">${i + 1}</td>
         <td style="padding:6px 10px;border:1px solid #aaa;">${escapeHtml(p.companyName)}</td>
         <td style="padding:6px 10px;border:1px solid #aaa;">${escapeHtml(p.nit)}</td></tr>`
    )
    .join('');
  return `
    <table style="border-collapse:collapse;width:100%;margin:8px 0;">
      <thead>
        <tr style="background-color:#003087;color:#fff;">
          <th style="padding:8px 10px;border:1px solid #aaa;width:40px;">Nro.</th>
          <th style="padding:8px 10px;border:1px solid #aaa;">NOMBRE Y APELLIDOS</th>
          <th style="padding:8px 10px;border:1px solid #aaa;">NIT</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="3" style="padding:8px;text-align:center;border:1px solid #aaa;">—</td></tr>'}</tbody>
    </table>`;
}

export function buildRenderedHtml(
  template: Template,
  fieldValues: DocumentFieldValue[],
  profile: InvestigatorProfile,
  options: RenderOptions = {}
): string {
  const { attachments = [], caseRef, signatureDataUri } = options;
  const signatureSrc =
    signatureDataUri ||
    profile.signatureDataUri ||
    profile.signatureFileUri ||
    '';
  const valueMap = new Map<string, DocumentFieldValue['value']>();
  for (const fv of fieldValues) valueMap.set(fv.fieldId, fv.value);

  let html = template.htmlContent;

  for (const field of template.fields) {
    const token = `{{${field.id}}}`;
    const value = valueMap.get(field.id);

    let replacement = '';

    switch (field.type) {
      case 'natural_persons_table':
        replacement = naturalPersonsTable((value as NaturalPerson[]) ?? []);
        break;
      case 'legal_persons_table':
        replacement = legalPersonsTable((value as LegalPerson[]) ?? []);
        break;
      case 'signature':
        if (signatureSrc) {
          replacement = `<img src="${signatureSrc}" style="height:60px;display:block;" alt="Firma"/>`;
        }
        break;
      case 'investigator_name':
        replacement = `<strong>${escapeHtml(profile.fullName)}</strong>`;
        break;
      case 'investigator_rank':
        replacement = escapeHtml(`${profile.rank} - ${profile.position}`);
        break;
      default:
        replacement = escapeHtml(String(value ?? field.defaultValue ?? ''));
    }

    html = html.split(token).join(replacement);
  }

  const signatureBlock = signatureSrc
    ? `<img src="${signatureSrc}" style="height:70px;display:block;margin-bottom:4px;" alt="Firma"/>`
    : '<div style="height:70px;border-bottom:1px solid #333;width:200px;"></div>';

  // Detect what the template already includes so we don't duplicate it.
  const templateLower = (template.htmlContent ?? '').toLowerCase();
  const templateHasInvestigatorName =
    templateLower.includes(profile.fullName.toLowerCase()) ||
    template.fields.some(
      (f) => f.type === 'investigator_name' || f.type === 'signature'
    );
  const templateHasReserved = templateLower.includes('información pública reservada')
    || templateLower.includes('informacion publica reservada');

  const caseBlock = caseRef
    ? `<p style="font-size:10pt;color:#555;margin:4px 0;">Caso/Radicado: <strong>${escapeHtml(caseRef)}</strong></p>`
    : '';

  const attachmentsBlock = attachments.length > 0
    ? `<div class="attachments" style="margin-top:40px;page-break-before:auto;">
        <h3 style="color:#003087;border-bottom:1px solid #003087;padding-bottom:4px;">Evidencia fotográfica</h3>
        ${attachments.map((a, i) => `
          <div style="margin:12px 0;page-break-inside:avoid;">
            <img src="${a.uri}" style="max-width:100%;max-height:400px;border:1px solid #999;"/>
            <p style="font-size:10pt;color:#555;margin:4px 0 0 0;">
              Foto ${i + 1}${a.label ? ` - ${escapeHtml(a.label)}` : ''} · ${new Date(a.createdAt).toLocaleString('es-CO')}
            </p>
          </div>
        `).join('')}
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    @page { size: A4; margin: 2cm; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0;
      padding: 24px;
    }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #999; padding: 6px 10px; }
    th { background-color: #003087; color: #fff; font-weight: bold; }
    .footer-block { margin-top: 40px; }
    .footer-reserved {
      text-align: center;
      font-weight: bold;
      border-top: 2px solid #003087;
      padding-top: 6px;
      font-size: 10pt;
      color: #003087;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${caseBlock}
  ${html}
  ${
    templateHasInvestigatorName
      ? `<div class="footer-block" style="margin-top:20px;">${signatureBlock}</div>`
      : `<div class="footer-block">
          ${signatureBlock}
          <p style="margin:4px 0;font-weight:bold;">${escapeHtml(profile.fullName)}</p>
          <p style="margin:4px 0;">${escapeHtml(profile.rank)}</p>
          <p style="margin:4px 0;">${escapeHtml(profile.position)}</p>
          <p style="margin:4px 0;">${escapeHtml(profile.unit)}</p>
        </div>`
  }
  ${attachmentsBlock}
  ${templateHasReserved ? '' : '<div class="footer-reserved">INFORMACIÓN PÚBLICA RESERVADA</div>'}
</body>
</html>`;
}
