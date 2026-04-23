import { useState } from 'react';
import { HomeView } from './views/HomeView';
import { ClientLoginView } from './views/ClientLoginView';
import { ClientStatusView } from './views/ClientStatusView';
import { CorbanLoginView } from './views/CorbanLoginView';
import { CorbanDashboardView } from './views/CorbanDashboardView';
import { CorbanContractView } from './views/CorbanContractView';
import { InternalDashboardView } from './views/InternalDashboardView';
import { NotificationPreviewView } from './views/NotificationPreviewView';
import type { Contract, ViewId } from './types';

export default function App() {
  const [view, setView] = useState<ViewId>('home');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const goHome = () => setView('home');

  return (
    <>
      {view === 'home' && <HomeView onNavigate={setView} />}
      {view === 'client-login' && (
        <ClientLoginView onBack={goHome} onLogin={() => setView('client-status')} />
      )}
      {view === 'client-status' && <ClientStatusView onBack={goHome} />}
      {view === 'corban-login' && (
        <CorbanLoginView onBack={goHome} onLogin={() => setView('corban-dashboard')} />
      )}
      {view === 'corban-dashboard' && (
        <CorbanDashboardView
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
      {view === 'internal-dashboard' && <InternalDashboardView onBack={goHome} />}
      {view === 'notifications' && <NotificationPreviewView onBack={goHome} />}
    </>
  );
}
