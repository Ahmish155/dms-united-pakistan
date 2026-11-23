import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from './config/db';
import { UserModel } from './modules/auth/user.model';
import {
  WorkspaceModel,
  WorkspaceMemberModel,
  WorkspaceSettingsModel
} from './modules/workspaces/workspace.model';
import {
  SystemRole,
  WorkspaceRole,
  DEFAULT_THRESHOLDS
} from '@dms/shared';

export const seedDatabase = async () => {
  console.log('[Seed] Seeding initial demonstration workspace: Sector Gulraiz...');

  // 1. Create or update Sector Secretary
  const salt = await bcrypt.genSalt(10);
  const secretaryPassHash = await bcrypt.hash('GulraizSec2026!', salt);
  const spectatorPassHash = await bcrypt.hash('Viewer2026!', salt);

  let secretary = await UserModel.findOne({ email: 'secretary.gulraiz@dms.pk' });
  if (!secretary) {
    secretary = await UserModel.create({
      name: 'Sector Secretary Gulraiz',
      email: 'secretary.gulraiz@dms.pk',
      passwordHash: secretaryPassHash,
      systemRole: SystemRole.STANDARD_USER,
      status: 'ACTIVE'
    });
  }

  let spectator = await UserModel.findOne({ email: 'viewer@dms.pk' });
  if (!spectator) {
    spectator = await UserModel.create({
      name: 'Executive Spectator',
      email: 'viewer@dms.pk',
      passwordHash: spectatorPassHash,
      systemRole: SystemRole.STANDARD_USER,
      status: 'ACTIVE'
    });
  }

  // 2. Create Sector Gulraiz Workspace
  let workspace = await WorkspaceModel.findOne({ code: 'GULRAIZ' });
  if (!workspace) {
    workspace = await WorkspaceModel.create({
      name: 'Sector Gulraiz',
      code: 'GULRAIZ',
      status: 'ACTIVE',
      createdById: secretary._id
    });
  }

  // 3. Configure default settings
  await WorkspaceSettingsModel.findOneAndUpdate(
    { workspaceId: workspace._id },
    {
      workspaceId: workspace._id,
      thresholds: DEFAULT_THRESHOLDS,
      allowSpectatorExports: false
    },
    { upsert: true, new: true }
  );

  // 4. Assign Memberships
  await WorkspaceMemberModel.findOneAndUpdate(
    { workspaceId: workspace._id, userId: secretary._id },
    {
      workspaceId: workspace._id,
      userId: secretary._id,
      role: WorkspaceRole.SECTOR_SECRETARY,
      grantedBy: secretary._id,
      permissions: { canExportReports: true }
    },
    { upsert: true, new: true }
  );

  await WorkspaceMemberModel.findOneAndUpdate(
    { workspaceId: workspace._id, userId: spectator._id },
    {
      workspaceId: workspace._id,
      userId: spectator._id,
      role: WorkspaceRole.SPECTATOR,
      grantedBy: secretary._id,
      permissions: { canExportReports: false }
    },
    { upsert: true, new: true }
  );

  console.log(`[Seed] Successfully seeded Sector Gulraiz workspace (ID: ${workspace._id})`);
  console.log('[Seed] Sector Secretary: secretary.gulraiz@dms.pk (Password: GulraizSec2026!)');
  console.log('[Seed] Spectator Viewer: viewer@dms.pk (Password: Viewer2026!)');
};

if (require.main === module) {
  connectDB()
    .then(() => seedDatabase())
    .then(() => disconnectDB())
    .then(() => {
      console.log('[Seed] Completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Error during seeding:', err);
      process.exit(1);
    });
}
