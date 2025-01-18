import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import routes from './routes';
import cors from 'cors';
import { seedData } from './config/seed';
import { AuthRequest } from './types/express';
import { Server } from 'socket.io';
import { createServer } from 'http';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Parse JSON bodies
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  exposedHeaders: ['Access-Control-Allow-Origin']
}));

// Add headers middleware for all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Request logging middleware
app.use((req: AuthRequest, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers,
    userState: req.userState
  });
  next();
});

// Basic health check route
app.get('/health', (_, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Mount routes
app.use(routes);

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.path);
  res.status(404).json({ message: 'Not Found' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    details: err
  });

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  const joinedRooms = new Set<string>();

  socket.on('join_conversation', (conversationId) => {
    if (!joinedRooms.has(conversationId)) {
      socket.join(conversationId);
      joinedRooms.add(conversationId);
      console.log(`User ${socket.id} joined conversation: ${conversationId}`);
    }
  });

  socket.on('send_message', async (data) => {
    const { conversationId, message } = data;
    try {
      socket.to(conversationId).emit('receive_message', message);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    joinedRooms.clear();
  });
});

// Initialize database connection
connectDB().then(async () => {
  console.log('Connected to MongoDB');
  await seedData();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

export { app, httpServer };
export default app;