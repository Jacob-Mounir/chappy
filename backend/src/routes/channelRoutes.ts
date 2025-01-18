import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Channel } from '../models/Channel';
import { validate } from '../middleware/validate';
import { schemas } from '../validation/schemas';
import { Types } from 'mongoose';
import { getChannelUsers } from '../controllers/channelController';

const router = Router();

// Get all channels (public ones and private ones where user is a member)
router.get('/', async (req: AuthRequest, res) => {
  try {
    let query: any;

    if (req.userState?.type === 'authenticated') {
      // Authenticated users can see all public channels and private channels they're members of
      query = {
        $or: [
          { isPrivate: false },
          {
            isPrivate: true,
            members: new Types.ObjectId(req.userState._id)
          }
        ]
      };
    } else {
      // Guest users can see all public channels except 'nyheter'
      query = {
        isPrivate: false,
        name: { $ne: 'nyheter' }
      };
    }

    const channels = await Channel.find(query)
      .populate('members', 'username')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    // Format channels for response
    const formattedChannels = channels.map(channel => ({
      _id: channel._id,
      name: channel.name,
      description: channel.description,
      isPrivate: channel.isPrivate,
      createdBy: channel.createdBy,
      members: channel.members.map(member => member._id),
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt
    }));

    res.json(formattedChannels);
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

    // Check if channel name already exists
    const existingChannel = await Channel.findOne({ name: name.trim() });
    if (existingChannel) {
      return res.status(400).json({ message: 'Channel name already exists' });
    }

    const channel = new Channel({
      name: name.trim(),
      description: description?.trim(),
      isPrivate: isPrivate || false,
      createdBy: req.userState._id,
      members: [req.userState._id] // Creator is automatically a member
    });

    await channel.save();

    // Populate creator info before sending response
    await channel.populate('createdBy', 'username');
    res.status(201).json(channel);
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ message: 'Error creating channel' });
  }
});

// Get channel by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .populate('members', 'username')
      .populate('createdBy', 'username');

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check access for private channels
    if (channel.isPrivate) {
      if (req.userState?.type !== 'authenticated') {
        return res.status(403).json({ message: 'Authentication required for private channels' });
      }

      // Now TypeScript knows req.userState is authenticated and has _id
      const userId = new Types.ObjectId(req.userState._id);
      const isChannelMember = channel.members.some(member =>
        member._id.equals(userId)
      );

      if (!isChannelMember) {
        return res.status(403).json({ message: 'Access denied: You are not a member of this channel' });
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
    if (req.userState?.type !== 'authenticated') {
      return res.status(403).json({ message: 'Only channel creator can update channel' });
    }

    const userId = new Types.ObjectId(req.userState._id);
    if (!channel.createdBy.equals(userId)) {
      return res.status(403).json({ message: 'Only channel creator can update channel' });
    }

    const { name, description, isPrivate } = req.body;

    // Check if new name already exists (if name is being changed)
    if (name !== channel.name) {
      const existingChannel = await Channel.findOne({ name: name.trim() });
      if (existingChannel) {
        return res.status(400).json({ message: 'Channel name already exists' });
      }
    }

    channel.name = name.trim();
    if (description !== undefined) {
      channel.description = description.trim();
    }
    if (isPrivate !== undefined) {
      channel.isPrivate = isPrivate;
    }

    await channel.save();
    await channel.populate('createdBy', 'username');
    await channel.populate('members', 'username');
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
    if (channel.isPrivate) {
      if (req.userState?.type !== 'authenticated') {
        return res.status(403).json({ message: 'Only channel creator can add members to private channels' });
      }

      const creatorId = new Types.ObjectId(req.userState._id);
      if (!channel.createdBy.equals(creatorId)) {
        return res.status(403).json({ message: 'Only channel creator can add members to private channels' });
      }
    }

    // Check if user is already a member
    const memberObjectId = new Types.ObjectId(userId);
    if (channel.members.some(id => id.equals(memberObjectId))) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    channel.members.push(memberObjectId);
    await channel.save();
    await channel.populate('members', 'username');
    await channel.populate('createdBy', 'username');
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

    if (req.userState?.type !== 'authenticated') {
      return res.status(403).json({ message: 'Authentication required' });
    }

    const { userId } = req.params;
    const userObjectId = new Types.ObjectId(userId);
    const currentUserId = new Types.ObjectId(req.userState._id);

    // Only creator can remove members, or users can remove themselves
    if (!channel.createdBy.equals(currentUserId) && !currentUserId.equals(userObjectId)) {
      return res.status(403).json({ message: 'Unauthorized to remove member' });
    }

    // Cannot remove creator
    if (channel.createdBy.equals(userObjectId)) {
      return res.status(400).json({ message: 'Cannot remove channel creator' });
    }

    channel.members = channel.members.filter(id => !id.equals(userObjectId));
    await channel.save();
    await channel.populate('members', 'username');
    await channel.populate('createdBy', 'username');
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

    if (req.userState?.type !== 'authenticated') {
      return res.status(403).json({ message: 'Only channel creator can delete channel' });
    }

    const userId = new Types.ObjectId(req.userState._id);
    if (!channel.createdBy.equals(userId)) {
      return res.status(403).json({ message: 'Only channel creator can delete channel' });
    }

    await Channel.deleteOne({ _id: req.params.id });
    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ message: 'Error deleting channel' });
  }
});

// Get channel users
router.get('/:id/users', requireAuth, getChannelUsers);

// Join channel
router.post('/:id/join', requireAuth, async (req: AuthRequest, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check if user is authenticated for private channels
    if (channel.isPrivate) {
      if (req.userState?.type !== 'authenticated') {
        return res.status(403).json({ message: 'Authentication required for private channels' });
      }

      const userId = new Types.ObjectId(req.userState._id);
      const isChannelMember = channel.members.some(id => id.equals(userId));

      if (!isChannelMember) {
        return res.status(403).json({ message: 'Access denied: You are not a member of this private channel' });
      }
    }

    // If user is already a member, just return the channel
    if (req.userState?.type === 'authenticated') {
      const userId = new Types.ObjectId(req.userState._id);
      if (channel.members.some(id => id.equals(userId))) {
        await channel.populate('members', 'username');
        await channel.populate('createdBy', 'username');
        return res.json(channel);
      }

      // Add user to members if not already a member
      channel.members.push(userId);
    }

    await channel.save();
    await channel.populate('members', 'username');
    await channel.populate('createdBy', 'username');
    res.json(channel);
  } catch (error) {
    console.error('Error joining channel:', error);
    res.status(500).json({ message: 'Error joining channel' });
  }
});

export default router;