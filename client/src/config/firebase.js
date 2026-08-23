import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBYeAkz0_CY5ePs_2-RYgq14O41vWlb6CE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "movierec-7aa5a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "movierec-7aa5a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "movierec-7aa5a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1095392491925",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1095392491925:web:2d3cd5bfb3fd996cf7de9c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SDRJ3Y5NJ8"
};

const isConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your_api_key_here' && 
  firebaseConfig.authDomain
);

let app;
let auth = null;
let storage = null;
let googleProvider = null;

if (isConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.warn("Firebase initialization error:", error.message);
  }
}

export { 
  auth,
  storage,
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile,
  ref,
  uploadBytes,
  getDownloadURL,
  isConfigured as isFirebaseConfigured
};
