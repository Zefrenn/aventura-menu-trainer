// ---- Pronunciation: the phone's built-in Spanish voice (Web Speech API) ----
// No audio files to record or host. Tap once = normal speed, tap again within 4s = slow.
const Say = (function () {
  const ok = typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
  let voice = null, last = { t: "", at: 0, slow: false }, activeBtn = null;
  function pickVoice() {
    if (!ok) return;
    const vs = speechSynthesis.getVoices() || [];
    const es = vs.filter(v => /^es([-_]|$)/i.test(v.lang));
    voice = es.find(v => /^es[-_]ES/i.test(v.lang) && /m[oó]nica|jorge|lucia|luc[ií]a|google|enhanced|premium/i.test(v.name))
         || es.find(v => /^es[-_]ES/i.test(v.lang)) || es[0] || null;
  }
  if (ok) { pickVoice(); if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", pickVoice); else speechSynthesis.onvoiceschanged = pickVoice; }
  // Names the Spanish voice would mangle as written (Basque/Catalan spellings, brand casing)
  const FIX = [[/AvenChurros/g, "Aven Churros"], [/Pintxos/g, "Pinchos"], [/Txakolina/g, "Chacolina"], [/Goxua/g, "Goshua"], [/l·l/g, "l"], [/\s*\/\s*/g, ", "], [/&/g, " y "], [/['‘’"“”]/g, ""]];
  function clean(t) { let s = String(t); FIX.forEach(([a, b]) => { s = s.replace(a, b); }); return s.trim(); }
  // English-named bottles: skip rather than read them in a Spanish accent
  const SKIP = /Rare Wine Co|East India/i;
  function can(name) { return ok && !!name && !SKIP.test(name); }
  function speak(text, btn) {
    if (!ok) return;
    const now = Date.now(), slow = last.t === text && now - last.at < 4000 && !last.slow;
    last = { t: text, at: now, slow };
    try { speechSynthesis.cancel(); } catch (e) {}
    const u = new SpeechSynthesisUtterance(clean(text));
    u.lang = voice ? voice.lang : "es-ES"; if (voice) u.voice = voice;
    u.rate = slow ? 0.62 : 0.9;
    if (activeBtn) activeBtn.classList.remove("speaking");
    if (btn) { activeBtn = btn; btn.classList.add("speaking"); const done = () => btn.classList.remove("speaking"); u.onend = done; u.onerror = done; setTimeout(done, 6000); }
    speechSynthesis.speak(u);
    if (slow && typeof toast === "function") toast("Más despacio · slower");
  }
  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="w" d="M16.5 9a4 4 0 0 1 0 6"/><path class="w w2" d="M19 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
  // HTML for a speaker button; iconOnly for tight spots
  function btn(name, iconOnly) {
    if (!can(name)) return "";
    const a = String(name).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    return iconOnly
      ? `<button type="button" class="say icon" data-say="${a}" aria-label="Hear how to say ${a}">${ICON}</button>`
      : `<button type="button" class="say" data-say="${a}" aria-label="Hear how to say ${a}">${ICON}<span>Escuchar · Hear it</span></button>`;
  }
  // one delegated listener for every speaker button on the page
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-say]"); if (!b) return;
    e.preventDefault(); e.stopPropagation(); speak(b.dataset.say, b);
  });
  return { ok, can, speak, btn };
})();
