import { Request, Response } from 'express';
import { Channel } from '../models/Channel';
import type { AuthRequest, RouteHandler } from '../types/express';
import mongoose from 'mongoose';
import { schemas } from '../validation/schemas';

export const getChannels = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.user ? {} : { isPrivate: false };
    const channels = await Channel.find(query)
      .populate('createdBy', 'username')
      .select('-members');

    res.json(channels);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching channels' });
  }
};

export const createChannel = async (req: AuthRequest, res: Response) => {
  try {
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
      members: [new mongoose.Types.ObjectId(req.user._id)],
      createdBy: new mongoose.Types.ObjectId(req.user._id)
    });

    await channel.save();
    await channel.populate('createdBy', 'username');

    res.status(201).json(channel);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return res.status(400).json({ message: 'A channel with this name already exists' });
    }
    res.status(500).json({ message: 'Error creating channel' });
  }
};

export const joinChannel = async (req: AuthRequest, res: Response) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);
    if (channel.members.some(id => id.equals(userId))) {
      return res.status(400).json({ message: 'Already a member' });
    }

    channel.members.push(userId);
    await channel.save();

    res.json(channel);
  } catch (error) {
    res.status(500).json({ message: 'Error joining channel' });
  }
};

export const leaveChannel = async (req: AuthRequest, res: Response) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);
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
    const channel = await Channel.findById(req.params.channelId);

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);
    if (channel.isPrivate && !channel.members.some(id => id.equals(userId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(channel);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching channel' });
  }
};

export const deleteChannel = async (req: AuthRequest, res: Response) => {
  try {
    const channel = await Channel.findById(req.params.channelId);

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);
    if (!channel.createdBy.equals(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await channel.deleteOne();
    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting channel' });
  }
};

export const getPublicChannels: RouteHandler = async (req, res) => {
  try {
    const channels = await Channel.find({ isPrivate: false })
      .populate('createdBy', 'username')
      .select('-members');
    res.json(channels);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public channels' });
  }
};