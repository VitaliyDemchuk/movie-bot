module.exports = {
  outputDir: '../client',
  indexPath: 'index.html',
  devServer: {
    proxy: {
      '^/api': {
        target: 'http://localhost:3000',
      },
    },
  },
};
