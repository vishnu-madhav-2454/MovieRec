import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiFilm, FiMessageCircle, FiUser, FiPlusSquare, FiSearch, FiChevronLeft, FiChevronRight, FiLogOut } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import axios from 'axios';
import MemeUpload from './MemeUpload';

export default function BottomNav({ sidebarOpen, onSidebarChange }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [unreadDms, setUnreadDms] = useState(0);
  const isAuthed = currentUser && !currentUser.isGuest;

  useEffect(() => {
    if (!isAuthed) return;
    axios
      .get('/api/dm', { params: { userId: currentUser.id || 1 } })
      .then((res) => {
        const convos = res.data.conversations || [];
        setUnreadDms(convos.filter(c => c.unread_count > 0).length);
      })
      .catch(() => {});
  }, [isAuthed, currentUser, location.pathname]);

  const navItems = [
    { to: '/feed', icon: FiHome, label: 'Home', activeOn: ['/feed', '/'] },
    { to: '/search', icon: FiSearch, label: 'Search', activeOn: ['/search'] },
    { to: null, icon: FiPlusSquare, label: 'Create', action: () => setUploadOpen(true) },
    { to: '/memes', icon: FiFilm, label: 'Memes', activeOn: ['/memes'] },
    { to: '/messages', icon: FiMessageCircle, label: 'Messages', activeOn: ['/messages'], badge: unreadDms },
    { to: `/profile/${currentUser?.id || 1}`, icon: FiUser, label: 'Profile', activeOn: ['/profile'] },
  ];

  const toggleSidebar = () => {
    onSidebarChange(!sidebarOpen);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-dark-800 md:hidden">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-1">
          {navItems.map((item) => {
            const isActive = item.activeOn?.some(p => location.pathname === p || location.pathname.startsWith(p));
            
            if (item.action) {
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="flex flex-col items-center justify-center w-full h-full text-dark-300 hover:text-white transition-colors"
                >
                  <item.icon className="w-6 h-6" />
                </button>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors relative ${
                  isActive ? 'text-white' : 'text-dark-400 hover:text-white'
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'fill-white' : ''}`} />
                {item.badge > 0 && (
                  <span className="absolute top-1 right-4 min-w-[16px] h-4 px-1 bg-primary-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <nav className={`fixed left-0 top-0 bottom-0 z-50 bg-black border-r border-dark-800 hidden md:flex flex-col transition-[width] duration-200 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className={`flex flex-col h-full p-3 ${sidebarOpen ? 'px-4' : 'px-3'}`}>
          {/* Logo */}
          <div className={`py-6 mb-4 ${sidebarOpen ? '' : 'flex justify-center'}`}>
            <NavLink to="/feed" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-rose-500 flex items-center justify-center shrink-0">
                <FiFilm className="w-4 h-4 text-white" />
              </div>
              {sidebarOpen && <span className="text-xl font-black tracking-tight">
                Movie<span className="text-primary-500">Rec</span>
              </span>}
            </NavLink>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-dark-800 border border-dark-700 text-dark-300 hover:text-white hover:bg-dark-700 flex items-center justify-center shadow-lg"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <FiChevronLeft className="w-3.5 h-3.5" /> : <FiChevronRight className="w-3.5 h-3.5" />}
          </button>

          {/* Nav Items */}
          <div className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = item.activeOn?.some(p => location.pathname === p || location.pathname.startsWith(p));
              
              if (item.action) {
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    title={!sidebarOpen ? item.label : undefined}
                    className="w-full flex items-center gap-4 px-3 py-3 rounded-lg text-dark-300 hover:text-white hover:bg-dark-900 transition-all group"
                  >
                    <item.icon className="w-6 h-6 shrink-0" />
                    {sidebarOpen && <span className="text-base font-medium">{item.label}</span>}
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all relative group ${
                    isActive ? 'text-white bg-dark-900' : 'text-dark-300 hover:text-white hover:bg-dark-900'
                  }`}
                >
                  <item.icon className={`w-6 h-6 shrink-0 ${isActive ? 'fill-white' : ''}`} />
                  {sidebarOpen && <span className="text-base font-medium">{item.label}</span>}
                  {item.badge > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-primary-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          <div className={`border-t border-dark-800 pt-4 mt-4 ${sidebarOpen ? '' : 'flex justify-center'}`}>
            <NavLink
              to={`/profile/${currentUser?.id || 1}`}
              title={!sidebarOpen ? currentUser?.displayName || 'Profile' : undefined}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-dark-900 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-primary-100 border border-primary-200 text-primary-700 flex items-center justify-center font-extrabold text-xs shrink-0">
                {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{currentUser?.displayName || 'Cinephile'}</p>
                  <p className="text-[11px] text-dark-500 truncate">View profile</p>
                </div>
              )}
            </NavLink>
          </div>
        </div>
      </nav>

      <MemeUpload
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        currentUser={currentUser}
        onUploaded={() => {}}
      />
    </>
  );
}

