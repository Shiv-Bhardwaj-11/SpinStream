import { MovieItem, moviesDatabase } from '../data/movies';

const DEFAULT_API_KEY = '9cc30c5f0089858cfbfdae2dfff57772';

const GENRE_MAP: Record<string, number> = {
  'Action': 28,
  'Comedy': 35,
  'Drama': 18,
  'Horror': 27,
  'Sci-Fi': 878,
  'Romance': 10749,
  'Thriller': 53,
  'Fantasy': 14,
  'Documentary': 99,
  'Animation': 16,
};

const TV_GENRE_MAP: Record<string, number> = {
  'Action': 10759, // Action & Adventure
  'Comedy': 35,
  'Drama': 18,
  'Horror': 27, 
  'Sci-Fi': 10765, // Sci-Fi & Fantasy
  'Romance': 18, // Drama/Romance mapped to Drama for TV
  'Thriller': 9648, // Mystery
  'Fantasy': 10765,
  'Documentary': 99,
  'Animation': 16,
};

const getFallbackMovie = (filters: { genre: string; type: string }): MovieItem | null => {
  let candidates = moviesDatabase;
  if (filters.genre && filters.genre !== 'All') {
    candidates = candidates.filter(movie => movie.genres.includes(filters.genre as any));
  }
  if (filters.type && filters.type !== 'All') {
    candidates = candidates.filter(movie => movie.type === filters.type);
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

export const fetchFromTMDB = async (
  filters: { genre: string; type: string },
  apiKey: string
): Promise<MovieItem | null> => {
  const key = apiKey.trim() || DEFAULT_API_KEY;
  
  try {
    let endpoint = 'https://api.themoviedb.org/3/discover/movie';
    let queryParams = new URLSearchParams({
      api_key: key,
      language: 'en-US',
      sort_by: 'popularity.desc',
      include_adult: 'false',
      include_video: 'false',
      page: Math.floor(Math.random() * 10) + 1 + '', // Random page between 1 and 10
    });

    let isTV = false;
    let fallbackType = filters.type === 'All' ? (Math.random() > 0.5 ? 'Movie' : 'TV Series') : filters.type;

    if (fallbackType === 'TV Series') {
      endpoint = 'https://api.themoviedb.org/3/discover/tv';
      isTV = true;
      if (filters.genre && filters.genre !== 'All') {
        const id = TV_GENRE_MAP[filters.genre];
        if (id) queryParams.append('with_genres', id.toString());
      }
    } else if (fallbackType === 'Anime') {
      endpoint = 'https://api.themoviedb.org/3/discover/tv';
      isTV = true;
      let genres = ['16']; // Base: Animation
      if (filters.genre && filters.genre !== 'All') {
        const id = TV_GENRE_MAP[filters.genre];
        if (id && id !== 16) genres.push(id.toString());
      }
      queryParams.append('with_genres', genres.join(','));
      queryParams.append('with_original_language', 'ja');
      queryParams.append('with_keywords', '210024'); // Anime keyword for better accuracy
    } else if (fallbackType === 'Drama/K-Drama') {
      endpoint = 'https://api.themoviedb.org/3/discover/tv';
      isTV = true;
      let genres = [];
      if (filters.genre && filters.genre !== 'All') {
        const id = TV_GENRE_MAP[filters.genre];
        if (id) genres.push(id.toString());
      } else {
        genres.push('18'); // Base: Drama if no genre selected
      }
      if (genres.length > 0) {
        queryParams.append('with_genres', genres.join(','));
      }
      queryParams.append('with_original_language', 'ko');
    } else {
      // Movie
      if (filters.genre && filters.genre !== 'All') {
        const id = GENRE_MAP[filters.genre];
        if (id) queryParams.append('with_genres', id.toString());
      }
    }

    const fetchPage = async (pageNum: number) => {
      queryParams.set('page', pageNum.toString());
      const response = await fetch(`${endpoint}?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch from TMDB');
      const data = await response.json();
      return data;
    };

    let data = await fetchPage(Math.floor(Math.random() * 10) + 1);
    
    // If the random page had no results (niche filter), retry with page 1
    if (!data.results || data.results.length === 0) {
      data = await fetchPage(1);
    }

    if (!data.results || data.results.length === 0) {
      throw new Error('No results');
    }

    const item = data.results[Math.floor(Math.random() * data.results.length)];

    return {
      id: `${isTV ? 'tv' : 'm'}-${item.id}`,
      title: item.title || item.name,
      type: fallbackType as any,
      genres: [filters.genre !== 'All' ? filters.genre : 'Drama'] as any,
      year: parseInt((item.release_date || item.first_air_date || '2023').substring(0, 4)),
      rating: Math.round((item.vote_average || 0) * 10) / 10,
      synopsis: item.overview || 'No synopsis available.',
      poster: item.poster_path 
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=200',
      whereToWatch: ['Netflix', 'Prime Video', 'Apple TV'], // Mocked for TMDB without watch providers setup
      duration: isTV ? 'Multiple Seasons' : '120 min', // Mocked duration
    };

  } catch (error) {
    console.error('TMDB fetch failed, falling back to static database:', error);
    return getFallbackMovie(filters);
  }
};

export const fetchTrailerKey = async (id: string, apiKey: string): Promise<string | null> => {
  const key = apiKey.trim() || DEFAULT_API_KEY;
  const isTV = id.startsWith('tv-');
  const numericIdMatch = id.match(/\d+/);
  if (!numericIdMatch) return null; // static id

  const tmdbId = numericIdMatch[0];
  const endpoint = isTV 
    ? `https://api.themoviedb.org/3/tv/${tmdbId}/videos`
    : `https://api.themoviedb.org/3/movie/${tmdbId}/videos`;

  try {
    const response = await fetch(`${endpoint}?api_key=${key}`);
    if (!response.ok) return null;
    const data = await response.json();
    
    const youtubeVideos = data.results?.filter((v: any) => v.site === 'YouTube');
    const trailer = youtubeVideos?.find((v: any) => v.type === 'Trailer');
    if (trailer) return trailer.key;
    if (youtubeVideos && youtubeVideos.length > 0) return youtubeVideos[0].key;
    
    return null;
  } catch (err) {
    return null;
  }
};
