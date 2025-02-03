import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket';

export const createSocket = (token: string): Socket<ServerToClientEvents, ClientToServerEvents> => {
  return io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001', {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });
};