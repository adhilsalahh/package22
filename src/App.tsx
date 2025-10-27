import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { PackageDetailsPage } from './pages/PackageDetailsPage';
import { BookingPage } from './pages/BookingPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPackages } from './pages/admin/AdminPackages';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminUsers } from './pages/admin/AdminUsers';

type Page =
  | 'home'
  | 'auth'
  | 'package-details'
  | 'booking'
  | 'my-bookings'
  | 'admin'
  | 'admin-packages'
  | 'admin-bookings'
  | 'admin-users';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  const handleNavigate = (page: string, packageId?: string) => {
    setCurrentPage(page as Page);
    if (packageId) {
      setSelectedPackageId(packageId);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'auth':
        return <AuthPage onNavigate={handleNavigate} />;
      case 'package-details':
        return <PackageDetailsPage packageId={selectedPackageId} onNavigate={handleNavigate} />;
      case 'booking':
        return (
          <ProtectedRoute>
            <BookingPage packageId={selectedPackageId} onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case 'my-bookings':
        return (
          <ProtectedRoute>
            <MyBookingsPage onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case 'admin':
        return (
          <ProtectedRoute adminOnly>
            <AdminDashboard onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case 'admin-packages':
        return (
          <ProtectedRoute adminOnly>
            <AdminPackages onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case 'admin-bookings':
        return (
          <ProtectedRoute adminOnly>
            <AdminBookings onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case 'admin-users':
        return (
          <ProtectedRoute adminOnly>
            <AdminUsers onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
        {renderPage()}
      </div>
    </AuthProvider>
  );
}

export default App;
