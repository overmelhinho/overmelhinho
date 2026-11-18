module.exports = {
  apps: [
    {
      name: 'laravel-octane',
      script: 'artisan',
      args: 'octane:start --server=swoole --host=0.0.0.0 --port=8000',
      interpreter: 'php',
      interpreter_args: '-d upload_max_filesize=50M -d post_max_size=50M -d memory_limit=512M',
      watch: false,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        APP_ENV: 'production',
        APP_DEBUG: false,
        LOG_CHANNEL: 'stderr',
      },
    },
  ],
};
