module.exports = {
  content: [
    './*.html',
    './blog/**/*.html',
    './assets/js/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        newsprint: {
          base: '#d2c7b3',
          dark: '#bdaf96',
          ink: '#1c1b19',
          accent: '#6b1111'
        }
      },
      fontFamily: {
        masthead: ['UnifrakturMaguntia', 'serif'],
        headline: ['Playfair Display', 'serif'],
        body: ['Old Standard TT', 'serif'],
        typewriter: ['Courier New', 'Courier', 'monospace']
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ]
};
