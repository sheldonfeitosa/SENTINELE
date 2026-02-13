import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ReportingForm from './components/ReportingForm';
import Dashboard from './components/Dashboard';
import TratativaPage from './components/TratativaPage';
import ACRPage from './components/ACRPage';
import ManagerRegistration from './components/ManagerRegistration';
import AdminSettings from './components/AdminSettings';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-100">
                <Routes>
                    <Route path="/" element={<ReportingForm />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/tratativa/:id" element={<TratativaPage />} />
                    <Route path="/acr/:id" element={<ACRPage />} />
                    <Route path="/managers" element={<ManagerRegistration />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
