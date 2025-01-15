module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4caf50", // Habit Tracker's accent color
        secondary: "#1e293b", // Navy gray
        background: "#0f172a", // Dark background
        card: "#1e293b", // Card background
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "Arial", "sans-serif"], // Consistent font stack
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
  plugins: [],
};
