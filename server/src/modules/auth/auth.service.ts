import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, IUserDoc } from './user.model';
import { WorkspaceModel, WorkspaceMemberModel, WorkspaceSettingsModel } from '../workspaces/workspace.model';
import { ENV } from '../../config/env';
import { SystemRole, WorkspaceRole, DEFAULT_THRESHOLDS } from '@dms/shared';
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

    // If first user ever, make Super Admin & ACTIVE
    const userCount = await UserModel.countDocuments();
    const isFirstUser = userCount === 0;

    const user = await UserModel.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      systemRole: isFirstUser ? SystemRole.SUPER_ADMIN : (data.systemRole || SystemRole.STANDARD_USER),
      status: isFirstUser ? 'ACTIVE' : 'PENDING_APPROVAL'
    });

    if (user.status === 'PENDING_APPROVAL') {
      return {
        pendingApproval: true,
        message: 'Account created successfully. Your account is pending Super Admin approval before you can log in.',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          systemRole: user.systemRole
        }
      };
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

  static async login(data: { email: string; password: string }) {
    const user = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status === 'PENDING_APPROVAL') {
      throw new AppError('Your account is awaiting approval by the Super Admin.', 403);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('Account is suspended or inactive.', 403);
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

  static async firebaseLogin(data: { email: string; name?: string; idToken?: string }) {
    if (!data.email) {
      throw new AppError('Valid email required for Firebase authentication', 400);
    }

    const email = data.email.toLowerCase();
    let user = await UserModel.findOne({ email });

    if (!user) {
      const userCount = await UserModel.countDocuments();
      const isFirstUser = userCount === 0;
      const dummyHash = await bcrypt.hash(`firebase_${Date.now()}_auth`, 10);
      user = await UserModel.create({
        name: data.name || email.split('@')[0],
        email,
        passwordHash: dummyHash,
        systemRole: isFirstUser ? SystemRole.SUPER_ADMIN : SystemRole.STANDARD_USER,
        status: isFirstUser ? 'ACTIVE' : 'PENDING_APPROVAL'
      });
    }

    if (user.status === 'PENDING_APPROVAL') {
      throw new AppError('Your account is awaiting approval by the Super Admin.', 403);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('User account suspended', 403);
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

  static async getPendingUsers() {
    return UserModel.find({ status: 'PENDING_APPROVAL' }).select('-passwordHash').sort({ createdAt: -1 });
  }

  static async approveUser(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    user.status = 'ACTIVE';
    await user.save();

    // Auto-create a clean, empty workspace for the approved Secretary Dawat if they have none
    const existingMember = await WorkspaceMemberModel.findOne({ userId: user._id });
    if (!existingMember) {
      const sectorName = `Sector ${user.name.split(' ')[0]}`;
      const sectorCode = `SEC-${user._id.toString().substring(18).toUpperCase()}`;

      const workspace = await WorkspaceModel.create({
        name: sectorName,
        code: sectorCode,
        status: 'ACTIVE',
        createdById: user._id
      });

      await WorkspaceSettingsModel.create({
        workspaceId: workspace._id,
        thresholds: DEFAULT_THRESHOLDS,
        allowSpectatorExports: false
      });

      await WorkspaceMemberModel.create({
        workspaceId: workspace._id,
        userId: user._id,
        role: WorkspaceRole.SECTOR_SECRETARY,
        grantedBy: user._id,
        permissions: { canExportReports: true }
      });
    }

    return user;
  }

  static async rejectUser(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    user.status = 'SUSPENDED';
    await user.save();
    return user;
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
