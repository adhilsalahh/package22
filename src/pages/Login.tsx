import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateFullName,
} from '../utils/validation';

const Login: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    name: '',
    phone: '',
    email: '',
  });

  // UNIVERSAL INPUT HANDLER
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (e.target.name === 'phone') {
      // allow only digits
      value = value.replace(/\D/g, '');
    }

    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  // SUBMIT HANDLER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // VALIDATIONS
        const nameCheck = validateFullName(formData.name);
        if (!nameCheck.isValid) throw new Error(nameCheck.error);

        const emailCheck = validateEmail(formData.email);
        if (!emailCheck.isValid) throw new Error(emailCheck.error);

        const phoneCheck = validatePhone(formData.phone);
        if (!phoneCheck.isValid) throw new Error(phoneCheck.error);

        const pwCheck = validatePassword(formData.password);
        if (!pwCheck.isValid) throw new Error(pwCheck.error);

        // CALL SIGNUP API
        await signUp(formData.email, formData.password, formData.name, formData.phone);

        alert('Registration successful! You can now log in.');

        setIsSignUp(false);
        setFormData({ identifier: '', password: '', name: '', phone: '', email: '' });

      } else {
        if (!formData.identifier || !formData.password)
          throw new Error('Please enter your name/email and password');

        await signIn(formData.identifier, formData.password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // PASSWORD RULE HIGHLIGHTS
  const pass = formData.password;
  const passRules = {
    minLength: pass.length >= 8,
    upper: /[A-Z]/.test(pass),
    lower: /[a-z]/.test(pass),
    number: /[0-9]/.test(pass),
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            {isSignUp ? <UserPlus className="h-8 w-8 text-blue-600" /> : <LogIn className="h-8 w-8 text-blue-600" />}
          </div>

          <h2 className="text-3xl font-bold">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-gray-600">{isSignUp ? 'Sign up to continue' : 'Sign in to your account'}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp ? (
            <>
              {/* FULL NAME */}
              <div>
                <label className="block text-sm mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-sm mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />
              </div>

              {/* PHONE */}
              <div>
                <label className="block text-sm mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />
              </div>

              {/* PASSWORD */}
              <div className="relative">
                <label className="block text-sm mb-2">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-10 text-gray-600"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {/* PASSWORD CONDITIONS */}
              <div className="text-sm mt-2 space-y-1">
                <p className={passRules.minLength ? 'text-green-600' : 'text-red-600'}>• Min 8 Characters</p>
                <p className={passRules.upper ? 'text-green-600' : 'text-red-600'}>• Atleast 1 Uppercase</p>
                <p className={passRules.lower ? 'text-green-600' : 'text-red-600'}>• Atleast 1 Lowercase</p>
                <p className={passRules.number ? 'text-green-600' : 'text-red-600'}>• Atleast 1 Number</p>
              </div>
            </>
          ) : (
            <>
              {/* IDENTIFIER */}
              <div>
                <label className="block text-sm mb-2">Name or Email</label>
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />
              </div>

              {/* PASSWORD */}
              <div className="relative">
                <label className="block text-sm mb-2">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-10 text-gray-600"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        {/* SWITCH LOGIN / SIGNUP */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setFormData({ identifier: '', password: '', name: '', phone: '', email: '' });
            }}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;

