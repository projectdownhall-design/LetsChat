/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Driven by CSS custom properties (see src/index.css) so the whole app
        // can switch between dark and light themes at runtime. The `<alpha-value>`
        // placeholder keeps Tailwind opacity modifiers (e.g. bg-lc-green/90) working.
        lc: {
          green: 'rgb(var(--lc-green) / <alpha-value>)',
          'green-dark': 'rgb(var(--lc-green-dark) / <alpha-value>)',
          'green-light': 'rgb(var(--lc-green-light) / <alpha-value>)',
          'bg-main': 'rgb(var(--lc-bg-main) / <alpha-value>)',
          'bg-sidebar': 'rgb(var(--lc-bg-sidebar) / <alpha-value>)',
          'bg-chat': 'rgb(var(--lc-bg-chat) / <alpha-value>)',
          'bubble-in': 'rgb(var(--lc-bubble-in) / <alpha-value>)',
          'bubble-out': 'rgb(var(--lc-bubble-out) / <alpha-value>)',
          text: 'rgb(var(--lc-text) / <alpha-value>)',
          'text-muted': 'rgb(var(--lc-text-muted) / <alpha-value>)',
          'text-secondary': 'rgb(var(--lc-text-secondary) / <alpha-value>)',
          'icon': 'rgb(var(--lc-icon) / <alpha-value>)',
          'border': 'rgb(var(--lc-border) / <alpha-value>)',
          'hover': 'rgb(var(--lc-hover) / <alpha-value>)',
          'input-bg': 'rgb(var(--lc-input-bg) / <alpha-value>)',
          'header': 'rgb(var(--lc-header) / <alpha-value>)',
          'panel-header': 'rgb(var(--lc-panel-header) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'typing': 'typing 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        typing: {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
