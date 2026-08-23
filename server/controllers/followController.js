import FollowModel from '../models/followModel.js';
import NotificationModel from '../models/notificationModel.js';

/**
 * Follow Controller
 * Handles user follow/unfollow operations
 */

/**
 * Follow a user
 * POST /api/users/:id/follow
 */
export const followUser = async (req, res) => {
  try {
    const followerId = req.body.follower_id || req.user?.id;
    const followingId = parseInt(req.params.id);

    if (!followerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const result = await FollowModel.follow(followerId, followingId);

    // Create notification for the followed user
    try {
      await NotificationModel.notifyFollow(followingId, followerId);
    } catch (notifError) {
      console.error('Failed to create follow notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Successfully followed user',
      data: result
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: error.message || 'Failed to follow user' });
  }
};

/**
 * Unfollow a user
 * DELETE /api/users/:id/follow
 */
export const unfollowUser = async (req, res) => {
  try {
    const followerId = req.body.follower_id || req.user?.id;
    const followingId = parseInt(req.params.id);

    if (!followerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const success = await FollowModel.unfollow(followerId, followingId);

    if (!success) {
      return res.status(404).json({ error: 'Follow relationship not found' });
    }

    res.json({
      success: true,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: error.message || 'Failed to unfollow user' });
  }
};

/**
 * Get users that a user is following
 * GET /api/users/:id/following
 */
export const getFollowing = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const following = await FollowModel.getFollowing(userId, { limit, offset });

    res.json(following);
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ error: 'Failed to fetch following list' });
  }
};

/**
 * Get users that follow a user (followers)
 * GET /api/users/:id/followers
 */
export const getFollowers = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const followers = await FollowModel.getFollowers(userId, { limit, offset });

    res.json(followers);
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ error: 'Failed to fetch followers list' });
  }
};

/**
 * Check if current user follows target user
 * GET /api/users/:id/follow-status
 */
export const checkFollowStatus = async (req, res) => {
  try {
    const followerId = req.query.follower_id || req.user?.id;
    const followingId = parseInt(req.params.id);

    if (!followerId) {
      return res.json({ isFollowing: false });
    }

    const isFollowing = await FollowModel.isFollowing(followerId, followingId);

    res.json({ isFollowing });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
};

/**
 * Get follow counts for a user
 * GET /api/users/:id/follow-counts
 */
export const getFollowCounts = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const counts = await FollowModel.getFollowCounts(userId);

    res.json(counts);
  } catch (error) {
    console.error('Error fetching follow counts:', error);
    res.status(500).json({ error: 'Failed to fetch follow counts' });
  }
};

/**
 * Get suggested users to follow
 * GET /api/users/:id/suggestions
 */
export const getSuggestions = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 10;

    const suggestions = await FollowModel.getSuggestions(userId, { limit });

    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
};

/**
 * Get mutual follows
 * GET /api/users/:id/mutual
 */
export const getMutualFollows = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const mutual = await FollowModel.getMutualFollows(userId);

    res.json(mutual);
  } catch (error) {
    console.error('Error fetching mutual follows:', error);
    res.status(500).json({ error: 'Failed to fetch mutual follows' });
  }
};
