import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "../types/socket";
import { toast } from "sonner";
import { SOCKET_IO_URL } from '../config/constants';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
  autoConnect: true,
  reconnection: true,
  transports: ['websocket', 'polling']
}) as TypedSocket;

// Initialize connection handlers
socket.on('connect', () => {
  console.log('Socket connected');
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
  toast.error('Connection error. Trying to reconnect...');
});

// Connection management
export const connectSocket = (token: string | null, guestName?: string) => {
  const auth: any = {};

  if (token) {
    auth.token = token;
  } else {
    auth.guestName = guestName || 'Guest';
  }

  socket.auth = auth;

  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  socket.disconnect();
};

// Channel management
export const joinChannel = (channelId: string) => {
  socket.emit('join_channel', channelId);
};

export const leaveChannel = (channelId: string) => {
  socket.emit('leave_channel', channelId);
};

// Message handling
export const sendMessage = (channelId: string, content: string, guestName?: string) => {
  socket.emit('message', { channelId, content, guestName });
};

export default socket;
