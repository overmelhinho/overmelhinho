// vite-start.js
const { spawn } = require("child_process");
spawn("npm", ["run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"], {
  stdio: "inherit",
  shell: true,
});
