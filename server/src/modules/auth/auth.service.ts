import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, IUserDoc } from './user.model';
import { ENV } from '../../config/env';
import { SystemRole } from '@dms/shared';
import { AppError } from '../../middleware/errorHandler';

export class AuthService {
  static async register(data: {
    name: string;
    email: string;
    password: string;
    systemRole?: SystemRole;
  }) {
    const existing = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await UserModel.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      systemRole: data.systemRole || SystemRole.STANDARD_USER,
      status: 'ACTIVE'
    });

    const token = this.generateToken(user);
    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        systemRole: user.systemRole
      }
    };
  }

  static async login(data: { email: string; password: string }) {
    const user = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = this.generateToken(user);
    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        systemRole: user.systemRole
      }
    };
  }

  static generateToken(user: IUserDoc) {
    return jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        systemRole: user.systemRole
      },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}
