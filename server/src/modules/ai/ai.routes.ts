import { Router } from 'express';
import { AiController } from './ai.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspaceScope';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.post('/parse', AiController.parseText);
router.post('/commit', AiController.commitBatch);
router.post('/undo/:batchId', AiController.undoBatch);
router.post('/ask', AiController.ask);

export const aiRoutes = router;
