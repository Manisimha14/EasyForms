import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { ProtectedRoute, PublicOnlyRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

/* ── Auth pages ── */
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';

/* ── Protected feature pages ── */
import { DashboardPage } from './features/dashboard/DashboardPage';
import { FormsListPage } from './features/forms/FormsListPage';
import { AccountPage } from './features/account/AccountPage';
import { FormBuilderPage } from './features/builder/FormBuilderPage';
import { ResponsesPage } from './features/responses/ResponsesPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';

/* ── Public pages ── */
import { PublicFormPage } from './features/public-form/PublicFormPage';

/* ── 404 ── */
import { FileQuestion } from 'lucide-react';

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <FileQuestion className="w-16 h-16 text-slate-300 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
      <p className="text-slate-500 mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <a
        href="/dashboard"
        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        Go to Dashboard
      </a>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* ── Public auth routes (redirect to dashboard if already logged in) ── */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      {/* ── Public form submission ── */}
      <Route path="/f/:slug" element={<PublicFormPage />} />
      <Route path="/f/:shareId" element={<PublicFormPage />} />

      {/* ── Protected routes with sidebar layout ── */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/forms" element={<FormsListPage />} />
        <Route path="/forms/:id/edit" element={<FormBuilderPage />} />
        <Route path="/forms/:formId/edit" element={<FormBuilderPage />} />
        <Route path="/forms/:id/responses" element={<ResponsesPage />} />
        <Route path="/forms/:formId/responses" element={<ResponsesPage />} />
        <Route path="/forms/:id/analytics" element={<AnalyticsPage />} />
        <Route path="/forms/:formId/analytics" element={<AnalyticsPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Route>

      {/* ── Root redirect ── */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* ── 404 catch-all ── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
