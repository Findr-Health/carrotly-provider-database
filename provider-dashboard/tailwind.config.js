/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Urbanist', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#E6FAF7',
          100: '#CCF5EF',
          200: '#99EBE0',
          300: '#66E0D0',
          400: '#33D6C0',
          500: '#17DDC0',
          600: '#12B19A',
          700: '#0E8573',
          800: '#09584D',
          900: '#052C26',
        },
        findr: {
          DEFAULT: '#17DDC0',
          dark: '#12B19A',
          light: '#CCF5EF',
        }
      },
    },
  },
  plugins: [],
}
