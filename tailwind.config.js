/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        data: ['"Orbitron"', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0f0f1a',
          50: '#1a1a2e',
          100: '#1e1e38',
        },
      },
    },
  },
  plugins: [],
};
