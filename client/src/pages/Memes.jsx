import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import MemeUpload from "../components/MemeUpload";
import DmDrawer from "../components/DmDrawer";
import Loading from "../components/Loading";
import { FiHeart, FiMessageCircle, FiShare2, FiSend, FiPlus, FiFilm, FiX, FiArrowLeft } from "react-icons/fi";

export default function Memes() {
  const { currentUser, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dmOpen, setDmOpen] = useState(false);
  const [activeMeme, setActiveMeme] = useState(null);
  const [commentMemeId, setCommentMemeId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [heartBurst, setHeartBurst] = useState(null);
  const [likePending, setLikePending] = useState({});

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`/api/memes?userId=${currentUser?.id || 1}`);
        setMemes(res.data.results || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    load();
  }, [currentUser]);

  const handleLike = async (memeId) => {
    if (currentUser?.isGuest) return openAuthModal();
    if (likePending[memeId]) return;
    setLikePending(prev => ({ ...prev, [memeId]: true }));
    try {
      const res = await axios.post(`/api/memes/${memeId}/like`, { userId: currentUser?.id || 1 });
      setMemes(prev => prev.map(m => m.id === memeId ? { ...m, likes_count: res.data.likes_count ?? m.likes_count, is_liked: res.data.isLiked } : m));
    } catch (error) {
      console.error('Failed to toggle meme like:', error);
    } finally {
      setLikePending(prev => ({ ...prev, [memeId]: false }));
    }
  };

  const handleDoubleTap = (meme) => {
    if (currentUser?.isGuest) return openAuthModal();
    if (!meme.is_liked) handleLike(meme.id);
    setHeartBurst(meme.id);
    setTimeout(() => setHeartBurst(null), 900);
  };

  const openComments = async (memeId) => {
    setCommentMemeId(memeId);
    setCommentsLoading(true);
    try {
      const res = await axios.get(`/api/memes/${memeId}/comments`);
      const commentList = Array.isArray(res.data) ? res.data : [];
      setMemes(prev => prev.map(m => m.id === memeId ? { ...m, comments: commentList } : m));
    } catch (e) {
      console.error(e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (memeId, e) => {
    e.preventDefault();
    if (currentUser?.isGuest) return openAuthModal();
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText("");
    try {
      const res = await axios.post(`/api/memes/${memeId}/comments`, { 
        userId: currentUser?.id || 1, 
        username: currentUser?.displayName || currentUser?.username || "MovieBuff", 
        content: text 
      });
      setMemes(prev => prev.map(m => m.id === memeId ? { 
        ...m, 
        comments: [...(m.comments || []), res.data], 
        comments_count: (m.comments_count || 0) + 1 
      } : m));
    } catch (e) { 
      console.error(e); 
    }
  };

  const handleShare = async (meme) => {
    try {
      await axios.post(`/api/memes/${meme.id}/share`);
      setMemes(prev => prev.map(m => m.id === meme.id ? { ...m, shares_count: (m.shares_count||0)+1 } : m));
      await navigator.clipboard.writeText(window.location.href);
    } catch {}
    showToast("Link copied!");
  };

  const openDm = (meme) => { 
    if (currentUser?.isGuest) return openAuthModal(); 
    setActiveMeme(meme); 
    setDmOpen(true); 
  };

  const activeMemeData = memes.find(m => m.id === commentMemeId);

  if (loading) return <Loading />;

  return (
    <div className="bg-black text-white" style={{ position:"fixed", inset:0, zIndex:10, top:0 }}>
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-white text-black font-bold text-xs px-5 py-2 rounded-full shadow-2xl">{toast}</div>}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-black tracking-tight drop-shadow-lg">🎬 Memes</h1>
        </div>
        <button 
          type="button" 
          onClick={() => currentUser?.isGuest ? openAuthModal() : setUploadOpen(true)}
          className="flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-white/20 active:scale-95 transition-all"
        >
          <FiPlus className="w-3.5 h-3.5" /> Post
        </button>
      </div>

      {memes.length === 0 ? (
        <div className="h-full flex items-center justify-center flex-col gap-4">
          <p className="text-5xl">🎭</p>
          <p className="text-dark-300 text-sm font-semibold">No memes yet</p>
          <button type="button" onClick={() => setUploadOpen(true)} className="text-xs bg-white text-black font-bold px-5 py-2.5 rounded-full">Post a meme</button>
        </div>
      ) : (
        <div className="h-full overflow-y-scroll" style={{ scrollSnapType:"y mandatory", WebkitOverflowScrolling:"touch" }}>
          {memes.map(meme => (
            <ReelCard 
              key={meme.id} 
              meme={meme} 
              heartBurst={heartBurst}
              likePending={likePending[meme.id]}
              onDoubleTap={handleDoubleTap} 
              onLike={handleLike}
              onComment={() => openComments(meme.id)} 
              onShare={handleShare} 
              onDm={openDm} 
            />
          ))}
        </div>
      )}

      {/* Comment bottom sheet */}
      {commentMemeId && activeMemeData && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" 
            onClick={() => { setCommentMemeId(null); setCommentText(""); }} 
          />
          <div 
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-[#18181b] rounded-t-2xl border-t border-white/10 flex flex-col shadow-2xl" 
            style={{ maxHeight:"75vh" }}
          >
            <div className="relative flex items-center justify-between px-4 pt-3 pb-2 border-b border-dark-800 flex-shrink-0">
              <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-9 h-1 bg-dark-600 rounded-full" />
              <h3 className="text-sm font-bold text-white">Comments ({activeMemeData.comments_count || activeMemeData.comments?.length || 0})</h3>
              <button 
                type="button" 
                onClick={() => { setCommentMemeId(null); setCommentText(""); }} 
                className="text-dark-400 hover:text-white p-1"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
              {commentsLoading ? (
                <p className="text-center text-dark-400 text-xs py-8">Loading comments...</p>
              ) : (activeMemeData.comments || []).length === 0 ? (
                <p className="text-center text-dark-500 text-sm py-10">No comments yet. Be the first!</p>
              ) : (
                (activeMemeData.comments || []).map(c => (
                  <div key={c.id || Math.random()} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-indigo-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
                      {c.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">
                        <span className="font-bold text-white mr-1.5">{c.username}</span>
                        <span className="text-dark-200">{c.content}</span>
                      </p>
                      {c.created_at && (
                        <p className="text-[10px] text-dark-500 mt-0.5">
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    <FiHeart className="w-3.5 h-3.5 text-dark-500 mt-1 flex-shrink-0 hover:text-rose-500 cursor-pointer" />
                  </div>
                ))
              )}
            </div>

            <div className="flex-shrink-0 border-t border-dark-800 px-3 py-3 flex items-center gap-2.5 bg-[#18181b]">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-dark-800 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" /> : currentUser?.displayName?.[0]?.toUpperCase() || "?"}
              </div>
              <form onSubmit={(e) => handleAddComment(commentMemeId, e)} className="flex-1 flex items-center bg-dark-900 border border-dark-700 rounded-full px-4 py-2 gap-2">
                <input 
                  autoFocus 
                  value={commentText} 
                  onChange={e => setCommentText(e.target.value)} 
                  placeholder="Add a comment…" 
                  className="flex-1 bg-transparent text-sm text-white placeholder-dark-500 focus:outline-none" 
                />
                {commentText.trim() && (
                  <button type="submit" className="text-primary-400 hover:text-primary-300 font-bold text-sm flex-shrink-0 transition-colors">
                    Post
                  </button>
                )}
              </form>
            </div>
          </div>
        </>
      )}

      <MemeUpload 
        isOpen={uploadOpen} 
        onClose={() => setUploadOpen(false)} 
        currentUser={currentUser}
        onUploaded={(newMeme) => { 
          setMemes(prev => [newMeme, ...prev]); 
          showToast("Meme posted!"); 
        }} 
      />
      <DmDrawer 
        isOpen={dmOpen} 
        onClose={() => setDmOpen(false)} 
        currentUser={currentUser} 
        memeToSend={activeMeme} 
        onSent={() => showToast("Meme sent via DM!")} 
      />

      <style>{`
        @keyframes heartPop { 0%{opacity:0;transform:scale(0.2)} 30%{opacity:1;transform:scale(1.4)} 60%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(1.15)} }
        @keyframes likeJump { 0%{transform:scale(1)} 40%{transform:scale(1.4)} 100%{transform:scale(1)} }
      `}</style>
    </div>
  );
}

function ReelCard({ meme, heartBurst, likePending, onDoubleTap, onLike, onComment, onShare, onDm }) {
  const lastTap = useRef(0);
  const handleTap = () => { 
    const now = Date.now(); 
    if (now - lastTap.current < 300) onDoubleTap(meme); 
    lastTap.current = now; 
  };

  return (
    <div className="relative w-full bg-black flex items-center justify-center" style={{ height:"100svh", scrollSnapAlign:"start", scrollSnapStop:"always" }}>
      {/* Image */}
      <div className="absolute inset-0 cursor-pointer select-none" onClick={handleTap}>
        <img src={meme.image_url} alt={meme.caption||"Meme"} className="w-full h-full object-contain" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />
      </div>

      {/* Heart burst */}
      {heartBurst === meme.id && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <FiHeart className="w-28 h-28 text-white fill-white drop-shadow-2xl" style={{ animation:"heartPop 0.9s ease forwards" }} />
        </div>
      )}

      {/* Right dock */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
        {/* Like */}
        <button type="button" disabled={likePending} onClick={() => onLike(meme.id)} className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform disabled:opacity-60">
          <FiHeart className={`w-7 h-7 drop-shadow-lg transition-all duration-200 ${meme.is_liked ? "text-rose-500 fill-rose-500" : "text-white"}`}
            style={meme.is_liked ? { filter:"drop-shadow(0 0 8px rgba(244,63,94,0.8))", animation:"likeJump 0.3s ease" } : {}} />
          <span className="text-xs font-bold text-white drop-shadow">{meme.likes_count||0}</span>
        </button>

        {/* Comment */}
        <button type="button" onClick={onComment} className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform">
          <FiMessageCircle className="w-7 h-7 text-white drop-shadow-lg" />
          <span className="text-xs font-bold text-white drop-shadow">{meme.comments_count||0}</span>
        </button>

        {/* Share */}
        <button type="button" onClick={() => onShare(meme)} className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform">
          <FiShare2 className="w-7 h-7 text-white drop-shadow-lg" />
          <span className="text-xs font-bold text-white drop-shadow">{meme.shares_count||0}</span>
        </button>

        {/* Send */}
        <button type="button" onClick={() => onDm(meme)} className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform">
          <FiSend className="w-7 h-7 text-white drop-shadow-lg" />
          <span className="text-xs font-bold text-white drop-shadow">Send</span>
        </button>

        {/* Avatar */}
        <div className="relative mt-2">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-xl">
            {meme.user_avatar
              ? <img src={meme.user_avatar} alt={meme.username} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center text-sm font-black">{meme.username?.[0]?.toUpperCase()||"?"}</div>}
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center shadow">
            <FiPlus className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Bottom metadata */}
      <div className="absolute bottom-6 left-0 right-20 px-4 z-20 pointer-events-none">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-bold text-white drop-shadow-md">@{meme.username}</span>
          {meme.movie_title && <span className="text-xs text-white/80 flex items-center gap-1 font-semibold"><FiFilm className="w-3 h-3 text-amber-400" /> {meme.movie_title}</span>}
        </div>
        {meme.caption && <p className="text-sm text-white/90 leading-snug drop-shadow-md line-clamp-2 max-w-xs">{meme.caption}</p>}
      </div>
    </div>
  );
}
