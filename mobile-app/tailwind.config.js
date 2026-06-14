/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#212529",
        accent: "#FFC107",
        background: "#FAF9F6", // Premium luxury background color from web
        border: "#DEE2E6",
        gold: "#FFC107",
        "yellow-light": "#FFD54F",
        "gray-dark": "#383C43",
      },
      fontFamily: {
        sans: ["DMSans-Regular", "sans-serif"],
        body: ["DMSans-Regular", "sans-serif"],
        heading: ["PlayfairDisplay-Bold", "serif"],
        display: ["PlayfairDisplay-Bold", "serif"],
        serif: ["PlayfairDisplay-Regular", "serif"],
      },
    },
  },
  plugins: [],
};
