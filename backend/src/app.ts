import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketService } from './services/WebSocketService';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import channelRoutes from './routes/channels';
import messageRoutes from './routes/messages';
import userRoutes from './routes/userRoutes';
import dmRoutes from './routes/directMessages';
import conversationRoutes from './routes/conversationRoutes';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { User } from './models/User';

dotenv.config();

const app = express();
const httpServer = createServer(app);
let wsService: WebSocketService;

// Parse JSON bodies
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: [
    'https://chappy-frontend.onrender.com',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting
app.use(apiLimiter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.json(status);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/conversations', conversationRoutes);

// Add this after other routes but before error handlers
app.get('/api/test/db', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const status = {
      mongodb: dbStatus === 1 ? 'connected' : 'disconnected',
      server: 'running'
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Database connection test failed' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username avatarColor isOnline');
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and WebSocket service
export const initializeServer = async () => {
  try {
    await connectDB();
    wsService = new WebSocketService(httpServer);
  } catch (err) {
    console.error('Failed to initialize server:', err);
    throw err;
  }
};

export { app, httpServer, wsService };