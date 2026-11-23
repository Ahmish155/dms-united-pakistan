import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspaceScope';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.get('/', SettingsController.getSettings);
router.patch('/', SettingsController.updateSettings);

export const settingsRoutes = router;
