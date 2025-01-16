import { Request, Response, NextFunction } from 'express';
import { UserState, UserDocument } from './common';

export interface AuthRequest extends Request {
  userState?: UserState;
  user?: UserDocument;
}

export type RouteHandler = (
  req: AuthRequest,
  res: Response,
  next?: NextFunction
) => Promise<void | Response> | void | Response;

export type RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export type AuthRequestHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;