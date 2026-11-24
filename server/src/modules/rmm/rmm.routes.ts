import { Router } from 'express';
import { RmmController } from './rmm.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspaceScope';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.post('/', RmmController.createRmm);
router.get('/', RmmController.getRmmList);
router.get('/:id/progress', RmmController.getRmmProgress);
router.patch('/:id', RmmController.updateRmm);
router.delete('/:id', RmmController.deleteRmm);

export const rmmRoutes = router;
