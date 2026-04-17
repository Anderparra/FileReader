export const STORAGE_KEYS = {
  INVESTIGATOR_PROFILE: '@policia/investigator_profile',
  TEMPLATES: '@policia/templates',
  DOCUMENTS: '@policia/documents',
  ONBOARDING_COMPLETE: '@policia/onboarding',
  SNIPPETS: '@policia/snippets',
} as const;

export const templateHtmlKey = (id: string) => `@policia/template_html_${id}`;
