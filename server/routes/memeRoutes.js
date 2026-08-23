import express from 'express';
import {
  getMemes,
  getMemeById,
  createMeme,
  toggleLikeMeme,
  addMemeComment,
  getMemeComments,
  shareMeme
} from '../controllers/memeController.js';

const router = express.Router();

router.get('/', getMemes);
router.get('/:id', getMemeById);
router.get('/:id/comments', getMemeComments);
router.post('/', createMeme);
router.post('/:id/like', toggleLikeMeme);
router.post('/:id/comments', addMemeComment);
router.post('/:id/share', shareMeme);

export default router;
