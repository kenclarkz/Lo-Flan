import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F6EFE3',
          dark: '#ECE0CB',
          deep: '#E0D1B8',
        },
        caramel: {
          DEFAULT: '#C8894B',
          light: '#D9A36A',
          dark: '#A96A2F',
        },
        gold: {
          DEFAULT: '#C9A96A',
          light: '#E3C88C',
          dark: '#A8873F',
        },
        cocoa: {
          DEFAULT: '#4A3224',
          dark: '#3E2A1E',
        },
        espresso: {
          DEFAULT: '#1B120C',
          dark: '#120C08',
        },
        blush: '#E9C3B0',
        sage: '#BFD8C6',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.28em',
        widest3: '0.4em',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'spin-slow': 'spin 24s linear infinite',
        shimmer: 'shimmer 3.5s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
}

export default config
