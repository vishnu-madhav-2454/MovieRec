import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Loading from '../components/Loading';
import { FiBookmark, FiTrash2 } from 'react-icons/fi';

function Watchlist() {
  const { userId } = useParams();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
  }, [userId]);

  const fetchWatchlist = async () => {
    try {
      const response = await axios.get(`/api/watchlist/user/${userId}`);
      setWatchlist(response.data || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (movieId) => {
    try {
      await axios.delete(`/api/watchlist/${userId}/${movieId}`);
      setWatchlist(prev => prev.filter(item => item.movie_id !== movieId));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <FiBookmark className="w-8 h-8 text-primary-500" />
        <div>
          <h1 className="text-3xl font-bold">My Watchlist</h1>
          <p className="text-dark-400">{watchlist.length} movies to watch</p>
        </div>
      </div>

      {/* Empty State */}
      {watchlist.length === 0 ? (
        <div className="text-center py-20 bg-dark-800/50 rounded-xl border border-dark-700">
          <FiBookmark className="w-16 h-16 mx-auto mb-4 text-dark-600" />
          <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
          <p className="text-dark-400 mb-6">Start adding movies you want to watch!</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
          >
            Browse Movies
          </Link>
        </div>
      ) : (
        /* Watchlist Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {watchlist.map(item => (
            <div key={item.id} className="relative group">
              <Link to={`/movie/${item.movie_id}`} className="block">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-dark-800">
                  {item.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={item.movie_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-dark-600">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="mt-2 font-medium text-sm line-clamp-2">{item.movie_title}</h3>
              </Link>
              
              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeFromWatchlist(item.movie_id);
                }}
                className="absolute top-2 right-2 p-2 bg-dark-950/90 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title="Remove from watchlist"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Watchlist;
