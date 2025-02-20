import type { Message } from './chat';

export interface ServerToClientEvents {
  message: (message: Message) => void;
  error: (error: { message: string }) => void;
  user_status: (data: { userId: string | null; username: string; status: string }) => void;
}

export interface ClientToServerEvents {
  join_channel: (channelId: string) => void;
  leave_channel: (channelId: string) => void;
  send_message: (data: { channelId: string; content: string }) => void;
}

export interface SocketAuth {
  token?: string;
}
