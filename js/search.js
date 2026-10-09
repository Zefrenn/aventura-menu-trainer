// ---- Search: find any drink, dish, wine or guide card by name, ingredient, allergen, glass… ----
// Accent-insensitive ("pasion" finds Pasión), every word must match somewhere, names rank first.
// Tapping a result opens that card in Cards, already flipped to the details.
// Loaded after app.js (uses $, esc, CARDS, setMode, setFilter, deck, idx, render, flipCard, toast).
(function () {
  const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  // [label, text] pairs per card; the first is the title
  function fieldsOf(c) {
    if (c.kind === "drink") { const d = c.d; return [["", d.name], ["Spec", d.menu], ["Glass", d.glass], ["Garnish", d.garnish], ["Build", (d.build || []).join(" · ")], ["Sell it", d.sell], ["Tape", d.bottle || (d.colors || []).join(" + ")], ["Section", d.cat]]; }
    if (c.kind === "food") { const f = c.fd; return [["", f.name], ["About", f.drop], ["Ingredients", f.ing], ["Allergens", f.all], ["Mods", f.mods], ["Tip", f.tip], ["Pairing", f.pair], ["Section", f.cat]]; }
    if (c.kind === "wine") { const w = c.w; return [["", w.name], ["Region", w.region], ["Grape", w.grape], ["Notes", w.notes], ["Like", w.like], ["Pairs with", w.pair], ["Story", w.story], ["Section", w.cat || "Wines BTG"]]; }
    const f = c.f; return [["", f.q], ["Answer", f.a], ["More", f.x], ["Section", c.cat]];
  }
  let INDEX = [];
  function build() { INDEX = CARDS.map(c => { const fl = fieldsOf(c).filter(x => x[1]); return { c, fl, n: fl.map(x => norm(x[1])) }; }); }
  function price(c) { const p = c.kind === "drink" ? c.d.price : c.kind === "food" ? c.fd.price : c.kind === "wine" ? c.w.price : ""; return p ? (c.kind === "food" && !/^\$/.test(p) ? "$" + p : p) : ""; }
  function kindLabel(c) { return c.kind === "drink" ? "Drink" : c.kind === "food" ? "Food" : c.kind === "wine" ? "Wine" : c.cat === "Allergens & Mods" ? "Allergens" : "Guide"; }
  // highlight the query words inside a snippet, keeping it short around the first hit
  function snippet(text, toks) {
    const t = String(text), n = norm(t); let at = -1, len = 0;
    toks.forEach(k => { const i = n.indexOf(k); if (i >= 0 && (at < 0 || i < at)) { at = i; len = k.length; } });
    let s = 0, e = t.length;
    if (t.length > 110 && at >= 0) { s = Math.max(0, at - 40); e = Math.min(t.length, s + 110); }
    let out = (s > 0 ? "…" : "") + t.slice(s, e) + (e < t.length ? "…" : "");
    const ks = [...new Set(toks)].filter(Boolean).sort((a, b) => b.length - a.length);
    if (!ks.length) return esc(out);
    // one pass over the plain text (accent-tolerant), then escape each piece
    const re = new RegExp(ks.map(k => [...k].map(ch => ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\u0300-\\u036f]*").join("")).join("|"), "gi");
    const src = out.normalize("NFD"); let html = "", last = 0, m;
    while ((m = re.exec(src))) { if (!m[0]) { re.lastIndex++; continue; } html += esc(src.slice(last, m.index)) + "<mark>" + esc(m[0]) + "</mark>"; last = m.index + m[0].length; }
    html += esc(src.slice(last));
    return html.normalize("NFC");
  }
  function find(q) {
    const toks = norm(q).split(/[\s,]+/).filter(Boolean);
    if (!toks.length) return { toks, hits: [] };
    const hits = [];
    INDEX.forEach(e => {
      let score = 0, where = null;
      for (const k of toks) {
        let best = 0, bi = -1;
        e.n.forEach((txt, i) => { const j = txt.indexOf(k); if (j < 0) return;
          const sc = i === 0 ? (j === 0 ? 30 : /\s/.test(txt[j - 1] || "") ? 20 : 12) : (txt[j - 1] === undefined || /[\s,(·/-]/.test(txt[j - 1]) ? 4 : 2);
          if (sc > best) { best = sc; bi = i; } });
        if (!best) return;
        score += best; if (bi > 0 && where === null) where = bi;
      }
      if (e.c.kind !== "fact") score += 3;  // a dish or drink beats a guide card that mentions it
      hits.push({ e, score, where });
    });
    hits.sort((a, b) => b.score - a.score || a.e.fl[0][1].length - b.e.fl[0][1].length || a.e.fl[0][1].localeCompare(b.e.fl[0][1]));
    return { toks, hits };
  }
  const TRIES = ["Campari", "Gluten", "Coupe", "Paella", "Albariño", "Vegan", "Mezcal", "Fryer"];
  function show(q) {
    const R = $("sResults");
    if (!norm(q).trim()) {
      $("sCount").textContent = "";
      R.innerHTML = `<div class="shint">Look up any drink, dish, wine or guide card by its name, or by what's in it: an ingredient, an allergen, a glass, a grape.<div class="tries">${TRIES.map(t => `<button type="button" data-try="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>`;
      R.querySelectorAll("[data-try]").forEach(b => b.onclick = () => { $("sq").value = b.dataset.try; show(b.dataset.try); $("sq").focus(); });
      return;
    }
    const { toks, hits } = find(q), list = hits.slice(0, 60);
    $("sCount").textContent = hits.length ? `${hits.length} result${hits.length === 1 ? "" : "s"}${hits.length > list.length ? " · showing the top " + list.length : ""}` : "";
    if (!hits.length) { R.innerHTML = `<div class="shint">Nothing matches “${esc(q)}”. Try fewer words, or part of a name.</div>`; return; }
    R.innerHTML = list.map((h, i) => {
      const c = h.e.c, fl = h.e.fl, title = fl[0][1], sub = h.where !== null && fl[h.where][0] !== "Section" ? fl[h.where] : null, p = price(c);
      return `<button type="button" class="sres" data-i="${i}"><span class="st"><span class="se">${esc(kindLabel(c))} · ${esc(c.cat)}</span><span class="sn">${snippet(title, toks)}</span>${sub ? `<span class="ss"><b>${esc(sub[0])}</b>${snippet(sub[1], toks)}</span>` : ""}</span>${p ? `<span class="sp">${esc(p)}</span>` : ""}</button>`;
    }).join("");
    R.querySelectorAll(".sres").forEach(b => b.onclick = () => openCard(list[+b.dataset.i].e.c));
  }
  // open the card in Cards, inside its own section, flipped to the details
  function openCard(c) {
    closeSearch(true);
    if (curMode !== "Flash") setMode("Flash");
    setFilter(c.cat);
    const k = cardKey(c), j = deck.findIndex(x => cardKey(x) === k);
    if (j > 0) { [deck[0], deck[j]] = [deck[j], deck[0]]; } else if (j < 0) deck.unshift(c);
    idx = 0; render();
    if (!$("card").classList.contains("flipped")) flipCard();
    window.scrollTo({ top: Math.max(0, $("pickBtn").getBoundingClientRect().top + window.scrollY - 10), behavior: "smooth" });
  }
  let lastQ = "";
  function openSearch() {
    build();
    const S = $("search"); S.classList.add("open"); S.setAttribute("aria-hidden", "false"); $("searchBtn").setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    $("sq").value = lastQ; show(lastQ);
    setTimeout(() => { $("sq").focus(); $("sq").select(); }, 60);
  }
  function closeSearch(keepFocus) {
    const S = $("search"); if (!S.classList.contains("open")) return;
    lastQ = $("sq").value; S.classList.remove("open"); S.setAttribute("aria-hidden", "true"); $("searchBtn").setAttribute("aria-expanded", "false");
    document.body.style.overflow = ""; $("sq").blur(); if (!keepFocus) $("searchBtn").focus();
  }
  let t = null;
  $("sq").addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => show($("sq").value), 80); });
  $("sq").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); const f = $("sResults").querySelector(".sres"); if (f) f.click(); } });
  $("searchBtn").onclick = openSearch;
  $("sClose").onclick = () => closeSearch();
  $("search").addEventListener("click", e => { if (e.target === $("search")) closeSearch(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && $("search").classList.contains("open")) closeSearch();
    else if (e.key === "/" && !$("search").classList.contains("open") && !/input|textarea|select/i.test((e.target && e.target.tagName) || "") && !$("gate").offsetParent) { e.preventDefault(); openSearch(); }
  });
})();
