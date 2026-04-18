import type { Config } from 'tailwindcss';

/** Shared Tailwind preset so apps and packages get consistent design tokens. */
const preset: Partial<Config> = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans, ui-sans-serif, system-ui)'],
        mono: ['var(--font-mono, ui-monospace, SFMono-Regular)'],
      },
      colors: {
        bleucent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
};

export default preset;
