# MovieRec Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                          │
│                    (React + Vite + Tailwind)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Pages/                    Components/                       │
│  ├─ Home.jsx              ├─ Navbar.jsx                     │
│  ├─ Profile.jsx           ├─ BottomNav.jsx                  │
│  ├─ Feed.jsx              ├─ MovieCard.jsx                  │
│  ├─ Memes.jsx             ├─ ReviewCard.jsx                 │
│  ├─ MovieDetail.jsx       ├─ MemeUpload.jsx ────┐           │
│  ├─ Messages.jsx          ├─ AuthModal.jsx      │           │
│  └─ ...                   └─ ...                │           │
│                                                  │           │
│  Context/                  Hooks/               │           │
│  └─ AuthContext.jsx       └─ useApi.js          │           │
│                                                  │           │
└──────────────────────────────────────────────────┼───────────┘
                                                   │
                                                   │ Upload
                                                   ▼
                                    ┌──────────────────────────┐
                                    │   Firebase Storage       │
                                    │  (Image Hosting)         │
                                    │                          │
                                    │  /memes/                 │
                                    │    {userId}_{timestamp}  │
                                    │    _{filename}           │
                                    └──────────────────────────┘
                    │
                    │ HTTP/REST API
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                        SERVER SIDE                           │
│                   (Express.js + Node.js)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Routes/                   Controllers/                      │
│  ├─ movieRoutes.js        ├─ movieController.js             │
│  ├─ userRoutes.js         ├─ userController.js              │
│  ├─ reviewRoutes.js       ├─ reviewController.js            │
│  ├─ followRoutes.js ✨    ├─ followController.js ✨         │
│  ├─ memeRoutes.js         ├─ memeController.js              │
│  ├─ listRoutes.js         ├─ listController.js              │
│  └─ ...                   └─ ...                             │
│                                                               │
│  Middleware/               Models/                           │
│  ├─ rateLimiter.js        ├─ userModel.js                   │
│  ├─ validation.js         ├─ reviewModel.js                 │
│  └─ auth.js               ├─ followModel.js ✨              │
│                            ├─ memeModel.js                   │
│                            ├─ notificationModel.js           │
│                            └─ ...                             │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ SQL Queries
                            ▼
            ┌────────────────────────────────────┐
            │         PostgreSQL Database         │
            │           (Port 5433)               │
            ├────────────────────────────────────┤
            │                                     │
            │  Tables:                            │
            │  ├─ users                          │
            │  ├─ reviews                        │
            │  ├─ user_follows ✨                │
            │  ├─ notifications                  │
            │  ├─ memes                          │
            │  ├─ lists                          │
            │  ├─ list_movies                    │
            │  ├─ list_collaborators ✨         │
            │  ├─ watchlist                      │
            │  ├─ diary_entries                  │
            │  └─ ...                             │
            │                                     │
            │  Indexes: 30+ for performance      │
            │                                     │
            └────────────────────────────────────┘
                            │
                            │ Future: Phase 3
                            ▼
            ┌────────────────────────────────────┐
            │         Redis Cache                 │
            │         (Future)                    │
            ├────────────────────────────────────┤
            │                                     │
            │  - Session management              │
            │  - Cached user profiles            │
            │  - Cached trending movies          │
            │  - Rate limiting counters          │
            │  - Online user status              │
            │                                     │
            └────────────────────────────────────┘

External APIs:
┌────────────────────────────────────┐
│         TMDB API                    │
│  (The Movie Database)               │
├────────────────────────────────────┤
│  - Movie search                     │
│  - Trending movies                  │
│  - Popular movies                   │
│  - Movie details                    │
│  - Person details                   │
│  - Watch providers ✨              │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│      Firebase Services              │
├────────────────────────────────────┤
│  - Authentication (Auth)            │
│  - Storage (Images) ✨             │
│  - (Admin SDK for notifications)    │
└────────────────────────────────────┘
```

✨ = New in Phase 2

---

## Data Flow Diagrams

### 1. User Follow Flow

```
User A Profile Page
        │
        ▼
Click "Follow User B" Button
        │
        ▼
POST /api/users/:id/follow
  { follower_id: A }
        │
        ▼
followController.followUser()
        │
        ├─► FollowModel.follow(A, B)
        │         │
        │         ▼
        │   INSERT INTO user_follows
        │   (follower_id, following_id)
        │   VALUES (A, B)
        │         │
        │         ▼
        │   Return follow record
        │
        └─► NotificationModel.notifyFollow(B, A)
                  │
                  ▼
            INSERT INTO notifications
            (user_id, type, actor_id)
            VALUES (B, 'follow', A)
                  │
                  ▼
            Return success
        │
        ▼
Update UI: "Following" button
Update counts: +1 following for A, +1 followers for B
```

---

### 2. Meme Upload Flow

```
User clicks Create button
        │
        ▼
MemeUpload modal opens
        │
        ▼
