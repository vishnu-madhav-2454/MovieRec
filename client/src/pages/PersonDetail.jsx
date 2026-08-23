import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Loading from '../components/Loading';
import MovieCard from '../components/MovieCard';
import { useAuth } from '../context/AuthContext';
import { 
  FiUserCheck, 
  FiUserPlus, 
  FiFilm, 
  FiCalendar, 
  FiMapPin, 
  FiAward, 
  FiStar,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';

function PersonDetail() {
  const { id } = useParams();
  const { currentUser, setAuthModalOpen } = useAuth();
  
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showFullBio, setShowFullBio] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    async function fetchPersonData() {
      try {
        setLoading(true);
        const [personRes, followRes] = await Promise.all([
          axios.get(`/api/people/${id}`),
          axios.get(`/api/social/follow/check`, {
            params: {
              followerId: currentUser?.id || 1,
              followingId: id,
              targetType: 'person'
            }
          }).catch(() => ({ data: { isFollowing: false, followersCount: 142 } }))
        ]);

        setPerson(personRes.data);
        setIsFollowing(followRes.data?.isFollowing || false);
        setFollowersCount(followRes.data?.followersCount || 142);

        // Auto-select best tab based on department
        if (personRes.data?.filmography?.directing?.length > 0) {
          setActiveTab('directing');
        } else if (personRes.data?.filmography?.acting?.length > 0) {
          setActiveTab('acting');
        } else {
          setActiveTab('all');
        }
      } catch (error) {
        console.error('Error fetching person:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPersonData();
    window.scrollTo(0, 0);
  }, [id, currentUser]);

  const handleFollowToggle = async () => {
    try {
      const response = await axios.post('/api/social/follow', {
        followerId: currentUser?.id || 1,
        followingId: id,
        targetType: 'person'
      });
      setIsFollowing(response.data.isFollowing);
      setFollowersCount(prev => response.data.isFollowing ? prev + 1 : Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  if (loading) return <Loading />;
  if (!person) return <div className="text-center py-20 text-white">Cast/Crew member not found</div>;

  const profileImg = person.profile_path
    ? `https://image.tmdb.org/t/p/h632${person.profile_path}`
    : 'https://via.placeholder.com/400x600?text=No+Photo';

  const directingWorks = person.filmography?.directing || [];
  const writingWorks = person.filmography?.writing || [];
  const actingWorks = person.filmography?.acting || [];

  let displayedWorks = [];
  if (activeTab === 'directing') displayedWorks = directingWorks;
  else if (activeTab === 'writing') displayedWorks = writingWorks;
  else if (activeTab === 'acting') displayedWorks = actingWorks;
  else {
    // Unique deduplicated all works
    const map = new Map();
    [...directingWorks, ...writingWorks, ...actingWorks].forEach(m => {
      if (!map.has(m.id)) map.set(m.id, m);
    });
    displayedWorks = Array.from(map.values()).sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
  }

  // Calculate age if birthday is provided
  const age = person.birthday ? Math.floor((new Date() - new Date(person.birthday)) / 31557600000) : null;

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-10 animate-fade-in text-white">
      {/* Header Profile Section */}
      <div className="grid md:grid-cols-[280px_1fr] gap-8 lg:gap-12 mb-12">
        {/* Left Column: Photo & Action Button */}
        <div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-dark-700 bg-dark-900 aspect-[3/4]">
            <img
              src={profileImg}
              alt={person.name}
              className="w-full h-full object-cover"
            />
          </div>

          <button
            onClick={handleFollowToggle}
            className={`w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all shadow-lg ${
              isFollowing
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-dark-800 hover:bg-dark-700 text-white border border-dark-600'
            }`}
          >
            {isFollowing ? (
              <>
                <FiUserCheck className="w-5 h-5" />
                <span>Following</span>
              </>
            ) : (
              <>
                <FiUserPlus className="w-5 h-5" />
                <span>Follow Filmmaker</span>
              </>
            )}
          </button>

          {/* Quick Details Card */}
          <div className="mt-6 p-4 bg-dark-900/60 rounded-xl border border-dark-800 space-y-3 text-xs text-dark-300">
            {person.known_for_department && (
              <div className="flex items-center gap-2">
                <FiFilm className="w-4 h-4 text-primary-400" />
                <span>Known for: <strong className="text-white">{person.known_for_department}</strong></span>
              </div>
            )}
            {person.birthday && (
              <div className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-yellow-400" />
                <span>Born: <strong className="text-white">{person.birthday} {age ? `(Age ${age})` : ''}</strong></span>
              </div>
            )}
            {person.place_of_birth && (
              <div className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-red-400" />
                <span className="truncate">Origin: <strong className="text-white">{person.place_of_birth}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <FiAward className="w-4 h-4 text-emerald-400" />
              <span>Total Credits: <strong className="text-white">{person.filmography?.total_works || displayedWorks.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Bio & Overview */}
        <div className="flex flex-col justify-start">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{person.name}</h1>
            <span className="px-3 py-1 bg-primary-500/20 border border-primary-500/30 text-primary-300 text-xs font-semibold rounded-full">
              {person.known_for_department || 'Cast & Crew'}
            </span>
          </div>

          <p className="text-dark-400 text-sm mb-6">
            {followersCount} Cinephiles following this creator
          </p>

          {/* Biography */}
          <div className="bg-dark-900/40 p-6 rounded-2xl border border-dark-800 mb-8">
            <h3 className="text-lg font-semibold mb-3 text-dark-100 flex items-center gap-2">
              <span>Biography & Background</span>
            </h3>
            <p className={`text-dark-300 text-sm md:text-base leading-relaxed ${!showFullBio ? 'line-clamp-4' : ''}`}>
              {person.biography || 'No biography available for this person.'}
            </p>
            {person.biography && person.biography.length > 250 && (
              <button
                onClick={() => setShowFullBio(!showFullBio)}
                className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors"
              >
                <span>{showFullBio ? 'Show less' : 'Read full biography'}</span>
                {showFullBio ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            )}
          </div>

          {/* Highlights / Known Works */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-dark-200">
              Notable Highlights
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {displayedWorks.slice(0, 4).map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filmography Tabs */}
      <section className="pt-8 border-t border-dark-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">Filmography & Works</h2>
            <p className="text-dark-400 text-sm">Explore all films, writing credits, and acting performances</p>
          </div>

          {/* Tab Filter Buttons */}
          <div className="flex bg-dark-900 p-1 rounded-xl border border-dark-800">
            {directingWorks.length > 0 && (
              <button
                onClick={() => setActiveTab('directing')}
                className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'directing' ? 'bg-primary-500 text-white shadow-md' : 'text-dark-400 hover:text-white'
                }`}
              >
                Directing ({directingWorks.length})
              </button>
            )}
            {writingWorks.length > 0 && (
              <button
                onClick={() => setActiveTab('writing')}
                className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'writing' ? 'bg-primary-500 text-white shadow-md' : 'text-dark-400 hover:text-white'
                }`}
              >
                Writing ({writingWorks.length})
              </button>
            )}
            {actingWorks.length > 0 && (
              <button
                onClick={() => setActiveTab('acting')}
                className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'acting' ? 'bg-primary-500 text-white shadow-md' : 'text-dark-400 hover:text-white'
                }`}
              >
                Acting ({actingWorks.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'all' ? 'bg-primary-500 text-white shadow-md' : 'text-dark-400 hover:text-white'
              }`}
            >
              All Credits ({displayedWorks.length})
            </button>
          </div>
        </div>

        {/* Filmography Grid */}
        {displayedWorks.length === 0 ? (
          <div className="text-center py-16 bg-dark-900/40 rounded-xl border border-dark-800">
            <p className="text-dark-400">No films found under this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {displayedWorks.map(movie => (
              <div key={movie.id} className="relative flex flex-col">
                <MovieCard movie={movie} />
                {(movie.character || movie.job) && (
                  <p className="text-xs text-dark-400 mt-1 px-1 truncate">
                    as <span className="text-primary-300 font-medium">{movie.character || movie.job}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default PersonDetail;
