import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import {
  FiList,
  FiHeart,
  FiPlus,
  FiFilm,
  FiTrash2,
  FiStar,
  FiLock,
  FiGlobe,
  FiArrowLeft,
  FiSearch,
  FiX
} from 'react-icons/fi';

export default function Lists() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const { currentUser, openAuthModal } = useAuth();
  
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likePending, setLikePending] = useState({});
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addingMovie, setAddingMovie] = useState(false);

  // Create list form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListPublic, setNewListPublic] = useState(true);

  const userId = currentUser?.id || 1;

  useEffect(() => {
    if (listId) {
      fetchListById(listId);
    } else {
      fetchLists();
    }
  }, [listId, userId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/movies/search?query=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data?.results?.slice(0, 5) || []);
      } catch (e) {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/lists/user/${userId}`);
      setLists(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchListById = async (id) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/lists/${id}`);
      setSelectedList(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    if (currentUser?.isGuest) return openAuthModal();

    setCreating(true);
    try {
      const res = await axios.post('/api/lists', {
        user_id: userId,
        title: newListTitle,
        description: newListDescription,
        is_public: newListPublic
      });

      setLists([res.data, ...lists]);
      setShowCreateModal(false);
      setNewListTitle('');
      setNewListDescription('');
      setNewListPublic(true);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleAddMovieToList = async (movie) => {
    if (!selectedList) return;
    if (currentUser?.isGuest) return openAuthModal();

    setAddingMovie(true);
    try {
      await axios.post(`/api/lists/${selectedList.id}/movies`, {
        user_id: userId,
        movie: {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path
        }
      });

      // Refresh list
      const res = await axios.get(`/api/lists/${selectedList.id}`);
      setSelectedList(res.data);
      setSearchQuery('');
      setSearchResults([]);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingMovie(false);
    }
  };

  const handleRemoveMovie = async (movieId) => {
    if (currentUser?.isGuest) return openAuthModal();

    try {
      await axios.delete(`/api/lists/${selectedList.id}/movies/${movieId}`, {
        data: { user_id: userId }
      });

      // Refresh list
      const res = await axios.get(`/api/lists/${selectedList.id}`);
      setSelectedList(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleLike = async (listId) => {
    if (currentUser?.isGuest) return openAuthModal();
    if (likePending[listId]) return;
    setLikePending(prev => ({ ...prev, [listId]: true }));

    try {
      await axios.post(`/api/lists/${listId}/like`, { user_id: userId });
      fetchLists();
    } catch (e) {
      console.error(e);
    } finally {
      setLikePending(prev => ({ ...prev, [listId]: false }));
    }
  };

  if (loading) return <Loading />;

  // Single list view
  if (selectedList) {
    return (
      <div className="min-h-screen px-4 py-6 max-w-5xl mx-auto pb-20">
        <button
          onClick={() => {
            setSelectedList(null);
            navigate(`/profile/${userId}/lists`);
          }}
          className="flex items-center gap-2 text-dark-400 hover:text-white mb-6 text-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to lists
        </button>

        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-black text-white">{selectedList.title}</h1>
                <span className="text-xs text-dark-500">
                  {selectedList.is_public ? <FiGlobe className="w-4 h-4" /> : <FiLock className="w-4 h-4" />}
                </span>
              </div>
              {selectedList.description && (
                <p className="text-dark-400 text-sm mb-3">{selectedList.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-dark-500">
                <span className="flex items-center gap-1">
                  <FiFilm className="w-3.5 h-3.5" />
                  {selectedList.movie_count || selectedList.movies?.length || 0} films
                </span>
                <button
                  onClick={() => handleToggleLike(selectedList.id)}
                  className="flex items-center gap-1 hover:text-rose-400 transition-colors"
                >
                  <FiHeart className="w-3.5 h-3.5" />
                  {selectedList.likes_count || 0} likes
                </button>
              </div>
            </div>

            {/* Add movie search */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="text"
                    placeholder="Add a film..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-dark-800 border border-dark-700 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 w-48"
                  />
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="absolute right-0 top-full mt-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-50 w-72 max-h-80 overflow-y-auto">
                  {searchResults.map((movie) => (
                    <button
                      key={movie.id}
                      onClick={() => handleAddMovieToList(movie)}
                      disabled={addingMovie}
                      className="w-full flex items-center gap-3 p-3 hover:bg-dark-700 transition-colors text-left"
                    >
                      {movie.poster_path && (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt={movie.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{movie.title}</p>
                        <p className="text-xs text-dark-500">{movie.release_date?.slice(0, 4)}</p>
                      </div>
                      <FiPlus className="w-5 h-5 text-primary-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedList.movies?.length === 0 ? (
          <div className="text-center py-16 bg-dark-900/40 rounded-2xl border border-dark-800">
            <FiFilm className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 text-sm">No films added to this list yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {selectedList.movies?.map((movie) => (
              <div key={movie.movie_id} className="group relative">
                <Link
                  to={`/movie/${movie.movie_id}`}
                  className="block aspect-[2/3] rounded-xl overflow-hidden bg-dark-800 border border-dark-700 hover:border-primary-500 transition-all"
                >
                  {movie.movie_poster ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w300${movie.movie_poster}`}
                      alt={movie.movie_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiFilm className="w-8 h-8 text-dark-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-xs font-semibold text-white truncate">{movie.movie_title}</p>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemoveMovie(movie.movie_id)}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-rose-600 hover:bg-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <FiX className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Lists grid view
  return (
    <div className="min-h-screen px-4 py-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-500">
            <FiList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Curated Lists</h1>
            <p className="text-xs text-dark-400">Your personal film collections</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          New List
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-16 bg-dark-900/40 rounded-2xl border border-dark-800">
          <FiList className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400 text-sm mb-4">No lists created yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-primary-400 hover:text-primary-300 text-sm font-semibold"
          >
            Create your first list
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => navigate(`/lists/${list.id}`)}
              className="bg-dark-900 border border-dark-800 rounded-2xl p-5 hover:border-dark-700 transition-all text-left group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white truncate">{list.title}</h3>
                    <span className="text-dark-500">
                      {list.is_public ? <FiGlobe className="w-3 h-3" /> : <FiLock className="w-3 h-3" />}
                    </span>
                  </div>
                  {list.description && (
                    <p className="text-xs text-dark-400 truncate mt-1">{list.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-dark-500 pt-3 border-t border-dark-800">
                <span className="font-semibold text-primary-400">
                  {list.movie_count || 0} films
                </span>
                <span className="flex items-center gap-1">
                  <FiHeart className="w-3.5 h-3.5 text-rose-500" />
                  {list.likes_count || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Create New List</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-dark-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-2">
                  List Title
                </label>
                <input
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="e.g., My Favorite Sci-Fi Films"
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="What's this list about?"
                  rows={3}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newListPublic}
                  onChange={(e) => setNewListPublic(e.target.checked)}
                  className="w-4 h-4 rounded bg-dark-800 border-dark-700 text-primary-500 focus:ring-0"
                />
                <div>
                  <span className="text-sm font-medium text-white">Public list</span>
                  <p className="text-xs text-dark-500">Anyone can view this list</p>
                </div>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-dark-800 hover:bg-dark-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newListTitle.trim() || creating}
                  className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
