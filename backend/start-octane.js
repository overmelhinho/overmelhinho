module.exports = {
  apps: [
    {
      name: 'backend-laravel',
      script: 'artisan',
      args: 'octane:start --host=0.0.0.0 --port=8000',
      interpreter: 'php',
      watch: false
    }
  ]
};
