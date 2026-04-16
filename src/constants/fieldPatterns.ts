import { FieldType } from '../types';

export interface FieldPattern {
  regex: RegExp;
  type: FieldType;
  labelHint: string;
}

export const FIELD_PATTERNS: FieldPattern[] = [
  { regex: /\{\{([^}]+)\}\}/g, type: 'text', labelHint: '$1' },
  { regex: /\{([A-Za-z_][^}]*)\}/g, type: 'text', labelHint: '$1' },
  { regex: /\[([^\]]{2,40})\]/g, type: 'text', labelHint: '$1' },
  { regex: /_{4,}/g, type: 'text', labelHint: 'Campo en blanco' },
  { regex: /\.{6,}/g, type: 'text', labelHint: 'Campo en blanco' },
  { regex: /\b([A-Z]{2,}(?:_[A-Z0-9]+)+)\b/g, type: 'text', labelHint: '$1' },
];

export interface SemanticRule {
  keywords: string[];
  type: FieldType;
}

export const SEMANTIC_RULES: SemanticRule[] = [
  { keywords: ['fecha', 'date', 'día', 'mes', 'año', 'dia'], type: 'date' },
  { keywords: ['firma', 'signature', 'firme', 'rubrica', 'rúbrica'], type: 'signature' },
  {
    keywords: ['investigador', 'funcionario', 'agente', 'nombre_investigador', 'nombre investigador'],
    type: 'investigator_name',
  },
  {
    keywords: ['cargo', 'grado', 'rango', 'rank', 'cargo_investigador'],
    type: 'investigator_rank',
  },
  {
    keywords: ['persona natural', 'personas naturales', 'natural_persons', 'naturales'],
    type: 'natural_persons_table',
  },
  {
    keywords: ['persona jurídica', 'personas jurídicas', 'juridica', 'jurídica', 'legal_persons'],
    type: 'legal_persons_table',
  },
  {
    keywords: ['descripción', 'descripcion', 'observaciones', 'cuerpo', 'body', 'motivo', 'asunto detalle'],
    type: 'multiline',
  },
];
