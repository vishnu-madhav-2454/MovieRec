import pool from '../db/index.js';

/**
 * Notification Model - PostgreSQL Implementation
 * Handles all notification operations
 */
class NotificationModel {
  
  /**
   * Create a notification
   */
  static async create(data) {
    const { user_id, type, actor_id, entity_type, entity_id, content } = data;
    
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, actor_id, entity_type, entity_id, content)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, type, actor_id || null, entity_type || null, entity_id || null, content || null]
    );
    
    return result.rows[0];
  }

  /**
   * Get notifications for a user
   */
  static async getForUser(userId, { limit = 50, offset = 0 } = {}) {
    const result = await pool.query(
      `SELECT n.*, 
        u.username as actor_username,
        u.avatar_url as actor_avatar
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return result.rows;
  }

  /**
   * Get unread count for a user
   */
  static async unreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    
    return parseInt(result.rows[0]?.count || 0);
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    
    return result.rows[0];
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllRead(userId) {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    
    return this.getForUser(userId);
  }

  /**
   * Delete a notification
   */
  static async delete(notificationId, userId) {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, userId]
    );
    
    return result.rows.length > 0;
  }

  /**
   * Helper: Create notification for review like
   */
  static async notifyReviewLike(reviewUserId, actorId, reviewId, movieTitle) {
    if (reviewUserId === actorId) return; // Don't notify yourself
    
    return this.create({
      user_id: reviewUserId,
      type: 'review_like',
      actor_id: actorId,
      entity_type: 'review',
      entity_id: reviewId,
      content: `liked your review of ${movieTitle}`
    });
  }

  /**
   * Helper: Create notification for review comment
   */
  static async notifyReviewComment(reviewUserId, actorId, reviewId, movieTitle) {
    if (reviewUserId === actorId) return;
    
    return this.create({
      user_id: reviewUserId,
      type: 'review_comment',
      actor_id: actorId,
      entity_type: 'review',
      entity_id: reviewId,
      content: `commented on your review of ${movieTitle}`
    });
  }

  /**
   * Helper: Create notification for follow
   */
  static async notifyFollow(followedUserId, followerId) {
    return this.create({
      user_id: followedUserId,
      type: 'follow',
      actor_id: followerId,
      entity_type: 'user',
      entity_id: followerId,
      content: 'started following you'
    });
  }

  /**
   * Helper: Create notification for meme like
   */
  static async notifyMemeLike(memeUserId, actorId, memeId) {
    if (memeUserId === actorId) return;
    
    return this.create({
      user_id: memeUserId,
      type: 'meme_like',
      actor_id: actorId,
      entity_type: 'meme',
      entity_id: memeId,
      content: 'liked your meme'
    });
  }

  /**
   * Helper: Create notification for meme comment
   */
  static async notifyMemeComment(memeUserId, actorId, memeId) {
    if (memeUserId === actorId) return;
    
    return this.create({
      user_id: memeUserId,
      type: 'meme_comment',
      actor_id: actorId,
      entity_type: 'meme',
      entity_id: memeId,
      content: 'commented on your meme'
    });
  }

  /**
   * Helper: Create notification for post like
   */
  static async notifyPostLike(postUserId, actorId, postId) {
    if (postUserId === actorId) return;
    
    return this.create({
      user_id: postUserId,
      type: 'post_like',
      actor_id: actorId,
      entity_type: 'post',
      entity_id: postId,
      content: 'liked your post'
    });
  }

  /**
   * Helper: Create notification for post comment
   */
  static async notifyPostComment(postUserId, actorId, postId) {
    if (postUserId === actorId) return;
    
    return this.create({
      user_id: postUserId,
      type: 'post_comment',
      actor_id: actorId,
      entity_type: 'post',
      entity_id: postId,
      content: 'commented on your post'
    });
  }

  /**
   * Helper: Create notification for direct message
   */
  static async notifyDirectMessage(receiverId, senderId) {
    return this.create({
      user_id: receiverId,
      type: 'direct_message',
      actor_id: senderId,
      entity_type: 'message',
      entity_id: null,
      content: 'sent you a message'
    });
  }
}

export default NotificationModel;
