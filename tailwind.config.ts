import type { Config } from "tailwindcss";

function cssVar(name: string) {
  return `rgb(var(--color-${name}) / <alpha-value>)`;
}

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: {
          50:  cssVar('ocean-50'),
          100: cssVar('ocean-100'),
          200: cssVar('ocean-200'),
          300: cssVar('ocean-300'),
          400: cssVar('ocean-400'),
          500: cssVar('ocean-500'),
          600: cssVar('ocean-600'),
          700: cssVar('ocean-700'),
          800: cssVar('ocean-800'),
          900: cssVar('ocean-900'),
        },
        sand: {
          50:  cssVar('sand-50'),
          100: cssVar('sand-100'),
          200: cssVar('sand-200'),
          300: cssVar('sand-300'),
          400: cssVar('sand-400'),
          500: cssVar('sand-500'),
          600: cssVar('sand-600'),
          700: cssVar('sand-700'),
          800: cssVar('sand-800'),
          900: cssVar('sand-900'),
        },
        coral: {
          50:  cssVar('coral-50'),
          400: cssVar('coral-400'),
          500: cssVar('coral-500'),
          600: cssVar('coral-600'),
          700: cssVar('coral-700'),
        },
        seafoam: {
          50:  cssVar('seafoam-50'),
          300: cssVar('seafoam-300'),
          400: cssVar('seafoam-400'),
          500: cssVar('seafoam-500'),
          800: cssVar('seafoam-800'),
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
