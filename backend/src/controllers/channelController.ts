import { Request, Response } from 'express';
import { Channel } from '../models/Channel';
import type { AuthRequest, RouteHandler } from '../types/express';
import mongoose from 'mongoose';
import { schemas } from '../validation/schemas';
import { User, UserDocument } from '../models/User';

export const getChannels = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.userState?.type === 'authenticated'
      ? {}  // Empty query to show all channels
      : { isPrivate: false };  // Only show public channels for non-authenticated users

    const channels = await Channel.find(query)
      .populate('createdBy', 'username')
      .select('-members');

    res.json(channels);
  } catch (error) {
    console.error('Error in getChannels:', error);
    res.status(500).json({ message: 'Error fetching channels' });
  }
};

export const createChannel = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { error, value } = schemas.channel.create.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details[0].message
      });
    }

    const { name, description, isPrivate } = value;

    const existingChannel = await Channel.findOne({ name });
    if (existingChannel) {
      return res.status(400).json({ message: 'A channel with this name already exists' });
    }

    const channel = new Channel({
      name,
      description,
      isPrivate,
      members: [req.user._id],
      createdBy: req.user._id
    });

    await channel.save();
    await channel.populate('createdBy', 'username');

    res.status(201).json(channel);
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ message: 'Error creating channel' });
  }
};

export const joinChannel = async (req: AuthRequest, res: Response) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // For public channels, allow everyone
    if (!channel.isPrivate) {
      return res.json(channel);
    }

    // For private channels, require authentication
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Add authenticated user to members
    if (!channel.members.some(id => id.equals(req.user!._id))) {
      channel.members.push(req.user._id);
      await channel.save();
    }

    res.json(channel);
  } catch (error) {
    console.error('Error joining channel:', error);
    res.status(500).json({ message: 'Error joining channel' });
  }
};

export const leaveChannel = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const channel = await Channel.findById(req.params.channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const userId = req.user._id;
    if (!channel.members.some(id => id.equals(userId))) {
      return res.status(400).json({ message: 'Not a member of this channel' });
    }

    channel.members = channel.members.filter(id => !id.equals(userId));
    await channel.save();

    res.json({ message: 'Successfully left channel' });
  } catch (error) {
    res.status(500).json({ message: 'Error leaving channel' });
  }
};

export const getChannel = async (req: AuthRequest, res: Response) => {
  try {
    const channelId = req.params.channelId;
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // For private channels, require authentication and membership
    if (channel.isPrivate) {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required for private channels' });
      }

      // At this point, we know req.user exists
      const user = req.user;

      const isMember = channel.members.some(id => id.equals(user._id));
      if (!isMember) {
        return res.status(403).json({ message: 'You are not a member of this channel' });
      }
    }

    res.json(channel);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching channel' });
  }
};

export const deleteChannel = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const channel = await Channel.findById(req.params.channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    if (!channel.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await channel.deleteOne();
    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ message: 'Error deleting channel' });
  }
};

export const getChannelUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId)
      .populate<{ members: UserDocument[] }>('members', 'username isOnline')
      .exec();

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const users = channel.members.map(member => ({
      _id: member._id,
      username: member.username,
      isOnline: member.isOnline || false
    }));

    res.json(users);
  } catch (error) {
    console.error('Error fetching channel users:', error);
    res.status(500).json({ message: 'Error fetching channel users' });
  }
};