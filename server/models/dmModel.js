import pool from '../db/index.js';

/**
 * DM Model - Handles direct messaging operations using PostgreSQL
 */
class DmModel {
  
  /**
   * Get all conversations for a user
   */
  static async getConversations(userId) {
    const uid = parseInt(userId);
    const result = await pool.query(`
      SELECT DISTINCT ON (partner_id)
        partner_id,
        u.username as other_username,
        u.avatar_url as other_avatar,
        dm.content as last_message,
        dm.created_at as last_message_time,
        dm.meme_id as last_meme_id,
        dm.sender_id as last_sender_id
      FROM (
        SELECT 
          CASE 
            WHEN sender_id = $1 THEN receiver_id 
            ELSE sender_id 
          END as partner_id,
          id, content, meme_id, sender_id, created_at
        FROM direct_messages
        WHERE sender_id = $1 OR receiver_id = $1
      ) dm
      JOIN users u ON u.id = dm.partner_id
      ORDER BY partner_id, dm.created_at DESC
    `, [uid]);

    // Get unread counts per sender
    const unreadResult = await pool.query(`
      SELECT sender_id, COUNT(*)::int as count
      FROM direct_messages
      WHERE receiver_id = $1 AND is_read = FALSE
      GROUP BY sender_id
    `, [uid]);

    const unreadMap = {};
    for (const row of unreadResult.rows) {
      unreadMap[row.sender_id] = row.count;
    }

    const conversations = result.rows.map(row => ({
      user_id: row.partner_id,
      id: row.partner_id,
      username: row.other_username,
      avatar_url: row.other_avatar,
      last_message: row.last_message || (row.last_meme_id ? '🎬 Sent a meme' : ''),
      last_message_time: row.last_message_time,
      unread_count: unreadMap[row.partner_id] || 0
    }));

    // Sort conversations by most recent message
    conversations.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
    return conversations;
  }

  /**
   * Get messages between two users
   */
  static async getMessagesBetweenUsers(userId, otherUserId, page = 1, limit = 100) {
    const uid = parseInt(userId);
    const otherId = parseInt(otherUserId);
    const offset = (page - 1) * limit;
    
    const result = await pool.query(`
      SELECT 
        dm.*, 
        u.username as sender_username,
        u.avatar_url as sender_avatar,
        -- Meme details
        m.image_url as meme_image,
        m.caption as meme_caption,
        m.movie_id as meme_movie_id,
        m.movie_title as meme_movie_title,
        m.likes_count as meme_likes_count,
        m.comments_count as meme_comments_count,
        -- Review details
        r.movie_id as review_movie_id,
        r.movie_title as review_movie_title,
        r.movie_poster as review_movie_poster,
        r.rating as review_rating,
        r.content as review_content,
        r.vibes as review_vibes,
        r.has_spoilers as review_has_spoilers,
        ru.username as review_author
      FROM direct_messages dm
      JOIN users u ON dm.sender_id = u.id
      LEFT JOIN memes m ON dm.meme_id = m.id
      LEFT JOIN reviews r ON dm.review_id = r.id
      LEFT JOIN users ru ON r.user_id = ru.id
      WHERE (dm.sender_id = $1 AND dm.receiver_id = $2)
         OR (dm.sender_id = $2 AND dm.receiver_id = $1)
      ORDER BY dm.created_at ASC
      LIMIT $3 OFFSET $4
    `, [uid, otherId, limit, offset]);

    // Mark received messages as read
    await pool.query(`
      UPDATE direct_messages
      SET is_read = TRUE
      WHERE sender_id = $2 AND receiver_id = $1 AND is_read = FALSE
    `, [uid, otherId]);

    return result.rows;
  }

  /**
   * Send a message
   */
  static async sendMessage(senderId, receiverId, content, memeId = null, reviewId = null) {
    const sId = parseInt(senderId);
    const rId = parseInt(receiverId);
    const mId = memeId ? parseInt(memeId) : null;
    const revId = reviewId ? parseInt(reviewId) : null;

    const result = await pool.query(`
      INSERT INTO direct_messages (sender_id, receiver_id, content, meme_id, review_id, is_read)
      VALUES ($1, $2, $3, $4, $5, FALSE)
      RETURNING *
    `, [sId, rId, content || '', mId, revId]);

    const created = result.rows[0];

    // Enrich with sender, meme & review info
    const senderResult = await pool.query('SELECT username, avatar_url FROM users WHERE id = $1', [sId]);
    let memeInfo = {};
    if (mId) {
      const memeRes = await pool.query('SELECT image_url as meme_image, caption as meme_caption, movie_id as meme_movie_id, movie_title as meme_movie_title, likes_count as meme_likes_count, comments_count as meme_comments_count FROM memes WHERE id = $1', [mId]);
      if (memeRes.rows[0]) memeInfo = memeRes.rows[0];
    }

    let reviewInfo = {};
    if (revId) {
      const revRes = await pool.query(`
        SELECT r.movie_id as review_movie_id, r.movie_title as review_movie_title, r.movie_poster as review_movie_poster, r.rating as review_rating, r.content as review_content, r.vibes as review_vibes, r.has_spoilers as review_has_spoilers, u.username as review_author
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.id = $1
      `, [revId]);
      if (revRes.rows[0]) reviewInfo = revRes.rows[0];
    }

    return {
      ...created,
      sender_username: senderResult.rows[0]?.username,
      sender_avatar: senderResult.rows[0]?.avatar_url,
      ...memeInfo,
      ...reviewInfo
    };
  }

  /**
   * Get unread message count
   */
  static async getUnreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*)::int as count FROM direct_messages WHERE receiver_id = $1 AND is_read = FALSE',
      [parseInt(userId)]
    );
    return result.rows[0]?.count || 0;
  }
}

export default DmModel;
