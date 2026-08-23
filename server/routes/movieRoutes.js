import express from 'express';
import MovieController from '../controllers/movieController.js';

const router = express.Router();

/**
 * Movie Routes - Maps endpoints to controller methods
 */

// GET /api/movies/trending
router.get('/trending', MovieController.getTrending);

// GET /api/movies/popular
router.get('/popular', MovieController.getPopular);

// GET /api/movies/search
router.get('/search', MovieController.search);

// GET /api/movies/:id
router.get('/:id', MovieController.getDetails);

// GET /api/movies/:id/recommendations
router.get('/:id/recommendations', MovieController.getRecommendations);

export default router;
