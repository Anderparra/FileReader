import { FieldType } from '../types';

export interface FieldPattern {
  regex: RegExp;
  type: FieldType;
  labelHint: string;
  mode?: 'placeholder' | 'value';
}

export const FIELD_PATTERNS: FieldPattern[] = [
  { regex: /\{\{([^}]+)\}\}/g, type: 'text', labelHint: '$1' },
  { regex: /\{([A-Za-z_][^}]*)\}/g, type: 'text', labelHint: '$1' },
  { regex: /\[([^\]]{2,40})\]/g, type: 'text', labelHint: '$1' },
  { regex: /_{4,}/g, type: 'text', labelHint: 'Campo en blanco' },
  { regex: /\.{6,}/g, type: 'text', labelHint: 'Campo en blanco' },
  { regex: /\b([A-Z]{2,}(?:_[A-Z0-9]+)+)\b/g, type: 'text', labelHint: '$1' },

  {
    regex: /\b\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+\d{4}\b/gi,
    type: 'date',
    labelHint: 'Fecha',
    mode: 'value',
  },
  {
    regex: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    type: 'date',
    labelHint: 'Fecha',
    mode: 'value',
  },
  {
    regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    type: 'text',
    labelHint: 'Correo electrónico',
    mode: 'value',
  },
  {
    regex: /\b3\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/g,
    type: 'text',
    labelHint: 'Teléfono celular',
    mode: 'value',
  },
  {
    regex: /\bGS-\d{4}-\s*[^/\s]*\/[A-Z-]+\b/g,
    type: 'text',
    labelHint: 'Número radicado',
    mode: 'value',
  },
  {
    regex: /\b[A-ZÁÉÍÓÚÑ]{3,}(?:\s+[A-ZÁÉÍÓÚÑ]{2,}){2,}\b/g,
    type: 'text',
    labelHint: 'Nombre completo',
    mode: 'value',
  },
];

export const NAME_STOPWORDS = new Set([
  'MINISTERIO', 'DEFENSA', 'NACIONAL', 'POLICIA', 'POLICÍA',
  'DIRECCION', 'DIRECCIÓN', 'INVESTIGACION', 'INVESTIGACIÓN',
  'CRIMINAL', 'INTERPOL', 'GRUPO', 'INVESTIGATIVO', 'LAVADO',
  'ACTIVOS', 'PERSONAS', 'NATURALES', 'JURIDICAS', 'JURÍDICAS',
  'NOMBRE', 'APELLIDOS', 'IDENTIFICACION', 'IDENTIFICACIÓN',
  'INFORMACION', 'INFORMACIÓN', 'PUBLICA', 'PÚBLICA', 'RESERVADA',
  'ASUNTO', 'FISCALIA', 'FISCALÍA', 'GENERAL', 'NACION', 'NACIÓN',
  'REPUBLICA', 'REPÚBLICA', 'COLOMBIA', 'PATRULLERO', 'CAPITAN',
  'CAPITÁN', 'TENIENTE', 'CORONEL', 'MAYOR', 'GENERAL',
]);

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
