/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
        },
        secondary: '#06b6d4',
        accent: '#f43f5e',
        dark: {
          bg: '#0f172a',
          card: 'rgba(30, 41, 59, 0.7)',
          border: 'rgba(51, 65, 85, 0.5)',
        }
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: theme('colors.slate.700'),
            h1: { fontWeight: '900', letterSpacing: '-0.04em' },
            h2: { fontWeight: '800', letterSpacing: '-0.03em' },
            h3: { fontWeight: '700', letterSpacing: '-0.02em' },
            'p, li': { lineHeight: '1.8' },
          },
        },
        invert: {
          css: {
            color: theme('colors.slate.200'),
            h1: { color: theme('colors.white') },
            h2: { color: theme('colors.white') },
            h3: { color: theme('colors.white') },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
