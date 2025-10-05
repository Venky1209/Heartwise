import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Components
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import ECGMonitor from './pages/ECGMonitor';
import Sessions from './pages/Sessions';
import SessionDetail from './pages/SessionDetail';
import Devices from './pages/Devices';
import Analysis from './pages/Analysis';
import ECGReport from './pages/ECGReport';
import WeeklySummary from './pages/WeeklySummaryEnhanced';
import DietRecommendations from './pages/DietRecommendations';
import AIDietRecommendations from './pages/AIDietRecommendations';
import Profile from './pages/Profile';
import ProfileComplete from './pages/ProfileComplete';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Context
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Styles
import './index.css';

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public Routes - Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile/complete" element={<ProfileComplete />} />
                
                {/* Protected Routes - Main App */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="patients" element={<Patients />} />
                  <Route path="patients/:id" element={<PatientDetail />} />
                  <Route path="monitor" element={<ECGMonitor />} />
                  <Route path="monitor/:sessionId" element={<ECGMonitor />} />
                  <Route path="sessions" element={<Sessions />} />
                  <Route path="sessions/:id" element={<SessionDetail />} />
                  <Route path="devices" element={<Devices />} />
                  <Route path="analysis" element={<Analysis />} />
                  <Route path="analysis/:sessionId" element={<Analysis />} />
                  <Route path="report/:sessionId" element={<ECGReport />} />
                  <Route path="weekly-summary" element={<WeeklySummary />} />
                  <Route path="diet" element={<DietRecommendations />} />
                  <Route path="ai-diet" element={<AIDietRecommendations />} />
                </Route>
              </Routes>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    style: {
                      background: '#10b981',
                    },
                  },
                  error: {
                    style: {
                      background: '#ef4444',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;