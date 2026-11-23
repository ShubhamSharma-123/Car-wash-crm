/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f2f6fc',
          100: '#e3ebf7',
          200: '#c3d5ec',
          300: '#93b1da',
          400: '#5c86c3',
          500: '#3866a8',
          600: '#294f8b',
          700: '#223f70',
          800: '#1c3358',
          900: '#0f1e3d',
          950: '#0a1529',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        surface: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'Inter var', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 30 61 / 0.04), 0 1px 3px 0 rgb(15 30 61 / 0.06)',
        'card-hover': '0 4px 12px -2px rgb(15 30 61 / 0.10), 0 2px 6px -2px rgb(15 30 61 / 0.06)',
        dropdown: '0 12px 32px -8px rgb(15 30 61 / 0.18), 0 4px 12px -4px rgb(15 30 61 / 0.08)',
        pop: '0 24px 56px -16px rgb(15 30 61 / 0.28)',
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem' },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in .16s ease-out',
        'slide-up': 'slide-up .22s cubic-bezier(.16,1,.3,1)',
        'scale-in': 'scale-in .16s ease-out',
        'slide-in-left': 'slide-in-left .2s ease-out',
      },
      screens: { xs: '420px' },
    },
  },
  plugins: [],
};
