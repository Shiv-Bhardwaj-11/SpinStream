import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Award, X } from 'lucide-react';
import { playSound } from '../utils/audio';

export const BadgeToast = () => {
  const { badgeNotifications, dismissBadgeNotification } = useStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<any>(null);

  useEffect(() => {
    if (badgeNotifications.length > 0 && !isVisible && !isExiting) {
      // Show the first notification in the queue
      const badge = badgeNotifications[0];
      setCurrentBadge(badge);
      setIsVisible(true);
      playSound.clunk(0.5); // Play a sound when badge is unlocked!

      const timer = setTimeout(() => {
        handleDismiss(badge.id);
      }, 4000); // 4 seconds

      return () => clearTimeout(timer);
    }
  }, [badgeNotifications, isVisible, isExiting]);

  const handleDismiss = (id: string) => {
    setIsVisible(false);
    setIsExiting(true);
    setTimeout(() => {
      dismissBadgeNotification(id);
      setCurrentBadge(null);
      setIsExiting(false);
    }, 300); // Wait for fade out animation
  };

  if (!currentBadge && !isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '100px', // Above the mobile nav pill
        left: '50%',
        transform: `translateX(-50%) translateY(${isVisible ? '0' : '20px'})`,
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        zIndex: 9999,
        width: '90%',
        maxWidth: '400px',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div 
        className="glass"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
          borderRadius: '24px',
          border: '1px solid var(--accent-primary)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(139, 92, 246, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Shine effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '50%',
          height: '100%',
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)',
          transform: 'skewX(-20deg)',
          animation: isVisible ? 'shine 2s infinite' : 'none'
        }} />

        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          flexShrink: 0
        }}>
          {currentBadge?.icon || <Award size={24} color="var(--accent-primary)" />}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            color: 'var(--accent-primary)',
            fontWeight: 'bold',
            marginBottom: '4px'
          }}>
            Badge Unlocked!
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>
            {currentBadge?.title}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            +{currentBadge?.targetXP} XP
          </div>
        </div>

        <button 
          onClick={() => currentBadge && handleDismiss(currentBadge.id)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%'
          }}
        >
          <X size={18} />
        </button>
      </div>

      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
        }
      `}</style>
    </div>
  );
};
