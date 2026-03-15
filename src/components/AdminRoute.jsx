import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdminRole } from '../utils/auth';

function AdminRoute({ children }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminRole(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
