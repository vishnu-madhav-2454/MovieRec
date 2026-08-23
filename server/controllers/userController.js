import UserModel from '../models/userModel.js';

/**
 * User Controller - Handles user-related requests
 * Bridges between routes and user model
 */
class UserController {
  
  /**
   * Sync Firebase user with database
   * POST /api/users/sync
   */
  static async syncUser(req, res) {
    try {
      const { firebase_uid, email, username, avatar_url, bio } = req.body;

      if (!firebase_uid || !email) {
        return res.status(400).json({ error: 'Firebase UID and email are required' });
      }

      // Use the createOrUpdateFromFirebase method
      const user = await UserModel.createOrUpdateFromFirebase(
        firebase_uid,
        email,
        username || email.split('@')[0],
        avatar_url
      );

      // Update bio if provided
      if (bio && user.bio !== bio) {
        await UserModel.update(user.id, { bio });
        user.bio = bio;
      }

      // Don't send sensitive data
      const { email: userEmail, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error('Error in syncUser:', error.message);
      res.status(500).json({ error: 'Failed to sync user' });
    }
  }

  /**
   * Get current authenticated user
   * GET /api/users/me
   */
  static async getCurrentUser(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { uid, email, name, picture } = req.user;

      // Find or create user in database
      let user = await UserModel.findByFirebaseUid(uid);

      if (!user) {
        // Create new user from Firebase data
        user = await UserModel.create({
          firebase_uid: uid,
          username: name || email?.split('@')[0] || 'MovieBuff',
          email: email,
          avatar_url: picture,
          bio: 'Film enthusiast'
        });
      }

      // Don't send sensitive data
      const { email: userEmail, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error('Error in getCurrentUser:', error.message);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  static async getUser(req, res) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Don't send sensitive data
      const { email, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error('Error in getUser:', error.message);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  /**
   * Update current user profile
   * PUT /api/users/me
   */
  static async updateProfile(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { uid } = req.user;
      const { username, bio, avatar_url } = req.body;

      // Find user by Firebase UID
      let user = await UserModel.findByFirebaseUid(uid);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update user
      user = await UserModel.update(user.id, {
        username,
        bio,
        avatar_url
      });

      const { email, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error('Error in updateProfile:', error.message);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  /**
   * Get user statistics
   * GET /api/users/:id/stats
   */
  static async getUserStats(req, res) {
    try {
      const { id } = req.params;
      const stats = await UserModel.getStats(id);
      res.json(stats);
    } catch (error) {
      console.error('Error in getUserStats:', error.message);
      res.status(500).json({ error: 'Failed to fetch user stats' });
    }
  }

  /**
   * Get all users (admin endpoint)
   * GET /api/users
   */
  static async getAllUsers(req, res) {
    try {
      const users = await UserModel.findAll();
      // Remove emails from response
      const safeUsers = users.map(({ email, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error('Error in getAllUsers:', error.message);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  /**
   * Create or update user (legacy - for backwards compatibility)
   * POST /api/users
   */
  static async createOrUpdateUser(req, res) {
    try {
      const { username, email, avatar_url, bio } = req.body;

      if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required' });
      }

      // Check if user exists
      let user = await UserModel.findByEmail(email);

      if (user) {
        // Update existing user
        user = await UserModel.update(user.id, {
          username,
          avatar_url,
          bio
        });
      } else {
        // Create new user
        user = await UserModel.create({
          username,
          email,
          avatar_url,
          bio
        });
      }

      // Don't send email in response
      const { email: userEmail, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error('Error in createOrUpdateUser:', error.message);
      res.status(500).json({ error: 'Failed to create/update user' });
    }
  }

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const deleted = await UserModel.delete(id);

      if (!deleted) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error in deleteUser:', error.message);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  /**
   * Get user's watched films
   * GET /api/users/:id/watched
   */
  static async getWatchedFilms(req, res) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;
      const films = await UserModel.getWatchedFilms(id, limit, offset);
      res.json(films);
    } catch (error) {
      console.error('Error in getWatchedFilms:', error.message);
      res.status(500).json({ error: 'Failed to fetch watched films' });
    }
  }

  /**
   * Add film to watched
   * POST /api/users/:id/watched
   */
  static async addToWatched(req, res) {
    try {
      const { id } = req.params;
      const { movie } = req.body;

      if (!movie || !movie.id) {
        return res.status(400).json({ error: 'Movie data is required' });
      }

      const result = await UserModel.addToWatched(id, movie);
      res.json(result);
    } catch (error) {
      console.error('Error in addToWatched:', error.message);
      res.status(500).json({ error: 'Failed to add to watched' });
    }
  }

  /**
   * Remove film from watched
   * DELETE /api/users/:id/watched/:movieId
   */
  static async removeFromWatched(req, res) {
    try {
      const { id, movieId } = req.params;
      const removed = await UserModel.removeFromWatched(id, movieId);

      if (!removed) {
        return res.status(404).json({ error: 'Film not found in watched list' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error in removeFromWatched:', error.message);
      res.status(500).json({ error: 'Failed to remove from watched' });
    }
  }

  /**
   * Get user's favorite films
   * GET /api/users/:id/favorites
   */
  static async getFavoriteFilms(req, res) {
    try {
      const { id } = req.params;
      const films = await UserModel.getFavoriteFilms(id);
      res.json(films);
    } catch (error) {
      console.error('Error in getFavoriteFilms:', error.message);
      res.status(500).json({ error: 'Failed to fetch favorite films' });
    }
  }

  /**
   * Add film to favorites
   * POST /api/users/:id/favorites
   */
  static async addToFavorites(req, res) {
    try {
      const { id } = req.params;
      const { movie } = req.body;

      if (!movie || !movie.id) {
        return res.status(400).json({ error: 'Movie data is required' });
      }

      const result = await UserModel.addToFavorites(id, movie);
      res.json(result);
    } catch (error) {
      console.error('Error in addToFavorites:', error.message);
      if (error.message.includes('Maximum 4')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to add to favorites' });
    }
  }

  /**
   * Remove film from favorites
   * DELETE /api/users/:id/favorites/:movieId
   */
  static async removeFromFavorites(req, res) {
    try {
      const { id, movieId } = req.params;
      const removed = await UserModel.removeFromFavorites(id, movieId);

      if (!removed) {
        return res.status(404).json({ error: 'Film not found in favorites' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error in removeFromFavorites:', error.message);
      res.status(500).json({ error: 'Failed to remove from favorites' });
    }
  }

  /**
   * Search users
   * GET /api/users/search?q=searchTerm
   */
  static async searchUsers(req, res) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length < 2) {
        return res.json([]);
      }

      const users = await UserModel.search(q);
      // Remove emails from response
      const safeUsers = users.map(({ email, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error('Error in searchUsers:', error.message);
      res.status(500).json({ error: 'Failed to search users' });
    }
  }
}

export default UserController;
