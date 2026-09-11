import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

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
import { getFirebaseAuth } from './config/firebase.js';
import UserModel from './models/userModel.js';
import DmModel from './models/dmModel.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3001;
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://movierec-web.onrender.com',
  process.env.CLIENT_URL,
].filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
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

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const firebaseAuth = getFirebaseAuth();
    if (!token || !firebaseAuth) return next(new Error('Authentication required'));

    const decodedToken = await firebaseAuth.verifyIdToken(token);
    const user = await UserModel.findByFirebaseUid(decodedToken.uid);
    if (!user) return next(new Error('User account not found'));

    socket.data.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Invalid authentication token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.user.id;
  socket.join(`user:${userId}`);

  socket.on('send_message', async (payload, acknowledge) => {
    try {
      const receiverId = Number(payload?.receiver_id || payload?.receiverId);
      const content = String(payload?.content || '').trim();
      if (!Number.isInteger(receiverId) || receiverId <= 0 || !content) {
        return acknowledge?.({ ok: false, error: 'receiver_id and content are required' });
      }

      const message = await DmModel.sendMessage(userId, receiverId, content, payload?.meme_id, payload?.review_id);
      io.to(`user:${userId}`).to(`user:${receiverId}`).emit('message:new', message);
      acknowledge?.({ ok: true, message });
    } catch (error) {
      console.error('Socket message error:', error.message);
      acknowledge?.({ ok: false, error: 'Failed to send message' });
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

httpServer.listen(PORT, () => {
  console.log(`🎬 MovieRec server running on http://localhost:${PORT}`);
  console.log('📝 MVC Architecture Mode');
  console.log('✅ Input validation active');
});
