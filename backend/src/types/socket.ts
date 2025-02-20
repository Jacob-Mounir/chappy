import type { Message } from '../models/Message';

export interface ServerToClientEvents {
	message: (message: typeof Message) => void;
	error: (error: { message: string }) => void;
	user_status: (data: { userId: string | null; username: string; status: string }) => void;
}

export interface ClientToServerEvents {
	join_channel: (channelId: string) => void;
	leave_channel: (channelId: string) => void;
	send_message: (data: { channelId: string; content: string }) => void;
}

export interface InterServerEvents {
	ping: () => void;
}

export interface SocketData {
	user: {
		_id?: string;
		username: string;
		type: 'authenticated' | 'guest';
	};
}