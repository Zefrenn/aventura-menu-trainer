// ================= MENU CONTENT EDITOR =================
// Managers change anything staff study, right from the board: drinks, dishes, wines, guide cards,
// allergen cards, hints, diet flags, batch-tape colors and the menu dates.
// Edits are a draft on this device until Publish; then api/content.js stores them and every phone
// picks them up the next time the app opens. Loaded after manager.js (uses $, pin, say, esc, ico, ICON).
ICON.plus = ICON.plus || '<path d="M12 5v14M5 12h14"/>';
ICON.up = '<path d="M12 19V5M5 12l7-7 7 7"/>'; ICON.down = '<path d="M12 5v14M5 12l7 7 7-7"/>';
ICON.undo = '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>';
ICON.dl = '<path d="M12 4v12M6 11l6 6 6-6M4 20h16"/>'; ICON.ul = '<path d="M12 20V8M6 13l6-6 6 6M4 4h16"/>';
ICON.clock = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'; ICON.send = '<path d="M4 12l16-8-6 16-3-7z"/>';
ICON.gear = '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>';

const CSETS = ["drinks", "food", "wines", "facts", "allergy"];
const DIETCODES = [["V", "Vegetarian"], ["VG", "Vegan"], ["GF", "Gluten-free"], ["DF", "Dairy-free"], ["P", "Pescatarian"]];
const ALLERGY_LABEL = { gluten: "Gluten", dairy: "Dairy", egg: "Egg", shellfish: "Shellfish", mollusk: "Mollusk", "fin fish": "Fin fish", "tree nut": "Tree nuts", soy: "Soy", sesame: "Sesame", pork: "Pork", mustard: "Mustard" };
// Field schema per section. t: text | area | lines | cat | select | tape | diet | draw
const SCHEMA = {
  drinks: {
    label: "Drinks", one: "drink", key: "name", newCat: true,
    sub: r => [r.price, r.glass].filter(Boolean).join(" · "),
    fields: [
      { k: "name", l: "Name", t: "text", req: 1, ph: "As printed on the menu" },
      { k: "cat", l: "Section", t: "cat" },
      { k: "price", l: "Price", t: "text", ph: "$16", half: 1 },
      { k: "glass", l: "Glass", t: "text", ph: "Coupe — double strain", half: 1, list: "glass" },
      { k: "menu", l: "Menu description", t: "area", ph: "The ingredient line, as printed" },
      { k: "build", l: "Build", t: "lines", help: "One step per line, e.g. “2.75 oz batch”", ph: "2.75 oz batch\n.25 oz lime\n2 dash Fee foam" },
      { k: "garnish", l: "Garnish", t: "text", ph: "Dehydrated lime" },
      { k: "colors", l: "Batch bottle tape", t: "tape", help: "Tap the colors in order. Leave empty if it isn't batched." },
      { k: "bottle", l: "Bottle note", t: "text", opt: 1, ph: "e.g. BROWN squeeze bottle", help: "Only when it's not a normal taped batch." },
      { k: "sell", l: "Sell it", t: "area", opt: 1, ph: "One line a server can say to a guest" },
      { k: "_draw", l: "Drawing", t: "draw", opt: 1, help: "Shown until a real photo is added in Photos." },
    ],
    coach: [["hook", "Remember it", "The one sentence worth keeping. Shown after each question."], ["id", "Hint · which drink is this?"], ["glass", "Hint · glass"], ["garnish", "Hint · garnish"], ["build", "Hint · build"], ["tape", "Hint · batch tape"]],
  },
  food: {
    label: "Food", one: "dish", key: "name", newCat: true,
    sub: r => [r.price && "$" + String(r.price).replace(/^\$/, ""), r.hh && "HH " + r.hh].filter(Boolean).join(" · "),
    fields: [
      { k: "name", l: "Name", t: "text", req: 1, ph: "As printed on the menu" },
      { k: "cat", l: "Section", t: "cat" },
      { k: "price", l: "Price", t: "text", ph: "14", half: 1 },
      { k: "hh", l: "Happy hour price", t: "text", opt: 1, ph: "8", half: 1 },
      { k: "drop", l: "Description", t: "area", ph: "What a server tells the guest, in one or two sentences" },
      { k: "ing", l: "Ingredients", t: "area", ph: "Everything on the plate, including sauces" },
      { k: "all", l: "Allergens", t: "text", ph: "Gluten, dairy, allium · fryer cross-contact", help: "Comma list. Anything after a · is a note." },
      { k: "mods", l: "Modifications", t: "area", ph: "What can be removed, swapped or put on the side" },
      { k: "ut", l: "Utensils / marking", t: "text", ph: "Small plate, fork" },
      { k: "_diet", l: "Diet flags", t: "diet" },
      { k: "_dnote", l: "Diet note", t: "text", opt: 1, ph: "GF: no baguette", help: "Shown under the diet flags." },
      { k: "tip", l: "Server tip", t: "area", opt: 1 },
      { k: "pair", l: "Printed pairing", t: "text", opt: 1, help: "Desserts: the dessert wine printed next to it." },
      { k: "ill", l: "Drawing", t: "select", opts: () => Object.keys(FOODILLUS).map(k => [k, k[0].toUpperCase() + k.slice(1)]), help: "Shown until a real photo is added in Photos." },
    ],
    coach: [["hook", "Remember it", "The one sentence worth keeping. Shown after each question."], ["id", "Hint · which dish is this?"], ["mods", "Hint · modifications"], ["ut", "Hint · utensils"], ["pair", "Hint · pairing"]],
  },
  wines: {
    label: "Wines", one: "wine", key: "name",
    sub: r => [r.region, r.price].filter(Boolean).join(" · "),
    fields: [
      { k: "name", l: "Name", t: "text", req: 1, ph: "Grape / producer, as printed" },
      { k: "cat", l: "Section", t: "select", opts: () => [["Wines BTG", "Wines by the glass"], ["Vino de Postre", "Vino de postre"]] },
      { k: "kind", l: "Style", t: "select", opts: () => [["sparkling", "Sparkling"], ["rose", "Rosé"], ["white", "White"], ["red", "Red"], ["dessert", "Dessert / fortified"]] },
      { k: "region", l: "Region & vintage", t: "text", ph: "Rías Baixas 2025", half: 1 },
      { k: "price", l: "Price (glass / bottle)", t: "text", ph: "15 / 60", half: 1 },
      { k: "notes", l: "Tasting notes", t: "text", ph: "peach, apricot, white flower" },
      { k: "grape", l: "Grape", t: "text" },
      { k: "story", l: "Story", t: "area" },
      { k: "like", l: "If you like…", t: "text", ph: "Sauvignon Blanc" },
      { k: "pair", l: "Pairs with", t: "text" },
    ],
    coach: [["hook", "Remember it", "The one sentence worth keeping. Shown after each question."], ["g", "Grape in plain words", "Used in hints, e.g. “cava (Spanish sparkling)”"]],
  },
  facts: {
    label: "Guide", one: "card", key: "q", newCat: true,
    sub: r => r.a,
    fields: [
      { k: "cat", l: "Section", t: "cat" },
      { k: "q", l: "Question · front of the card", t: "area", req: 1, ph: "House gin?" },
      { k: "a", l: "Answer", t: "area", req: 1 },
      { k: "x", l: "Extra detail", t: "area", opt: 1 },
    ],
    coach: "Hint · a nudge, never the answer",
  },
  allergy: {
    label: "Allergens", one: "card", key: "q",
    sub: r => r.a,
    fields: [
      { k: "q", l: "Question · front of the card", t: "area", req: 1 },
      { k: "a", l: "Answer", t: "area", req: 1 },
      { k: "x", l: "Extra detail", t: "area", opt: 1 },
    ],
    coach: "Hint · a nudge, never the answer",
  },
};

