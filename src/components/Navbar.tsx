import { useState } from 'react';
import { Mountain, Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar = ({ currentPage, onNavigate }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      onNavigate('home');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <Mountain className="h-8 w-8 text-emerald-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">TrekBooking</span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => onNavigate('home')}
              className={`${
                currentPage === 'home' ? 'text-emerald-600' : 'text-gray-700'
              } hover:text-emerald-600 font-medium transition-colors`}
            >
              Packages
            </button>
            {user && (
              <>
                <button
                  onClick={() => onNavigate('my-bookings')}
                  className={`${
                    currentPage === 'my-bookings' ? 'text-emerald-600' : 'text-gray-700'
                  } hover:text-emerald-600 font-medium transition-colors`}
                >
                  My Bookings
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`${
                      currentPage === 'admin' ? 'text-emerald-600' : 'text-gray-700'
                    } hover:text-emerald-600 font-medium transition-colors flex items-center`}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-1" />
                    Admin
                  </button>
                )}
              </>
            )}
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 text-sm">{profile?.full_name || user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
              >
                <User className="h-4 w-4 mr-2" />
                Sign In
              </button>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-emerald-600"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-3 space-y-3">
            <button
              onClick={() => {
                onNavigate('home');
                setIsMenuOpen(false);
              }}
              className="block w-full text-left text-gray-700 hover:text-emerald-600 font-medium"
            >
              Packages
            </button>
            {user && (
              <>
                <button
                  onClick={() => {
                    onNavigate('my-bookings');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left text-gray-700 hover:text-emerald-600 font-medium"
                >
                  My Bookings
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left text-gray-700 hover:text-emerald-600 font-medium"
                  >
                    Admin Dashboard
                  </button>
                )}
              </>
            )}
            {user ? (
              <>
                <div className="text-gray-700 text-sm py-2 border-t">
                  {profile?.full_name || user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left text-gray-700 hover:text-emerald-600 font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onNavigate('auth');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
