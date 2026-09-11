import express from 'express';
import ReviewController from '../controllers/reviewController.js';
import { validators } from '../middleware/validation.js';

const router = express.Router();

router.get('/', ReviewController.getAllReviews);
router.get('/search', ReviewController.searchReviews);
router.get('/movie/:movieId', ReviewController.getMovieReviews);
router.get('/movie/:movieId/stats', ReviewController.getReviewStats);
router.get('/user/:userId', ReviewController.getUserReviews);
router.post('/movie/:movieId', validators.review.create, ReviewController.createReview);
router.post('/:id/like', ReviewController.toggleLikeReview);
router.post('/:id/helpful', ReviewController.toggleHelpfulReview);
router.post('/:id/comments', validators.comment, ReviewController.addReviewComment);
router.put('/:id', validators.review.update, ReviewController.updateReview);
router.delete('/:id', ReviewController.deleteReview);

export default router;
