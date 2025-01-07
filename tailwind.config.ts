import {nextui} from '@nextui-org/theme';
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        moveRight: {
          "0%": {
            marginLeft: "0",
          },
          "100%": {
            marginLeft: "6px",
          },
        },
      },
      animation: {
        moveRight: "moveRight 0.3s ease-in-out",
      },
      transitionProperty: {
        'margin': 'margin-left',  // Apply transition to margin-left
      },
      colors: {
        background: {
          DEFAULT: 'var(--background-hex)',
        },
        foreground: 'rgb(var(--foreground-rgb))',
        transparent: 'transparent',
        white: "#FFFFFF",
        black: "#000000",
        blue: {
          50: "#e6f1fe",
          100: "#cce3fd",
          200: "#99c7fb",
          300: "#66aaf9",
          400: "#338ef7",
          500: "#006FEE",
          600: "#005bc4",
          700: "#004493",
          800: "#002e62",
          900: "#001731",
        },
      },
      backgroundColor: {
        'grade-a': 'var(--color-dark-green)',
        'grade-b': 'var(--color-light-green)',
        'grade-c': 'var(--color-yellow)',
        'grade-d': 'var(--color-pink)',
        'grade-f': 'var(--color-red)',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [nextui()],
};
export default config;
