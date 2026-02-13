
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



import { ErrorBoundary } from './components/ErrorBoundary';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="notificacao" element={<NotificationForm />} />

            {/* Protected Routes */}
            <Route path="gestao-risco" element={
              <ProtectedRoute>
                <RiskDashboard />
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