const CT = { live: null, liveEff: null, draft: null, set: "drinks", edit: null, q: "", cat: "all", open: new Set(), hist: null, loaded: false };
const DKEY = "av_content_draft";
const clone = AVContent.clone;
const plain = r => { const o = {}; Object.keys(r).forEach(k => { if (k.slice(0, 2) !== "__") o[k] = r[k]; }); return o; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const idOf = (set, r) => set + ":" + r[SCHEMA[set].key];
function annotate(c) { CSETS.forEach(s => c[s].forEach(r => { r.__k = idOf(s, r); })); return c; }
function saveDraft() { try { localStorage.setItem(DKEY, JSON.stringify({ base: CT.live.v, draft: CT.draft })); } catch (e) {} }
function clearDraft() { try { localStorage.removeItem(DKEY); } catch (e) {} }

// ---- what changed ----
function liveMap(set) { const m = {}; CT.liveEff[set].forEach(r => { m[r.__k] = r; }); return m; }
function itemState(set, r) { const l = liveMap(set)[r.__k]; if (!l) return "new"; return same(plain(l), plain(r)) ? "" : "edited"; }
function setChanges(set) {
  if (set === "settings") return same(CT.liveEff.settings, CT.draft.settings) ? 0 : 1;
  const m = liveMap(set), seen = new Set(); let n = 0;
  CT.draft[set].forEach(r => { seen.add(r.__k); const l = m[r.__k]; if (!l || !same(plain(l), plain(r))) n++; });
  n += Object.keys(m).filter(k => !seen.has(k)).length;
  if (!n && !same(CT.draft[set].map(r => r.__k), CT.liveEff[set].map(r => r.__k))) n = 1; // order only
  return n;
}
const totalChanges = () => [...CSETS, "settings"].reduce((a, s) => a + setChanges(s), 0);
// only sections that differ from the built-in files are published; the rest keep following the code
function publishData() {
  const b = AVContent.builtin, out = {};
  CSETS.forEach(s => { const d = CT.draft[s].map(plain); if (!same(d, b[s])) out[s] = d; });
  if (!same(CT.draft.settings, b.settings)) out.settings = clone(CT.draft.settings);
  return out;
}

// ---- load ----
async function contentLoad(force) {
  if (CT.loaded && !force) return;
  say("Loading the menu…", true);
  const doc = await AVContent.fetchLive(8000);
  say("");
  if (doc) AVContent.live = doc;
  CT.live = AVContent.live; CT.liveEff = annotate(AVContent.effective(CT.live.data));
  let saved = null; try { saved = JSON.parse(localStorage.getItem(DKEY) || "null"); } catch (e) {}
  CT.draft = saved && saved.draft ? saved.draft : clone(CT.liveEff);
  CT.staleBase = !!(saved && saved.draft && saved.base !== CT.live.v);
  CT.loaded = true;
  if (saved && saved.draft && totalChanges()) say("Picked up your unpublished changes");
  else { CT.staleBase = false; if (saved) clearDraft(); }
}

// ---- render ----
function renderContent() {
  if (!CT.loaded) { contentLoad().then(renderContent); return; }
  const L = CT.live;
  $("cLive").innerHTML = L.v
    ? `${ico("clock")} Live menu last published <b>${esc(new Date(L.at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }))}</b> by ${esc(L.by || "a manager")}${L.note ? ` · “${esc(L.note)}”` : ""}`
    : `${ico("clock")} Live menu: the original built-in version. Nothing has been published from here yet.`;
  $("cSets").innerHTML = [...CSETS, "settings"].map(s => {
    const n = s === "settings" ? null : CT.draft[s].length, ch = setChanges(s);
    return `<button type="button" data-set="${s}" aria-pressed="${CT.set === s}">${s === "settings" ? ico("gear") : ""}${s === "settings" ? "Settings" : SCHEMA[s].label}${n !== null ? ` <i>${n}</i>` : ""}${ch ? '<b class="dot" title="Unpublished changes"></b>' : ""}</button>`;
  }).join("");
  $("cSets").querySelectorAll("button").forEach(b => b.onclick = () => { CT.set = b.dataset.set; CT.edit = null; CT.q = ""; CT.cat = "all"; $("cSearch").value = ""; renderContent(); window.scrollTo({ top: $("content").offsetTop - 10, behavior: "smooth" }); });
  const editing = !!CT.edit, settings = CT.set === "settings";
  $("cListWrap").classList.toggle("hidden", editing || settings);
  $("cEdit").classList.toggle("hidden", !editing);
  $("cSettings").classList.toggle("hidden", !settings || editing);
  $("cMore").classList.toggle("hidden", editing);
  if (editing) renderItemEditor(); else if (settings) renderSettings(); else renderList();
  renderPubBar();
}
function catsOf(set) { return [...new Set(CT.draft[set].map(r => r.cat).filter(Boolean))]; }
function renderList() {
  const set = CT.set, S = SCHEMA[set], q = CT.q.trim().toLowerCase();
  const sel = $("cCat"), cats = set === "allergy" ? [] : catsOf(set);
  sel.innerHTML = `<option value="all">All sections</option>` + cats.map(c => `<option>${esc(c)}</option>`).join("");
  if (!cats.includes(CT.cat)) CT.cat = "all"; sel.value = CT.cat; sel.classList.toggle("on", CT.cat !== "all");
  sel.closest(".field").classList.toggle("hidden", set === "allergy");
  $("cAdd").innerHTML = `${ico("plus")}<span>Add ${S.one}</span>`;
  $("cSearch").placeholder = `Search ${S.label.toLowerCase()}`;
  const rows = CT.draft[set].map((r, i) => ({ r, i })).filter(({ r }) =>
    (CT.cat === "all" || r.cat === CT.cat) && (!q || JSON.stringify(plain(r)).toLowerCase().includes(q)));
  const m = liveMap(set), gone = Object.keys(m).filter(k => !CT.draft[set].some(r => r.__k === k)).map(k => m[k]);
  const groups = {}; rows.forEach(o => { const c = set === "allergy" ? "Allergens & Mods" : (o.r.cat || "No section"); (groups[c] = groups[c] || []).push(o); });
  const list = $("cList");
  $("cCount").textContent = `${rows.length} ${rows.length === 1 ? S.one : S.one + "s"}${q || CT.cat !== "all" ? " match" : ""}`;
  if (!rows.length && !gone.length) { list.innerHTML = `<div class="q empty">${q ? "Nothing matches that search." : `No ${S.label.toLowerCase()} yet. Tap <b>Add ${S.one}</b>.`}</div>`; return; }
  const many = Object.keys(groups).length > 1 && rows.length > 30;  // short lists open, long ones (the guide) start folded
  list.innerHTML = Object.entries(groups).map(([c, items]) => {
    const ch = items.filter(o => itemState(set, o.r)).length, open = !many || q || CT.open.has(set + c);
    return `<details class="grp" data-g="${esc(set + c)}"${open ? " open" : ""}><summary><span class="gname">${esc(c)}</span><span class="gcount">${items.length}${ch ? ` · <b class="chg">${ch} changed</b>` : ""}</span>${ico("chev").replace('class="i"', 'class="i chev"')}</summary><div class="glist">${items.map(({ r, i }) => {
      const st = itemState(set, r);
      return `<button type="button" class="crow" data-i="${i}"><span class="ct"><span class="cn">${esc(r[S.key])}</span><span class="mini">${esc(S.sub(r) || "")}</span></span>${st ? `<span class="tag ${st === "new" ? "ok" : "pending"}">${st === "new" ? "New" : "Edited"}</span>` : ""}${ico("pencil")}</button>`;
    }).join("")}</div></details>`;
  }).join("") + (gone.length ? `<div class="q gone"><div class="eyebrow">Removed · not published yet</div>${gone.map(r => `<div class="grow2"><span>${esc(r[S.key])}</span><button type="button" class="btn ghost sm" data-undel="${esc(r.__k)}">${ico("undo")}<span>Put back</span></button></div>`).join("")}</div>` : "");
  list.querySelectorAll("details.grp").forEach(d => d.addEventListener("toggle", () => { d.open ? CT.open.add(d.dataset.g) : CT.open.delete(d.dataset.g); }));
  list.querySelectorAll(".crow").forEach(b => b.onclick = () => openEditor(+b.dataset.i));
  list.querySelectorAll("[data-undel]").forEach(b => b.onclick = () => {
    const r = clone(liveMap(set)[b.dataset.undel]), li = CT.liveEff[set].findIndex(x => x.__k === r.__k);
    CT.draft[set].splice(Math.min(li, CT.draft[set].length), 0, r); saveDraft(); renderContent(); say("Put back");
  });
}

// ---- item editor ----
function openEditor(i) {
  const set = CT.set, S = SCHEMA[set];
  let r;
  if (i < 0) {
    r = { __k: "new:" + Date.now().toString(36) };
    S.fields.forEach(f => { r[f.k] = f.t === "lines" || f.t === "tape" || f.t === "diet" ? [] : ""; });
    if (set === "drinks") { r.colors = []; r.build = []; }
    if (set === "food") r.ill = "plate";
    if (set === "wines") { r.cat = "Wines BTG"; r.kind = "white"; }
    if (S.fields.some(f => f.t === "cat")) r.cat = CT.cat !== "all" ? CT.cat : (catsOf(set)[0] || "");
    r._coach = S.coach && typeof S.coach !== "string" ? {} : "";
  } else r = clone(CT.draft[set][i]);
  CT.edit = { set, i, r, orig: i < 0 ? null : r[S.key], del: false };
  renderContent(); window.scrollTo({ top: $("content").offsetTop - 10, behavior: "smooth" });
  setTimeout(() => { const f = $("cEdit").querySelector("input,textarea,select"); if (f && i < 0 && !$("cEdit").contains(document.activeElement)) f.focus(); }, 60);
}
const lbl = (f, id) => `<label class="lbl" for="${id}">${esc(f.l)}${f.opt ? '<span class="opt">optional</span>' : ""}</label>`;
const help = f => f.help ? `<div class="fhelp">${esc(f.help)}</div>` : "";
function fieldHTML(f, r, set) {
  const id = "cf_" + f.k, v = r[f.k];
  switch (f.t) {
    case "text": return `${lbl(f, id)}<input class="ff" id="${id}" data-k="${f.k}" value="${esc(v || "")}" placeholder="${esc(f.ph || "")}"${f.list ? ` list="cl_${f.list}"` : ""} autocomplete="off">${help(f)}`;
    case "area": return `${lbl(f, id)}<textarea class="ff" id="${id}" data-k="${f.k}" rows="2" placeholder="${esc(f.ph || "")}">${esc(v || "")}</textarea>${help(f)}`;
    case "lines": return `${lbl(f, id)}<textarea class="ff" id="${id}" data-k="${f.k}" data-lines="1" rows="${Math.max(3, (v || []).length + 1)}" placeholder="${esc(f.ph || "")}">${esc((v || []).join("\n"))}</textarea>${help(f)}`;
    case "select": { const o = f.opts(); if (v && !o.some(x => x[0] === v)) o.push([v, v]);
      return `${lbl(f, id)}<select class="ff" id="${id}" data-k="${f.k}">${o.map(([a, b]) => `<option value="${esc(a)}"${a === v ? " selected" : ""}>${esc(b)}</option>`).join("")}</select>${help(f)}`; }
    case "cat": { const cats = catsOf(set); if (v && !cats.includes(v)) cats.push(v);
      return `${lbl(f, id)}<select class="ff" id="${id}" data-k="cat">${cats.map(c => `<option${c === v ? " selected" : ""}>${esc(c)}</option>`).join("")}${SCHEMA[set].newCat ? `<option value="__new">+ New section…</option>` : ""}</select><input class="ff hidden" id="cf_newcat" placeholder="Name of the new section" maxlength="40" style="margin-top:6px">`; }
    case "tape": { const T = CT.draft.settings.tape, on = v || [];
      return `<span class="lbl">${esc(f.l)}</span><div class="tapes" id="${id}">${Object.keys(T).map(k => { const n = on.indexOf(k);
        return `<button type="button" class="tapebtn" data-tape="${esc(k)}" aria-pressed="${n >= 0}"><span class="sw2" style="background:${esc(T[k])}"></span>${esc(k)}${n >= 0 ? `<i>${n + 1}</i>` : ""}</button>`; }).join("")}</div>${help(f)}`; }
    case "diet": { const d = v || [];
      return `<span class="lbl">${esc(f.l)}</span><div class="diets">${DIETCODES.map(([c, name]) => { const s = d.includes(c) ? "y" : d.includes(c + "*") ? "m" : "n";
        return `<div class="drow"><span>${name}</span><div class="seg" role="radiogroup" aria-label="${name}">${[["n", "No"], ["y", "Yes"], ["m", "With a mod"]].map(([x, t]) => `<button type="button" role="radio" data-diet="${c}" data-v="${x}" aria-checked="${s === x}">${t}</button>`).join("")}</div></div>`; }).join("")}</div><div class="fhelp">“With a mod” = only after a change, or not printed on the menu. Staff are told to say the mod or ask Chef.</div>`; }
    case "draw": {
      if (AVContent.builtin.drinks.some(d => d.name === r.name && typeof ILLUS !== "undefined" && ILLUS[d.name]) && !v) return "";
      const names = AVContent.builtin.drinks.map(d => d.name).filter(n => typeof ILLUS !== "undefined" && ILLUS[n]);
      return `${lbl(f, id)}<select class="ff" id="${id}" data-k="_draw"><option value="">No drawing</option>${names.map(n => `<option value="${esc(n)}"${n === v ? " selected" : ""}>Same glass as ${esc(n)}</option>`).join("")}</select>${help(f)}`;
    }
  }
  return "";
}
function renderItemEditor() {
  const E = CT.edit, S = SCHEMA[E.set], r = E.r, isNew = E.i < 0;
  const coach = S.coach;
  const coachHTML = typeof coach === "string"
    ? `<label class="lbl" for="cc_s">${esc(coach)}<span class="opt">optional</span></label><textarea class="ff" id="cc_s" data-coach="" rows="2">${esc(r._coach || "")}</textarea>`
    : coach.map(([k, l, h]) => `<label class="lbl" for="cc_${k}">${esc(l)}<span class="opt">optional</span></label><textarea class="ff" id="cc_${k}" data-coach="${k}" rows="2">${esc((r._coach || {})[k] || "")}</textarea>${h ? `<div class="fhelp">${esc(h)}</div>` : ""}`).join("");
  const hasHints = typeof coach === "string" ? !!r._coach : Object.values(r._coach || {}).some(Boolean);
  const half = []; let html = "";
  S.fields.forEach((f, n) => {
    const h = fieldHTML(f, r, E.set); if (!h) return;
    if (f.half) { half.push(h); if (!(S.fields[n + 1] && S.fields[n + 1].half)) { html += `<div class="qerow">${half.map(x => `<div>${x}</div>`).join("")}</div>`; half.length = 0; } }
    else html += h;
  });
  const glasses = [...new Set(CT.draft.drinks.map(d => d.glass).filter(Boolean))];
  $("cEdit").innerHTML = `<div class="q qe">
    <div class="eyebrow">${esc(S.label)} · ${isNew ? "new " + S.one : "edit " + S.one}</div>
    <h2 class="h-sec" style="margin-top:8px">${esc(r[S.key] || (isNew ? "New " + S.one : ""))}</h2>
    ${html}
    <datalist id="cl_glass">${glasses.map(g => `<option value="${esc(g)}">`).join("")}</datalist>
    <details class="hints"${hasHints ? "" : ""}><summary>${ico("chev").replace('class="i"', 'class="i chev"')}<span>Hints${typeof coach === "string" ? "" : " & “Remember it”"}</span><span class="mini">${hasHints ? "written" : "optional · the app makes its own if blank"}</span></summary><div class="hbody">${coachHTML}</div></details>
    <div class="cwarn" id="cWarn" role="alert"></div>
    <div class="nav"><button class="btn" id="ceCancel" type="button">Cancel</button><button class="btn gold" id="ceSave" type="button">${ico("check")}<span>${isNew ? "Add to draft" : "Save to draft"}</span></button></div>
    ${isNew ? "" : `<div class="ceacts"><button class="btn ghost sm" id="ceUp" type="button">${ico("up")}<span>Move up</span></button><button class="btn ghost sm" id="ceDown" type="button">${ico("down")}<span>Move down</span></button>${itemState(E.set, CT.draft[E.set][E.i]) === "edited" ? `<button class="btn ghost sm" id="ceRevert" type="button">${ico("undo")}<span>Undo my edits</span></button>` : ""}<button class="btn ghost sm warn" id="ceDel" type="button">${ico("trash")}<span>Delete ${esc(S.one)}</span></button></div>`}
    <div class="fhelp" style="margin-top:10px">Saved edits stay a draft on this device until you publish them.</div>
  </div>`;
  const root = $("cEdit");
  root.querySelectorAll("textarea").forEach(t => { const fit = () => { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight + 2, 420) + "px"; }; t.addEventListener("input", fit); setTimeout(fit, 0); });
  const cat = $("cf_cat"); if (cat) cat.onchange = () => { const n = cat.value === "__new"; $("cf_newcat").classList.toggle("hidden", !n); if (n) $("cf_newcat").focus(); };
  root.querySelectorAll(".tapebtn").forEach(b => b.onclick = () => { readForm(); const c = E.r.colors || (E.r.colors = []), k = b.dataset.tape, n = c.indexOf(k); n >= 0 ? c.splice(n, 1) : c.push(k); renderItemEditor(); });
  root.querySelectorAll("[data-diet]").forEach(b => b.onclick = () => { b.parentNode.querySelectorAll("button").forEach(x => x.setAttribute("aria-checked", x === b)); });
  $("ceCancel").onclick = () => { CT.edit = null; renderContent(); };
  $("ceSave").onclick = saveItem;
  if (!isNew) {
    const move = d => { const L = CT.draft[E.set], j = E.i + d; if (j < 0 || j >= L.length) return; [L[E.i], L[j]] = [L[j], L[E.i]]; E.i = j; saveDraft(); say(d < 0 ? "Moved up" : "Moved down"); renderPubBar(); };
    $("ceUp").onclick = () => move(-1); $("ceDown").onclick = () => move(1);
    if ($("ceRevert")) $("ceRevert").onclick = () => { const l = liveMap(E.set)[E.r.__k]; if (!l) return; CT.draft[E.set][E.i] = clone(l); saveDraft(); CT.edit = null; renderContent(); say("Back to the live version"); };
    $("ceDel").onclick = () => {
      const b = $("ceDel");
      if (!E.del) { E.del = true; b.querySelector("span").textContent = "Tap again to delete"; b.classList.add("armed"); setTimeout(() => { if (CT.edit === E && E.del) { E.del = false; if (document.body.contains(b)) { b.querySelector("span").textContent = "Delete " + S.one; b.classList.remove("armed"); } } }, 4000); return; }
      const name = CT.draft[E.set][E.i][S.key]; CT.draft[E.set].splice(E.i, 1); saveDraft(); CT.edit = null; renderContent(); say(`Removed ${name} from the draft`);
    };
  }
}
function readForm() {
  const E = CT.edit, r = E.r, root = $("cEdit");
  root.querySelectorAll("[data-k]").forEach(el => {
    const k = el.dataset.k;
    if (el.dataset.lines) r[k] = el.value.split("\n").map(s => s.trim()).filter(Boolean);
    else if (k === "cat" && el.value === "__new") r.cat = $("cf_newcat").value.trim().replace(/\s+/g, " ");
    else if (k === "_draw") { if (el.value) r._draw = el.value; else delete r._draw; }
    else r[k] = el.value.trim();
  });
  const diet = []; root.querySelectorAll('.seg [aria-checked="true"]').forEach(b => { if (b.dataset.v === "y") diet.push(b.dataset.diet); if (b.dataset.v === "m") diet.push(b.dataset.diet + "*"); });
  if (root.querySelector(".diets")) r._diet = diet;
  const cs = root.querySelectorAll("[data-coach]");
  if (cs.length === 1 && cs[0].dataset.coach === "") r._coach = cs[0].value.trim();
  else if (cs.length) { const c = {}; cs.forEach(t => { if (t.value.trim()) c[t.dataset.coach] = t.value.trim(); }); r._coach = c; }
  // optional fields left blank are dropped so the card hides them
  SCHEMA[E.set].fields.forEach(f => { if (f.opt && f.t !== "draw" && (r[f.k] === "" || r[f.k] === undefined)) delete r[f.k]; });
  return r;
}
function saveItem() {
  const E = CT.edit, S = SCHEMA[E.set], r = readForm(), warn = $("cWarn");
  const miss = S.fields.filter(f => f.req && !String(r[f.k] || "").trim()).map(f => f.l.split(" ·")[0]);
  if (S.fields.some(f => f.t === "cat") && !r.cat) miss.push("Section");
  if (miss.length) { warn.textContent = "Please fill in: " + miss.join(", ") + "."; return; }
  const key = r[S.key], dup = CT.draft[E.set].findIndex((x, j) => j !== E.i && String(x[S.key]).toLowerCase() === String(key).toLowerCase());
  if (dup >= 0) { warn.textContent = `Another ${S.one} is already called “${key}”. Names need to be different so progress and photos stay separate.`; return; }
  // a rename keeps the old name so everyone's progress, the photo and the drawing follow the item
  if (E.orig && E.orig !== key) { const w = new Set([...(r._was || []), E.orig]); w.delete(key); r._was = [...w].slice(-10); }
  if (E.i < 0) {
    const L = CT.draft[E.set]; let at = L.length;
    if (r.cat) { const last = L.map(x => x.cat).lastIndexOf(r.cat); if (last >= 0) at = last + 1; }
    L.splice(at, 0, r);
  } else CT.draft[E.set][E.i] = r;
  saveDraft(); CT.edit = null; CT.q = ""; $("cSearch").value = ""; if (r.cat) CT.open.add(E.set + r.cat);
  renderContent(); say(E.i < 0 ? `Added ${key} · publish when ready` : `Saved ${key} · publish when ready`);
}

