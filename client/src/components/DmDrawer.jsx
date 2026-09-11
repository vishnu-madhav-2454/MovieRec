import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { auth } from '../config/firebase';
import { FiX, FiSend, FiCheck, FiUsers, FiFilm } from 'react-icons/fi';

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
    let socket;
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error('Authentication token unavailable');

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      socket = io(apiUrl.replace(/\/api\/?$/, ''), {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      const result = await new Promise((resolve, reject) => {
        socket.on('connect', () => socket.emit('send_message', {
          receiver_id: selectedUser.id,
          content: messageText,
          meme_id: memeToSend?.id || null,
          review_id: reviewToSend?.id ? (reviewToSend.id >= 100000 ? reviewToSend.id - 100000 : reviewToSend.id) : null
        }, resolve));
        socket.on('connect_error', reject);
      });
      if (!result?.ok) throw new Error(result?.error || 'Failed to send message');
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        if (onSent) onSent();
        onClose();
      }, 1000);
    } catch (e) {
      console.error(e);
    } finally {
      socket?.disconnect();
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/25 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-dark-900 border-l border-dark-800 h-full flex flex-col p-5 sm:p-7 shadow-2xl rounded-l-[2rem]">
        <div className="flex items-center justify-between pb-4 border-b border-dark-800">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-600 mb-1">Share the feeling</p>
            <h3 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
              Send to a friend
            </h3>
            <p className="text-xs text-dark-400 mt-1">Pass this moment along to someone in your film circle.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2.5 text-dark-400 hover:text-white rounded-xl hover:bg-dark-800" title="Close">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {memeToSend && (
          <div className="mt-5 p-4 bg-primary-50 rounded-2xl border border-primary-100 flex gap-3 items-center">
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
          <div className="mt-5 p-4 bg-dark-950 rounded-2xl border border-dark-800 flex gap-3 items-center">
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
          <label className="flex items-center gap-2 text-xs font-extrabold text-dark-400 uppercase tracking-wider mb-3"><FiUsers className="text-primary-500" /> Choose a recipient</label>
          <div className="space-y-2">
            {followingUsers.map((u) => {
              const selected = selectedUser?.id === u.id;
              return (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selected ? 'border-primary-400 bg-primary-50' : 'border-dark-800 bg-dark-950 hover:border-primary-200'
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-primary-700 font-bold text-xs">
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
            className="w-full bg-dark-950 border border-dark-800 rounded-2xl p-3.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 resize-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!selectedUser || sending}
            className="w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 shadow-lg"
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
