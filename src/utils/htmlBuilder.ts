import { DocumentFieldValue, Field, InvestigatorProfile, LegalPerson, NaturalPerson, Template } from '../types';

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
  profile: InvestigatorProfile
): string {
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
        if (value) {
          replacement = `<img src="${value}" style="height:60px;display:block;" alt="Firma"/>`;
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

  const signatureBlock = profile.signatureFileUri
    ? `<img src="${profile.signatureFileUri}" style="height:70px;display:block;margin-bottom:4px;" alt="Firma"/>`
    : '<div style="height:70px;border-bottom:1px solid #333;width:200px;"></div>';

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
  ${html}
  <div class="footer-block">
    ${signatureBlock}
    <p style="margin:4px 0;font-weight:bold;">${escapeHtml(profile.fullName)}</p>
    <p style="margin:4px 0;">${escapeHtml(profile.rank)}</p>
    <p style="margin:4px 0;">${escapeHtml(profile.position)}</p>
    <p style="margin:4px 0;">${escapeHtml(profile.unit)}</p>
  </div>
  <div class="footer-reserved">INFORMACIÓN PÚBLICA RESERVADA</div>
</body>
</html>`;
}
