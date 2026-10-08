# Aventura Menu Trainer

Staff training app for Aventura (Ann Arbor): cocktails, wines by the glass, food menu, allergens & dietary guide, Learn mode, manager-set quizzes, and per-person progress.

- `/` — the trainer (staff enter a name, initials or nickname; progress saves under it)
- `/manager` — PIN-protected team board
- `/manager` → **Quizzes** — create, edit, schedule, close quizzes; see results
- `/manager` → **Photos** — add/replace/confirm/hide dish & drink photos from your phone
- `api/photo.js` — photo index + images in Vercel Blob (`photos/<id>.webp|jpg`, `photos/index.json`)
- `api/progress.js` — reads/writes one JSON per trainee in Vercel Blob (`trainees/<slug>.json`)
- `api/quizzes.js` — manager quizzes in Vercel Blob (`config/quizzes.json`); staff only receive live ones
- `/manager` → **Menu** — edit every drink, dish, wine, guide card, allergen card, hint, diet flag, tape color and the menu dates; publish to staff
- `api/content.js` — published menu edits in Vercel Blob (`config/content.json`, every version in `config/content-history/`, log in `config/content-log.json`)

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

## v4.2 (Sep 2026) — dark mode, quiz help, pronunciation

- **Dark mode**: moon / sun button top-right on the trainer and the manager board. Follows the phone's setting until someone taps it, then remembers their choice (`js/theme.js`). Drawings are recolored for dark backgrounds.
- **Quiz hints**: *Pista · Hint* under each question gives a nudge (glass use, ingredients, where an allergen hides, first letter, price range…), never the answer. Price and batch-color hints also cross out one wrong option.
- **Photos in the quiz**: when an item has a live photo it's shown with the question. For glass and garnish questions the photo appears after answering so it doesn't give the answer away.
- **No sé · I don't know**: reveals the answer, counts as a miss, and adds it to the retry list.
- **Skip**: the Next button reads *Skip* until you answer. Skipped questions are listed on the results screen and included in the retry.
- **Retry missed** now re-asks the exact questions you missed or skipped (before, it asked a new random question about the same items). The round in progress is saved per trainee, so a reload or the phone closing the tab doesn't lose it.
- **Pronunciation**: *Escuchar · Hear it* on every drink, dish and wine uses the phone's built-in Spanish voice (`js/speak.js`). Tap twice for slow. No audio files.

## v4.3 (Sep 2026) — hints written for new staff

- Every quiz hint is now written against the Aventura menu for someone with no restaurant background (`js/coach.js`): Spanish word clues for dish names ("pulpo" = octopus), plain-English glass guides, garnish and build nudges, batch-tape memory tricks, allergen "triggers" pulled from each dish's ingredients (baguette → gluten, aioli → egg), where each allergen hides on our menu, and a written hint for every guide and allergen card.
- After each question, a **Remember it** line gives the one sentence worth keeping about that dish, drink or wine. The full details sit underneath in small print.
- Hints never state the answer: a check runs every question type against every card (632 questions, 0 leaks).

## v4.3.1 (Sep 2026)

- Quiz rounds are 10 questions (was 30) — short enough for a break.
- "Which dish / drink is this?" picture questions only use real photos. Items without a live photo are never asked from their drawing; once a manager uploads and confirms a photo in Manager → Photos, that item starts showing up in picture questions automatically.

## v4.3.2 (Sep 2026) — plate photos

- Live photos for 10 more dishes: Tortilla Española, Sardinas, Tarta de Queso, Flor de Alcachofa, Gambas, Pepa en Adobo, Marinera Fideuà, Primavera, Pimientos de Padrón, Buñuelos de Bacalao. They ship as static files (`img/p-<photo id>.webp`) registered in `PHOTO_SEED` (`js/photos.js`), so they don't add weight to the page until shown.
- With the 5 already uploaded in Manager → Photos (Quesos y Charcutería, Torrijas, Tarta de Santiago, AvenChurros, Goxua), 15 of 42 dishes now have photos and appear in picture questions. A photo uploaded in Manager → Photos still wins over these, so any of them can be replaced or hidden from the board.

## v5.0 (Oct 2026) — Learn mode, manager quizzes, nicknames

Goal: make the app feel low-pressure for brand-new staff, so it helps retention instead of scaring people off.

