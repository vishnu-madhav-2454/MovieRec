import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  isFirebaseConfigured
} from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Sync Firebase user with backend database
 */
async function syncUserWithDatabase(firebaseUser) {
  try {
    // Call backend to create/update user in PostgreSQL
    const response = await axios.post('/api/users/sync', {
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email,
      username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Cinephile',
      avatar_url: firebaseUser.photoURL,
      bio: 'Film enthusiast'
    });

    return response.data;
  } catch (error) {
    console.error('Failed to sync user with database:', error);
    // Return a temporary user object if sync fails
    return {
      id: null,
      firebase_uid: firebaseUser.uid,
      username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Cinephile',
      email: firebaseUser.email,
      avatar_url: firebaseUser.photoURL,
      bio: 'Film enthusiast'
    };
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('movierec_user');
    return saved ? JSON.parse(saved) : {
      id: null,
      uid: 'guest',
      displayName: 'Guest',
      email: null,
      photoURL: null,
      bio: 'Film enthusiast',
      isGuest: true
    };
  });
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync with database and get PostgreSQL user ID
        const dbUser = await syncUserWithDatabase(firebaseUser);
        
        const userObj = {
          id: dbUser.id, // Real database ID!
          uid: firebaseUser.uid,
          displayName: dbUser.username || firebaseUser.displayName || 'Cinephile',
          email: firebaseUser.email,
          photoURL: dbUser.avatar_url || firebaseUser.photoURL,
          bio: dbUser.bio || 'Film enthusiast & critic',
          isGuest: false
        };
        
        setCurrentUser(userObj);
        localStorage.setItem('movierec_user', JSON.stringify(userObj));
      } else {
        // User is logged out
        const guestUser = {
          id: null,
          uid: 'guest',
          displayName: 'Guest',
          email: null,
          photoURL: null,
          bio: 'Film enthusiast',
          isGuest: true
        };
        setCurrentUser(guestUser);
        localStorage.setItem('movierec_user', JSON.stringify(guestUser));
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      throw new Error("Firebase Auth is not configured yet. Please provide your Firebase credentials.");
    }
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
    
      // Sync with database
      const dbUser = await syncUserWithDatabase(firebaseUser);
    
      const userObj = {
        id: dbUser.id,
        uid: firebaseUser.uid,
        displayName: dbUser.username || firebaseUser.displayName || 'Cinephile',
        email: firebaseUser.email,
        photoURL: dbUser.avatar_url || firebaseUser.photoURL,
        bio: dbUser.bio || 'Film lover',
        isGuest: false
      };
    
      setCurrentUser(userObj);
      localStorage.setItem('movierec_user', JSON.stringify(userObj));
      return userObj;
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return null;
      }
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error("Firebase Auth is not configured yet. Please provide your Firebase credentials.");
    }
    
    const result = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = result.user;
    
    // Sync with database
    const dbUser = await syncUserWithDatabase(firebaseUser);
    
    const userObj = {
      id: dbUser.id,
      uid: firebaseUser.uid,
      displayName: dbUser.username || firebaseUser.displayName || 'Cinephile',
      email: firebaseUser.email,
      photoURL: dbUser.avatar_url || firebaseUser.photoURL,
      bio: dbUser.bio || 'Film lover',
      isGuest: false
    };
    
    setCurrentUser(userObj);
    localStorage.setItem('movierec_user', JSON.stringify(userObj));
    return userObj;
  };

  const signupWithEmail = async (email, password, displayName) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error("Firebase Auth is not configured yet. Please provide your Firebase credentials.");
    }
    
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = result.user;
    
    if (displayName) {
      await updateProfile(firebaseUser, { displayName });
    }
    
    // Sync with database
    const dbUser = await syncUserWithDatabase(firebaseUser);
    
    const userObj = {
      id: dbUser.id,
      uid: firebaseUser.uid,
      displayName: dbUser.username || displayName || firebaseUser.email?.split('@')[0] || 'Cinephile',
      email: firebaseUser.email,
      photoURL: dbUser.avatar_url || firebaseUser.photoURL,
      bio: dbUser.bio || 'Film lover',
      isGuest: false
    };
    
    setCurrentUser(userObj);
    localStorage.setItem('movierec_user', JSON.stringify(userObj));
    return userObj;
  };

  const logout = async () => {
    if (auth && isFirebaseConfigured) {
      await signOut(auth);
    }
    const guestUser = {
      id: null,
      uid: 'guest',
      displayName: 'Guest',
      email: null,
      photoURL: null,
      bio: 'Film enthusiast',
      isGuest: true
    };
    setCurrentUser(guestUser);
    localStorage.setItem('movierec_user', JSON.stringify(guestUser));
  };

  const loginAsDemoUser = async (name = 'MovieBuff') => {
    // Create demo user in database
    try {
      const response = await axios.post('/api/users', {
        username: name,
        email: `${name.toLowerCase().replace(/\s+/g, '')}@demo.movierec.com`,
        avatar_url: null,
        bio: 'Certified cinephile & movie buff (Demo User)'
      });
      
      const dbUser = response.data;
      
      const demoUser = {
        id: dbUser.id,
        uid: 'demo-' + dbUser.id,
        displayName: dbUser.username,
        email: dbUser.email,
        photoURL: dbUser.avatar_url,
        bio: dbUser.bio,
        isGuest: false,
        isDemo: true
      };
      
      setCurrentUser(demoUser);
      localStorage.setItem('movierec_user', JSON.stringify(demoUser));
      setAuthModalOpen(false);
    } catch (error) {
      console.error('Failed to create demo user:', error);
      // Fallback to guest
      alert('Failed to create demo user. Please try again.');
    }
  };

  const openAuthModal = () => setAuthModalOpen(true);
  const requireAuth = () => {
    if (currentUser?.isGuest) {
      setAuthModalOpen(true);
      return false;
    }
    return true;
  };

  const value = {
    currentUser,
    loading,
    isFirebaseConfigured,
    authModalOpen,
    setAuthModalOpen,
    openAuthModal,
    requireAuth,
    isGuest: !!currentUser?.isGuest,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    loginAsDemoUser,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
