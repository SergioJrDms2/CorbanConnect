import { useCallback, useEffect, useState } from 'react';
import { fetchContracts } from '../lib/contracts';
import type { Contract } from '../types';

interface UseContractsResult {
  contracts: Contract[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useContracts(): UseContractsResult {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchContracts();
      setContracts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar contratos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { contracts, loading, error, reload };
}
