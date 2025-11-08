// Enhanced Login Page Example with New Theme
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartbeatLoader, FadeIn } from '../components/Animations/Loaders';
import { getRandomQuote } from '../theme/quotes';

const EnhancedLoginExample = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [quote] = useState(getRandomQuote('motivation'));
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Your login logic here
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <HeartbeatLoader message="Logging you in..." size="lg" />
        <FadeIn delay={500}>
          <p className="mt-8 text-gray-600 italic max-w-md text-center">
            "{quote.text}"
          </p>
          <p className="text-sm text-gray-500 mt-2">- {quote.author}</p>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <FadeIn duration={600}>
        <div className="max-w-md w-full space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg mb-4 animate-float">
              <span className="text-3xl animate-heartbeat">❤️</span>
            </div>
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-2">
              Welcome to <span className="text-primary-600">HeartWise</span>
            </h2>
            <p className="text-gray-600">
              Your personal heart health companion
            </p>
          </div>

          {/* Motivational Quote Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-card border border-white hover-lift">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-sm text-gray-700 italic">
                  "{quote.text}"
                </p>
                <p className="text-xs text-gray-500 mt-2">- {quote.author}</p>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-semibold">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                Sign In
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Sign up
                </a>
              </p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span className="text-success-500">✓</span>
              <span>Medical Grade</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-success-500">✓</span>
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-success-500">✓</span>
              <span>Secure</span>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default EnhancedLoginExample;
