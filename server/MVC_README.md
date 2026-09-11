# MVC Architecture Documentation

## Overview

This backend follows the **Model-View-Controller (MVC)** architectural pattern for better code organization, maintainability, and scalability.

## Project Structure

```
server/
│
├── index.js                 # Entry point - App configuration
│
├── models/                  # Data Layer
│   ├── movieModel.js        # Movie data operations
│   ├── userModel.js         # User data operations
│   ├── reviewModel.js       # Review data operations
│   └── watchlistModel.js    # Watchlist data operations
│
├── views/                   # Presentation Layer
│   └── (JSON responses)     # API returns JSON, no traditional views
│
├── controllers/             # Business Logic Layer
│   ├── movieController.js   # Movie request handlers
│   ├── userController.js    # User request handlers
│   ├── reviewController.js  # Review request handlers
│   └── watchlistController.js # Watchlist request handlers
│
└── routes/                  # Routing Layer
    ├── movieRoutes.js       # Movie endpoint definitions
    ├── userRoutes.js        # User endpoint definitions
    ├── reviewRoutes.js      # Review endpoint definitions
    └── watchlistRoutes.js   # Watchlist endpoint definitions
```

## MVC Components Explained

### 1. **Models** (Data Layer)
Models handle data operations and business logic related to data:
- Database interactions (or API calls in this case)
- Data validation
- Data transformation

**Example**: `movieModel.js`
```javascript
class MovieModel {
  static async getTrending() {
    // Handles fetching trending movies
    // Can use TMDB API or return mock data
  }
}
```

### 2. **Views** (Presentation Layer)
In a REST API, views are the JSON responses sent back to clients:
- Format data for API responses
- Handle response status codes
- No traditional HTML views in REST APIs

**Example**: Controller returns JSON
```javascript
res.json({ movies: data, page: 1 });
```

### 3. **Controllers** (Logic Layer)
Controllers handle incoming requests and coordinate between models and views:
- Request validation
- Business logic execution
- Error handling
- Response formatting

**Example**: `movieController.js`
```javascript
class MovieController {
  static async getTrending(req, res) {
    try {
      const data = await MovieModel.getTrending();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch' });
    }
  }
}
```

### 4. **Routes** (Routing Layer)
Routes define URL endpoints and map them to controller methods:
- URL pattern matching
- HTTP method handling (GET, POST, PUT, DELETE)
- Route parameter extraction

**Example**: `movieRoutes.js`
```javascript
router.get('/trending', MovieController.getTrending);
router.get('/:id', MovieController.getDetails);
```

## Request Flow

```
Client Request
     ↓
    Route (/api/movies/trending)
     ↓
Controller (MovieController.getTrending)
     ↓
    Model (MovieModel.getTrending)
     ↓
   Data Source (TMDB API / Mock Data)
     ↓
    Model (returns data)
     ↓
Controller (formats response)
     ↓
    View (JSON Response)
     ↓
Client Response
```

## Benefits of MVC Architecture

### 1. **Separation of Concerns**
- Models handle data
- Controllers handle logic
- Routes handle routing
- Each component has a single responsibility

### 2. **Maintainability**
- Easy to locate and fix bugs
- Clear file organization
- Independent component testing

### 3. **Scalability**
- Easy to add new features
- Can scale each layer independently
- Supports team collaboration

### 4. **Reusability**
- Models can be reused across controllers
- Controllers can use multiple models
- Routes are decoupled from logic

### 5. **Testability**
- Each layer can be tested independently
- Mock data easily in models
- Test controllers without database

## API Endpoints

### Movies
- `GET /api/movies/trending` - Get trending movies
- `GET /api/movies/popular` - Get popular movies
- `GET /api/movies/search?query=dark` - Search movies
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/:id/recommendations` - Get recommendations

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/stats` - Get user statistics
- `POST /api/users` - Create/update user
- `DELETE /api/users/:id` - Delete user

### Reviews
- `GET /api/reviews/movie/:movieId` - Get movie reviews
- `GET /api/reviews/user/:userId` - Get user reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Watchlist
- `GET /api/watchlist/user/:userId` - Get user watchlist
- `POST /api/watchlist` - Add to watchlist
- `DELETE /api/watchlist/:userId/:movieId` - Remove from watchlist
- `GET /api/watchlist/check/:userId/:movieId` - Check if in watchlist

## Adding New Features

### Example: Adding a "Favorites" Feature

1. **Create Model** (`models/favoriteModel.js`):
```javascript
class FavoriteModel {
  static favorites = [];
  
  static async add(userId, movieId) {
    // Add to favorites
  }
}
```

2. **Create Controller** (`controllers/favoriteController.js`):
```javascript
class FavoriteController {
  static async addToFavorites(req, res) {
    const { userId, movieId } = req.body;
    const result = await FavoriteModel.add(userId, movieId);
    res.json(result);
  }
}
```

3. **Create Routes** (`routes/favoriteRoutes.js`):
```javascript
router.post('/', FavoriteController.addToFavorites);
```

4. **Register in `index.js`**:
```javascript
import favoriteRoutes from './routes/favoriteRoutes.js';
app.use('/api/favorites', favoriteRoutes);
```

## Database Migration

Currently, models use in-memory storage. To migrate to PostgreSQL:

1. **Update Models** to use database:
```javascript
import { pool } from '../config/database.js';

class UserModel {
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1', [id]
    );
    return result.rows[0];
  }
}
```

2. **No changes needed** in Controllers or Routes!

## Testing

### Unit Testing Models
```javascript
test('MovieModel.getTrending returns data', async () => {
  const data = await MovieModel.getTrending();
  expect(data.results).toBeDefined();
});
```

### Unit Testing Controllers
```javascript
test('MovieController.getTrending returns 200', async () => {
  const req = {};
  const res = { json: jest.fn() };
  
  await MovieController.getTrending(req, res);
  
  expect(res.json).toHaveBeenCalled();
});
```

## Best Practices

1. **Keep Controllers Thin** - Move complex logic to models
2. **Validate in Controllers** - Check request data before processing
3. **Handle Errors Gracefully** - Use try-catch and proper status codes
4. **Use Async/Await** - For cleaner asynchronous code
5. **Document APIs** - Keep endpoint documentation updated

## Performance Considerations

- Models can implement caching
- Routes can implement middleware
- Use pagination for large datasets

## Future Enhancements

- Add middleware layer for authentication
- Implement dependency injection
- Add logging framework
- Create base model class
- Add data transformation layer
