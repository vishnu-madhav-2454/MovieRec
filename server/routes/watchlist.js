import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

// Get user's watchlist
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT * FROM watchlist
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// Add to watchlist
router.post('/', async (req, res) => {
  try {
    const { user_id, movie_id, movie_title, poster_path } = req.body;
    
    const result = await pool.query(
      `INSERT INTO watchlist (user_id, movie_id, movie_title, poster_path)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, movie_id) DO NOTHING
       RETURNING *`,
      [user_id, movie_id, movie_title, poster_path]
    );
    
    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Movie already in watchlist' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// Remove from watchlist
router.delete('/:userId/:movieId', async (req, res) => {
  try {
    const { userId, movieId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM watchlist WHERE user_id = $1 AND movie_id = $2 RETURNING *',
      [userId, movieId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found in watchlist' });
    }
    
    res.json({ message: 'Removed from watchlist' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

// Check if movie is in watchlist
router.get('/check/:userId/:movieId', async (req, res) => {
  try {
    const { userId, movieId } = req.params;
    const result = await pool.query(
      'SELECT * FROM watchlist WHERE user_id = $1 AND movie_id = $2',
      [userId, movieId]
    );
    res.json({ inWatchlist: result.rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check watchlist' });
  }
});

export default router;
