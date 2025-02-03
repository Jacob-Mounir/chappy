import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      body: any;
      params: any;
      headers: any;
      header(name: string): string | undefined;
    }
  }
}

export {};

export interface AuthRequest extends Request {
  user: {
    _id: string;
    username: string;
    avatarColor?: string;
  };
}

export type RequestHandler<T = any> = (
  req: Request,
  res: Response
) => Promise<T | void>;

export type AuthRequestHandler<T = any> = (
  req: AuthRequest,
  res: Response
) => Promise<T | void>;

export type RouteHandler = (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => Promise<void>;