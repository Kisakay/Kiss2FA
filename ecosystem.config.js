module.exports = {
    apps: [
      {
        name: 'xVault',
        script: './server/server.js',
        env: {
          NODE_ENV: 'production',
        }
      },
    ],
  };
  