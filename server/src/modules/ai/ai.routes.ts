import { Router } from 'express';
import { AiController } from './ai.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspaceScope';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

// Phase 2: Ingestion
router.post('/parse-input', AiController.parseInput);
router.post('/parse', AiController.parseInput);
router.post('/commit', AiController.commitBatch);
router.post('/undo/:batchId', AiController.undoBatch);

// Phase 3: Natural Language Database Q&A
router.post('/query', AiController.query);
router.post('/ask', AiController.query);

export const aiRoutes = router;
