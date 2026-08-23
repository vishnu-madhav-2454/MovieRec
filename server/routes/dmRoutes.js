import express from 'express';
import {
  getConversations,
  getMessagesWithUser,
  sendMessage
} from '../controllers/dmController.js';

const router = express.Router();

router.get('/', getConversations);
router.get('/conversations', getConversations);
router.get('/messages/:otherUserId', getMessagesWithUser);
router.get('/:userId/:targetUserId', getMessagesWithUser);
router.post('/send', sendMessage);

export default router;
