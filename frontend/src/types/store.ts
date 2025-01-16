export interface BaseMessage {
  _id?: string;
  content: string;
  createdAt: string;
}

export interface Message extends BaseMessage {
  sender: {
    _id: string;
    username: string;
    type?: 'authenticated' | 'guest';
  };
}

export interface DirectMessage extends BaseMessage {
  _id: string;
  sender: AuthenticatedUser;
  recipient: AuthenticatedUser;
}

export type AuthenticatedUser = {
  _id: string;
  username: string;
  email: string;
  type: 'authenticated';
};