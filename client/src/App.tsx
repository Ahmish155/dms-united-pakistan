import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false
    }
  }
});

// Placeholder view for secondary routes while in foundation stage
const ModulePlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="rounded-xl border border-surface-border bg-white p-6 shadow-sm">
    <h2 className="text-base font-bold text-typography-main">{title}</h2>
    <p className="mt-1 text-xs text-typography-secondary">
      This module is scheduled for implementation in upcoming sprints according to the Master Blueprint.
    </p>
  </div>
);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route path="/" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="people/*" element={<ModulePlaceholder title="People & Responsibilities Directory" />} />
                <Route path="meetings/*" element={<ModulePlaceholder title="Individual Meetings Management" />} />
                <Route path="dmm/*" element={<ModulePlaceholder title="DMM Monthly Planning" />} />
                <Route path="rmm/*" element={<ModulePlaceholder title="RMM Weekly Planning" />} />
                <Route path="activities/*" element={<ModulePlaceholder title="Dialogue Forums & Group Meetings" />} />
                <Route path="analytics/*" element={<ModulePlaceholder title="Analytics & Insights" />} />
                <Route path="reports/*" element={<ModulePlaceholder title="Reporting & Multi-Format Exports" />} />
                <Route path="units/*" element={<ModulePlaceholder title="Units Management" />} />
                <Route path="settings/*" element={<ModulePlaceholder title="Workspace Settings & Spectators" />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
