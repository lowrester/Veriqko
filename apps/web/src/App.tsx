import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { AppShell } from '@/components/layout/AppShell'
import { RequireRole } from '@/components/guards/RequireRole'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { JobsPage } from '@/features/jobs/JobsPage'
import { JobDetailPage } from '@/features/jobs/JobDetailPage'
import { NewJobPage } from '@/features/jobs/NewJobPage'
import { RunnerPage } from '@/features/runner/RunnerPage'
import { QcPage } from '@/features/qc/QcPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { IntakeNewPage } from '@/features/intake/IntakeNewPage'
import { SearchPage } from '@/features/search/SearchPage'
import { LiveFloorPage } from '@/features/floor/LiveFloorPage'
import { UsersPage } from '@/features/users/UsersPage'
import { NewUserPage } from '@/features/users/NewUserPage'
import { UserDetailPage } from '@/features/users/UserDetailPage'
import { SystemPage } from '@/features/admin/SystemPage'
import { StationsPage } from '@/features/admin/StationsPage'
import { TemplatesPage } from '@/features/admin/TemplatesPage'
import { DeviceTypesPage } from '@/features/admin/DeviceTypesPage'
import { SettingsLayout } from '@/features/settings/SettingsLayout'
import { PrintersPage } from '@/features/settings/PrintersPage'
import { LabelLayoutsPage } from '@/features/settings/LabelLayoutsPage'
import { IntegrationsPage } from '@/features/settings/IntegrationsPage'
import { FeaturesPage } from '@/features/settings/FeaturesPage'
import { CustomerDashboard } from '@/features/portal/CustomerDashboard'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

import { ThemeProvider } from '@/features/theme/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/*"
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Jobs */}
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/new" element={<NewJobPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />

          {/* Workflow */}
          <Route
            path="intake/new"
            element={
              <RequireRole anyOf={['admin', 'supervisor', 'technician']}>
                <IntakeNewPage />
              </RequireRole>
            }
          />
          <Route
            path="job/:id/run"
            element={
              <RequireRole anyOf={['admin', 'supervisor', 'technician']}>
                <RunnerPage />
              </RequireRole>
            }
          />
          <Route
            path="job/:id/qc"
            element={
              <RequireRole anyOf={['admin', 'supervisor']}>
                <QcPage />
              </RequireRole>
            }
          />
          <Route
            path="job/:id/reports"
            element={
              <RequireRole anyOf={['admin', 'supervisor', 'technician', 'viewer']}>
                <ReportsPage />
              </RequireRole>
            }
          />

          {/* Search & Ops */}
          <Route path="search" element={<SearchPage />} />
          <Route
            path="ops"
            element={
              <RequireRole anyOf={['admin', 'supervisor']}>
                <LiveFloorPage />
              </RequireRole>
            }
          />

          {/* Admin */}
          {/* Admin - Redirect old routes to new settings location if accessed directly? Or just keep them? 
              For now we remove the old /admin prefix routes that are being moved. 
              Users/Devices were already aliased, we just move Stations/Templates. 
          */}
          <Route path="admin" element={<Navigate to="/settings" replace />} />

          {/* User management - kept top level for easy access or move? 
              Ref says "Merge Admin with Settings", so let's move them fully under settings visually but keep route if needed. 
              Actually, let's keep top level Users as is for "User Management" but also have it in settings for config.
          */}
          <Route path="users" element={<UsersPage />} />
          <Route path="users/new" element={<NewUserPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />

          {/* Settings */}
          <Route
            path="settings"
            element={
              <RequireRole anyOf={['admin', 'supervisor']}>
                <SettingsLayout />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="features" />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="printers" element={<PrintersPage />} />
            <Route path="labels" element={<LabelLayoutsPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="system" element={<SystemPage />} />

            {/* Alias existing admin pages into settings for better UX */}
            {/* Configuration Pages */}
            <Route path="users" element={<UsersPage />} />
            <Route path="devices" element={<DeviceTypesPage />} />
            <Route path="stations" element={<StationsPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            {/* Client Portal */}
            <Route
              path="portal"
              element={
                <RequireRole anyOf={['customer']}>
                  <CustomerDashboard />
                </RequireRole>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App
