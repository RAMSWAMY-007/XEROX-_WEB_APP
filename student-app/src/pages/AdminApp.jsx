import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueue, updateOrderStatus, batchPrintOrders } from '../api/client';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [selectedOrders, setSelectedOrders] = useState([]);
  
  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['adminQueue'],
    queryFn: getQueue
  });

  const updateMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminQueue'] })
  });

  const batchMutation = useMutation({
    mutationFn: batchPrintOrders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminQueue'] });
      setSelectedOrders([]);
    }
  });

  useEffect(() => {
    let rawApiUrl = import.meta.env.VITE_API_URL || 'https://xerox-backend-plld.onrender.com';
    if (rawApiUrl && rawApiUrl.endsWith('/api')) {
      rawApiUrl = rawApiUrl.replace(/\/api$/, '');
    }
    const socket = io(rawApiUrl);
    socket.emit('join-admin');
    
    socket.on('new-order', () => {
      queryClient.invalidateQueries({ queryKey: ['adminQueue'] });
    });
    socket.on('queue-updated', () => {
      queryClient.invalidateQueries({ queryKey: ['adminQueue'] });
    });
    socket.on('queue-batch-updated', () => {
      queryClient.invalidateQueries({ queryKey: ['adminQueue'] });
    });

    return () => socket.disconnect();
  }, [queryClient]);

  const handleBatchPrint = () => {
    if (selectedOrders.length > 0) {
      batchMutation.mutate(selectedOrders);
    }
  };

  const toggleSelect = (id) => {
    setSelectedOrders(prev => prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]);
  };

  if (isLoading) return <div className="text-white animate-pulse">Loading queue...</div>;

  const pendingCount = queue.filter(o => o.status === 'pending').length;
  const printingCount = queue.filter(o => o.status === 'printing').length;
  const revenue = queue.reduce((sum, order) => sum + parseFloat(order.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in text-white font-sans bg-slate-900 min-h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 bg-slate-800/80 border border-slate-700 rounded-xl">
          <h3 className="text-slate-400 text-sm font-medium">Pending Orders</h3>
          <p className="text-3xl font-bold text-white mt-2">{pendingCount}</p>
        </div>
        <div className="glass-panel p-6 bg-slate-800/80 border border-slate-700 rounded-xl">
          <h3 className="text-slate-400 text-sm font-medium">Printing Now</h3>
          <p className="text-3xl font-bold text-admin-500 mt-2">{printingCount}</p>
        </div>
        <div className="glass-panel p-6 bg-slate-800/80 border border-slate-700 rounded-xl">
          <h3 className="text-slate-400 text-sm font-medium">Queue Potential Revenue</h3>
          <p className="text-3xl font-bold text-emerald-400 mt-2">₹{revenue.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="glass-panel p-6 mt-8 bg-slate-800/80 border border-slate-700 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Live Print Queue</h2>
          <button 
            onClick={handleBatchPrint}
            disabled={selectedOrders.length === 0 || batchMutation.isPending}
            className={`btn-admin px-4 py-2 bg-admin-600 hover:bg-admin-500 text-white rounded-lg text-sm font-medium transition-colors ${selectedOrders.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {batchMutation.isPending ? 'Processing...' : `Batch Print Selected (${selectedOrders.length})`}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="pb-3 pl-4 w-10"></th>
                <th className="pb-3">Order ID</th>
                <th className="pb-3">Student</th>
                <th className="pb-3">Details</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {queue.map(order => (
                <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="py-4 pl-4">
                    {order.status === 'pending' && (
                       <input 
                         type="checkbox" 
                         checked={selectedOrders.includes(order.id)}
                         onChange={() => toggleSelect(order.id)}
                         className="rounded bg-slate-800 border-slate-600 text-admin-500 focus:ring-admin-500"
                       />
                    )}
                  </td>
                  <td className="py-4 text-slate-300 font-mono text-xs">{order.id.slice(0,8)}</td>
                  <td className="py-4 text-slate-200">{order.student?.name} <br/><span className="text-xs text-slate-500">{order.student?.roll_number}</span></td>
                  <td className="py-4 text-slate-200">
                    <a href={order.file_url} target="_blank" rel="noreferrer" className="text-admin-400 hover:underline">{order.file_name}</a>
                    <br/>
                    <span className="text-xs text-slate-500">{order.page_count} pages • {order.color_mode} • {order.paper_size}</span>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-admin-500/20 text-admin-400'}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 flex gap-2">
                    {order.status === 'pending' && (
                      <button onClick={() => updateMutation.mutate({ id: order.id, status: 'printing'})} className="text-admin-400 hover:text-admin-300 font-medium">Print</button>
                    )}
                    {order.status === 'printing' && (
                      <button onClick={() => updateMutation.update({ id: order.id, status: 'ready'})} className="text-emerald-400 hover:text-emerald-300 font-medium">Done</button>
                    )}
                  </td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">Queue is empty</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminApp = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin<span className="text-admin-500">Portal</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin/dashboard" className="block px-4 py-3 bg-admin-600/20 text-admin-400 rounded-lg font-medium">Live Queue</Link>
          <Link to="/admin/history" className="block px-4 py-3 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-lg transition-colors">Order History</Link>
          <Link to="/admin/analytics" className="block px-4 py-3 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-lg transition-colors">Analytics</Link>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="w-full py-2 text-slate-400 hover:text-white transition-colors text-left px-4">Logout</button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-8 bg-slate-900">
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="history" element={<div className="text-slate-400">Order History (Coming Soon)</div>} />
          <Route path="analytics" element={<div className="text-slate-400">Analytics (Coming Soon)</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminApp;
