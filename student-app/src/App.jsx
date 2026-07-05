import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import StudentApp from './pages/StudentApp';
import AdminLogin from './pages/AdminLogin';
import AdminApp from './pages/AdminApp';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Admin Login Route (Unprotected) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Admin Dashboard Routes (Protected) */}
          <Route path="/admin/*" element={<ProtectedRoute />}>
            <Route path="*" element={<AdminApp />} />
          </Route>
          
          {/* Student Portal Routes (Fallback) */}
          <Route path="/*" element={<StudentApp />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
