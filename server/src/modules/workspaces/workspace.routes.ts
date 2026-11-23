import { Router } from 'express';
import { WorkspaceController } from './workspace.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspaceScope';

const router = Router();

// Global workspace routes
router.use(requireAuth);
router.post('/', WorkspaceController.createWorkspace);
router.get('/my', WorkspaceController.getMyWorkspaces);
router.post('/access-requests/submit', WorkspaceController.requestSpectatorAccess);

// Contextual workspace routes
router.get('/:workspaceId', requireWorkspace, WorkspaceController.getWorkspaceDetails);
router.post('/:workspaceId/spectator-link', requireWorkspace, WorkspaceController.generateSpectatorLink);
router.get('/:workspaceId/access-requests', requireWorkspace, WorkspaceController.getAccessRequests);
router.patch('/:workspaceId/access-requests/:id', requireWorkspace, WorkspaceController.decideAccessRequest);

export const workspaceRoutes = router;
