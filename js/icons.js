const AICON={
gluten:'<svg viewBox="0 0 16 16"><path d="M8 15V6"/><path d="M8 6c-2 0-3-1.5-3-3 2 0 3 1 3 3zM8 6c2 0 3-1.5 3-3-2 0-3 1-3 3zM8 9c-2 0-3-1.5-3-3 2 0 3 1 3 3zM8 9c2 0 3-1.5 3-3-2 0-3 1-3 3zM8 12c-2 0-3-1.5-3-3 2 0 3 1 3 3zM8 12c2 0 3-1.5 3-3-2 0-3 1-3 3z"/></svg>',
dairy:'<svg viewBox="0 0 16 16"><path d="M5 2h6v2l1.5 3v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V7L5 4z"/><path d="M4 9h8"/></svg>',
egg:'<svg viewBox="0 0 16 16"><path d="M8 1.5c-2.5 0-5 4-5 8a5 5 0 0 0 10 0c0-4-2.5-8-5-8z"/></svg>',
fish:'<svg viewBox="0 0 16 16"><path d="M2 8c2-3 5-4 8-4 1.5 1 3 2.5 4 4-1 1.5-2.5 3-4 4-3 0-6-1-8-4z"/><path d="M10 4l3 4-3 4"/><circle cx="5" cy="7.5" r=".6" fill="currentColor"/></svg>',
shellfish:'<svg viewBox="0 0 16 16"><path d="M3 5c3-3 8-2 9 2 .5 2-1 4-3 4h-3"/><path d="M3 5c-1 2 0 4 2 5M6 11c-1 1-2 2.5-1.5 3.5M9 11c.5 1.5 1.5 2 2 3"/><circle cx="5.5" cy="5.5" r=".6" fill="currentColor"/></svg>',
mollusk:'<svg viewBox="0 0 16 16"><path d="M4 12c-2-3-1-8 4-8s6 5 4 8"/><path d="M4 12h8"/><path d="M8 4v8M5.5 5.5L8 12M10.5 5.5L8 12"/></svg>',
nut:'<svg viewBox="0 0 16 16"><path d="M8 2c3 0 5 3 5 6.5 0 3-2 5.5-5 5.5S3 11.5 3 8.5C3 5 5 2 8 2z"/><path d="M4 6h8"/></svg>',
soy:'<svg viewBox="0 0 16 16"><path d="M3 12c0-5 4-9 9-9 0 5-4 9-9 9z"/><circle cx="6.5" cy="8.5" r="1"/><circle cx="9" cy="6" r="1"/></svg>',
sesame:'<svg viewBox="0 0 16 16"><ellipse cx="5" cy="10" rx="1.6" ry="2.4"/><ellipse cx="8" cy="5" rx="1.6" ry="2.4"/><ellipse cx="11" cy="10" rx="1.6" ry="2.4"/></svg>',
pork:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8.5" r="5.5"/><ellipse cx="8" cy="9.5" rx="2.5" ry="1.8"/><circle cx="7" cy="9.5" r=".5" fill="currentColor"/><circle cx="9" cy="9.5" r=".5" fill="currentColor"/><path d="M4 5l-1-2M12 5l1-2"/></svg>',
nightshade:'<svg viewBox="0 0 16 16"><path d="M10 3c-3 0-6 3-6 7 0 2 1 3 2 4 4-1 6-4 6-8 0-1-1-2-2-3z"/><path d="M10 3c1-1 2-1 3 0"/></svg>',
allium:'<svg viewBox="0 0 16 16"><path d="M8 5c-3 0-5 2.5-5 5.5S5.5 15 8 15s5-1.5 5-4.5S11 5 8 5z"/><path d="M8 5V2M6.5 5.5L5 3M9.5 5.5L11 3"/></svg>',
citrus:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M8 2v12M2 8h12M3.8 3.8l8.4 8.4M12.2 3.8l-8.4 8.4"/></svg>',
vinegar:'<svg viewBox="0 0 16 16"><path d="M6 1.5h4v3l2 3v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6l2-3z"/></svg>',
mustard:'<svg viewBox="0 0 16 16"><path d="M4 6h8v7a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 13z"/><path d="M6 6V3h4v3"/></svg>',
honey:'<svg viewBox="0 0 16 16"><path d="M8 2l5 3v6l-5 3-5-3V5z"/></svg>',
fruit:'<svg viewBox="0 0 16 16"><path d="M8 5c-3-1-5 1-5 4s2 5 3 5 1-.5 2-.5 1 .5 2 .5 3-2 3-5-2-5-5-4z"/><path d="M8 5V2M8 2c1 0 2 .5 2.5 1.5"/></svg>',
herb:'<svg viewBox="0 0 16 16"><path d="M3 13C3 7 7 3 13 3c0 6-4 10-10 10z"/><path d="M3 13l6-6"/></svg>',
alcohol:'<svg viewBox="0 0 16 16"><path d="M4 2h8l-4 6v5"/><path d="M5 14h6"/></svg>',
corn:'<svg viewBox="0 0 16 16"><path d="M8 1.5c2.5 0 4 4 4 8s-1.5 5-4 5-4-1-4-5 1.5-8 4-8z"/><path d="M8 3v11M5.5 6.5h5M5 10h6"/></svg>',
caffeine:'<svg viewBox="0 0 16 16"><path d="M3 6h8v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/><path d="M11 7h1.5a1.5 1.5 0 0 1 0 3H11"/></svg>',
sunflower:'<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="2.5"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2M3.8 3.8l1.4 1.4M10.8 10.8l1.4 1.4M12.2 3.8l-1.4 1.4M5.2 10.8l-1.4 1.4"/></svg>',
msg:'<svg viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="2"/><path d="M6 8h4"/></svg>',
legumes:'<svg viewBox="0 0 16 16"><path d="M3 12c0-5 4-9 9-9 0 5-4 9-9 9z"/><circle cx="6.5" cy="8.5" r="1"/><circle cx="9" cy="6" r="1"/></svg>',
cilantro:'<svg viewBox="0 0 16 16"><path d="M3 13C3 7 7 3 13 3c0 6-4 10-10 10z"/><path d="M3 13l6-6"/></svg>'
};
function aicon(word){const w=word.toLowerCase();
const k=/gluten|wheat/.test(w)?"gluten":/dairy|milk/.test(w)?"dairy":/egg/.test(w)?"egg":/shellfish|crustacean|shrimp|prawn/.test(w)?"shellfish":/mollusk/.test(w)?"mollusk":/fish/.test(w)?"fish":/nut|almond|pistachio|hazelnut/.test(w)?"nut":/soy/.test(w)?"soy":/sesame/.test(w)?"sesame":/pork|jamón|gelatin/.test(w)?"pork":/nightshade/.test(w)?"nightshade":/allium/.test(w)?"allium":/citrus/.test(w)?"citrus":/vinegar/.test(w)?"vinegar":/mustard|dijon/.test(w)?"mustard":/honey/.test(w)?"honey":/fruit/.test(w)?"fruit":/cilantro|herb/.test(w)?"cilantro":/alcohol/.test(w)?"alcohol":/corn/.test(w)?"corn":/caffeine/.test(w)?"caffeine":/sunflower/.test(w)?"sunflower":/legume/.test(w)?"legumes":null;
return k?AICON[k]:"";}
const WGLASS={
dessert:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100"><path d="M20 14h20l-1 26c0 8-4 12-9 12s-9-4-9-12z" fill="#C98A4A" stroke="#55565A" stroke-width="2.5"/><path d="M20 14h20l-.5 8h-19z" fill="rgba(255,255,255,.45)"/><path d="M30 52v28M20 82h20" stroke="#55565A" stroke-width="2.5" stroke-linecap="round"/></svg>',
sparkling:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100"><path d="M24 8h12l2 40c0 8-4 12-8 12s-8-4-8-12z" fill="#F3E3B1" stroke="#55565A" stroke-width="2.5"/><path d="M30 60v26M18 88h24" stroke="#55565A" stroke-width="2.5" stroke-linecap="round"/><circle cx="28" cy="30" r="1.2" fill="#fff"/><circle cx="32" cy="40" r="1.2" fill="#fff"/><circle cx="29" cy="48" r="1.2" fill="#fff"/></svg>',
rose:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100"><path d="M14 8h32l-2 34c0 10-6 16-14 16s-14-6-14-16z" fill="#F0B8B0" stroke="#55565A" stroke-width="2.5"/><path d="M14 8h32l-1 12H15z" fill="rgba(255,255,255,.5)"/><path d="M30 58v26M18 86h24" stroke="#55565A" stroke-width="2.5" stroke-linecap="round"/></svg>',
white:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100"><path d="M14 8h32l-2 34c0 10-6 16-14 16s-14-6-14-16z" fill="#F0E5A8" stroke="#55565A" stroke-width="2.5"/><path d="M14 8h32l-1 12H15z" fill="rgba(255,255,255,.5)"/><path d="M30 58v26M18 86h24" stroke="#55565A" stroke-width="2.5" stroke-linecap="round"/></svg>',
red:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100"><path d="M10 8h40l-3 32c0 12-8 18-17 18S13 52 13 40z" fill="#8E2C36" stroke="#55565A" stroke-width="2.5"/><path d="M10 8h40l-1 10H11z" fill="rgba(255,255,255,.45)"/><path d="M30 58v26M18 86h24" stroke="#55565A" stroke-width="2.5" stroke-linecap="round"/></svg>'
};
function wineKind(w){if(w.kind) return w.kind; const n=w.name.toLowerCase(); if(/cava|brut/.test(n))return "sparkling"; if(/rosado|rosé/.test(n))return "rose"; if(/albari|viura|albar|xarel|chardonnay|blanco/.test(n))return "white"; return "red";}
const GICON={
"Coupe":'<svg viewBox="0 0 40 60"><path d="M6 8h28c0 10-6 16-14 16S6 18 6 8z" fill="#FBFAF9" stroke="#55565A" stroke-width="2"/><path d="M20 24v24M11 50h18" stroke="#55565A" stroke-width="2" stroke-linecap="round"/></svg>',
"Nick & Nora":'<svg viewBox="0 0 40 60"><path d="M10 8h20c1 10-3 18-10 18S9 18 10 8z" fill="#FBFAF9" stroke="#55565A" stroke-width="2"/><path d="M20 26v22M11 50h18" stroke="#55565A" stroke-width="2" stroke-linecap="round"/></svg>',
"Rocks":'<svg viewBox="0 0 40 60"><path d="M8 16h24v30a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" fill="#FBFAF9" stroke="#55565A" stroke-width="2"/><rect x="13" y="24" width="14" height="14" fill="rgba(255,255,255,.7)" stroke="#55565A" stroke-width="1.2"/></svg>',
"Collins":'<svg viewBox="0 0 40 60"><path d="M12 6h16v42a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3z" fill="#FBFAF9" stroke="#55565A" stroke-width="2"/><path d="M14 20h12M14 30h12" stroke="rgba(85,86,90,.2)" stroke-width="1.5"/></svg>',
"Goblet":'<svg viewBox="0 0 40 60"><path d="M6 6h28l-1 18c0 10-6 15-13 15S7 34 7 24z" fill="#FBFAF9" stroke="#55565A" stroke-width="2"/><path d="M20 39v11M11 52h18" stroke="#55565A" stroke-width="2" stroke-linecap="round"/></svg>',
"Tulip":'<svg viewBox="0 0 40 60"><path d="M12 6h16l3 14c0 10-4 16-11 16S9 30 9 20z" fill="#FBFAF9" stroke="#55565A" stroke-width="2"/><path d="M20 36v14M12 52h16" stroke="#55565A" stroke-width="2" stroke-linecap="round"/></svg>',
"Neat glass":'<svg viewBox="0 0 40 60"><path d="M13 22h14l1 24a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2z" fill="#FBFAF9" stroke="#55565A" stroke-width="2"/></svg>',
"Wine (bar)":'<svg viewBox="0 0 40 60"><path d="M10 6h20l-1 20c0 8-4 12-9 12s-9-4-9-12z" fill="#FBFAF9" stroke="#55565A" stroke-width="2"/><path d="M20 38v12M12 52h16" stroke="#55565A" stroke-width="2" stroke-linecap="round"/></svg>',
"Flute":'<svg viewBox="0 0 40 60"><path d="M15 6h10l1 26c0 5-3 8-6 8s-6-3-6-8z" fill="#FBFAF9" stroke="#55565A" stroke-width="2"/><path d="M20 40v10M12 52h16" stroke="#55565A" stroke-width="2" stroke-linecap="round"/></svg>',
"White wine glass":'<svg viewBox="0 0 40 60"><path d="M11 6h18l-1 22c0 7-4 11-8 11s-8-4-8-11z" fill="#FBFAF9" stroke="#55565A" stroke-width="2"/><path d="M20 39v11M12 52h16" stroke="#55565A" stroke-width="2" stroke-linecap="round"/></svg>',
"AP glass":'<svg viewBox="0 0 40 60"><path d="M9 6h22l-2 22c0 8-5 12-9 12s-9-4-9-12z" fill="#FBFAF9" stroke="#55565A" stroke-width="2"/><path d="M20 40v10M12 52h16" stroke="#55565A" stroke-width="2" stroke-linecap="round"/></svg>'
};
