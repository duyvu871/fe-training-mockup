module.exports = {
  apps: [
    {
      name: 'fe-training-mockup',
      script: 'npm',
      args: 'start',
      watch: true,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    }
  ]
};