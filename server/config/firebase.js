import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp = null;
let firebaseAuth = null;

const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    firebaseApp = getApp();
    firebaseAuth = getAuth(firebaseApp);
    return firebaseApp;
  }

  try {
    if (!process.env.FIREBASE_PROJECT_ID || 
        !process.env.FIREBASE_CLIENT_EMAIL || 
        !process.env.FIREBASE_PRIVATE_KEY) {
      console.warn('⚠️ Firebase Admin SDK not configured - missing environment variables');
      return null;
    }

    firebaseApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          .replace(/^"|"$/g, '')
          .replace(/\\n/g, '\n'),
      }),
    });

    firebaseAuth = getAuth(firebaseApp);
    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error.message);
    return null;
  }
};

// Initialize on module load
initializeFirebaseAdmin();

// Auth middleware to verify Firebase ID tokens
export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    if (!firebaseAuth) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split('@')[0],
      picture: decodedToken.picture || null,
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

// Optional auth middleware - attaches user if token present, but doesn't require it
export const optionalAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    if (!firebaseAuth) {
      req.user = null;
      return next();
    }

    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split('@')[0],
      picture: decodedToken.picture || null,
    };

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

export const getFirebaseAuth = () => firebaseAuth;
export default firebaseApp;
