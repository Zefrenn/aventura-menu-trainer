# Aventura Menu Trainer

Staff training app for Aventura (Ann Arbor): cocktails, wines by the glass, food menu, allergens & dietary guide, quiz rounds, and per-person progress.

- `/` — the trainer (staff enter their name; progress saves under it)
- `/manager` — PIN-protected team board
- `/manager` → **Photos** — add/replace/confirm/hide dish & drink photos from your phone
- `api/photo.js` — photo index + images in Vercel Blob (`photos/<id>.webp|jpg`, `photos/index.json`)
- `api/progress.js` — reads/writes one JSON per trainee in Vercel Blob (`trainees/<slug>.json`)

Env vars: `BLOB_READ_WRITE_TOKEN` (from the Blob store), `MANAGER_PIN`.

## v4.0 (Sep 2026) — brand redesign + swipe deck

- Restyled to the Aventura brand guidelines: Cool Gray `#55565A` + Dusty Rose `#E3B7A5`, Neutra-style display (Josefin Sans stand-in) + EB Garamond body, real logo / rose / AvenChurros marks in `/img`.
- Card deck is now swipeable (Tinder / Reigns style). Default **Swipe rates**: right = Got it, left = Learning. Toggle to **Swipe browses**: left = next, right = back. Arrow keys / Enter work on desktop.
- Section picker is a bottom sheet with card counts; new sections: Happy Hour, Vino de Postre, Menu Basics.
- Data reconciled to the printed menus: Dinner 9·11·26, Sweet Tapas 6·24·26, Happy Hour 8·1·26 (`js/drinks.js`, `js/guide.js`, `js/food.js`, `js/diet.js`, `js/allergy.js`). Diet codes follow the printed key (V = vegetarian, VG = vegan).
- Menu date stamps live in the header; update them when a new menu prints.

## v4.1 (Sep 2026) — manager board UX

- Manager board restyled to the same brand tokens as the trainer (pill nav with counts, paper cards, rose accents); script moved to `js/manager.js`.
- Every dropdown has a leading icon and a chevron so it reads as a menu; active filters highlight in rose; search fields have a clear button.
- **Team**: filter by activity and mastery level (80%+, 40–79%, under 40%, weak cards); result count; sortable headers with sort-direction icons; tap any row to expand a per-person breakdown (subject bars, quiz, started / last active, all weak cards, one-tap copy). Expand / collapse all.
- **Photos**: search, status + category filters, items grouped by menu category in collapsible groups with live-photo counts; KPI tiles tap to filter; icons on every action; toast messages instead of an inline status line.
