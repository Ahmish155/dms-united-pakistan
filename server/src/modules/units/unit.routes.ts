import { Router } from 'express';
import { UnitController } from './unit.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspaceScope';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.post('/', UnitController.createUnit);
router.get('/', UnitController.getUnits);
router.get('/:id', UnitController.getUnitById);
router.patch('/:id', UnitController.updateUnit);

export const unitRoutes = router;
