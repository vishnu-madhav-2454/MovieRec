import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FiBell, 
  FiHeart, 
  FiMessageSquare, 
  FiSend, 
  FiUserPlus, 
  FiCheck,
  FiFilm
} from 'react-icons/fi';

export default function Notifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'like_review',
      actor_name: 'CinemaLover',
      message: 'liked your review of The Dark Knight',
      movie_title: 'The Dark Knight',
      time: '15m ago',
      read: false
    },
    {
      id: 2,
      type: 'meme_dm',
      actor_name: 'FilmCritic99',
      message: 'sent you a movie meme via DM: Lisan al Gaib!',
      movie_title: 'Dune: Part Two',
      time: '1h ago',
      read: false
    },
    {
      id: 3,
      type: 'follow',
      actor_name: 'NolanFan',
      message: 'started following you',
      time: '3h ago',
      read: true
    },
    {
      id: 4,
      type: 'comment',
      actor_name: 'CinemaLover',
      message: 'replied to your cinema meme: Hans Zimmer orchestra overpowers dialogue every time 😂',
      time: '5h ago',
      read: true
    }
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white px-4 py-8 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between pb-6 border-b border-dark-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-500">
            <FiBell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-xs text-dark-400">Activity on your reviews, memes, and cinephile followers</p>
          </div>
        </div>

        <button
          onClick={markAllRead}
          className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1"
        >
          <FiCheck className="w-4 h-4" /> Mark all read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
              n.read
                ? 'bg-dark-900/40 border-dark-800/60 opacity-80'
                : 'bg-dark-900 border-primary-900/50 shadow-md'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {n.actor_name.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-sm">{n.actor_name}</span>
                <span className="text-xs text-dark-400">{n.message}</span>
              </div>
              {n.movie_title && (
                <span className="inline-flex items-center gap-1 text-xs text-primary-400 font-medium">
                  <FiFilm className="w-3 h-3" /> {n.movie_title}
                </span>
              )}
              <div className="text-[11px] text-dark-500 mt-1">{n.time}</div>
            </div>

            {!n.read && (
              <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0 self-center" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
