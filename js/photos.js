// ---- Photos: real plate/drink shots replace the drawings when we have them ----
// Seed photos ship in /img (pro shoot Oct 2026 + pass shots Sep 2026). Managers add or replace photos
// from /manager → Photos; those live in Vercel Blob and win over the seed.
// Only status "ok" photos show to staff. "pending" = needs a manager to confirm the ID.
const PHOTO_SEED = {
  // drinks — pro shoot, Oct 2026 (static files in /img). Carajillo keeps the Sep base64 seed (no new shot).
  "d-carajillo":        { src: SEED_IMG["d-carajillo"], at: "Sep 2026", by: "Zefren", status: "ok",
    note: "Shot before garnish — spec adds dehydrated orange + Maldon." },
  "d-mare-nostrum": { src: "/img/p-d-mare-nostrum.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Nick & Nora, foam, dehydrated lime — as spec." },
  "d-la-huerta": { src: "/img/p-d-la-huerta.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Coupe, foam. Shot shows a partial sugar rim and a dried apple chip; current spec is a sugar rim only." },
  "d-pasion-ciega": { src: "/img/p-d-pasion-ciega.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Fluted rocks glass over ice, kaffir leaf + dehydrated piña — as spec." },
  "d-el-arbol-de-guernica": { src: "/img/p-d-el-arbol-de-guernica.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Collins, mint sprig. Grated cinnamon not visible in the shot — confirm it's the current serve." },
  "d-sinfonia-agridulce": { src: "/img/p-d-sinfonia-agridulce.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Collins over ice, cherry pepper + dehydrated orange on a pick — as spec (reads amber rather than red)." },
  "d-sangre-y-semilla": { src: "/img/p-d-sangre-y-semilla.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Goblet. Photo shows the older rosemary + dehydrated orange garnish; current spec is sage leaf + blood orange." },
  "d-orden-del-medico": { src: "/img/p-d-orden-del-medico.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Goblet, cucumber ribbon, juniper berries, mint — as spec." },
  "d-tinta": { src: "/img/p-d-tinta.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Goblet over ice, orange in the glass, straw — keg pour." },
  "d-suenos-de-suerte": { src: "/img/p-d-suenos-de-suerte.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Coupe, foam, dehydrated lime wheel — as spec." },
  "d-dama-rosa": { src: "/img/p-d-dama-rosa.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Tulip over ice. Photo shows cucumber, mint + juniper; current spec is cucumber + loose mint (no juniper)." },
  "d-el-parque": { src: "/img/p-d-el-parque.webp", at: "Oct 2026", by: "Zefren", status: "pending",
    note: "Tulip. Photo shows the summer serve (dehydrated lime + dried flower); current garnish is a grape. Confirm before staff see it." },
  // plates — pro shoot, Oct 2026. Sep 2026 pass shots kept where no better frame exists (primavera, tarta de queso).
  "f-encurtidos": { src: "/img/p-f-encurtidos.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Olives, pickled cauliflower, carrot, cornichons in the cazuela." },
  "f-sardinas": { src: "/img/p-f-sardinas.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Tin on the board with the lid, salsa verde + piparras in the cazuela, house chips." },
  "f-anchoas-con-piperrada": { src: "/img/p-f-anchoas-con-piperrada.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "White + brown anchovies on grilled baguette with piperade." },
  "f-quesos-y-charcuteria": { src: "/img/p-f-quesos-y-charcuteria.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Board: three cheeses, jamón, chorizo, salami, membrillo, pickles, Marcona almonds, jam; baguette on the side." },
  "f-pan-a-la-catalana": { src: "/img/p-f-pan-a-la-catalana.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Grilled sourdough with grated tomato — shown with the +2 jamón and +2 boquerones add-ons." },
  "f-almendras-y-pina": { src: "/img/p-f-almendras-y-pina.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "One crostini: brûléed pineapple over goat cheese–almond spread, Maldon." },
  "f-crudo-de-atun": { src: "/img/p-f-crudo-de-atun.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Tableside pour of the watermelon aguachile over the tuna and cucumber." },
  "f-tortilla-espanola": { src: "/img/p-f-tortilla-espanola.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Round tortilla on the pedestal, piped alioli + chives, brava dots. Shishitos are inside." },
  "f-patatas-bravas": { src: "/img/p-f-patatas-bravas.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Shown with the +2 fried egg; brava sauce + aioli underneath." },
  "f-datiles-con-chorizo": { src: "/img/p-f-datiles-con-chorizo.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Four bacon-wrapped dates over Dijon membrillo, chives, on the pedestal." },
  "f-pimientos-de-padron": { src: "/img/p-f-pimientos-de-padron.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Blistered shishitos, smoked salt, lemon, parsley." },
  "f-berenjena-frita": { src: "/img/p-f-berenjena-frita.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Fried eggplant, chili honey, pimentón, blue cheese crumble." },
  "f-setas": { src: "/img/p-f-setas.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "King trumpet coins, ají verde, puffed quinoa." },
  "f-croquetas-de-manchego": { src: "/img/p-f-croquetas-de-manchego.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "The croqueta with grated cheese on top over quince." },
  "f-croquetas-de-setas-y-trufa": { src: "/img/p-f-croquetas-de-setas-y-trufa.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "The croqueta with the truffle mayo dot." },
  "f-croquetas-de-jamon": { src: "/img/p-f-croquetas-de-jamon.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "The croqueta with the hazelnut romesco dot." },
  "f-gambas": { src: "/img/p-f-gambas.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Prawns, fried garlic chips, chile de árbol, grilled baguette — served in the white bowl." },
  "f-pulpo-a-la-gallega": { src: "/img/p-f-pulpo-a-la-gallega.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Octopus, pimentón, saffron potato — hero shot." },
  "f-pepa-en-adobo": { src: "/img/p-f-pepa-en-adobo.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Fried swordfish bites, lemon aioli, chives." },
  "f-pluma-katsu": { src: "/img/p-f-pluma-katsu.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Sliced katsu with sherry tonkatsu and chives, being cut." },
  "f-flor-de-alcachofa": { src: "/img/p-f-flor-de-alcachofa.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Grilled artichoke over anchovy aioli, grated cured egg yolk." },
  "f-pintxos-morunos": { src: "/img/p-f-pintxos-morunos.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Skirt-steak skewers over tomatillo salsa with purée and greens. Beets not in shot." },
  "f-bunuelos-de-bacalao": { src: "/img/p-f-bunuelos-de-bacalao.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Salt-cod fritters on the pedestal with piquillo cream." },
  "f-marinera-fideua": { src: "/img/p-f-marinera-fideua.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Fideo noodles, prawns, chile de árbol, overhead in the pan." },
  "f-rabo-de-toro": { src: "/img/p-f-rabo-de-toro.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Socarrat rice with the piparra peppers, overhead in the pan." },
  "f-senorito": { src: "/img/p-f-senorito.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Aioli dots + charred calamari over the rice. ID from the plating — kitchen to confirm." },
  "f-valenciana": { src: "/img/p-f-valenciana.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Chicken, beans, artichoke, rosemary — single pan." },
  "f-avenchurros": { src: "/img/p-f-avenchurros.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Churros with the chocolate and caramel dips — the dinner version." },
  "f-goxua": { src: "/img/p-f-goxua.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Footed glass, brûléed passion-fruit top, viola; layers on the spoon." },
  "f-tarta-de-santiago": { src: "/img/p-f-tarta-de-santiago.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Wedge with powdered sugar + vanilla ice cream ramekin." },
  "f-bizcocho-de-chocolate-y-pistacho": { src: "/img/p-f-bizcocho-de-chocolate-y-pistacho.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Brownie with pistachio and sea salt, ice cream ramekin." },
  "f-gildas-tradicional": { src: "/img/p-f-gildas-tradicional.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "One skewer: boquerón, piparra, cornichon, olive (older shoot, same build)." },
  "f-jamon-y-manchego": { src: "/img/p-f-jamon-y-manchego.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Crostini with jamón, manchego and quince." },
  "f-papas-fritas-y-jamon": { src: "/img/p-f-papas-fritas-y-jamon.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "House chips with draped serrano on the wood plate." },
  "f-churritos-y-chocolate": { src: "/img/p-f-churritos-y-chocolate.webp", at: "Oct 2026", by: "Zefren", status: "ok",
    note: "Mini churros with the chocolate dip (older shoot, same plate)." },
  "f-americana": { src: "/img/p-f-americana.webp", at: "Oct 2026", by: "Zefren", status: "pending",
    note: "Sausage, broccolini, peas, piquillo, grilled lemon. ID from the plating — kitchen to confirm before staff see it." },
  "f-primavera":               { src: "/img/p-f-primavera.webp", at: "Sep 2026", by: "Zefren", status: "ok" },
  "f-tarta-de-queso":          { src: "/img/p-f-tarta-de-queso.webp", at: "Sep 2026", by: "Zefren", status: "ok" },
};
let PHOTO_IDX = {};
// Dishes renamed for the 9/11 menu — photos already uploaded under the old id keep working.
const PHOTO_ALIAS = { "f-pepa-en-adobo": "f-mahi-en-adobo", "f-goxua": "f-passionfruit-goxua", "f-avenchurros": "f-churros", "f-gambas": "f-gambas-al-ajillo", "f-primavera": "f-paella-primavera", "d-sinfonia-agridulce": "d-pecas" };
function photoId(kind, name) {
  return kind + "-" + String(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
// all=true (manager) returns hidden/pending too
function photoOf(kind, name, all) {
  let id = photoId(kind, name), x = PHOTO_IDX[id], s = PHOTO_SEED[id];
  if (!x && !s && PHOTO_ALIAS[id]) { id = PHOTO_ALIAS[id]; x = PHOTO_IDX[id]; s = PHOTO_SEED[id]; }
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
// photo if we have one, otherwise the drawing (the drawing is also the fallback if the image fails).
// Photos are shown with object-fit:contain so the WHOLE plate/glass is always visible.
function visual(kind, name, svg, cls, size) {
  const p = photoOf(kind, name);
  const fb = svg ? `<div class="${cls}${size === "mini" ? " mini" : ""}" data-fb="1"${p ? " hidden" : ""}>${svg}</div>` : "";
  if (!p) return fb;
  const alt = size === "q" ? "Photo of the item to identify" : size === "qs" ? "Photo of the item as served" : `${name} — ${kind === "f" ? "plate" : "drink"} as served`;
  const cap = size ? "" : `<div class="phcap">${kind === "f" ? "Plate" : "Drink"} as served · photo ${photoWhen(p)}</div>`;
  return `<div class="phwrap"><figure class="ph${size ? " ph-" + size : ""}"><img class="bg" src="${p.url}" alt="" aria-hidden="true"><img class="fg" src="${p.url}" alt="${alt}" decoding="async" onerror="var w=this.closest('.phwrap'),d=w.querySelector('[data-fb]');if(d)d.hidden=false;w.querySelectorAll('figure,.phcap').forEach(function(x){x.remove()})"></figure>${cap}${fb}</div>`;
}
