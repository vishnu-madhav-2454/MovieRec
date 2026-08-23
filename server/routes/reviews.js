import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

// Get reviews for a movie
router.get('/movie/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const result = await pool.query(
      `SELECT r.*, u.username, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.movie_id = $1
       ORDER BY r.created_at DESC`,
      [movieId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get reviews by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT * FROM reviews
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});

// Create review
router.post('/', async (req, res) => {
  try {
    const { user_id, movie_id, rating, content } = req.body;
    
    const result = await pool.query(
      `INSERT INTO reviews (user_id, movie_id, rating, content)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, movie_id) DO UPDATE
       SET rating = EXCLUDED.rating,
           content = EXCLUDED.content,
           updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, movie_id, rating, content]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update review
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, content } = req.body;
    
    const result = await pool.query(
      `UPDATE reviews
       SET rating = $1, content = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [rating, content, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete review
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
