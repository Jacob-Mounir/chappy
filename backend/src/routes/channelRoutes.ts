import { Router } from 'express';
import { requireAuth, AuthRequest, isAuthenticated, getAuthenticatedUserId } from '../middleware/auth';
import { Channel } from '../models/Channel';
import { validate } from '../middleware/validate';
import { schemas } from '../validation/schemas';
import mongoose, { Types } from 'mongoose';

const router = Router();

// Get all channels
router.get('/', async (req: AuthRequest, res) => {
  try {
    const channels = await Channel.find({
      $or: [
        { isPrivate: false },
        {
          isPrivate: true,
          members: req.userState?.type === 'authenticated' ? req.userState._id : { $exists: false }
        }
      ]
    });

    res.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ message: 'Error fetching channels' });
  }
});

// Create a new channel
router.post('/', requireAuth, validate(schemas.channel.create), async (req: AuthRequest, res) => {
  try {
    const { name, description, isPrivate } = req.body;

    if (req.userState?.type !== 'authenticated') {
      return res.status(403).json({ message: 'Only authenticated users can create channels' });
    }

    const channel = new Channel({
      name: name.trim(),
      description: description?.trim(),
      isPrivate: isPrivate || false,
      createdBy: req.userState._id,
      members: [req.userState._id] // Creator is automatically a member
    });

    await channel.save();
    res.status(201).json(channel);
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ message: 'Error creating channel' });
  }
});

// Get channel by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check access for private channels
    if (channel.isPrivate) {
      if (req.userState?.type !== 'authenticated') {
        return res.status(403).json({ message: 'Authentication required for private channels' });
      }

      const userId = getAuthenticatedUserId(req.userState);
      if (!channel.members.some(id => id.equals(userId))) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(channel);
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ message: 'Error fetching channel' });
  }
});

// Update channel
router.put('/:id', requireAuth, validate(schemas.channel.create), async (req: AuthRequest, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Only creator can update channel
    if (req.userState?.type !== 'authenticated' ||
        !channel.createdBy.equals(new Types.ObjectId(req.userState._id))) {
      return res.status(403).json({ message: 'Only channel creator can update channel' });
    }

    const { name, description, isPrivate } = req.body;

    channel.name = name.trim();
    if (description !== undefined) {
      channel.description = description.trim();
    }
    if (isPrivate !== undefined) {
      channel.isPrivate = isPrivate;
    }

    await channel.save();
    res.json(channel);
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(500).json({ message: 'Error updating channel' });
  }
});

// Add member to channel
router.post('/:id/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Only creator can add members to private channels
    if (channel.isPrivate && req.userState?.type === 'authenticated' &&
        !channel.createdBy.equals(new Types.ObjectId(req.userState._id))) {
      return res.status(403).json({ message: 'Only channel creator can add members' });
    }

    // Check if user is already a member
    const memberObjectId = new Types.ObjectId(userId);
    if (channel.members.some(id => id.equals(memberObjectId))) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    channel.members.push(memberObjectId);
    await channel.save();
    res.json(channel);
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ message: 'Error adding member' });
  }
});

// Remove member from channel
router.delete('/:id/members/:userId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const { userId } = req.params;
    const userObjectId = new Types.ObjectId(userId);

    // Only creator can remove members, or users can remove themselves
    if (req.userState?.type !== 'authenticated' ||
        (!channel.createdBy.equals(new Types.ObjectId(req.userState._id)) &&
         !new Types.ObjectId(req.userState._id).equals(userObjectId))) {
      return res.status(403).json({ message: 'Unauthorized to remove member' });
    }

    // Cannot remove creator
    if (channel.createdBy.equals(userObjectId)) {
      return res.status(400).json({ message: 'Cannot remove channel creator' });
    }

    channel.members = channel.members.filter(id => !id.equals(userObjectId));
    await channel.save();
    res.json(channel);
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Error removing member' });
  }
});

// Delete channel
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Only creator can delete channel
    if (req.userState?.type !== 'authenticated' ||
        !channel.createdBy.equals(new Types.ObjectId(req.userState._id))) {
      return res.status(403).json({ message: 'Only channel creator can delete channel' });
    }

    await Channel.deleteOne({ _id: req.params.id });
    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ message: 'Error deleting channel' });
  }
});

export default router;