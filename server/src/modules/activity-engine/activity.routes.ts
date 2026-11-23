import { Router } from 'express';
import { ActivityController } from './activity.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspaceScope';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.get('/overview', ActivityController.getOverview);
router.get('/dashboard', ActivityController.getDashboard);

export const activityRoutes = router;
