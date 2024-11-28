import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// API routes
app.use('/api', routes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../../frontend/dist');

  app.use(express.static(frontendBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

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

const startServer = async () => {
  try {
    await connectDB();

    if (mongoose.connection.readyState === 1) {
      const PORT = process.env.PORT || 5001;
      app.listen(PORT, () => {
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