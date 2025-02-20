import type { User } from './user';

export interface Channel {
  _id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  members: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
}

export interface Message {
  _id: string;
  content: string;
  channel: string;
  sender: User;
  createdAt: string;
}

export interface ChatState {
  channels: Channel[];
  currentChannel: Channel | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface Conversation {
  _id: string;
  username: string;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface User {
  _id: string;
  username: string;
  type: 'authenticated' | 'guest';
}