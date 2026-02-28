import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
 
export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
 
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
      <div className='bg-white p-8 rounded-lg shadow-md w-full max-w-md'>
        <h2 className='text-2xl font-bold text-center text-gray-800 mb-6'>Create Account</h2>
        {error && <div className='bg-red-50 text-red-600 p-3 rounded mb-4 text-sm'>{error}</div>}
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>First Name</label>
              <input name='firstName' value={form.firstName} onChange={handleChange} required
                className='w-full border border-gray-300 rounded px-3 py-2' />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Last Name</label>
              <input name='lastName' value={form.lastName} onChange={handleChange} required
                className='w-full border border-gray-300 rounded px-3 py-2' />
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
            <input type='email' name='email' value={form.email} onChange={handleChange} required
              className='w-full border border-gray-300 rounded px-3 py-2' />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Password (min. 8 chars)</label>
            <input type='password' name='password' value={form.password} onChange={handleChange}
              required minLength={8} className='w-full border border-gray-300 rounded px-3 py-2' />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Role</label>
            <select name='role' value={form.role} onChange={handleChange}
              className='w-full border border-gray-300 rounded px-3 py-2'>
              <option>Student</option>
              <option>Lecturer</option>
            </select>
          </div>
          <button type='submit' disabled={loading}
            className='w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50'>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className='text-center text-sm text-gray-600 mt-4'>
          Already have an account? <Link to='/login' className='text-blue-600 hover:underline'>Login</Link>
        </p>
      </div>
    </div>
  );
}
