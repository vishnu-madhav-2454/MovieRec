import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiFilm, FiMessageCircle, FiUser, FiPlusSquare, FiSearch } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import axios from 'axios';
import MemeUpload from './MemeUpload';

export default function BottomNav() {
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
      <nav className="fixed left-0 top-0 bottom-0 z-50 bg-black border-r border-dark-800 hidden md:flex flex-col w-16 lg:w-64">
        <div className="flex flex-col h-full p-3 lg:px-4">
          {/* Logo */}
          <div className="py-6 mb-4">
            <NavLink to="/feed" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-rose-500 flex items-center justify-center shrink-0">
                <FiFilm className="w-4 h-4 text-white" />
              </div>
              <span className="hidden lg:block text-xl font-black tracking-tight">
                Movie<span className="text-primary-500">Rec</span>
              </span>
            </NavLink>
          </div>

          {/* Nav Items */}
          <div className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = item.activeOn?.some(p => location.pathname === p || location.pathname.startsWith(p));
              
              if (item.action) {
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-4 px-3 py-3 rounded-lg text-dark-300 hover:text-white hover:bg-dark-900 transition-all group"
                  >
                    <item.icon className="w-6 h-6 shrink-0" />
                    <span className="hidden lg:block text-base font-medium">{item.label}</span>
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all relative group ${
                    isActive ? 'text-white bg-dark-900' : 'text-dark-300 hover:text-white hover:bg-dark-900'
                  }`}
                >
                  <item.icon className={`w-6 h-6 shrink-0 ${isActive ? 'fill-white' : ''}`} />
                  <span className="hidden lg:block text-base font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-primary-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
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
