import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { registerUserSchema, loginSchema } from '@dms/shared';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerUserSchema.parse(req.body);
      const result = await AuthService.register(validated);
      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login(validated);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async firebaseLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, name, idToken } = req.body;
      const result = await AuthService.firebaseLogin({ email, name, idToken });
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      data: req.user
    });
  }

  static async getPendingUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await AuthService.getPendingUsers();
      return res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  static async approveUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.approveUser(req.params.id);
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.rejectUser(req.params.id);
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}
