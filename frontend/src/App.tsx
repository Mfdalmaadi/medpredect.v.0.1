import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store, useAppDispatch } from './store';
import { forceLogout } from './store/slices/authSlice';

// UI Layout & Route Guard
import Layout from './components/Layout';
import RouteGuard from './components/RouteGuard';

// Application Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import PredictDiabetes from './pages/PredictDiabetes';
import PredictPcos from './pages/PredictPcos';
import PredictionHistory from './pages/PredictionHistory';
import PredictionDetail from './pages/PredictionDetail';
import AdminDashboard from './pages/AdminDashboard';
import Notifications from './pages/Notifications';
import Unauthorized from './pages/Unauthorized';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleAuthExpired = () => {
      dispatch(forceLogout());
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected layout endpoints */}
        <Route path="/" element={<Layout />}>
          {/* Index redirect to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* General access dashboard */}
          <Route 
            path="dashboard" 
            element={
              <RouteGuard>
                <Dashboard />
              </RouteGuard>
            } 
          />

          {/* Clinician patient management */}
          <Route 
            path="patients" 
            element={
              <RouteGuard allowedRoles={['admin', 'doctor']}>
                <Patients />
              </RouteGuard>
            } 
          />
          <Route 
            path="patients/:id" 
            element={
              <RouteGuard allowedRoles={['admin', 'doctor']}>
                <PatientDetail />
              </RouteGuard>
            } 
          />

          {/* Clinical Diagnostic assessment runs */}
          <Route 
            path="predict/diabetes" 
            element={
              <RouteGuard allowedRoles={['admin', 'doctor']}>
                <PredictDiabetes />
              </RouteGuard>
            } 
          />
          <Route 
            path="predict/pcos" 
            element={
              <RouteGuard allowedRoles={['admin', 'doctor']}>
                <PredictPcos />
              </RouteGuard>
            } 
          />

          {/* Prediction audit reports */}
          <Route 
            path="history" 
            element={
              <RouteGuard>
                <PredictionHistory />
              </RouteGuard>
            } 
          />
          <Route 
            path="predictions/:id" 
            element={
              <RouteGuard>
                <PredictionDetail />
              </RouteGuard>
            } 
          />

          <Route 
            path="notifications" 
            element={
              <RouteGuard>
                <Notifications />
              </RouteGuard>
            } 
          />

          {/* Admin specific control dashboard */}
          <Route 
            path="admin" 
            element={
              <RouteGuard allowedRoles={['admin']}>
                <AdminDashboard />
              </RouteGuard>
            } 
          />

          {/* Wildcard fallback redirection */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
