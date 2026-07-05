import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Award, Lock } from 'lucide-react';

export const Achievements = () => {
  const { achievements, weeklyChallenge } = useStore();
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const progressPercent = weeklyChallenge.target > 0
    ? Math.min((weeklyChallenge.progress / weeklyChallenge.target) * 100, 100)
    : 0;

  const filteredAchievements = achievements.filter(badge => {
    if (filter === 'unlocked') return badge.unlockedAt !== null;
    if (filter === 'locked') return badge.unlockedAt === null;
    return true;
  });

  return (
    <div className="responsive-padding">
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Achievements Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Award size={28} style={{ color: 'var(--accent-secondary)' }} />
            Achievements & Badges
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
            Unlock achievements by spinning, watching titles, and maintaining streaks.
          </p>
          <div style={{ 
            display: 'inline-flex', 
            background: 'var(--bg-tertiary)', 
            padding: '4px', 
            borderRadius: '100px', 
            marginTop: '24px',
            border: '1px solid var(--border-color)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
          }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 24px',
                borderRadius: '100px',
                border: 'none',
                background: filter === 'all' ? 'linear-gradient(135deg, var(--accent-primary) 0%, #9333EA 100%)' : 'transparent',
                color: filter === 'all' ? '#fff' : 'var(--text-secondary)',
                fontWeight: filter === 'all' ? '600' : '500',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              All Badges
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              style={{
                padding: '8px 24px',
                borderRadius: '100px',
                border: 'none',
                background: filter === 'unlocked' ? 'linear-gradient(135deg, var(--accent-primary) 0%, #9333EA 100%)' : 'transparent',
                color: filter === 'unlocked' ? '#fff' : 'var(--text-secondary)',
                fontWeight: filter === 'unlocked' ? '600' : '500',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Unlocked
            </button>
            <button
              onClick={() => setFilter('locked')}
              style={{
                padding: '8px 24px',
                borderRadius: '100px',
                border: 'none',
                background: filter === 'locked' ? 'linear-gradient(135deg, var(--accent-primary) 0%, #9333EA 100%)' : 'transparent',
                color: filter === 'locked' ? '#fff' : 'var(--text-secondary)',
                fontWeight: filter === 'locked' ? '600' : '500',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Locked
            </button>
          </div>
        </div>

        {/* Weekly Challenge Banner */}
        <div className="glass glow-pulse glass-padding" style={{
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-focus)',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(34, 211, 238, 0.1) 100%)',
          marginBottom: '48px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <span style={{
                background: 'var(--accent-primary)',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Weekly Active Challenge
              </span>
              <h3 style={{ fontSize: '1.3rem', marginTop: '8px' }}>{weeklyChallenge.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
                {weeklyChallenge.description}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#00ff66' }}>+{weeklyChallenge.xpReward} XP</span>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Reward on completion</p>
            </div>
          </div>

          {/* Challenge progress bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Marathon Progress</span>
              <span>{weeklyChallenge.progress} / {weeklyChallenge.target}</span>
            </div>
            
            <div style={{
              width: '100%',
              height: '12px',
              background: 'var(--bg-tertiary)',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                borderRadius: '6px',
                transition: 'width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)'
              }} />
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-badges" style={{ gap: '20px' }}>
          {filteredAchievements.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
              <p style={{ fontSize: '1rem' }}>
                {filter === 'unlocked' ? 'No achievements unlocked yet — start spinning!' : 'No achievements to show.'}
              </p>
            </div>
          ) : filteredAchievements.map(badge => {
            const isUnlocked = badge.unlockedAt !== null;
            return (
              <div
                key={badge.id}
                className={`glass ${isUnlocked ? 'glass-interactive' : ''} glass-padding`}
                style={{
                  borderRadius: 'var(--radius-xl)',
                  textAlign: 'center',
                  opacity: isUnlocked ? 1 : 0.6,
                  border: isUnlocked ? '1px solid var(--border-focus)' : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: isUnlocked ? '0 0 20px var(--accent-glow)' : 'none',
                  transition: 'all var(--transition-normal)',
                  position: 'relative',
                  overflow: 'hidden',
                  background: isUnlocked
                    ? 'radial-gradient(circle at top, rgba(124, 58, 237, 0.1) 0%, var(--bg-card) 100%)'
                    : 'var(--bg-card)'
                }}
              >
                {/* Floating Lock indicator */}
                {!isUnlocked && (
                  <div style={{
                    position: 'absolute',
                    top: '12px', right: '12px',
                    color: 'var(--text-muted)'
                  }}>
                    <Lock size={14} />
                  </div>
                )}

                {/* Badge Icon */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: isUnlocked ? 'var(--bg-primary)' : 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.2rem',
                  margin: '0 auto 16px',
                  boxShadow: isUnlocked ? 'inset 0 0 10px var(--accent-glow)' : 'none',
                  border: `2px dashed ${isUnlocked ? 'var(--accent-primary)' : 'var(--border-color)'}`
                }}>
                  {badge.icon}
                </div>

                <h3 style={{ fontSize: '1rem', marginBottom: '6px' }}>{badge.title}</h3>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: '1.4', minHeight: '40px', marginBottom: '14px' }}>
                  {badge.description}
                </p>

                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  color: isUnlocked ? '#00ff66' : 'var(--text-muted)'
                }}>
                  {isUnlocked ? (
                    <span>Unlocked on {badge.unlockedAt}</span>
                  ) : (
                    <span>+{badge.targetXP} XP Reward</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
