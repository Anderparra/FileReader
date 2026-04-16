import { useState, useEffect, useCallback } from 'react';
import { SavedDocument } from '../types';
import {
  getAllDocuments,
  saveDocument,
  deleteDocument,
  getDocumentById,
} from '../storage/documentStorage';

export function useDocuments() {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllDocuments();
    setDocuments(all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (doc: SavedDocument) => {
    await saveDocument(doc);
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await deleteDocument(id);
    await load();
  }, [load]);

  const getById = useCallback((id: string) => getDocumentById(id), []);

  return { documents, loading, save, remove, getById, reload: load };
}
