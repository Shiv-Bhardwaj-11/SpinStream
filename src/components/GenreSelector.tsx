import React from 'react';
import { playSound } from '../utils/audio';

interface GenreSelectorProps {
  selectedGenre: string;
  selectedType: string;
  onChangeGenre: (genre: string) => void;
  onChangeType: (type: string) => void;
}

const GENRES = ['All', 'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Fantasy', 'Documentary', 'Animation'];
const TYPES = ['All', 'Movie', 'TV Series', 'Anime', 'Drama/K-Drama'];

export const GenreSelector: React.FC<GenreSelectorProps> = ({
  selectedGenre,
  selectedType,
  onChangeGenre,
  onChangeType
}) => {
  
  const handleGenreSelect = (genre: string) => {
    playSound.tick(0.3);
    onChangeGenre(genre);
  };

  const handleTypeSelect = (type: string) => {
    playSound.tick(0.3);
    onChangeType(type);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
      
      {/* Type Selector Row */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '0.8rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          marginBottom: '8px',
          letterSpacing: '0.05em'
        }}>
          Content Type
        </label>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          background: 'rgba(0, 0, 0, 0.15)',
          padding: '4px',
          borderRadius: 'var(--radius-md)'
        }}>
          {TYPES.map(type => {
            const isActive = selectedType === type;
            return (
              <button
                key={type}
                onClick={() => handleTypeSelect(type)}
                style={{
                  flex: '1 1 auto',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'var(--accent-secondary)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Genre Selector Row */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '0.8rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          marginBottom: '8px',
          letterSpacing: '0.05em'
        }}>
          Genre
        </label>
        <div style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap'
        }}>
          {GENRES.map(genre => {
            const isActive = selectedGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => handleGenreSelect(genre)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: isActive ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  transition: 'all var(--transition-fast)'
                }}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
