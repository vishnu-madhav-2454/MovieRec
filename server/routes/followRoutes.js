import express from 'express';
import {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  checkFollowStatus,
  getFollowCounts,
  getSuggestions,
  getMutualFollows
} from '../controllers/followController.js';

const router = express.Router();

/**
 * @route   POST /api/users/:id/follow
 * @desc    Follow a user
 * @access  Private (requires authentication)
 */
router.post('/:id/follow', followUser);

/**
 * @route   DELETE /api/users/:id/follow
 * @desc    Unfollow a user
 * @access  Private (requires authentication)
 */
router.delete('/:id/follow', unfollowUser);

/**
 * @route   GET /api/users/:id/following
 * @desc    Get list of users that this user follows
 * @access  Public
 */
router.get('/:id/following', getFollowing);

/**
 * @route   GET /api/users/:id/followers
 * @desc    Get list of users that follow this user
 * @access  Public
 */
router.get('/:id/followers', getFollowers);

/**
 * @route   GET /api/users/:id/follow-status
 * @desc    Check if current user follows target user
 * @access  Public
 */
router.get('/:id/follow-status', checkFollowStatus);

/**
 * @route   GET /api/users/:id/follow-counts
 * @desc    Get following/followers counts
 * @access  Public
 */
router.get('/:id/follow-counts', getFollowCounts);

/**
 * @route   GET /api/users/:id/suggestions
 * @desc    Get suggested users to follow
 * @access  Public
 */
router.get('/:id/suggestions', getSuggestions);

/**
 * @route   GET /api/users/:id/mutual
 * @desc    Get mutual follows
 * @access  Public
 */
router.get('/:id/mutual', getMutualFollows);

export default router;
