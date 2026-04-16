import { useState, useEffect, useCallback } from 'react';
import { Template } from '../types';
import {
  getAllTemplates,
  saveTemplate,
  deleteTemplate,
  getTemplateById,
} from '../storage/templateStorage';

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllTemplates();
    setTemplates(all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (template: Template) => {
    await saveTemplate(template);
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await deleteTemplate(id);
    await load();
  }, [load]);

  const getById = useCallback((id: string) => getTemplateById(id), []);

  return { templates, loading, save, remove, getById, reload: load };
}
