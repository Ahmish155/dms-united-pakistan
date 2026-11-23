import { Router } from 'express';
import { MeetingController } from './meeting.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspaceScope';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.post('/', MeetingController.recordMeeting);
router.get('/', MeetingController.getMeetings);
router.get('/:id', MeetingController.getMeetingById);
router.patch('/:id', MeetingController.updateMeeting);
router.delete('/:id', MeetingController.deleteMeeting);

export const meetingRoutes = router;
