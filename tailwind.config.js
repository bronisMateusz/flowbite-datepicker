module.exports = {
  content: ["./demo/**/*.html", "./js/**/*.js", "./docs/**/*.*"],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {},
  },
  safelist: [
    {
      pattern: /^(bg|stroke|fill)-[a-z]+-\d+$/,
      variants: ['dark'],
    },
  ],
  variants: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin')
  ],
}
