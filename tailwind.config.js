/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'sans-serif'],
        display: ['var(--font-syne)', 'sans-serif'],
        mono:    ['var(--font-dm-mono)', 'monospace'],
      },
      colors: {
        navy:  { DEFAULT: '#1E3A5F', 50: '#EBF2FA', 100: '#D9E8F7', 500: '#2E6DA4', 900: '#0D2137' },
        tsel:  { DEFAULT: '#1B5E20', light: '#E8F5E9' },
        tlk:   { DEFAULT: '#0D47A1', light: '#E3F2FD' },
        tif:   { DEFAULT: '#E65100', light: '#FFF3E0' },
      },
      animation: {
        'fade-in':    'fadeIn .35s ease forwards',
        'slide-up':   'slideUp .4s cubic-bezier(.16,1,.3,1) forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
