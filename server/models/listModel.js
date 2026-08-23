import pool from '../db/index.js';

class ListModel {
  /**
   * Find all lists by user ID
   */
  static async findByUserId(userId) {
    const result = await pool.query(
      `SELECT l.*, 
        COUNT(lm.movie_id) as movie_count,
        COALESCE(SUM(ll.likes_count), 0) as likes_count
       FROM lists l
       LEFT JOIN list_movies lm ON l.id = lm.list_id
       LEFT JOIN (
         SELECT list_id, COUNT(*) as likes_count 
         FROM list_likes 
         GROUP BY list_id
       ) ll ON l.id = ll.list_id
       WHERE l.user_id = $1
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Find a single list by ID with movies
   */
  static async findById(listId) {
    const listResult = await pool.query(
      `SELECT l.*, u.username, u.avatar_url,
        COUNT(lm.movie_id) as movie_count
       FROM lists l
       JOIN users u ON l.user_id = u.id
       LEFT JOIN list_movies lm ON l.id = lm.list_id
       WHERE l.id = $1
       GROUP BY l.id, u.username, u.avatar_url`,
      [listId]
    );

    if (listResult.rows.length === 0) return null;

    const list = listResult.rows[0];

    // Get movies in the list
    const moviesResult = await pool.query(
      `SELECT movie_id, movie_title, movie_poster, added_at
       FROM list_movies
       WHERE list_id = $1
       ORDER BY added_at DESC`,
      [listId]
    );

    list.movies = moviesResult.rows;
    return list;
  }

  /**
   * Get all public lists (for discovery)
   */
  static async getPublic(limit = 20, offset = 0) {
    const result = await pool.query(
      `SELECT l.*, u.username, u.avatar_url,
        COUNT(lm.movie_id) as movie_count
       FROM lists l
       JOIN users u ON l.user_id = u.id
       LEFT JOIN list_movies lm ON l.id = lm.list_id
       WHERE l.is_public = true
       GROUP BY l.id, u.username, u.avatar_url
       ORDER BY l.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Create a new list
   */
  static async create(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO lists (user_id, title, description, is_public, is_collaborative)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [data.user_id, data.title || 'Untitled list', data.description || '', data.is_public !== false, data.is_collaborative || false]
      );

      const list = result.rows[0];

      // Add movies if provided
      if (data.movies && data.movies.length > 0) {
        for (const movie of data.movies) {
          await client.query(
            `INSERT INTO list_movies (list_id, movie_id, movie_title, movie_poster)
             VALUES ($1, $2, $3, $4)`,
            [list.id, movie.id, movie.title, movie.poster_path]
          );
        }
      }

      // Add collaborators if provided
      if (data.collaborators && data.collaborators.length > 0) {
        for (const collaboratorId of data.collaborators) {
          await client.query(
            `INSERT INTO list_collaborators (list_id, user_id, can_edit, can_add_movies, can_remove_movies)
             VALUES ($1, $2, true, true, true)`,
            [list.id, collaboratorId]
          );
        }
      }

      await client.query('COMMIT');
      return list;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add collaborator to a list
   */
  static async addCollaborator(listId, ownerId, collaboratorId, permissions = {}) {
    // Verify ownership
    const checkResult = await pool.query(
      'SELECT id FROM lists WHERE id = $1 AND user_id = $2',
      [listId, ownerId]
    );

    if (checkResult.rows.length === 0) {
      return null;
    }

    // Update list to be collaborative
    await pool.query(
      'UPDATE lists SET is_collaborative = true WHERE id = $1',
      [listId]
    );

    const result = await pool.query(
      `INSERT INTO list_collaborators (list_id, user_id, can_edit, can_add_movies, can_remove_movies, accepted_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (list_id, user_id) 
       DO UPDATE SET can_edit = $3, can_add_movies = $4, can_remove_movies = $5, accepted_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        listId, 
        collaboratorId, 
        permissions.can_edit !== false,
        permissions.can_add_movies !== false, 
        permissions.can_remove_movies !== false
      ]
    );

    return result.rows[0];
  }

  /**
   * Remove collaborator from a list
   */
  static async removeCollaborator(listId, ownerId, collaboratorId) {
    const result = await pool.query(
      `DELETE FROM list_collaborators 
       WHERE list_id = $1 AND user_id = $2
       AND EXISTS (SELECT 1 FROM lists WHERE id = $1 AND user_id = $3)
       RETURNING id`,
      [listId, collaboratorId, ownerId]
    );

    return result.rows.length > 0;
  }

  /**
   * Get collaborators for a list
   */
  static async getCollaborators(listId) {
    const result = await pool.query(
      `SELECT lc.*, u.username, u.avatar_url
       FROM list_collaborators lc
       JOIN users u ON lc.user_id = u.id
       WHERE lc.list_id = $1 AND lc.accepted_at IS NOT NULL
       ORDER BY lc.invited_at ASC`,
      [listId]
    );

    return result.rows;
  }

  /**
   * Check if user can edit a list (owner or collaborator with permission)
   */
  static async canUserEdit(listId, userId) {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM lists WHERE id = $1 AND user_id = $2
        UNION
        SELECT 1 FROM list_collaborators 
        WHERE list_id = $1 AND user_id = $2 AND can_edit = true AND accepted_at IS NOT NULL
      ) as can_edit`,
      [listId, userId]
    );

    return result.rows[0]?.can_edit || false;
  }

  /**
   * Check if user can add movies to a list
   */
  static async canUserAddMovies(listId, userId) {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM lists WHERE id = $1 AND user_id = $2
        UNION
        SELECT 1 FROM list_collaborators 
        WHERE list_id = $1 AND user_id = $2 AND can_add_movies = true AND accepted_at IS NOT NULL
      ) as can_add`,
      [listId, userId]
    );

    return result.rows[0]?.can_add || false;
  }

  /**
   * Update a list
   */
  static async update(listId, userId, data) {
    const result = await pool.query(
      `UPDATE lists 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           is_public = COALESCE($3, is_public),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [data.title, data.description, data.is_public, listId, userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a list
   */
  static async delete(listId, userId) {
    const result = await pool.query(
      'DELETE FROM lists WHERE id = $1 AND user_id = $2 RETURNING id',
      [listId, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Add a movie to a list
   */
  static async addMovie(listId, userId, movie) {
    // Verify ownership
    const checkResult = await pool.query(
      'SELECT id FROM lists WHERE id = $1 AND user_id = $2',
      [listId, userId]
    );

    if (checkResult.rows.length === 0) {
      return null;
    }

    const result = await pool.query(
      `INSERT INTO list_movies (list_id, movie_id, movie_title, movie_poster)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (list_id, movie_id) DO NOTHING
       RETURNING *`,
      [listId, movie.id, movie.title, movie.poster_path]
    );

    return result.rows[0];
  }

  /**
   * Remove a movie from a list
   */
  static async removeMovie(listId, userId, movieId) {
    const result = await pool.query(
      `DELETE FROM list_movies 
       WHERE list_id = $1 AND movie_id = $2
       AND EXISTS (SELECT 1 FROM lists WHERE id = $1 AND user_id = $3)
       RETURNING id`,
      [listId, movieId, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Toggle like on a list
   */
  static async toggleLike(listId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if already liked
      const existingLike = await client.query(
        'SELECT id FROM list_likes WHERE list_id = $1 AND user_id = $2',
        [listId, userId]
      );

      let liked;
      if (existingLike.rows.length > 0) {
        // Unlike
        await client.query(
          'DELETE FROM list_likes WHERE list_id = $1 AND user_id = $2',
          [listId, userId]
        );
        liked = false;
      } else {
        // Like
        await client.query(
          'INSERT INTO list_likes (list_id, user_id) VALUES ($1, $2)',
          [listId, userId]
        );
        liked = true;
      }

      // Get new like count
      const countResult = await client.query(
        'SELECT COUNT(*) as likes_count FROM list_likes WHERE list_id = $1',
        [listId]
      );

      await client.query('COMMIT');

      return {
        liked,
        likes_count: parseInt(countResult.rows[0].likes_count, 10)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if user owns the list
   */
  static async isOwner(listId, userId) {
    const result = await pool.query(
      'SELECT id FROM lists WHERE id = $1 AND user_id = $2',
      [listId, userId]
    );
    return result.rows.length > 0;
  }
}

export default ListModel;
