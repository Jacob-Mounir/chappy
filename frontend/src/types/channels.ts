export interface Channel {
  _id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  isRestricted: boolean;
  createdBy: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  content: string;
  channel: string;
  sender: {
    userId?: string;
    username: string;
    type: 'authenticated' | 'guest';
  };
  createdAt: string;
}

export interface ChannelUser {
  _id: string;
  username: string;
  avatarColor: string;
  isOnline: boolean;
}