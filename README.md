# 🎬 MovieRec

A modern, full-stack movie social network inspired by Letterboxd, built with React, Node.js, Express, and PostgreSQL. Share reviews, create lists, discover movies, and connect with fellow film enthusiasts.

![MovieRec](https://img.shields.io/badge/version-2.0-blue)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-316192)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎥 Core Features
- **Movie Discovery**: Browse trending, popular movies with TMDB integration
- **Advanced Search**: Search movies, users, and reviews
- **Movie Reviews**: Write detailed reviews with ratings and spoiler detection
- **Watchlist**: Track movies you want to watch
- **Diary**: Log watched films with dates and ratings
- **Custom Lists**: Create and share curated movie collections

### 👥 Social Features
- **User Profiles**: Customizable profiles with favorite films
- **Follow System**: Follow users and see their activity
- **Activity Feed**: Real-time updates from people you follow
- **Cinema Memes**: Share movie-related memes (Reels-style)
- **Direct Messages**: Private messaging with meme sharing
- **Notifications**: Get notified about likes, comments, follows

### 🎨 Modern UI/UX
- Sleek dark theme with glassmorphism effects
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Infinite scroll for feeds
- Bottom navigation for mobile

## 🚀 Tech Stack

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Axios** - HTTP client
- **React Icons** - Icon library

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **Firebase Auth** - Authentication
- **Cloudinary** - Image storage
- **TMDB API** - Movie data

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+
- Firebase account
- TMDB API key
- Cloudinary account

### 1. Clone Repository
```bash
git clone https://github.com/vishnu-madhav-2454/MovieRec.git
cd MovieRec
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb movierec

# Run database setup
cd database
npm install
node setup.js
```

### 4. Environment Variables

Create `server/.env`:
```env
PORT=3001
NODE_ENV=development

# TMDB API (https://www.themoviedb.org/settings/api)
TMDB_API_KEY=your_tmdb_bearer_token

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=movierec

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="your_private_key"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Start Development Servers

```bash
# Terminal 1 - Start backend
cd server
npm start

# Terminal 2 - Start frontend
cd client
npm run dev
```

Access the app at `http://localhost:5173`

## 📚 API Documentation

### Authentication
All protected routes require Firebase authentication token in the `Authorization` header.

### Key Endpoints

#### Movies
- `GET /api/movies/trending` - Get trending movies
- `GET /api/movies/popular` - Get popular movies
- `GET /api/movies/search?query={q}` - Search movies
- `GET /api/movies/:id` - Get movie details

#### Reviews
- `GET /api/reviews` - Get all reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/user/:userId` - Get user reviews
- `GET /api/reviews/movie/:movieId` - Get movie reviews

#### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/stats` - Get user statistics
- `GET /api/users/search?q={query}` - Search users

#### Social
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/follow` - Unfollow user
- `GET /api/users/:id/followers` - Get followers
- `GET /api/users/:id/following` - Get following

#### Memes
- `GET /api/memes` - Get memes feed
- `POST /api/memes` - Upload meme
- `POST /api/memes/:id/like` - Like meme
- `POST /api/memes/:id/comments` - Comment on meme

## 🏗️ Project Structure

```
MovieRec/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   └── public/
├── server/                # Express backend
│   ├── controllers/       # Route controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── config/           # Configuration files
│   └── db/               # Database connection
├── database/             # Database setup scripts
└── docs/                 # Documentation
```

## 🔐 Security Features

- Firebase Authentication
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Environment variable security

## 🎨 Features in Detail

### Movie Reviews
- 5-star rating system
- Rich text content
- Spoiler warnings with AI detection
- Vibes/tags system
- Like and comment functionality

### Cinema Memes
- Image upload to Cloudinary
- Movie tagging
- Like, comment, share
- Reels-style vertical scroll
- Direct message sharing

### User Profiles
- Customizable bio and avatar
- Favorite films showcase (4 max)
- Activity statistics
- Watched films diary
- Custom lists

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org/) - Movie data API
- [Letterboxd](https://letterboxd.com/) - Inspiration
- [Cloudinary](https://cloudinary.com/) - Image hosting
- [Firebase](https://firebase.google.com/) - Authentication

## 📧 Contact

Vishnu Madhav - [@vishnu-madhav-2454](https://github.com/vishnu-madhav-2454)

Project Link: [https://github.com/vishnu-madhav-2454/MovieRec](https://github.com/vishnu-madhav-2454/MovieRec)

---

Made with ❤️ and 🍿
