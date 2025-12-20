/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mortal Kombat Theme Colors
        obsidian: {
          DEFAULT: '#0D0D0D',
          light: '#1A1A1A',
        },
        blood: {
          DEFAULT: '#8B0000',
          light: '#A50000',
          dark: '#6B0000',
        },
        soul: {
          DEFAULT: '#00FF41',
          light: '#33FF66',
          dark: '#00CC34',
        },
        gold: {
          DEFAULT: '#C5A059',
          light: '#D4B16F',
          dark: '#B08F48',
        },
        text: {
          DEFAULT: '#E0E0E0',
          muted: '#B0B0B0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
      },      boxShadow: {
        'blood': '0 0 20px rgba(139, 0, 0, 0.5)',
        'soul': '0 0 20px rgba(0, 255, 65, 0.5)',
        'gold': '0 0 20px rgba(197, 160, 89, 0.5)',
      },    },
  },
  plugins: [],
}
