import { Response } from 'express';
import { Message } from '../models/Message';
import type { AuthRequest } from '../types/express';
import { Channel } from '../models/Channel';
import { Types } from 'mongoose';

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { channelId } = req.params;

    // Check if channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check permissions for private channels
    if (channel.isPrivate) {
      if (!req.user) {
        return res.status(403).json({ message: 'Authentication required for private channels' });
      }

      const userId = new Types.ObjectId(req.user._id);
      const isChannelMember = channel.members.some(id => id.equals(userId));

      if (!isChannelMember) {
        return res.status(403).json({ message: 'You are not a member of this channel' });
      }
    }

    const messages = await Message.find({ channel: channelId })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { channelId } = req.params;
    const { content, guestName } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Only allow guests in public channels
    if (channel.isPrivate && !req.user) {
      return res.status(403).json({ message: 'Authentication required' });
    }

    const message = new Message({
      content: content.trim(),
      channel: channelId,
      sender: req.user ? {
        _id: req.user._id,
        username: req.user.username,
        type: 'authenticated'
      } : {
        username: guestName || 'Guest',
        type: 'guest'
      }
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await message.deleteOne();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
};

export const createMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { channelId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id; // Assuming you have user info in request

    // Validate input
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ message: 'Invalid message content' });
    }

    if (!channelId) {
      return res.status(400).json({ message: 'Channel ID is required' });
    }

    // Create message in database
    const message = new Message({
      content,
      channel: channelId,
      sender: {
        _id: userId,
        username: req.user?.username,
        type: 'authenticated'
      }
    });

    await message.save();
    return res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};