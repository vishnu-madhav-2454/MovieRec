import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import movieRoutes from './routes/movieRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import personRoutes from './routes/personRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import memeRoutes from './routes/memeRoutes.js';
import dmRoutes from './routes/dmRoutes.js';
import listRoutes from './routes/listRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import followRoutes from './routes/followRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Routes
app.use('/api/movies', movieRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/people', personRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/memes', memeRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', followRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🎬 MovieRec server running on http://localhost:${PORT}`);
  console.log('📝 MVC Architecture Mode');
  console.log('✅ Input validation active');
});
