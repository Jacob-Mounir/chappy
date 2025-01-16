import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import { UserState, AuthenticatedUser } from '../types/common';

// Re-export AuthRequest type
export type { AuthRequest } from '../types/express';

// Helper function to check if user is authenticated
export const isAuthenticated = (userState: UserState | undefined): userState is AuthenticatedUser => {
  return Boolean(userState && userState.type === 'authenticated');
};

// Helper function to ensure user is authenticated and get ID
export const getAuthenticatedUserId = (userState: UserState | undefined): string => {
  if (!userState || userState.type !== 'authenticated') {
    throw new Error('User must be authenticated');
  }
  return userState._id.toString();
};

// Main auth middleware
export const auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.userState = {
      type: 'authenticated',
      _id: user._id.toString(),
      username: user.username,
      email: user.email
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Alias for auth middleware to maintain backward compatibility
export const requireAuth = auth;

// Middleware to attach user state - either authenticated or guest
export const attachUserState = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      req.userState = { type: 'guest', username: 'Guest' };
      return next();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user) {
      req.userState = { type: 'guest', username: 'Guest' };
      return next();
    }

    req.user = user;
    req.userState = {
      type: 'authenticated',
      _id: user._id.toString(),
      username: user.username,
      email: user.email
    };

    next();
  } catch (error) {
    req.userState = { type: 'guest', username: 'Guest' };
    next();
  }
};