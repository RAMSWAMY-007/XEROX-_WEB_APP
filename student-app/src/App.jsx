import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Placeholder components
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

import { useMutation } from '@tanstack/react-query';
import { createOrder } from './api/client';
import { useState } from 'react';

const Upload = () => {
  const [file, setFile] = useState(null);
  
  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      alert('Order Placed Successfully! ID: ' + data.order.id);
      setFile(null);
    },
    onError: (error) => {
      alert('Failed to place order: ' + (error.response?.data?.message || error.message));
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen">
          <nav className="glass rounded-none px-6 py-4 sticky top-0 z-50 flex justify-between items-center">
            <Link to="/" className="text-xl font-bold text-primary-600">PrintHub</Link>
            <div className="space-x-4">
              <Link to="/orders" className="text-gray-600 hover:text-primary-600 transition-colors font-medium">My Orders</Link>
              <div className="inline-block w-10 h-10 rounded-full bg-gradient-to-tr from-primary-400 to-primary-600 text-white flex items-center justify-center font-bold shadow-md cursor-pointer">
                S
              </div>
            </div>
          </nav>
          
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/orders" element={<div className="text-center mt-20 text-gray-500">Order history coming soon...</div>} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
