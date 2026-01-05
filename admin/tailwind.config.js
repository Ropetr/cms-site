/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta FIO - Vermelho Premium
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Vermelho vibrante
          600: '#dc2626', // Vermelho principal FIO
          700: '#b91c1c',
          800: '#991b1b', // Vermelho escuro FIO
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Dourado/Accent FIO
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Dourado FIO
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Cinzas para dark mode
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937', // Fundo cards dark
          900: '#111827', // Fundo principal dark
          950: '#030712',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-fio': 'linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)',
        'gradient-fio-dark': 'linear-gradient(135deg, #991b1b 0%, #d97706 100%)',
        'gradient-hero': 'linear-gradient(180deg, #111827 0%, #1f2937 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(220, 38, 38, 0.3)',
        'glow-accent': '0 0 20px rgba(245, 158, 11, 0.3)',
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
