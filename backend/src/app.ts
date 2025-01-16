import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import routes from './routes';
import cors from 'cors';
import mongoose from 'mongoose';
import { seedData } from './config/seed';
import { AuthRequest } from './types/express';
import { Server } from 'socket.io';
import { createServer } from 'http';

dotenv.config();

const app = express();

// Parse JSON bodies
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://chappy-frontend.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware (AFTER body parsing)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: req.headers
  });
  next();
});

// Request logging middleware
app.use((req: AuthRequest, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers,
    userState: req.userState // Nu ska TypeScript vara nöjd
  });
  next();
});

// Basic health check route
app.get('/health', (_, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Mount routes directly (no /api prefix)
app.use(routes);

// 404 handler - must be before error handler
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

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://chappy-frontend.onrender.com'
    ],
    credentials: true
  }
});

// Hantera Socket.IO anslutningar
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Lyssna efter när en användare ansluter till ett rum (konversation)
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation: ${conversationId}`);
  });

  // Lyssna efter nya meddelanden
  socket.on('send_message', async (data) => {
    const { conversationId, message } = data;

    // Spara meddelandet i databasen
    // ... din existerande logik för att spara meddelanden ...

    // Skicka meddelandet till alla i konversationen
    io.to(conversationId).emit('receive_message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const startServer = async () => {
  try {
    await connectDB();
    await seedData();

    if (mongoose.connection.readyState === 1) {
      const PORT = process.env.PORT || 5001;
      httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`MongoDB connected: ${mongoose.connection.host}`);
      });
    } else {
      console.error('Failed to connect to MongoDB. Server not started.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;