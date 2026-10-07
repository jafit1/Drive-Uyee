const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pruneCacheDirectories } = require('../cache-policy');

function makeCache() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'drive-cache-test-'));
  const cache = path.join(root, 'cache');
  const thumbs = path.join(root, 'thumbs');
  fs.mkdirSync(cache);
  fs.mkdirSync(thumbs);
  return { root, cache, thumbs };
}

test('cache eviction shares its size budget and removes least-recently-accessed files first', (t) => {
  const dirs = makeCache();
  t.after(() => fs.rmSync(dirs.root, { recursive: true, force: true }));
  const oldFile = path.join(dirs.cache, 'old.bin');
  const newFile = path.join(dirs.thumbs, 'new.webp');
  fs.writeFileSync(oldFile, Buffer.alloc(6));
  fs.writeFileSync(newFile, Buffer.alloc(6));
  const now = Date.now();
  fs.utimesSync(oldFile, new Date(now - 20_000), new Date(now));
  fs.utimesSync(newFile, new Date(now - 1_000), new Date(now));

  const result = pruneCacheDirectories({ directories: [dirs.cache, dirs.thumbs], maxBytes: 6, maxAgeMs: 60_000, now });
  assert.equal(fs.existsSync(oldFile), false);
  assert.equal(fs.existsSync(newFile), true);
  assert.deepEqual(result, { removedFiles: 1, removedBytes: 6, remainingBytes: 6 });
});

test('cache eviction removes expired files but protects in-flight and partial files', (t) => {
  const dirs = makeCache();
  t.after(() => fs.rmSync(dirs.root, { recursive: true, force: true }));
  const expiredFile = path.join(dirs.cache, 'expired.bin');
  const activeFile = path.join(dirs.thumbs, 'active.jpg');
  const partialFile = path.join(dirs.cache, 'download.partial');
  for (const filePath of [expiredFile, activeFile, partialFile]) fs.writeFileSync(filePath, 'data');
  const now = Date.now();
  for (const filePath of [expiredFile, activeFile, partialFile]) {
    fs.utimesSync(filePath, new Date(now - 120_000), new Date(now));
  }

  pruneCacheDirectories({
    directories: [dirs.cache, dirs.thumbs],
    maxBytes: 1024,
    maxAgeMs: 60_000,
    now,
    inFlightPaths: new Set([activeFile]),
  });

  assert.equal(fs.existsSync(expiredFile), false);
  assert.equal(fs.existsSync(activeFile), true);
  assert.equal(fs.existsSync(partialFile), true);
});
