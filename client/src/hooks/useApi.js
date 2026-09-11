import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { auth, isFirebaseConfigured } from '../config/firebase';

const API_BASE = 'http://localhost:3001/api';

// Get Firebase ID token for authenticated requests
const getAuthToken = async () => {
  if (!isFirebaseConfigured || !auth?.currentUser) {
    return null;
  }
  try {
    return await auth.currentUser.getIdToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_BASE,
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function useApi(endpoint, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(endpoint);
        if (!cancelled) {
          setData(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'An error occurred');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return { data, loading, error };
}

export function useSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        setLoading(true);
        try {
          const response = await api.get(`/movies/search?query=${encodeURIComponent(query)}`);
          setResults(response.data.results || []);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return { query, setQuery, results, loading };
}

// Export api instance for direct use
export { api };

// Helper functions for common API operations
export const apiHelpers = {
  // User operations
  getCurrentUser: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  
  // Watchlist operations
  getWatchlist: (userId) => api.get(`/watchlist/user/${userId}`),
  addToWatchlist: (movieId, movieTitle, posterPath) => 
    api.post('/watchlist', { movie_id: movieId, movie_title: movieTitle, poster_path: posterPath }),
  removeFromWatchlist: (movieId) => api.delete(`/watchlist/movie/${movieId}`),
  
  // Review operations
  getReviews: (movieId) => api.get(`/reviews/movie/${movieId}`),
  createReview: (movieId, rating, content) => 
    api.post('/reviews', { movie_id: movieId, rating, content }),
  updateReview: (reviewId, rating, content) => 
    api.put(`/reviews/${reviewId}`, { rating, content }),
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
  likeReview: (reviewId) => api.post(`/reviews/${reviewId}/like`),
  
  // Social operations
  getFeed: (page = 1) => api.get(`/social/feed?page=${page}`),
  followUser: (userId) => api.post(`/social/follow/${userId}`),
  unfollowUser: (userId) => api.delete(`/social/follow/${userId}`),
  getFollowers: (userId) => api.get(`/social/followers/${userId}`),
  getFollowing: (userId) => api.get(`/social/following/${userId}`),
};
