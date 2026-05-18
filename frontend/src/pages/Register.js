/**
 * Registration Page — HeartWise Magenta-Rose Dark Theme
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', activationCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.activationCode) {
      setError('Please fill in all fields'); return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long'); return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match'); return false;
    }
    const activationCodePattern = /^HW-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
    if (!activationCodePattern.test(formData.activationCode)) {
      setError('Invalid activation code format. Expected: HW-XXXX-XXXX-XXXX'); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);
    const result = await register(formData.email, formData.password, formData.activationCode.toUpperCase());
    if (result.success) {
      navigate('/profile/complete', { state: { message: 'Registration successful! Please complete your profile.' } });
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleActivationCodeChange = (e) => {
    const cleaned = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = 'HW-' + cleaned.substring(2, 6);
      if (cleaned.length > 6) formatted += '-' + cleaned.substring(6, 10);
      if (cleaned.length > 10) formatted += '-' + cleaned.substring(10, 14);
    } else {
      formatted = cleaned;
    }
    setFormData({ ...formData, activationCode: formatted });
    setError('');
  };

  const inputStyle = {
    backgroundColor: '#332F33', border: '1px solid #3A3438', color: '#F5F0F2', outline: 'none'
  };

  const focusIn = (e) => { e.target.style.borderColor = '#F0ABFC'; e.target.style.boxShadow = '0 0 0 2px rgba(240,171,252,0.15)'; };
  const focusOut = (e) => { e.target.style.borderColor = '#3A3438'; e.target.style.boxShadow = 'none'; };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ backgroundColor: '#1E1A1D' }}>
      <div className="fixed inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at center, rgba(240,171,252,0.04) 0%, transparent 70%)' }} />

      <div className="relative max-w-md w-full space-y-6 p-8 rounded-2xl"
           style={{ backgroundColor: '#2A2528', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <div className="text-center">
          <p className="text-lg tracking-widest mb-6"
             style={{ color: '#F0ABFC', fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '0.1em' }}>
            heartwise
          </p>
          <h2 className="text-2xl font-bold" style={{ color: '#F5F0F2', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Create Account
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#A89DA3' }}>
            Register your HeartWise ECG device
          </p>
        </div>

        {/* Info Box */}
        <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(240,171,252,0.08)', border: '1px solid rgba(240,171,252,0.15)' }}>
          <p className="text-xs" style={{ color: '#F0ABFC' }}>
            📦 Your activation code is printed on the box of your HeartWise ECG device. Format: HW-XXXX-XXXX-XXXX
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-lg text-sm font-medium"
               style={{ backgroundColor: 'rgba(251,113,133,0.1)', color: '#FB7185', border: '1px solid rgba(251,113,133,0.2)' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#A89DA3' }}>Device Activation Code *</label>
            <input id="activationCode" name="activationCode" type="text" required value={formData.activationCode}
              onChange={handleActivationCodeChange} maxLength={17}
              className="w-full px-4 py-3 rounded-xl text-sm font-mono"
              style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="HW-XXXX-XXXX-XXXX" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#A89DA3' }}>Email address *</label>
            <input id="email" name="email" type="email" autoComplete="email" required value={formData.email}
              onChange={handleChange} className="w-full px-4 py-3 rounded-xl text-sm"
              style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="your.email@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#A89DA3' }}>Password *</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required
                value={formData.password} onChange={handleChange} className="w-full px-4 py-3 pr-12 rounded-xl text-sm"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: '#7A7078' }}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
            <p className="mt-1 text-xs" style={{ color: '#7A7078' }}>Minimum 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#A89DA3' }}>Confirm Password *</label>
            <input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required
              value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-3 rounded-xl text-sm"
              style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="Re-enter your password" />
          </div>

          {/* Terms */}
          <div className="flex items-start">
            <input id="terms" name="terms" type="checkbox" required className="h-4 w-4 rounded mt-0.5"
              style={{ backgroundColor: '#332F33', borderColor: '#3A3438' }} />
            <label htmlFor="terms" className="ml-2 text-sm" style={{ color: '#A89DA3' }}>
              I agree to the{' '}
              <Link to="/terms" style={{ color: '#F0ABFC' }}>Terms of Service</Link>{' '}and{' '}
              <Link to="/privacy" style={{ color: '#F0ABFC' }}>Privacy Policy</Link>
            </label>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#F0ABFC', color: '#1E1A1D', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = '#E879F9'; }}
            onMouseLeave={(e) => { e.target.style.backgroundColor = '#F0ABFC'; }}>
            {loading ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : 'Create Account & Activate Device'}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm" style={{ color: '#A89DA3' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium" style={{ color: '#F0ABFC' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
