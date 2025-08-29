/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de cores segura e vibrante para crianças
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Cores específicas para ferramentas de colorir
        coloring: {
          red: '#ff4757',
          orange: '#ff6348',
          yellow: '#ffdd59',
          green: '#2ed573',
          blue: '#3742fa',
          purple: '#a55eea',
          pink: '#ff3838',
          brown: '#8b4513',
          black: '#2c2c54',
          white: '#ffffff',
          gray: '#747d8c',
          lightblue: '#70a1ff',
          lightgreen: '#7bed9f',
          lightpink: '#ff9ff3',
          lightyellow: '#fff200',
          darkblue: '#1e3799'
        }
      },
      fontFamily: {
        'child-friendly': ['Comic Neue', 'Comic Sans MS', 'cursive'],
        'sans': ['Inter', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'child-xs': ['14px', '20px'],
        'child-sm': ['16px', '24px'],
        'child-base': ['18px', '28px'],
        'child-lg': ['22px', '32px'],
        'child-xl': ['26px', '36px'],
        'child-2xl': ['32px', '40px']
      },
      spacing: {
        'child-touch': '44px', // Tamanho mínimo para toque de crianças
        'child-gap': '16px',
        'child-margin': '20px'
      },
      borderRadius: {
        'child': '12px',
        'child-lg': '20px'
      },
      boxShadow: {
        'child': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'child-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }
    },
  },
  plugins: [],
}
