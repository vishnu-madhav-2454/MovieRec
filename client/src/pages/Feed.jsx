import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import {
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiStar,
  FiFilm,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';

const TRENDING_TOPICS = [
  { tag: 'DunePartTwo', posts: '14.2K' },
  { tag: 'Oppenheimer70mm', posts: '9.8K' },
  { tag: 'Interstellar10thAnniversary', posts: '8.4K' },
  { tag: 'TheBatmanPartII', posts: '6.1K' }
];

const SUGGESTED_FILMMAKERS = [
  { id: 525, name: 'Christopher Nolan', handle: '@nolan', initial: 'CN', note: 'Director • Oppenheimer' },
  { id: 137427, name: 'Denis Villeneuve', handle: '@denis', initial: 'DV', note: 'Director • Dune' },
  { id: 138, name: 'Quentin Tarantino', handle: '@tarantino', initial: 'QT', note: 'Director • Pulp Fiction' }
];

export default function Feed() {
  const { currentUser, openAuthModal } = useAuth();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Composer
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [movieQuery, setMovieQuery] = useState('');
  const [movieResults, setMovieResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // States
  const [revealedSpoilers, setRevealedSpoilers] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [followedMap, setFollowedMap] = useState({});
  const [likePending, setLikePending] = useState({});

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await axios.get('/api/social/feed', {
          params: { userId: currentUser?.id || 1, filter }
        });
        setFeed(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter, currentUser]);

  useEffect(() => {
    if (!movieQuery.trim()) {
      setMovieResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/movies/search?query=${encodeURIComponent(movieQuery)}`);
        setMovieResults(res.data?.results?.slice(0, 4) || []);
      } catch (e) {
        setMovieResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [movieQuery]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (currentUser?.isGuest) return openAuthModal();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        user_id: currentUser?.id || 1,
        username: currentUser?.displayName || 'Cinephile',
        user_avatar: currentUser?.photoURL || null,
        content: content.trim(),
        rating: rating > 0 ? rating : null,
        has_spoilers: hasSpoilers,
        movie_id: selectedMovie?.id || null,
        movie_title: selectedMovie?.title || null,
        movie_poster: selectedMovie?.poster_path || null
      };

      const res = await axios.post('/api/social/posts', payload);
      setFeed([res.data, ...feed]);
      setContent('');
      setRating(0);
      setHasSpoilers(false);
      setSelectedMovie(null);
      setMovieQuery('');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (postId) => {
    if (currentUser?.isGuest) return openAuthModal();
    if (likePending[postId]) return;
    setLikePending(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await axios.post(`/api/social/posts/${postId}/like`, {
        userId: currentUser?.id || 1
      });
      setFeed((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const uId = currentUser?.id || 1;
            return {
              ...p,
              likes_count: res.data.likes_count,
              is_liked: res.data.isLiked
            };
          }
          return p;
        })
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLikePending(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleAddComment = async (postId) => {
    if (currentUser?.isGuest) return openAuthModal();
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const res = await axios.post(`/api/social/posts/${postId}/comments`, {
        userId: currentUser?.id || 1,
        username: currentUser?.displayName || 'Cinephile',
        content: text.trim()
      });

      setFeed((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments_count: (p.comments_count || 0) + 1, comments: [...(p.comments || []), res.data] }
            : p
        )
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFollow = (filmmakerId) => {
    if (currentUser?.isGuest) return openAuthModal();
    setFollowedMap((prev) => ({ ...prev, [filmmakerId]: !prev[filmmakerId] }));
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-4 max-w-2xl w-full mx-auto">
          <div className="flex border-b border-dark-800 text-sm font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 pb-3 text-center transition-colors relative ${filter === 'all' ? 'text-white font-bold' : 'text-dark-400 hover:text-dark-200'}`}
            >
              For You
              {filter === 'all' && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary-500 rounded-full" />}
            </button>
            <button
              onClick={() => setFilter('following')}
              className={`flex-1 pb-3 text-center transition-colors relative ${filter === 'following' ? 'text-white font-bold' : 'text-dark-400 hover:text-dark-200'}`}
            >
              Following
              {filter === 'following' && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary-500 rounded-full" />}
            </button>
          </div>

          <div className="border-b border-dark-800 pb-5 pt-2">
            <form onSubmit={handlePost}>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center font-bold text-sm text-dark-200 shrink-0">
                  {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    rows={2}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What did you just watch? Share thoughts or hot takes..."
                    className="w-full bg-transparent text-sm text-white placeholder-dark-500 focus:outline-none resize-none"
                  />
                  {selectedMovie && (
                    <div className="inline-flex items-center gap-2 bg-dark-900 border border-dark-800 px-3 py-1 rounded-full text-xs text-white mb-2">
                      <FiFilm className="text-primary-500" />
                      <span>{selectedMovie.title}</span>
                      <button type="button" onClick={() => setSelectedMovie(null)} className="text-dark-400 hover:text-white">✕</button>
                    </div>
                  )}
                  {!selectedMovie && movieQuery && movieResults.length > 0 && (
                    <div className="bg-dark-900 border border-dark-800 rounded-xl p-2 space-y-1 mb-3">
                      {movieResults.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => { setSelectedMovie(m); setMovieQuery(''); }}
                          className="flex items-center gap-2 p-1.5 hover:bg-dark-800 rounded-lg cursor-pointer text-xs"
                        >
                          <FiFilm className="text-dark-400" />
                          <span className="font-semibold text-white">{m.title}</span>
                          <span className="text-dark-500">{m.release_date?.slice(0, 4)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-dark-900">
                    <div className="flex items-center gap-3 text-dark-400 text-xs">
                      <input
                        type="text"
                        placeholder="Tag movie..."
                        value={movieQuery}
                        onChange={(e) => setMovieQuery(e.target.value)}
                        className="bg-dark-900 border border-dark-800 rounded-full px-3 py-1 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-dark-700 w-32 sm:w-40"
                      />
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRating(s === rating ? 0 : s)}
                            className="p-0.5"
                          >
                            <FiStar className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-dark-600'}`} />
                          </button>
                        ))}
                      </div>
                      <label className="flex items-center gap-1 cursor-pointer select-none text-[11px]">
                        <input
                          type="checkbox"
                          checked={hasSpoilers}
                          onChange={(e) => setHasSpoilers(e.target.checked)}
                          className="rounded bg-dark-900 border-dark-800 text-primary-500 focus:ring-0"
                        />
                        <span>Spoiler</span>
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={!content.trim() || submitting}
                      className="bg-white text-black font-bold text-xs px-4 py-1.5 rounded-full hover:bg-dark-200 transition-colors disabled:opacity-40"
                    >
                      {submitting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div className="divide-y divide-dark-800">
            {feed.map((post) => {
              const isLiked = post.is_liked;
              const isSpoiler = post.has_spoilers;
              const isRevealed = revealedSpoilers[post.id];
              const showComments = expandedComments[post.id];

              return (
                <article key={post.id} className="py-4 hover:bg-dark-950/40 transition-colors">
                  <div className="flex gap-3">
                    <Link
                      to={`/profile/${post.user_id}`}
                      className="w-10 h-10 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center font-bold text-xs text-white shrink-0 hover:opacity-80"
                    >
                      {post.username?.charAt(0).toUpperCase() || 'U'}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <Link to={`/profile/${post.user_id}`} className="font-bold text-sm text-white hover:underline truncate">
                            {post.username}
                          </Link>
                          <span className="text-xs text-dark-500">
                            • {new Date(post.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {post.rating && (
                          <div className="flex items-center gap-1 bg-dark-900 px-2 py-0.5 rounded-md border border-dark-800 text-xs">
                            <FiStar className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="font-bold text-white text-xs">{post.rating}</span>
                          </div>
                        )}
                      </div>
                      {post.movie_title && (
                        <Link
                          to={`/movie/${post.movie_id || ''}`}
                          className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 font-semibold my-1"
                        >
                          <FiFilm className="w-3.5 h-3.5" />
                          <span>{post.movie_title}</span>
                        </Link>
                      )}
                      <div className="my-2">
                        {isSpoiler && !isRevealed ? (
                          <div className="bg-dark-900 border border-dark-800 rounded-xl p-3 text-center my-1">
                            <p className="text-xs text-dark-400 mb-2">This take contains plot spoilers</p>
                            <button
                              type="button"
                              onClick={() => setRevealedSpoilers({ ...revealedSpoilers, [post.id]: true })}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-dark-800 hover:bg-dark-700 px-3 py-1 rounded-full border border-dark-700"
                            >
                              <FiEye className="w-3.5 h-3.5" /> Reveal Text
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-dark-100 whitespace-pre-line leading-relaxed font-normal">
                              {post.content}
                            </p>
                            {isSpoiler && isRevealed && (
                              <button
                                type="button"
                                onClick={() => setRevealedSpoilers({ ...revealedSpoilers, [post.id]: false })}
                                className="inline-flex items-center gap-1 text-[11px] text-dark-500 hover:text-dark-300 mt-1"
                              >
                                <FiEyeOff className="w-3 h-3" /> Hide spoiler
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {post.movie_poster && (
                        <Link
                          to={`/movie/${post.movie_id || ''}`}
                          className="block my-3 rounded-xl overflow-hidden border border-dark-800 max-w-sm bg-dark-900 aspect-[16/9] relative group"
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w780${post.movie_poster}`}
                            alt={post.movie_title || ''}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                            <span className="font-bold text-xs text-white">{post.movie_title}</span>
                          </div>
                        </Link>
                      )}
                      <div className="flex items-center gap-8 text-dark-400 text-xs pt-2">
                        <button
                          onClick={() => toggleLike(post.id)}
                          disabled={likePending[post.id]}
                          className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-rose-500' : 'hover:text-rose-400'}`}
                        >
                          <FiHeart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                          <span>{post.likes_count || 0}</span>
                        </button>
                        <button
                          onClick={() => setExpandedComments({ ...expandedComments, [post.id]: !showComments })}
                          className="flex items-center gap-1.5 hover:text-primary-400 transition-colors"
                        >
                          <FiMessageCircle className="w-4 h-4" />
                          <span>{post.comments_count || post.comments?.length || 0}</span>
                        </button>
                        <button
                          onClick={() => {
                            if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
                          }}
                          className="flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                          <FiShare2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {showComments && (
                        <div className="mt-3 pt-3 border-t border-dark-800 space-y-2">
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {post.comments?.map((c) => (
                              <div key={c.id} className="text-xs bg-dark-900/60 p-2.5 rounded-xl border border-dark-800">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-white">{c.username}</span>
                                  <span className="text-dark-500 text-[10px]">{new Date(c.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-dark-200">{c.content}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                              placeholder="Post your reply..."
                              className="flex-1 bg-dark-900 border border-dark-800 rounded-full px-3 py-1.5 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-dark-700"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddComment(post.id)}
                              className="text-xs bg-white text-black font-semibold px-3 py-1.5 rounded-full hover:bg-dark-200"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <aside className="hidden lg:block space-y-6">
          <div className="bg-dark-950 border border-dark-800 rounded-2xl p-4">
            <h3 className="font-bold text-sm text-white mb-3">Trending in Cinema</h3>
            <div className="space-y-3">
              {TRENDING_TOPICS.map((t, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs group cursor-pointer">
                  <div>
                    <p className="font-semibold text-white group-hover:underline">#{t.tag}</p>
                    <p className="text-dark-500 text-[11px]">{t.posts} posts</p>
                  </div>
                  <span className="text-dark-600 text-[11px]">Trending</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-dark-950 border border-dark-800 rounded-2xl p-4">
            <h3 className="font-bold text-sm text-white mb-3">Filmmakers to Follow</h3>
            <div className="space-y-3">
              {SUGGESTED_FILMMAKERS.map((f) => {
                const isFollowed = followedMap[f.id];
                return (
                  <div key={f.id} className="flex items-center justify-between gap-3 text-xs">
                    <Link to={`/person/${f.id}`} className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center font-bold text-white shrink-0 text-xs">
                        {f.initial}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-white truncate hover:underline">{f.name}</p>
                        <p className="text-dark-500 text-[11px] truncate">{f.note}</p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleFollow(f.id)}
                      className={`text-xs px-3 py-1 rounded-full font-bold transition-colors shrink-0 ${isFollowed ? 'bg-dark-800 text-dark-300 border border-dark-700' : 'bg-white text-black hover:bg-dark-200'}`}
                    >
                      {isFollowed ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
