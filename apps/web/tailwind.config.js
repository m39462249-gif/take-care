/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Muted, desaturated clinical and care palette (Zero neon, zero candy tones)
        calm: {
          50: '#F4F5F6',
          100: '#E8EAEB',
          200: '#D5D8DA',
          300: '#B6BCC0',
          400: '#8E979D',
          500: '#647078',
          600: '#4A555D',
          700: '#364047',
          800: '#262E34',
          900: '#171C20',
        },
        muted: {
          slate: '#334155',
          steel: '#475569',
          sage: '#4B6354',
          olive: '#556550',
          terracotta: '#7D4E4E',
          ochre: '#7A6843',
          sand: '#E7E5E4',
          ash: '#71717A',
        },
        refuge: {
          dark: '#182026',
          card: '#222C35',
          accent: '#475e53',
        },
        accent: {
          subtle: '#6B5B95',
          soft: '#7D9D6A',
          focus: '#8EB59E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'patient-base': '1.25rem', // 20px
        'patient-lg': '1.5rem',    // 24px
        'patient-xl': '1.875rem',  // 30px
        'patient-2xl': '2.25rem',  // 36px
        'patient-giant': '3rem',   // 48px
      },
      transitionDuration: {
        'accessible': '200ms',
      },
      transitionTimingFunction: {
        organic: 'cubic-bezier(0.34, 1.56, 0.64, 1.06)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1.06)',
      },
      boxShadow: {
        organic: '0 4px 20px -4px rgba(0, 0, 0, 0.08)',
        lift: '0 8px 25px -5px rgba(0, 0, 0, 0.1)',
        card: '0 2px 8px -2px rgba(40, 50, 45, 0.04)',
      },
    },
  },
  plugins: [],
}
