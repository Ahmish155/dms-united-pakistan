import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UnitsPage } from './pages/UnitsPage';
import { PeoplePage } from './pages/PeoplePage';
import { PersonProfilePage } from './pages/PersonProfilePage';
import { MeetingsPage } from './pages/MeetingsPage';
import { RecordMeetingPage } from './pages/RecordMeetingPage';
import { DmmPage } from './pages/DmmPage';
import { RmmPage } from './pages/RmmPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { ReportsPage } from './pages/ReportsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { JoinWorkspacePage } from './pages/JoinWorkspacePage';
import { AiAssistantPage } from './pages/AiAssistantPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false
    }
  }
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/join/:workspaceId" element={<JoinWorkspacePage />} />

              <Route path="/" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="units" element={<UnitsPage />} />
                <Route path="people" element={<PeoplePage />} />
                <Route path="people/:id" element={<PersonProfilePage />} />

                {/* Meetings */}
                <Route path="meetings" element={<MeetingsPage />} />
                <Route path="meetings/new" element={<RecordMeetingPage />} />

                {/* Planning */}
                <Route path="dmm" element={<DmmPage />} />
                <Route path="rmm" element={<RmmPage />} />

                {/* Activities (DF & GM) */}
                <Route path="activities" element={<ActivitiesPage />} />

                {/* Reports & Analytics */}
                <Route path="reports" element={<ReportsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />

                {/* AI Assistant */}
                <Route path="ai" element={<AiAssistantPage />} />

                {/* Settings & Spectators */}
                <Route path="settings" element={<SettingsPage />} />

                {/* Super Admin Console */}
                <Route path="admin" element={<SuperAdminPage />} />
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
