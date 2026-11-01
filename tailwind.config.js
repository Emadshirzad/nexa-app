/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        graphite: {
          DEFAULT: '#17212B',
          50: '#F0F3F6',
          100: '#E1E7ED',
          200: '#C2CFDC',
          300: '#94AEC4',
          400: '#5C84A3',
          500: '#3D5E7A',
          600: '#2C4458',
          700: '#243746',
          800: '#1E2C38',
          900: '#17212B',
          950: '#0F161D',
        },
        slate: {
          dark: '#243746',
        },
        emerald: {
          DEFAULT: '#10B981',
          50: '#E8F5EF',
          100: '#D1EBE0',
          200: '#A3D7C1',
          300: '#75C3A2',
          400: '#47AF83',
          500: '#10B981',
          600: '#0E9E6E',
          700: '#0B7A55',
          800: '#08573D',
          900: '#053424',
        },
        mint: {
          DEFAULT: '#E8F5EF',
        }
      },
      fontFamily: {
        sans: ['IRANSansX', 'Vazirmatn', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
