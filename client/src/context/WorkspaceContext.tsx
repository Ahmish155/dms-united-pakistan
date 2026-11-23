import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { IWorkspace, WorkspaceRole } from '@dms/shared';
import { useAuth } from './AuthContext';

export interface WorkspaceMembership {
  workspace: IWorkspace;
  role: WorkspaceRole;
  permissions: {
    canExportReports: boolean;
  };
}

interface WorkspaceContextType {
  workspaces: WorkspaceMembership[];
  activeWorkspace: IWorkspace | null;
  activeRole: WorkspaceRole | null;
  permissions: { canExportReports: boolean };
  isLoading: boolean;
  setActiveWorkspaceId: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<IWorkspace | null>(null);
  const [activeRole, setActiveRole] = useState<WorkspaceRole | null>(null);
  const [permissions, setPermissions] = useState({ canExportReports: false });
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await ApiService.get<WorkspaceMembership[]>('/workspaces/my');
      setWorkspaces(data);

      const savedWorkspaceId = localStorage.getItem('dms_active_workspace_id');
      const found = data.find((m) => m.workspace?.id === savedWorkspaceId || (m.workspace as any)?._id === savedWorkspaceId);

      if (found) {
        setActiveWorkspace(found.workspace);
        setActiveRole(found.role);
        setPermissions(found.permissions || { canExportReports: false });
      } else if (data.length > 0) {
        const first = data[0];
        const firstId = first.workspace?.id || (first.workspace as any)?._id;
        localStorage.setItem('dms_active_workspace_id', firstId);
        setActiveWorkspace(first.workspace);
        setActiveRole(first.role);
        setPermissions(first.permissions || { canExportReports: false });
      } else {
        setActiveWorkspace(null);
        setActiveRole(null);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  const setActiveWorkspaceId = (workspaceId: string) => {
    const found = workspaces.find(
      (m) => m.workspace?.id === workspaceId || (m.workspace as any)?._id === workspaceId
    );
    if (found) {
      localStorage.setItem('dms_active_workspace_id', workspaceId);
      setActiveWorkspace(found.workspace);
      setActiveRole(found.role);
      setPermissions(found.permissions || { canExportReports: false });
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        activeRole,
        permissions,
        isLoading,
        setActiveWorkspaceId,
        refreshWorkspaces: fetchWorkspaces
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};
