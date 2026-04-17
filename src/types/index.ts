export type FieldType =
  | 'text'
  | 'multiline'
  | 'date'
  | 'natural_persons_table'
  | 'legal_persons_table'
  | 'signature'
  | 'investigator_name'
  | 'investigator_rank';

export interface Field {
  id: string;
  label: string;
  placeholder: string;
  type: FieldType;
  required: boolean;
  order: number;
  defaultValue?: string;
}

export interface NaturalPerson {
  id: string;
  name: string;
  cedula: string;
}

export interface LegalPerson {
  id: string;
  companyName: string;
  nit: string;
}

export type TemplateSourceType = 'scratch' | 'uploaded';

export interface Template {
  id: string;
  name: string;
  description: string;
  sourceType: TemplateSourceType;
  htmlContent: string;
  originalFileName?: string;
  fields: Field[];
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus = 'draft' | 'complete' | 'exported';

export interface DocumentFieldValue {
  fieldId: string;
  value: string | NaturalPerson[] | LegalPerson[];
}

export interface SavedDocument {
  id: string;
  templateId: string;
  templateName: string;
  title: string;
  status: DocumentStatus;
  fieldValues: DocumentFieldValue[];
  renderedHtml: string;
  createdAt: string;
  updatedAt: string;
  exportedAt?: string;
}

export interface InvestigatorProfile {
  fullName: string;
  rank: string;
  position: string;
  unit: string;
  signatureFileUri?: string;
  isConfigured: boolean;
}

export interface Snippet {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
