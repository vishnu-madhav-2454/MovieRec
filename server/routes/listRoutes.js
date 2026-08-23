import express from 'express';
import {
  getUserLists,
  getListById,
  getPublicLists,
  createList,
  updateList,
  deleteList,
  addMovieToList,
  removeMovieFromList,
  toggleListLike,
  addCollaborator,
  removeCollaborator,
  getCollaborators
} from '../controllers/listController.js';

const router = express.Router();

// Get public lists (discover)
router.get('/public', getPublicLists);

// Get user's lists
router.get('/user/:userId', getUserLists);

// Get a single list by ID
router.get('/:listId', getListById);

// Create a new list
router.post('/', createList);

// Update a list
router.put('/:listId', updateList);

// Delete a list
router.delete('/:listId', deleteList);

// Add a movie to a list
router.post('/:listId/movies', addMovieToList);

// Remove a movie from a list
router.delete('/:listId/movies/:movieId', removeMovieFromList);

// Toggle like on a list
router.post('/:listId/like', toggleListLike);

// Collaborator management
router.post('/:listId/collaborators', addCollaborator);
router.get('/:listId/collaborators', getCollaborators);
router.delete('/:listId/collaborators/:collaboratorId', removeCollaborator);

export default router;
