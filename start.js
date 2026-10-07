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
    if (!server.killed) server.kill(signal);
  });
}

server.on('error', (err) => {
  console.error('Failed to start drive server:', err.message);
  process.exitCode = 1;
});

server.on('exit', (code, signal) => {
  process.exitCode = signal ? 1 : (code ?? 1);
});
