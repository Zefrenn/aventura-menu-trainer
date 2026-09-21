# Aventura Menu Trainer

Staff training app for Aventura (Ann Arbor): cocktails, wines by the glass, food menu, allergens & dietary guide, quiz rounds, and per-person progress.

- `/` — the trainer (staff enter their name; progress saves under it)
- `/manager` — PIN-protected team board
- `api/progress.js` — reads/writes one JSON per trainee in Vercel Blob (`trainees/<slug>.json`)

Env vars: `BLOB_READ_WRITE_TOKEN` (from the Blob store), `MANAGER_PIN`.
