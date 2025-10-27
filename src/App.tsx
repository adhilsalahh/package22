import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Packages from './pages/Packages';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Bookings from './pages/Bookings';
import Admin from './pages/Admin';
import { AdminLogin } from './pages/AdminLogin';
import { Toast } from './components/Toast';
import { Loader } from 'lucide-react';

const AppContent: React.FC = () => {
  const { loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <Loader className="h-12 w-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'packages':
        return <Packages onNavigate={setCurrentPage} />;
      case 'contact':
        return <Contact />;
      case 'login':
        return <Login onNavigate={setCurrentPage} />;
      case 'bookings':
        return <Bookings />;
      case 'admin':
        return <AdminLogin onNavigate={setCurrentPage} showToast={showToast} />;
      case 'admin-dashboard':
        return <Admin onNavigate={setCurrentPage} showToast={showToast} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  const showNavbar = currentPage !== 'admin' && currentPage !== 'admin-dashboard';

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />}
      {renderPage()}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
