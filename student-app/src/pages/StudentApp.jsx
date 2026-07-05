import React, { useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createOrder } from '../api/client';
import StudentLogin from './StudentLogin';

const Home = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
    <div className="glass p-12 max-w-lg w-full text-center">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400 mb-4">
        Campus Print
      </h1>
      <p className="text-gray-600 mb-8">Fast, reliable document printing right on campus.</p>
      <Link to="/upload" className="btn-primary inline-block w-full text-lg py-3">
        Start New Order
      </Link>
    </div>
  </div>
);

// Protect student upload route
const ProtectedStudentRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const Upload = () => {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();
  
  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      alert('Order Placed Successfully! ID: ' + data.order.id);
      setFile(null);
      navigate('/orders');
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        alert('Your session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert('Failed to place order: ' + (error.response?.data?.message || error.message));
      }
    }
  });

  const handleUpload = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('color_mode', 'bw');
    formData.append('paper_size', 'A4');
    formData.append('copies', 1);
    
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 animate-slide-up">
      <div className="glass p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Document</h2>
        <div className="border-2 border-dashed border-primary-200 rounded-2xl p-12 text-center bg-primary-50/30 hover:bg-primary-50 transition-colors relative">
          <input 
            type="file" 
            accept=".pdf" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => setFile(e.target.files[0])}
          />
          {file ? (
            <p className="text-primary-600 font-bold text-lg">{file.name}</p>
          ) : (
            <>
              <p className="text-primary-600 font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500 mt-2">PDF files only (max 20MB)</p>
            </>
          )}
        </div>
        <div className="mt-8 flex justify-end items-center gap-4">
          {mutation.isPending && <span className="text-primary-500 animate-pulse">Uploading...</span>}
          <button 
            onClick={handleUpload} 
            disabled={!file || mutation.isPending} 
            className={`btn-primary px-8 ${(!file || mutation.isPending) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {mutation.isPending ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentApp = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div 
      className="min-h-screen font-sans text-gray-900"
      style={{ background: 'radial-gradient(circle at top right, #e0f2fe, #f8fafc 50%)' }}
    >
      <nav className="glass rounded-none px-6 py-4 sticky top-0 z-50 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-primary-600">PrintHub</Link>
        <div className="space-x-4 flex items-center">
          <Link to="/orders" className="text-gray-600 hover:text-primary-600 transition-colors font-medium">My Orders</Link>
          {token ? (
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium ml-4">Logout</button>
          ) : (
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium ml-4">Login</Link>
          )}
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<StudentLogin />} />
          <Route path="/upload" element={
            <ProtectedStudentRoute>
              <Upload />
            </ProtectedStudentRoute>
          } />
          <Route path="/orders" element={
            <ProtectedStudentRoute>
              <div className="text-center mt-20 text-gray-500">Order history coming soon...</div>
            </ProtectedStudentRoute>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default StudentApp;
