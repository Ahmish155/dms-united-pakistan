import { Router } from 'express';
import { DfController } from './df.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspaceScope';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.post('/mentors', DfController.createMentor);
router.get('/mentors', DfController.getMentors);
router.post('/', DfController.recordDialogueForum);
router.get('/', DfController.getDialogueForums);
router.get('/analytics', DfController.getDfAnalytics);

export const dfRoutes = router;