// ---- settings: menu dates, tape colors, allergen + diet coaching ----
function renderSettings() {
  const s = CT.draft.settings, used = k => CT.draft.drinks.filter(d => (d.colors || []).includes(k)).map(d => d.name);
  $("cSettings").innerHTML = `<div class="q qe">
    <h2 class="h-sec">Menu dates</h2>
    <label class="lbl" for="cs_menus">Line under the logo in the trainer</label><input class="ff" id="cs_menus" value="${esc(s.menus)}" maxlength="200">
    <div class="fhelp">Update it when a new menu prints, e.g. “Dinner 10·15·26 · Sweet tapas 6·24·26 · Happy hour 8·1·26”.</div>
  </div>
  <div class="q qe">
    <h2 class="h-sec">Batch tape colors</h2>
    <div class="fhelp" style="margin-top:0">The tape on each batch bottle. Drinks pick from these.</div>
    <div id="cs_tape">${Object.entries(s.tape).map(([k, c]) => { const u = used(k);
      return `<div class="taperow"><input type="color" value="${esc(c)}" data-tcol="${esc(k)}" aria-label="${esc(k)} color"><span class="tn">${esc(k)}</span><span class="mini">${u.length ? esc(u.join(", ")) : "not used"}</span><button type="button" class="btn ghost sm warn" data-tdel="${esc(k)}"${u.length ? ` disabled title="Used by ${esc(u.join(", "))}"` : ""}>${ico("trash")}</button></div>`; }).join("")}</div>
    <div class="qerow" style="grid-template-columns:1fr auto auto"><div><label class="lbl" for="cs_tname">New color name</label><input class="ff" id="cs_tname" placeholder="e.g. PURPLE" maxlength="20"></div><div><label class="lbl" for="cs_tcol">Color</label><input type="color" id="cs_tcol" value="#7a4fa3" class="tcolin"></div><div><button type="button" class="btn sm" id="cs_tadd">${ico("plus")}<span>Add</span></button></div></div>
  </div>
  <div class="q qe">
    <h2 class="h-sec">Where allergens hide on our menu</h2>
    <div class="fhelp" style="margin-top:0">Used as the hint for “a guest has a ___ allergy” questions. Update when dishes change.</div>
    ${Object.entries(s.hides).map(([k, v]) => `<label class="lbl" for="cs_h_${k.replace(/\W/g, "")}">${esc(ALLERGY_LABEL[k] || k)}</label><textarea class="ff" rows="2" id="cs_h_${k.replace(/\W/g, "")}" data-hide="${esc(k)}">${esc(v)}</textarea>`).join("")}
  </div>
  <div class="q qe">
    <h2 class="h-sec">Diet explanations</h2>
    <div class="fhelp" style="margin-top:0">Shown as the hint for diet questions.</div>
    ${Object.entries(s.dietNotes).map(([k, v]) => `<label class="lbl" for="cs_d_${k}">${esc((DIETCODES.find(d => d[0] === k) || [k, k])[1])}</label><textarea class="ff" rows="2" id="cs_d_${k}" data-dnote="${esc(k)}">${esc(v)}</textarea>`).join("")}
  </div>`;
  const root = $("cSettings"), upd = () => { saveDraft(); renderPubBar(); updSetDots(); };
  root.querySelectorAll("textarea").forEach(t => { const fit = () => { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight + 2, 300) + "px"; }; t.addEventListener("input", fit); setTimeout(fit, 0); });
  $("cs_menus").oninput = e => { s.menus = e.target.value; upd(); };
  root.querySelectorAll("[data-hide]").forEach(t => t.oninput = () => { s.hides[t.dataset.hide] = t.value; upd(); });
  root.querySelectorAll("[data-dnote]").forEach(t => t.oninput = () => { s.dietNotes[t.dataset.dnote] = t.value; upd(); });
  root.querySelectorAll("[data-tcol]").forEach(t => t.oninput = () => { s.tape[t.dataset.tcol] = t.value; upd(); });
  root.querySelectorAll("[data-tdel]").forEach(b => b.onclick = () => { delete s.tape[b.dataset.tdel]; upd(); renderSettings(); });
  $("cs_tadd").onclick = () => {
    const n = $("cs_tname").value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    if (!/^[A-Z][A-Z0-9_]{0,19}$/.test(n)) { say("Give the color a name that starts with a letter"); return; }
    if (s.tape[n]) { say("That color is already on the list"); return; }
    s.tape[n] = $("cs_tcol").value; upd(); renderSettings(); say(`Added ${n}`);
  };
}
function updSetDots() { $("cSets").querySelectorAll("button").forEach(b => { const has = setChanges(b.dataset.set) > 0, dot = b.querySelector(".dot"); if (has && !dot) b.insertAdjacentHTML("beforeend", '<b class="dot" title="Unpublished changes"></b>'); if (!has && dot) dot.remove(); }); }

