export const STORAGE_KEYS = {
  INVESTIGATOR_PROFILE: '@policia/investigator_profile',
  TEMPLATES: '@policia/templates',
  DOCUMENTS: '@policia/documents',
  ONBOARDING_COMPLETE: '@policia/onboarding',
  SNIPPETS: '@policia/snippets',
  SECURITY_ENABLED: '@policia/security_enabled',
  TEMPLATE_GUIDE_SEEN: '@policia/template_guide_seen',
  CONTACTS: '@policia/contacts',
  CHECKLIST_RUNS: '@policia/checklist_runs',
} as const;

export const templateHtmlKey = (id: string) => `@policia/template_html_${id}`;
