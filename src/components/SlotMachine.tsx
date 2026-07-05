import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { MovieItem, moviesDatabase } from '../data/movies';
import { playSound } from '../utils/audio';
import { ResultCard } from './ResultCard';
import { GenreSelector } from './GenreSelector';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';

// Reels Items lists
const GENRES_LIST = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Fantasy', 'Documentary', 'Animation'];
const TYPES_LIST = ['Movie', 'TV Series', 'Anime', 'Drama/K-Drama'];

// Genre emojis for fallback rendering
const GENRE_EMOJIS: Record<string, string> = {
  Action: '💥', Comedy: '😂', Drama: '🎭', Horror: '👻', 'Sci-Fi': '👽',
  Romance: '💖', Thriller: '🔪', Fantasy: '🦄', Documentary: '🌍', Animation: '🎨'
};

const TYPE_EMOJIS: Record<string, string> = {
  'Movie': '🎬', 'TV Series': '📺', 'Anime': '🎌', 'Drama/K-Drama': '🍜'
};

export const SlotMachine: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { spin, settings } = useStore();

  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [isWildCard, setIsWildCard] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultMovie, setResultMovie] = useState<MovieItem | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Keep references of assets to avoid re-creation
  const imagesCacheRef = useRef<Record<string, HTMLImageElement>>({});
  // Prevent double-click race condition before React re-render
  const isSpinningRef = useRef(false);
  // Safety timeout ref — resets isSpinning if animation hangs
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation state ref to communicate with the requestAnimationFrame loop
  const animStateRef = useRef({
    reel1Y: 0,
    reel2Y: 0,
    reel3Y: 0,
    reel1Speed: 0,
    reel2Speed: 0,
    reel3Speed: 0,
    reel1Target: 0,
    reel2Target: 0,
    reel3Target: 0,
    phase: 'idle' as 'idle' | 'spinning' | 'stopping1' | 'stopping2' | 'stopping3' | 'done',
    reel1List: [] as string[],
    reel2List: [] as string[],
    reel3List: [] as MovieItem[],
    startTime: 0,
  });

  // Preload poster images on mount
  useEffect(() => {
    // Preload a few popular ones to speed up rendering
    const samplePosters = moviesDatabase.slice(0, 15).map(m => m.poster);
    samplePosters.forEach(url => {
      if (!imagesCacheRef.current[url]) {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          imagesCacheRef.current[url] = img;
        };
      }
    });
  }, []);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    const animState = animStateRef.current;

    // Set initial lists
    if (animState.reel1List.length === 0) {
      animState.reel1List = [...GENRES_LIST];
      animState.reel2List = [...TYPES_LIST];
      animState.reel3List = moviesDatabase.slice(0, 8);
    }

    const itemHeight = 140; // Increased height for premium cards

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const colWidth = canvas.width / 3;

      // Draw background panel slots with slight gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, 'rgba(9, 9, 11, 0.9)');
      grad.addColorStop(0.5, 'rgba(24, 24, 27, 0.7)');
      grad.addColorStop(1, 'rgba(9, 9, 11, 0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw 3 columns dividers
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(colWidth, 0); ctx.lineTo(colWidth, canvas.height);
      ctx.moveTo(colWidth * 2, 0); ctx.lineTo(colWidth * 2, canvas.height);
      ctx.stroke();

      // Updates physics
      if (animState.phase === 'spinning') {
        const now = Date.now();
        const elapsed = now - animState.startTime;

        // Ticking audio proportional to speed
        const speedFactor = (animState.reel1Speed + animState.reel2Speed + animState.reel3Speed) / 3;
        if (speedFactor > 10 && Math.random() < 0.12) {
          playSound.tick(settings.soundVolume);
        }

        // Apply friction/deceleration if stopping
        // Check stage stopping transitions
        if (elapsed > 1200 && animState.reel1Speed > 0) {
          // Snap reel 1 to target
          const targetY = animState.reel1Target * itemHeight - (canvas.height / 2 - itemHeight / 2);
          const diff = targetY - animState.reel1Y;
          animState.reel1Y += diff * 0.08;
          if (Math.abs(diff) < 2) {
            animState.reel1Y = targetY;
            animState.reel1Speed = 0;
            playSound.clunk(settings.soundVolume);
          }
        } else {
          animState.reel1Y += animState.reel1Speed;
        }

        if (elapsed > 2000 && animState.reel2Speed > 0) {
          // Snap reel 2 to target
          const targetY = animState.reel2Target * itemHeight - (canvas.height / 2 - itemHeight / 2);
          const diff = targetY - animState.reel2Y;
          animState.reel2Y += diff * 0.08;
          if (Math.abs(diff) < 2) {
            animState.reel2Y = targetY;
            animState.reel2Speed = 0;
            playSound.clunk(settings.soundVolume);
          }
        } else {
          animState.reel2Y += animState.reel2Speed;
        }

        if (elapsed > 2800 && animState.reel3Speed > 0) {
          // Snap reel 3 to target
          const targetY = animState.reel3Target * itemHeight - (canvas.height / 2 - itemHeight / 2);
          const diff = targetY - animState.reel3Y;
          animState.reel3Y += diff * 0.08;
          if (Math.abs(diff) < 2) {
            animState.reel3Y = targetY;
            animState.reel3Speed = 0;
            playSound.clunk(settings.soundVolume);
            
            // Finish spinning!
            animState.phase = 'done';
            isSpinningRef.current = false;
            if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
            setIsSpinning(false);
            
            // Confetti and Chime!
            playSound.successChime(settings.soundVolume);
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 }
            });
            
            // Show result card
            setTimeout(() => {
              setShowResult(true);
            }, 500);
          }
        } else {
          animState.reel3Y += animState.reel3Speed;
        }
      }

      // --- DRAW COLUMN 1 (GENRES) ---
      const list1 = animState.reel1List;
      const count1 = list1.length;
      const drawReel1 = () => {
        ctx.save();
        // Clip to column boundaries
        ctx.rect(0, 0, colWidth, canvas.height);
        ctx.clip();

        // Calculate offset in loops
        let startIdx = Math.floor(animState.reel1Y / itemHeight) - 2;
        for (let i = startIdx; i < startIdx + 8; i++) {
          const itemIdx = ((i % count1) + count1) % count1;
          const label = list1[itemIdx];
          const y = (i * itemHeight) - animState.reel1Y;

          // Draw item panel
          drawItemCard(ctx, 10, y + 10, colWidth - 20, itemHeight - 20, label, GENRE_EMOJIS[label] || '🎭', 'var(--accent-primary)');
        }
        ctx.restore();
      };
      drawReel1();

      // --- DRAW COLUMN 2 (TYPES) ---
      const list2 = animState.reel2List;
      const count2 = list2.length;
      const drawReel2 = () => {
        ctx.save();
        ctx.rect(colWidth, 0, colWidth, canvas.height);
        ctx.clip();

        let startIdx = Math.floor(animState.reel2Y / itemHeight) - 2;
        for (let i = startIdx; i < startIdx + 8; i++) {
          const itemIdx = ((i % count2) + count2) % count2;
          const label = list2[itemIdx];
          const y = (i * itemHeight) - animState.reel2Y;

          drawItemCard(ctx, colWidth + 10, y + 10, colWidth - 20, itemHeight - 20, label, TYPE_EMOJIS[label] || '🍿', 'var(--accent-secondary)');
        }
        ctx.restore();
      };
      drawReel2();

      // --- DRAW COLUMN 3 (MOVIES) ---
      const list3 = animState.reel3List;
      const count3 = list3.length;
      const drawReel3 = () => {
        ctx.save();
        ctx.rect(colWidth * 2, 0, colWidth, canvas.height);
        ctx.clip();

        let startIdx = Math.floor(animState.reel3Y / itemHeight) - 2;
        for (let i = startIdx; i < startIdx + 8; i++) {
          const itemIdx = ((i % count3) + count3) % count3;
          const movie = list3[itemIdx];
          const y = (i * itemHeight) - animState.reel3Y;

          if (movie) {
            drawMovieCard(ctx, colWidth * 2 + 10, y + 10, colWidth - 20, itemHeight - 20, movie);
          }
        }
        ctx.restore();
      };
      drawReel3();

      // Draw horizontal lens overlay (center highlighting bar)
      ctx.fillStyle = 'rgba(124, 58, 237, 0.1)';
      ctx.fillRect(0, canvas.height / 2 - itemHeight / 2, canvas.width, itemHeight);

      ctx.strokeStyle = 'rgba(124, 58, 237, 0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, canvas.height / 2 - itemHeight / 2, canvas.width, itemHeight);

      // Glowing lens brackets
      ctx.fillStyle = 'var(--accent-primary)';
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'var(--accent-primary)';
      ctx.fillRect(0, canvas.height / 2 - itemHeight / 2 - 2, canvas.width, 2);
      ctx.fillRect(0, canvas.height / 2 + itemHeight / 2, canvas.width, 2);
      ctx.shadowBlur = 0; // reset shadow

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [settings.soundVolume]);

  // Draw simple text+emoji slot card
  const drawItemCard = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, emoji: string, accentColor: string) => {
    // Card background
    ctx.fillStyle = 'rgba(30, 30, 35, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect?.(x, y, w, h, 14);
    ctx.fill();
    ctx.stroke();

    // Subtle side border indicator
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect?.(x, y + h/2 - 20, 4, 40, 2);
    ctx.fill();

    // Text & Emoji
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 18px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x + w/2, y + h/2 - 15);
    ctx.font = '600 15px "Inter", sans-serif';
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.fillText(text, x + w/2, y + h/2 + 15);
  };

  // Draw movie poster/name card
  const drawMovieCard = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, movie: MovieItem) => {
    // Card background
    ctx.fillStyle = 'rgba(30, 30, 35, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect?.(x, y, w, h, 14);
    ctx.fill();
    ctx.stroke();

    // Attempt poster draw or fallback
    const posterWidth = 70;
    const posterHeight = 100;
    const posterX = x + 16;
    const posterY = y + (h - posterHeight) / 2;
    
    const cachedImg = imagesCacheRef.current[movie.poster];
    if (cachedImg && cachedImg.complete && cachedImg.naturalWidth !== 0) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect?.(posterX, posterY, posterWidth, posterHeight, 8);
      ctx.clip();
      ctx.drawImage(cachedImg, posterX, posterY, posterWidth, posterHeight);
      ctx.restore();
    } else {
      ctx.fillStyle = 'var(--bg-tertiary)';
      ctx.beginPath();
      ctx.roundRect?.(posterX, posterY, posterWidth, posterHeight, 8);
      ctx.fill();
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '24px "Space Grotesk"';
      ctx.textAlign = 'center';
      ctx.fillText('🎬', posterX + posterWidth / 2, posterY + posterHeight / 2);
    }

    // Movie title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const textX = posterX + posterWidth + 16;
    
    // Line wrapping for title
    const maxTextWidth = w - (textX - x) - 16;
    let titleText = movie.title;
    if (ctx.measureText(titleText).width > maxTextWidth) {
      titleText = titleText.substring(0, 16) + '...';
    }
    ctx.fillText(titleText, textX, posterY + 10);

    // Rating & Year
    ctx.fillStyle = 'var(--accent-secondary)';
    ctx.font = '600 13px "Inter", sans-serif';
    ctx.fillText(`⭐ ${movie.rating}`, textX, posterY + 40);
    
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.fillText(`📅 ${movie.year}`, textX, posterY + 65);
  };

  const handleSpinClick = async () => {
    if (isSpinningRef.current) return;
    isSpinningRef.current = true;

    // Resolve wild card filters
    let filterGenre = selectedGenre;
    let filterType = selectedType;

    if (isWildCard) {
      filterGenre = 'All';
      filterType = 'All';
    }

    setIsSpinning(true);
    playSound.spinSweep(settings.soundVolume);

    // Safety timeout: if animation never finishes (e.g. tab hidden, settings change mid-spin),
    // reset the spinning state after 10 seconds so the button never gets permanently stuck
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    spinTimeoutRef.current = setTimeout(() => {
      if (isSpinningRef.current) {
        isSpinningRef.current = false;
        setIsSpinning(false);
      }
    }, 10000);

    try {
      const match = await spin({ genre: filterGenre, type: filterType });
      
      if (!match) {
        alert("No titles match your chosen filters! Try changing genres or types, or clearing filters.");
        setIsSpinning(false);
        return;
      }

      setResultMovie(match);
      setShowResult(false);

      const animState = animStateRef.current;
      animState.startTime = Date.now();
      animState.phase = 'spinning';

      // Speed configuration based on settings
      let baseSpeed = 40;
      if (settings.animationSpeed === 'fast') baseSpeed = 60;
      if (settings.animationSpeed === 'slow') baseSpeed = 25;

      animState.reel1Speed = baseSpeed + Math.random() * 5;
      animState.reel2Speed = baseSpeed + Math.random() * 5 + 5;
      animState.reel3Speed = baseSpeed + Math.random() * 5 + 10;

      // Setup Reels list targets
      // Reel 1: Genres
      const primaryGenre = match.genres[0] || 'Drama';
      let gTargetIdx = GENRES_LIST.indexOf(primaryGenre);
      if (gTargetIdx === -1) gTargetIdx = 2; // Default to Drama
      
      // Add multiple spins to target
      animState.reel1Target = gTargetIdx + GENRES_LIST.length * 4;

      // Reel 2: Types
      let tTargetIdx = TYPES_LIST.indexOf(match.type);
      if (tTargetIdx === -1) tTargetIdx = 0;
      animState.reel2Target = tTargetIdx + TYPES_LIST.length * 6;

      // Reel 3: Titles (Construct candidate lists ending with winning title)
      // Filter matching candidates to shuffle reel 3
      let candidates = moviesDatabase.filter(m => m.id !== match.id);
      if (filterGenre !== 'All') candidates = candidates.filter(m => m.genres.includes(filterGenre as any));
      if (filterType !== 'All') candidates = candidates.filter(m => m.type === filterType);
      
      // Shuffle candidates
      candidates = candidates.sort(() => Math.random() - 0.5);
      
      // Build reel 3 array: pad with random elements, ending on match
      const reel3Length = 30;
      const finalReel3: MovieItem[] = [];
      const safePool = candidates.length > 0 ? candidates : moviesDatabase.filter(m => m.id !== match.id);
      for (let i = 0; i < reel3Length - 1; i++) {
        finalReel3.push(safePool[i % safePool.length]);
      }
      finalReel3.push(match);
      
      animState.reel3List = finalReel3;
      animState.reel3Target = reel3Length - 1;

      // Preload result poster specifically if not cached
      if (!imagesCacheRef.current[match.poster]) {
        const img = new Image();
        img.src = match.poster;
        img.onload = () => {
          imagesCacheRef.current[match.poster] = img;
        };
      }
    } catch (error: any) {
      console.error(error);
      alert("An error occurred while fetching the movie. " + (error.message || error));
      isSpinningRef.current = false;
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      setIsSpinning(false);
    }
  };

  const handleWildCardToggle = () => {
    playSound.tick(0.4);
    setIsWildCard(!isWildCard);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isSpinning || !resultMovie) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const scaleY = 420 / rect.height; // handle CSS scaling if any
    const clickY = (e.clientY - rect.top) * scaleY;
    
    const itemHeight = 140;
    const centerY = 420 / 2;
    const boxTop = centerY - (itemHeight / 2);
    const boxBottom = centerY + (itemHeight / 2);
    
    if (clickY >= boxTop && clickY <= boxBottom) {
      playSound.tick(0.4);
      setShowResult(true);
    }
  };

  return (
    <div className="responsive-padding">
      <div className="container" style={{ maxWidth: '650px' }}>
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Sparkles size={24} className="glow-pulse" style={{ color: 'var(--accent-primary)' }} />
            The Stream Roulette
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
            Lock in your preferences, pull the lever, and let the wheels decide.
          </p>
        </div>

        {/* Slot Console Shell */}
        <div className="glass glass-padding" style={{
          borderRadius: 'var(--radius-xl)',
          border: '2px solid var(--border-color)',
          background: 'radial-gradient(ellipse at top, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7), inset 0 2px 10px rgba(255,255,255,0.05)',
          position: 'relative'
        }}>
          {/* Reel Display Canvas Container */}
          <div style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.05)',
            background: '#07070d',
            boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.9), 0 10px 30px rgba(0,0,0,0.3)',
            marginBottom: '32px',
            aspectRatio: '590/420'
          }}>
            <canvas
              ref={canvasRef}
              width={590}
              height={420}
              onClick={handleCanvasClick}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                cursor: (!isSpinning && resultMovie) ? 'pointer' : 'default'
              }}
            />
            {/* Ambient shadow gradient overlays */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, height: '60px',
              background: 'linear-gradient(to bottom, rgba(7,7,13,0.95) 0%, rgba(7,7,13,0) 100%)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0, height: '60px',
              background: 'linear-gradient(to top, rgba(7,7,13,0.95) 0%, rgba(7,7,13,0) 100%)',
              pointerEvents: 'none'
            }} />
          </div>

          {/* Wild Card Mode Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.2)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.02)'
          }}>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🃏 Wild Card Mode
              </span>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                Overrides selectors for a truly random pick from all titles.
              </p>
            </div>
            
            <button
              onClick={handleWildCardToggle}
              style={{
                width: '54px',
                height: '28px',
                borderRadius: '14px',
                background: isWildCard ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#ffffff',
                position: 'absolute',
                top: '3px',
                left: isWildCard ? '29px' : '3px',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }} />
            </button>
          </div>

          {/* Genre/Type Selector (Hidden in Wild Card Mode) */}
          {!isWildCard ? (
            <GenreSelector
              selectedGenre={selectedGenre}
              selectedType={selectedType}
              onChangeGenre={setSelectedGenre}
              onChangeType={setSelectedType}
            />
          ) : (
            <div style={{
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px'
            }}>
              Wild Card overrides selectors. Shuffling all 80+ records...
            </div>
          )}

          {/* Spin Trigger Button */}
          <button
            className={`btn btn-primary ${!isSpinning ? 'glow-pulse' : ''}`}
            disabled={isSpinning}
            onClick={handleSpinClick}
            style={{
              width: '100%',
              padding: '20px 24px',
              fontSize: '1.4rem',
              fontWeight: '800',
              borderRadius: 'var(--radius-xl)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              boxShadow: isSpinning ? 'none' : '0 10px 35px var(--accent-glow)',
              filter: isSpinning ? 'brightness(0.7)' : 'none',
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              marginTop: '12px'
            }}
          >
            {isSpinning ? '🎰 Spinning...' : 'Pull Lever (Spin)'}
          </button>

        </div>

        {/* Results Modal/Card Display */}
        {showResult && resultMovie && (
          <ResultCard
            movie={resultMovie}
            onClose={() => setShowResult(false)}
            onSpinAgain={() => {
              setShowResult(false);
              handleSpinClick();
            }}
          />
        )}

      </div>
    </div>
  );
};
