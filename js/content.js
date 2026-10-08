// ---- Live content ----
// Managers edit drinks, food, wines, guide cards, allergen cards, hints and settings in /manager → Menu.
// Published edits live in Vercel Blob (api/content.js). This file:
//   1. packs the built-in data files (drinks.js, food.js, guide.js, allergy.js, diet.js, coach.js) into one shape,
//   2. fetches the live edits and applies them in place (same arrays / objects the app already uses),
//   3. then loads the scripts listed in data-then, in order, so the app starts on the live menu.
// A section the managers never touched keeps following the built-in files.
// Needs: drinks, guide, food, diet, allergy, sections, photos, coach loaded first.
const AVContent = (function () {
  const CACHE = "av_content_cache";
  const clone = o => JSON.parse(JSON.stringify(o));
  const MENUS = "Dinner 9·11·26 · Sweet tapas 6·24·26 · Happy hour 8·1·26";
  const strip = r => { const o = {}; Object.keys(r).forEach(k => { if (k[0] !== "_") o[k] = r[k]; }); return o; };
  const fill = (arr, list) => { arr.splice(0, arr.length, ...list); return arr; };
  const reset = (obj, src) => { Object.keys(obj).forEach(k => delete obj[k]); Object.assign(obj, src); return obj; };

  // ---- 1. built-in content, in the editor's shape (hints + diet travel with each item) ----
  const builtin = {
    drinks: DRINKS.map(d => ({ ...clone(d), _coach: clone(COACH.drink[d.name] || {}) })),
    food: FOOD.map(f => ({ ...clone(f), _diet: clone(DIET[f.name] || []), _dnote: DIETNOTE[f.name] || "", _coach: clone(COACH.food[f.name] || {}) })),
    wines: WINES.map(w => ({ ...clone(w), _coach: clone(COACH.wine[w.name] || {}) })),
    facts: FACTS.map(f => ({ ...clone(f), _coach: COACH.fact[f.q] || "" })),
    allergy: ALLERGY_FACTS.map(f => ({ ...clone(f), _coach: COACH.fact[f.q] || "" })),
    settings: {
      menus: MENUS,
      tape: clone(TAPE),
      dietNotes: clone(COACH.diet),
      hides: Object.fromEntries(COACH.hides.map(h => [h[1], h[2]])),
    },
  };
  const BUILTIN_HIDES = COACH.hides.map(h => h[2]);
  const BUILTIN_ALIAS = clone(PHOTO_ALIAS);
  const BUILTIN_ILLUS = typeof ILLUS !== "undefined" ? { ...ILLUS } : null;  // drink drawings, keyed by drink name
  const RENAMES = {};   // new card key -> [old card keys], so progress follows a renamed item
  let live = { v: 0, data: null, by: "", at: 0 };

  // full content = built-in, with every section the managers published swapped in
  function effective(data) {
    const out = clone(builtin);
    if (data) ["drinks", "food", "wines", "facts", "allergy"].forEach(k => { if (Array.isArray(data[k])) out[k] = clone(data[k]); });
    if (data && data.settings) {
      const s = data.settings;
      if (typeof s.menus === "string") out.settings.menus = s.menus;
      if (s.tape && typeof s.tape === "object") out.settings.tape = clone(s.tape);
      if (s.dietNotes) Object.assign(out.settings.dietNotes, s.dietNotes);
      if (s.hides) Object.assign(out.settings.hides, s.hides);
    }
    return out;
  }

  // ---- 2. put content into the globals the app reads ----
  function apply(data) {
    const c = effective(data);
    fill(DRINKS, c.drinks.map(strip));
    fill(FOOD, c.food.map(strip));
    fill(WINES, c.wines.map(strip));
    fill(FACTS, c.facts.map(strip));
    fill(ALLERGY_FACTS, c.allergy.map(r => ({ ...strip(r), cat: "Allergens & Mods" })));
    reset(DIET, Object.fromEntries(c.food.map(f => [f.name, f._diet || []])));
    reset(DIETNOTE, Object.fromEntries(c.food.filter(f => f._dnote).map(f => [f.name, f._dnote])));
    reset(COACH.drink, Object.fromEntries(c.drinks.map(d => [d.name, d._coach || {}])));
    reset(COACH.food, Object.fromEntries(c.food.map(f => [f.name, f._coach || {}])));
    reset(COACH.wine, Object.fromEntries(c.wines.map(w => [w.name, w._coach || {}])));
    reset(COACH.fact, Object.fromEntries([...c.facts, ...c.allergy].filter(f => f._coach).map(f => [f.q, f._coach])));
    reset(TAPE, c.settings.tape);
    reset(COACH.diet, c.settings.dietNotes);
    COACH.hides.forEach((h, i) => { h[2] = c.settings.hides[h[1]] || BUILTIN_HIDES[i]; });
    // renamed items keep their photo and everyone's progress
    reset(PHOTO_ALIAS, BUILTIN_ALIAS); reset(RENAMES, {});
    const link = (kind, pre, list, key) => list.forEach(r => (r._was || []).forEach(old => {
      if (!old || old === r[key]) return;
      if (kind) { const nid = photoId(kind, r[key]); if (!PHOTO_ALIAS[nid]) PHOTO_ALIAS[nid] = PHOTO_ALIAS[photoId(kind, old)] || photoId(kind, old); }
      (RENAMES[pre + r[key]] = RENAMES[pre + r[key]] || []).push(pre + old);
    }));
    link("d", "d:", c.drinks, "name"); link("f", "f:", c.food, "name"); link("", "w:", c.wines, "name");
    link("", "q:", c.facts, "q"); link("", "q:", c.allergy, "q");
    // drink drawings: a new drink can borrow one ("_draw"); a renamed drink keeps its own
    if (BUILTIN_ILLUS) {
      c.drinks.forEach(d => {
        const from = [d._draw, ...(d._was || [])].find(n => n && BUILTIN_ILLUS[n]);
        if (from && (d._draw || !BUILTIN_ILLUS[d.name])) ILLUS[d.name] = BUILTIN_ILLUS[from];
      });
    }
    buildCards();
    showMenus(c.settings.menus);
    return c;
  }
  function showMenus(t) {
    const set = () => document.querySelectorAll(".menus").forEach(el => { el.textContent = t; });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", set); else set();
  }
  // copy progress from an old card key to the renamed one (never overwrites)
  function migrate(items) {
    if (!items) return items;
    Object.entries(RENAMES).forEach(([nk, olds]) => { if (items[nk]) return; const o = olds.find(k => items[k]); if (o) items[nk] = clone(items[o]); });
    return items;
  }

  // ---- 3. fetch live content, then start the page ----
  function readCache() { try { return JSON.parse(localStorage.getItem(CACHE) || "null"); } catch (e) { return null; } }
  function writeCache(doc) { try { localStorage.setItem(CACHE, JSON.stringify(doc)); } catch (e) {} }
  async function fetchLive(ms) {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const t = ctrl && setTimeout(() => ctrl.abort(), ms || 3500);
    try {
      const r = await fetch("/api/content", { cache: "no-store", signal: ctrl && ctrl.signal });
      if (!r.ok) return null;
      const j = await r.json();
      return j && typeof j === "object" ? { v: j.v || 0, data: j.data || null, by: j.by || "", at: j.at || 0 } : null;
    } catch (e) { return null; } finally { if (t) clearTimeout(t); }
  }
  function use(doc) { live = doc || { v: 0, data: null, by: "", at: 0 }; apply(live.data); }
  const me = document.currentScript, next = ((me && me.dataset.then) || "").split(",").map(s => s.trim()).filter(Boolean);
  // async=false: download together, run in the listed order (same as plain <script> tags)
  const loadSeq = list => Promise.all(list.map(src => new Promise(res => {
    const s = document.createElement("script"); s.src = src; s.async = false; s.onload = res; s.onerror = res; document.body.appendChild(s);
  })));
  const ready = (async () => {
    const doc = await fetchLive();
    if (doc) { writeCache(doc); use(doc); }
    else { const c = readCache(); if (c) use(c); else showMenus(builtin.settings.menus); }
  })().then(() => loadSeq(next));

  // trainer: when the phone comes back to the tab, check for a newer menu and offer a refresh
  let offered = false;
  async function checkForUpdate() {
    if (offered || document.hidden || !next.some(s => /app\.js/.test(s))) return;
    const doc = await fetchLive(); if (!doc || doc.v === live.v) return;
    writeCache(doc); offered = true;
    const b = document.createElement("button");
    b.type = "button"; b.textContent = "Menu updated · tap to load it";
    b.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);top:calc(10px + env(safe-area-inset-top,0px));z-index:95;border:none;border-radius:999px;padding:11px 18px 9px;background:var(--toast-bg,#3A3B3F);color:var(--toast-fg,#fff);font-family:var(--disp,sans-serif);font-size:11px;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 10px 30px -10px rgba(0,0,0,.5);cursor:pointer;";
    b.onclick = () => location.reload();
    document.body.appendChild(b);
  }
  document.addEventListener("visibilitychange", checkForUpdate);

  return {
    ready, builtin, effective, apply, migrate, clone, strip,
    get live() { return live; }, set live(d) { live = d; writeCache(d); },
    fetchLive,
  };
})();
