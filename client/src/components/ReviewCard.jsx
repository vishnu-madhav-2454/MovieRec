import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { shouldBlurReview, getSpoilerWarning } from '../utils/spoilerDetector';
import DmDrawer from './DmDrawer';
import {
  FiStar,
  FiHeart,
  FiMessageSquare,
  FiShare2,
  FiThumbsUp,
  FiEye,
  FiEyeOff,
  FiCornerDownRight,
  FiAlertTriangle,
  FiSend
} from 'react-icons/fi';

export default function ReviewCard({ review, currentUser, onLikeToggle, onHelpfulToggle }) {
  const [spoilerCheck, setSpoilerCheck] = useState(null);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [isLiked, setIsLiked] = useState(review.isLiked || false);
  const [likesCount, setLikesCount] = useState(review.likes_count || 0);
  const [isHelpful, setIsHelpful] = useState(review.isHelpful || false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(review.comments || []);
  const [newComment, setNewComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [dmOpen, setDmOpen] = useState(false);

  useEffect(() => {
    // Check for spoilers on mount
    const check = shouldBlurReview(review);
    setSpoilerCheck(check);
    // Auto-show if no spoilers detected
    if (!check.shouldBlur) {
      setShowSpoiler(true);
    }
  }, [review]);

  const handleLike = async () => {
    try {
      const res = await axios.post(`/api/reviews/${review.id}/like`, {
        userId: currentUser?.id || 1
      });
      setIsLiked(res.data.isLiked);
      setLikesCount(res.data.likes_count);
      if (onLikeToggle) onLikeToggle(review.id, res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleHelpful = async () => {
    try {
      const res = await axios.post(`/api/reviews/${review.id}/helpful`, {
        userId: currentUser?.id || 1
      });
      setIsHelpful(res.data.isHelpful);
      setHelpfulCount(res.data.helpful_count);
      if (onHelpfulToggle) onHelpfulToggle(review.id, res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(`/api/reviews/${review.id}/comments`, {
        userId: currentUser?.id || 1,
        username: currentUser?.displayName || currentUser?.username || 'Cinephile',
        content: newComment
      });
      setComments((prev) => [...prev, res.data]);
      setNewComment('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + `/review/${review.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const username = review.username || review.username || 'User';
  const body = review.content || review.content || '';
  const hasSpoilers = spoilerCheck?.shouldBlur || false;
  const spoilerWarning = hasSpoilers ? getSpoilerWarning(spoilerCheck?.riskLevel) : '';

  return (
    <div className="bg-dark-900/60 border border-dark-800 rounded-2xl p-4 sm:p-5 hover:border-dark-700 transition-all shadow-lg">
      <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Link
            to={'/profile/' + (review.user_id || 1)}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary-600 to-amber-600 flex items-center justify-center font-bold text-white text-xs sm:text-sm shrink-0"
          >
            {username.charAt(0).toUpperCase()}
          </Link>
          <div className="min-w-0 flex-1">
            <Link to={'/profile/' + (review.user_id || 1)} className="font-semibold text-white hover:text-primary-400 text-sm sm:text-base truncate block">
              {username}
            </Link>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-dark-400 flex-wrap">
              <span className="whitespace-nowrap">
                {new Date(review.created_at || Date.now()).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              {hasSpoilers && (
                <span className="bg-red-950/80 text-red-400 border border-red-800/60 text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                  <FiAlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Spoilers
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-dark-950/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-dark-800 shrink-0">
          <FiStar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400" />
          <span className="font-bold text-amber-300 text-xs sm:text-sm">{review.rating}</span>
          <span className="text-dark-500 text-[10px] sm:text-xs">/ 5</span>
        </div>
      </div>

      {review.vibes?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {review.vibes.map((vibe) => (
            <span key={vibe} className="text-[10px] sm:text-xs bg-primary-950/40 text-primary-300 border border-primary-900/50 px-2 sm:px-2.5 py-0.5 rounded-full">
              #{vibe}
            </span>
          ))}
        </div>
      )}

      <div className="my-3">
        {hasSpoilers && !showSpoiler ? (
          <div className="relative overflow-hidden bg-dark-950/90 border-2 border-red-900/40 rounded-xl p-3 sm:p-4 text-center">
            <div className="mb-2">
              <p className="text-xs sm:text-sm font-bold text-red-400 mb-1">{spoilerWarning}</p>
              <p className="text-[10px] sm:text-xs text-dark-400">{spoilerCheck?.reason}</p>
            </div>
            <p className="text-xs sm:text-sm text-dark-300 mb-3 blur-sm select-none line-clamp-3">{body.slice(0, 140)}...</p>
            <button
              type="button"
              onClick={() => setShowSpoiler(true)}
              className="inline-flex items-center gap-2 text-xs sm:text-sm bg-red-600/20 hover:bg-red-600/30 text-red-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-red-500/30 font-semibold transition-all"
            >
              <FiEye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Reveal review
            </button>
          </div>
        ) : (
          <div>
            <p className="text-dark-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line">{body}</p>
            {hasSpoilers && showSpoiler && (
              <button
                type="button"
                onClick={() => setShowSpoiler(false)}
                className="mt-2 inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-dark-500 hover:text-dark-300 transition-colors"
              >
                <FiEyeOff className="w-3 h-3" /> Hide spoiler
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 mt-2 border-t border-dark-800/80 text-[11px] sm:text-xs text-dark-400 gap-2">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1 sm:gap-1.5 font-medium ${isLiked ? 'text-rose-400' : 'hover:text-rose-400'} transition-colors`}
          >
            <FiHeart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLiked ? 'fill-rose-400' : ''}`} />
            <span>{likesCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 sm:gap-1.5 hover:text-primary-400 font-medium transition-colors"
          >
            <FiMessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{comments.length}</span>
          </button>
          <button
            type="button"
            onClick={handleHelpful}
            className={`flex items-center gap-1 sm:gap-1.5 font-medium ${isHelpful ? 'text-emerald-400' : 'hover:text-emerald-400'} transition-colors`}
          >
            <FiThumbsUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isHelpful ? 'fill-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Helpful</span> <span>({helpfulCount})</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setDmOpen(true)} 
            className="flex items-center gap-1 text-dark-400 hover:text-primary-400 transition-colors whitespace-nowrap text-xs font-medium"
            title="Send review via DM"
          >
            <FiSend className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
          <button type="button" onClick={handleShare} className="flex items-center gap-1 text-dark-400 hover:text-white transition-colors whitespace-nowrap text-xs font-medium">
            <FiShare2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="mt-4 pt-3 border-t border-dark-800/50 space-y-3">
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-dark-500 italic">No comments yet. Be the first to reply!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="bg-dark-950/60 p-2.5 rounded-lg border border-dark-800 text-xs">
                  <div className="flex items-center justify-between text-dark-400 mb-1">
                    <span className="font-semibold text-primary-400">{c.username}</span>
                    <span className="text-[10px]">
                      {new Date(c.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-dark-200">{c.content}</p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Reply to this review..."
              className="flex-1 bg-dark-950/80 border border-dark-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <FiCornerDownRight className="w-3.5 h-3.5" /> Reply
            </button>
          </form>
        </div>
      )}

      <DmDrawer
        isOpen={dmOpen}
        onClose={() => setDmOpen(false)}
        currentUser={currentUser}
        reviewToSend={review}
        onSent={() => {}}
      />
    </div>
  );
}
