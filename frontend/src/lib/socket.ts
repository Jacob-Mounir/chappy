import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../../../backend/src/types/socket';

class SocketService {
	private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

	connect() {
		if (!this.socket) {
			this.socket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:3000', {
				autoConnect: true,
				reconnection: true
			});

			this.socket.on('connect', () => {
				console.log('Connected to WebSocket server');
			});

			this.socket.on('disconnect', () => {
				console.log('Disconnected from WebSocket server');
			});
		}
		return this.socket;
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
	}

	joinChannel(channelId: string) {
		this.socket?.emit('join_channel', channelId);
	}

	leaveChannel(channelId: string) {
		this.socket?.emit('leave_channel', channelId);
	}

	sendMessage(channelId: string, content: string) {
		this.socket?.emit('send_message', { channelId, content });
	}

	onMessage(callback: (message: any) => void) {
		this.socket?.on('message', callback);
	}

	onError(callback: (error: { message: string }) => void) {
		this.socket?.on('error', callback);
	}
}

export const socketService = new SocketService();