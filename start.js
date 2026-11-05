const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
require('dotenv').config();

const dataDir = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
fs.mkdirSync(dataDir, { recursive: true });

const server = spawn(process.execPath, [
  `--localstorage-file=${path.join(dataDir, 'gramjs-localstorage.json')}`,
  path.join(__dirname, 'server.js'),
], { stdio: 'inherit', env: process.env });

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!server.killed) {
      server.kill(signal);
    }
  });
}

server.on('error', (err) => {
  console.error('Failed to start drive server:', err.message);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  // If terminated gracefully by SIGTERM (exit code 143 or signal SIGTERM),
  // exit cleanly with 0 so the container daemon does not treat it as a crash loop.
  if (signal === 'SIGTERM' || code === 143) {
    process.exit(0);
  }
  process.exit(code ?? 0);
});
