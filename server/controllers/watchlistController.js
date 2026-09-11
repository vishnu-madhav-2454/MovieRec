import WatchlistModel from '../models/watchlistModel.js';

/**
 * Watchlist Controller - Handles watchlist-related requests
 */
class WatchlistController {
  
  /**
   * Get user's watchlist
   * GET /api/watchlist/user/:userId
   */
  static async getUserWatchlist(req, res) {
    try {
      const { userId } = req.params;
      const watchlist = await WatchlistModel.getUserWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      console.error('Error in getUserWatchlist:', error.message);
      res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
  }

  /**
   * Add movie to watchlist
   * POST /api/watchlist
   */
  static async addToWatchlist(req, res) {
    try {
      const { user_id, movie_id, movie_title, poster_path } = req.body;

      // Validation
      if (!user_id || !movie_id || !movie_title) {
        return res.status(400).json({ 
          error: 'User ID, movie ID, and movie title are required' 
        });
      }

      const result = await WatchlistModel.addToWatchlist(
        user_id,
        movie_id,
        movie_title,
        poster_path
      );

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in addToWatchlist:', error.message);
      res.status(500).json({ error: 'Failed to add to watchlist' });
    }
  }

  /**
   * Remove movie from watchlist
   * DELETE /api/watchlist/:userId/:movieId
   */
  static async removeFromWatchlist(req, res) {
    try {
      const { userId, movieId } = req.params;

      const removed = await WatchlistModel.removeFromWatchlist(userId, movieId);

      if (!removed) {
        return res.status(404).json({ error: 'Movie not found in watchlist' });
      }

      res.json({ message: 'Removed from watchlist' });
    } catch (error) {
      console.error('Error in removeFromWatchlist:', error.message);
      res.status(500).json({ error: 'Failed to remove from watchlist' });
    }
  }

  /**
   * Check if movie is in watchlist
   * GET /api/watchlist/check/:userId/:movieId
   */
  static async checkWatchlist(req, res) {
    try {
      const { userId, movieId } = req.params;
      const inWatchlist = await WatchlistModel.isInWatchlist(userId, movieId);
      res.json({ inWatchlist });
    } catch (error) {
      console.error('Error in checkWatchlist:', error.message);
      res.status(500).json({ error: 'Failed to check watchlist' });
    }
  }

  /**
   * Clear user's watchlist
   * DELETE /api/watchlist/user/:userId
   */
  static async clearWatchlist(req, res) {
    try {
      const { userId } = req.params;
      const count = await WatchlistModel.clearWatchlist(userId);
      res.json({ 
        message: `Cleared ${count} items from watchlist` 
      });
    } catch (error) {
      console.error('Error in clearWatchlist:', error.message);
      res.status(500).json({ error: 'Failed to clear watchlist' });
    }
  }

  /**
   * Get watchlist count
   * GET /api/watchlist/count/:userId
   */
  static async getWatchlistCount(req, res) {
    try {
      const { userId } = req.params;
      const count = await WatchlistModel.getWatchlistCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error in getWatchlistCount:', error.message);
      res.status(500).json({ error: 'Failed to get watchlist count' });
    }
  }
}

export default WatchlistController;
