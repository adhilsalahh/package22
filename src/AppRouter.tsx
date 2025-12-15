import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Navbar } from "./components/Navbar";
import { HomePage } from "./pages/HomePage";
import { Packages } from "./pages/Packages";
import { PackageDetails } from "./pages/PackageDetails";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import { Signup } from "./pages/SignUp";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import RemainingPaymentPage from "./pages/RemainingPaymentPage";
import UserBookings from "./pages/UserBookings";



// ------------------ USER PROTECTED ROUTE ------------------
function ProtectedRoute({ children, requireAuth = false }: { children: React.ReactNode; requireAuth?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ------------------ ADMIN PROTECTED ROUTE ------------------
function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
}

// ------------------ USER LAYOUT ------------------
function UserLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

// ------------------ APP ROUTER ------------------
export default function AppRouter() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin/*" element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } />

        {/* User Layout */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/package/:id" element={<PackageDetails />} />

          {/* Protected User Routes */}
          <Route path="/booking/:id" element={<ProtectedRoute requireAuth><BookingPage /></ProtectedRoute>} />
          <Route path="/payment/:id" element={<ProtectedRoute requireAuth><PaymentPage /></ProtectedRoute>} />
          <Route path="/remaining-payment/:id" element={<ProtectedRoute requireAuth><RemainingPaymentPage /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute requireAuth><UserBookings /></ProtectedRoute>} />
          <Route path="/s" element={<ProtectedRoute requireAuth><UserBookings /></ProtectedRoute>} />

          {/* Public Routes */}
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
