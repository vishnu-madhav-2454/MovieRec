import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard';
import Loading from '../components/Loading';
import { FiSearch, FiUser, FiStar, FiFilm } from 'react-icons/fi';

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { currentUser } = useAuth();
  const [searchInput, setSearchInput] = useState(query);
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({ users: [], reviews: [], movies: [] });
  const [loading, setLoading] = useState(false);

  // Live search — fires 300ms after user stops typing
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (!trimmed) {
      setResults({ users: [], reviews: [], movies: [] });
      return;
    }
    const timer = setTimeout(() => {
      performSearch(trimmed);
      setSearchParams({ q: trimmed });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Also trigger from URL param on load
  useEffect(() => {
    if (query) {
      setSearchInput(query);
      performSearch(query);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({ users: [], reviews: [], movies: [] });
      return;
    }

    setLoading(true);
    try {
      const [usersRes, reviewsRes, moviesRes] = await Promise.all([
        axios.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`).catch(() => ({ data: [] })),
        axios.get(`/api/reviews/search?q=${encodeURIComponent(searchQuery)}`).catch(() => ({ data: [] })),
        axios.get(`/api/movies/search?query=${encodeURIComponent(searchQuery)}`).catch(() => ({ data: { results: [] } }))
      ]);

      setResults({
        users: usersRes.data || [],
        reviews: reviewsRes.data || [],
        movies: moviesRes.data.results || []
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      performSearch(searchInput);
    }
  };

  const totalResults = results.users.length + results.reviews.length + results.movies.length;

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-8 pb-24">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Search</h1>
        
        <form onSubmit={handleSearch} className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search users, reviews, movies..."
            className="w-full bg-dark-900 border border-dark-800 rounded-xl py-3 pl-12 pr-10 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
            autoFocus
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          )}
          {!loading && searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors text-lg leading-none"
            >
              ×
            </button>
          )}
        </form>
      </div>

      {searchInput && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-dark-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-400 hover:text-white'
              }`}
            >
              All ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-400 hover:text-white'
              }`}
            >
              Users ({results.users.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'reviews'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-400 hover:text-white'
              }`}
            >
              Reviews ({results.reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('movies')}
              className={`px-4 py-2 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'movies'
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-400 hover:text-white'
              }`}
            >
              Movies ({results.movies.length})
            </button>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Users */}
            {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
              <div>
                {activeTab === 'all' && <h2 className="text-xl font-bold mb-3 flex items-center gap-2"><FiUser className="text-primary-500" /> Users</h2>}
                <div className="space-y-2">
                  {results.users.map((user) => (
                    <Link
                      key={user.id}
                      to={`/profile/${user.id}`}
                      className="flex items-center gap-3 p-3 bg-dark-900 hover:bg-dark-800 border border-dark-800 rounded-xl transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-600 to-rose-500 flex items-center justify-center text-white font-bold shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          user.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{user.username}</p>
                        {user.bio && <p className="text-sm text-dark-400 truncate">{user.bio}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {(activeTab === 'all' || activeTab === 'reviews') && results.reviews.length > 0 && (
              <div>
                {activeTab === 'all' && <h2 className="text-xl font-bold mb-3 flex items-center gap-2"><FiStar className="text-amber-500" /> Reviews</h2>}
                <div className="space-y-4">
                  {results.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} currentUser={currentUser} />
                  ))}
                </div>
              </div>
            )}

            {/* Movies */}
            {(activeTab === 'all' || activeTab === 'movies') && results.movies.length > 0 && (
              <div>
                {activeTab === 'all' && <h2 className="text-xl font-bold mb-3 flex items-center gap-2"><FiFilm className="text-primary-500" /> Movies</h2>}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {results.movies.slice(0, activeTab === 'all' ? 8 : 20).map((movie) => (
                    <Link
                      key={movie.id}
                      to={`/movie/${movie.id}`}
                      className="group"
                    >
                      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-dark-900 border border-dark-800 group-hover:border-primary-500 transition-all">
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-dark-600">
                            <FiFilm className="w-12 h-12" />
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white truncate">{movie.title}</p>
                      <p className="text-xs text-dark-400">{movie.release_date?.substring(0, 4)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {totalResults === 0 && (
              <div className="text-center py-20">
                <FiSearch className="w-16 h-16 mx-auto mb-4 text-dark-600" />
                <p className="text-dark-400 text-lg">No results found for "{searchInput}"</p>
                <p className="text-dark-500 text-sm mt-2">Try searching for users, reviews, or movies</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {!searchInput && !loading && (
        <div className="text-center py-20">
          <FiSearch className="w-16 h-16 mx-auto mb-4 text-dark-600" />
          <p className="text-dark-400 text-lg">Search for users, reviews, and movies</p>
          <p className="text-dark-500 text-sm mt-2">Start typing in the search bar above</p>
        </div>
      )}
    </div>
  );
}

export default Search;
