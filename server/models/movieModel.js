import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Simple in-memory cache with TTL
class Cache {
  constructor() {
    this.store = new Map();
    this.defaultTTL = 10 * 60 * 1000; // 10 minutes default
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  clear() {
    this.store.clear();
  }
}

const cache = new Cache();

// Axios instance with retry and timeout configuration
const tmdbAxios = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    'Authorization': `Bearer ${TMDB_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Retry logic for failed requests
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await tmdbAxios.get(url);
      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

/**
 * Movie Model - Handles all movie data operations
 * Interacts with TMDB API with caching and retry logic
 */
class MovieModel {
  
  /**
   * Check if TMDB API key is configured
   */
  static hasApiKey() {
    return TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here';
  }

  /**
   * Fetch trending movies from TMDB API with caching
   */
  static async getTrending() {
    if (!this.hasApiKey()) {
      return this.getMockTrending();
    }

    const cacheKey = 'trending';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const data = await fetchWithRetry(`${TMDB_BASE}/trending/movie/week`);
    cache.set(cacheKey, data, 30 * 60 * 1000); // Cache for 30 minutes
    return data;
  }

  /**
   * Fetch popular movies from TMDB API with caching
   */
  static async getPopular(page = 1) {
    if (!this.hasApiKey()) {
      return this.getMockPopular();
    }

    const cacheKey = `popular_${page}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const data = await fetchWithRetry(`${TMDB_BASE}/movie/popular?page=${page}`);
    cache.set(cacheKey, data, 30 * 60 * 1000); // Cache for 30 minutes
    return data;
  }

  /**
   * Search movies via TMDB API with caching
   */
  static async search(query, page = 1) {
    if (!this.hasApiKey()) {
      return {
        page: 1,
        total_results: 0,
        total_pages: 0,
        results: []
      };
    }

    const cacheKey = `search_${query}_${page}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchWithRetry(`${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&page=${page}`);
      cache.set(cacheKey, data, 5 * 60 * 1000); // Cache for 5 minutes
      return data;
    } catch (err) {
      console.warn('TMDB search network issue, returning empty results fallback:', err.message);
      return {
        page: 1,
        total_results: 0,
        total_pages: 0,
        results: []
      };
    }
  }

  /**
   * Get movie details from TMDB API with caching
   */
  static async getDetails(id) {
    if (!this.hasApiKey()) {
      return this.getMockMovieDetails(id);
    }

    const cacheKey = `movie_${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Fetch details, credits, and watch providers in parallel with retry
    const [details, credits, watchProviders] = await Promise.all([
      fetchWithRetry(`${TMDB_BASE}/movie/${id}`),
      fetchWithRetry(`${TMDB_BASE}/movie/${id}/credits`),
      fetchWithRetry(`${TMDB_BASE}/movie/${id}/watch/providers`)
    ]);

    // Combine all data
    const movieData = {
      ...details,
      credits,
      streaming_availability: this.formatWatchProviders(watchProviders.results)
    };

    cache.set(cacheKey, movieData, 60 * 60 * 1000); // Cache for 1 hour
    return movieData;
  }

  /**
   * Format watch providers for easy consumption
   */
  static formatWatchProviders(providers) {
    if (!providers) return null;

    const regions = ['US', 'GB', 'CA', 'AU', 'IN'];
    const formatted = {};

    regions.forEach(region => {
      if (providers[region]) {
        formatted[region] = {
          flatrate: providers[region].flatrate || [], // Streaming
          buy: providers[region].buy || [],           // Buy/Own
          rent: providers[region].rent || []          // Rent
        };
      }
    });

    return Object.keys(formatted).length > 0 ? formatted : null;
  }

  /**
   * Get movie recommendations from TMDB API with caching
   */
  static async getRecommendations(id) {
    if (!this.hasApiKey()) {
      return {
        page: 1,
        results: []
      };
    }

    const cacheKey = `recommendations_${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const data = await fetchWithRetry(`${TMDB_BASE}/movie/${id}/recommendations`);
    cache.set(cacheKey, data, 30 * 60 * 1000); // Cache for 30 minutes
    return data;
  }

  /**
   * Get mock trending movies data (fallback)
   */
  static getMockTrending() {
    return {
      page: 1,
      results: []
    };
  }

  /**
   * Get mock popular movies data (fallback)
   */
  static getMockPopular() {
    return {
      page: 1,
      results: []
    };
  }

  /**
   * Get mock movie details (fallback)
   */
  static getMockMovieDetails(id) {
    return {
      id: parseInt(id),
      title: "Movie not found",
      poster_path: null,
      backdrop_path: null,
      vote_average: 0,
      release_date: "",
      runtime: 0,
      overview: "Please configure TMDB API key to see movie data.",
      genres: [],
      credits: { cast: [] }
    };
  }
}

export default MovieModel;
