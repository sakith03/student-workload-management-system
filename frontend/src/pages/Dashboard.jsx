// src/pages/Dashboard.jsx
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-700">Student Workload System</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.email}
          </span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            {user?.role}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto mt-10 px-6">
        
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            Welcome back! 👋
          </h2>
          <p className="text-gray-500 text-sm">
            You are logged in as <span className="font-semibold text-blue-600">{user?.role}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 mb-1">Role</p>
            <p className="text-2xl font-bold text-gray-800">{user?.role}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p className="text-2xl font-bold text-green-600">Active</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500 mb-1">Sprint</p>
            <p className="text-2xl font-bold text-gray-800">1 — Auth</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Account Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-gray-500">User ID</span>
              <span className="text-sm font-mono text-gray-700">{user?.id}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm text-gray-700">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Role</span>
              <span className="text-sm text-gray-700">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Sprint 1 Complete Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-700 font-medium text-sm">
            Welcome, {user?.email}! Be ready to get started!
          </p>
        </div>

      </main>
    </div>
  );
}