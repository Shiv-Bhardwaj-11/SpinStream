import { useState } from 'react';
import { useStore } from '../store/useStore';
import { playSound } from '../utils/audio';
import { LogOut, PlayCircle, BarChart2, Users, Award, Settings, Flame } from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
}

export const Navbar = ({ onOpenSettings }: NavbarProps) => {
  const { currentView, setView, user, isAuthenticated, logout } = useStore();
  const [showGuestPopup, setShowGuestPopup] = useState(false);

  const handleNavClick = (view: typeof currentView) => {
    playSound.tick(0.4);
    if (!isAuthenticated && (view === 'dashboard' || view === 'social' || view === 'achievements')) {
      setShowGuestPopup(true);
      return;
    }
    setView(view);
  };

  const handleLogout = () => {
    playSound.clunk(0.6);
    logout();
    setView('landing');
  };

  // XP calculation
  const xpNeeded = user.level * 1000;
  const xpPercent = Math.min((user.xp / xpNeeded) * 100, 100);

  return (
    <>
      <nav className="glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
      borderBottom: '1px solid var(--border-color)',
      padding: '12px 0',
      transition: 'background var(--transition-normal)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => handleNavClick('landing')}>
          <span style={{ fontSize: '1.8rem' }}>🎰</span>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.4rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #ffffff 40%, var(--accent-primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>SpinStream</span>
        </div>

        {/* Navigation Tabs (Only show if on app screens, or keep visible) */}
        {currentView !== 'landing' && (
          <div className="desktop-only" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`btn ${currentView === 'slot' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => handleNavClick('slot')}
            >
              <PlayCircle size={15} />
              Slot
            </button>
            <button
              className={`btn ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => handleNavClick('dashboard')}
            >
              <BarChart2 size={15} />
              Stats
            </button>
            <button
              className={`btn ${currentView === 'social' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => handleNavClick('social')}
            >
              <Users size={15} />
              Social
            </button>
            <button
              className={`btn ${currentView === 'achievements' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => handleNavClick('achievements')}
            >
              <Award size={15} />
              Badges
            </button>
          </div>
        )}

        {/* User HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {currentView !== 'landing' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Level & XP */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '100px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  LV {user.level}
                </span>
                <div style={{
                  width: '80px',
                  height: '6px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginTop: '4px'
                }}>
                  <div style={{
                    width: `${xpPercent}%`,
                    height: '100%',
                    background: 'var(--accent-primary)',
                    borderRadius: '3px',
                    transition: 'width 0.4s ease-out'
                  }} />
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {user.xp} / {xpNeeded} XP
                </span>
              </div>

              {/* Streak */}
              <div className="glass" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                color: '#f97316'
              }}>
                <Flame size={14} fill="#f97316" className="glow-pulse" />
                {user.streak}d
              </div>

              {/* User Avatar */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                border: '1px solid var(--border-color)'
              }} title={user.name}>
                {user.avatar}
              </div>
            </div>
          )}

          {/* Settings trigger */}
          <button
            className="btn btn-secondary btn-icon"
            style={{ width: '36px', height: '36px' }}
            onClick={() => { playSound.tick(0.4); onOpenSettings(); }}
            title="Settings"
          >
            <Settings size={16} />
          </button>

          {isAuthenticated ? (
            <button
              className="btn btn-danger btn-icon"
              style={{ width: '36px', height: '36px' }}
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          ) : (
            currentView !== 'landing' && (
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                onClick={() => handleNavClick('landing')}
              >
                Sign In
              </button>
            )
          )}
        </div>

      </div>

      {/* Guest Restriction Popup */}
      {showGuestPopup && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass" style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '30px',
            borderRadius: 'var(--radius-xl)',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', color: '#ffffff' }}>Account Required</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              Stats, Social Hub, and Badges are exclusive features for registered users. 
              <br/><br/>
              Create a free account to track your progress, save your watch history, and connect with friends!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowGuestPopup(false)}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowGuestPopup(false);
                  setView('landing');
                }}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      </nav>

      {/* Mobile Bottom Navigation */}
      {currentView !== 'landing' && (
        <div className="mobile-bottom-nav">
          <button
            className={`btn ${currentView === 'slot' ? 'btn-primary' : ''}`}
            onClick={() => handleNavClick('slot')}
          >
            <PlayCircle size={20} />
            Slot
          </button>
          <button
            className={`btn ${currentView === 'dashboard' ? 'btn-primary' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <BarChart2 size={20} />
            Stats
          </button>
          <button
            className={`btn ${currentView === 'social' ? 'btn-primary' : ''}`}
            onClick={() => handleNavClick('social')}
          >
            <Users size={20} />
            Social
          </button>
          <button
            className={`btn ${currentView === 'achievements' ? 'btn-primary' : ''}`}
            onClick={() => handleNavClick('achievements')}
          >
            <Award size={20} />
            Badges
          </button>
        </div>
      )}
    </>
  );
};
