// @ts-nocheck
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
import ResetPassword from './pages/ResetPassword';
import HomePage from './pages/HomePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuditLogs } from './pages/AuditLogs';
import { ErrorBoundary } from './components/ErrorBoundary';

interface User {
    id?: number | string;
    email?: string;
    name?: string;
    role?: string;
    tenant?: {
        id: string;
        name: string;
    };
}

const ProtectedRoute = ({ children, requireSaaS = false }: { children: React.ReactNode, requireSaaS?: boolean }) => {
    let user: User = {};
    try {
        const userStr = localStorage.getItem('user');
        if (userStr && userStr !== 'undefined') {
            user = JSON.parse(userStr);
        }
    } catch (e) {
        console.error('Error parsing user from localStorage', e);
    }

    // Golden Rule: Always treat sheldonfeitosa@gmail.com as SUPER_ADMIN
    if (user?.email?.toLowerCase() === 'sheldonfeitosa@gmail.com') {
        user.role = 'SUPER_ADMIN';
    }

    if (!localStorage.getItem('user')) {
        return <Navigate to="/login" replace />;
    }

    const userRole = user?.role;

    // Isolation: Super Admin belongs ONLY in /admin
    if (userRole === 'SUPER_ADMIN' && !requireSaaS) {
        return <Navigate to="/admin" replace />;
    }

    // Suspension Rule: Block users from suspended tenants
    if (userRole !== 'SUPER_ADMIN' && user?.subscriptionStatus === 'suspended') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to="/login?error=account_suspended" replace />;
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
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/n/:tenantSlug" element={<NotificationForm />} />

                    <Route path="/" element={<Layout />}>
                        <Route index element={
                            localStorage.getItem('user') ?
                                <Navigate to="/gestao-risco" replace /> :
                                <HomePage />
                        } />
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
                        <Route path="auditoria" element={
                            <ProtectedRoute>
                                <AuditLogs />
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
