import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentLogin, studentRegister } from '../api/client';

const StudentLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const data = await studentLogin({ roll_number: rollNumber, password });
        localStorage.setItem('token', data.token);
      } else {
        const data = await studentRegister({ 
          roll_number: rollNumber, 
          name, 
          phone_number: phoneNumber, 
          password 
        });
        localStorage.setItem('token', data.token);
      }
      navigate('/upload');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in py-12">
      <div className="glass p-8 md:p-12 max-w-md w-full border border-white/20 shadow-xl rounded-3xl bg-white/70 backdrop-blur-md">
        
        {/* Toggle Tabs */}
        <div className="flex bg-primary-100 rounded-lg p-1 mb-8">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${isLogin ? 'bg-white text-primary-600 shadow' : 'text-primary-600/70 hover:text-primary-600'}`}
          >
            Sign In
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${!isLogin ? 'bg-white text-primary-600 shadow' : 'text-primary-600/70 hover:text-primary-600'}`}
          >
            Register
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {isLogin ? 'Sign in to place a new print order' : 'Sign up to get started with Campus Print'}
          </p>
        </div>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-6 text-center border border-red-100">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">Full Name</label>
              <input 
                type="text" 
                className="input-field"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Roll Number</label>
            <input 
              type="text" 
              className="input-field"
              placeholder="e.g. 12345"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">Phone Number</label>
              <input 
                type="tel" 
                className="input-field"
                placeholder="e.g. 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Password</label>
            <input 
              type="password" 
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className={`btn-primary w-full text-lg mt-6 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (isLogin ? 'Signing In...' : 'Registering...') : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;
