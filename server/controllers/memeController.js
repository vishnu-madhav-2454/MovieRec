import MemeModel from '../models/memeModel.js';
import { uploadImage } from '../config/cloudinary.js';

export const getMemes = async (req, res) => {
  try {
    const { userId, page = 1, limit = 10 } = req.query;
    const memes = await MemeModel.getMemes(parseInt(page), parseInt(limit), userId);
    res.json({ results: memes });
  } catch (error) {
    console.error('Error in getMemes:', error);
    res.status(500).json({ error: 'Failed to fetch memes' });
  }
};

export const getMemeById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    const meme = await MemeModel.getMemeById(id, userId);
    if (!meme) return res.status(404).json({ error: 'Meme not found' });
    res.json(meme);
  } catch (error) {
    console.error('Error in getMemeById:', error);
    res.status(500).json({ error: 'Failed to fetch meme' });
  }
};

export const createMeme = async (req, res) => {
  try {
    const { user_id, username, user_avatar, movie_id, movie_title, image_url, caption, vibes } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Upload image to Cloudinary if it's base64
    let finalImageUrl = image_url;
    let publicId = null;
    
    if (image_url.startsWith('data:image')) {
      const uploadResult = await uploadImage(image_url, 'movierec-memes');
      finalImageUrl = uploadResult.url;
      publicId = uploadResult.publicId;
    }

    const meme = await MemeModel.createMeme({
      user_id,
      username,
      user_avatar,
      movie_id,
      movie_title,
      image_url: finalImageUrl,
      image_public_id: publicId,
      caption,
      vibes
    });

    res.status(201).json(meme);
  } catch (error) {
    console.error('Error in createMeme:', error);
    res.status(500).json({ error: 'Failed to create meme' });
  }
};

export const toggleLikeMeme = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const result = await MemeModel.toggleLike(id, userId);
    if (!result) return res.status(404).json({ error: 'Meme not found' });

    res.json(result);
  } catch (error) {
    console.error('Error in toggleLikeMeme:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

export const addMemeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, username, content } = req.body;
    if (!content || !userId) return res.status(400).json({ error: 'Content and userId are required' });

    const comment = await MemeModel.addComment(id, { userId, username, content });
    if (!comment) return res.status(404).json({ error: 'Meme not found' });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error in addMemeComment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

export const shareMeme = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await MemeModel.shareMeme(id);
    if (!result) return res.status(404).json({ error: 'Meme not found' });
    res.json(result);
  } catch (error) {
    console.error('Error in shareMeme:', error);
    res.status(500).json({ error: 'Failed to share meme' });
  }
};

export const getMemeComments = async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await MemeModel.getComments(id);
    res.json(comments);
  } catch (error) {
    console.error('Error in getMemeComments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

