module.exports = {
  apps: [
    {
      name: 'mokultur-web',
      script: 'build/index.js',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '1200M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        ORIGIN: 'https://mokultur.id',
      },
    },
  ],
};
