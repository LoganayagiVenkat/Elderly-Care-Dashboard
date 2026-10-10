import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export default function ProtectedRoute() {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