// ---- publish bar ----
function renderPubBar() {
  const n = totalChanges(), bar = $("cPub"), show = n > 0 && !$("content").classList.contains("hidden");
  bar.classList.toggle("hidden", !show); document.body.classList.toggle("haspub", show);
  if (!show) return;
  const secs = [...CSETS, "settings"].filter(s => setChanges(s)).map(s => s === "settings" ? "Settings" : SCHEMA[s].label);
  $("cPubN").innerHTML = `<b>${n} unpublished change${n === 1 ? "" : "s"}</b><span>${esc(secs.join(" · "))}</span>`;
  if (CT.staleBase) $("cPubN").innerHTML += `<span class="stale">Someone published since you started these edits.</span>`;
}
function openPublish() {
  $("cPubForm").classList.remove("hidden"); $("cPubMain").classList.add("hidden");
  $("cpBy").value = localStorage.getItem("av_photo_by") || ""; $("cpNote").value = ""; $("cpErr").textContent = "";
  setTimeout(() => ($("cpBy").value ? $("cpNote") : $("cpBy")).focus(), 50);
}
function closePublish() { $("cPubForm").classList.add("hidden"); $("cPubMain").classList.remove("hidden"); }
async function publish(force) {
  const by = $("cpBy").value.trim(), note = $("cpNote").value.trim();
  if (!by) { $("cpErr").textContent = "Add your name so the team knows who changed it."; $("cpBy").focus(); return; }
  try { localStorage.setItem("av_photo_by", by); } catch (e) {}
  const btn = $("cpGo"); btn.disabled = true; say("Publishing…", true);
  let r; try {
    r = await fetch("/api/content", { method: "POST", headers: { "content-type": "application/json", "x-pin": pin }, body: JSON.stringify({ action: "publish", base: CT.live.v, data: publishData(), by, note, force: !!force }) });
  } catch (e) { btn.disabled = false; say(""); $("cpErr").textContent = "Couldn't reach the server. Your edits are still saved here."; return; }
  btn.disabled = false; say("");
  if (r.status === 409) {
    const j = await r.json().catch(() => ({})), c = j.current || {};
    $("cpErr").innerHTML = `${esc(c.by || "Another manager")} published changes ${c.at ? esc(ago(c.at)) : "recently"} since you started. Publishing now replaces their version with yours. <span class="cpx"><button type="button" class="btn sm warn" id="cpForce">Publish mine anyway</button><button type="button" class="btn sm" id="cpTheirs">Use theirs, drop mine</button></span>`;
    $("cpForce").onclick = () => publish(true);
    $("cpTheirs").onclick = async () => { clearDraft(); CT.loaded = false; closePublish(); await contentLoad(true); renderContent(); say("Loaded the latest live menu"); };
    return;
  }
  if (r.status === 401) { $("cpErr").textContent = "The PIN was rejected. Reload the board and sign in again."; return; }
  if (!r.ok) { const j = await r.json().catch(() => ({})); $("cpErr").textContent = "Couldn't publish (" + (j.error || r.status) + "). Your edits are still saved here."; return; }
  const { doc } = await r.json();
  AVContent.live = doc; AVContent.apply(doc.data); refreshBoardData();
  CT.live = doc; CT.liveEff = annotate(AVContent.effective(doc.data)); CT.draft = clone(CT.liveEff); CT.staleBase = false; clearDraft(); CT.hist = null;
  closePublish(); renderContent(); say("Published · staff get it next time they open the app");
}
// photos tab + team board read these lists; keep them in step after a publish
function refreshBoardData() {
  if (typeof PITEMS !== "undefined") PITEMS.splice(0, PITEMS.length, ...FOOD.map(f => ({ kind: "f", name: f.name, cat: f.cat, svg: FOODILLUS[f.ill] })), ...DRINKS.map(d => ({ kind: "d", name: d.name, cat: d.cat, svg: ILLUS[d.name] || "" })));
  if (typeof countPhotos === "function") try { countPhotos(); } catch (e) {}
}

