const fs = require('fs');
const path = require('path');

/** Evict cache files by age and least-recently-used order across directories. */
function pruneCacheDirectories({ directories, maxBytes, maxAgeMs, now = Date.now(), inFlightPaths = new Set() }) {
  const entries = [];
  let totalBytes = 0;

  for (const directory of directories) {
    let names;
    try {
      names = fs.readdirSync(directory);
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      throw err;
    }

    for (const name of names) {
      const filePath = path.join(directory, name);
      if (name.endsWith('.partial') || inFlightPaths.has(filePath)) continue;
      try {
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) continue;
        entries.push({ filePath, size: stat.size, accessedAt: stat.atimeMs });
        totalBytes += stat.size;
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    }
  }

  entries.sort((a, b) => a.accessedAt - b.accessedAt);
  let removedFiles = 0;
  let removedBytes = 0;
  for (const entry of entries) {
    const expired = maxAgeMs <= 0 || now - entry.accessedAt >= maxAgeMs;
    if (!expired && totalBytes <= maxBytes) continue;
    try {
      fs.unlinkSync(entry.filePath);
      totalBytes -= entry.size;
      removedFiles++;
      removedBytes += entry.size;
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
  return { removedFiles, removedBytes, remainingBytes: totalBytes };
}

module.exports = { pruneCacheDirectories };
