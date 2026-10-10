import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

/**
 * Guards a route by role, not just by hiding the sidebar link.
 * If a Caregiver, Family, or Patient account types a restricted URL
 * (e.g. /reports) directly into the address bar, they are redirected
 * back to their own dashboard instead of the page rendering.
 */
export default function RoleBasedRoute({ roles, children }) {
  const { user, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
