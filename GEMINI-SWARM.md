# Gemini Swarm di Botkeep

Drive-Uyee sekarang memiliki endpoint agen kolaboratif berbasis Gemini API resmi.

## Environment variables Botkeep

Isi minimal:

```text
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-3.1-flash-lite-preview
```

Satu key dipakai oleh Supervisor, Researcher, Coder, dan Reviewer. Jika ingin memisahkan akun/proyek Google, isi key khusus:

```text
GEMINI_API_KEY_SUPERVISOR=AIza...
GEMINI_API_KEY_RESEARCHER=AIza...
GEMINI_API_KEY_CODER=AIza...
GEMINI_API_KEY_REVIEWER=AIza...
```

Model tiap agen dapat ditimpa dengan `GEMINI_MODEL_SUPERVISOR`, dan seterusnya.

## Endpoint

- `GET /api/agents/status` — status key dan model, tidak mengungkap key.
- `POST /api/agents/run` — membutuhkan sesi Drive, body `{ "task": "..." }`.

Alur: Supervisor membuat brief JSON, tiga agen bekerja paralel, lalu Supervisor menyatukan hasil. Key hanya berada di environment server dan tidak dikirim ke browser.

Model Gemini web-cookie tidak dipakai. Login Google dilakukan melalui API key dari Google AI Studio, sehingga deployment tidak bergantung pada cookie browser atau akun Muse.
