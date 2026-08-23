import MovieModel from '../models/movieModel.js';

/**
 * Movie Controller - Handles movie-related requests
 * Bridges between routes and movie model
 */
class MovieController {
  
  /**
   * Get trending movies
   * GET /api/movies/trending
   */
  static async getTrending(req, res) {
    try {
      const data = await MovieModel.getTrending();
      res.json(data);
    } catch (error) {
      console.error('Error in getTrending:', error.message);
      res.status(500).json({ error: 'Failed to fetch trending movies' });
    }
  }

  /**
   * Get popular movies
   * GET /api/movies/popular
   */
  static async getPopular(req, res) {
    try {
      const { page = 1 } = req.query;
      const data = await MovieModel.getPopular(parseInt(page));
      res.json(data);
    } catch (error) {
      console.error('Error in getPopular:', error.message);
      res.status(500).json({ error: 'Failed to fetch popular movies' });
    }
  }

  /**
   * Search movies
   * GET /api/movies/search
   */
  static async search(req, res) {
    try {
      const { query, page = 1 } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Query parameter required' });
      }

      const data = await MovieModel.search(query, parseInt(page));
      res.json(data);
    } catch (error) {
      console.error('Error in search:', error.message);
      res.status(500).json({ error: 'Failed to search movies' });
    }
  }

  /**
   * Get movie details
   * GET /api/movies/:id
   */
  static async getDetails(req, res) {
    try {
      const { id } = req.params;
      const data = await MovieModel.getDetails(id);
      res.json(data);
    } catch (error) {
      console.error('Error in getDetails:', error.message);
      res.status(500).json({ error: 'Failed to fetch movie details' });
    }
  }

  /**
   * Get movie recommendations
   * GET /api/movies/:id/recommendations
   */
  static async getRecommendations(req, res) {
    try {
      const { id } = req.params;
      const data = await MovieModel.getRecommendations(id);
      res.json(data);
    } catch (error) {
      console.error('Error in getRecommendations:', error.message);
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  }
}

export default MovieController;
