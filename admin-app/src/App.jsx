import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueue, updateOrderStatus, batchPrintOrders } from './api/client';
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
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
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
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-slate-400 text-sm font-medium">Pending Orders</h3>
          <p className="text-3xl font-bold text-white mt-2">{pendingCount}</p>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-slate-400 text-sm font-medium">Printing Now</h3>
          <p className="text-3xl font-bold text-admin-500 mt-2">{printingCount}</p>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-slate-400 text-sm font-medium">Queue Potential Revenue</h3>
          <p className="text-3xl font-bold text-emerald-400 mt-2">₹{revenue.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="glass-panel p-6 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Live Print Queue</h2>
          <button 
            onClick={handleBatchPrint}
            disabled={selectedOrders.length === 0 || batchMutation.isPending}
            className={`btn-admin text-sm ${selectedOrders.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {batchMutation.isPending ? 'Processing...' : `Batch Print Selected (${selectedOrders.length})`}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="pb-3 pl-4 w-10">
                   {/* Checkbox placeholder */}
                </th>
                <th className="pb-3">Order ID</th>
                <th className="pb-3">Student</th>
                <th className="pb-3">Details</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {queue.map(order => (
                <tr key={order.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
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
                  <td className="py-4">{order.student?.name} <br/><span className="text-xs text-slate-500">{order.student?.roll_number}</span></td>
                  <td className="py-4">{order.file_name} <br/><span className="text-xs text-slate-500">{order.page_count} pages • {order.color_mode} • {order.paper_size}</span></td>
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
                      <button onClick={() => updateMutation.mutate({ id: order.id, status: 'ready'})} className="text-emerald-400 hover:text-emerald-300 font-medium">Done</button>
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 glass-panel rounded-none border-y-0 border-l-0 flex flex-col">
            <div className="p-6 border-b border-slate-700">
              <h1 className="text-2xl font-bold text-white tracking-tight">Admin<span className="text-admin-500">Portal</span></h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <Link to="/" className="block px-4 py-3 bg-admin-600/20 text-admin-400 rounded-lg font-medium">Live Queue</Link>
              <Link to="/history" className="block px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-lg transition-colors">Order History</Link>
              <Link to="/analytics" className="block px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-lg transition-colors">Analytics</Link>
            </nav>
            <div className="p-4 border-t border-slate-700">
              <button className="w-full py-2 text-slate-400 hover:text-white transition-colors">Logout</button>
            </div>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/history" element={<div className="text-slate-400">Order History (Coming Soon)</div>} />
              <Route path="/analytics" element={<div className="text-slate-400">Analytics (Coming Soon)</div>} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
