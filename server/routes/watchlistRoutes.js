import express from 'express';
import WatchlistController from '../controllers/watchlistController.js';

const router = express.Router();

/**
 * Watchlist Routes - Maps endpoints to controller methods
 */

// GET /api/watchlist/user/:userId
router.get('/user/:userId', WatchlistController.getUserWatchlist);

// GET /api/watchlist/count/:userId
router.get('/count/:userId', WatchlistController.getWatchlistCount);

// GET /api/watchlist/check/:userId/:movieId
router.get('/check/:userId/:movieId', WatchlistController.checkWatchlist);

// POST /api/watchlist
router.post('/', WatchlistController.addToWatchlist);

// DELETE /api/watchlist/user/:userId
router.delete('/user/:userId', WatchlistController.clearWatchlist);

// DELETE /api/watchlist/:userId/:movieId
router.delete('/:userId/:movieId', WatchlistController.removeFromWatchlist);

export default router;
