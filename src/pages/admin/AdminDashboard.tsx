import { Link } from 'react-router-dom';
import { Package, Calendar, Users, CreditCard, Settings } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/admin/packages"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition"
          >
            <Package className="w-12 h-12 text-emerald-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Manage Packages</h2>
            <p className="text-gray-600">Create, edit, and delete trip packages</p>
          </Link>

          <Link
            to="/admin/bookings"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition"
          >
            <Calendar className="w-12 h-12 text-blue-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">All Bookings</h2>
            <p className="text-gray-600">View and manage all bookings</p>
          </Link>

          <Link
            to="/admin/bookings/pending"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition"
          >
            <Calendar className="w-12 h-12 text-yellow-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Pending Bookings</h2>
            <p className="text-gray-600">View bookings awaiting confirmation</p>
          </Link>

          <Link
            to="/admin/bookings/confirmed"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition"
          >
            <Calendar className="w-12 h-12 text-green-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Confirmed Bookings</h2>
            <p className="text-gray-600">View confirmed bookings</p>
          </Link>

          <Link
            to="/admin/users"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition"
          >
            <Users className="w-12 h-12 text-purple-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Users</h2>
            <p className="text-gray-600">View all registered users</p>
          </Link>

          <Link
            to="/admin/payments"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition"
          >
            <CreditCard className="w-12 h-12 text-orange-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Payments</h2>
            <p className="text-gray-600">View payment summary and receipts</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
