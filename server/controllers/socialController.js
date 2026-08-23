import SocialModel from '../models/socialModel.js';

class SocialController {
  static async getFeed(req, res) {
    try {
      const { userId, filter, page = 1, limit = 20 } = req.query;
      let feed;
      if (userId) {
        feed = await SocialModel.getFeed(parseInt(userId), parseInt(page), parseInt(limit), filter);
      } else {
        feed = await SocialModel.getPublicFeed(parseInt(page), parseInt(limit));
      }
      res.json(feed);
    } catch (error) {
      console.error('Error in SocialController.getFeed:', error.message);
      res.status(500).json({ error: 'Failed to fetch feed' });
    }
  }

  static async createPost(req, res) {
    try {
      const body = req.body || {};
      if (!body.content || !String(body.content).trim()) {
        return res.status(400).json({ error: 'Content cannot be empty' });
      }
      const newPost = await SocialModel.createPost({
        user_id: body.user_id,
        username: body.username || body.username,
        user_avatar: body.user_avatar || body.user_avatar,
        movie_id: body.movie_id,
        movie_title: body.movie_title,
        movie_poster: body.movie_poster || body.movie_poster,
        content: body.content,
        rating: body.rating,
        vibes: body.vibes,
        has_spoilers: body.has_spoilers ?? body.has_spoilers
      });
      res.status(201).json(newPost);
    } catch (error) {
      console.error('Error in SocialController.createPost:', error.message);
      res.status(500).json({ error: 'Failed to create post' });
    }
  }

  static async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const result = await SocialModel.toggleLike(id, userId || 1);
      if (!result) return res.status(404).json({ error: 'Post not found' });
      res.json(result);
    } catch (error) {
      console.error('Error in SocialController.toggleLike:', error.message);
      res.status(500).json({ error: 'Failed to toggle like' });
    }
  }

  static async addComment(req, res) {
    try {
      const { id } = req.params;
      const { userId, username, content } = req.body;
      if (!content || !String(content).trim()) {
        return res.status(400).json({ error: 'Comment content cannot be empty' });
      }
      const comment = await SocialModel.addComment(id, { userId, username, content });
      if (!comment) return res.status(404).json({ error: 'Post not found' });
      res.status(201).json(comment);
    } catch (error) {
      console.error('Error in SocialController.addComment:', error.message);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }

  static async toggleFollow(req, res) {
    try {
      const followerId = req.body.followerId || req.body.followerId;
      const followingId = req.body.followingId || req.body.followingId;
      const targetType = req.body.targetType || req.body.targetType || 'user';
      if (!followerId || !followingId) {
        return res.status(400).json({ error: 'followerId and followingId are required' });
      }
      const result = await SocialModel.toggleFollow({ followerId, followingId, targetType });
      res.json(result);
    } catch (error) {
      console.error('Error in SocialController.toggleFollow:', error.message);
      res.status(500).json({ error: 'Failed to toggle follow' });
    }
  }

  static async checkFollow(req, res) {
    try {
      const followerId = req.query.followerId || req.query.followerId;
      const followingId = req.query.followingId || req.query.followingId;
      const targetType = req.query.targetType || req.query.targetType || 'user';
      const result = await SocialModel.checkFollow({ followerId, followingId, targetType });
      res.json(result);
    } catch (error) {
      console.error('Error in SocialController.checkFollow:', error.message);
      res.status(500).json({ error: 'Failed to check follow status' });
    }
  }

  static async getFollowing(req, res) {
    try {
      const { userId } = req.params;
      const list = await SocialModel.getFollowing(userId);
      res.json(list);
    } catch (error) {
      console.error('Error in SocialController.getFollowing:', error.message);
      res.status(500).json({ error: 'Failed to fetch following' });
    }
  }

  static async getFollowers(req, res) {
    try {
      const { userId } = req.params;
      const list = await SocialModel.getFollowers(userId);
      res.json(list);
    } catch (error) {
      console.error('Error in SocialController.getFollowers:', error.message);
      res.status(500).json({ error: 'Failed to fetch followers' });
    }
  }
}

export default SocialController;
