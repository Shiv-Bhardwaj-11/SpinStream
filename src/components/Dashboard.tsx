import { useStore } from '../store/useStore';
import { playSound } from '../utils/audio';
import { moviesDatabase } from '../data/movies';
import { Film, Clock, Flame, RotateCcw, BarChart2 } from 'lucide-react';

export const Dashboard = () => {
  const { watchedHistory, excludedIds, removeExcludeMovie, user, spinStats } = useStore();

  const handleRestoreExclude = (id: string) => {
    playSound.tick(0.4);
    removeExcludeMovie(id);
  };

  // Calculate watch metrics
  const getWatchMinutes = (duration: string) => {
    if (duration.includes('min')) {
      return parseInt(duration) || 120;
    }
    if (duration.includes('Season')) {
      // parseInt('Multiple Seasons') returns NaN — parse only leading digits, fallback to 2
      const seasons = parseInt(duration.match(/\d+/)?.[0] || '2') || 2;
      return seasons * 10 * 60; // ~10 hours per season
    }
    if (duration.includes('Episode')) {
      const eps = parseInt(duration.match(/\d+/)?.[0] || '10') || 10;
      return eps * 24; // 24 mins per ep
    }
    return 120; // fallback
  };

  const totalMinutes = watchedHistory.reduce((acc, item) => acc + getWatchMinutes(item.movie.duration), 0);
  const totalHours = Math.round(totalMinutes / 60);

  // Group watched by genre for stats
  const genreCounts: Record<string, number> = {};
  watchedHistory.forEach(item => {
    item.movie.genres.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });

  const sortedGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // top 5

  const totalGenrePoints = sortedGenres.reduce((acc, [_, count]) => acc + count, 0);

  // Colors for SVG bar chart
  const BAR_COLORS = ['#7C3AED', '#8B5CF6', '#A855F7', '#22D3EE', '#38BDF8'];

  return (
    <div className="responsive-padding">
      <div className="container" style={{ maxWidth: '900px' }}>
        
        <h2 style={{ fontSize: '2rem', marginBottom: '30px', fontFamily: 'var(--font-heading)' }}>
          Your Dashboard
        </h2>

        {/* KPIs Grid */}
        <div className="grid grid-cols-4 animate-fade-in" style={{ marginBottom: '32px' }}>
          
          <div className="glass glass-interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Watched</span>
              <Film size={18} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <span style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: '1' }}>{watchedHistory.length}</span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>titles in your history</p>
          </div>

          <div className="glass glass-interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Time Spent</span>
              <Clock size={18} style={{ color: 'var(--accent-secondary)' }} />
            </div>
            <span style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: '1' }}>{totalHours}h</span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>estimated watch time</p>
          </div>

          <div className="glass glass-interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Current Streak</span>
              <Flame size={18} style={{ color: 'var(--status-warning)' }} />
            </div>
            <span style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: '1' }}>{user.streak}d</span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>active daily streak</p>
          </div>

          <div className="glass glass-interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Spins</span>
              <RotateCcw size={18} style={{ color: 'var(--status-success)' }} />
            </div>
            <span style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: '1' }}>{spinStats.totalSpins}</span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>roulette plays</p>
          </div>

        </div>

        {/* Analytics & Lists layout */}
        <div style={{ display: 'flex', gap: '20px', flexDirection: 'row', flexWrap: 'wrap' }}>
          
          {/* Analytics (SVG Chart) */}
          <div className="glass animate-fade-in glass-padding" style={{ flex: '1 1 350px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={20} style={{ color: 'var(--accent-primary)' }} />
              Favorite Genres
            </h3>
            
            {sortedGenres.length === 0 ? (
              <div style={{
                height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)'
              }}>
                No watch data yet. Spin & log watched titles!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sortedGenres.map(([genre, count], idx) => {
                  const percent = totalGenrePoints > 0 ? (count / totalGenrePoints) * 100 : 0;
                  return (
                    <div key={genre}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '600' }}>{genre}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{count} {count === 1 ? 'title' : 'titles'} ({Math.round(percent)}%)</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: BAR_COLORS[idx % BAR_COLORS.length],
                          borderRadius: '6px',
                          transition: 'width 1s cubic-bezier(0.2, 0.8, 0.2, 1)'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Watch History List */}
          <div className="glass animate-fade-in glass-padding" style={{ flex: '1 1 450px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Watch History</h3>
            
            {watchedHistory.length === 0 ? (
              <div style={{
                height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)'
              }}>
                Your watch history is empty. Spin the slot machine!
              </div>
            ) : (
              <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
                {watchedHistory.map(item => (
                  <div key={item.id} className="glass glass-interactive" style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    justifyContent: 'space-between',
                    background: 'rgba(30,30,35,0.5)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '40px',
                        height: '56px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: 'var(--bg-tertiary)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                      }}>
                        <img src={item.movie.poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{item.movie.title}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {item.movie.type} • Watched on {item.watchedAt}
                        </span>
                        {item.userRating && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                            {Array.from({ length: item.userRating }).map((_, i) => (
                              <span key={i} style={{ fontSize: '0.8rem', color: 'var(--status-warning)' }}>⭐</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Excluded Movies Manager */}
        {excludedIds.length > 0 && (
          <div className="glass" style={{ marginTop: '30px', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>
              Excluded Titles ("Not Interested")
            </h3>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {excludedIds.map(id => {
                // Find matching movie from DB
                const movie = moviesDatabase.find(m => m.id === id);
                if (!movie) return null;
                
                return (
                  <div key={id} className="glass" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    background: 'rgba(239, 68, 68, 0.05)'
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{movie.title}</span>
                    <button
                      onClick={() => handleRestoreExclude(id)}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--text-muted)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        hover: { color: 'var(--accent-primary)' }
                      } as any}
                      title="Restore to spinner pools"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
