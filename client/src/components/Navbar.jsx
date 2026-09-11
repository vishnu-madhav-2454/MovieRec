import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  FiSearch,
  FiFilm,
  FiCompass,
  FiBookmark,
  FiLogOut,
  FiUser,
  FiLogIn,
  FiSmile,
  FiBell,
  FiMenu,
  FiX,
  FiSend,
  FiMessageCircle
} from 'react-icons/fi';

function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [unreadDms, setUnreadDms] = useState(0);
  const { currentUser, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthed = currentUser && !currentUser.isGuest;

  useEffect(() => {
    if (!isAuthed) return;
    axios
      .get('/api/notifications', { params: { userId: currentUser.id || 1 } })
      .then((res) => setUnread(res.data.unread || 0))
      .catch(() => {});
  }, [isAuthed, currentUser, location.pathname]);

  useEffect(() => {
    if (!isAuthed) return;
    axios
      .get('/api/dm', { params: { userId: currentUser.id || 1 } })
      .then((res) => {
        const convos = res.data.conversations || [];
        // Count conversations that have at least 1 unread message
        const unreadCount = convos.filter(c => c.unread_count > 0).length;
        setUnreadDms(unreadCount);
      })
      .catch(() => {});
  }, [isAuthed, currentUser, location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/search?q=' + encodeURIComponent(searchQuery.trim()));
      setSearchQuery('');
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/');
  };

  const linkClass = (path) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
      location.pathname === path ? 'bg-dark-800 text-white' : 'text-dark-300 hover:text-white hover:bg-dark-900'
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-dark-950/90 backdrop-blur-md border-b border-dark-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to={isAuthed ? '/feed' : '/'} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-rose-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <FiFilm className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Movie<span className="text-primary-500">Rec</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {isAuthed ? (
                <>
                  <Link to="/feed" className={linkClass('/feed')}>
                    <FiCompass className="w-4 h-4" /> Feed
                  </Link>
                  <Link to="/memes" className={linkClass('/memes')}>
                    <FiSmile className="w-4 h-4 text-amber-400" /> Memes
                  </Link>
                  <Link to="/search" className={linkClass('/search')}>
                    <FiSearch className="w-4 h-4" /> Search
                  </Link>
                </>
              ) : (
                <Link to="/" className={linkClass('/')}>
                  Discover
                </Link>
              )}
            </div>
          </div>

          <div className="flex-1 max-w-xs mx-4 hidden sm:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies, directors, actors..."
                className="w-full bg-dark-900/90 border border-dark-800 rounded-full py-1.5 pl-9 pr-4 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
              />
              <FiSearch className="absolute left-3 top-2 text-dark-400 w-3.5 h-3.5" />
            </form>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/notifications"
              className="p-2 text-dark-300 hover:text-white hover:bg-dark-900 rounded-xl transition-colors relative"
              title="Notifications"
            >
              <FiBell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-primary-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </Link>

            {isAuthed && (
              <Link
                to="/messages"
                className="p-2 text-dark-300 hover:text-white hover:bg-dark-900 rounded-xl transition-colors relative"
                title="Messages"
              >
                <FiMessageCircle className="w-5 h-5" />
                {unreadDms > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-primary-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadDms}
                  </span>
                )}
              </Link>
            )}

            {isAuthed ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 p-1 rounded-full hover:ring-2 hover:ring-primary-500/50"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                    {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-xs font-semibold text-dark-200">
                    {currentUser.displayName || 'MovieBuff'}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-dark-800">
                      <p className="font-semibold text-white truncate">{currentUser.displayName}</p>
                      <p className="text-dark-400 truncate text-[11px]">{currentUser.email}</p>
                    </div>
                    <Link
                      to={'/profile/' + (currentUser.id || 1)}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-dark-300 hover:text-white hover:bg-dark-800"
                    >
                      <FiUser className="w-4 h-4 text-primary-400" /> Profile & diary
                    </Link>
                    <Link
                      to={'/watchlist/' + (currentUser.id || 1)}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-dark-300 hover:text-white hover:bg-dark-800"
                    >
                      <FiBookmark className="w-4 h-4 text-amber-400" /> Watchlist
                    </Link>
                    <Link
                      to="/memes"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-dark-300 hover:text-white hover:bg-dark-800"
                    >
                      <FiSend className="w-4 h-4 text-rose-400" /> Memes & DMs
                    </Link>
                    <div className="border-t border-dark-800 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-400 hover:bg-dark-800"
                      >
                        <FiLogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-full"
              >
                <FiLogIn className="w-3.5 h-3.5" /> Sign In
              </button>
            )}

            <button
              type="button"
              className="md:hidden p-2 text-dark-300"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <form onSubmit={handleSearch} className="sm:hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies..."
                className="w-full bg-dark-900 border border-dark-800 rounded-xl py-2 px-3 text-sm"
              />
            </form>
            {isAuthed ? (
              <>
                <Link to="/feed" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg bg-dark-900">
                  Feed
                </Link>
                <Link to="/memes" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg bg-dark-900">
                  Memes
                </Link>
                <Link to="/search" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg bg-dark-900">
                  Search
                </Link>
              </>
            ) : (
              <Link to="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg bg-dark-900">
                Discover
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

