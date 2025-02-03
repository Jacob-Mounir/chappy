import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket';

const SOCKET_IO_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5173';

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  connect(token: string) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_IO_URL, {
      auth: { token },
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket']
    });

    this.socket.connect();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  onMessage(callback: (message: any) => void) {
    if (!this.socket) return () => {};
    this.socket.on('message', callback);
    return () => this.socket?.off('message', callback);
  }

  onChannelEvent(event: string, callback: () => void) {
    if (!this.socket) return () => {};
    this.socket.on(event, callback);
    return () => this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();