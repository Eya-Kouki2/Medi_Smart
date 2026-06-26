/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        health: {
          cyan: "#00b4d8",
          sky: "#90e0ef",
          ice: "#caf0f8",
          blue: "#0077b6",
          navy: "#03045e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        health: "0 20px 60px -15px rgba(3, 4, 94, 0.25)",
      },
    },
  },
  plugins: [],
}