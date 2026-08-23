import ListModel from '../models/listModel.js';

export const getUserLists = async (req, res) => {
  try {
    const lists = await ListModel.findByUserId(req.params.userId);
    res.json(lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
};

export const getListById = async (req, res) => {
  try {
    const list = await ListModel.findById(req.params.listId);
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }
    res.json(list);
  } catch (error) {
    console.error('Error fetching list:', error);
    res.status(500).json({ error: 'Failed to fetch list' });
  }
};

export const getPublicLists = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const lists = await ListModel.getPublic(limit, offset);
    res.json(lists);
  } catch (error) {
    console.error('Error fetching public lists:', error);
    res.status(500).json({ error: 'Failed to fetch public lists' });
  }
};

export const createList = async (req, res) => {
  try {
    const { user_id, title, description, is_public, movies } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'List title is required' });
    }

    const list = await ListModel.create({
      user_id,
      title: title.trim(),
      description,
      is_public,
      movies
    });
    
    res.status(201).json(list);
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({ error: 'Failed to create list' });
  }
};

export const updateList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { user_id, title, description, is_public } = req.body;

    const list = await ListModel.update(listId, user_id, {
      title,
      description,
      is_public
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found or not authorized' });
    }

    res.json(list);
  } catch (error) {
    console.error('Error updating list:', error);
    res.status(500).json({ error: 'Failed to update list' });
  }
};

export const deleteList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { user_id } = req.body;

    const deleted = await ListModel.delete(listId, user_id);

    if (!deleted) {
      return res.status(404).json({ error: 'List not found or not authorized' });
    }

    res.json({ success: true, message: 'List deleted' });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({ error: 'Failed to delete list' });
  }
};

export const addCollaborator = async (req, res) => {
  try {
    const { listId } = req.params;
    const { user_id, collaborator_id, permissions } = req.body;

    if (!collaborator_id) {
      return res.status(400).json({ error: 'Collaborator ID is required' });
    }

    const result = await ListModel.addCollaborator(listId, user_id, collaborator_id, permissions);

    if (!result) {
      return res.status(404).json({ error: 'List not found or not authorized' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
};

export const removeCollaborator = async (req, res) => {
  try {
    const { listId, collaboratorId } = req.params;
    const { user_id } = req.body;

    const removed = await ListModel.removeCollaborator(listId, user_id, collaboratorId);

    if (!removed) {
      return res.status(404).json({ error: 'Collaborator not found or not authorized' });
    }

    res.json({ success: true, message: 'Collaborator removed' });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
};

export const getCollaborators = async (req, res) => {
  try {
    const { listId } = req.params;
    const collaborators = await ListModel.getCollaborators(listId);
    res.json(collaborators);
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
};

export const addMovieToList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { user_id, movie } = req.body;

    if (!movie || !movie.id) {
      return res.status(400).json({ error: 'Movie data is required' });
    }

    const result = await ListModel.addMovie(listId, user_id, movie);

    if (!result) {
      return res.status(404).json({ error: 'List not found or not authorized' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error adding movie to list:', error);
    res.status(500).json({ error: 'Failed to add movie to list' });
  }
};

export const removeMovieFromList = async (req, res) => {
  try {
    const { listId, movieId } = req.params;
    const { user_id } = req.body;

    const removed = await ListModel.removeMovie(listId, user_id, movieId);

    if (!removed) {
      return res.status(404).json({ error: 'Movie not found in list or not authorized' });
    }

    res.json({ success: true, message: 'Movie removed from list' });
  } catch (error) {
    console.error('Error removing movie from list:', error);
    res.status(500).json({ error: 'Failed to remove movie from list' });
  }
};

export const toggleListLike = async (req, res) => {
  try {
    const { listId } = req.params;
    const { user_id } = req.body;

    const result = await ListModel.toggleLike(listId, user_id);
    res.json(result);
  } catch (error) {
    console.error('Error toggling list like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};
