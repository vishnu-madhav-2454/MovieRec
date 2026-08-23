import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loading from '../components/Loading';
import MovieCard from '../components/MovieCard';
import ReviewCard from '../components/ReviewCard';
import { useAuth } from '../context/AuthContext';
import { 
  FiFilm, 
  FiStar, 
  FiList, 
  FiUserPlus, 
  FiCheck,
  FiHeart,
  FiUsers,
  FiLogOut,
  FiSettings
} from 'react-icons/fi';

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, openAuthModal, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('films');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [watchedFilms, setWatchedFilms] = useState([]);
  const [favoriteFilms, setFavoriteFilms] = useState([]);
  const [customLists, setCustomLists] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !currentUser?.isGuest && String(currentUser?.id || 1) === String(id);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const userId = id || currentUser?.id || 1;

        const [userRes, statsRes, reviewsRes, watchlistRes, watchedRes, favoritesRes, listsRes, followingRes, followersRes] = await Promise.all([
          axios.get('/api/users/' + userId).catch(() => ({ data: null })),
          axios.get('/api/users/' + userId + '/stats').catch(() => ({ data: null })),
          axios.get('/api/reviews/user/' + userId).catch(() => ({ data: [] })),
          axios.get('/api/watchlist/' + userId).catch(() => ({ data: [] })),
          axios.get('/api/users/' + userId + '/watched').catch(() => ({ data: [] })),
          axios.get('/api/users/' + userId + '/favorites').catch(() => ({ data: [] })),
          axios.get('/api/lists/user/' + userId).catch(() => ({ data: [] })),
          axios.get('/api/users/' + userId + '/following').catch(() => ({ data: [] })),
          axios.get('/api/users/' + userId + '/followers').catch(() => ({ data: [] }))
        ]);
        
        setUser(userRes.data || {
          id: parseInt(userId),
          username: isOwnProfile ? (currentUser?.displayName || 'MovieBuff') : ('User_' + userId),
          bio: isOwnProfile ? 'Film enthusiast | Horror, Nolan & Sci-Fi lover | Letterboxd cinephile' : 'Cinephile & Movie Collector',
          avatar_url: isOwnProfile ? currentUser?.photoURL : null
        });
        setStats(statsRes.data || { watched: 0, reviews: 0, watchlist: 0, following: 0, followers: 0 });
        setReviews(reviewsRes.data || []);
        setWatchlist(watchlistRes.data || []);
        setWatchedFilms(watchedRes.data || []);
        setFavoriteFilms(favoritesRes.data || []);
        setCustomLists(listsRes.data || []);
        setFollowingList(followingRes.data || []);
        setFollowersList(followersRes.data || []);
        
        // Check follow status if viewing someone else's profile and logged in
        if (!isOwnProfile && currentUser?.id && !currentUser?.isGuest) {
          try {
            const statusRes = await axios.get(`/api/users/${userId}/follow-status?follower_id=${currentUser.id}`);
            setIsFollowing(statusRes.data.isFollowing || false);
          } catch (err) {
            console.error('Error checking follow status:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [id, currentUser]);

  const toggleFollow = async () => {
    if (currentUser?.isGuest) return openAuthModal();
    
    try {
      if (isFollowing) {
        await axios.delete(`/api/users/${id}/follow`, {
          data: { follower_id: currentUser?.id }
        });
        setIsFollowing(false);
        setStats(prev => ({
          ...prev,
          followers: Math.max(0, (prev?.followers || 0) - 1)
        }));
      } else {
        await axios.post(`/api/users/${id}/follow`, {
          follower_id: currentUser?.id
        });
        setIsFollowing(true);
        setStats(prev => ({
          ...prev,
          followers: (prev?.followers || 0) + 1
        }));
      }
      
      // Refresh followers list
      const followersRes = await axios.get(`/api/users/${id}/followers`);
      setFollowersList(followersRes.data || []);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-6 sm:py-8 md:py-10 animate-fade-in text-white pb-20 md:pb-10">
      <div className="bg-dark-900/60 border border-dark-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 backdrop-blur-md mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-3 sm:gap-4 md:gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 md:gap-6 text-center sm:text-left w-full md:w-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-tr from-primary-600 via-rose-600 to-amber-500 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-black text-white shadow-2xl ring-2 sm:ring-4 ring-dark-800 shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                user.username?.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 md:gap-3 mb-1.5 sm:mb-2">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-white truncate max-w-[200px] sm:max-w-none">{user.username}</h1>
                <span className="bg-primary-950 text-primary-400 border border-primary-800/80 text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 md:px-2.5 py-0.5 rounded-full shrink-0">
                  Pro Cinephile
                </span>
              </div>
              <p className="text-dark-300 text-[11px] sm:text-xs md:text-sm max-w-lg mb-2 sm:mb-3 md:mb-4 leading-relaxed font-normal px-1 sm:px-0">{user.bio}</p>
              
              <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-4 md:gap-6 text-center flex-wrap">
                <div className="min-w-[50px] sm:min-w-[60px]">
                  <span className="text-base sm:text-lg md:text-xl font-black text-white block">{stats?.watched || watchedFilms.length}</span>
                  <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-dark-500 uppercase tracking-wider">Films</span>
                </div>
                <div className="min-w-[50px] sm:min-w-[60px]">
                  <span className="text-base sm:text-lg md:text-xl font-black text-amber-400 block">{stats?.reviews || reviews.length}</span>
                  <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-dark-500 uppercase tracking-wider">Reviews</span>
                </div>
                <div className="min-w-[50px] sm:min-w-[60px]">
                  <span className="text-base sm:text-lg md:text-xl font-black text-primary-400 block">{stats?.watchlist || watchlist.length}</span>
                  <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-dark-500 uppercase tracking-wider">Watchlist</span>
                </div>
                <div className="min-w-[50px] sm:min-w-[60px]">
                  <span className="text-base sm:text-lg md:text-xl font-black text-sky-400 block">{stats?.following || followingList.length}</span>
                  <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-dark-500 uppercase tracking-wider">Following</span>
                </div>
                <div className="min-w-[50px] sm:min-w-[60px]">
                  <span className="text-base sm:text-lg md:text-xl font-black text-rose-400 block">{stats?.followers || followersList.length}</span>
                  <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-dark-500 uppercase tracking-wider">Followers</span>
                </div>
              </div>
            </div>
          </div>

          {!isOwnProfile ? (
            <button
              onClick={toggleFollow}
              className={'px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shrink-0 ' + (isFollowing ? 'bg-dark-800 text-dark-300 border border-dark-700' : 'bg-primary-600 hover:bg-primary-500 text-white')}
            >
              {isFollowing ? <FiCheck className="w-4 h-4" /> : <FiUserPlus className="w-4 h-4" />}
              {isFollowing ? 'Following' : 'Follow User'}
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate(`/settings`)}
                className="px-3 sm:px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white border border-dark-700 transition-all"
                title="Settings"
              >
                <FiSettings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="px-3 sm:px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 border border-rose-800/40 transition-all"
                title="Logout"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex border-b border-dark-800 mb-8 overflow-x-auto scrollbar-none gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab('films')}
          className={'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ' + (activeTab === 'films' ? 'border-primary-500 text-primary-400 bg-dark-900/30' : 'border-transparent text-dark-400 hover:text-white')}
        >
          <FiFilm className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
          <span className="hidden xs:inline">Diary & </span>Films ({stats?.watched || watchedFilms.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ' + (activeTab === 'reviews' ? 'border-primary-500 text-primary-400 bg-dark-900/30' : 'border-transparent text-dark-400 hover:text-white')}
        >
          <FiStar className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Reviews ({reviews.length})
        </button>

        <button
          onClick={() => setActiveTab('lists')}
          className={'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ' + (activeTab === 'lists' ? 'border-primary-500 text-primary-400 bg-dark-900/30' : 'border-transparent text-dark-400 hover:text-white')}
        >
          <FiList className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Lists ({customLists.length})
        </button>

        <button
          onClick={() => setActiveTab('following')}
          className={'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ' + (activeTab === 'following' ? 'border-primary-500 text-primary-400 bg-dark-900/30' : 'border-transparent text-dark-400 hover:text-white')}
        >
          <FiUsers className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Following ({stats?.following || followingList.length})
        </button>

        <button
          onClick={() => setActiveTab('followers')}
          className={'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ' + (activeTab === 'followers' ? 'border-primary-500 text-primary-400 bg-dark-900/30' : 'border-transparent text-dark-400 hover:text-white')}
        >
          <FiUsers className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Followers ({stats?.followers || followersList.length})
        </button>
      </div>

      {activeTab === 'films' && (
        <div>
          {/* Favorite Films Section (max 4) */}
          {favoriteFilms.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FiHeart className="text-rose-500" /> Favorite Films
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {favoriteFilms.map((film) => (
                  <Link
                    key={film.movie_id}
                    to={`/movie/${film.movie_id}`}
                    className="group relative rounded-xl overflow-hidden bg-dark-900 border border-dark-800 shadow-md aspect-[2/3] hover:border-primary-500 transition-all hover:scale-105"
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w300${film.movie_poster}`}
                      alt={film.movie_title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                      <span className="text-[10px] font-bold text-white leading-tight truncate">{film.movie_title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Watched Films Section */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Films Watched</h3>
            <span className="text-xs text-dark-400">{stats.watched || watchedFilms.length} films logged</span>
          </div>

          {watchedFilms.length === 0 ? (
            <div className="text-center py-12 bg-dark-900/40 rounded-2xl border border-dark-800">
              <FiFilm className="w-10 h-10 text-dark-600 mx-auto mb-2" />
              <p className="text-dark-300 font-semibold text-sm">No films logged yet</p>
              <p className="text-dark-500 text-xs mt-1">Start tracking films you've watched</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
              {watchedFilms.slice(0, 16).map((film) => (
                <Link
                  key={film.movie_id}
                  to={`/movie/${film.movie_id}`}
                  className="group relative rounded-xl overflow-hidden bg-dark-900 border border-dark-800 shadow-md aspect-[2/3] hover:border-primary-500 transition-all hover:scale-105"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w300${film.movie_poster}`}
                    alt={film.movie_title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <span className="text-[10px] font-bold text-white leading-tight truncate">{film.movie_title}</span>
                    {film.rating && (
                      <div className="flex items-center gap-0.5 text-amber-400 mt-0.5">
                        <FiStar className="w-3 h-3 fill-amber-400" />
                        <span className="text-[10px] font-black">{film.rating}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-dark-900/40 rounded-2xl border border-dark-800">
              <FiStar className="w-10 h-10 text-dark-600 mx-auto mb-2" />
              <p className="text-dark-300 font-semibold text-sm">No reviews written yet</p>
            </div>
          ) : (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUser={currentUser}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'lists' && (
        <div>
          {customLists.length === 0 ? (
            <div className="text-center py-12 bg-dark-900/40 rounded-2xl border border-dark-800">
              <FiList className="w-10 h-10 text-dark-600 mx-auto mb-2" />
              <p className="text-dark-300 font-semibold text-sm">No lists created yet</p>
              {isOwnProfile && (
                <button
                  onClick={() => navigate(`/profile/${id}/lists`)}
                  className="text-primary-400 hover:text-primary-300 text-xs font-semibold mt-2"
                >
                  Create your first list
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {customLists.map((list) => (
                <Link
                  key={list.id}
                  to={`/lists/${list.id}`}
                  className="bg-dark-900 border border-dark-800 rounded-2xl p-5 hover:border-dark-700 transition-all shadow-md"
                >
                  <h4 className="font-bold text-base text-white mb-2">{list.title}</h4>
                  {list.description && (
                    <p className="text-xs text-dark-400 mb-2 truncate">{list.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-dark-400 pt-3 border-t border-dark-800">
                    <span className="font-semibold text-primary-400">{list.movie_count || 0} films</span>
                    <span className="flex items-center gap-1"><FiHeart className="text-rose-500 fill-rose-500" /> {list.likes_count || 0} likes</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'following' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {followingList.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-dark-900/40 rounded-2xl border border-dark-800">
              <FiUsers className="w-10 h-10 text-dark-600 mx-auto mb-2" />
              <p className="text-dark-300 font-semibold text-sm">Not following anyone yet</p>
            </div>
          ) : (
            followingList.map((f) => {
              const targetId = f.user_id || f.following_id || f.follower_id || f.id;
              return (
                <Link
                  key={f.id}
                  to={`/profile/${targetId}`}
                  className="bg-dark-900 hover:bg-dark-850 hover:border-dark-700 border border-dark-800 rounded-2xl p-3 sm:p-4 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                      {f.avatar_url ? (
                        <img src={f.avatar_url} alt={f.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        (f.username || 'U').charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white group-hover:underline truncate">{f.username}</h4>
                      <p className="text-[11px] text-dark-400 truncate">{f.bio || 'Movie enthusiast'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-dark-950 px-2 py-1 rounded-lg border border-dark-800 text-primary-400 font-semibold shrink-0 ml-2">
                    Following
                  </span>
                </Link>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'followers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {followersList.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-dark-900/40 rounded-2xl border border-dark-800">
              <FiUsers className="w-10 h-10 text-dark-600 mx-auto mb-2" />
              <p className="text-dark-300 font-semibold text-sm">No followers yet</p>
            </div>
          ) : (
            followersList.map((f) => {
              const targetId = f.user_id || f.follower_id || f.following_id || f.id;
              return (
                <Link
                  key={f.id}
                  to={`/profile/${targetId}`}
                  className="bg-dark-900 hover:bg-dark-850 hover:border-dark-700 border border-dark-800 rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 min-w-0 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                    {f.avatar_url ? (
                      <img src={f.avatar_url} alt={f.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (f.username || 'U').charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white group-hover:underline truncate">{f.username}</h4>
                    <p className="text-[11px] text-dark-400 truncate">{f.bio || 'Movie enthusiast'}</p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default Profile;
