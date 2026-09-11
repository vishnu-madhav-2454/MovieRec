import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiCalendar, FiFilm, FiStar, FiClock, FiGrid, FiList } from 'react-icons/fi';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Diary() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [filterYear, setFilterYear] = useState('all');
  const [stats, setStats] = useState({ watched: 0, hours: 0, avgRating: 0 });

  useEffect(() => {
    loadDiary();
  }, [id]);

  const loadDiary = async () => {
    try {
      // Diary entries are watched films; reviews are optional details on an entry.
      const res = await axios.get(`/api/users/${id}/watched`);
      const entries = res.data || [];
      setDiaryEntries(entries);

      // Calculate stats
      const watched = entries.length;
      const hours = entries.reduce((acc, e) => acc + (e.runtime || 120) / 60, 0);
      const avgRating = entries.length > 0 
        ? entries.reduce((acc, e) => acc + (e.rating || 0), 0) / entries.length 
        : 0;

      setStats({ watched, hours: Math.round(hours), avgRating: avgRating.toFixed(1) });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Group entries by date
  const groupedEntries = diaryEntries.reduce((groups, entry) => {
    const date = new Date(entry.watched_at || entry.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
    return groups;
  }, {});

  const years = [...new Set(diaryEntries.map(e => new Date(e.watched_at || e.created_at).getFullYear()))];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black md:ml-16 lg:ml-64 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link to={`/profile/${id}`} className="text-dark-400 hover:text-white text-sm flex items-center gap-1 mb-2">
            ← Back to profile
          </Link>
          <h1 className="text-2xl font-bold">Film Diary</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 text-center">
            <FiFilm className="w-5 h-5 mx-auto text-primary-500 mb-2" />
            <p className="text-2xl font-bold">{stats.watched}</p>
            <p className="text-dark-400 text-xs">Films</p>
          </div>
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 text-center">
            <FiClock className="w-5 h-5 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold">{stats.hours}</p>
            <p className="text-dark-400 text-xs">Hours</p>
          </div>
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 text-center">
            <FiStar className="w-5 h-5 mx-auto text-rose-500 mb-2" />
            <p className="text-2xl font-bold">{stats.avgRating}</p>
            <p className="text-dark-400 text-xs">Avg Rating</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-dark-900 border border-dark-800 rounded-lg px-3 py-1.5 text-sm text-white"
            >
              <option value="all">All Years</option>
              {years.sort((a, b) => b - a).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 bg-dark-900 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-dark-800 text-white' : 'text-dark-400'}`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-dark-800 text-white' : 'text-dark-400'}`}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Diary Entries */}
        {Object.keys(groupedEntries).length === 0 ? (
          <div className="text-center py-16">
            <FiCalendar className="w-12 h-12 mx-auto text-dark-600 mb-3" />
            <p className="text-dark-400">No films logged yet</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {diaryEntries.map((entry) => (
              <Link
                key={entry.id}
                to={`/movie/${entry.movie_id}`}
                className="relative aspect-[2/3] group"
              >
                {entry.movie_poster ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${entry.movie_poster}`}
                    alt={entry.movie_title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-dark-800 rounded-lg flex items-center justify-center">
                    <FiFilm className="w-6 h-6 text-dark-600" />
                  </div>
                )}
                {entry.rating && (
                  <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-0.5">
                    <FiStar className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {entry.rating}
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEntries)
              .sort(([a], [b]) => b.localeCompare(a))
              .filter(([key]) => filterYear === 'all' || key.startsWith(filterYear))
              .map(([month, entries]) => {
                const [year, monthNum] = month.split('-');
                return (
                  <div key={month}>
                    <h3 className="text-sm font-bold text-dark-400 mb-3 flex items-center gap-2">
                      <FiCalendar className="w-4 h-4" />
                      {MONTHS[parseInt(monthNum) - 1]} {year}
                    </h3>
                    <div className="space-y-2">
                      {entries.map((entry) => (
                        <Link
                          key={entry.id}
                          to={`/movie/${entry.movie_id}`}
                          className="flex items-center gap-3 bg-dark-900 border border-dark-800 rounded-xl p-3 hover:bg-dark-800 transition-colors"
                        >
                          <div className="w-12 h-18 rounded-lg overflow-hidden bg-dark-800 shrink-0">
                            {entry.movie_poster ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w92${entry.movie_poster}`}
                                alt={entry.movie_title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FiFilm className="w-4 h-4 text-dark-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{entry.movie_title}</p>
                            <p className="text-dark-400 text-xs">
                              {new Date(entry.watched_at || entry.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {entry.rating && (
                            <div className="flex items-center gap-1 bg-dark-800 px-2 py-1 rounded-lg">
                              <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span className="text-sm font-bold">{entry.rating}</span>
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
