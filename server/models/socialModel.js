import pool from '../db/index.js';

/**
 * Social Model - Handles all social feed and follow operations using PostgreSQL
 */
class SocialModel {
  
  /**
   * Get social feed (posts & reviews from all users or followed users)
   */
  static async getFeed(userId, page = 1, limit = 30, filter = 'all') {
    const uid = parseInt(userId) || 1;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    if (filter === 'following') {
      whereClause = `WHERE all_items.user_id IN (SELECT following_id FROM user_follows WHERE follower_id = $1) OR all_items.user_id = $1`;
    }

    const result = await pool.query(`
      SELECT * FROM (
        -- Social posts
        SELECT 
          p.id, 
          'post' as post_type,
          p.user_id, 
          p.content, 
          p.movie_id, 
          p.movie_title, 
          p.movie_poster, 
          p.rating, 
          p.vibes, 
          p.has_spoilers, 
          p.created_at,
          u.username, 
          u.avatar_url as user_avatar,
          (SELECT COUNT(*)::int FROM post_likes WHERE post_id = p.id) as likes_count,
          (SELECT COUNT(*)::int FROM post_comments WHERE post_id = p.id) as comments_count,
          EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as is_liked
        FROM social_posts p
        JOIN users u ON p.user_id = u.id

        UNION ALL

        -- Reviews written on movies
        SELECT 
          (100000 + r.id) as id,
          'review' as post_type,
          r.user_id, 
          r.content, 
          r.movie_id, 
          r.movie_title, 
          r.movie_poster, 
          r.rating, 
          r.vibes, 
          r.has_spoilers, 
          r.created_at,
          u.username, 
          u.avatar_url as user_avatar,
          COALESCE(r.likes_count, 0)::int as likes_count,
          COALESCE(r.comments_count, 0)::int as comments_count,
          EXISTS(SELECT 1 FROM review_likes WHERE review_id = r.id AND user_id = $1) as is_liked
        FROM reviews r
        JOIN users u ON r.user_id = u.id
      ) all_items
      ${whereClause}
      ORDER BY all_items.created_at DESC
      LIMIT $2 OFFSET $3
    `, [uid, limit, offset]);

    return result.rows.map(row => this.formatPost(row, uid));
  }

  /**
   * Get all public posts & reviews (for guests)
   */
  static async getPublicFeed(page = 1, limit = 30) {
    const offset = (page - 1) * limit;
    
    const result = await pool.query(`
      SELECT * FROM (
        SELECT 
          p.id, 
          'post' as post_type,
          p.user_id, 
          p.content, 
          p.movie_id, 
          p.movie_title, 
          p.movie_poster, 
          p.rating, 
          p.vibes, 
          p.has_spoilers, 
          p.created_at,
          u.username, 
          u.avatar_url as user_avatar,
          (SELECT COUNT(*)::int FROM post_likes WHERE post_id = p.id) as likes_count,
          (SELECT COUNT(*)::int FROM post_comments WHERE post_id = p.id) as comments_count,
          FALSE as is_liked
        FROM social_posts p
        JOIN users u ON p.user_id = u.id

        UNION ALL

        SELECT 
          (100000 + r.id) as id,
          'review' as post_type,
          r.user_id, 
          r.content, 
          r.movie_id, 
          r.movie_title, 
          r.movie_poster, 
          r.rating, 
          r.vibes, 
          r.has_spoilers, 
          r.created_at,
          u.username, 
          u.avatar_url as user_avatar,
          COALESCE(r.likes_count, 0)::int as likes_count,
          COALESCE(r.comments_count, 0)::int as comments_count,
          FALSE as is_liked
        FROM reviews r
        JOIN users u ON r.user_id = u.id
      ) all_items
      ORDER BY all_items.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    return result.rows.map(row => this.formatPost(row));
  }

  /**
   * Get post by ID
   */
  static async getPostById(postId, userId = null) {
    const result = await pool.query(`
      SELECT p.*, u.username, u.avatar_url as user_avatar,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $2) as is_liked
      FROM social_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [postId, userId]);