User selects image file
        │
        ├─► Validate file type (must be image/*)
        ├─► Validate file size (must be < 5MB)
        └─► Create preview with FileReader
        │
        ▼
User adds caption, tags, movie
        │
        ▼
Click "Post meme"
        │
        ▼
Upload to Firebase Storage
  fileName: memes/{userId}_{timestamp}_{filename}
        │
        ├─► uploadBytes(storageRef, file)
        └─► getDownloadURL(storageRef)
        │
        ▼
POST /api/memes
  {
    user_id,
    username,
    image_url: downloadURL,
    caption,
    vibes,
    movie_id,
    movie_title
  }
        │
        ▼
memeController.createMeme()
        │
        ▼
MemeModel.create()
        │
        ▼
INSERT INTO memes (...)
        │
        ▼
Return meme record
        │
        ▼
Update feed with new meme
Close modal
```

---

### 3. Profile Data Loading Flow

```
Navigate to /profile/:id
        │
        ▼
Profile.jsx useEffect()
        │
        ├─► GET /api/users/:id
        │         │
        │         ▼
        │   SELECT * FROM users WHERE id = :id
        │
        ├─► GET /api/users/:id/stats
        │         │
        │         ▼
        │   SELECT COUNT(*) FROM reviews...
        │   SELECT COUNT(*) FROM watchlist...
        │
        ├─► GET /api/reviews/user/:id
        │         │
        │         ▼
        │   SELECT * FROM reviews WHERE user_id = :id
        │
        ├─► GET /api/watchlist/:id
        │         │
        │         ▼
        │   SELECT * FROM watchlist WHERE user_id = :id
        │
        ├─► GET /api/users/:id/following ✨
        │         │
        │         ▼
        │   SELECT u.* FROM user_follows uf
        │   JOIN users u ON uf.following_id = u.id
        │   WHERE uf.follower_id = :id
        │
        └─► GET /api/users/:id/followers ✨
                  │
                  ▼
            SELECT u.* FROM user_follows uf
            JOIN users u ON uf.follower_id = u.id
            WHERE uf.following_id = :id
        │
        ▼
Render profile with all data
```

---

## Request/Response Examples

### Follow User

**Request:**
```http
POST /api/users/2/follow HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "follower_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully followed user",
  "data": {
    "id": 123,
    "follower_id": 1,
    "following_id": 2,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Get Following List

**Request:**
```http
GET /api/users/1/following?limit=50&offset=0 HTTP/1.1
Host: localhost:3001
```

**Response:**
```json
[
  {
    "id": 2,
    "username": "CinemaLover",
    "bio": "Film enthusiast and critic",
    "avatar_url": "https://...",
    "followed_at": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": 3,
    "username": "MovieBuff92",
    "bio": "Horror and sci-fi fan",
    "avatar_url": null,
    "followed_at": "2024-01-14T15:20:00.000Z"
  }
]
```

---

### Upload Meme

**Request:**
```http
POST /api/memes HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "user_id": 1,
  "username": "MovieFan",
  "user_avatar": "https://...",
  "movie_id": 550,
  "movie_title": "Fight Club",
  "image_url": "https://firebasestorage.googleapis.com/...",
  "caption": "First rule of cinema club...",
  "vibes": ["Classic", "DarkHumor", "Twist"]
}
```

**Response:**
```json
{
  "id": 456,
  "user_id": 1,
  "username": "MovieFan",
  "movie_id": 550,
  "movie_title": "Fight Club",
  "image_url": "https://firebasestorage.googleapis.com/...",
  "caption": "First rule of cinema club...",
  "vibes": ["Classic", "DarkHumor", "Twist"],
  "likes_count": 0,
  "comments_count": 0,
  "created_at": "2024-01-15T11:00:00.000Z"
}
```

---

## Database Schema (Key Tables)

### user_follows (New in Phase 2)
```sql
CREATE TABLE user_follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);
CREATE INDEX idx_follows_created ON user_follows(created_at);
```

### memes
```sql
CREATE TABLE memes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  user_avatar TEXT,
  movie_id INTEGER,
  movie_title VARCHAR(255),
  image_url TEXT NOT NULL,  -- Firebase Storage URL
  caption TEXT,
  vibes TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_memes_user ON memes(user_id);
CREATE INDEX idx_memes_movie ON memes(movie_id);
CREATE INDEX idx_memes_created ON memes(created_at DESC);
```

### notifications
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,  -- 'follow', 'like', 'comment', etc.
  actor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  actor_username VARCHAR(100),
  target_type VARCHAR(50),  -- 'review', 'meme', 'list', etc.
  target_id INTEGER,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_read ON notifications(user_id, read);
CREATE INDEX idx_notif_created ON notifications(created_at DESC);
```

---

## Security Layers

```
┌─────────────────────────────────────┐
│   Client-Side Validation            │
│   - File type check                 │
│   - File size check (5MB)           │
│   - Form validation                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   API Rate Limiting                 │
│   - 100 requests/15min per IP       │
│   - Prevents brute force            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Input Validation (Joi)            │
│   - Schema validation               │
│   - Type checking                   │
│   - Length limits                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Controller Logic                  │
│   - Business rules                  │
│   - Prevent self-follow             │
│   - Authentication checks           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Database Constraints              │
│   - UNIQUE constraints              │
│   - CHECK constraints               │
│   - Foreign key constraints         │
│   - ON DELETE CASCADE               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Firebase Storage Rules            │
│   (TODO: Phase 3)                   │
│   - Authentication required         │
│   - File size limits                │
│   - File type restrictions          │
└─────────────────────────────────────┘
```

---

## Performance Optimizations

### Database Indexes (30+)
```sql
-- Follow System
CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);
CREATE INDEX idx_follows_created ON user_follows(created_at);

-- Reviews
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_movie ON reviews(movie_id);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

-- Notifications
CREATE INDEX idx_notif_user_read ON notifications(user_id, read);
CREATE INDEX idx_notif_created ON notifications(created_at DESC);

-- Memes
CREATE INDEX idx_memes_user ON memes(user_id);
CREATE INDEX idx_memes_created ON memes(created_at DESC);
```

### Future: Redis Caching (Phase 3)
```
┌──────────────────────────────────┐
│   Cache Strategy                  │
├──────────────────────────────────┤
│                                   │
│   Hot Data (Redis):               │
│   - User profiles (5 min TTL)    │
│   - Trending movies (1 hr TTL)   │
│   - Follower counts (10 min)     │
│   - Session data                  │
│                                   │
│   Cold Data (PostgreSQL):         │
│   - Complete user history         │
│   - Old reviews                   │
│   - Archived lists                │
│                                   │
└──────────────────────────────────┘
```

---

## Deployment Architecture (Future)

```
                    ┌─────────────┐
                    │   Cloudflare │
                    │     CDN      │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Load       │
                    │   Balancer   │
                    └──────┬───────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
    ┌────▼────┐                        ┌────▼────┐
    │ Web App │                        │ Web App │
    │ Instance│                        │ Instance│
    │    1    │                        │    2    │
    └────┬────┘                        └────┬────┘
         │                                   │
         └─────────────────┬─────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
    ┌────▼────────┐                   ┌─────▼──────┐
    │  PostgreSQL │                   │   Redis    │
    │   Primary   │                   │   Cache    │
    │             │                   │            │
    │  Replica 1  │                   └────────────┘
    │  Replica 2  │
    └─────────────┘
```

---

## Tech Stack Summary

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **State:** Context API + useState/useEffect
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL 15
- **ORM:** Raw SQL with pg library
- **Validation:** Joi
- **Rate Limiting:** express-rate-limit
- **Security:** Helmet, CORS

### External Services
- **Movie Data:** TMDB API
- **Authentication:** Firebase Auth
- **Image Storage:** Firebase Storage
- **Future:** Redis for caching

---

## File Structure

```
MovieRec/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── pages/         # Route pages
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React Context
│   │   ├── hooks/         # Custom hooks
│   │   ├── config/        # Firebase config
│   │   └── utils/         # Helper functions
│   └── package.json
│
├── server/                # Backend Express API
│   ├── controllers/       # Request handlers
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── middleware/       # Express middleware
│   ├── config/           # Server config
│   ├── db/              # Database connection
│   └── package.json
│
├── database/             # Database setup
│   └── setup.js         # Schema creation
│
└── docs/                # Documentation
    ├── PHASE_1_COMPLETE.md
    ├── PHASE_2_COMPLETE.md
    ├── DATABASE_RECOMMENDATIONS.md
    ├── CHANGES_SUMMARY.md
    ├── QUICK_START_PHASE_2.md
    └── ARCHITECTURE_OVERVIEW.md
```

---

## Key Design Decisions

### 1. **Why PostgreSQL over NoSQL?**
   - Structured relational data (users, follows, reviews)
   - ACID compliance needed for likes/follows
   - Excellent JOIN performance with indexes
   - Built-in full-text search
   - Proven scalability (powers Instagram, Reddit)

### 2. **Why Firebase Storage over S3?**
   - Already using Firebase for auth
   - Simpler SDK integration
   - Free tier sufficient for development
   - Easy to migrate to S3 later if needed

### 3. **Why Raw SQL over ORM?**
   - Full control over queries
   - Better performance (no ORM overhead)
   - Easier to optimize complex queries
   - Learning opportunity for SQL

### 4. **Why Context API over Redux?**
   - Simpler for this scale
   - Less boilerplate
   - Sufficient for auth state
   - Can migrate to Redux later if needed

---

This architecture is designed for:
- ✅ Scalability (can handle 100k+ users)
- ✅ Performance (indexed queries, caching ready)
- ✅ Security (validation, rate limiting, constraints)
- ✅ Maintainability (clear separation of concerns)
- ✅ Extensibility (easy to add new features)
