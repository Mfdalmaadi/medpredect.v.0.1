import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'doctor' | 'patient'>;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Authenticated but does not have required permissions
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;
