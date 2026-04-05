
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { MagicLoginPage } from './pages/MagicLoginPage';

import { ErrorBoundary } from './components/ErrorBoundary';

// -------------------------------------------------------
// ProtectedRoute: exige login para acessar gestão de risco
// -------------------------------------------------------
const ProtectedRoute = ({ children, requireSaaS = false }: { children: React.ReactNode, requireSaaS?: boolean }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Isolamento: Super Admin só acessa /admin, exceto se for para ver uma tratativa/plano de ação
  if (user.role === 'SUPER_ADMIN' && !requireSaaS && !location.pathname.includes('/tratativa')) {
    return <Navigate to="/admin" replace />;
  }

  // Isolamento reverso: usuários normais não acessam /admin
  if (requireSaaS && user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/gestao-risco" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/*
           * ═══════════════════════════════════════════════════════
           * ROTAS PÚBLICAS — sem login, sem Layout de gestão
           * ═══════════════════════════════════════════════════════
           * /n/:tenantSlug  → Formulário de notificação anônima
           *   Colocado em tablets/computadores nos setores do hospital.
           *   Qualquer funcionário pode notificar SEM criar conta.
           */}
          <Route path="/n/:tenantSlug" element={<NotificationForm />} />


          {/*
           * ═══════════════════════════════════════════════════════
           * ROTAS DE AUTENTICAÇÃO
           * ═══════════════════════════════════════════════════════
           */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          {/* Acesso via link mágico do email — sem login manual */}
          <Route path="/acesso" element={<MagicLoginPage />} />

          {/*
           * ═══════════════════════════════════════════════════════
           * ROTAS PROTEGIDAS — exige login de gestor/admin
           * ═══════════════════════════════════════════════════════
           */}
          <Route path="/" element={<Layout />}>
            <Route index element={
              localStorage.getItem('token') ?
                <Navigate to="/gestao-risco" replace /> :
                <HomePage />
            } />

            {/* Dashboard principal de gestão de risco */}
            <Route path="gestao-risco" element={
              <ProtectedRoute>
                <RiskDashboard />
              </ProtectedRoute>
            } />

            {/* /notificacao — dentro do Layout (com header/padding), sem exigir login */}
            <Route path="notificacao" element={<NotificationForm />} />

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

            <Route path="tratativa" element={
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

            {/* Admin SaaS — apenas SUPER_ADMIN */}
            <Route path="admin" element={
              <ProtectedRoute requireSaaS={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
