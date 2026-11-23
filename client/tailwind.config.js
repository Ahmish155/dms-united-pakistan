/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#C62828',
          'red-hover': '#A91F1F',
          'red-light': '#FFEBEE',
        },
        surface: {
          primary: '#FFFFFF',
          secondary: '#F7F7F7',
          border: '#E8E8E8',
        },
        typography: {
          main: '#252525',
          secondary: '#737373',
          muted: '#9E9E9E',
        },
        status: {
          success: '#16845B',
          warning: '#D99021',
          error: '#C62828',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
