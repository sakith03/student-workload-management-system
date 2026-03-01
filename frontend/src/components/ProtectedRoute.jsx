import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

 
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth();
 
  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }
 
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to='/dashboard' replace />;
  }
 
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Wait for auth to finish initializing before making routing decisions
  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to='/dashboard' replace />;
  }

  return children;
}
