/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#EEF2F6",
        brand: {
          50: "#FFF1F3",
          100: "#FFE4E8",
          200: "#FECDD6",
          300: "#FDA4B4",
          400: "#FB7185",
          500: "#F43F5E",
          600: "#E11D48", // Primary Crimson from design
          700: "#BE123C",
          800: "#9F1239",
          900: "#881337",
          primary: "#E11D48",
          accent: "#FF3358",
        },
        dark: {
          800: "#1E293B",
          900: "#0F172A",
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 2px 10px -2px rgba(15, 23, 42, 0.05), 0 1px 3px -1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'glow-red': '0 4px 14px 0 rgba(225, 29, 72, 0.35)',
      }
    },
  },
  plugins: [],
}
