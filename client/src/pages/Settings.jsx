import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiUser, FiMail, FiLock, FiTrash2, FiSave } from 'react-icons/fi';
import axios from 'axios';

function Settings() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [username, setUsername] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/users/' + currentUser.id, {
        username,
        bio,
        email
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete('/api/users/' + currentUser.id);
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto py-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Settings Form */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Section */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiUser className="text-primary-500" />
              Profile Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500 resize-none"
                  placeholder="Tell us about yourself and your favorite movies..."
                />
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="pt-6 border-t border-dark-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiMail className="text-primary-500" />
              Account
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
                  placeholder="your@email.com"
                  disabled
                />
                <p className="text-xs text-dark-500 mt-1">Email cannot be changed</p>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="pt-6 border-t border-dark-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiLock className="text-primary-500" />
              Privacy
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-950 rounded-xl">
                <div>
                  <p className="font-semibold text-white">Private Profile</p>
                  <p className="text-sm text-dark-400">Only followers can see your reviews</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-dark-950 rounded-xl">
                <div>
                  <p className="font-semibold text-white">Show Activity</p>
                  <p className="text-sm text-dark-400">Let followers see what you're watching</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-primary-600 hover:bg-primary-500 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <FiSave className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Danger Zone */}
        <div className="pt-6 border-t border-dark-800">
          <h2 className="text-xl font-bold mb-4 text-rose-500 flex items-center gap-2">
            <FiTrash2 />
            Danger Zone
          </h2>
          <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-4">
            <p className="text-sm text-dark-300 mb-3">
              Once you delete your account, all your data will be permanently removed. This action cannot be undone.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-rose-900/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 rounded-lg font-semibold text-sm transition-all"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
