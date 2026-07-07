import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueue, updateOrderStatus, updateOrderPrice, batchPrintOrders } from '../api/client';
import io from 'socket.io-client';
import { LayoutDashboard, History, Settings, LogOut, Edit2, Check, X } from 'lucide-react';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  
  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['adminQueue'],
    queryFn: getQueue
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminQueue'] })
  });

  const updatePriceMutation = useMutation({
    mutationFn: updateOrderPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminQueue'] });
      setEditingPriceId(null);
      setNewPrice('');
    },
    onError: (error) => {
      alert('Failed to save price. The backend might still be updating, please try again in 1 minute! Error: ' + error.message);
      setEditingPriceId(null);
    }
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
    
    socket.on('new-order', () => queryClient.invalidateQueries({ queryKey: ['adminQueue'] }));
    socket.on('queue-updated', () => queryClient.invalidateQueries({ queryKey: ['adminQueue'] }));
    socket.on('queue-batch-updated', () => queryClient.invalidateQueries({ queryKey: ['adminQueue'] }));

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

  const savePrice = (id) => {
    if (newPrice !== '' && !isNaN(newPrice)) {
      updatePriceMutation.mutate({ id, amount: parseFloat(newPrice) });
    }
  };

  if (isLoading) return <div className="text-white animate-pulse text-lg p-10 font-semibold">Fetching Live Queue...</div>;

  const pendingCount = queue.filter(o => o.status === 'pending').length;
  const printingCount = queue.filter(o => o.status === 'printing').length;
  const revenue = queue.reduce((sum, order) => sum + parseFloat(order.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in text-white font-sans min-h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 bg-slate-800/60 border border-slate-700/50 rounded-2xl shadow-xl backdrop-blur-md">
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Pending Orders</h3>
          <p className="text-4xl font-black text-white mt-3">{pendingCount}</p>
        </div>
        <div className="glass-panel p-6 bg-slate-800/60 border border-slate-700/50 rounded-2xl shadow-xl backdrop-blur-md">
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Printing Now</h3>
          <p className="text-4xl font-black text-admin-400 mt-3">{printingCount}</p>
        </div>
        <div className="glass-panel p-6 bg-slate-800/60 border border-slate-700/50 rounded-2xl shadow-xl backdrop-blur-md">
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Queue Revenue</h3>
          <p className="text-4xl font-black text-emerald-400 mt-3">₹{revenue.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="glass-panel p-6 mt-8 bg-slate-800/60 border border-slate-700/50 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <LayoutDashboard className="w-5 h-5 mr-2 text-admin-400" />
            Live Print Queue
          </h2>
          <button 
            onClick={handleBatchPrint}
            disabled={selectedOrders.length === 0 || batchMutation.isPending}
            className={`px-5 py-2.5 bg-admin-600 hover:bg-admin-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg ${selectedOrders.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
          >
            {batchMutation.isPending ? 'Processing...' : `Batch Print Selected (${selectedOrders.length})`}
          </button>
        </div>
        
        <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider bg-slate-800/30">
                <th className="py-4 pl-6 w-10"></th>
                <th className="py-4 font-semibold">Student</th>
                <th className="py-4 font-semibold">Document Specs</th>
                <th className="py-4 font-semibold">Price (₹)</th>
                <th className="py-4 font-semibold">Status</th>
                <th className="py-4 font-semibold pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {queue.map(order => (
                <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors group">
                  <td className="py-4 pl-6">
                    {order.status === 'pending' && (
                       <input 
                         type="checkbox" 
                         checked={selectedOrders.includes(order.id)}
                         onChange={() => toggleSelect(order.id)}
                         className="rounded w-4 h-4 bg-slate-900 border-slate-600 text-admin-500 focus:ring-admin-500 focus:ring-offset-slate-800"
                       />
                    )}
                  </td>
                  <td className="py-4">
                    <p className="text-slate-200 font-bold">{order.student?.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{order.student?.roll_number} • {order.student?.phone_number || 'No phone'}</p>
                  </td>
                  <td className="py-4">
                    <a 
                      href={order.file_url ? order.file_url.replace('/upload/', '/upload/fl_attachment/') : '#'} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-admin-400 font-semibold hover:text-admin-300 hover:underline truncate max-w-[200px] block" 
                      title={order.file_name}
                      download={order.file_name}
                    >
                      {order.file_name}
                    </a>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded-md font-bold uppercase">{order.page_count}p</span>
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded-md font-bold uppercase">{order.color_mode}</span>
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded-md font-bold uppercase">{order.paper_size}</span>
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded-md font-bold uppercase">{order.copies}x</span>
                      {order.print_sides === 'double' && <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded-md font-bold uppercase">2-Sided</span>}
                      {order.paper_type === 'glossy' && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded-md font-bold uppercase border border-amber-500/30">Glossy</span>}
                      {order.binding && <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded-md font-bold uppercase border border-indigo-500/30">Spiral</span>}
                      <span className={`px-2 py-0.5 text-[10px] rounded-md font-bold uppercase border ${order.payment_method === 'online' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                        {order.payment_method}
                      </span>
                    </div>
                    {order.notes && (
                      <div className="mt-2 text-xs text-amber-400 bg-amber-500/10 p-1.5 rounded border border-amber-500/20 inline-block max-w-full break-words">
                        <span className="font-bold">📝 Note:</span> {order.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-4 font-bold text-slate-200">
                    {editingPriceId === order.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">₹</span>
                        <input 
                          type="number" 
                          className="w-16 bg-slate-900 border border-admin-500 rounded px-2 py-1 text-white outline-none"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          autoFocus
                        />
                        <button onClick={() => savePrice(order.id)} className="text-emerald-400 hover:text-emerald-300 p-1"><Check className="w-4 h-4"/></button>
                        <button onClick={() => setEditingPriceId(null)} className="text-red-400 hover:text-red-300 p-1"><X className="w-4 h-4"/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>₹{parseFloat(order.amount).toFixed(2)}</span>
                        {order.status === 'pending' && (
                          <button 
                            onClick={() => { setEditingPriceId(order.id); setNewPrice(parseFloat(order.amount)); }} 
                            className="text-slate-500 hover:text-admin-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Override Price"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                      'bg-admin-500/10 text-admin-400 border border-admin-500/20'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 pr-6 text-right flex justify-end gap-2">
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'printing'})} 
                        disabled={updateStatusMutation.isPending}
                        className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Print
                      </button>
                    )}
                    {order.status === 'printing' && (
                      <button 
                        onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'ready'})} 
                        disabled={updateStatusMutation.isPending}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-emerald-900/20"
                      >
                        Done
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <LayoutDashboard className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Queue is completely empty.</p>
                  </td>
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
    <div className="flex min-h-screen bg-slate-950 font-sans selection:bg-admin-500/30">
      {/* Sidebar Taskbar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col relative z-10 shadow-2xl">
        <div className="p-8 border-b border-slate-800/50">
          <div className="w-10 h-10 bg-gradient-to-br from-admin-400 to-admin-600 rounded-xl mb-4 shadow-lg shadow-admin-500/20 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin<span className="text-admin-500">Portal</span></h1>
          <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-wider">Store Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/admin/dashboard" className="flex items-center px-4 py-3.5 bg-admin-500/10 text-admin-400 rounded-xl font-bold border border-admin-500/20">
            <LayoutDashboard className="w-5 h-5 mr-3 opacity-80" /> Live Queue
          </Link>
          <Link to="/admin/history" className="flex items-center px-4 py-3.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-xl transition-all font-semibold">
            <History className="w-5 h-5 mr-3 opacity-60" /> Order History
          </Link>
        </nav>
        <div className="p-6 border-t border-slate-800/50">
          <button onClick={handleLogout} className="flex items-center justify-center w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors font-bold group">
            <LogOut className="w-4 h-4 mr-2 opacity-50 group-hover:opacity-100 transition-opacity" /> Logout
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto relative">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-admin-900/30 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="history" element={
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
              <History className="w-16 h-16 mb-4 opacity-20" />
              <h2 className="text-xl font-bold text-slate-300">Order History</h2>
              <p className="mt-2">Full historical ledger coming soon.</p>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default AdminApp;
