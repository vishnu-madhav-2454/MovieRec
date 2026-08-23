import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Loading from '../components/Loading';
import MovieCard from '../components/MovieCard';
import ReviewCard from '../components/ReviewCard';
import { useAuth } from '../context/AuthContext';
import { detectSpoilers } from '../utils/spoilerDetector';
import {
  FiStar,
  FiCalendar,
  FiClock,
  FiBookmark,
  FiCheck,
  FiX,
  FiMessageSquare,
  FiFilm,
  FiShield,
  FiFilter
} from 'react-icons/fi';
import { SiThemoviedatabase } from 'react-icons/si';

const VIBE_OPTIONS = [
  'Masterpiece',
  'Mind-Bending',
  'Emotional Wreck',
  'Slow Burn',
  'Visual Feast',
  'Underrated',
  'Great Score',
  'Dark & Gritty'
];

function MovieDetail() {
  const { id } = useParams();
  const { currentUser, openAuthModal } = useAuth();
  const [movie, setMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [communityReviews, setCommunityReviews] = useState([]);
  const [communityStats, setCommunityStats] = useState({ average_rating: 0, review_count: 0 });
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [reviewSort, setReviewSort] = useState('popular');
  const [userRating, setUserRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [hasSpoilersManual, setHasSpoilersManual] = useState(false);
  const [spoilerWarning, setSpoilerWarning] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const uid = currentUser?.id || 1;
        const [movieRes, recRes, watchRes, reviewsRes, statsRes] = await Promise.all([
          axios.get('/api/movies/' + id),
          axios.get('/api/movies/' + id + '/recommendations').catch(() => ({ data: { results: [] } })),
          axios.get('/api/watchlist/check/' + uid + '/' + id).catch(() => ({ data: { inWatchlist: false } })),
          axios.get('/api/reviews/movie/' + id + '?sort=' + reviewSort + '&userId=' + uid).catch(() => ({ data: [] })),
          axios.get('/api/reviews/movie/' + id + '/stats').catch(() => ({ data: {} }))
        ]);
        setMovie(movieRes.data);
        setRecommendations(recRes.data.results?.slice(0, 6) || []);
        setInWatchlist(!!(watchRes.data?.inWatchlist || watchRes.data?.inWatchlist));
        setCommunityReviews(reviewsRes.data || []);
        const stats = statsRes.data || {};
        setCommunityStats({
          average_rating: stats.average_rating || stats.average_rating || 0,
          review_count: stats.review_count || stats.review_count || 0
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
    window.scrollTo(0, 0);
  }, [id, currentUser, reviewSort]);

  const toggleWatchlist = async () => {
    if (currentUser?.isGuest) return openAuthModal();
    const uid = currentUser?.id || 1;
    try {
      if (inWatchlist) {
        await axios.delete('/api/watchlist/' + uid + '/' + id);
        setInWatchlist(false);
      } else {
        await axios.post('/api/watchlist', {
          user_id: uid,
          movie_id: movie.id,
          movie_title: movie.title,
          poster_path: movie.poster_path
        });
        setInWatchlist(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReviewContentChange = (text) => {
    setReviewContent(text);
    const detection = detectSpoilers(text);
    if (detection.hasSpoilers) {
      setSpoilerWarning('Possible spoilers: ' + detection.matches.join(', '));
      setHasSpoilersManual(true);
    } else {
      setSpoilerWarning(null);
    }
  };

  const submitReview = async () => {
    if (currentUser?.isGuest) return openAuthModal();
    if (userRating === 0) return;
    setSubmittingReview(true);
    try {
      const detection = detectSpoilers(reviewContent);
      const isSpoiler = hasSpoilersManual || detection.hasSpoilers;
      const payload = {
        user_id: currentUser?.id || 1,
        username: currentUser?.displayName || currentUser?.username || 'MovieBuff',
        user_avatar: currentUser?.photoURL || null,
        movie_id: movie.id,
        movie_title: movie.title,
        movie_poster: movie.poster_path || null,
        rating: userRating,
        content: reviewContent.trim(),
        vibes: selectedVibes,
        has_spoilers: isSpoiler
      };
      const res = await axios.post('/api/reviews', payload);
      setCommunityReviews((prev) => [res.data, ...prev.filter((r) => r.user_id !== (currentUser?.id || 1))]);
      setShowReviewForm(false);
      setReviewContent('');
      setSelectedVibes([]);
      setSpoilerWarning(null);
      setHasSpoilersManual(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <Loading />;
  if (!movie) return <div className="text-center py-20">Movie not found</div>;

  const backdropUrl = movie.backdrop_path ? 'https://image.tmdb.org/t/p/original' + movie.backdrop_path : null;
  const posterUrl = movie.poster_path
    ? 'https://image.tmdb.org/t/p/w500' + movie.poster_path
    : 'https://via.placeholder.com/500x750?text=No+Image';
  const runtime = movie.runtime ? Math.floor(movie.runtime / 60) + 'h ' + (movie.runtime % 60) + 'm' : 'N/A';
  const year = movie.release_date?.split('-')[0] || 'TBA';
  const directors = (movie.credits?.crew || []).filter((p) => p.job === 'Director');
  const tmdbScore = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const communityScore =
    communityStats.average_rating > 0
      ? Number(communityStats.average_rating).toFixed(1)
      : movie.vote_average
        ? (movie.vote_average / 2).toFixed(1)
        : '—';

  return (
    <div className="animate-fade-in text-white pb-20">
      <div className="relative -mt-16 min-h-[55vh] flex items-end">
        {backdropUrl && (
          <>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(' + backdropUrl + ')' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/80 to-dark-950/40" />
          </>
        )}
      </div>

      <div className="relative -mt-64 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-[280px_1fr] gap-8 lg:gap-12">
          <div>
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-dark-700 aspect-[2/3]">
              <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
            </div>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={toggleWatchlist}
                className={
                  'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold ' +
                  (inWatchlist ? 'bg-primary-500 text-white' : 'bg-dark-900 border border-dark-700')
                }
              >
                {inWatchlist ? <FiCheck /> : <FiBookmark />}
                {inWatchlist ? 'In watchlist' : 'Add to watchlist'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentUser?.isGuest) return openAuthModal();
                  setShowReviewForm(!showReviewForm);
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary-600 to-rose-600 rounded-xl font-semibold"
              >
                <FiStar className="text-amber-300" /> Log / review
              </button>
            </div>

            {showReviewForm && (
              <div className="mt-4 p-5 bg-dark-900 rounded-2xl border border-dark-700">
                <div className="flex justify-between mb-4">
                  <h3 className="font-bold text-sm">Your rating</h3>
                  <button type="button" onClick={() => setShowReviewForm(false)}>
                    <FiX />
                  </button>
                </div>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star} onClick={() => setUserRating(star)}>
                      <FiStar className={'w-7 h-7 ' + (star <= userRating ? 'text-amber-400 fill-amber-400' : 'text-dark-600')} />
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {VIBE_OPTIONS.map((vibe) => {
                    const active = selectedVibes.includes(vibe);
                    return (
                      <button
                        type="button"
                        key={vibe}
                        onClick={() =>
                          setSelectedVibes(active ? selectedVibes.filter((v) => v !== vibe) : [...selectedVibes, vibe])
                        }
                        className={
                          'text-[10px] px-2 py-0.5 rounded-full border ' +
                          (active ? 'bg-primary-600 border-primary-500' : 'bg-dark-950 border-dark-800')
                        }
                      >
                        {vibe}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  rows={3}
                  value={reviewContent}
                  onChange={(e) => handleReviewContentChange(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-xs mb-2"
                />
                {spoilerWarning && (
                  <div className="bg-red-950/80 border border-red-800 rounded-xl p-2.5 mb-3 flex gap-2 text-xs text-red-300">
                    <FiShield className="shrink-0" /> {spoilerWarning}
                  </div>
                )}
                <label className="flex items-center gap-2 text-xs text-dark-300 mb-4">
                  <input
                    type="checkbox"
                    checked={hasSpoilersManual}
                    onChange={(e) => setHasSpoilersManual(e.target.checked)}
                  />
                  Contains spoilers
                </label>
                <button
                  type="button"
                  disabled={userRating === 0 || submittingReview}
                  onClick={submitReview}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-primary-600 disabled:bg-dark-800"
                >
                  {submittingReview ? 'Posting...' : 'Post review'}
                </button>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl sm:text-5xl font-black mb-2">{movie.title}</h1>
            {movie.tagline && <p className="text-sm italic text-primary-400 mb-4">{movie.tagline}</p>}
            <div className="flex flex-wrap gap-4 text-sm text-dark-400 mb-6">
              <span className="flex items-center gap-1.5">
                <FiCalendar className="text-primary-500" /> {year}
              </span>
              <span className="flex items-center gap-1.5">
                <FiClock className="text-primary-500" /> {runtime}
              </span>
              {directors.map((d) => (
                <Link key={d.id} to={'/person/' + d.id} className="flex items-center gap-1.5 text-white hover:text-primary-400">
                  <FiFilm className="text-primary-500" /> {d.name}
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-dark-900/80 border border-dark-800 p-3.5 rounded-2xl">
                <span className="text-[11px] text-dark-400 uppercase font-bold">Cinephile</span>
                <div className="flex items-center gap-2">
                  <FiStar className="text-amber-400 fill-amber-400" />
                  <span className="text-xl font-black">{communityScore}</span>
                  <span className="text-xs text-dark-500">/ 5</span>
                </div>
              </div>
              <div className="bg-dark-900/80 border border-dark-800 p-3.5 rounded-2xl">
                <span className="text-[11px] text-dark-400 uppercase font-bold">TMDB</span>
                <div className="flex items-center gap-2">
                  <SiThemoviedatabase className="text-sky-400" />
                  <span className="text-xl font-black">{tmdbScore}</span>
                </div>
              </div>
              <div className="bg-dark-900/80 border border-dark-800 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
                <span className="text-[11px] text-dark-400 uppercase font-bold">Reviews</span>
                <div className="flex items-center gap-2">
                  <FiMessageSquare className="text-primary-400" />
                  <span className="text-xl font-black">{communityStats.review_count || communityReviews.length}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres?.map((g) => (
                <span key={g.id} className="px-3 py-1 bg-dark-900 border border-dark-800 rounded-full text-xs">
                  {g.name}
                </span>
              ))}
            </div>

            <div className="mb-8 bg-dark-900/40 p-6 rounded-2xl border border-dark-800">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-2">Overview</h2>
              <p className="text-dark-300 text-sm leading-relaxed">{movie.overview || 'No synopsis available.'}</p>
            </div>

            {movie.credits?.cast?.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-bold mb-4">Cast</h2>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {movie.credits.cast.slice(0, 12).map((person) => (
                    <Link key={person.id} to={'/person/' + person.id} className="flex-shrink-0 w-24 text-center">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-dark-900 mb-2 border border-dark-800">
                        {person.profile_path ? (
                          <img
                            src={'https://image.tmdb.org/t/p/w185' + person.profile_path}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">{person.name.charAt(0)}</div>
                        )}
                      </div>
                      <p className="text-xs font-bold truncate">{person.name}</p>
                      <p className="text-[10px] text-dark-400 truncate">{person.character}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="pt-10 border-t border-dark-800 mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FiMessageSquare className="text-primary-500" /> Reviews
              </h2>
              <p className="text-dark-400 text-xs mt-1">Sorted like a social feed — likes, helpful votes, recency</p>
            </div>
            <div className="flex items-center gap-2 bg-dark-900 border border-dark-800 p-1 rounded-xl text-xs font-semibold">
              <FiFilter className="text-dark-500 ml-2" />
              {['popular', 'recent', 'rating_high'].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setReviewSort(s)}
                  className={'px-3 py-1 rounded-lg ' + (reviewSort === s ? 'bg-primary-600' : 'text-dark-400')}
                >
                  {s === 'popular' ? 'Most liked' : s === 'recent' ? 'Recent' : 'Highest'}
                </button>
              ))}
            </div>
          </div>

          {communityReviews.length === 0 ? (
            <div className="text-center py-12 bg-dark-900/40 rounded-2xl border border-dark-800">
              <p className="text-dark-300 font-semibold text-sm">No reviews yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {communityReviews.map((rev) => (
                <ReviewCard
                  key={rev.id}
                  review={rev}
                  currentUser={currentUser}
                  onLikeToggle={(revId, data) => {
                    setCommunityReviews((prev) =>
                      prev.map((r) => (r.id === revId ? { ...r, likes_count: data.likes_count, isLiked: data.isLiked } : r))
                    );
                  }}
                  onHelpfulToggle={(revId, data) => {
                    setCommunityReviews((prev) =>
                      prev.map((r) =>
                        r.id === revId ? { ...r, helpful_count: data.helpful_count, isHelpful: data.isHelpful } : r
                      )
                    );
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {recommendations.length > 0 && (
          <section className="pt-12 mt-8 border-t border-dark-800">
            <h2 className="text-2xl font-bold mb-6">You might also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.map((rec) => (
                <MovieCard key={rec.id} movie={rec} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default MovieDetail;
