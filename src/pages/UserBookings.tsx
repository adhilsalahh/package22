import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, IndianRupee, Users, CheckCircle, XCircle, Loader } from 'lucide-react';

interface BookingMember {
  id: string;
  member_name: string;
  member_phone: string;
}

interface BookingWithPackage {
  id: string;
  booking_date: string;
  total_price: string;
  advance_paid: number; 
  remaining_paid: boolean; 
  status: string;
  created_at: string;
  number_of_members: number;
  travel_group_name: string;
  members: BookingMember[];
  package: {
    id: string;
    title: string;
    price_per_head: number;
    image_url?: string;
  } | null;
  advance_amount?: number; // DB column, optional
}

export default function UserBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadBookings();
  }, [user]);

  async function loadBookings() {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          package:packages(id, title, price_per_head, image_url),
          members:booking_members(id, member_name, member_phone)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirmed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="h-4 w-4 mr-1" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Loader className="h-4 w-4 mr-1 animate-spin" />
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading bookings...</div>
      </div>
    );
  }

 

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-2 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center sm:text-left">
          My Bookings
        </h1>

        {/* Total Advance Paid */}
       

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">You haven't made any bookings yet.</p>
            <Link
              to="/packages"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Browse Packages
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const totalPrice = Number(booking.total_price) || 0;
              const advancePaid = booking.advance_paid ?? 0;
              const remainingAdvance = totalPrice - advancePaid;

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden sm:flex sm:items-center"
                >
                  {booking.package?.image_url && (
                    <img
                      src={booking.package.image_url}
                      alt={booking.package.title}
                      className="w-full h-48 object-cover sm:w-48 sm:h-48"
                    />
                  )}

                  <div className="p-4 sm:p-6 flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2 sm:gap-0">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">
                          {booking.package?.title || 'Package'}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Travel: {new Date(booking.booking_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            <span>Total Price: ₹{totalPrice.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>Members: {booking.number_of_members}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            <span>
                              Advance Amount: ₹{(booking.advance_amount ?? totalPrice).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 sm:mt-0">{getStatusBadge(booking.status)}</div>
                    </div>
                    

                    <div className="border-t pt-4 space-y-3">
                      {/* Advance Payment Button */}
                      {advancePaid === 0 && booking.status === 'pending' && (
                        <Link
                          to={`/payment/${booking.id}`}
                          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          Pay Advance
                        </Link>
                      )}

                      {/* Advance Payment Status */}
                      <p className="text-sm text-gray-600">
                        Advance Amount Paid: {advancePaid > 0 ? `✓ ₹${advancePaid.toLocaleString('en-IN')}` : '✗ ₹0'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Remaining: {remainingAdvance > 0 ? `✗ ₹${remainingAdvance.toLocaleString('en-IN')}` : '✓ Completed'}
                      </p>

                      {booking.members.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">Participants:</p>
                          <ul className="list-disc pl-5 text-gray-600 text-sm space-y-1">
                            {booking.members.map((m) => (
                              <li key={m.id}>
                                {m.member_name} - {m.member_phone}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
