import express from 'express';
import authRoutes from './auth';
import channelRoutes from './channelRoutes';
import messageRoutes from './messageRoutes';
import userRoutes from './userRoutes';
import dmRoutes from './directMessageRoutes';
import conversationRoutes from './conversationRoutes';
import { getUsers } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Health check
router.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
router.use('/auth', authRoutes);

// Channel routes
router.use('/channels', channelRoutes);

// Message routes
router.use('/messages', messageRoutes);

// Direct message routes
router.use('/dm', dmRoutes);

// User routes
router.get('/users', requireAuth, getUsers);

export default router;

export {
  authRoutes,
  channelRoutes,
  messageRoutes,
  userRoutes,
  dmRoutes,
  conversationRoutes
};