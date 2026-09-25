// Diet codes now match the PRINTED menu legend: V vegetarian · VG vegan · GF gluten-free · DF dairy-free · P pescatarian (derived)
// Strict = printed on the menu (or logically implied, e.g. vegan ⇒ vegetarian & dairy-free).
// "X*" = only with the listed mod, OR not printed on the menu — say the mod / ask Chef before you promise it.
const DIET={
"Encurtidos":["VG","V","GF","DF"],"Quesos":["V","GF*"],"Sardinas":["P","DF","GF*"],"Anchoas con Piperrada":["P","DF"],
"Escalivada":["V","VG*","DF*","GF*"],"Ajo Blanco":["DF","GF","V*","VG*"],"Quesos y Charcutería":["GF*"],"Pan a la Catalana":["VG","V","DF"],"Almendras y Piña":["V"],
"Crudo de Atún":["P","GF","DF"],"Tortilla Española":["V","GF*","DF*"],"Patatas Bravas":["V","DF","GF*"],"Dátiles con Chorizo":["GF","DF"],
"Pimientos de Padrón":["VG","V","DF","GF*"],"Berenjena Frita":["V","DF*","GF*"],"Setas":["V"],"Croquetas de Setas y Trufa":["V"],"Croquetas de Jamón":[],
"Croquetas de Manchego":["V"],"Gambas":["P","DF*","GF*"],"Pulpo a la Gallega":["P","GF","DF*"],"Pepa en Adobo":["P","DF*","GF*"],"Pluma Katsu":["DF"],
"Flor de Alcachofa":["P","DF","V*","GF*"],"Pintxos Morunos":["DF","GF*"],"Buñuelos de Bacalao":["P"],
"Marinera Fideuà":["P","DF"],"Rabo de Toro":["GF","DF"],"Americana":["GF","DF"],"Señorito":["P","GF","DF"],"Valenciana":["GF","DF"],"Primavera":["GF","VG","V","DF"],
"AvenChurros":["V"],"Tarta de Queso":["V","GF*"],"Goxua":["GF"],"Torrijas":["V"],"Tarta de Santiago":["GF","V*","DF*"],"Bizcocho de Chocolate y Pistacho":["V*"],
"Gildas Tradicional":["P","DF*","GF*"],"Jamón y Manchego":[],"Papas Fritas y Jamón":["DF*","GF*"],"Churritos y Chocolate":["V*"]
};
const DIETNAME={V:"Vegetarian",VG:"Vegan",P:"Pescatarian",GF:"Gluten-free",DF:"Dairy-free"};
const DIETNOTE={
"Quesos":"GF: no baguette",
"Sardinas":"GF: chips share the fryer — sub baguette is NOT GF; ask Chef",
"Escalivada":"printed V only — ask Chef about vegan / DF / GF (baguette on the side)",
"Ajo Blanco":"V / VG: no jamón",
"Quesos y Charcutería":"GF: no baguette / crackers",
"Tortilla Española":"GF / DF not printed — alioli is egg-based, no dairy in the tortilla; confirm with Chef",
"Patatas Bravas":"GF: shared fryer",
"Pimientos de Padrón":"GF: shared fryer",
"Berenjena Frita":"DF: no blue cheese · GF: shared fryer",
"Gambas":"served with baguette — no bread for GF; DF not printed, confirm",
"Pulpo a la Gallega":"DF: no saffron potatoes",
"Pepa en Adobo":"DF / GF not printed — cornstarch batter, shared fryer; confirm with Chef",
"Flor de Alcachofa":"V: sub garlic aioli · GF: gluten cross-contact",
"Pintxos Morunos":"GF: Chef preps the meat separately",
"Tarta de Queso":"GF: trace flour — ask Chef",
"Tarta de Santiago":"V: cake is eggs + almond (not printed) · DF: no ice cream",
"Bizcocho de Chocolate y Pistacho":"no flags printed — vegetarian in practice, confirm",
"Gildas Tradicional":"no flags printed — no gluten or dairy in the pintxo; confirm",
"Papas Fritas y Jamón":"no flags printed — shared fryer",
"Churritos y Chocolate":"no flags printed — vegetarian in practice, confirm"
};
// vegan implies vegetarian: show VEGAN only when both are strict
function dietBadges(name){const t=(DIET[name]||[]).filter(x=>!(x==="V"&&(DIET[name]||[]).includes("VG"))); if(!t.length) return `<div class="diet"><span class="dbadge NONE">NO DIET FLAGS PRINTED</span></div>`;
return `<div class="diet">${t.map(x=>{const m=x.endsWith("*");const k=x.replace("*","");return `<span class="dbadge ${k} ${m?"mod":""}">${DIETNAME[k].toUpperCase()}${m?" w/ mod":""}</span>`;}).join("")}</div>${DIETNOTE[name]?`<div class="cc note">${DIETNOTE[name]}</div>`:""}`;}