// ---- versions, backup, start over ----
async function renderHistory() {
  const box = $("cHist"); box.classList.remove("hidden");
  box.innerHTML = `<div class="mini" style="padding:8px 0">Loading versions…</div>`;
  let log = [];
  try { const r = await fetch("/api/content?log=1", { cache: "no-store", headers: { "x-pin": pin } }); if (r.ok) log = (await r.json()).log || []; } catch (e) {}
  const label = s => (s || []).map(x => x === "settings" ? "Settings" : (SCHEMA[x] || { label: x }).label).join(", ") || "back to original";
  box.innerHTML = `<div class="fhelp" style="margin:4px 0 8px">Open any earlier version as a draft to look it over, then publish it to bring it back.</div>` +
    (log.length ? log.map((e, n) => `<div class="hrow"><div class="ct"><b>${esc(new Date(e.at).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }))}</b>${n === 0 ? ' <span class="tag ok">Live</span>' : ""}<div class="mini">${esc(e.by || "")}${e.note ? " · “" + esc(e.note) + "”" : ""} · ${esc(label(e.sections))}</div></div>${n === 0 ? "" : `<button type="button" class="btn sm" data-ver="${e.v}">Open</button>`}</div>`).join("") : `<div class="mini" style="padding:6px 0">Nothing published yet.</div>`) +
    `<div class="hrow"><div class="ct"><b>Original built-in menu</b><div class="mini">What shipped with the app code</div></div><button type="button" class="btn sm" id="cOrig">Open</button></div>`;
  box.querySelectorAll("[data-ver]").forEach(b => b.onclick = async () => {
    say("Loading…", true); let doc = null;
    try { const r = await fetch("/api/content?version=" + b.dataset.ver, { cache: "no-store", headers: { "x-pin": pin } }); if (r.ok) doc = await r.json(); } catch (e) {}
    say(""); if (!doc) { say("Couldn't load that version"); return; }
    loadAsDraft(doc.data, "Opened the " + new Date(doc.at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " version as a draft");
  });
  $("cOrig").onclick = () => loadAsDraft(null, "Opened the original menu as a draft");
}
function loadAsDraft(data, msg) {
  CT.draft = annotate(AVContent.effective(data)); CT.edit = null; CT.staleBase = false; saveDraft();
  $("cHist").classList.add("hidden"); renderContent(); say(msg + " · publish to make it live");
}
function downloadBackup() {
  const out = { format: "aventura-menu-content", version: 1, exported: new Date().toISOString(), live: { v: CT.live.v, by: CT.live.by, at: CT.live.at }, data: publishData() };
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
  a.download = `aventura-menu-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  say("Backup downloaded (includes your unpublished edits)");
}
function importBackup(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const j = JSON.parse(fr.result), data = j && (j.data !== undefined ? j.data : j);
      if (data !== null && (typeof data !== "object" || ![...CSETS, "settings"].some(k => k in data))) throw new Error("shape");
      const c = AVContent.effective(data);
      CSETS.forEach(s => { if (!c[s].every(r => r && r[SCHEMA[s].key])) throw new Error("items"); });
      loadAsDraft(data, "Loaded the backup as a draft");
    } catch (e) { say("That file isn't a menu backup from this board"); }
  };
  fr.readAsText(file);
}

// ---- wiring ----
$("cSearch").oninput = e => { CT.q = e.target.value; $("cClear").hidden = !CT.q; renderList(); };
$("cClear").onclick = () => { $("cSearch").value = ""; CT.q = ""; $("cClear").hidden = true; renderList(); $("cSearch").focus(); };
$("cCat").onchange = e => { CT.cat = e.target.value; renderList(); };
$("cAdd").onclick = () => openEditor(-1);
$("cHistBtn").onclick = () => { if ($("cHist").classList.contains("hidden")) renderHistory(); else $("cHist").classList.add("hidden"); };
$("cExport").onclick = downloadBackup;
$("cImport").onclick = () => $("cFile").click();
$("cFile").onchange = e => { const f = e.target.files[0]; if (f) importBackup(f); e.target.value = ""; };
$("cPubBtn").onclick = openPublish;
$("cpCancel").onclick = closePublish;
$("cpGo").onclick = () => publish(false);
$("cDiscard").onclick = () => {
  const b = $("cDiscard");
  if (!b.dataset.armed) { b.dataset.armed = "1"; b.querySelector("span").textContent = "Tap again to discard"; setTimeout(() => { delete b.dataset.armed; b.querySelector("span").textContent = "Discard"; }, 4000); return; }
  delete b.dataset.armed; b.querySelector("span").textContent = "Discard";
  CT.draft = clone(CT.liveEff); CT.edit = null; CT.staleBase = false; clearDraft(); renderContent(); say("Draft discarded · showing the live menu");
};
