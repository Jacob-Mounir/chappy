import { Document, Types } from 'mongoose';

export interface BaseUser {
  _id: string | Types.ObjectId;
  username: string;
  email: string;
}

export interface AuthenticatedUser extends BaseUser {
  type: 'authenticated';
}

export interface GuestUser {
  type: 'guest';
  username: string;
}

export type UserState = AuthenticatedUser | GuestUser;

export interface UserDocument extends Document {
  username: string;
  email: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}