import { Router } from 'express';
import { ReportController } from './report.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspaceScope';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.get('/weekly', ReportController.getWeeklyReport);
router.get('/monthly', ReportController.getMonthlyReport);
router.get('/export/:format', ReportController.exportReport);

export const reportRoutes = router;
