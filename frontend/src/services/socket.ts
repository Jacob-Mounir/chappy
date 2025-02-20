import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket';
import type { Message } from '../types/messages';
import { env } from '../config/env';

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private isConnected = false;
  private messageQueue: { channelId: string; content: string; guestName?: string }[] = [];

  connect(token: string | null, guestName?: string) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(env.SOCKET_URL, {
      auth: token ? { token } : { guestName: guestName || 'Guest' },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    this.setupListeners();
    return this.socket;
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  joinChannel(channelId: string) {
    this.socket?.emit('join_channel', channelId);
  }

  leaveChannel(channelId: string) {
    this.socket?.emit('leave_channel', channelId);
  }

  sendMessage(channelId: string, content: string, guestName?: string) {
    this.socket?.emit('message', { channelId, content, guestName });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();