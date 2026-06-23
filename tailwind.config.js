/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        surface: {
          900: '#0a0c10',
          800: '#0f1117',
          700: '#151820',
          600: '#1c2030',
          500: '#252a38',
          400: '#2e3448',
        },
        gold: {
          400: '#e8c98e',
          500: '#c8a96e',
          600: '#a8894e',
        },
        accent: {
          blue: '#6e9ec8',
          purple: '#9e6ec8',
          green: '#6ec88a',
          red: '#c86e6e',
        }
      }
    }
  },
  plugins: []
}
