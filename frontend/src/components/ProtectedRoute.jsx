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
 
  return children;
}
