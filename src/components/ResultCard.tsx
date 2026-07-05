import { useEffect, useRef, useState } from 'react';
import { MovieItem } from '../data/movies';
import { useStore } from '../store/useStore';
import { playSound } from '../utils/audio';
import { fetchTrailerKey } from '../utils/tmdb';
import { Check, RotateCcw, EyeOff, Star, X, Play } from 'lucide-react';

interface ResultCardProps {
  movie: MovieItem;
  onClose: () => void;
  onSpinAgain: () => void;
}

export const ResultCard = ({ movie, onClose, onSpinAgain }: ResultCardProps) => {
  const { addToHistory, excludeMovie, settings } = useStore();
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [hasRated, setHasRated] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(true);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadTrailer = async () => {
      setIsLoadingTrailer(true);
      const key = await fetchTrailerKey(movie.id, settings.tmdbApiKey);
      if (isMounted) {
        setTrailerKey(key);
        setIsLoadingTrailer(false);
      }
    };
    loadTrailer();
    return () => { isMounted = false; };
  }, [movie.id, settings.tmdbApiKey]);

  // Cleanup the close timer on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleMarkWatched = () => {
    if (isLogged) return; // prevent double-call
    setHasRated(true);
    addToHistory(movie, rating);
    setIsLogged(true);
    playSound.levelUp(0.6);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleNotInterested = () => {
    excludeMovie(movie.id);
    playSound.clunk(0.5);
    onSpinAgain();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(7, 7, 13, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div className="glass glass-padding" style={{
        width: '100%',
        maxWidth: '520px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        position: 'relative',
        boxShadow: '0 30px 80px -10px rgba(0,0,0,0.9), 0 0 30px rgba(124, 58, 237, 0.1)',
        animation: 'scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.95) 0%, rgba(9, 9, 11, 0.95) 100%)',
        backdropFilter: 'blur(20px)'
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

        {/* Celebrate tag */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <span style={{
            background: 'rgba(0, 255, 102, 0.15)',
            border: '1px solid rgba(0, 255, 102, 0.3)',
            color: '#00ff66',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            boxShadow: '0 0 15px rgba(0, 255, 102, 0.2)'
          }}>
            🎉 Match Found!
          </span>
        </div>

        {/* Content Shell */}
        {isLogged ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 0',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#00ff66',
              color: '#0b0d19',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 20px rgba(0, 255, 102, 0.4)'
            }}>
              <Check size={32} strokeWidth={3} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Marked as Watched!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              XP awarded. Your history and stats have been updated.
            </p>
          </div>
        ) : (
          <div>
            {/* Header info */}
            <div className="responsive-flex" style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {/* Poster */}
              <div style={{
                width: '140px',
                height: '200px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'var(--bg-tertiary)'
              }}>
                <img
                  src={movie.poster}
                  alt={movie.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    // Fallback on image load error
                    (e.target as any).src = 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=200';
                  }}
                />
              </div>

              {/* Title & Metadata */}
              <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ fontSize: '1.6rem', lineHeight: '1.2', marginBottom: '8px' }}>
                  {movie.title}
                </h3>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <span className="glass" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {movie.type}
                  </span>
                  <span className="glass" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--status-warning)' }}>
                    ⭐ {movie.rating} / 10
                  </span>
                  <span className="glass" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {movie.year}
                  </span>
                  <span className="glass" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {movie.duration}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {movie.genres.map(g => (
                    <span key={g} style={{
                      background: 'rgba(124, 58, 237, 0.15)',
                      color: 'var(--accent-primary)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Synopsis */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Synopsis</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.5' }}>
                {movie.synopsis}
              </p>
            </div>

            {/* Where to Watch */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Where to Watch</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {movie.whereToWatch.map(platform => (
                  <span key={platform} className="glass" style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            {/* Trailer button */}
            <div style={{ marginBottom: '24px' }}>
              {!isLoadingTrailer && trailerKey ? (
                <a
                  href={`https://www.youtube.com/watch?v=${trailerKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', textDecoration: 'none' }}
                  onClick={() => playSound.tick(0.3)}
                >
                  <Play size={16} />
                  Watch Trailer
                </a>
              ) : !isLoadingTrailer && !trailerKey ? (
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', textDecoration: 'none', opacity: 0.7 }}
                  onClick={() => playSound.tick(0.3)}
                >
                  <Play size={16} />
                  Search Trailer on YouTube
                </a>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading trailer...</span>
              )}
            </div>

            {/* Rating Selector */}
            {!hasRated ? (
              <div style={{
                background: 'rgba(0,0,0,0.15)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Leave a rating?</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isSelected = rating ? starValue <= rating : false;
                    return (
                      <button
                        key={starValue}
                        onClick={() => { playSound.tick(0.3); setRating(starValue); }}
                        style={{
                          background: 'none', border: 'none',
                          cursor: 'pointer', color: isSelected ? '#f59e0b' : 'var(--text-muted)',
                          padding: '2px'
                        }}
                      >
                        <Star size={18} fill={isSelected ? '#f59e0b' : 'none'} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Actions Grid */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary glow-pulse"
                onClick={handleMarkWatched}
                style={{ flex: '1 1 180px', padding: '14px 20px', fontSize: '1rem' }}
              >
                <Check size={16} strokeWidth={3} />
                Mark as Watched
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => { playSound.tick(0.4); onSpinAgain(); }}
                style={{ flex: '1 1 120px', padding: '14px 20px', fontSize: '1rem' }}
              >
                <RotateCcw size={16} />
                Spin Again
              </button>

              <button
                className="btn btn-danger"
                onClick={handleNotInterested}
                style={{ flex: '1 1 auto', display: 'flex', gap: '8px', padding: '14px 20px', fontSize: '1rem' }}
                title="Don't show this again"
              >
                <EyeOff size={16} />
                Not Interested
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
