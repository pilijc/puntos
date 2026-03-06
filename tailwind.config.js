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
        // Light Theme
        primary: "#FF6600",
        accent: "#8B8D98",
        background: "#FFFEFC",
        backgroundMuted: "#F3F4F6",

        textPrimary: "#0F172A",
        textSecondary: "#475569",
        textMuted: "#94A3B8",

        success: "#22C55E",
        danger: "#EF4444",

        // Dark Theme
        darkBackground: "#171717",
        darkBackgroundMuted: "#262626",
        darkBackgroundCard: "#404040",

        darkTextPrimary: "#FFFFFF",
        darkTextSecondary: "#A3A3A3",
        darkTextMuted: "#737373",
        darkTextSoft: "#D4D4D4",
        darkTextSoftest: "#E5E5E5",

        darkBorder: "#404040",

        darkPrimaryText: "#FB923C",
        darkPrimarySecondary: "#F97316",
        darkPrimaryBgMuted: "#431407",
        darkPrimaryBorder: "#9A3412",
      },
    },
  },
  plugins: [],
};

