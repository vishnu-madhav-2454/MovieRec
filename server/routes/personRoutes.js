import express from 'express';
import PersonController from '../controllers/personController.js';

const router = express.Router();

// GET /api/people/:id
router.get('/:id', PersonController.getDetails);

export default router;
