/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf8ee',
          100: '#f5efd6',
          200: '#ebdeae',
          300: '#dec77c',
          400: '#d4af37', // signature luxury gold
          500: '#c29b2b',
          600: '#a77e22',
          700: '#855e1d',
          800: '#6f4c1d',
          900: '#5e401d',
        },
        obsidian: {
          950: '#07080a',
          900: '#0c0d10',
          850: '#121418',
          800: '#181b22',
          700: '#232732',
          600: '#323746',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
