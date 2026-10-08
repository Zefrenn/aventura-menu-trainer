// ---- Cards + sections, shared by the trainer (index) and the manager board ----
// Needs drinks.js, food.js, guide.js, allergy.js loaded first.
// Everything here is rebuilt by buildCards() after live content from /manager → Menu is applied
// (js/content.js), so the arrays are filled in place and other scripts can keep their references.
const CARDS = [], GROUPS = [], DRINKCATS = [], FOODCATS = [];
// Default order of sections. New sections a manager adds land at the end of their group.
const BASE_DRINKCATS = ["Cócteles","Clásicos","Gin-Tonics","Sangria","Sin Alcohol"];
const BASE_FOODCATS = ["Aperitivo","Tapas","Paella","Postres","Happy Hour"];
const WINECATS = ["Wines BTG","Vino de Postre"];
const BASE_WINEFACTS = ["Wine 101","Sherry & Vermouth"];
const BASE_GUIDECATS = ["Menu Basics","House Pours","Service & Glassware","Spirits 101","Beer & Cider","NA Program"];
const ALLERGYCAT = "Allergens & Mods";
function buildCards(){
const fill=(arr,list)=>{ arr.splice(0,arr.length,...list); return arr; };
const ordered=(base,cats)=>{ const have=[...new Set(cats.filter(Boolean))]; return [...base.filter(c=>have.includes(c)),...have.filter(c=>!base.includes(c))]; };
fill(CARDS,[
...DRINKS.map(d=>({cat:d.cat, kind:"drink", d})),
...FOOD.map(f=>({cat:f.cat, kind:"food", fd:f})),
...ALLERGY_FACTS.map(f=>({cat:f.cat||ALLERGYCAT, kind:"fact", f})),
...FACTS.map(f=>({cat:f.cat, kind:"fact", f})),
...WINES.map(w=>({cat:w.cat||"Wines BTG", kind:"wine", w})),
]);
fill(DRINKCATS,ordered(BASE_DRINKCATS,DRINKS.map(d=>d.cat)));
fill(FOODCATS,ordered(BASE_FOODCATS,FOOD.map(f=>f.cat)));
const factCats=FACTS.map(f=>f.cat);
const wineGrp=[...ordered(WINECATS,WINES.map(w=>w.cat||"Wines BTG")),...BASE_WINEFACTS.filter(c=>factCats.includes(c))];
const placed=new Set([...DRINKCATS,...FOODCATS,...wineGrp,ALLERGYCAT]);
const guideGrp=ordered(BASE_GUIDECATS,factCats).filter(c=>!placed.has(c));
const foodGrp=[...FOODCATS,...(ALLERGY_FACTS.length?[ALLERGYCAT]:[])];
// [label, filter value] · "hdr" rows are group titles in the sheet
const g=[["Everything", null]];
if(DRINKCATS.length) g.push(["Drinks","hdr"],["All drinks","drinks"],...DRINKCATS.map(c=>[c,c]));
if(foodGrp.length) g.push(["Food","hdr"],...(FOODCATS.length?[["All food","food"]]:[]),...foodGrp.map(c=>[c,c]));
if(wineGrp.length) g.push(["Wine","hdr"],...wineGrp.map(c=>[c,c]));
if(guideGrp.length) g.push(["Resource guide","hdr"],...guideGrp.map(c=>[c,c]));
fill(GROUPS,g);
}
buildCards();
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
