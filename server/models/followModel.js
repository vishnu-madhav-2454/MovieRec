import pool from '../db/index.js';

/**
 * Follow Model - PostgreSQL Implementation
 * Handles follow/following relationships
 */
class FollowModel {
  
  /**
   * Follow a user
   */
  static async follow(followerId, followingId) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const result = await pool.query(
      `INSERT INTO user_follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING
       RETURNING *`,
      [followerId, followingId]
    );

    return result.rows[0];
  }

  /**
   * Unfollow a user
   */
  static async unfollow(followerId, followingId) {
    const result = await pool.query(
      `DELETE FROM user_follows 
       WHERE follower_id = $1 AND following_id = $2
       RETURNING id`,
      [followerId, followingId]
    );

    return result.rows.length > 0;
  }

  /**
   * Check if user1 follows user2
   */
  static async isFollowing(followerId, followingId) {
    const result = await pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM user_follows 
        WHERE follower_id = $1 AND following_id = $2
      ) as is_following`,
      [followerId, followingId]
    );

    return result.rows[0]?.is_following || false;
  }

  /**
   * Get users that a user is following
   */
  static async getFollowing(userId, { limit = 50, offset = 0 } = {}) {
    const result = await pool.query(
      `SELECT u.id, u.username, u.bio, u.avatar_url, uf.created_at as followed_at
       FROM user_follows uf
       JOIN users u ON uf.following_id = u.id
       WHERE uf.follower_id = $1
       ORDER BY uf.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  /**
   * Get users that follow a user (followers)
   */
  static async getFollowers(userId, { limit = 50, offset = 0 } = {}) {
    const result = await pool.query(
      `SELECT u.id, u.username, u.bio, u.avatar_url, uf.created_at as followed_at
       FROM user_follows uf
       JOIN users u ON uf.follower_id = u.id
       WHERE uf.following_id = $1
       ORDER BY uf.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  /**
   * Get follow counts for a user
   */
  static async getFollowCounts(userId) {
    const result = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM user_follows WHERE follower_id = $1) as following_count,
        (SELECT COUNT(*) FROM user_follows WHERE following_id = $1) as followers_count`,
      [userId]
    );

    return {
      following: parseInt(result.rows[0]?.following_count || 0),
      followers: parseInt(result.rows[0]?.followers_count || 0)
    };
  }

  /**
   * Get mutual follows (users who follow each other)
   */
  static async getMutualFollows(userId) {
    const result = await pool.query(
      `SELECT u.id, u.username, u.bio, u.avatar_url
       FROM users u
       WHERE EXISTS (
         SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = u.id
       )
       AND EXISTS (
         SELECT 1 FROM user_follows WHERE follower_id = u.id AND following_id = $1
       )
       ORDER BY u.username`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Get suggested users to follow (users with mutual connections)
   */
  static async getSuggestions(userId, { limit = 10 } = {}) {
    const result = await pool.query(
      `SELECT DISTINCT u.id, u.username, u.bio, u.avatar_url,
        COUNT(*) as mutual_count
       FROM users u
       JOIN user_follows uf1 ON u.id = uf1.following_id
       WHERE uf1.follower_id IN (
         SELECT following_id FROM user_follows WHERE follower_id = $1
       )
       AND u.id != $1
       AND NOT EXISTS (
         SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = u.id
       )
       GROUP BY u.id, u.username, u.bio, u.avatar_url
       ORDER BY mutual_count DESC, u.username
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }
}

export default FollowModel;
