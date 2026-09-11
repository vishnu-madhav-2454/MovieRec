import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import {
  FiTrendingUp,
  FiStar,
  FiFilm,
  FiSmile,
  FiArrowRight,
  FiShield
} from 'react-icons/fi';

function Home() {
  const { openAuthModal } = useAuth();
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovies() {
      try {
        const [trendingRes, popularRes, reviewsRes] = await Promise.all([
          axios.get('/api/movies/trending'),
          axios.get('/api/movies/popular'),
          axios.get('/api/reviews?limit=3').catch(() => ({ data: [] }))
        ]);
        setTrending(trendingRes.data.results || []);
        setPopular(popularRes.data.results || []);
        setFeaturedReviews(reviewsRes.data || []);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in pb-20">
      <section className="relative -mt-16 min-h-[85vh] flex items-center justify-center overflow-hidden">
        {trending[0]?.backdrop_path && (
          <img
            src={`https://image.tmdb.org/t/p/original${trending[0].backdrop_path}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f1eb]/20 via-[#f5f1eb]/75 to-[#f5f1eb] z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(#e9674f_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto pt-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dark-900 border border-primary-200 text-primary-700 text-xs font-bold uppercase tracking-wider mb-6">
            The social home for film people
          </div>
          <h1 className="text-5xl sm:text-7xl font-black mb-6 tracking-tight text-dark-100">
            Watch deeply.
            <br />
            <span className="text-primary-500">
              Talk freely.
            </span>
          </h1>
          <p className="text-lg text-dark-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            A cinephile home for diaries, Twitter-style discourse, Instagram-style movie memes, and reviews you can like, comment, and share.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              type="button"
              onClick={openAuthModal}
              className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-2xl shadow-xl flex items-center gap-2"
            >
              Join the community <FiArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-500">
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Trending This Week</h2>
              <p className="text-xs text-dark-400">What everyone is watching and logging</p>
            </div>
          </div>
          <button onClick={openAuthModal} className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1">
            See All <FiArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {trending.slice(0, 12).map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>

      {featuredReviews.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-dark-900 via-dark-900/90 to-primary-950/20 border border-dark-800 rounded-3xl p-6 sm:p-10">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl font-bold mb-2">Community hot takes</h2>
              <p className="text-sm text-dark-400">Ratings, deep dives, and discussion — spoilers stay shielded</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredReviews.map((rev) => (
                <div key={rev.id} className="bg-dark-950/80 border border-dark-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm truncate">{rev.movie_title}</span>
                    {rev.rating && (
                      <div className="flex items-center gap-1 bg-dark-900 px-2 py-0.5 rounded-lg border border-dark-800">
                        <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-amber-300">{rev.rating}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-dark-300 text-xs leading-relaxed mb-4 line-clamp-3">{rev.content}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-dark-800/60 text-xs text-dark-400">
                    <span className="font-semibold text-primary-400">@{rev.username}</span>
                    {rev.vibes && rev.vibes.length > 0 && (
                      <div className="flex gap-1">
                        {rev.vibes.slice(0, 2).map((v) => (
                          <span key={v} className="text-[10px] bg-dark-900 px-2 py-0.5 rounded-full border border-dark-800">
                            #{v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <FiStar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Popular cinema</h2>
            <p className="text-xs text-dark-400">Classics and modern blockbusters</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {popular.slice(0, 12).map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-dark-900/60 p-6 rounded-2xl border border-dark-800">
            <div className="w-12 h-12 bg-primary-600/10 border border-primary-500/20 rounded-xl flex items-center justify-center mb-4 text-primary-500">
              <FiFilm className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Diary, lists, watchlist</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              Log films, write reviews, follow people, and keep a Letterboxd-style profile.
            </p>
          </div>
          <div className="bg-dark-900/60 p-6 rounded-2xl border border-dark-800">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mb-4 text-amber-400">
              <FiSmile className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Memes & DMs</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              Share movie memes you can like, comment, share, and send to people you follow.
            </p>
          </div>
          <div className="bg-dark-900/60 p-6 rounded-2xl border border-dark-800">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-4 text-emerald-400">
              <FiShield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Spoiler shield</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              Reviews can be flagged and blurred so plot twists stay unspoiled until you choose to look.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
