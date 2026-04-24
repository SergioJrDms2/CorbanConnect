import { useCallback, useEffect, useState } from 'react';
import { fetchContracts, fetchContractsByCorbanCnpj } from '../lib/contracts';
import type { Contract } from '../types';

interface UseContractsResult {
  contracts: Contract[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/** Fetches all contracts (internal dashboard use). */
export function useContracts(): UseContractsResult {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setContracts(await fetchContracts());
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

/** Fetches only contracts belonging to a given Corban CNPJ. */
export function useCorbanContracts(cnpj: string | null): UseContractsResult {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!cnpj) {
      setContracts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setContracts(await fetchContractsByCorbanCnpj(cnpj));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar contratos.');
    } finally {
      setLoading(false);
    }
  }, [cnpj]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { contracts, loading, error, reload };
}
