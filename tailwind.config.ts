import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ruth': {
          'cyan': '#06b6d4',
          'green': '#10b981',
          'dark': '#0a0a0f',
          'card': '#111118',
          'border': '#1e1e2e',
        }
      },
      backgroundImage: {
        'gradient-ruth': 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
      },
    },
  },
  plugins: [],
}
export default config
