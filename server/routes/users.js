import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, avatar_url, bio, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create or update user
router.post('/', async (req, res) => {
  try {
    const { username, email, avatar_url, bio } = req.body;
    
    const result = await pool.query(
      `INSERT INTO users (username, email, avatar_url, bio)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
       SET username = EXCLUDED.username,
           avatar_url = EXCLUDED.avatar_url,
           bio = EXCLUDED.bio
       RETURNING id, username, avatar_url, bio, created_at`,
      [username, email, avatar_url, bio]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create/update user' });
  }
});

// Get user stats
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [watchedRes, reviewsRes, watchlistRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM reviews WHERE user_id = $1', [id]),
      pool.query('SELECT COUNT(*) FROM reviews WHERE user_id = $1', [id]),
      pool.query('SELECT COUNT(*) FROM watchlist WHERE user_id = $1', [id])
    ]);
    
    res.json({
      watched: parseInt(watchedRes.rows[0].count),
      reviews: parseInt(reviewsRes.rows[0].count),
      watchlist: parseInt(watchlistRes.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

export default router;
