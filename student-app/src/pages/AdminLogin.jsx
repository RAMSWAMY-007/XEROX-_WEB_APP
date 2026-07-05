import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api/client';

const AdminLogin = () => {
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const data = await adminLogin({ roll_number: rollNumber, password });
      localStorage.setItem('admin_token', data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="glass-panel p-8 max-w-md w-full border border-slate-700 bg-slate-800/50 rounded-xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin<span className="text-admin-500">Portal</span></h1>
          <p className="text-slate-400 mt-2">Sign in to manage the print queue</p>
        </div>
        
        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6 text-center border border-red-500/30">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Admin Username</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-admin-500 focus:ring-1 focus:ring-admin-500 transition-colors"
              placeholder="e.g. admin"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
            <input 
              type="password" 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-admin-500 focus:ring-1 focus:ring-admin-500 transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full bg-admin-600 hover:bg-admin-500 text-white font-medium py-3 rounded-lg transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
