import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f5f7ff",
          100: "#eaeefe",
          500: "#4f6bff",
          600: "#3a55ec",
          700: "#2c41c2",
        },
        accent: {
          50: "#f3f0ff",
          100: "#e9e4ff",
          200: "#d5ccff",
          300: "#b7a8ff",
          400: "#8b7fe8",
          500: "#7c6fe0",
          600: "#6a5cd6",
          700: "#5a4cc4",
        },
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(15, 23, 42, 0.08)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 4px 12px 0 rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
    },
  },
  plugins: [],
};

export default config;
