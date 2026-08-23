import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Watchlist from './pages/Watchlist';
import PersonDetail from './pages/PersonDetail';
import Feed from './pages/Feed';
import Memes from './pages/Memes';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Lists from './pages/Lists';
import Diary from './pages/Diary';
import Settings from './pages/Settings';

function AppContent() {
  const { currentUser } = useAuth();
  const isAuthenticated = currentUser && !currentUser.isGuest;
  const location = useLocation();

  // Pages that show bottom nav — exclude /memes (full-screen Reels view)
  const showBottomNav = isAuthenticated && location.pathname !== '/memes' && ['/', '/feed', '/messages', '/profile', '/search'].some(p => 
    location.pathname === p || location.pathname.startsWith('/profile/') || location.pathname.startsWith('/messages')
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary-500 selection:text-white">
      {/* Show navbar only for guests, authenticated users get bottom nav */}
      {!isAuthenticated && <Navbar />}
      <AuthModal />
      <main className={!isAuthenticated ? 'pt-16' : ''}>
        <Routes>
          {/* Public route - Only discover/home before login */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/feed" replace /> : <Home />} />
          
          {/* Protected routes - Redirect to home if not authenticated */}
          <Route path="/feed" element={isAuthenticated ? <Feed /> : <Navigate to="/" replace />} />
          <Route path="/memes" element={isAuthenticated ? <Memes /> : <Navigate to="/" replace />} />
          <Route path="/messages" element={isAuthenticated ? <Messages /> : <Navigate to="/" replace />} />
          <Route path="/messages/:userId" element={isAuthenticated ? <Messages /> : <Navigate to="/" replace />} />
          <Route path="/notifications" element={isAuthenticated ? <Notifications /> : <Navigate to="/" replace />} />
          <Route path="/profile/:id" element={isAuthenticated ? <Profile /> : <Navigate to="/" replace />} />
          <Route path="/profile/:id/diary" element={isAuthenticated ? <Diary /> : <Navigate to="/" replace />} />
          <Route path="/profile/:id/lists" element={isAuthenticated ? <Lists /> : <Navigate to="/" replace />} />
          <Route path="/lists/:listId" element={isAuthenticated ? <Lists /> : <Navigate to="/" replace />} />
          <Route path="/watchlist/:userId" element={isAuthenticated ? <Watchlist /> : <Navigate to="/" replace />} />
          <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/" replace />} />
          
          {/* Movie and search routes - accessible to all but encourage login */}
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/person/:id" element={<PersonDetail />} />
          <Route path="/search" element={isAuthenticated ? <Search /> : <Navigate to="/" replace />} />
        </Routes>
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
