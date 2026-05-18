/**
 * Login Page — HeartWise Magenta-Rose Dark Theme
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      let redirectPath = '/dashboard';
      if (result.user?.role === 'doctor') redirectPath = '/doctor/dashboard';
      else if (result.user?.role === 'admin') redirectPath = '/admin/dashboard';
      const from = location.state?.from?.pathname || redirectPath;
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4"
         style={{ backgroundColor: '#1E1A1D' }}>
      {/* Subtle radial glow */}
      <div className="fixed inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at center, rgba(240,171,252,0.04) 0%, transparent 70%)' }} />
      
      <div className="relative max-w-md w-full space-y-6 p-8 rounded-2xl"
           style={{ backgroundColor: '#2A2528', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        
        {/* Wordmark */}
        <div className="text-center">
          <p className="text-lg tracking-widest mb-6"
             style={{ color: '#F0ABFC', fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '0.1em' }}>
            heartwise
          </p>
          <h2 className="text-2xl font-bold" style={{ color: '#F5F0F2', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Welcome back
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#A89DA3' }}>
            Sign in to continue monitoring your health
          </p>
        </div>

        {/* Messages */}
        {location.state?.message && (
          <div className="px-4 py-3 rounded-lg text-sm" 
               style={{ backgroundColor: 'rgba(134,239,172,0.1)', color: '#86EFAC', border: '1px solid rgba(134,239,172,0.2)' }}>
            {location.state.message}
          </div>
        )}

        {(error || authError) && (
          <div className="px-4 py-3 rounded-lg text-sm font-medium"
               style={{ backgroundColor: 'rgba(251,113,133,0.1)', color: '#FB7185', border: '1px solid rgba(251,113,133,0.2)' }}>
            {error || authError}
          </div>
        )}

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#A89DA3' }}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all"
              style={{ 
                backgroundColor: '#332F33', border: '1px solid #3A3438', color: '#F5F0F2',
                outline: 'none'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#F0ABFC'; e.target.style.boxShadow = '0 0 0 2px rgba(240,171,252,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#3A3438'; e.target.style.boxShadow = 'none'; }}
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: '#A89DA3' }}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm transition-all"
                style={{ 
                  backgroundColor: '#332F33', border: '1px solid #3A3438', color: '#F5F0F2',
                  outline: 'none'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#F0ABFC'; e.target.style.boxShadow = '0 0 0 2px rgba(240,171,252,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#3A3438'; e.target.style.boxShadow = 'none'; }}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: '#7A7078' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: '#F0ABFC' }}>
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: '#F0ABFC', color: '#1E1A1D',
              fontFamily: '"Plus Jakarta Sans", sans-serif'
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = '#E879F9'; }}
            onMouseLeave={(e) => { e.target.style.backgroundColor = '#F0ABFC'; }}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center">
          <div className="flex-1 h-px" style={{ backgroundColor: '#3A3438' }} />
          <span className="px-3 text-xs" style={{ color: '#7A7078' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#3A3438' }} />
        </div>

        {/* Google sign-in placeholder */}
        <button
          type="button"
          className="w-full flex items-center justify-center py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/5"
          style={{ border: '1px solid #3A3438', color: '#A89DA3' }}
        >
          Continue with Google
        </button>

        {/* Register link */}
        <p className="text-center text-sm" style={{ color: '#A89DA3' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium transition-colors hover:opacity-80"
                style={{ color: '#F0ABFC' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
