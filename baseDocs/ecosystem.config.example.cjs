module.exports = {
  apps: [
    {
      name: 'Assets Manager',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '500M',
      time: true,
      merge_logs: true,
      out_file: './logs/out.log',
      error_file: './logs/err.log',

      // Next.js
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3301',
      env: { NODE_ENV: 'production' },
    },
  ],
}