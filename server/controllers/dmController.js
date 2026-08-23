import DmModel from '../models/dmModel.js';

export const getConversations = async (req, res) => {
  try {
    const userId = req.query.userId || req.params.userId;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const conversations = await DmModel.getConversations(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error in getConversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const getMessagesWithUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId;
    const targetUserId = req.params.targetUserId || req.params.otherUserId;
    if (!userId || !targetUserId) {
      return res.status(400).json({ error: 'userId and targetUserId are required' });
    }
    const messages = await DmModel.getMessagesBetweenUsers(userId, targetUserId);
    res.json(messages);
  } catch (error) {
    console.error('Error in getMessagesWithUser:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.body.sender_id || req.body.senderId;
    const receiverId = req.body.receiver_id || req.body.receiverId;
    const content = req.body.content;
    const memeId = req.body.meme_id || req.body.memeId;
    const reviewId = req.body.review_id || req.body.reviewId;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'sender_id and receiver_id are required' });
    }

    const result = await DmModel.sendMessage(senderId, receiverId, content, memeId, reviewId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

