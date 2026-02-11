/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/tw/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins-Regular"],
        "poppins-medium": ["Poppins-Medium"],
        "poppins-semibold": ["Poppins-SemiBold"],
        "poppins-bold": ["Poppins-Bold"],
      },
        colors: {
            primary: "#FF6600",
            accent: "#8B8D98",
            background: "#FFFFFF",
            backgroundMuted: "#F8FAFC",

            textPrimary: "#0F172A",
            textSecondary: "#475569",
            textMuted: "#94A3B8",

            success: "#22C55E",
            danger: "#EF4444",
        },
    },
  },
  plugins: [],
};

