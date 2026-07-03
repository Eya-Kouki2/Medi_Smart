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
          "navy-mid": "#04096b",
          "navy-light": "#0a1128",
          "surface": "#f5f7fa",
          "surface-2": "#eef2f7",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        health: "0 20px 60px -15px rgba(3, 4, 94, 0.25)",
        card: "0 1px 3px 0 rgba(3,4,94,0.06), 0 4px 16px -4px rgba(3,4,94,0.08)",
        "card-hover": "0 4px 20px -4px rgba(3,4,94,0.15), 0 8px 40px -8px rgba(3,4,94,0.10)",
        "sidebar": "4px 0 24px -4px rgba(3,4,94,0.35)",
      },
      backgroundImage: {
        "main-bg": "linear-gradient(135deg, #f5f7fa 0%, #eef2f7 50%, #e8f0fe 100%)",
        "navy-gradient": "linear-gradient(180deg, #03045e 0%, #023e8a 100%)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "slide-in": { "0%": { opacity: 0, transform: "translateX(-8px)" }, "100%": { opacity: 1, transform: "translateX(0)" } },
        "pulse-dot": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
        "bar-grow": { "0%": { width: "0%" }, "100%": { width: "var(--bar-w)" } },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "slide-in": "slide-in 0.2s ease-out",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "bar-grow": "bar-grow 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
}