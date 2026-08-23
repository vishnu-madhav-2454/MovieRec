import pool from '../db/index.js';

/**
 * Watchlist Model - Handles all watchlist operations using PostgreSQL
 */
class WatchlistModel {
  
  /**
   * Get user's watchlist
   */
  static async getUserWatchlist(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const result = await pool.query(`
      SELECT * FROM watchlist
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    return result.rows;
  }

  /**
   * Check if movie is in user's watchlist
   */
  static async isInWatchlist(userId, movieId) {
    const result = await pool.query(
      'SELECT 1 FROM watchlist WHERE user_id = $1 AND movie_id = $2',
      [userId, movieId]
    );
    return result.rows.length > 0;
  }

  /**
   * Add movie to watchlist
   */
  static async addToWatchlist(userId, movieId, movieTitle, posterPath) {
    // Check if already exists
    const existing = await pool.query(
      'SELECT * FROM watchlist WHERE user_id = $1 AND movie_id = $2',
      [userId, movieId]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0]; // Already in watchlist
    }

    const result = await pool.query(`
      INSERT INTO watchlist (user_id, movie_id, movie_title, poster_path)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, movieId, movieTitle, posterPath]);

    return result.rows[0];
  }

  /**
   * Remove movie from watchlist
   */
  static async removeFromWatchlist(userId, movieId) {
    const result = await pool.query(
      'DELETE FROM watchlist WHERE user_id = $1 AND movie_id = $2 RETURNING id',
      [userId, movieId]
    );
    return result.rowCount > 0;
  }

  /**
   * Clear user's entire watchlist
   */
  static async clearWatchlist(userId) {
    const result = await pool.query(
      'DELETE FROM watchlist WHERE user_id = $1 RETURNING id',
      [userId]
    );
    return result.rowCount;
  }

  /**
   * Get watchlist count for a user
   */
  static async getWatchlistCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM watchlist WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0]?.count) || 0;
  }
}

export default WatchlistModel;
