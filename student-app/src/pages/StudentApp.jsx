import React, { useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createOrder, getMyOrders } from '../api/client';
import StudentLogin from './StudentLogin';
import { FileText, Printer, CreditCard, ChevronRight, CheckCircle, Clock } from 'lucide-react';

const Home = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
    <div className="glass p-12 max-w-xl w-full text-center rounded-3xl border border-white/40 shadow-xl relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-400 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-20"></div>
      
      <Printer className="w-16 h-16 text-primary-500 mx-auto mb-6" />
      <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-400 mb-6 tracking-tight">
        Campus Print
      </h1>
      <p className="text-gray-600 mb-10 text-lg">Fast, reliable document printing right on campus. Skip the line, order online.</p>
      <Link to="/upload" className="btn-primary inline-flex items-center justify-center w-full sm:w-auto px-10 text-lg py-4 group">
        Start New Order
        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
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
  
  // Specs State
  const [colorMode, setColorMode] = useState('bw');
  const [paperSize, setPaperSize] = useState('A4');
  const [copies, setCopies] = useState(1);
  const [binding, setBinding] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('offline');
  
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
    formData.append('color_mode', colorMode);
    formData.append('paper_size', paperSize);
    formData.append('copies', copies);
    formData.append('binding', binding.toString());
    formData.append('payment_method', paymentMethod);
    
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 mb-12 animate-slide-up">
      <div className="glass p-8 md:p-10 rounded-3xl border border-white/50 shadow-xl bg-white/60 backdrop-blur-xl">
        <h2 className="text-3xl font-bold mb-8 text-gray-800 flex items-center">
          <FileText className="w-8 h-8 mr-3 text-primary-500" />
          Upload & Configure
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: File Drop */}
          <div className="space-y-6">
            <div className={`border-2 border-dashed ${file ? 'border-primary-400 bg-primary-50' : 'border-gray-300 bg-gray-50/50 hover:bg-gray-50'} rounded-2xl p-12 text-center transition-all relative h-64 flex flex-col justify-center`}>
              <input 
                type="file" 
                accept=".pdf" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => setFile(e.target.files[0])}
              />
              {file ? (
                <div className="animate-fade-in">
                  <CheckCircle className="w-12 h-12 text-primary-500 mx-auto mb-3" />
                  <p className="text-primary-700 font-bold text-lg px-4 truncate">{file.name}</p>
                  <p className="text-sm text-primary-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-semibold text-gray-700">Click to upload or drag PDF here</p>
                  <p className="text-sm mt-2">Max file size: 20MB</p>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white/80 p-5 rounded-2xl border border-gray-100 shadow-sm">
              <label className="block text-gray-700 font-bold mb-3">Payment Method</label>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPaymentMethod('offline')}
                  className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${paymentMethod === 'offline' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  Pay Offline (Cash)
                </button>
                <button 
                  onClick={() => setPaymentMethod('online')}
                  className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${paymentMethod === 'online' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  Pay Online (UPI)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Specifications */}
          <div className="space-y-6">
            <div className="bg-white/80 p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              
              {/* Color Mode */}
              <div>
                <label className="block text-gray-700 font-bold mb-3">Print Type</label>
                <div className="flex gap-3">
                  <button onClick={() => setColorMode('bw')} className={`flex-1 py-2 rounded-lg border-2 font-semibold ${colorMode === 'bw' ? 'border-slate-800 bg-slate-800 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    Black & White
                  </button>
                  <button onClick={() => setColorMode('color')} className={`flex-1 py-2 rounded-lg border-2 font-semibold ${colorMode === 'color' ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    Full Color
                  </button>
                </div>
              </div>

              {/* Paper Size */}
              <div>
                <label className="block text-gray-700 font-bold mb-3">Paper Size</label>
                <div className="flex gap-3">
                  {['A4', 'A3', 'A5'].map(size => (
                    <button key={size} onClick={() => setPaperSize(size)} className={`flex-1 py-2 rounded-lg border-2 font-semibold ${paperSize === size ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Copies & Binding */}
              <div className="flex gap-6">
                <div className="flex-1">
                  <label className="block text-gray-700 font-bold mb-3">Copies</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden h-11">
                    <button onClick={() => setCopies(Math.max(1, copies - 1))} className="px-4 text-gray-600 hover:bg-gray-100 h-full font-bold">-</button>
                    <input type="number" value={copies} readOnly className="w-full text-center font-bold text-gray-700 outline-none" />
                    <button onClick={() => setCopies(copies + 1)} className="px-4 text-gray-600 hover:bg-gray-100 h-full font-bold">+</button>
                  </div>
                </div>
                
                <div className="flex-1 flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer p-2 w-full border-2 border-transparent hover:border-gray-100 rounded-lg transition-colors h-11">
                    <div className={`w-6 h-6 rounded flex items-center justify-center border-2 ${binding ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                      {binding && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-bold text-gray-700">Spiral Bind</span>
                    <input type="checkbox" className="hidden" checked={binding} onChange={(e) => setBinding(e.target.checked)} />
                  </label>
                </div>
              </div>

            </div>
            
            {/* Submit Action */}
            <div className="pt-4">
              <button 
                onClick={handleUpload} 
                disabled={!file || mutation.isPending} 
                className={`btn-primary w-full py-4 text-xl flex items-center justify-center gap-3 shadow-lg ${(!file || mutation.isPending) ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}`}
              >
                {mutation.isPending ? 'Processing...' : (
                  <>
                    <CreditCard className="w-6 h-6" />
                    Confirm & Place Order
                  </>
                )}
              </button>
              <p className="text-center text-sm text-gray-500 mt-4">Price will be automatically calculated by Admin.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderTracking = () => {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: getMyOrders,
    refetchInterval: 10000 // Poll every 10s for live updates
  });

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-500 animate-pulse font-medium">Fetching your orders...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-6 mb-12 animate-slide-up">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 flex items-center px-4">
        <Clock className="w-8 h-8 mr-3 text-primary-500" />
        Order Tracking
      </h2>
      
      {orders.length === 0 ? (
        <div className="glass p-12 text-center rounded-3xl">
          <Printer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600">No Orders Yet</h3>
          <p className="text-gray-400 mt-2">When you place an order, you can track its live status here.</p>
          <Link to="/upload" className="btn-primary inline-block mt-6 px-8 py-2">Place an Order</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="glass bg-white/70 p-6 rounded-2xl border border-white/50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-white/90">
              <div>
                <h3 className="font-bold text-gray-800 text-lg truncate max-w-sm" title={order.file_name}>{order.file_name}</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  {order.page_count} pages • {order.color_mode.toUpperCase()} • {order.paper_size} • {order.copies} {order.copies > 1 ? 'copies' : 'copy'}
                  {order.binding && ' • Spiral Bound'} • {order.payment_method === 'online' ? 'Online Pay' : 'Cash'}
                </p>
                <p className="text-xs text-gray-400 mt-2">Ordered: {new Date(order.created_at).toLocaleString()}</p>
              </div>
              
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4">
                <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                  order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                  order.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'printing' ? 'bg-purple-100 text-purple-700' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.status.toUpperCase()}
                </span>
                
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold">Total Amount</p>
                  <p className="text-2xl font-black text-gray-800">₹{order.amount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
      className="min-h-screen font-sans text-gray-900 bg-background"
      style={{ background: 'radial-gradient(circle at top right, #e0f2fe, #f8fafc 40%, #f1f5f9 100%)' }}
    >
      <nav className="glass rounded-none px-4 md:px-8 py-4 sticky top-0 z-50 flex justify-between items-center border-b border-white/40">
        <Link to="/" className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-500">
          PrintHub
        </Link>
        <div className="space-x-1 md:space-x-4 flex items-center">
          <Link to="/orders" className="text-sm md:text-base px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-semibold">My Orders</Link>
          {token ? (
            <button onClick={handleLogout} className="text-sm md:text-base px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg font-semibold ml-2 transition-colors">Logout</button>
          ) : (
            <Link to="/login" className="btn-primary text-sm px-5 py-2 ml-2 shadow-md">Login</Link>
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
              <OrderTracking />
            </ProtectedStudentRoute>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default StudentApp;
