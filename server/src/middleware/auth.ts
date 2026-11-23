import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { SystemRole } from '@dms/shared';
import { UserModel, IUserDoc } from '../modules/auth/user.model';
import { AppError } from './errorHandler';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  systemRole: SystemRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
      workspaceId?: string;
      membership?: {
        role: string;
        permissions: {
          canExportReports: boolean;
        };
      };
    }
  }
}

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Missing Bearer token.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUserPayload;

    const user = (await UserModel.findById(decoded.id).exec()) as IUserDoc | null;
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('User account not found or suspended.', 401);
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      systemRole: user.systemRole
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired authentication token.', 401));
    }
    next(error);
  }
};
