import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { HomeView } from './views/HomeView';
import { ClientLoginView } from './views/ClientLoginView';
import { ClientContractsListView } from './views/ClientContractsListView';
import { ClientStatusView } from './views/ClientStatusView';
import { CorbanLoginView } from './views/CorbanLoginView';
import { CorbanDashboardView } from './views/CorbanDashboardView';
import { CorbanContractView } from './views/CorbanContractView';
import { InternalLoginView } from './views/InternalLoginView';
import { InternalDashboardView } from './views/InternalDashboardView';
import { NotificationPreviewView } from './views/NotificationPreviewView';
import { supabase } from './lib/supabase';
import type { Contract, ViewId } from './types';

export default function App() {
  const [view, setView] = useState<ViewId>('home');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Client session: array of contracts belonging to the CPF+birth that logged in.
  const [clientContracts, setClientContracts] = useState<Contract[]>([]);

  // Corban session: the CNPJ the corban authenticated with.
  const [corbanCnpj, setCorbanCnpj] = useState<string | null>(null);

  // Internal (Supabase Auth) session.
  const [session, setSession] = useState<Session | null>(null);

  // Force-refresh scoped dashboards when new XLSX is uploaded.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const goHome = () => setView('home');

  function handleNavigate(target: ViewId) {
    if (target === 'internal-dashboard') {
      setView(session ? 'internal-dashboard' : 'internal-login');
      return;
    }
    setView(target);
  }

  function handleClientLogin(contracts: Contract[]) {
    setClientContracts(contracts);
    if (contracts.length === 1) {
      setSelectedContract(contracts[0]);
      setView('client-status');
    } else {
      setView('client-contracts');
    }
  }

  function handleClientLogout() {
    setClientContracts([]);
    setSelectedContract(null);
    setView('home');
  }

  function handleCorbanLogout() {
    setCorbanCnpj(null);
    setView('home');
  }

  async function handleInternalLogout() {
    if (supabase) await supabase.auth.signOut();
    setView('home');
  }

  return (
    <>
      {view === 'home' && <HomeView onNavigate={handleNavigate} />}

      {view === 'client-login' && (
        <ClientLoginView onBack={goHome} onLogin={handleClientLogin} />
      )}
      {view === 'client-contracts' && (
        <ClientContractsListView
          contracts={clientContracts}
          onBack={handleClientLogout}
          onOpen={(c) => {
            setSelectedContract(c);
            setView('client-status');
          }}
        />
      )}
      {view === 'client-status' && selectedContract && (
        <ClientStatusView
          contract={selectedContract}
          onBack={
            clientContracts.length > 1 ? () => setView('client-contracts') : handleClientLogout
          }
        />
      )}

      {view === 'corban-login' && (
        <CorbanLoginView
          onBack={goHome}
          onLogin={({ cnpj }) => {
            setCorbanCnpj(cnpj);
            setView('corban-dashboard');
          }}
        />
      )}
      {view === 'corban-dashboard' && corbanCnpj && (
        <CorbanDashboardView
          key={`corban-${corbanCnpj}-${reloadKey}`}
          cnpj={corbanCnpj}
          onBack={handleCorbanLogout}
          onOpenContract={(c) => {
            setSelectedContract(c);
            setView('corban-contract');
          }}
        />
      )}
      {view === 'corban-contract' && selectedContract && (
        <CorbanContractView
          contract={selectedContract}
          onBack={() => setView('corban-dashboard')}
        />
      )}

      {view === 'internal-login' && (
        <InternalLoginView
          onBack={goHome}
          onSuccess={() => setView('internal-dashboard')}
        />
      )}
      {view === 'internal-dashboard' && (
        <InternalDashboardView
          key={`internal-${reloadKey}`}
          onBack={handleInternalLogout}
          userEmail={session?.user.email ?? null}
          onUploaded={() => setReloadKey((k) => k + 1)}
        />
      )}

      {view === 'notifications' && <NotificationPreviewView onBack={goHome} />}
    </>
  );
}
