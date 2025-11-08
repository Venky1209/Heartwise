import React from 'react';
import { getLoadingQuote } from '../../theme/quotes';

// Heartbeat Loading Animation
export const HeartbeatLoader = ({ message, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="heartbeat-animation">
            <svg viewBox="0 0 32 32" className="w-full h-full text-red-500">
              <path
                fill="currentColor"
                d="M16 28.72a2.09 2.09 0 0 1-1.46-.59C7.47 21.54 2 16.8 2 11.5A6.53 6.53 0 0 1 8.5 5a6.82 6.82 0 0 1 5.49 2.72h.1A6.82 6.82 0 0 1 23.5 5 6.53 6.53 0 0 1 30 11.5c0 5.3-5.47 10.04-12.54 16.63a2.09 2.09 0 0 1-1.46.59z"
              />
            </svg>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="pulse-ring"></div>
        </div>
      </div>
      {message && (
        <p className="text-sm text-gray-600 font-medium animate-pulse">
          {message || getLoadingQuote()}
        </p>
      )}
    </div>
  );
};

// Spinning Loader with gradient
export const SpinnerLoader = ({ size = 'md', color = 'primary' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  };

  const colorClasses = {
    primary: 'border-blue-500 border-t-transparent',
    success: 'border-green-500 border-t-transparent',
    warning: 'border-yellow-500 border-t-transparent',
    danger: 'border-red-500 border-t-transparent'
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} border-solid rounded-full animate-spin`}></div>
  );
};

// Pulse Dot Animation
export const PulseDot = ({ color = 'green', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className="relative inline-flex">
      <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}></div>
      <div className={`absolute inset-0 ${colorClasses[color]} rounded-full animate-ping opacity-75`}></div>
    </div>
  );
};

// ECG Wave Animation
export const ECGWaveLoader = () => {
  return (
    <div className="flex items-center justify-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-1 bg-blue-500 rounded-full ecg-wave-bar"
          style={{
            animationDelay: `${i * 0.1}s`,
            height: '40px'
          }}
        ></div>
      ))}
    </div>
  );
};

// Skeleton Loader for content
export const SkeletonLoader = ({ width = 'full', height = '4', className = '' }) => {
  return (
    <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
      style={{
        width: width === 'full' ? '100%' : width,
        height: `${height}rem`,
        animation: 'shimmer 2s infinite linear'
      }}
    ></div>
  );
};

// Progress Bar with smooth animation
export const ProgressBar = ({ progress = 0, color = 'primary', showPercentage = true, label }) => {
  const colorClasses = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };

  return (
    <div className="w-full space-y-2">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="font-medium text-gray-700">{label}</span>}
          {showPercentage && <span className="font-semibold text-gray-900">{Math.round(progress)}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

// Circular Progress
export const CircularProgress = ({ progress = 0, size = 120, strokeWidth = 8, color = 'primary' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    primary: '#3b82f6',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444'
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorClasses[color]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

// Card with hover animation
export const AnimatedCard = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Fade in animation wrapper
export const FadeIn = ({ children, delay = 0, duration = 500, className = '' }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

// Slide in from side
export const SlideIn = ({ children, direction = 'left', delay = 0, className = '' }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const translateClasses = {
    left: isVisible ? 'translate-x-0' : '-translate-x-full',
    right: isVisible ? 'translate-x-0' : 'translate-x-full',
    top: isVisible ? 'translate-y-0' : '-translate-y-full',
    bottom: isVisible ? 'translate-y-0' : 'translate-y-full',
  };

  return (
    <div
      className={`transition-transform duration-700 ease-out ${translateClasses[direction]} ${className}`}
    >
      {children}
    </div>
  );
};

// Success checkmark animation
export const SuccessCheckmark = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

  return (
    <div className={`${sizeClasses[size]} mx-auto`}>
      <svg className="checkmark" viewBox="0 0 52 52">
        <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
        <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
      </svg>
    </div>
  );
};

export default {
  HeartbeatLoader,
  SpinnerLoader,
  PulseDot,
  ECGWaveLoader,
  SkeletonLoader,
  ProgressBar,
  CircularProgress,
  AnimatedCard,
  FadeIn,
  SlideIn,
  SuccessCheckmark,
};
