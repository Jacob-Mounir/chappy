import { Request, Response } from 'express';
import { User } from '../models/User';
import type { RouteHandler } from '../types/express';
import type { AuthRequest } from '../middleware/auth';

export const getOnlineUsers: RouteHandler = async (req, res) => {
  try {
    const users = await User.find({ isOnline: true })
      .select('username avatarColor');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching online users' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find()
      .select('username isOnline')
      .sort({ username: 1 });

    // If authenticated, exclude the current user from the list
    const filteredUsers = req.user
      ? users.filter(user => user._id.toString() !== req.user?._id.toString())
      : users;

    res.json(filteredUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, 'username avatarColor isOnline');
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const getOrCreateConversation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { recipientId } = req.params;

    // Logic to find or create a conversation
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    res.status(500).json({ message: 'Error handling conversation' });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('username isOnline');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};
