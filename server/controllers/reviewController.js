import ReviewModel from '../models/reviewModel.js';
import express from 'express';

const router = express.Router();

/**
 * Review Controller - Handles review-related requests
 */
class ReviewController {
  
  /**
   * Get all reviews (with pagination and sorting)
   * GET /api/reviews?limit=10&offset=0&sort=recent
   */
  static async getAllReviews(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = parseInt(req.query.offset, 10) || 0;
      const sort = req.query.sort || 'recent';
      
      const reviews = await ReviewModel.getAll({ limit, offset, sort });
      res.json(reviews);
    } catch (error) {
      console.error('Error in getAllReviews:', error.message);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }
  
  /**
   * Get reviews for a movie (supports sorting & user auth context)
   * GET /api/reviews/movie/:movieId?sort=popular|recent|rating_high|rating_low&userId=...
   */
  static async getMovieReviews(req, res) {
    try {
      const { movieId } = req.params;
      const { sort = 'popular', userId } = req.query;
      const reviews = await ReviewModel.findByMovieId(movieId, { sort, userId });
      res.json(reviews);
    } catch (error) {
      console.error('Error in getMovieReviews:', error.message);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  /**
   * Get reviews by user
   * GET /api/reviews/user/:userId
   */
  static async getUserReviews(req, res) {
    try {
      const { userId } = req.params;
      const reviews = await ReviewModel.findByUserId(userId);
      res.json(reviews);
    } catch (error) {
      console.error('Error in getUserReviews:', error.message);
      res.status(500).json({ error: 'Failed to fetch user reviews' });
    }
  }

  /**
   * Create a review
   * POST /api/reviews
   */
  static async createReview(req, res) {
    try {
      const { user_id, username, user_avatar, movie_id, movie_title, movie_poster, rating, content, vibes, has_spoilers } = req.body;

      // Validation
      if (!user_id || !movie_id || rating === undefined) {
        return res.status(400).json({ 
          error: 'User ID, movie ID, and rating are required' 
        });
      }

      const numRating = parseFloat(rating);
      if (isNaN(numRating) || numRating < 0 || numRating > 5) {
        return res.status(400).json({ 
          error: 'Rating must be between 0 and 5' 
        });
      }

      // Check if user already reviewed this movie
      const existingReview = await ReviewModel.findByUserAndMovie(user_id, movie_id);
      
      if (existingReview) {
        // Update existing review
        const updated = await ReviewModel.update(existingReview.id, user_id, {
          rating: numRating,
          content,
          movie_title,
          movie_poster,
          vibes,
          has_spoilers
        });
        return res.json(updated);
      }

      // Create new review
      const review = await ReviewModel.create({
        user_id,
        username,
        user_avatar,
        movie_id,
        movie_title,
        movie_poster,
        rating: numRating,
        content,
        vibes,
        has_spoilers
      });

      res.status(201).json(review);
    } catch (error) {
      console.error('Error in createReview:', error.message);
      res.status(500).json({ error: 'Failed to create review' });
    }
  }

  /**
   * Toggle like on review
   * POST /api/reviews/:id/like
   */
  static async toggleLikeReview(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'User ID required' });

      const result = await ReviewModel.toggleLike(id, userId);
      if (!result) return res.status(404).json({ error: 'Review not found' });

      res.json(result);
    } catch (error) {
      console.error('Error in toggleLikeReview:', error.message);
      res.status(500).json({ error: 'Failed to toggle like on review' });
    }
  }

  /**
   * Toggle helpful on review
   * POST /api/reviews/:id/helpful
   */
  static async toggleHelpfulReview(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'User ID required' });

      const result = await ReviewModel.toggleHelpful(id, userId);
      if (!result) return res.status(404).json({ error: 'Review not found' });

      res.json(result);
    } catch (error) {
      console.error('Error in toggleHelpfulReview:', error.message);
      res.status(500).json({ error: 'Failed to toggle helpful on review' });
    }
  }

  /**
   * Add comment to review
   * POST /api/reviews/:id/comments
   */
  static async addReviewComment(req, res) {
    try {
      const { id } = req.params;
      const { userId, username, content } = req.body;
      if (!content || !userId) return res.status(400).json({ error: 'Content and userId required' });

      const comment = await ReviewModel.addComment(id, { userId, username, content });
      if (!comment) return res.status(404).json({ error: 'Review not found' });

      res.status(201).json(comment);
    } catch (error) {
      console.error('Error in addReviewComment:', error.message);
      res.status(500).json({ error: 'Failed to add comment to review' });
    }
  }

  /**
   * Update a review
   * PUT /api/reviews/:id
   */
  static async updateReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, content, vibes, has_spoilers } = req.body;

      const review = await ReviewModel.findById(id);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      const updated = await ReviewModel.update(id, { rating, content, vibes, has_spoilers });
      res.json(updated);
    } catch (error) {
      console.error('Error in updateReview:', error.message);
      res.status(500).json({ error: 'Failed to update review' });
    }
  }

  /**
   * Delete a review
   * DELETE /api/reviews/:id
   */
  static async deleteReview(req, res) {
    try {
      const { id } = req.params;

      const deleted = await ReviewModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Error in deleteReview:', error.message);
      res.status(500).json({ error: 'Failed to delete review' });
    }
  }

  /**
   * Get review statistics for a movie
   * GET /api/reviews/movie/:movieId/stats
   */
  static async getReviewStats(req, res) {
    try {
      const { movieId } = req.params;
      
      const [averageRating, reviewCount] = await Promise.all([
        ReviewModel.getAverageRating(movieId),
        ReviewModel.getReviewCount(movieId)
      ]);

      res.json({
        movie_id: parseInt(movieId, 10),
        average_rating: averageRating,
        average_rating: averageRating,
        review_count: reviewCount,
        review_count: reviewCount
      });
    } catch (error) {
      console.error('Error in getReviewStats:', error.message);
      res.status(500).json({ error: 'Failed to fetch review stats' });
    }
  }

  /**
   * Search reviews by content
   * GET /api/reviews/search?q=searchTerm
   */
  static async searchReviews(req, res) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length < 2) {
        return res.json([]);
      }

      const reviews = await ReviewModel.search(q);
      res.json(reviews);
    } catch (error) {
      console.error('Error in searchReviews:', error.message);
      res.status(500).json({ error: 'Failed to search reviews' });
    }
  }
}

export default ReviewController;
