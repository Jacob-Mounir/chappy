import { Router } from 'express';
import { requireAuth, AuthRequest, isAuthenticated, getAuthenticatedUserId } from '../middleware/auth';
import { Message } from '../models/Message';
import { Channel } from '../models/Channel';
import { validate } from '../middleware/validate';
import { schemas } from '../validation/schemas';
import mongoose from 'mongoose';

const router = Router();

// Get messages for a channel
router.get('/channel/:channelId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // For private channels, user must be authenticated and a member
    if (channel.isPrivate) {
      if (req.userState?.type !== 'authenticated') {
        return res.status(403).json({ message: 'Authentication required for private channels' });
      }

      const userId = getAuthenticatedUserId(req.userState);
      if (!channel.members.some(id => id.equals(userId))) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Hämta alla meddelanden för kanalen
    const messages = await Message.find({
      channel: req.params.channelId
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username')
      .exec();

    // Enklare formatering av meddelanden
    const formattedMessages = messages.map(msg => {
      // Om det är ett gästmeddelande
      if (msg.sender && typeof msg.sender === 'object' && 'type' in msg.sender) {
        return msg;
      }
      // Om det är ett användarmeddelande
      return {
        ...msg.toObject(),
        sender: {
          _id: msg.sender?._id,
          username: (msg.sender as any)?.username || 'Unknown User'
        }
      };
    });

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Send a message to a channel
router.post('/channel/:channelId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { channelId } = req.params;
    const { content, guestName } = req.body;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check if this is the "nyheter" channel
    if (channel.name === 'nyheter' && req.userState?.type !== 'authenticated') {
      return res.status(403).json({ message: 'Only authenticated users can send messages in the news channel' });
    }

    // For private channels, user must be authenticated and a member
    if (channel.isPrivate) {
      if (req.userState?.type !== 'authenticated') {
        return res.status(403).json({ message: 'Authentication required for private channels' });
      }

      const userId = getAuthenticatedUserId(req.userState);
      if (!channel.members.some(id => id.equals(userId))) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Create message for authenticated user
      const message = new Message({
        content: content.trim(),
        channel: channelId,
        sender: {
          _id: req.userState._id,
          username: req.userState.username,
          type: 'authenticated'
        }
      });

      await message.save();
      return res.status(201).json(message);
    }

    // For public channels, allow both authenticated users and guests
    let message;
    if (req.userState?.type === 'authenticated') {
      message = new Message({
        content: content.trim(),
        channel: channelId,
        sender: {
          _id: req.userState._id,
          username: req.userState.username,
          type: 'authenticated'
        }
      });
    } else {
      message = new Message({
        content: content.trim(),
        channel: channelId,
        sender: {
          type: 'guest',
          username: guestName || 'Guest'
        }
      });
    }

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!isAuthenticated(req.userState)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = getAuthenticatedUserId(req.userState);
    const { content, channelId } = req.body;

    const newMessage = new Message({
      content: content.trim(),
      sender: userId,
      channel: channelId
    });

    await newMessage.save();
    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;