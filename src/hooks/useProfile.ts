import { useState, useEffect, useCallback } from 'react';
import { InvestigatorProfile } from '../types';
import { getProfile, saveProfile } from '../storage/profileStorage';

export function useProfile() {
  const [profile, setProfile] = useState<InvestigatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const p = await getProfile();
    setProfile(p);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (p: InvestigatorProfile) => {
    await saveProfile(p);
    setProfile(p);
  }, []);

  return { profile, loading, save, reload: load };
}
