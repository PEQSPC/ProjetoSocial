/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: { xl: "0.75rem", "2xl": "1rem" },
      boxShadow: { soft: "0 10px 30px -10px rgba(0,0,0,0.25)" },
    },
  },
  plugins: [],
}
