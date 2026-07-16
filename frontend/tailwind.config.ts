import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { 
    extend: { 
      colors: { 
        primary: '#0B0F17', 
        panel: '#161B22', 
        border: '#30363D', 
        critical: '#FF4D4F', 
        high: '#FF7A00', 
        medium: '#FACC15', 
        resolved: '#22C55E', 
        info: '#3B82F6',
        textPrimary: '#F0F6FC',
        textSecondary: '#8B949E'
      }, 
      fontFamily: { 
        sans: ['Inter', 'sans-serif'] 
      } 
    } 
  },
  plugins: [],
} satisfies Config
