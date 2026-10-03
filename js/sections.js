// ---- Cards + sections, shared by the trainer (index) and the manager board ----
// Needs drinks.js, food.js, guide.js, allergy.js loaded first.
const CARDS = [
...DRINKS.map(d=>({cat:d.cat, kind:"drink", d})),
...FOOD.map(f=>({cat:f.cat, kind:"food", fd:f})),
...ALLERGY_FACTS.map(f=>({cat:f.cat, kind:"fact", f})),
...FACTS.map(f=>({cat:f.cat, kind:"fact", f})),
...WINES.map(w=>({cat:w.cat||"Wines BTG", kind:"wine", w})),
];
// [label, filter value] · "hdr" rows are group titles in the sheet
const GROUPS = [
["Everything", null],
["Drinks", "hdr"],
["All drinks","drinks"],["Cócteles","Cócteles"],["Clásicos","Clásicos"],["Gin-Tonics","Gin-Tonics"],["Sangria","Sangria"],["Sin Alcohol","Sin Alcohol"],
["Food", "hdr"],
["All food","food"],["Aperitivo","Aperitivo"],["Tapas","Tapas"],["Paella","Paella"],["Postres","Postres"],["Happy Hour","Happy Hour"],["Allergens & Mods","Allergens & Mods"],
["Wine", "hdr"],
["Wines BTG","Wines BTG"],["Vino de Postre","Vino de Postre"],["Wine 101","Wine 101"],["Sherry & Vermouth","Sherry & Vermouth"],
["Resource guide", "hdr"],
["Menu Basics","Menu Basics"],["House Pours","House Pours"],["Service & Glassware","Service & Glassware"],["Spirits 101","Spirits 101"],
["Beer & Cider","Beer & Cider"],["NA Program","NA Program"],
];
const DRINKCATS = ["Cócteles","Clásicos","Gin-Tonics","Sangria","Sin Alcohol"];
const FOODCATS = ["Aperitivo","Tapas","Paella","Postres","Happy Hour"];
function cardKey(c){return c.kind==="drink"?"d:"+c.d.name:c.kind==="food"?"f:"+c.fd.name:c.kind==="wine"?"w:"+c.w.name:c.kind==="custom"?c.key:"q:"+c.f.q;}
function cardTitle(c){return c.kind==="drink"?c.d.name:c.kind==="food"?c.fd.name:c.kind==="wine"?c.w.name.split(",")[0]:c.kind==="custom"?c.title:c.f.q;}
// cards for one section value (null = everything, "drinks" / "food" = all of that kind, else a category)
function cardsFor(v){
if(v===null||v===undefined||v==="__all__") return CARDS.slice();
if(v==="drinks") return CARDS.filter(c=>DRINKCATS.includes(c.cat));
if(v==="food") return CARDS.filter(c=>FOODCATS.includes(c.cat));
return CARDS.filter(c=>c.cat===v);
}
// several sections (a quiz), no duplicates
function cardsForMany(list){ const seen=new Set(), out=[];
(list&&list.length?list:[null]).forEach(v=>cardsFor(v).forEach(c=>{ const k=cardKey(c); if(!seen.has(k)){ seen.add(k); out.push(c); } }));
return out; }
function sectionLabel(v){ if(v===null||v==="__all__") return "Everything"; const g=GROUPS.find(x=>x[1]===v); return g?g[0]:String(v); }
