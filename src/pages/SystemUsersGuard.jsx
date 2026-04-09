import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser, hasAnyRole } from '../lib/auth';

export function SystemUsersGuard({ children }) {
  const user = getCurrentUser();

  if (!hasAnyRole(user, ['system_admin'])) {
    return <Navigate to="/" replace />;
  }

  return children;
}
