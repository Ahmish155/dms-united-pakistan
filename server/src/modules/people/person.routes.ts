import { Router } from 'express';
import { PersonController } from './person.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspaceScope';

const router = Router();

router.use(requireAuth);
router.use(requireWorkspace);

router.post('/', PersonController.createPerson);
router.get('/', PersonController.getPeople);
router.get('/:id', PersonController.getPersonById);
router.patch('/:id', PersonController.updatePerson);
router.delete('/:id', PersonController.deletePerson);
router.post('/:id/promote', PersonController.promotePerson);
router.post('/:id/transfer', PersonController.transferPerson);

export const personRoutes = router;
