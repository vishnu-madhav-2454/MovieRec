import pool from '../db/index.js';

/**
 * Meme Model - Handles all meme data operations using PostgreSQL
 */
class MemeModel {
  
  /**
   * Get all memes (Reels-style feed)
   */
  static async getMemes(page = 1, limit = 10, userId = null) {
    const offset = (page - 1) * limit;
    
    const result = await pool.query(`
      SELECT m.*, u.username, u.avatar_url as user_avatar,
        (SELECT COUNT(*) FROM meme_likes WHERE meme_id = m.id) as likes_count,
        (SELECT COUNT(*) FROM meme_comments WHERE meme_id = m.id) as comments_count,
        EXISTS(SELECT 1 FROM meme_likes WHERE meme_id = m.id AND user_id = $1) as is_liked
      FROM memes m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    return result.rows.map(row => this.formatMeme(row, userId));
  }

  /**
   * Get meme by ID
   */
  static async getMemeById(id, userId = null) {
    const result = await pool.query(`
      SELECT m.*, u.username, u.avatar_url as user_avatar,
        (SELECT COUNT(*) FROM meme_likes WHERE meme_id = m.id) as likes_count,
        (SELECT COUNT(*) FROM meme_comments WHERE meme_id = m.id) as comments_count,
        EXISTS(SELECT 1 FROM meme_likes WHERE meme_id = m.id AND user_id = $2) as is_liked
      FROM memes m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = $1
    `, [id, userId]);

    return result.rows[0] ? this.formatMeme(result.rows[0], userId) : null;
  }

  /**
   * Create a new meme
   */
  static async createMeme(memeData) {
    const { user_id, image_url, image_public_id, caption, movie_id, movie_title, vibes } = memeData;
    
    const result = await pool.query(`
      INSERT INTO memes (user_id, image_url, image_public_id, caption, movie_id, movie_title, vibes, likes_count, comments_count, shares_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0)
      RETURNING *
    `, [user_id, image_url, image_public_id || null, caption || '', movie_id || null, movie_title || null, vibes || []]);

    // Get user info
    const userResult = await pool.query('SELECT username, avatar_url FROM users WHERE id = $1', [user_id]);
    const user = userResult.rows[0];

    return this.formatMeme({
      ...result.rows[0],
      username: user?.username,
      user_avatar: user?.avatar_url,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      is_liked: false
    });
  }

  /**
   * Toggle like on a meme
   */
  static async toggleLike(memeId, userId) {
    const existing = await pool.query(
      'SELECT * FROM meme_likes WHERE meme_id = $1 AND user_id = $2',
      [memeId, userId]
    );

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM meme_likes WHERE meme_id = $1 AND user_id = $2', [memeId, userId]);
      await pool.query('UPDATE memes SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1', [memeId]);
      return { isLiked: false };
    } else {
      await pool.query('INSERT INTO meme_likes (meme_id, user_id) VALUES ($1, $2)', [memeId, userId]);
      await pool.query('UPDATE memes SET likes_count = likes_count + 1 WHERE id = $1', [memeId]);
      return { isLiked: true };
    }
  }

  /**
   * Add comment to a meme
   */
  static async addComment(memeId, { userId, username, content }) {
    const result = await pool.query(`
      INSERT INTO meme_comments (meme_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [memeId, userId, content]);

    await pool.query('UPDATE memes SET comments_count = comments_count + 1 WHERE id = $1', [memeId]);

    return {
      ...result.rows[0],
      username
    };
  }

  /**
   * Get comments for a meme
   */
  static async getComments(memeId) {
    const result = await pool.query(`
      SELECT c.*, u.username
      FROM meme_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.meme_id = $1
      ORDER BY c.created_at ASC
    `, [memeId]);
    return result.rows;
  }

  /**
   * Share a meme (increment share count)
   */
  static async shareMeme(memeId) {
    await pool.query('UPDATE memes SET shares_count = shares_count + 1 WHERE id = $1', [memeId]);
    const result = await pool.query('SELECT shares_count FROM memes WHERE id = $1', [memeId]);
    return { shares_count: result.rows[0]?.shares_count || 0 };
  }

  /**
   * Get memes by user
   */
  static async getMemesByUser(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const result = await pool.query(`
      SELECT m.*, u.username, u.avatar_url as user_avatar
      FROM memes m
      JOIN users u ON m.user_id = u.id
      WHERE m.user_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    return result.rows.map(row => this.formatMeme(row));
  }

  /**
   * Delete a meme
   */
  static async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM memes WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Format meme for API response
   */
  static formatMeme(row, userId = null) {
    return {
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      user_avatar: row.user_avatar,
      image_url: row.image_url,
      caption: row.caption,
      movie_id: row.movie_id,
      movie_title: row.movie_title,
      vibes: row.vibes || [],
      likes_count: parseInt(row.likes_count) || 0,
      comments_count: parseInt(row.comments_count) || 0,
      shares_count: parseInt(row.shares_count) || 0,
      is_liked: row.is_liked || false,
      created_at: row.created_at
    };
  }
}

export default MemeModel;
