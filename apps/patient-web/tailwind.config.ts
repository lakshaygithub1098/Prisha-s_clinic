import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forest: "#075B46",
        sage: "#A9C9B5",
        mint: "#E6F0E9",
        ivory: "#F8F8F2",
        charcoal: "#263A32",
      },
      fontFamily: { sans: ["Arial", "Helvetica", "sans-serif"] },
      boxShadow: { card: "0 10px 34px rgba(26, 74, 55, .08)" },
    },
  },
  plugins: [],
};

export default config;
