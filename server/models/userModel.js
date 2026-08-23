import pool from '../db/index.js';

/**
 * User Model - Handles all user data operations using PostgreSQL
 */
class UserModel {
  
  /**
   * Find user by ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by Firebase UID
   */
  static async findByFirebaseUid(uid) {
    const result = await pool.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [uid]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all users
   */
  static async findAll() {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    const { firebase_uid, username, email, avatar_url, bio } = userData;
    
    const result = await pool.query(
      `INSERT INTO users (firebase_uid, username, email, avatar_url, bio)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [firebase_uid || null, username, email, avatar_url || null, bio || '']
    );
    
    return result.rows[0];
  }

  /**
   * Update user
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete user
   */
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * Get user statistics
   */
  static async getStats(userId) {
    // Get review count
    const reviewResult = await pool.query(
      'SELECT COUNT(*) as count FROM reviews WHERE user_id = $1',
      [userId]
    );

    // Get watchlist count
    const watchlistResult = await pool.query(
      'SELECT COUNT(*) as count FROM watchlist WHERE user_id = $1',
      [userId]
    );

    // Get watched films count
    const watchedResult = await pool.query(
      'SELECT COUNT(*) as count FROM watched_films WHERE user_id = $1',
      [userId]
    );

    // Get favorites count
    const favoritesResult = await pool.query(
      'SELECT COUNT(*) as count FROM favorite_films WHERE user_id = $1',
      [userId]
    );

    // Get following count
    const followingResult = await pool.query(
      'SELECT COUNT(*) as count FROM user_follows WHERE follower_id = $1',
      [userId]
    );

    // Get followers count
    const followersResult = await pool.query(
      'SELECT COUNT(*) as count FROM user_follows WHERE following_id = $1',
      [userId]
    );

    return {
      reviews: parseInt(reviewResult.rows[0]?.count || 0),
      watchlist: parseInt(watchlistResult.rows[0]?.count || 0),
      watched: parseInt(watchedResult.rows[0]?.count || 0),
      favorites: parseInt(favoritesResult.rows[0]?.count || 0),
      following: parseInt(followingResult.rows[0]?.count || 0),
      followers: parseInt(followersResult.rows[0]?.count || 0)
    };
  }

  /**
   * Get watched films for a user
   */
  static async getWatchedFilms(userId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT * FROM watched_films 
       WHERE user_id = $1 
       ORDER BY watched_at DESC NULLS LAST, created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Add film to watched
   */
  static async addToWatched(userId, movie) {
    const result = await pool.query(
      `INSERT INTO watched_films (user_id, movie_id, movie_title, movie_poster, rating, watched_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, movie_id) 
       DO UPDATE SET rating = $5, watched_at = $6
       RETURNING *`,
      [userId, movie.id, movie.title, movie.poster_path, movie.rating || null, movie.watched_at || new Date()]
    );
    return result.rows[0];
  }

  /**
   * Remove film from watched
   */
  static async removeFromWatched(userId, movieId) {
    const result = await pool.query(
      'DELETE FROM watched_films WHERE user_id = $1 AND movie_id = $2 RETURNING id',
      [userId, movieId]
    );
    return result.rows.length > 0;
  }

  /**
   * Get favorite films for a user (max 4)
   */
  static async getFavoriteFilms(userId) {
    const result = await pool.query(
      `SELECT * FROM favorite_films 
       WHERE user_id = $1 
       ORDER BY position ASC
       LIMIT 4`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Add film to favorites
   */
  static async addToFavorites(userId, movie) {
    // Check if already has 4 favorites
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM favorite_films WHERE user_id = $1',
      [userId]
    );

    const position = parseInt(countResult.rows[0].count, 10);
    if (position >= 4) {
      throw new Error('Maximum 4 favorite films allowed');
    }

    const result = await pool.query(
      `INSERT INTO favorite_films (user_id, movie_id, movie_title, movie_poster, position)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, movie_id) DO NOTHING
       RETURNING *`,
      [userId, movie.id, movie.title, movie.poster_path, position]
    );
    return result.rows[0];
  }

  /**
   * Remove film from favorites
   */
  static async removeFromFavorites(userId, movieId) {
    const result = await pool.query(
      'DELETE FROM favorite_films WHERE user_id = $1 AND movie_id = $2 RETURNING id',
      [userId, movieId]
    );
    return result.rows.length > 0;
  }

  /**
   * Create or update user by Firebase UID
   */
  static async createOrUpdateFromFirebase(firebaseUid, email, name, picture) {
    // Check if user exists
    let user = await this.findByFirebaseUid(firebaseUid);
    
    if (user) {
      // Update existing user
      user = await this.update(user.id, {
        username: name || user.username,
        avatar_url: picture || user.avatar_url
      });
      return user;
    }

    // Check if user exists by email (for migration purposes)
    user = await this.findByEmail(email);
    
    if (user) {
      // Link existing user to Firebase
      user = await this.update(user.id, {
        firebase_uid: firebaseUid,
        username: name || user.username,
        avatar_url: picture || user.avatar_url
      });
      return user;
    }

    // Create new user
    return this.create({
      firebase_uid: firebaseUid,
      username: name || email.split('@')[0],
      email: email,
      avatar_url: picture,
      bio: 'Film enthusiast'
    });
  }

  /**
   * Search users by username or bio
   */
  static async search(query) {
    const searchTerm = `%${query}%`;
    const result = await pool.query(
      `SELECT * FROM users 
       WHERE username ILIKE $1 OR bio ILIKE $1
       ORDER BY username ASC
       LIMIT 20`,
      [searchTerm]
    );
    return result.rows;
  }
}

export default UserModel;
