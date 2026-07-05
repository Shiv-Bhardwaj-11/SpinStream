import React from 'react';
import { useStore } from '../store/useStore';
import { playSound } from '../utils/audio';
import { Volume2, Zap, X } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings, user, updateUsername } = useStore();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    updateSettings({ soundVolume: vol });
    // Play test tick
    playSound.tick(vol);
  };

  const handleSpeedSelect = (speed: typeof settings.animationSpeed) => {
    playSound.tick(settings.soundVolume);
    updateSettings({ animationSpeed: speed });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(7, 7, 13, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001,
      padding: '20px',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass" style={{
        width: '100%',
        maxWidth: '440px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        padding: '30px',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
        animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Close Button */}
        <button
          onClick={() => { playSound.clunk(0.4); onClose(); }}
          style={{
            position: 'absolute',
            top: '20px', right: '20px',
            background: 'none', border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>
          Game Settings
        </h2>

        {/* Profile Settings */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Username
          </label>
          <input
            type="text"
            value={user.name}
            onChange={(e) => updateUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: '#ffffff',
              outline: 'none'
            }}
          />
        </div>



        {/* Volume Slider */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            <Volume2 size={16} />
            Sound Volume ({Math.round(settings.soundVolume * 100)}%)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.soundVolume}
            onChange={handleVolumeChange}
            style={{
              width: '100%',
              accentColor: 'var(--accent-primary)',
              height: '6px',
              borderRadius: '3px',
              background: 'var(--bg-tertiary)'
            }}
          />
        </div>

        {/* Reel Spin Speed */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            <Zap size={16} />
            Reel Spin Speed
          </label>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['slow', 'normal', 'fast'] as const).map(speed => {
              const isActive = settings.animationSpeed === speed;
              return (
                <button
                  key={speed}
                  onClick={() => handleSpeedSelect(speed)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: isActive ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    textTransform: 'capitalize',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {speed}
                </button>
              );
            })}
          </div>
        </div>



      </div>
    </div>
  );
};
