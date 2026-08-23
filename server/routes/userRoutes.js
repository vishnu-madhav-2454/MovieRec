import express from 'express';
import UserController from '../controllers/userController.js';
import { authMiddleware, optionalAuthMiddleware } from '../config/firebase.js';

const router = express.Router();

/**
 * User Routes - Maps endpoints to controller methods
 */

// POST /api/users/sync - Sync Firebase user with database
router.post('/sync', UserController.syncUser);

// GET /api/users/search - Search users (MUST be before /:id routes)
router.get('/search', UserController.searchUsers);

// GET /api/users/me - Get current authenticated user
router.get('/me', authMiddleware, UserController.getCurrentUser);

// PUT /api/users/me - Update current user profile
router.put('/me', authMiddleware, UserController.updateProfile);

// GET /api/users - Get all users (public)
router.get('/', UserController.getAllUsers);

// GET /api/users/:id/watched - Get user's watched films
router.get('/:id/watched', UserController.getWatchedFilms);

// POST /api/users/:id/watched - Add film to watched
router.post('/:id/watched', UserController.addToWatched);

// DELETE /api/users/:id/watched/:movieId - Remove film from watched
router.delete('/:id/watched/:movieId', UserController.removeFromWatched);

// GET /api/users/:id/favorites - Get user's favorite films
router.get('/:id/favorites', UserController.getFavoriteFilms);

// POST /api/users/:id/favorites - Add film to favorites
router.post('/:id/favorites', UserController.addToFavorites);

// DELETE /api/users/:id/favorites/:movieId - Remove film from favorites
router.delete('/:id/favorites/:movieId', UserController.removeFromFavorites);

// GET /api/users/:id - Get user by ID (public)
router.get('/:id', UserController.getUser);

// GET /api/users/:id/stats - Get user statistics (public)
router.get('/:id/stats', UserController.getUserStats);

// POST /api/users - Create or update user (legacy, for backwards compatibility)
router.post('/', UserController.createOrUpdateUser);

// DELETE /api/users/:id - Delete user (should be protected in production)
router.delete('/:id', UserController.deleteUser);

export default router;
