const { DatabaseSync } = require('node:sqlite');
const path = require('path');

// Single source of truth for the data directory — also runs the one-time
// migration of legacy root-level files. Required before DatabaseSync opens the
// file below, which is the whole reason it is a separate module.
const { dataDir } = require('./data-dir');
const dbPath = path.join(dataDir, 'metadata.db');

let db;

try {
  db = new DatabaseSync(dbPath);
  // Enable WAL mode for better concurrent performance and crash recovery
  db.exec('PRAGMA journal_mode=WAL');
  db.exec('PRAGMA synchronous=NORMAL');
  db.exec('PRAGMA wal_autocheckpoint=128');
  db.exec('PRAGMA journal_size_limit=1048576');
} catch (err) {
  console.error('Failed to open database:', err);
  process.exit(1);
}

function init() {
  // Create files table
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_key TEXT UNIQUE,
      filename TEXT,
      mime_type TEXT,
      category TEXT,
      total_size INTEGER,
      uploaded_at TEXT,
      telegram_media_id TEXT,
      access_hash TEXT,
      file_reference TEXT,
      telegram_thumb_id TEXT,
      dc_id INTEGER
    );
  `);

  // Run migrations to add missing columns to files table safely
  const columnsToAdd = [
    { name: 'telegram_media_id', type: 'TEXT' },
    { name: 'access_hash', type: 'TEXT' },
    { name: 'file_reference', type: 'TEXT' },
    { name: 'telegram_thumb_id', type: 'TEXT' },
    { name: 'dc_id', type: 'INTEGER' },
    { name: 'content_hash', type: 'TEXT' }
  ];

  columnsToAdd.forEach(col => {
    try {
      db.exec(`ALTER TABLE files ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Migration: Added column ${col.name} to files table.`);
    } catch (e) {
      // Column already exists or table does not exist
    }
  });

  // After the migration loop: an older database has no content_hash column yet.
  db.exec('CREATE INDEX IF NOT EXISTS idx_files_content_hash ON files(content_hash, total_size)');

  // Create activity_logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT,
      action TEXT,
      details TEXT,
      status TEXT
    );
  `);

  console.log('Database schema checked and initialized.');
}

// Initialize tables on startup
init();

module.exports = {
  // Save file metadata
  saveFile(fileKey, filename, mimeType, category, totalSize, telegramMediaId, accessHash, fileReference, telegramThumbId = null, dcId = 4, contentHash = null) {
    const query = db.prepare(`
      INSERT INTO files (file_key, filename, mime_type, category, total_size, uploaded_at, telegram_media_id, access_hash, file_reference, telegram_thumb_id, dc_id, content_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    return query.run(fileKey, filename, mimeType, category, totalSize, now, telegramMediaId, accessHash, fileReference, telegramThumbId, dcId, contentHash);
  },

  // Content identity is independent of filename: two photos renamed differently
  // still collapse into one duplicate group.
  updateFileHash(fileKey, contentHash) {
    try {
      return db.prepare('UPDATE files SET content_hash = ? WHERE file_key = ?').run(contentHash, fileKey);
    } catch (err) {
      console.error('Failed to update content hash:', err.message);
    }
  },

  getDuplicateGroups() {
    const rows = db.prepare(`
      SELECT file_key, filename, total_size, content_hash
      FROM files
      WHERE content_hash IS NOT NULL AND content_hash != ''
      ORDER BY total_size DESC
    `).all();
    const groups = new Map();
    for (const row of rows) {
      const key = row.content_hash + ':' + row.total_size;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    return [...groups.values()].filter(g => g.length > 1)
      .sort((a, b) => (b[0].total_size || 0) - (a[0].total_size || 0));
  },

  // Retrieve files with search and category filters
  getFiles(searchQuery = '', category = 'all') {
    let sql = 'SELECT * FROM files';
    const params = [];
    const conditions = [];

    if (searchQuery) {
      conditions.push('filename LIKE ?');
      params.push(`%${searchQuery}%`);
    }
    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY uploaded_at DESC';

    const query = db.prepare(sql);
    return query.all(...params);
  },

  // Retrieve single file by key
  getFile(fileKey) {
    const query = db.prepare('SELECT * FROM files WHERE file_key = ?');
    return query.get(fileKey);
  },

  getFileByNameAndSize(filename, totalSize) {
    const query = db.prepare('SELECT * FROM files WHERE filename = ? AND total_size = ?');
    return query.get(filename, totalSize);
  },

  getFileByHashAndSize(contentHash, totalSize) {
    if (!contentHash) return null;
    const query = db.prepare('SELECT * FROM files WHERE content_hash = ? AND total_size = ? ORDER BY id ASC');
    return query.get(contentHash, totalSize);
  },

  // Delete file metadata
  deleteFile(fileKey) {
    const query = db.prepare('DELETE FROM files WHERE file_key = ?');
    return query.run(fileKey);
  },

  // Retrieve stats
  getStats() {
    const totalFilesQuery = db.prepare('SELECT COUNT(*) as count FROM files');
    const totalSizeQuery = db.prepare('SELECT SUM(total_size) as total_size FROM files');
    const categoryStatsQuery = db.prepare('SELECT category, COUNT(*) as count, SUM(total_size) as size FROM files GROUP BY category');

    const totalFiles = totalFilesQuery.get().count || 0;
    const totalSize = totalSizeQuery.get().total_size || 0;
    const categories = categoryStatsQuery.all();

    return {
      totalFiles,
      totalSize,
      categories
    };
  },

  // Save an activity log
  logActivity(action, details, status = 'success') {
    try {
      const query = db.prepare(`
        INSERT INTO activity_logs (timestamp, action, details, status)
        VALUES (?, ?, ?, ?)
      `);
      const now = new Date().toISOString();
      query.run(now, action, details, status);
      // Log bersifat diagnostik; batasi agar database persisten tetap kecil.
      db.prepare(`DELETE FROM activity_logs WHERE id NOT IN (
        SELECT id FROM activity_logs ORDER BY id DESC LIMIT 250
      )`).run();
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  },

  // Retrieve latest activity logs
  getLogs(limit = 100) {
    try {
      const query = db.prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ?');
      return query.all(limit);
    } catch (err) {
      console.error('Failed to get activity logs:', err);
      return [];
    }
  },

  // Update file thumbnail ID
  updateFileThumb(fileKey, telegramThumbId) {
    try {
      const query = db.prepare('UPDATE files SET telegram_thumb_id = ? WHERE file_key = ?');
      return query.run(telegramThumbId, fileKey);
    } catch (err) {
      console.error('Failed to update file thumbnail ID:', err);
    }
  },

  // Clear all files and logs from database
  clearAllFiles() {
    try {
      db.prepare('DELETE FROM files').run();
      db.prepare('DELETE FROM activity_logs').run();
      return true;
    } catch (err) {
      console.error('Failed to clear files and logs:', err);
      throw err;
    }
  }
};
