// PM2 — Assets Manager
// Port : 3301 (plage Mathias : 3300-3399)

module.exports = {
  apps: [
    {
      name: 'assets-manager',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3301',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3301,
      },
    },
  ],
}
