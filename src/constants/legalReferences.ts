export interface LegalReference {
  id: string;
  code: string;
  article: string;
  topic: string;
  text: string;
  tags: string[];
}

export const LEGAL_REFERENCES: LegalReference[] = [
  {
    id: 'cpc-250-8',
    code: 'Constitución Política',
    article: 'Art. 250 num. 8',
    topic: 'Función de Policía Judicial',
    text: 'La Fiscalía General de la Nación... dirigirá y coordinará las funciones de policía judicial que en forma permanente cumple la Policía Nacional y los demás organismos que señale la ley.',
    tags: ['policía judicial', 'constitución', 'fiscalía'],
  },
  {
    id: 'cpc-250-complete',
    code: 'Constitución Política',
    article: 'Art. 250',
    topic: 'Funciones de la Fiscalía General',
    text: 'La Fiscalía General de la Nación está obligada a adelantar el ejercicio de la acción penal y realizar la investigación de los hechos que revistan las características de un delito que lleguen a su conocimiento por medio de denuncia, petición especial, querella o de oficio, siempre y cuando medien suficientes motivos y circunstancias fácticas que indiquen la posible existencia del mismo.',
    tags: ['acción penal', 'fiscalía', 'investigación'],
  },
  {
    id: 'ley-1708-art-161',
    code: 'Ley 1708/2014 (Código de Extinción de Dominio)',
    article: 'Art. 161',
    topic: 'Solicitud de información',
    text: 'El fiscal podrá solicitar de cualquier entidad pública o privada, o a particulares, la información que requiera para el cumplimiento de sus funciones en la acción de extinción de dominio. Las entidades y personas estarán en la obligación de suministrar la información en los términos establecidos por el fiscal.',
    tags: ['extinción de dominio', 'sided', 'información'],
  },
  {
    id: 'ley-1708-art-122b',
    code: 'Ley 1708/2014',
    article: 'Art. 122B',
    topic: 'Consultas en bases de datos',
    text: 'Los funcionarios encargados de la acción de extinción de dominio podrán consultar las bases de datos públicas y privadas necesarias para verificar si las personas vinculadas a investigaciones se encuentran relacionadas con procesos de extinción de dominio.',
    tags: ['bases de datos', 'sided', 'extinción de dominio'],
  },
  {
    id: 'ley-1581-2012',
    code: 'Ley 1581/2012',
    article: 'General',
    topic: 'Protección de datos personales',
    text: 'La presente ley tiene por objeto desarrollar el derecho constitucional que tienen todas las personas a conocer, actualizar y rectificar las informaciones que se hayan recogido sobre ellas en bases de datos o archivos, y los demás derechos, libertades y garantías constitucionales.',
    tags: ['datos personales', 'habeas data', 'reserva'],
  },
  {
    id: 'ley-1712-2014',
    code: 'Ley 1712/2014',
    article: 'General',
    topic: 'Transparencia y acceso a información pública',
    text: 'Regula el derecho de acceso a la información pública, los procedimientos para el ejercicio y garantía del derecho, y las excepciones a la publicidad de la información.',
    tags: ['transparencia', 'información pública', 'reserva legal'],
  },
  {
    id: 'cpp-287',
    code: 'Ley 906/2004 (CPP)',
    article: 'Art. 287',
    topic: 'Imputación',
    text: 'La imputación consiste en la comunicación que el fiscal hace a una persona de su calidad de imputado, en audiencia que se lleva a cabo ante el Juez de Control de Garantías.',
    tags: ['imputación', 'proceso penal', 'garantías'],
  },
  {
    id: 'cpp-301',
    code: 'Ley 906/2004 (CPP)',
    article: 'Art. 301',
    topic: 'Flagrancia',
    text: 'Se entiende que hay flagrancia cuando: 1) La persona es sorprendida y aprehendida durante la comisión del delito. 2) La persona es sorprendida o individualizada durante la comisión del delito y aprehendida inmediatamente después por persecución o voces de auxilio. 3) La persona es sorprendida y capturada con objetos, instrumentos o huellas, de los cuales aparezca fundadamente que momentos antes ha cometido un delito o participado en él.',
    tags: ['flagrancia', 'captura', 'proceso penal'],
  },
  {
    id: 'cpp-213',
    code: 'Ley 906/2004 (CPP)',
    article: 'Art. 213',
    topic: 'Inspección del cadáver',
    text: 'La Policía Judicial realizará la inspección técnica a cadáver para establecer de manera prioritaria su identidad, estado del cuerpo y las posibles causas de la muerte, bajo la dirección del fiscal y con apoyo de los peritos correspondientes.',
    tags: ['inspección', 'cadáver', 'policía judicial'],
  },
  {
    id: 'cpp-205',
    code: 'Ley 906/2004 (CPP)',
    article: 'Art. 205',
    topic: 'Actividad de la Policía Judicial en la indagación',
    text: 'Los servidores públicos que, en ejercicio de sus funciones de policía judicial, reciban denuncias, querellas o informes de otra clase, de los cuales se infiera la posible comisión de un delito, realizarán de inmediato todos los actos urgentes, tales como inspección del lugar, inspección de cadáver, entrevistas e interrogatorios.',
    tags: ['indagación', 'policía judicial', 'actos urgentes'],
  },
  {
    id: 'codigo-penal-323',
    code: 'Código Penal (Ley 599/2000)',
    article: 'Art. 323',
    topic: 'Lavado de activos',
    text: 'El que adquiera, resguarde, invierta, transporte, transforme, almacene, conserve, custodie o administre bienes que tengan su origen mediato o inmediato en actividades de tráfico de drogas, extorsión, enriquecimiento ilícito, secuestro, rebelión, trata de personas, tráfico de armas, delitos contra el sistema financiero... incurrirá en prisión de diez (10) a treinta (30) años.',
    tags: ['lavado de activos', 'grula', 'código penal'],
  },
];
