import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { HomeView } from './views/HomeView';
import { ClientLoginView } from './views/ClientLoginView';
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
  const [clientContract, setClientContract] = useState<Contract | null>(null);
  const [session, setSession] = useState<Session | null>(null);
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

  async function handleInternalLogout() {
    if (supabase) await supabase.auth.signOut();
    setView('home');
  }

  return (
    <>
      {view === 'home' && <HomeView onNavigate={handleNavigate} />}

      {view === 'client-login' && (
        <ClientLoginView
          onBack={goHome}
          onLogin={(contract) => {
            setClientContract(contract);
            setView('client-status');
          }}
        />
      )}
      {view === 'client-status' && clientContract && (
        <ClientStatusView contract={clientContract} onBack={goHome} />
      )}

      {view === 'corban-login' && (
        <CorbanLoginView onBack={goHome} onLogin={() => setView('corban-dashboard')} />
      )}
      {view === 'corban-dashboard' && (
        <CorbanDashboardView
          key={`corban-${reloadKey}`}
          onBack={goHome}
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
