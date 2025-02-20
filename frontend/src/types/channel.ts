export interface Channel {
  _id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  members: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}