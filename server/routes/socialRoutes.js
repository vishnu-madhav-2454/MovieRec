import express from 'express';
import SocialController from '../controllers/socialController.js';

const router = express.Router();

// GET /api/social/feed?userId=1&filter=all|following
router.get('/feed', SocialController.getFeed);

// POST /api/social/posts
router.post('/posts', SocialController.createPost);

// POST /api/social/posts/:id/like
router.post('/posts/:id/like', SocialController.toggleLike);

// POST /api/social/posts/:id/comments
router.post('/posts/:id/comments', SocialController.addComment);

// POST /api/social/follow
router.post('/follow', SocialController.toggleFollow);

router.get('/follow/check', SocialController.checkFollow);
router.get('/following/:userId', SocialController.getFollowing);
router.get('/followers/:userId', SocialController.getFollowers);

export default router;