    return result.rows[0] ? this.formatPost(result.rows[0], userId) : null;
  }

  /**
   * Create a new post
   */
  static async createPost(postData) {
    const { user_id, content, movie_id, movie_title, movie_poster, rating, vibes, has_spoilers } = postData;
    
    const result = await pool.query(`
      INSERT INTO social_posts (user_id, content, movie_id, movie_title, movie_poster, rating, vibes, has_spoilers)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [user_id, content, movie_id, movie_title, movie_poster, rating, vibes || [], has_spoilers || false]);

    // Get user info
    const userResult = await pool.query('SELECT username, avatar_url FROM users WHERE id = $1', [user_id]);
    const user = userResult.rows[0];

    return this.formatPost({
      ...result.rows[0],
      username: user?.username,
      user_avatar: user?.avatar_url,
      likes_count: 0,
      comments_count: 0,
      is_liked: false
    });
  }

  /**
   * Toggle like on a post or review
   */
  static async toggleLike(postId, userId) {
    const idNum = parseInt(postId);
    const uId = parseInt(userId);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const isReview = idNum >= 100000;
      const itemId = isReview ? idNum - 100000 : idNum;
      const table = isReview ? 'review_likes' : 'post_likes';
      const key = isReview ? 'review_id' : 'post_id';
      const removed = await client.query(`DELETE FROM ${table} WHERE ${key} = $1 AND user_id = $2 RETURNING id`, [itemId, uId]);
      const isLiked = removed.rowCount === 0;
      if (isLiked) {
        await client.query(`INSERT INTO ${table} (${key}, user_id) VALUES ($1, $2) ON CONFLICT (${key}, user_id) DO NOTHING`, [itemId, uId]);
      }
      const count = await client.query(`SELECT COUNT(*)::int AS likes_count FROM ${table} WHERE ${key} = $1`, [itemId]);
      const targetTable = isReview ? 'reviews' : 'social_posts';
      await client.query(`UPDATE ${targetTable} SET likes_count = $2 WHERE id = $1`, [itemId, count.rows[0].likes_count]);
      await client.query('COMMIT');
      return { isLiked, likes_count: count.rows[0].likes_count };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add comment to a post or review
   */
  static async addComment(postId, { userId, username, content }) {
    const idNum = parseInt(postId);
    const uId = parseInt(userId);

    if (idNum >= 100000) {
      const reviewId = idNum - 100000;
      const result = await pool.query(`
        INSERT INTO review_comments (review_id, user_id, content)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [reviewId, uId, content]);
      await pool.query('UPDATE reviews SET comments_count = comments_count + 1 WHERE id = $1', [reviewId]);
      return { ...result.rows[0], username };
    }

    const result = await pool.query(`
      INSERT INTO post_comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [idNum, uId, content]);

    await pool.query('UPDATE social_posts SET comments_count = comments_count + 1 WHERE id = $1', [idNum]);

    return {
      ...result.rows[0],
      username
    };
  }

  /**
   * Get comments for a post or review
   */
  static async getComments(postId) {
    const idNum = parseInt(postId);
    if (idNum >= 100000) {
      const reviewId = idNum - 100000;
      const result = await pool.query(`
        SELECT c.*, u.username, u.avatar_url
        FROM review_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.review_id = $1
        ORDER BY c.created_at ASC
      `, [reviewId]);
      return result.rows;
    }

    const result = await pool.query(`
      SELECT c.*, u.username, u.avatar_url
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [idNum]);
    return result.rows;
  }

  /**
   * Toggle follow relationship
   */
  static async toggleFollow(followerId, followingId) {
    if (followerId === followingId) {
      return { isFollowing: false, error: 'Cannot follow yourself' };
    }

    const existing = await pool.query(
      'SELECT * FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2', [followerId, followingId]);
      return { isFollowing: false };
    } else {
      await pool.query('INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)', [followerId, followingId]);
      return { isFollowing: true };
    }
  }

  /**
   * Check if user is following another
   */
  static async isFollowing(followerId, followingId) {
    const result = await pool.query(
      'SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
    return result.rows.length > 0;
  }

  /**
   * Get user's following list
   */
  static async getFollowing(userId) {
    const result = await pool.query(`
      SELECT u.id, u.username, u.avatar_url, u.bio
      FROM user_follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = $1
      ORDER BY u.username
    `, [userId]);
    return result.rows;
  }

  /**
   * Get user's followers list
   */
  static async getFollowers(userId) {
    const result = await pool.query(`
      SELECT u.id, u.username, u.avatar_url, u.bio
      FROM user_follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = $1
      ORDER BY u.username
    `, [userId]);
    return result.rows;
  }

  /**
   * Get follower/following counts
   */
  static async getFollowCounts(userId) {
    const followersResult = await pool.query(
      'SELECT COUNT(*) as count FROM user_follows WHERE following_id = $1',
      [userId]
    );
    const followingResult = await pool.query(
      'SELECT COUNT(*) as count FROM user_follows WHERE follower_id = $1',
      [userId]
    );
    return {
      followers: parseInt(followersResult.rows[0]?.count) || 0,
      following: parseInt(followingResult.rows[0]?.count) || 0
    };
  }

  /**
   * Format post for API response
   */
  static formatPost(row, userId = null) {
    return {
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      user_avatar: row.user_avatar,
      content: row.content,
      movie_id: row.movie_id,
      movie_title: row.movie_title,
      movie_poster: row.movie_poster,
      rating: row.rating ? parseFloat(row.rating) : null,
      vibes: row.vibes || [],
      has_spoilers: row.has_spoilers,
      likes_count: parseInt(row.likes_count) || 0,
      comments_count: parseInt(row.comments_count) || 0,
      is_liked: row.is_liked || false,
      created_at: row.created_at
    };
  }
}

export default SocialModel;
