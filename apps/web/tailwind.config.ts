import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: 'var(--color-primary-light)',
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
        },
        surface: 'var(--color-surface)',
        neutral: '#6b7280',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        alert: '#ef4444',
        success: 'var(--color-success)',
        ready: '#22c55e',
        info: 'var(--color-info)',
        kds: {
          bg: '#1A1A1A',
          surface: '#262626',
          text: '#FFFFFF',
          muted: '#9CA3AF',
          normal: '#22C55E',
          moderate: '#F59E0B',
          elevated: '#EA580C',
          critical: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        serif: ['var(--font-playfair)'],
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '12': 'var(--space-12)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        normal: 'var(--transition-normal)',
        slow: 'var(--transition-slow)',
      }
    },
  },
  plugins: [],
}

export default config
