export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Inicio: undefined;
  Plantillas: undefined;
  Documentos: undefined;
  Herramientas: undefined;
  Perfil: undefined;
};

export type ToolsStackParamList = {
  ToolsHome: undefined;
  Snippets: undefined;
  Contacts: undefined;
  Reference: undefined;
  Checklists: undefined;
};

export type TemplateStackParamList = {
  TemplateList: undefined;
  TemplateEditor: { templateId?: string };
  TemplateUpload: undefined;
};

export type DocumentStackParamList = {
  DocumentList: undefined;
  DocumentFill: { templateId: string; documentId?: string };
  DocumentPreview: { documentId?: string; renderedHtml?: string; title?: string };
};
