# Drive Uyee

Cloud drive backed by a private Telegram group. Uses an MTProto user session, so uploads are not capped by the Bot API's 50 MB limit.

## Deploy

Node >= 22.5. `npm install` then `npm start`. Set these environment variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `DRIVE_PASSWORD` | yes | Password for the drive UI |
| `DRIVE_SECRET` | yes | Stable cookie-signing secret |
| `DATA_DIR` | no | Persistent directory for `config.json` and `metadata.db` |
| `SERVER_PORT` | no | Defaults to `3000` |

See `.env.example` for the caching and image pipeline tunables.

## Image pipeline

The grid loads only small thumbnails (`/api/thumb/:key`). Opening an image loads `/api/medium/:key` (1280px WebP when Sharp is available, otherwise Telegram's largest pre-rendered variant). The full original is fetched only for the photo currently open, after a short idle delay or on clicking "Muat versi penuh" (`/api/full/:key`).

Thumbnail derivatives have their own cache budget (`THUMB_MAX_BYTES`, `THUMB_MAX_AGE_MS`) and are warmed in the background during sync, so they are not evicted by large originals. `THUMB_AUTO_BYTES` controls how large an original Sharp may decode for a thumbnail — leave it at 64 MB so phone photos (10–15 MB) still get a real preview instead of a generic icon. On hosts with less than 512 MB RAM, set `DISABLE_SHARP=1`; the native-variant path keeps working.

Image URLs are keyed by the immutable `file_key`, so they are served with `Cache-Control: immutable`. Combined with the service worker, a revisit costs no thumbnail requests at all. Static shell files are precompressed in memory with Brotli or gzip, and file lists use an ETag so reloads reuse the local copy.

### Backfilling thumbnails for files imported before the WebP path existed

Existing rows only get a thumbnail when their URL is requested. To generate them all ahead of time, log in once and walk the list with bounded concurrency:

```sh
curl -s -H 'content-type: application/json' \
  -d '{"password":"YOUR_DRIVE_PASSWORD"}' \
  -c /tmp/drive.cookie http://127.0.0.1:3000/api/auth/login

curl -s -b /tmp/drive.cookie http://127.0.0.1:3000/api/files \
| python3 -c 'import json,sys; [print(f["file_key"]) for f in json.load(sys.stdin)]' \
| xargs -P 4 -I{} curl -s -b /tmp/drive.cookie -o /dev/null \
    http://127.0.0.1:3000/api/thumb/{}
```

The endpoint is idempotent: files that already have a cached thumbnail return immediately.

## Uploads

The browser keeps the upload queue in IndexedDB, including the `File` blobs. A hard refresh restores pending and in-flight items and resumes them automatically; minimizing the panel is persisted in `localStorage`. Three files upload concurrently (`UPLOAD_CONCURRENCY` in `app.js`), and each file uses `TRANSFER_WORKERS` Telegram workers. The panel header always shows completed/total and an aggregate percentage, even while collapsed.

## Duplicates and bulk actions

Uploads store a streaming SHA-256 of the file bytes, so a renamed copy is recognised as a duplicate and skipped before it reaches Telegram. Synced files get the same hash lazily when their original is first cached; `/api/duplicates/scan` fills hashes for already-cached originals in bounded batches. The "Duplikat" button filters the grid to every file in a same-content group.

Selection is available directly on each card. The "Pilih" button enters bulk mode, and bulk download streams one ZIP (`/api/download/zip`) instead of firing several anchor clicks that browsers block.

## Design system

`DESIGN.md` is the visual contract for the project: colour tokens, type scale, spacing, responsive grid, component rules, motion, accessibility and anti-patterns. It is served publicly at `/design.md`, with a live, mobile-first reference page at `/design`.

## Commands

```
npm start          # start server
npm test           # unit tests
npm run build:css  # rebuild public/css/nexus.css from src/
```
