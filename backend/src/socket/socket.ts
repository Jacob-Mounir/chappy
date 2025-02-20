import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Message } from '../models/Message';
import { Channel } from '../models/Channel';
import { verifyToken } from '../middleware/auth';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket';

export const setupSocket = (server: HttpServer) => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const user = await verifyToken(token);
        socket.data.user = user;
      } catch (error) {
        // Allow connection without authentication
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_channel', (channelId: string) => {
      socket.join(channelId);
      console.log(`Client ${socket.id} joined channel ${channelId}`);
    });

    socket.on('leave_channel', (channelId: string) => {
      socket.leave(channelId);
      console.log(`Client ${socket.id} left channel ${channelId}`);
    });

    socket.on('send_message', async (data: { channelId: string; content: string }) => {
      try {
        const channel = await Channel.findById(data.channelId);
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        if (channel.isRestricted && !socket.data.user) {
          socket.emit('error', { message: 'Authentication required for this channel' });
          return;
        }

        const message = new Message({
          content: data.content.trim(),
          channel: data.channelId,
          sender: socket.data.user || { type: 'guest', username: 'Guest' }
        });

        const savedMessage = await message.save();
        const populatedMessage = await savedMessage.populate('sender', 'username');
        io.to(data.channelId).emit('message', populatedMessage.toObject());
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};