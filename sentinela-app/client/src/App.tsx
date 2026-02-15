
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { NotificationForm } from './pages/NotificationForm';
import { RiskDashboard } from './pages/RiskDashboard';
import { TratativaPage } from './pages/TratativaPage';
import { RiskManagerPage } from './pages/RiskManagerPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { GanttPage } from './pages/GanttPage';
import { PricingPage } from './pages/PricingPage';
import SuccessPage from './pages/SuccessPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import { AdminDashboard } from './pages/AdminDashboard';



import { ErrorBoundary } from './components/ErrorBoundary';

const ProtectedRoute = ({ children, requireSaaS = false }: { children: React.ReactNode, requireSaaS?: boolean }) => {
  const token = localStorage.getItem('token');
  // Robust user parsing
  let user: any = {};
  try {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    console.error('Error parsing user from localStorage', e);
  }

  // Golden Rule: Always treat sheldonfeitosa@gmail.com as SUPER_ADMIN in the frontend
  if (user?.email?.toLowerCase() === 'sheldonfeitosa@gmail.com') {
    console.log('[DEBUG] Golden Rule Triggered: Forcing SUPER_ADMIN for sheldonfeitosa@gmail.com');
    user.role = 'SUPER_ADMIN';
  }

  if (!token) {
    console.log('[DEBUG] No token found, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role;
  console.log('[DEBUG] current User Role:', userRole);
  console.log('[DEBUG] requireSaaS flag:', requireSaaS);

  // Isolation: Super Admin belongs ONLY in /admin
  if (userRole === 'SUPER_ADMIN' && !requireSaaS) {
    console.log('[DEBUG] Super Admin in non-SaaS route, redirecting to /admin');
    return <Navigate to="/admin" replace />;
  }

  // Reverse Isolation: Regular users shouldn't access /admin
  if (requireSaaS && userRole !== 'SUPER_ADMIN') {
    return <Navigate to="/gestao-risco" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/n/:tenantSlug" element={<NotificationForm />} />

          <Route path="/" element={<Layout />}>
            <Route index element={
              localStorage.getItem('token') ?
                <Navigate to="/gestao-risco" replace /> :
                <HomePage />
            } />
            {/* Protected Routes */}
            <Route path="gestao-risco" element={
              <ProtectedRoute>
                <RiskDashboard />
              </ProtectedRoute>
            } />
            <Route path="notificacao" element={
              <ProtectedRoute>
                <NotificationForm />
              </ProtectedRoute>
            } />
            <Route path="dashboard" element={<Navigate to="/gestao-risco" replace />} />
            <Route path="gestores" element={
              <ProtectedRoute>
                <RiskManagerPage />
              </ProtectedRoute>
            } />
            <Route path="estatisticas" element={
              <ProtectedRoute>
                <StatisticsPage />
              </ProtectedRoute>
            } />
            <Route path="tratativa/:id" element={
              <ProtectedRoute>
                <TratativaPage />
              </ProtectedRoute>
            } />
            <Route path="gantt" element={
              <ProtectedRoute>
                <GanttPage />
              </ProtectedRoute>
            } />

            <Route path="planos" element={
              <ProtectedRoute>
                <PricingPage />
              </ProtectedRoute>
            } />
            <Route path="success" element={
              <ProtectedRoute>
                <SuccessPage />
              </ProtectedRoute>
            } />

            <Route path="admin" element={
              <ProtectedRoute requireSaaS={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Dev Fallback (Protected?) */}
            <Route path="tratativa" element={
              <ProtectedRoute>
                <TratativaPage />
              </ProtectedRoute>
            } />

          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