- **Learn replaces Quiz** in the main nav (Cards · Learn · Progress · Key). Modeled on Quizlet Learn: rounds of up to 7 cards from the chosen section; each card goes *To learn → Learning* (right once) → *Mastered* (right again, on a different question, in a later round). Brand-new cards are shown first ("New · have a look first") before any question. A miss comes back two questions later in the same round. No scores or percentages. A checkpoint after each round shows what moved. Hints and *No sé* still work. Rounds save per trainee, so a closed tab picks up where it left off. When a whole section is mastered: *Review these* or pick another section.
- **Quizzes only when a manager sets one.** Manager → **Quizzes**: name, message to staff, sections (multi-select), number of questions, hints on/off, your own written multiple-choice questions, draft/live, optional start and end dates. Close, reopen, edit or delete anytime. Results per quiz: who took it, best score, tries, what they missed, most-missed, who hasn't taken it, copy results.
- Staff see a soft **"Quiz from your manager · whenever you're ready"** button only while a quiz is live. No timer, retakes allowed, the board shows their best score. *Practice missed* afterwards doesn't change the score.
- **Sign-in takes a name, initials or a nickname.** Casing is kept as typed (all-lowercase initials like "mr" become "MR"). If someone new types a name that already has saved progress, the app asks first so two "Sam"s don't share progress. The gate notes that the manager sees the name on the board.
- Mastery: Learn level (`lv` per card) now drives mastered / learning. Swiping *Got it* in Cards still marks a card mastered. Old progress carries over.
- Board: the **Quiz** column / KPI now mean manager-quiz results (best attempt of each). Each person's detail shows their quiz scores and Learn activity. Staff who haven't opened v5 yet still show their old practice-round accuracy there until they next open the app.
- Shared card / section list moved to `js/sections.js` (used by both pages). Manager quiz code is in `js/manager-quizzes.js`.

## v5.1 (Oct 2026) — edit the menu from the browser

Goal: any manager can keep the trainer current without touching code, and the restaurant can take it over.

- **Manager → Menu** tab. Pick Drinks · Food · Wines · Guide · Allergens · Settings, search or filter by section, tap any item to edit it, or add one. Works on a phone.
- Every field staff see is editable: names, prices, descriptions, builds, glass, garnish, batch tape, ingredients, allergens, mods, utensils, diet flags (Yes / With a mod), diet notes, wine details, guide and allergen Q&A. Optional **Hints & "Remember it"** per item (blank = the app writes its own hint).
- New sections: pick **+ New section…** on a drink, dish or guide card; it shows up in the trainer's section picker and in quiz setup.
- **Settings**: the menu-date line under the logo, batch tape colors (add / recolor / remove unused), "where allergens hide" hints, diet explanations.
- **Draft, then publish.** Edits save as a draft on that device (survive a reload) with a count of unpublished changes; **Publish** asks for a name and optional note. Phones load the new menu next time the app opens, and an open trainer shows "Menu updated · tap to load it" when the phone comes back to it.
- **Renaming is safe**: a renamed item keeps everyone's progress, its photo and its drawing (old names are stored in `_was`). New drinks can borrow a glass drawing.
- **Two managers at once**: if someone published after you started, you choose "Publish mine anyway" or "Use theirs".
- **Versions & backup**: open any earlier published version (or the original built-in menu) as a draft and republish it; download / load a JSON backup.

How it works: the data files (`js/drinks.js`, `food.js`, `guide.js`, `allergy.js`, `diet.js`, `coach.js`) are still the built-in menu. `js/content.js` fetches published edits and swaps them into those same arrays before the app starts (`index.html` / `manager.html` load the app scripts through it via `data-then`). Only sections that differ from the built-in files are published, so a section nobody edited keeps following the code. **Once a section is published from the board, the board is the source of truth for it**: code edits to that section's file won't show until someone opens "Original built-in menu" in Versions and republishes it.

Handing it over: a new owner needs the manager PIN (Vercel env `MANAGER_PIN`) and nothing else to run the menu day to day. To move hosting, they need the GitHub repo, a Vercel project with a Blob store (`BLOB_READ_WRITE_TOKEN`) and `MANAGER_PIN`; load a downloaded backup in Manager → Menu → Load a backup and publish.
