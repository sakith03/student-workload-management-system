import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

import Onboarding from './pages/Onboarding';
import Modules from './pages/Modules';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import WorkspaceList from './pages/workspace/WorkspaceList';
import WorkspaceDetail from './pages/workspace/WorkspaceDetail';
import InvitePage from './pages/InvitePage';



export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/invite/:token' element={<InvitePage />} />

          <Route path='/onboarding' element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          <Route path='/dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path='/modules' element={<ProtectedRoute><Modules /></ProtectedRoute>} />
          <Route path='/goals' element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path='/workspaces' element={<ProtectedRoute><WorkspaceList /></ProtectedRoute>} />
          <Route path='/workspace/:groupId' element={<ProtectedRoute><WorkspaceDetail /></ProtectedRoute>} />
          <Route path='/settings' element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path='/' element={<Navigate to='/dashboard' />} />
          <Route path='*' element={<Navigate to='/dashboard' />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
