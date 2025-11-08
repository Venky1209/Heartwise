// HeartWise Medical Theme - Professional, Calming, and Positive
export const theme = {
  // Color Palette - Medical-grade calming colors
  colors: {
    primary: {
      50: '#f0f9ff',   // Very light blue
      100: '#e0f2fe',  // Lighter blue
      200: '#bae6fd',  // Light blue
      300: '#7dd3fc',  // Medium blue
      400: '#38bdf8',  // Main blue
      500: '#0ea5e9',  // Primary brand color
      600: '#0284c7',  // Darker blue
      700: '#0369a1',  // Deep blue
      800: '#075985',  // Very deep blue
      900: '#0c4a6e',  // Darkest blue
    },
    success: {
      50: '#f0fdf4',   // Very light green
      100: '#dcfce7',  // Light green
      200: '#bbf7d0',  // Lighter green
      300: '#86efac',  // Medium light green
      400: '#4ade80',  // Medium green
      500: '#22c55e',  // Success green
      600: '#16a34a',  // Darker green
      700: '#15803d',  // Deep green
      800: '#166534',  // Very deep green
      900: '#14532d',  // Darkest green
    },
    warning: {
      50: '#fffbeb',   // Very light amber
      100: '#fef3c7',  // Light amber
      200: '#fde68a',  // Lighter amber
      300: '#fcd34d',  // Medium amber
      400: '#fbbf24',  // Main amber
      500: '#f59e0b',  // Warning amber
      600: '#d97706',  // Darker amber
      700: '#b45309',  // Deep amber
      800: '#92400e',  // Very deep amber
      900: '#78350f',  // Darkest amber
    },
    danger: {
      50: '#fef2f2',   // Very light red
      100: '#fee2e2',  // Light red
      200: '#fecaca',  // Lighter red
      300: '#fca5a5',  // Medium red
      400: '#f87171',  // Main red
      500: '#ef4444',  // Danger red
      600: '#dc2626',  // Darker red
      700: '#b91c1c',  // Deep red
      800: '#991b1b',  // Very deep red
      900: '#7f1d1d',  // Darkest red
    },
    neutral: {
      50: '#fafafa',   // Almost white
      100: '#f5f5f5',  // Very light gray
      200: '#e5e5e5',  // Light gray
      300: '#d4d4d4',  // Medium light gray
      400: '#a3a3a3',  // Medium gray
      500: '#737373',  // Gray
      600: '#525252',  // Dark gray
      700: '#404040',  // Darker gray
      800: '#262626',  // Very dark gray
      900: '#171717',  // Almost black
    },
    heart: {
      50: '#fff1f2',   // Very light rose
      100: '#ffe4e6',  // Light rose
      200: '#fecdd3',  // Lighter rose
      300: '#fda4af',  // Medium rose
      400: '#fb7185',  // Main rose
      500: '#f43f5e',  // Heart red
      600: '#e11d48',  // Darker rose
      700: '#be123c',  // Deep rose
      800: '#9f1239',  // Very deep rose
      900: '#881337',  // Darkest rose
    },
  },

  // Gradients for backgrounds and accents
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    calm: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    health: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    success: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    sky: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    medical: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)',
    heartbeat: 'linear-gradient(90deg, #f43f5e 0%, #fb7185 50%, #f43f5e 100%)',
  },

  // Shadows for depth and elevation
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    glow: '0 0 15px rgba(14, 165, 233, 0.5)',
    heartbeat: '0 0 20px rgba(244, 63, 94, 0.6)',
  },

  // Animation durations and easings
  animation: {
    duration: {
      fast: '150ms',
      base: '300ms',
      slow: '500ms',
      slower: '700ms',
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Spacing scale
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    full: '9999px',
  },

  // Typography
  typography: {
    fontFamily: {
      sans: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
      display: "'Poppins', 'Inter', sans-serif",
      mono: "'Fira Code', 'Consolas', monospace",
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
      '5xl': ['3rem', { lineHeight: '1' }],           // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

export default theme;
