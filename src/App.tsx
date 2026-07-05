import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useStore } from './store/useStore';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { SlotMachine } from './components/SlotMachine';
import { Dashboard } from './components/Dashboard';
import { Social } from './components/Social';
import { Achievements } from './components/Achievements';
import { SettingsModal } from './components/SettingsModal';
import { BadgeToast } from './components/BadgeToast';

function App() {
  const { currentView, recordVisit } = useStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    recordVisit();
  }, [recordVisit]);

  // View router
  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage />;
      case 'slot':
        return <SlotMachine />;
      case 'dashboard':
        return <Dashboard />;
      case 'social':
        return <Social />;
      case 'achievements':
        return <Achievements />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Show Navbar on all views except Landing Page */}
      {currentView !== 'landing' && (
        <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />
      )}

      {/* Main View Area */}
      <main style={{ flex: 1 }}>
        {renderView()}
      </main>

      {/* Global Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {/* Global Badge Notifications */}
      <BadgeToast />

      {/* Small footer */}
      <footer style={{
        padding: '20px 0',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        borderTop: currentView !== 'landing' ? '1px solid var(--border-color)' : 'none',
        marginTop: 'auto'
      }}>
        <div className="page-container" style={{ padding: '0 24px' }}>
          <p>© {new Date().getFullYear()} SpinStream. Play Responsibly. Watch Happy.</p>
        </div>
      </footer>
      <Analytics />
    </div>
  );
}

export default App;
