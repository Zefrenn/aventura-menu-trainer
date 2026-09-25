// ---- Photos: real plate/drink shots replace the drawings when we have them ----
// Seed photos ship in /photos (taken on the pass/bar). Managers add or replace photos
// from /manager → Photos; those live in Vercel Blob and win over the seed.
// Only status "ok" photos show to staff. "pending" = needs a manager to confirm the ID.
const PHOTO_SEED = {
  "d-carajillo":        { src: SEED_IMG["d-carajillo"],        at: "Sep 2026", by: "Zefren", status: "ok",
                          note: "Shot before garnish — spec adds dehydrated orange + Maldon." },
  "d-sangre-y-semilla": { src: SEED_IMG["d-sangre-y-semilla"], at: "Sep 2026", by: "Zefren", status: "ok",
                          note: "Photo shows a dehydrated orange with the rosemary; spec lists rosemary only — confirm garnish." },
  "d-pasion-ciega":     { src: SEED_IMG["d-pasion-ciega"],     at: "Sep 2026", by: "Zefren", status: "ok",
                          note: "Kaffir leaf on the king cube; dehydrated piña not in shot." },
  "d-el-parque":        { src: SEED_IMG["d-el-parque"],        at: "Sep 2026", by: "Zefren", status: "pending",
                          note: "Tulip, pale gold, green wheel — looks like El Parque. Confirm before staff see it." },
};
let PHOTO_IDX = {};
function photoId(kind, name) {
  return kind + "-" + String(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
// all=true (manager) returns hidden/pending too
function photoOf(kind, name, all) {
  const id = photoId(kind, name), x = PHOTO_IDX[id], s = PHOTO_SEED[id];
  let p = null;
  if (x && x.src === "blob") p = { id, url: `/api/photo?id=${id}&v=${x.v}`, at: x.at, by: x.by, note: x.note, status: x.status || "ok", src: "blob" };
  else if (s) p = { id, url: s.src, at: s.at, by: s.by, note: (x && x.note !== undefined) ? x.note : s.note, status: (x && x.status) || s.status, src: "seed" };
  if (!p) return null;
  return (all || p.status === "ok") ? p : null;
}
function photoWhen(p) {
  if (!p || !p.at) return "";
  return typeof p.at === "number" ? new Date(p.at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : p.at;
}
async function loadPhotoIndex() {
  try { const r = await fetch("/api/photo?list=1", { cache: "no-store" }); if (r.ok) PHOTO_IDX = (await r.json()) || {}; } catch (e) {}
  return PHOTO_IDX;
}
// photo if we have one, otherwise the drawing (and the drawing is the fallback if the image fails)
function visual(kind, name, svg, cls, size) {
  const p = photoOf(kind, name);
  const fb = svg ? `<div class="${cls}${size === "mini" ? " mini" : ""}"${p ? " hidden" : ""}>${svg}</div>` : "";
  if (!p) return fb;
  const cap = size ? "" : `<figcaption>${kind === "f" ? "Plate" : "Drink"} photo · ${photoWhen(p)}</figcaption>`;
  return `<figure class="ph${size ? " ph-" + size : ""}"><img src="${p.url}" alt="${size === "q" ? "" : name}" loading="lazy" decoding="async" onerror="var f=this.parentNode;if(f.nextElementSibling)f.nextElementSibling.hidden=false;f.remove()">${cap}</figure>${fb}`;
}
