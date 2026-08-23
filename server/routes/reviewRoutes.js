import express from 'express';
import ReviewController from '../controllers/reviewController.js';
import { validators } from '../middleware/validation.js';
import { createLimiter, interactionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/', ReviewController.getAllReviews);
router.get('/search', ReviewController.searchReviews);
router.get('/movie/:movieId', ReviewController.getMovieReviews);
router.get('/movie/:movieId/stats', ReviewController.getReviewStats);
router.get('/user/:userId', ReviewController.getUserReviews);
router.post('/', createLimiter, validators.review.create, ReviewController.createReview);
router.post('/:id/like', interactionLimiter, ReviewController.toggleLikeReview);
router.post('/:id/helpful', interactionLimiter, ReviewController.toggleHelpfulReview);
router.post('/:id/comments', interactionLimiter, validators.comment, ReviewController.addReviewComment);
router.put('/:id', validators.review.update, ReviewController.updateReview);
router.delete('/:id', ReviewController.deleteReview);

export default router;
