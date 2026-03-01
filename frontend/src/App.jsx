import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
<<<<<<< HEAD
import MyCoursesPage from './pages/MyCoursesPage';
=======
import Setup from './pages/Setup';
import Subjects from './pages/Subjects';
import WorkspaceList from './pages/workspace/WorkspaceList';
import WorkspaceDetail from './pages/workspace/WorkspaceDetail';
>>>>>>> origin/develop

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
<<<<<<< HEAD
          <Route path='/dashboard' element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path='/my-courses' element={
            <ProtectedRoute><MyCoursesPage /></ProtectedRoute>
          } />
          <Route path='/' element={<Navigate to='/login' />} />
=======
          <Route path='/dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path='/setup' element={<ProtectedRoute><Setup /></ProtectedRoute>} />
          <Route path='/subjects' element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
          <Route path='/workspaces' element={<ProtectedRoute><WorkspaceList /></ProtectedRoute>} />
          <Route path='/workspace/:groupId' element={<ProtectedRoute><WorkspaceDetail /></ProtectedRoute>} />
          <Route path='/' element={<Navigate to='/dashboard' />} />
>>>>>>> origin/develop
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
