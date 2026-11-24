import { Router } from 'express';
import { GmController } from './gm.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspaceScope';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.post('/', GmController.recordGroupMeeting);
router.get('/', GmController.getGroupMeetings);
router.get('/analytics', GmController.getGmAnalytics);
router.patch('/:id', GmController.updateGroupMeeting);
router.delete('/:id', GmController.deleteGroupMeeting);

export const gmRoutes = router;
