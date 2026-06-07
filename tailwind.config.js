/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Driven by CSS custom properties (see src/index.css) so the whole app
        // can switch between dark and light themes at runtime. The `<alpha-value>`
        // placeholder keeps Tailwind opacity modifiers (e.g. bg-wa-green/90) working.
        wa: {
          green: 'rgb(var(--wa-green) / <alpha-value>)',
          'green-dark': 'rgb(var(--wa-green-dark) / <alpha-value>)',
          'green-light': 'rgb(var(--wa-green-light) / <alpha-value>)',
          'bg-main': 'rgb(var(--wa-bg-main) / <alpha-value>)',
          'bg-sidebar': 'rgb(var(--wa-bg-sidebar) / <alpha-value>)',
          'bg-chat': 'rgb(var(--wa-bg-chat) / <alpha-value>)',
          'bubble-in': 'rgb(var(--wa-bubble-in) / <alpha-value>)',
          'bubble-out': 'rgb(var(--wa-bubble-out) / <alpha-value>)',
          text: 'rgb(var(--wa-text) / <alpha-value>)',
          'text-muted': 'rgb(var(--wa-text-muted) / <alpha-value>)',
          'text-secondary': 'rgb(var(--wa-text-secondary) / <alpha-value>)',
          'icon': 'rgb(var(--wa-icon) / <alpha-value>)',
          'border': 'rgb(var(--wa-border) / <alpha-value>)',
          'hover': 'rgb(var(--wa-hover) / <alpha-value>)',
          'input-bg': 'rgb(var(--wa-input-bg) / <alpha-value>)',
          'header': 'rgb(var(--wa-header) / <alpha-value>)',
          'panel-header': 'rgb(var(--wa-panel-header) / <alpha-value>)',
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
