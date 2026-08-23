import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiSend, FiCheck } from 'react-icons/fi';

export default function DmDrawer({ isOpen, onClose, currentUser, memeToSend, reviewToSend, onSent }) {
  const [followingUsers, setFollowingUsers] = useState([
    { id: 2, username: 'CinemaLover', bio: 'Cinephile & film critic' },
    { id: 3, username: 'FilmCritic99', bio: 'Director & screenplay nerd' },
    { id: 4, username: 'NolanFan', bio: '70mm evangelist' }
  ]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    axios
      .get(`/api/social/following/${currentUser?.id || 1}`)
      .then((res) => {
        const people = (res.data || []).filter((u) => u.target_type !== 'person');
        if (people.length) {
          setFollowingUsers(people);
        } else {
          axios.get('/api/users').then((uRes) => {
            const list = Array.isArray(uRes.data) ? uRes.data : (uRes.data?.results || []);
            const others = list.filter((u) => u.id !== (currentUser?.id || 1));
            if (others.length) setFollowingUsers(others);
          }).catch(() => {});
        }
      })
      .catch(() => {
        axios.get('/api/users').then((uRes) => {
          const list = Array.isArray(uRes.data) ? uRes.data : (uRes.data?.results || []);
          const others = list.filter((u) => u.id !== (currentUser?.id || 1));
          if (others.length) setFollowingUsers(others);
        }).catch(() => {});
      });
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (memeToSend) {
      setMessageText('Check out this movie meme!');
    } else if (reviewToSend) {
      setMessageText(`Check out this review of ${reviewToSend.movie_title || 'this movie'}!`);
    }
  }, [memeToSend, reviewToSend]);

  if (!isOpen) return null;

  const image = memeToSend?.image_url || memeToSend?.image_url;
  const caption = memeToSend?.caption || memeToSend?.caption;

  const handleSend = async () => {
    if (!selectedUser) return;
    setSending(true);
    try {
      await axios.post('/api/dm/send', {
        sender_id: currentUser?.id || 1,
        sender_name: currentUser?.displayName || currentUser?.username || 'MovieBuff',
        receiver_id: selectedUser.id,
        content: messageText,
        meme_id: memeToSend?.id || null,
        review_id: reviewToSend?.id ? (reviewToSend.id >= 100000 ? reviewToSend.id - 100000 : reviewToSend.id) : null
      });
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        if (onSent) onSent();
        onClose();
      }, 1000);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-dark-900 border-l border-dark-800 h-full flex flex-col p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-dark-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FiSend className="w-5 h-5 text-primary-500" /> Send via DM
            </h3>
            <p className="text-xs text-dark-400 mt-0.5">Share with people in the community</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {memeToSend && (
          <div className="mt-4 p-3 bg-dark-950/80 rounded-xl border border-dark-800 flex gap-3 items-center">
            {image && <img src={image} alt="Meme" className="w-14 h-14 rounded-lg object-cover border border-dark-700" />}
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-primary-400 uppercase tracking-wider block">
                {memeToSend.movie_title || 'Movie meme'}
              </span>
              <p className="text-xs text-dark-300 truncate">{caption}</p>
            </div>
          </div>
        )}

        {reviewToSend && (
          <div className="mt-4 p-3 bg-dark-950/80 rounded-xl border border-dark-800 flex gap-3 items-center">
            {reviewToSend.movie_poster && (
              <img 
                src={`https://image.tmdb.org/t/p/w200${reviewToSend.movie_poster}`} 
                alt="Poster" 
                className="w-12 h-16 rounded-lg object-cover border border-dark-700 shrink-0" 
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-white truncate">{reviewToSend.movie_title}</span>
                {reviewToSend.rating && (
                  <span className="text-[11px] font-bold text-amber-400">★ {reviewToSend.rating}</span>
                )}
              </div>
              <p className="text-[11px] text-dark-400">Review by @{reviewToSend.username}</p>
              <p className="text-xs text-dark-300 truncate mt-0.5">{reviewToSend.content}</p>
            </div>
          </div>
        )}

        <div className="mt-5 flex-1 overflow-y-auto">
          <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider block mb-2">Recipient</label>
          <div className="space-y-2">
            {followingUsers.map((u) => {
              const selected = selectedUser?.id === u.id;
              return (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selected ? 'border-primary-500 bg-primary-950/40' : 'border-dark-800 bg-dark-950 hover:border-dark-700'
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                      {(u.username || 'U').charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{u.username}</h4>
                      <p className="text-[11px] text-dark-400">{u.bio}</p>
                    </div>
                  </div>
                  {selected && (
                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center text-white">
                      <FiCheck className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-dark-800 space-y-3">
          <textarea
            rows={2}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Add a message..."
            className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 resize-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!selectedUser || sending}
            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50"
          >
            {sentSuccess ? (
              <>
                <FiCheck className="w-5 h-5" /> Sent
              </>
            ) : (
              <>
                <FiSend className="w-4 h-4" /> {sending ? 'Sending...' : 'Send'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
