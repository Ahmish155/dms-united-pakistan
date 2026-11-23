import { Router } from 'express';
import { DmmController } from './dmm.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspaceScope';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.post('/', DmmController.saveDmm);
router.get('/', DmmController.getDmms);
router.get('/:id/variance', DmmController.getDmmVariance);

export const dmmRoutes = router;
