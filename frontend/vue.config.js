module.exports = {
  outputDir: '../client',
  indexPath: 'index.html',
  devServer: {
    proxy: {
      '^/api': {
        target: process.env.BACKEND_ENDPOINT || 'http://localhost:3000',
      },
    },
  },
};
