import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../middleware/auth';
import { Message } from '../models/Message';

export class WebSocketService {
	private io: Server;

	constructor(server: HttpServer) {
		this.io = new Server(server, {
			cors: {
				origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
				methods: ['GET', 'POST']
			}
		});

		this.io.use(async (socket, next) => {
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

		this.setupEventHandlers();
	}

	private setupEventHandlers() {
		this.io.on('connection', (socket) => {
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
					const message = new Message({
						content: data.content.trim(),
						channel: data.channelId,
						sender: socket.data.user || { type: 'guest', username: 'Guest' }
					});

					await message.save();
					this.io.to(data.channelId).emit('message', message);
				} catch (error) {
					console.error('Error sending message:', error);
					socket.emit('error', { message: 'Failed to send message' });
				}
			});

			socket.on('disconnect', () => {
				console.log('Client disconnected:', socket.id);
			});
		});
	}

	public getIO(): Server {
		return this.io;
	}
}