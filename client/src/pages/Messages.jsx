import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { io } from "socket.io-client";
import { auth } from "../config/firebase";
import {
  FiArrowLeft,
  FiSend,
  FiImage,
  FiFilm,
  FiMoreVertical,
  FiSearch,
  FiEdit,
  FiUser,
  FiMessageCircle,
  FiStar,
  FiHeart,
  FiX,
  FiExternalLink,
  FiMaximize2
} from "react-icons/fi";

export default function Messages() {
  const { userId: chatUserId } = useParams();
  const { currentUser, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDetailMeme, setSelectedDetailMeme] = useState(null);
  const [selectedDetailReview, setSelectedDetailReview] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const activeChatRef = useRef(null);

  const isAuthed = currentUser && !currentUser.isGuest;

  useEffect(() => {
    activeChatRef.current = chatUserId ? String(chatUserId) : null;
  }, [chatUserId]);

  useEffect(() => {
    if (!isAuthed) return;
    loadConversations();

    let socket;
    let cancelled = false;
    const connectSocket = async () => {
      const token = await auth?.currentUser?.getIdToken();
      if (!token || cancelled) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const socketUrl = apiUrl.replace(/\/api\/?$/, '');
      socket = io(socketUrl, { auth: { token }, transports: ['websocket', 'polling'] });
      socketRef.current = socket;
      socket.on('message:new', (message) => {
        const otherUserId = String(message.sender_id === currentUser.id ? message.receiver_id : message.sender_id);
        if (otherUserId === activeChatRef.current) {
          setMessages((previous) => previous.some((item) => item.id === message.id) ? previous : [...previous, message]);
        }
        loadConversations();
      });
      socket.on('connect_error', (error) => console.error('Realtime messaging connection failed:', error.message));
    };
    connectSocket();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isAuthed, currentUser]);

  useEffect(() => {
    if (chatUserId && isAuthed) {
      loadChat(chatUserId);
    }
  }, [chatUserId, isAuthed, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get("/api/users");
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        const filtered = list.filter(u => 
          u.username?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          u.id !== currentUser?.id
        );
        setSearchResults(filtered.slice(0, 5));
      } catch (e) {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  const loadConversations = async () => {
    try {
      const res = await axios.get("/api/dm/conversations", {
        params: { userId: currentUser?.id || 1 }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data?.conversations || []);
      setConversations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async (otherUserId) => {
    try {
      const [userRes, msgRes] = await Promise.all([
        axios.get(`/api/users/${otherUserId}`).catch(() => ({ data: null })),
        axios.get(`/api/dm/messages/${otherUserId}`, {
          params: { userId: currentUser?.id || 1 }
        }).catch(() => ({ data: [] }))
      ]);

      if (userRes.data) setSelectedUser(userRes.data);
      const msgList = Array.isArray(msgRes.data) ? msgRes.data : (msgRes.data?.messages || []);
      setMessages(msgList);
    } catch (e) {
      console.error(e);
    }
  };

  const loadChatSilent = async (otherUserId) => {
    try {
      const msgRes = await axios.get(`/api/dm/messages/${otherUserId}`, {
        params: { userId: currentUser?.id || 1 }
      });
      const msgList = Array.isArray(msgRes.data) ? msgRes.data : (msgRes.data?.messages || []);
      setMessages(msgList);
    } catch (e) {}
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser) return;

    const text = messageInput.trim();
    setMessageInput("");

    try {
      if (!socketRef.current?.connected) {
        throw new Error('Realtime messaging is not connected');
      }
      const result = await new Promise((resolve) => {
        socketRef.current.emit('send_message', {
          receiver_id: selectedUser.id,
          content: text
        }, resolve);
      });
      if (!result?.ok) throw new Error(result?.error || 'Failed to send message');
      setMessages((prev) => prev.some((message) => message.id === result.message.id) ? prev : [...prev, result.message]);
      loadConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const startConversation = (user) => {
    setSelectedUser(user);
    setMessages([]);
    navigate(`/messages/${user.id}`, { replace: true });
    setSearchQuery("");
    setSearchResults([]);
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <FiMessageCircle className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Your Messages</h2>
          <p className="text-dark-400 text-sm mb-4">Sign in to send and receive messages</p>
          <button onClick={openAuthModal} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black md:ml-16 lg:ml-64">
      <div className="max-w-4xl mx-auto h-[calc(100vh-3.5rem)] md:h-screen flex">
        {/* Conversations List */}
        <div className={`w-full md:w-80 border-r border-dark-800 flex flex-col ${selectedUser ? "hidden md:flex" : "flex"}`}>
          {/* Header */}
          <div className="p-4 border-b border-dark-800">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-bold">{currentUser?.displayName || "Messages"}</h1>
              <button className="p-2 hover:bg-dark-800 rounded-lg transition-colors">
                <FiEdit className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-900 border border-dark-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-dark-600"
              />
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-dark-900 border border-dark-800 rounded-lg overflow-hidden z-10 shadow-2xl">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => startConversation(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-dark-800 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
                        {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{user.username}</p>
                        <p className="text-dark-400 text-xs truncate">{user.bio || "Movie enthusiast"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <FiMessageCircle className="w-12 h-12 text-dark-600 mb-3" />
                <p className="text-dark-400 text-sm">No messages yet</p>
                <p className="text-dark-500 text-xs mt-1">Search for users to start a conversation</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => startConversation(conv)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-dark-900 transition-colors border-b border-dark-900 ${
                    selectedUser?.id === conv.user_id ? "bg-dark-900" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold overflow-hidden">
                      {conv.avatar_url ? <img src={conv.avatar_url} alt="" className="w-full h-full object-cover" /> : conv.username?.charAt(0).toUpperCase()}
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white text-sm truncate">{conv.username}</p>
                      <span className="text-dark-500 text-xs">
                        {conv.last_message_time ? new Date(conv.last_message_time).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                    <p className="text-dark-400 text-xs truncate">{conv.last_message}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!selectedUser ? "hidden md:flex" : "flex"}`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-dark-800 flex items-center gap-3 bg-black/40 backdrop-blur-sm">
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    navigate("/messages");
                  }}
                  className="md:hidden p-2 hover:bg-dark-800 rounded-lg"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <Link
                  to={`/profile/${selectedUser.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-85 transition-opacity group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt={selectedUser.username} className="w-full h-full object-cover" />
                    ) : (
                      selectedUser.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate group-hover:underline">{selectedUser.username}</p>
                    <p className="text-dark-400 text-xs truncate">{selectedUser.bio || "View Profile"}</p>
                  </div>
                </Link>
                <Link
                  to={`/profile/${selectedUser.id}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white transition-colors"
                >
                  Profile
                </Link>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <FiUser className="w-12 h-12 text-dark-600 mb-3" />
                    <p className="text-dark-400 text-sm">No messages yet</p>
                    <p className="text-dark-500 text-xs mt-1">Say hello or share a movie meme to start</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === currentUser?.id;
                    const hasMeme = msg.meme_id && msg.meme_image;
                    const hasReview = msg.review_id || msg.review_movie_title;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl shadow-md ${
                            isMine
                              ? "bg-primary-600 text-white rounded-br-sm"
                              : "bg-dark-800 text-white rounded-bl-sm border border-dark-700/50"
                          }`}
                        >
                          {/* Attached Meme Card */}
                          {hasMeme && (
                            <div className="mb-2.5 rounded-xl overflow-hidden bg-black/50 border border-white/10 max-w-xs group relative">
                              <div 
                                onClick={() => setSelectedDetailMeme(msg)}
                                className="cursor-pointer relative overflow-hidden"
                              >
                                <img
                                  src={msg.meme_image}
                                  alt={msg.meme_caption || "Meme"}
                                  className="w-full max-h-60 object-contain rounded-t-lg group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <span className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
                                    <FiMaximize2 className="w-3.5 h-3.5" /> View Meme
                                  </span>
                                </div>
                              </div>

                              <div className="p-2.5 bg-dark-950/90 flex flex-col gap-1.5">
                                {msg.meme_caption && (
                                  <p className="text-xs text-white/90 line-clamp-2">{msg.meme_caption}</p>
                                )}
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
                                  {msg.meme_movie_id ? (
                                    <Link
                                      to={`/movie/${msg.meme_movie_id}`}
                                      className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 truncate"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <FiFilm className="w-3 h-3 shrink-0" /> {msg.meme_movie_title || "View Movie"}
                                    </Link>
                                  ) : (
                                    <span className="text-[11px] text-dark-400">Movie Meme</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDetailMeme(msg)}
                                    className="text-[10px] font-bold text-primary-400 hover:text-primary-300 bg-primary-950/60 px-2 py-0.5 rounded-md border border-primary-800/40 shrink-0"
                                  >
                                    Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Attached Review Card */}
                          {hasReview && (
                            <div className="mb-2.5 rounded-xl overflow-hidden bg-dark-950/90 border border-white/10 max-w-xs p-3">
                              <div className="flex gap-2.5 items-start">
                                {msg.review_movie_poster && (
                                  <img
                                    src={`https://image.tmdb.org/t/p/w200${msg.review_movie_poster}`}
                                    alt="Poster"
                                    className="w-12 h-16 rounded-lg object-cover border border-dark-700 shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span className="text-xs font-bold text-white truncate">{msg.review_movie_title || "Movie Review"}</span>
                                    {msg.review_rating && (
                                      <span className="text-[11px] font-black text-amber-400 shrink-0 flex items-center gap-0.5">
                                        <FiStar className="w-3 h-3 fill-amber-400" /> {msg.review_rating}
                                      </span>
                                    )}
                                  </div>
                                  {msg.review_author && (
                                    <p className="text-[10px] text-dark-400">Review by @{msg.review_author}</p>
                                  )}
                                  {msg.review_content && (
                                    <p className="text-xs text-dark-200 mt-1 line-clamp-2 italic">"{msg.review_content}"</p>
                                  )}
                                </div>
                              </div>

                              {msg.review_movie_id && (
                                <Link
                                  to={`/movie/${msg.review_movie_id}`}
                                  className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-primary-600/90 hover:bg-primary-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow"
                                >
                                  <FiExternalLink className="w-3 h-3" /> View Movie & Reviews
                                </Link>
                              )}
                            </div>
                          )}

                          {/* Message Content */}
                          {msg.content && <p className="text-sm break-words leading-relaxed">{msg.content}</p>}
                          <p className={`text-[10px] mt-1.5 flex items-center justify-end ${isMine ? "text-primary-200" : "text-dark-400"}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-dark-800 bg-black/40">
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => navigate("/memes")}
                    className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors"
                    title="Send a Meme"
                  >
                    <FiFilm className="w-5 h-5 text-primary-400" />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Message..."
                    className="flex-1 bg-dark-900 border border-dark-800 rounded-full py-2.5 px-4 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="p-2.5 bg-primary-600 text-white rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-500 active:scale-95 transition-all shadow-lg"
                  >
                    <FiSend className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-24 h-24 rounded-full bg-dark-900 flex items-center justify-center mb-4 border border-dark-800 shadow-xl">
                <FiSend className="w-10 h-10 text-primary-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Your Messages</h2>
              <p className="text-dark-400 text-sm mb-6 max-w-xs">
                Send private messages to friends, share memes, and discuss movies and reviews
              </p>
              <button
                onClick={() => document.querySelector('input[placeholder="Search users..."]')?.focus()}
                className="bg-primary-600 hover:bg-primary-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg"
              >
                Start a Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meme Detail Modal */}
      {selectedDetailMeme && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          onClick={() => setSelectedDetailMeme(null)}
        >
          <div 
            className="bg-dark-900 border border-dark-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-dark-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiFilm className="w-5 h-5 text-primary-500" />
                <h3 className="font-bold text-white text-base">
                  {selectedDetailMeme.meme_movie_title || "Meme Details"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailMeme(null)}
                className="p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-black flex items-center justify-center max-h-[50vh] overflow-hidden">
              <img
                src={selectedDetailMeme.meme_image}
                alt={selectedDetailMeme.meme_caption || "Meme"}
                className="max-h-[48vh] w-auto object-contain rounded-lg shadow-xl"
              />
            </div>

            <div className="p-4 space-y-3 bg-dark-900">
              {selectedDetailMeme.meme_caption && (
                <p className="text-sm text-dark-100 font-medium">{selectedDetailMeme.meme_caption}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-dark-400 pt-2 border-t border-dark-800">
                <span className="flex items-center gap-1.5">
                  <FiHeart className="text-rose-500 fill-rose-500" /> {selectedDetailMeme.meme_likes_count || 0} likes
                </span>
                <span className="flex items-center gap-1.5">
                  <FiMessageCircle className="text-sky-400" /> {selectedDetailMeme.meme_comments_count || 0} comments
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {selectedDetailMeme.meme_movie_id && (
                  <Link
                    to={`/movie/${selectedDetailMeme.meme_movie_id}`}
                    onClick={() => setSelectedDetailMeme(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg"
                  >
                    <FiFilm className="w-4 h-4" /> Go to Movie Page
                  </Link>
                )}
                <Link
                  to="/memes"
                  onClick={() => setSelectedDetailMeme(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-dark-800 hover:bg-dark-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-dark-700 transition-colors"
                >
                  <FiExternalLink className="w-4 h-4" /> View in Memes Feed
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
