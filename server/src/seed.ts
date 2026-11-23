import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from './config/db';
import { UserModel } from './modules/auth/user.model';
import {
  WorkspaceModel,
  WorkspaceMemberModel,
  WorkspaceSettingsModel
} from './modules/workspaces/workspace.model';
import { UnitModel } from './modules/units/unit.model';
import { PersonModel } from './modules/people/person.model';
import {
  SystemRole,
  WorkspaceRole,
  PersonStage,
  OrganizationalResponsibility,
  DEFAULT_THRESHOLDS
} from '@dms/shared';

export const seedDatabase = async () => {
  console.log('[Seed] Seeding demonstration workspace: Sector Gulraiz...');

  // 1. Create or update Sector Secretary & Spectator
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

  // 5. Seed Units (Morgah, Lalkurti, Comsats, Hostel City)
  const unitDefs = [
    { name: 'Morgah', code: 'MOR' },
    { name: 'Lalkurti', code: 'LAL' },
    { name: 'Comsats', code: 'COM' },
    { name: 'Hostel City', code: 'HOS' }
  ];

  const unitMap = new Map<string, any>();
  for (const u of unitDefs) {
    let unit = await UnitModel.findOne({ workspaceId: workspace._id, name: u.name });
    if (!unit) {
      unit = await UnitModel.create({
        workspaceId: workspace._id,
        name: u.name,
        code: u.code,
        isActive: true
      });
    }
    unitMap.set(u.name, unit);
  }

  // 6. Seed Mentors, Daeen & Rabtakars
  const coreMembers = [
    { name: 'Shahzaib', unit: 'Morgah', roles: [OrganizationalResponsibility.DAEEN] },
    { name: 'Hamza', unit: 'Morgah', roles: [OrganizationalResponsibility.RABTAKAR, OrganizationalResponsibility.DAEEN] },
    { name: 'Aqeel', unit: 'Morgah', roles: [OrganizationalResponsibility.RABTAKAR, OrganizationalResponsibility.DAEEN] },
    { name: 'Arslan', unit: 'Morgah', roles: [OrganizationalResponsibility.RABTAKAR] },
    { name: 'Ahmish', unit: 'Morgah', roles: [OrganizationalResponsibility.DAEEN] },
    { name: 'Ahmed Tariq', unit: 'Lalkurti', roles: [OrganizationalResponsibility.RABTAKAR] }
  ];

  const personMap = new Map<string, any>();
  let count = await PersonModel.countDocuments({ workspaceId: workspace._id });

  for (const cm of coreMembers) {
    let p = await PersonModel.findOne({ workspaceId: workspace._id, fullName: cm.name });
    if (!p) {
      count++;
      p = await PersonModel.create({
        workspaceId: workspace._id,
        internalId: `UP-${count.toString().padStart(4, '0')}`,
        fullName: cm.name,
        currentUnitId: unitMap.get(cm.unit)._id,
        currentStage: cm.roles.includes(OrganizationalResponsibility.RABTAKAR)
          ? PersonStage.RABTAKAR
          : PersonStage.OTHER,
        roles: cm.roles,
        isArchived: false
      });
    }
    personMap.set(cm.name, p);
  }

  // 7. Seed MDF & Madu from Part 22
  const samplePeople = [
    // Morgah
    { name: 'Modeel', unit: 'Morgah', stage: PersonStage.MDF, rbt: 'Hamza', dae: 'Shahzaib' },
    { name: 'Umer', unit: 'Morgah', stage: PersonStage.MDF, rbt: 'Aqeel', dae: 'Hamza' },
    { name: 'Tayyab', unit: 'Morgah', stage: PersonStage.MADU, rbt: 'Arslan', dae: 'Ahmish' },
    { name: 'Wasi', unit: 'Morgah', stage: PersonStage.MADU, rbt: 'Ahmed Tariq', dae: 'Aqeel' },
    { name: 'Abdul Rafay', unit: 'Morgah', stage: PersonStage.MADU, rbt: 'Arslan', dae: 'Hamza' },

    // Lalkurti
    { name: 'Rehman', unit: 'Lalkurti', stage: PersonStage.MADU, rbt: 'Ahmed Tariq', dae: 'Shahzaib' },
    { name: 'Farhat', unit: 'Lalkurti', stage: PersonStage.MADU, rbt: 'Ahmed Tariq', dae: 'Aqeel' },
    { name: 'Ashar', unit: 'Lalkurti', stage: PersonStage.MADU, rbt: 'Hamza', dae: 'Hamza' },

    // Comsats
    { name: 'Sadeem', unit: 'Comsats', stage: PersonStage.MDF, rbt: 'Hamza', dae: 'Shahzaib' },
    { name: 'Haris', unit: 'Comsats', stage: PersonStage.MADU, rbt: 'Aqeel', dae: 'Ahmish' },
    { name: 'Amaar', unit: 'Comsats', stage: PersonStage.MADU, rbt: 'Arslan', dae: 'Hamza' },
    { name: 'Taki', unit: 'Comsats', stage: PersonStage.MADU, rbt: 'Arslan', dae: 'Shahzaib' },
    { name: 'Asad', unit: 'Comsats', stage: PersonStage.MADU, rbt: 'Hamza', dae: 'Aqeel' },
    { name: 'Anam', unit: 'Comsats', stage: PersonStage.MADU, rbt: 'Aqeel', dae: 'Hamza' },

    // Hostel City
    { name: 'Hussain', unit: 'Hostel City', stage: PersonStage.MDF, rbt: 'Hamza', dae: 'Shahzaib' },
    { name: 'Sarfraz', unit: 'Hostel City', stage: PersonStage.MDF, rbt: 'Aqeel', dae: 'Hamza' },
    { name: 'Abad', unit: 'Hostel City', stage: PersonStage.MADU, rbt: 'Arslan', dae: 'Ahmish' },
    { name: 'Rehan', unit: 'Hostel City', stage: PersonStage.MADU, rbt: 'Ahmed Tariq', dae: 'Aqeel' },
    { name: 'Kumail', unit: 'Hostel City', stage: PersonStage.MADU, rbt: 'Arslan', dae: 'Shahzaib' },
    { name: 'Azlan', unit: 'Hostel City', stage: PersonStage.MADU, rbt: 'Hamza', dae: 'Hamza' }
  ];

  for (const sp of samplePeople) {
    let p = await PersonModel.findOne({ workspaceId: workspace._id, fullName: sp.name });
    if (!p) {
      count++;
      await PersonModel.create({
        workspaceId: workspace._id,
        internalId: `UP-${count.toString().padStart(4, '0')}`,
        fullName: sp.name,
        currentUnitId: unitMap.get(sp.unit)._id,
        currentStage: sp.stage,
        roles: [],
        primaryRabtakarId: personMap.get(sp.rbt)?._id,
        defaultDaeenId: personMap.get(sp.dae)?._id,
        isArchived: false
      });
    }
  }

  console.log(`[Seed] Successfully seeded Sector Gulraiz workspace with ${samplePeople.length} people and 4 units.`);
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
