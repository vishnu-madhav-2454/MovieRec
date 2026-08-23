import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiX, FiMail, FiLock, FiUser, FiFilm, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

function AuthModal() {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    loginWithGoogle, 
    loginWithEmail, 
    signupWithEmail, 
    loginAsDemoUser,
    isFirebaseConfigured 
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (!isFirebaseConfigured) {
        // Instant graceful demo login
        loginAsDemoUser('Google Cinephile');
        setAuthModalOpen(false);
        return;
      }
      await loginWithGoogle();
      setAuthModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!isFirebaseConfigured) {
        loginAsDemoUser(name || email.split('@')[0] || 'MovieBuff');
        setAuthModalOpen(false);
        return;
      }

      if (isSignUp) {
        await signupWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      setAuthModalOpen(false);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-dark-900 border border-dark-700 rounded-2xl p-6 md:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-5 right-5 p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500/10 rounded-xl mb-3 border border-primary-500/20">
            <FiFilm className="w-6 h-6 text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isSignUp ? 'Join the Cinephile Community' : 'Welcome Back'}
          </h2>
          <p className="text-dark-400 text-sm mt-1">
            Rate films, share hot takes, and follow directors & critics.
          </p>
        </div>

        {/* Firebase Notice */}
        {!isFirebaseConfigured && (
          <div className="mb-5 p-3.5 bg-primary-950/40 border border-primary-800/40 rounded-xl text-xs text-primary-200 flex items-start gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-primary-300">Demo Auth Mode Active:</span> You can sign in instantly with Google or Guest mode, or connect your Firebase credentials in <code className="bg-dark-950 px-1 py-0.5 rounded text-white">client/.env</code>.
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
            <div className="flex items-center gap-2 font-semibold text-red-400 mb-1">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Authentication Notice</span>
            </div>
            <p className="leading-relaxed">
              {error.includes('auth/configuration-not-found') ? (
                <>
                  Firebase Authentication is not activated in your Firebase Console yet.
                  <br />
                  <strong className="text-white">Quick Fix:</strong> In Firebase Console → <strong>Build &gt; Authentication</strong> → click <strong>Get Started</strong> and enable <strong>Google</strong> &amp; <strong>Email/Password</strong>.
                  <br />
                  <button
                    type="button"
                    onClick={() => {
                      loginAsDemoUser(name || 'Google Cinephile');
                      setAuthModalOpen(false);
                    }}
                    className="mt-2 inline-block px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold"
                  >
                    Click to Continue in Demo Mode for now
                  </button>
                </>
              ) : (
                error
              )}
            </p>
          </div>
        )}

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-all shadow-md active:scale-[0.99] disabled:opacity-60 mb-4"
        >
          <FcGoogle className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-dark-800" />
          <span className="px-3 text-xs uppercase tracking-wider text-dark-500 font-medium">or with email</span>
          <div className="flex-1 border-t border-dark-800" />
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Username / Name</label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. CinemaBuff99"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Email address</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 active:scale-[0.99] text-white font-semibold rounded-xl transition-colors disabled:opacity-60 shadow-lg shadow-primary-500/20"
          >
            {submitting ? 'Please wait...' : (isSignUp ? 'Create Cinephile Account' : 'Sign In')}
          </button>
        </form>

        {/* Toggle Login / Sign Up */}
        <div className="mt-5 text-center text-xs text-dark-400">
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="text-primary-400 hover:text-primary-300 font-semibold"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="text-primary-400 hover:text-primary-300 font-semibold"
              >
                Sign Up for Free
              </button>
            </span>
          )}
        </div>

        {/* Quick Demo Login Option */}
        <div className="mt-4 pt-4 border-t border-dark-800 text-center">
          <button
            type="button"
            onClick={() => {
              loginAsDemoUser('Guest Critic');
              setAuthModalOpen(false);
            }}
            className="text-xs text-dark-400 hover:text-dark-200 underline"
          >
            Or continue immediately as Guest Critic
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
