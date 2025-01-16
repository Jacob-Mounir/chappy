import { Router } from 'express';
import { requireAuth, AuthRequest, isAuthenticated, getAuthenticatedUserId } from '../middleware/auth';
import { Channel } from '../models/Channel';
import { validate } from '../middleware/validate';
import { schemas } from '../validation/schemas';
import mongoose from 'mongoose';
import * as channelController from '../controllers/channelController';
import { UserDocument } from '../models/User';

const router = Router();

// Get all channels
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!isAuthenticated(req.userState)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = getAuthenticatedUserId(req.userState);
    const channels = await Channel.find({
      $or: [
        { isPrivate: false },
        { members: new mongoose.Types.ObjectId(userId) }
      ]
    });

    res.json(channels);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get channel by ID
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!isAuthenticated(req.userState)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const userId = getAuthenticatedUserId(req.userState);
    if (channel.isPrivate && !channel.members.some(id => id.equals(userId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(channel);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new channel (auth required)
router.post('/', requireAuth, validate(schemas.channel.create), async (req: AuthRequest, res) => {
  try {
    if (!req.userState || !isAuthenticated(req.userState)) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { name, description, isPrivate } = req.body;
    const channel = new Channel({
      name,
      description,
      isPrivate,
      members: [new mongoose.Types.ObjectId(req.userState._id)],
      createdBy: new mongoose.Types.ObjectId(req.userState._id)
    });

    await channel.save();
    res.status(201).json(channel);
  } catch (error) {
    console.error('Error creating channel:', error);
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return res.status(400).json({ message: 'Channel name already exists' });
    }
    res.status(500).json({ message: 'Error creating channel' });
  }
});

// Join channel
router.post('/:id/join', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!isAuthenticated(req.userState)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const userId = getAuthenticatedUserId(req.userState);

    // Check if already a member
    if (channel.members.some(id => id.equals(userId))) {
      return res.status(400).json({ message: 'Already a member' });
    }

    channel.members.push(new mongoose.Types.ObjectId(userId));
    await channel.save();

    res.json(channel);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave channel (auth required)
router.post('/:id/leave', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userState || !isAuthenticated(req.userState)) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const userId = new mongoose.Types.ObjectId(req.userState._id);
    if (!channel.members.some(id => id.equals(userId))) {
      return res.status(400).json({ message: 'Not a member' });
    }

    channel.members = channel.members.filter(id => !id.equals(userId));
    await channel.save();

    res.json(channel);
  } catch (error) {
    console.error('Error leaving channel:', error);
    res.status(500).json({ message: 'Error leaving channel' });
  }
});

// Get channel users
router.get('/:channelId/users', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!isAuthenticated(req.userState)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const channel = await Channel.findById(req.params.channelId)
      .populate('members', 'username email');

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const userId = getAuthenticatedUserId(req.userState);
    if (channel.isPrivate && !channel.members.some(id => id.equals(userId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(channel.members);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;