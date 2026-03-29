/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      colors: {
        bg: '#181411',
        'bg-raised': '#1E1A16',
        'bg-surface': '#231F1A',
        'bg-elevated': '#28231D',
        border: '#2A2521',
        'border-soft': '#322C26',
        beige: '#E4D4BC',
        'beige-mid': '#BFA98E',
        'beige-dim': '#8C7A65',
        'beige-ghost': '#4A4035',
        'off-white': '#F2EDE6',
        muted: '#5C5247',
        green: '#7AA882',
        'green-dim': '#2D4A32',
        red: '#B06060',
        'red-dim': '#3D1F1F',
        amber: '#C4A35A',
        'amber-dim': '#3A2D10',
        blue: '#6E90B0',
        'blue-dim': '#1A2A38',
      },
    },
  },
  plugins: [],
};
