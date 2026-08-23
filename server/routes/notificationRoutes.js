import express from 'express';
import NotificationModel from '../models/notificationModel.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const notifications = await NotificationModel.getForUser(userId);
    const unread = notifications.filter((n) => !n.read).length;
    res.json({ notifications, unread });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/read-all', async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId || 1;
    const notifications = await NotificationModel.markAllRead(userId);
    res.json({ notifications, unread: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notifications read' });
  }
});

export default router;
