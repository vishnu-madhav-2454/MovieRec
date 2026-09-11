import pool from '../db/index.js';

/**
 * Review Model - PostgreSQL Implementation
 * Handles all review data operations with social features
 */
class ReviewModel {
  
  /**
   * Get all reviews with pagination and sorting
   */
  static async getAll({ limit = 10, offset = 0, sort = 'recent' } = {}) {
    let orderBy = 'r.created_at DESC';
    
    if (sort === 'popular') {
      orderBy = '(r.likes_count * 2 + r.helpful_count) DESC, r.created_at DESC';
    } else if (sort === 'rating_high') {
      orderBy = 'r.rating DESC, r.created_at DESC';
    } else if (sort === 'rating_low') {
      orderBy = 'r.rating ASC, r.created_at DESC';
    }

    const result = await pool.query(
      `SELECT r.*, u.username, u.avatar_url,
        COALESCE(
          json_agg(
            json_build_object('id', rc.id, 'user_id', rc.user_id, 'username', cu.username, 'content', rc.content, 'created_at', rc.created_at)
            ORDER BY rc.created_at DESC
          ) FILTER (WHERE rc.id IS NOT NULL), '[]'
        ) as comments
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN review_comments rc ON r.id = rc.review_id
       LEFT JOIN users cu ON rc.user_id = cu.id
       GROUP BY r.id, u.username, u.avatar_url
       ORDER BY ${orderBy}
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return result.rows;
  }

  /**
   * Find review by ID
   */
  static async findById(id) {
    const result = await pool.query(
      `SELECT r.*, u.username, u.avatar_url,
        COALESCE(
          json_agg(
            json_build_object('id', rc.id, 'user_id', rc.user_id, 'username', cu.username, 'content', rc.content, 'created_at', rc.created_at)
            ORDER BY rc.created_at DESC
          ) FILTER (WHERE rc.id IS NOT NULL), '[]'
        ) as comments
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN review_comments rc ON r.id = rc.review_id
       LEFT JOIN users cu ON rc.user_id = cu.id
       WHERE r.id = $1
       GROUP BY r.id, u.username, u.avatar_url`,
      [id]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Find reviews by movie ID with user context
   */
  static async findByMovieId(movieId, { sort = 'popular', userId = null } = {}) {
    let orderBy = '(r.likes_count * 2 + r.helpful_count) DESC';
    
    if (sort === 'recent') {
      orderBy = 'r.created_at DESC';
    } else if (sort === 'rating_high') {
      orderBy = 'r.rating DESC, r.created_at DESC';
    } else if (sort === 'rating_low') {
      orderBy = 'r.rating ASC, r.created_at DESC';
    }

    const result = await pool.query(
      `SELECT r.*, u.username, u.avatar_url,
        ${userId ? `EXISTS(SELECT 1 FROM review_likes WHERE review_id = r.id AND user_id = $3) as is_liked,` : 'false as is_liked,'}
        ${userId ? `EXISTS(SELECT 1 FROM review_helpful WHERE review_id = r.id AND user_id = $3) as is_helpful,` : 'false as is_helpful,'}
        COALESCE(
          json_agg(
            json_build_object('id', rc.id, 'user_id', rc.user_id, 'username', cu.username, 'content', rc.content, 'created_at', rc.created_at)
            ORDER BY rc.created_at DESC
          ) FILTER (WHERE rc.id IS NOT NULL), '[]'
        ) as comments
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN review_comments rc ON r.id = rc.review_id
       LEFT JOIN users cu ON rc.user_id = cu.id
       WHERE r.movie_id = $1
       GROUP BY r.id, u.username, u.avatar_url
       ORDER BY ${orderBy}
       LIMIT $2`,
      userId ? [movieId, 50, userId] : [movieId, 50]
    );
    
    return result.rows;
  }

  /**
   * Find review by user and movie ID
   */
  static async findByUserAndMovie(userId, movieId) {
    const result = await pool.query(
      `SELECT r.*, u.username, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.user_id = $1 AND r.movie_id = $2`,
      [userId, movieId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find reviews by user ID
   */
  static async findByUserId(userId) {
    const result = await pool.query(
      `SELECT r.*, u.username, u.avatar_url,
        COALESCE(
          json_agg(
            json_build_object('id', rc.id, 'user_id', rc.user_id, 'username', cu.username, 'content', rc.content, 'created_at', rc.created_at)
            ORDER BY rc.created_at DESC
          ) FILTER (WHERE rc.id IS NOT NULL), '[]'
        ) as comments
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN review_comments rc ON r.id = rc.review_id
       LEFT JOIN users cu ON rc.user_id = cu.id
       WHERE r.user_id = $1
       GROUP BY r.id, u.username, u.avatar_url
       ORDER BY r.created_at DESC`,
      [userId]
    );
    
    return result.rows;
  }

  /**
   * Create a new review
   */
  static async create(reviewData) {
    const { user_id, movie_id, movie_title, movie_poster, rating, content, vibes, has_spoilers } = reviewData;
    
    const result = await pool.query(
      `INSERT INTO reviews (user_id, movie_id, movie_title, movie_poster, rating, content, vibes, has_spoilers, likes_count, helpful_count, comments_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, 0)
       RETURNING *`,
      [user_id, movie_id, movie_title, movie_poster || null, rating, content, vibes || [], has_spoilers || false]
    );

    const userResult = await pool.query('SELECT username, avatar_url FROM users WHERE id = $1', [user_id]);
    
    return {
      ...result.rows[0],
      username: userResult.rows[0]?.username,
      avatar_url: userResult.rows[0]?.avatar_url,
      comments: []
    };
  }

  /**
   * Update a review
   */
  static async update(id, arg2, arg3) {
    let userId = null;
    let updates = arg2;
    if (arg3 !== undefined) {
      userId = arg2;
      updates = arg3;
    }
    const { rating, content, vibes, has_spoilers, movie_title, movie_poster } = updates || {};
    
    const result = await pool.query(
      `UPDATE reviews 
       SET rating = COALESCE($1, rating),
           content = COALESCE($2, content),
           vibes = COALESCE($3, vibes),
           has_spoilers = COALESCE($4, has_spoilers),
           movie_title = COALESCE($5, movie_title),
           movie_poster = COALESCE($6, movie_poster),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 ${userId ? 'AND user_id = $8' : ''}
       RETURNING *`,
      userId 
        ? [rating, content, vibes, has_spoilers, movie_title, movie_poster, id, userId]
        : [rating, content, vibes, has_spoilers, movie_title, movie_poster, id]
    );

    if (!result.rows[0]) return null;
    const userResult = await pool.query('SELECT username, avatar_url FROM users WHERE id = $1', [result.rows[0].user_id]);
    
    return {
      ...result.rows[0],
      username: userResult.rows[0]?.username,
      avatar_url: userResult.rows[0]?.avatar_url,
      comments: []
    };
  }

  /**
   * Delete a review
   */
  static async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    
    return result.rows.length > 0;
  }

  /**
   * Toggle like on a review
   */
  static async toggleLike(reviewId, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const removed = await client.query(
        'DELETE FROM review_likes WHERE review_id = $1 AND user_id = $2 RETURNING id',
        [reviewId, userId]
      );
      const isLiked = removed.rowCount === 0;
      if (isLiked) {
        await client.query(
          'INSERT INTO review_likes (review_id, user_id) VALUES ($1, $2) ON CONFLICT (review_id, user_id) DO NOTHING',
          [reviewId, userId]
        );
      }
      
      // Update count
      const countResult = await client.query(
        `UPDATE reviews 
         SET likes_count = (SELECT COUNT(*) FROM review_likes WHERE review_id = $1)
         WHERE id = $1
         RETURNING likes_count`,
        [reviewId]
      );
      
      await client.query('COMMIT');
      
      return {
        isLiked,
        likes_count: countResult.rows[0]?.likes_count || 0
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Toggle helpful vote on a review
   */
  static async toggleHelpful(reviewId, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const existingVote = await client.query(
        'SELECT id FROM review_helpful WHERE review_id = $1 AND user_id = $2',
        [reviewId, userId]
      );
      
      let isHelpful;
      if (existingVote.rows.length > 0) {
        await client.query(
          'DELETE FROM review_helpful WHERE review_id = $1 AND user_id = $2',
          [reviewId, userId]
        );
        isHelpful = false;
      } else {
        await client.query(
          'INSERT INTO review_helpful (review_id, user_id) VALUES ($1, $2)',
          [reviewId, userId]
        );
        isHelpful = true;
      }
      
      const countResult = await client.query(
        `UPDATE reviews 
         SET helpful_count = (SELECT COUNT(*) FROM review_helpful WHERE review_id = $1)
         WHERE id = $1
         RETURNING helpful_count`,
        [reviewId]
      );
      
      await client.query('COMMIT');
      
      return {
        isHelpful,
        helpful_count: countResult.rows[0]?.helpful_count || 0
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add comment to a review
   */
  static async addComment(reviewId, userId, username, content) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const commentResult = await client.query(
        `INSERT INTO review_comments (review_id, user_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [reviewId, userId, content]
      );
      
      await client.query(
        `UPDATE reviews 
         SET comments_count = (SELECT COUNT(*) FROM review_comments WHERE review_id = $1)
         WHERE id = $1`,
        [reviewId]
      );
      
      await client.query('COMMIT');
      
      return {
        ...commentResult.rows[0],
        username
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get average rating for a movie
   */
  static async getAverageRating(movieId) {
    const result = await pool.query(
      'SELECT AVG(rating) as avg_rating FROM reviews WHERE movie_id = $1',
      [movieId]
    );
    
    return parseFloat(result.rows[0]?.avg_rating || 0);
  }

  /**
   * Get review count for a movie
   */
  static async getReviewCount(movieId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM reviews WHERE movie_id = $1',
      [movieId]
    );
    
    return parseInt(result.rows[0]?.count || 0);
  }

  /**
   * Get review stats for a movie
   */
  static async getMovieStats(movieId) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as review_count,
        AVG(rating) as avg_rating,
        COUNT(*) FILTER (WHERE rating >= 4.5) as five_star_count,
        COUNT(*) FILTER (WHERE rating >= 3.5 AND rating < 4.5) as four_star_count,
        COUNT(*) FILTER (WHERE rating >= 2.5 AND rating < 3.5) as three_star_count,
        COUNT(*) FILTER (WHERE rating >= 1.5 AND rating < 2.5) as two_star_count,
        COUNT(*) FILTER (WHERE rating < 1.5) as one_star_count
       FROM reviews 
       WHERE movie_id = $1`,
      [movieId]
    );
    
    return result.rows[0];
  }

  /**
   * Search reviews by content or movie title
   */
  static async search(query) {
    const searchTerm = `%${query}%`;
    const result = await pool.query(
      `SELECT r.*, u.username, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.content ILIKE $1 OR r.movie_title ILIKE $1
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [searchTerm]
    );
    return result.rows;
  }
}

export default ReviewModel;
