import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { 
    extend: { 
      colors: { 
        primary: '#000000', 
        secondaryBg: '#111111',
        panel: '#181818', 
        border: '#2A2A2A', 
        hoverBg: '#222222',
        critical: '#FFFFFF', 
        high: '#FFFFFF', 
        medium: '#FFFFFF', 
        resolved: '#FFFFFF', 
        info: '#FFFFFF',
        textPrimary: '#FFFFFF',
        textSecondary: '#BDBDBD'
      }, 
      fontFamily: { 
        sans: ['Inter', 'sans-serif'] 
      } 
    } 
  },
  plugins: [],
} satisfies Config
