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

Thumbnail derivatives have their own cache budget (`THUMB_MAX_BYTES`, `THUMB_MAX_AGE_MS`) and are warmed in the background during sync, so they are not evicted by large originals. On hosts with less than 512 MB RAM, set `DISABLE_SHARP=1`; the native-variant path keeps working.

Static shell files are precompressed in memory with Brotli or gzip, and the app shell plus image tiers are cached by a service worker. File lists use an ETag so reloads reuse the local copy.

## Commands

```
npm start          # start server
npm test           # unit tests
npm run build:css  # rebuild public/css/nexus.css from src/
```
