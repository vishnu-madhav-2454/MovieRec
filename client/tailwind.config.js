/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7f3',
          100: '#ffe9df',
          200: '#ffd0bd',
          300: '#ffad90',
          400: '#f88968',
          500: '#e9674f',
          600: '#d9523d',
          700: '#b84032',
          800: '#96372e',
          900: '#79332c',
        },
        dark: {
          50: '#fbfaf7',
          100: '#f3f0ea',
          200: '#e9e4dc',
          300: '#d8d1c8',
          400: '#8b837a',
          500: '#6f685f',
          600: '#574f47',
          700: '#d2cbc1',
          800: '#e4ded5',
          900: '#fffdfa',
          950: '#f5f1eb',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'Avenir Next', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
