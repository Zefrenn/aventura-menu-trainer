// Aventura Menu Trainer — app (v4: brand redesign + swipe deck)
// theme: recolor the drawings for dark mode, wire the moon/sun button
inkSVG(ILLUS,FOODILLUS,WGLASS,GICON); AVTheme.bind();
// photos: fetch the index, then repaint the card on screen (without counting a view)
loadPhotoIndex().then(()=>{ if(deck.length) render(true); });
// ---------- unified cards ----------
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
const MAJOR=/gluten|dairy|egg|fish|shellfish|crustacean|mollusk|nut|soy|sesame|pork|mustard|dijon/i;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");
let filter=null, deck=[], idx=0, score={right:0,total:0}, currentQ=null, answered=false, weakOnly=false;
let swipeRates = localStorage.getItem("av_swipe_rates")!=="0";
// ---------- progress (per device, per name) ----------
const STORE="av_trainer_v1";
function loadStore(){try{return JSON.parse(localStorage.getItem(STORE)||"{}");}catch(e){return {};}}
function saveStore(st){try{localStorage.setItem(STORE,JSON.stringify(st));}catch(e){}}
let store=loadStore(); if(!store.profiles) store.profiles={};
let me=null;
function slug(n){return n.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
function cardKey(c){return c.kind==="drink"?"d:"+c.d.name:c.kind==="food"?"f:"+c.fd.name:c.kind==="wine"?"w:"+c.w.name:"q:"+c.f.q;}
function cardTitle(c){return c.kind==="drink"?c.d.name:c.kind==="food"?c.fd.name:c.kind==="wine"?c.w.name.split(",")[0]:c.f.q;}
function subjectOf(c){ if(DRINKCATS.includes(c.cat))return "Drinks"; if(FOODCATS.includes(c.cat))return "Food"; if(c.cat==="Allergens & Mods")return "Allergens & Mods"; if(c.cat==="Wines BTG"||c.cat==="Vino de Postre")return "Wines by the glass"; return "Resource guide"; }
function rec(c){ const k=cardKey(c); return me.items[k]||(me.items[k]={seen:0,right:0,wrong:0,rate:null}); }
function stateOf(c){ const r=me&&me.items[cardKey(c)]; if(!r||(!r.seen&&!r.right&&!r.wrong))return "unseen"; if(r.rate==="learn")return "learning"; if(r.rate==="got"||(r.right>=2&&r.wrong===0))return "mastered"; return "learning"; }
let SYNC=false, syncTimer=null, dirty=false, saving=Promise.resolve();
function cloudSay(t){$("cloud").textContent=t;}
function summary(){
let m=0,t=0,learn=[]; const bySub={};
CARDS.forEach(c=>{t++; const sub=subjectOf(c); bySub[sub]=bySub[sub]||{m:0,t:0}; bySub[sub].t++;
const st=stateOf(c); if(st==="mastered"){m++;bySub[sub].m++;} const x=me.items[cardKey(c)]; if(x&&(x.wrong>0||x.rate==="learn")) learn.push({n:cardTitle(c),w:x.wrong||0}); });
learn.sort((a,b)=>b.w-a.w);
return {pct:Math.round(100*m/t),mastered:m,total:t,bySub,weak:learn.slice(0,5).map(x=>x.n),quiz:me.quiz};
}
function persist(){ me.updated=Date.now(); store.profiles[me.slug]=me; store.last=me.slug; saveStore(store);
dirty=true; clearTimeout(syncTimer); syncTimer=setTimeout(flush,900); }
function flush(){ if(!dirty||!me) return; dirty=false;
const body=JSON.parse(JSON.stringify(me)); body.summary=summary();
saving=saving.then(()=>fetch("/api/progress",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),keepalive:true}))
.then(r=>{ if(r.ok){SYNC=true;cloudSay("saved");} else throw 0; }).catch(()=>{dirty=true;cloudSay("offline · will retry");}); }
window.addEventListener("pagehide",()=>{ if(dirty) flush(); });
document.addEventListener("visibilitychange",()=>{ if(document.hidden&&dirty) flush(); });
setInterval(()=>{ if(dirty) flush(); },15000);
async function remoteLoad(sl){
try{ const r=await fetch("/api/progress?name="+encodeURIComponent(sl)); if(!r.ok) return null; const j=await r.json(); return j&&j.items?j:null; }catch(e){ return null; }
}
async function connectServer(){
if(!me) return;
const remote=await remoteLoad(me.slug);
if(remote){ // union-merge: per card keep whichever side has more activity; never let an empty device wipe the server
const act=r=>(r.seen||0)+(r.right||0)+(r.wrong||0);
const merged=JSON.parse(JSON.stringify(remote)); merged.items=merged.items||{};
Object.keys(me.items).forEach(k=>{ const L=me.items[k], R=merged.items[k]; if(!R||act(L)>act(R)) merged.items[k]=L; });
const lq=me.quiz||{right:0,total:0}, rq=remote.quiz||{right:0,total:0}; merged.quiz=(lq.total>rq.total)?lq:rq;
merged.name=me.name; merged.slug=me.slug; merged.started=Math.min(merged.started||Date.now(),me.started||Date.now());
me=merged; score={right:me.quiz.right,total:me.quiz.total}; store.profiles[me.slug]=me; saveStore(store); resetDeck(); }
SYNC=true; cloudSay("synced"); $("pWhere").textContent="Progress is saved under your name — pick up on any device.";
dirty=true; flush();
}
function setProfile(name){
const sl=slug(name); if(!sl) return false;
const pretty=name.trim().replace(/\s+/g," ").replace(/\b\w/g,ch=>ch.toUpperCase());
me=store.profiles[sl]||{name:pretty,slug:sl,items:{},quiz:{right:0,total:0},started:Date.now()};
score={right:me.quiz.right,total:me.quiz.total};
$("whoName").textContent=me.name; $("gate").classList.add("hidden");
connectServer();
return true;
}
function showGate(){
const known=Object.values(store.profiles).sort((a,b)=>(b.updated||0)-(a.updated||0)).slice(0,8);
$("gateMsg").textContent=known.length?"Tap your name, or type it below. Use the same name every time so your progress follows you.":"Type your first name and last initial. Use the same name every time so your progress follows you to any phone.";
$("gateKnown").innerHTML=known.map(p=>`<button data-s="${p.slug}">${esc(p.name)}</button>`).join("");
[...$("gateKnown").children].forEach(b=>b.onclick=()=>{setProfile(store.profiles[b.dataset.s].name);resetDeck();resumeQuiz();});
$("gateName").value=""; $("gate").classList.remove("hidden"); setTimeout(()=>$("gateName").focus(),50);
}
$("gateGo").onclick=()=>{ if(setProfile($("gateName").value)){ resetDeck(); resumeQuiz(); } else $("gateName").focus(); };
$("gateName").onkeydown=e=>{ if(e.key==="Enter") $("gateGo").click(); };
$("whoSwitch").onclick=showGate;
// ---------- toast ----------
let toastT=null; function toast(t){ const el=$("toast"); el.textContent=t; el.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove("show"),1400); }
// ---------- pools ----------
function basePool(){
if(filter===null) return CARDS.slice();
if(filter==="drinks") return CARDS.filter(c=>DRINKCATS.includes(c.cat));
if(filter==="food") return CARDS.filter(c=>FOODCATS.includes(c.cat));
return CARDS.filter(c=>c.cat===filter);
}
function pool(){
const p=basePool();
if(weakOnly&&me){ const w=p.filter(c=>stateOf(c)!=="mastered"); if(w.length) return w; }
return p;
}
function shuffleArr(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function filterLabel(){return filter===null?"Everything":(filter==="drinks"?"All drinks":filter==="food"?"All food":filter);}
function countFor(v){ if(v===null) return CARDS.length; if(v==="drinks") return CARDS.filter(c=>DRINKCATS.includes(c.cat)).length; if(v==="food") return CARDS.filter(c=>FOODCATS.includes(c.cat)).length; return CARDS.filter(c=>c.cat===v).length; }
// ---------- section sheet ----------
function buildSheet(){
let html=`<div class="grip" aria-hidden="true"></div>`; let open=false;
GROUPS.forEach(g=>{
if(g[1]==="hdr"){ if(open) html+=`</div></div>`; html+=`<div class="grp"><h3 class="h-sec">${g[0]}</h3><div class="chips">`; open=true; return; }
if(g[1]===null){ html+=`<div class="chips"><button class="all${filter===null?" on":""}" data-v="__all__">Everything <i>${countFor(null)}</i></button></div>`; return; }
html+=`<button class="${filter===g[1]?"on":""}" data-v="${esc(g[1])}">${g[0]} <i>${countFor(g[1])}</i></button>`;
});
if(open) html+=`</div></div>`;
$("sheetPanel").innerHTML=html;
$("sheetPanel").querySelectorAll("button[data-v]").forEach(b=>b.onclick=()=>{ setFilter(b.dataset.v==="__all__"?null:b.dataset.v); closeSheet(); });
}
function openSheet(){ buildSheet(); $("sheet").classList.add("open"); $("sheet").setAttribute("aria-hidden","false"); $("pickBtn").setAttribute("aria-expanded","true"); document.body.style.overflow="hidden"; setTimeout(()=>{ const on=$("sheetPanel").querySelector("button.on")||$("sheetPanel").querySelector("button"); if(on) on.focus(); },80); }
function closeSheet(){ $("sheet").classList.remove("open"); $("sheet").setAttribute("aria-hidden","true"); $("pickBtn").setAttribute("aria-expanded","false"); document.body.style.overflow=""; $("pickBtn").focus(); }
$("pickBtn").onclick=openSheet;
$("sheet").addEventListener("click",e=>{ if(e.target===$("sheet")) closeSheet(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&$("sheet").classList.contains("open")) closeSheet(); });
function labelPicker(){
const v=filter, kind=v===null?"Section":DRINKCATS.includes(v)||v==="drinks"?"Drinks":FOODCATS.includes(v)||v==="food"?"Food":["Wines BTG","Vino de Postre","Wine 101","Sherry & Vermouth"].includes(v)?"Wine":v==="Allergens & Mods"?"Food":"Resource guide";
$("pickKind").textContent=kind; $("pickName").textContent=filterLabel();
}
function setFilter(v){ filter=v; labelPicker(); resetDeck(); if(!$("quiz").classList.contains("hidden")) startRound(); }
// ---------- flashcards ----------
function resetDeck(){ deck=shuffleArr(pool()); idx=0; render(); }
function achipsHTML(list,major){ return `<div class="achips">${list.map(a=>`<span class="achip${major?" major":""}">${aicon(a)}${esc(a)}</span>`).join("")}</div>`; }
function pairingHTML(p){ return `<div class="pairing"><svg viewBox="0 0 24 24"><path d="M8 3h8l-1 7a3 3 0 0 1-6 0zM12 13v7M8 20h8"/></svg><span><span class="lbl" style="display:inline;margin-right:6px">Pair</span>${esc(p)}</span></div>`; }
function render(quiet){
const c=deck[idx]; if(!c) return; if(!quiet){ $("card").classList.remove("flipped"); $("front").scrollTop=0; $("back").scrollTop=0; }
if(me&&!quiet){ rec(c).seen++; persist(); }
const F=$("front"), B=$("back");
if(c.kind==="drink"){
const d=c.d;
F.innerHTML=`<div class="inner"><div class="eyebrow cat">${esc(d.cat)}</div><div class="name">${esc(d.name)}</div><div class="price">${esc(d.price)}</div>${Say.btn(d.name)}${visual("d",d.name,ILLUS[d.name],"illus")}<div class="hint">Say the glass, build and garnish out loud — then tap to check.</div></div>`;
const chips=d.colors.length
?`<div class="chips">${d.colors.map(cl=>`<span class="chip" style="background:${TAPE[cl]}" aria-hidden="true"></span>`).join("")}<span class="lbl">Batch bottle: ${esc(d.bottle||d.colors.join(" + "))} tape</span></div>`
:`<div class="chips"><span class="lbl">No batch bottle — built to order</span></div>`;
B.innerHTML=`<div class="top"><div class="vis">${visual("d",d.name,ILLUS[d.name],"illus","mini")}</div><div><div class="eyebrow">${esc(d.cat)} · ${esc(d.price)}</div><h2 class="dname">${esc(d.name)}</h2></div>${Say.btn(d.name,true)}</div>
${d.flag?`<div class="callout warn"><span class="lbl">Know this</span><p>${esc(d.flag)}</p></div>`:""}
<div class="spec"><div><span class="lbl">Glass</span>${esc(d.glass)}</div><div><span class="lbl">Garnish</span>${esc(d.garnish)}</div></div>
<div class="row"><span class="lbl">Build</span><ol class="steps">${d.build.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div>${chips}
${d.sell?`<div class="callout"><span class="lbl">Sell it</span><p class="drop">${esc(d.sell)}</p></div>`:""}
<div class="menuline">On the menu: ${esc(d.menu)}</div>`;
} else if(c.kind==="food"){
const f=c.fd;
const parts=f.all.split("·"), list=parts[0].split(",").map(a=>a.trim()).filter(Boolean);
const major=list.filter(a=>MAJOR.test(a)), minor=list.filter(a=>!MAJOR.test(a));
const tipWarn=f.tip&&/allerg|gluten|fin fish|gelatin|fish|vegetarian|halal|kosher|NOT|not printed|confirm|ask chef/i.test(f.tip);
const hh=f.hh&&f.cat!=="Happy Hour"?`<span class="hhtag">HH ${esc(f.hh)}</span>`:"";
F.innerHTML=`<div class="inner"><div class="eyebrow cat">${esc(f.cat)}</div><div class="name${f.name.length>22?" long":""}">${esc(f.name)}</div><div class="price">${esc(f.price)}${hh}</div>${Say.btn(f.name)}${visual("f",f.name,FOODILLUS[f.ill],"fillus")}<div class="hint">Say the drop line, allergens and mods out loud — then tap to check.</div></div>`;
B.innerHTML=`<div class="top"><div class="vis">${visual("f",f.name,FOODILLUS[f.ill],"fillus","mini")}</div><div><div class="eyebrow">${esc(f.cat)} · ${esc(f.price)}${hh}</div><h2 class="dname">${esc(f.name)}</h2></div>${Say.btn(f.name,true)}</div>
<div class="callout"><span class="lbl">Drop line</span><p class="drop">“${esc(f.drop)}”</p></div>
${f.tip?`<div class="callout${tipWarn?" warn":""}"><span class="lbl">${tipWarn?"Know this":"Tip"}</span><p>${esc(f.tip)}</p></div>`:""}
<div class="row"><span class="lbl">Major allergens</span>${major.length?achipsHTML(major,true):`<div class="also">None of the major allergens</div>`}${minor.length?`<div class="also">Also contains: ${esc(minor.join(", "))}</div>`:""}${parts[1]?`<div class="cc">⚠ ${esc(parts[1].trim())}</div>`:""}</div>
<div class="row"><span class="lbl">Diets</span>${dietBadges(f.name)}</div>
<div class="spec"><div><span class="lbl">Mods</span>${esc(f.mods)}</div><div><span class="lbl">Serve with</span>${esc(f.ut)}</div></div>
${f.pair?pairingHTML(f.pair):""}
<details class="ing"><summary>Full ingredient list</summary><p>${esc(f.ing)}</p></details>`;
} else if(c.kind==="fact"){
const f=c.f;
F.innerHTML=`<div class="inner"><div class="eyebrow cat">${esc(f.cat)}</div><div class="rule"></div><div class="name qq">${esc(f.q)}</div><div class="hint">Tap to reveal</div></div>`;
B.innerHTML=`<div class="eyebrow">${esc(f.cat)}</div><h2 class="dname" style="margin-top:6px;font-family:var(--body);text-transform:none;letter-spacing:0;font-weight:500;font-size:19px">${esc(f.q)}</h2>
<div class="callout"><span class="lbl">Answer</span><p>${esc(f.a)}</p></div>${f.x?`<div class="row"><span class="lbl">More</span>${esc(f.x)}</div>`:""}`;
} else {
const w=c.w, k=wineKind(w);
F.innerHTML=`<div class="inner"><div class="eyebrow cat">${esc(c.cat)}</div><div class="name long">${esc(w.name)}</div><div class="price">${w.region?esc(w.region)+" · ":""}${esc(w.price)}</div>${Say.btn(w.name)}<div class="wglass">${WGLASS[k]||""}</div><div class="hint">Grape · place · notes · one story · pairing</div></div>`;
B.innerHTML=`<div class="top"><div class="vis"><div class="wglass mini">${WGLASS[k]||""}</div></div><div><div class="eyebrow">${esc(c.cat)} · ${esc(w.price)}</div><h2 class="dname">${esc(w.name)}</h2>${w.region?`<div class="sub">${esc(w.region)}</div>`:""}</div>${Say.btn(w.name,true)}</div>
<div class="callout"><span class="lbl">Notes</span><p class="drop">${esc(w.notes)}</p></div>
<div class="spec"><div><span class="lbl">Grape</span>${esc(w.grape)}</div><div><span class="lbl">Similar to</span>${esc(w.like)}</div></div>
<div class="row"><span class="lbl">Story</span>${esc(w.story)}</div>
<div class="row"><span class="lbl">Pair with</span>${esc(w.pair)}</div>`;
}
const st=stateOf(c);
F.querySelector(".inner").insertAdjacentHTML("beforeend",`<div class="mstate ${st}">${st==="mastered"?"Mastered":st==="learning"?"Still learning":"New"}</div>`);
$("counter").textContent=`${idx+1} of ${deck.length}${weakOnly?" · weak cards":""}`;
$("deckBar").style.width=(100*(idx+1)/deck.length)+"%";
syncFaces();
}
// only the visible face is exposed to screen readers
function syncFaces(){ const f=$("card").classList.contains("flipped"); $("front").setAttribute("aria-hidden",f?"true":"false"); $("back").setAttribute("aria-hidden",f?"false":"true"); $("flip").lastChild.textContent=f?"Front":"Flip"; }
function flipCard(){ $("card").classList.toggle("flipped"); syncFaces(); }
$("flip").onclick=flipCard;
// ---------- swipe engine ----------
const SW=$("swipe"), STACK=$("stack");
let drag=null, busy=false, coachSeen=+(localStorage.getItem("av_coach")||0);
function stamps(dx){
const p=Math.min(1,Math.abs(dx)/90);
const y=$("stampYes"), n=$("stampNo");
if(swipeRates){ y.textContent="Got it"; n.textContent="Learning"; y.classList.remove("nav"); n.classList.remove("nav"); }
else { y.textContent="Back"; n.textContent="Next"; y.classList.add("nav"); n.classList.add("nav"); }
y.style.opacity=dx>0?p:0; n.style.opacity=dx<0?p:0;
}
function setPos(dx){ SW.style.transform=`translateX(${dx}px) rotate(${dx/22}deg)`; stamps(dx); STACK.classList.toggle("pull",Math.abs(dx)>60); }
function threshold(){ return Math.min(130, SW.clientWidth*0.36); }
// Mouse/pen use Pointer Events. Touch uses Touch Events directly: Safari (esp. iOS) fires pointercancel
// as soon as it decides to scroll, and setPointerCapture on touch pointers is unreliable there.
function startDrag(id,x,y){ if(busy) return; drag={id,x,y,dx:0,dy:0,t:performance.now(),lock:null,vx:0,lx:x,lt:performance.now()}; }
function moveDrag(id,x,y){
if(!drag||id!==drag.id) return false;
drag.dx=x-drag.x; drag.dy=y-drag.y;
if(!drag.lock){ if(Math.abs(drag.dx)>8||Math.abs(drag.dy)>8) drag.lock=Math.abs(drag.dx)>Math.abs(drag.dy)*1.15?"x":"y"; if(drag.lock==="x") SW.classList.add("dragging"); }
if(drag.lock==="x"){ const now=performance.now(); drag.vx=(x-drag.lx)/Math.max(1,now-drag.lt); drag.lx=x; drag.lt=now; setPos(drag.dx); return true; }
return false;
}
function endDrag(id,cancelled){
if(!drag||id!==drag.id) return;
const d=drag; drag=null; SW.classList.remove("dragging");
if(d.lock==="x"&&!cancelled){
const flick=Math.abs(d.vx)>0.65&&Math.abs(d.dx)>30;
if(Math.abs(d.dx)>threshold()||flick) commit(d.dx>0?1:-1);
else { setPos(0); STACK.classList.remove("pull"); }
} else if(!d.lock&&!cancelled&&Math.abs(d.dx)<8&&Math.abs(d.dy)<8&&performance.now()-d.t<500){ flipCard(); }
else { setPos(0); STACK.classList.remove("pull"); }
}
function skipTarget(t){ return !!(t&&t.closest&&t.closest("details,summary,a,button,input")); }
// --- touch ---
SW.addEventListener("touchstart",e=>{ if(drag||e.touches.length!==1||skipTarget(e.target)) return; const t=e.touches[0]; startDrag("t"+t.identifier,t.clientX,t.clientY); },{passive:true});
SW.addEventListener("touchmove",e=>{ if(!drag) return; const t=Array.from(e.changedTouches).find(t=>"t"+t.identifier===drag.id); if(!t) return;
if(moveDrag(drag.id,t.clientX,t.clientY)&&e.cancelable) e.preventDefault(); },{passive:false});
function touchEnd(e){ if(!drag) return; const t=Array.from(e.changedTouches).find(t=>"t"+t.identifier===drag.id); if(t) endDrag(drag.id,e.type==="touchcancel"); }
SW.addEventListener("touchend",touchEnd); SW.addEventListener("touchcancel",touchEnd);
// --- mouse / pen ---
SW.addEventListener("pointerdown",e=>{
if(e.pointerType==="touch"||busy||drag) return; if(e.pointerType==="mouse"&&e.button!==0) return;
if(skipTarget(e.target)) return;
startDrag(e.pointerId,e.clientX,e.clientY); try{SW.setPointerCapture(e.pointerId);}catch(_){}
});
SW.addEventListener("pointermove",e=>{ if(e.pointerType==="touch") return; moveDrag(e.pointerId,e.clientX,e.clientY); });
SW.addEventListener("pointerup",e=>{ if(e.pointerType==="touch") return; endDrag(e.pointerId,false); });
SW.addEventListener("pointercancel",e=>{ if(e.pointerType==="touch") return; endDrag(e.pointerId,true); });
// keep a mouse drag alive if the cursor leaves the window without capture
window.addEventListener("mouseup",()=>{ if(drag&&typeof drag.id==="number") endDrag(drag.id,false); });
// dir: +1 right, -1 left. Right = got it / (browse mode) back · Left = still learning / (browse mode) next
function commit(dir,rate){
if(busy) return; busy=true; if(rate===undefined) rate=swipeRates;
const w=SW.clientWidth+220;
SW.style.transition=""; SW.style.transform=`translateX(${dir*w}px) rotate(${dir*22}deg)`; SW.style.opacity="0";
{ const y=$("stampYes"), n=$("stampNo"); if(rate){ y.textContent="Got it"; n.textContent="Learning"; y.classList.remove("nav"); n.classList.remove("nav"); } y.style.opacity=dir>0?1:0; n.style.opacity=dir<0?1:0; }
const after=()=>{
if(rate){ applyRate(dir>0?"got":"learn"); idx=(idx+1)%deck.length; }
else { idx=dir<0?(idx+1)%deck.length:(idx-1+deck.length)%deck.length; }
dealIn();
};
setTimeout(after,300);
}
function applyRate(v){ if(!me)return; const r=rec(deck[idx]); r.rate=v; if(v==="got"){r.right++;} persist(); toast(v==="got"?"Got it · mastered":"Still learning"); }
function dealIn(){
render();
SW.style.transition="none"; SW.style.transform="translateY(12px) scale(.955)"; SW.style.opacity="1"; stamps(0);
STACK.classList.remove("pull");
requestAnimationFrame(()=>requestAnimationFrame(()=>{ SW.style.transition=""; SW.style.transform=""; busy=false; }));
if(coachSeen<3){ coachSeen++; localStorage.setItem("av_coach",coachSeen); $("coach").hidden=false; setTimeout(()=>$("coach").hidden=true,2200); }
}
function goPrev(){
if(busy) return; busy=true;
SW.style.transition=""; SW.style.transform="translateY(12px) scale(.955)"; SW.style.opacity="0";
setTimeout(()=>{ idx=(idx-1+deck.length)%deck.length; render(); SW.style.transition="none"; SW.style.transform="translateX(-70px) rotate(-6deg)"; SW.style.opacity="1";
requestAnimationFrame(()=>requestAnimationFrame(()=>{ SW.style.transition=""; SW.style.transform=""; busy=false; })); },220);
}
function goNext(){ if(busy) return; busy=true; const w=SW.clientWidth+220; SW.style.transition=""; SW.style.transform=`translateX(${-w}px) rotate(-18deg)`; SW.style.opacity="0"; setTimeout(()=>{ idx=(idx+1)%deck.length; dealIn(); },260); }
$("next").onclick=goNext; $("prev").onclick=goPrev;
$("rGot").onclick=()=>commit(1,true);
$("rLearn").onclick=()=>commit(-1,true);
$("card").onkeydown=e=>{ if(e.target!==$("card")) return; if(e.key==="Enter"||e.key===" "){ e.preventDefault(); flipCard(); } else if(e.key==="ArrowRight"){ e.preventDefault(); if(swipeRates) commit(1); else goNext(); } else if(e.key==="ArrowLeft"){ e.preventDefault(); if(swipeRates) commit(-1); else goPrev(); } };
$("shuffle").onclick=()=>{shuffleArr(deck);idx=0;render();toast("Shuffled");};
$("weakOnly").onclick=()=>{weakOnly=!weakOnly;$("weakOnly").setAttribute("aria-pressed",weakOnly?"true":"false");resetDeck();toast(weakOnly?"Weak cards only":"All cards");};
function syncSwipeMode(){ $("swipeMode").setAttribute("aria-pressed",swipeRates?"true":"false"); $("swipeMode").textContent=swipeRates?"Swipe rates":"Swipe browses"; }
$("swipeMode").onclick=()=>{ swipeRates=!swipeRates; localStorage.setItem("av_swipe_rates",swipeRates?"1":"0"); syncSwipeMode(); toast(swipeRates?"Swipe right = got it · left = learning":"Swipe left = next · right = back"); };
syncSwipeMode();
// ---------- quiz ----------
function distractors(correct, values, n=3, fallback=[]){
let set=[...new Set(values.filter(v=>v && v!==correct))];
if(set.length<n) set=[...new Set([...set,...fallback.filter(v=>v && v!==correct)])];
return shuffleArr(set).slice(0,n);
}
// ---- hint helpers: a nudge toward the answer, never the answer itself ----
const money=p=>/^\d/.test(String(p))?"$"+p:String(p);
const priceNum=p=>parseFloat(String(p).replace(/^[^0-9.]*/,""));
function nameShape(n){ const w=String(n).trim().split(/\s+/), art=/^(el|la|los|las|de|del|y)$/i, out=[];
for(const x of w){ if(art.test(x)&&!out.length){ out.push(x); continue; } out.push(x.charAt(0)+"…"); break; }
return `starts “${esc(out.join(" "))}” · ${w.length} word${w.length>1?"s":""}`; }
function trunc(s,n){ s=String(s); return s.length>n?s.slice(0,n).replace(/[,;\s]+[^,;\s]*$/,"")+"…":s; }
function priceHint(v,list,label){
const nums=list.map(priceNum).filter(n=>!isNaN(n)).sort((a,b)=>a-b), x=priceNum(v);
if(nums.length<3||isNaN(x)) return `Think about where it sits on the ${label.toLowerCase()} list.`;
const lo=nums[Math.floor(nums.length/3)], hi=nums[Math.ceil(2*nums.length/3)-1];
const pos=x<=lo?"one of the lower-priced ones":x>=hi?"one of the pricier ones":"right in the middle";
return `${esc(label)} run ${money(nums[0])}–${money(nums[nums.length-1])}. This one is ${pos}.`; }
function glassUse(g){ const k=GLASS.find(x=>String(g).toLowerCase().startsWith(x[0].toLowerCase())); return k?k[1]:null; }
const DIETHINT={V:"Vegetarian means no meat or fish. Watch for anchovy, jamón and gelatin.",VG:"Vegan means no meat, fish, dairy, egg or honey. Aioli and cheese are the usual traps.",GF:"Gluten-free as printed means no bread, flour, breading, fideos or shoyu.",DF:"Dairy-free means no cheese, butter, cream or milk."};
function shapeHint(ans){ const w=String(ans).trim().split(/\s+/);
return w.length>4?`It begins “${esc(w.slice(0,2).join(" "))} …”`:`The answer is ${w.length} word${w.length>1?"s":""} and starts with “${esc(String(ans).trim().charAt(0).toUpperCase())}”.`; }
function factHint(f){
if(f.x){ const x=f.x.toLowerCase(), words=(f.a.toLowerCase().match(/[a-záéíóúñü']{5,}/g)||[]);
if(!x.includes(f.a.toLowerCase())&&!words.some(w=>x.includes(w))) return esc(f.x)+".";
}
return shapeHint(f.a);
}
// q.vis: "id" real photo is the question (only when a live photo exists) · "q" photo shown with the question
//        "after" photo shown once answered (it would give the answer away, e.g. glass or garnish)
function makeQuestion(c){
let q;
if(c.kind==="drink"){
const d=c.d, all=DRINKS, use=glassUse(d.glass), K=COACH.drink[d.name]||{};
const types=[
()=>({prompt:`What glass does <b>${esc(d.name)}</b> go in?`,answer:d.glass,opts:distractors(d.glass,all.map(x=>x.glass)),vis:"after",
hint:K.glass?esc(K.glass):use?`The right glass is the one the bar uses for <i>${esc(use.toLowerCase())}</i>.`:`Think about how it's served: up, on ice, or long.`}),
()=>({prompt:`Which drink is this?<br><i>"${esc(d.menu)}"</i>`,answer:d.name,opts:distractors(d.name,all.map(x=>x.name)),vis:"q",
hint:K.id?esc(K.id):`${esc(d.cat)} · ${esc(d.price)} · ${nameShape(d.name)}`}),
];
if(d.cat!=="Sangria"){
types.push(()=>({prompt:`What's the garnish on <b>${esc(d.name)}</b>?`,answer:d.garnish,opts:distractors(d.garnish,all.map(x=>x.garnish).filter(g=>!/confirm/i.test(g))),vis:"after",
hint:K.garnish?esc(K.garnish):`Garnishes usually echo what's in the glass: <i>${esc(d.menu)}</i>.`}));
types.push(()=>{ const ans=d.build.join(" · "), opts=distractors(ans,all.filter(x=>x.cat!=="Sangria").map(x=>x.build.join(" · ")));
const step=d.build.find(s=>!opts.some(o=>o.includes(s)))||d.build[0];
return {prompt:`What's the build for <b>${esc(d.name)}</b>?`,answer:ans,opts,vis:"q",hint:K.build?esc(K.build)+" (“Batch” = the pre-mixed base in the taped bottle.)":`One of the steps is <b>${esc(step)}</b>.`}; });
}
if(d.colors.length) types.push(()=>({prompt:`Batch bottle color for <b>${esc(d.name)}</b>?`,answer:d.colors.join(" + "),opts:distractors(d.colors.join(" + "),all.filter(x=>x.colors.length).map(x=>x.colors.join(" + "))),vis:"q",elim:1,
hint:`${K.tape?esc(K.tape)+" ":""}${d.colors.length===1?"A single tape color":"Two tape colors"}. One wrong answer is crossed out.`}));
if(photoOf("d",d.name)){ const pq=()=>({prompt:`Which drink is this?`,answer:d.name,opts:distractors(d.name,all.filter(x=>x.glass.split(" ")[0]===d.glass.split(" ")[0]).map(x=>x.name),3,all.map(x=>x.name)),vis:"id",
hint:K.id?esc(K.id):`${esc(d.cat)} · <i>${esc(d.menu)}</i>`}); types.push(pq,pq); }
q=pick(types)(); q.explain=`${d.name}: ${d.glass} · ${d.build.join(" · ")} · garnish ${d.garnish}.`;
} else if(c.kind==="food"){
const f=c.fd, all=FOOD, K=COACH.food[f.name]||{}, major=f.all.split("·")[0].split(",").map(a=>a.trim()).filter(a=>MAJOR.test(a));
const types=[
()=>({prompt:`Which dish is this?<br><i>“${esc(f.drop)}”</i>`,answer:f.name,opts:distractors(f.name,all.map(x=>x.name)),vis:"q",
hint:K.id?esc(K.id):`${esc(f.cat)} · ${esc(money(f.price))} · ${nameShape(f.name)}`}),
()=>({prompt:`Allergens in <b>${esc(f.name)}</b>?`,answer:f.all,opts:distractors(f.all,all.map(x=>x.all)),vis:"q",
hint:esc(COACH.allergenHint(f))}),
()=>({prompt:`Dinner-menu price of <b>${esc(f.name)}</b>?`,answer:f.price,opts:distractors(f.price,all.filter(x=>x.cat===f.cat).map(x=>x.price),3,all.map(x=>x.price)),vis:"q",elim:1,
hint:priceHint(f.price,all.filter(x=>x.cat===f.cat).map(x=>x.price),f.cat)+" One wrong answer is crossed out."}),
];
if(photoOf("f",f.name)){ const pq=()=>({prompt:`Which dish is this?`,answer:f.name,opts:distractors(f.name,all.filter(x=>x.cat===f.cat).map(x=>x.name),3,all.map(x=>x.name)),vis:"id",
hint:K.id?esc(K.id):`${esc(f.cat)} · ${nameShape(f.name)}`}); types.push(pq,pq); }
if(f.mods!=="None") types.push(()=>({prompt:`Approved mods for <b>${esc(f.name)}</b>?`,answer:f.mods,opts:distractors(f.mods,all.filter(x=>x.mods!=="None").map(x=>x.mods)),vis:"q",
hint:K.mods?esc(K.mods):major.length?`A mod usually takes out an allergen. This dish has: ${esc(major.join(", "))}.`:`Think about what a guest would most often ask to leave off.`}));
if(!/^None/.test(f.ut)) types.push(()=>({prompt:`What drops with <b>${esc(f.name)}</b>?`,answer:f.ut,opts:distractors(f.ut,all.map(x=>x.ut)),vis:"q",
hint:K.ut?esc(K.ut):`Picture how it's eaten: <i>“${esc(f.drop)}”</i>`}));
if(f.pair) types.push(()=>({prompt:`Printed dessert-wine pairing for <b>${esc(f.name)}</b>?`,answer:f.pair,opts:distractors(f.pair,all.filter(x=>x.pair).map(x=>x.pair)),vis:"q",
hint:K.pair?esc(K.pair):`Match the sweetness and weight of the dessert: <i>“${esc(f.drop)}”</i>`}));
// scenario: guest allergy — which dish is SAFE
if(major.length){
const w=pick(major); const key=w.replace(/\s*\(.*\)/,"").toLowerCase();
const safe=all.filter(x=>!x.all.toLowerCase().includes(key.split(" ")[0]));
const unsafe=all.filter(x=>x!==f && x.all.toLowerCase().includes(key.split(" ")[0]));
const hid=COACH.hides.find(h=>h[0].test(key));
if(safe.length&&unsafe.length>=2) types.push(()=>{const ans=pick(safe).name;return {prompt:`A guest has a <b>${esc(key)}</b> allergy. Which of these can they order?`,answer:ans,opts:distractors(ans,[f.name,...shuffleArr(unsafe).slice(0,2).map(x=>x.name)]),vis:null,
hint:hid?`Where ${esc(hid[1])} hides on our menu: ${esc(hid[2])}. Three of these have it. At the table, never guess — ask Chef.`:`Three of these contain ${esc(key)}. Think through each dish's ingredients.`};});
}
// scenario: dietary restriction — which dish is safe as printed
["V","VG","GF","DF"].forEach(code=>{
const has=x=>(DIET[x.name]||[]).includes(code);
if(!has(f)) return;
const bad=all.filter(x=>!(DIET[x.name]||[]).some(t=>t.replace("*","")===code));
if(bad.length>=3) types.push(()=>({prompt:`A guest is <b>${DIETNAME[code].toLowerCase()}</b>. Which of these can they order as printed?`,answer:f.name,opts:shuffleArr(bad).slice(0,3).map(x=>x.name),vis:null,hint:esc(COACH.diet[code]||DIETHINT[code])}));
});
q=pick(types)(); q.explain=`${f.name} (${f.price}): ${f.all} · diets: ${(DIET[f.name]||[]).map(t=>DIETNAME[t.replace("*","")]+(t.endsWith("*")?" w/ mod":"")).join(", ")||"none printed"} · mods: ${f.mods}.`;
} else if(c.kind==="fact"){
const f=c.f;
const same=(f.cat==="Allergens & Mods"?ALLERGY_FACTS:FACTS).filter(x=>x.cat===f.cat).map(x=>x.a);
q={prompt:esc(f.q), answer:f.a, opts:distractors(f.a, same, 3, [...FACTS,...ALLERGY_FACTS].map(x=>x.a)), vis:null, hint:COACH.fact[f.q]?esc(COACH.fact[f.q]):factHint(f)};
q.explain=f.a + (f.x?" — "+f.x:"");
} else {
const w=c.w, same=WINES.filter(x=>(x.cat||"Wines BTG")===(w.cat||"Wines BTG")), K=COACH.wine[w.name]||{}, g=esc(K.g||w.grape),
kind=w.cat==="Vino de Postre"?"dessert wine":({sparkling:"sparkling wine",rose:"rosé",white:"white",red:"red"})[wineKind(w)]||"wine";
const types=[
()=>({prompt:`Which wine tastes like <i>"${esc(w.notes)}"</i>?`,answer:w.name,opts:distractors(w.name,same.map(x=>x.name),3,WINES.map(x=>x.name)),hint:`A ${kind} made from ${g}.`}),
()=>({prompt:`Which wine do you hand a guest who loves <b>${esc(w.like)}</b>?`,answer:w.name,opts:distractors(w.name,same.map(x=>x.name),3,WINES.map(x=>x.name)),hint:`Look for the ${kind} made from ${g}.`}),
()=>({prompt:`Tasting notes for <b>${esc(w.name)}</b>?`,answer:w.notes,opts:distractors(w.notes,same.map(x=>x.notes),3,WINES.map(x=>x.notes)),hint:`It's a ${kind} made from ${g}, and it drinks a lot like ${esc(w.like)}.`}),
()=>({prompt:`Glass / bottle price of <b>${esc(w.name)}</b>?`,answer:w.price,opts:distractors(w.price,same.map(x=>x.price),3,WINES.map(x=>x.price)),elim:1,hint:priceHint(w.price,same.map(x=>x.price),w.cat==="Vino de Postre"?"Dessert wines":"Glasses")+(w.cat==="Vino de Postre"?"":" (Prices read glass / bottle.)")+" One wrong answer is crossed out."}),
];
if(w.region) types.push(()=>({prompt:`Where is <b>${esc(w.name)}</b> from?`,answer:w.region,opts:distractors(w.region,same.map(x=>x.region),3,WINES.map(x=>x.region)),elim:1,hint:`It's ${g} — grapes are a good clue to the region. One wrong answer is crossed out.`}));
q=pick(types)(); q.vis=null; q.explain=`${w.name} (${w.price}): ${w.notes} · ${w.grape} · like ${w.like}.`;
}
q.choices=shuffleArr([q.answer,...q.opts]); delete q.opts;
return q; // plain data (no card reference) so it can be saved and re-asked exactly
}
// the one line to remember about an item (js/coach.js), shown once a question is answered
function hookOf(c){ const K=c.kind==="drink"?COACH.drink[c.d.name]:c.kind==="food"?COACH.food[c.fd.name]:c.kind==="wine"?COACH.wine[c.w.name]:null; return K&&K.hook||null; }
// item name + photo kind for a card (used for photos and the speaker button)
function itemOf(c){ return c.kind==="drink"?{pk:"d",name:c.d.name}:c.kind==="food"?{pk:"f",name:c.fd.name}:c.kind==="wine"?{pk:null,name:c.w.name}:{pk:null,name:null}; }
function promptHTML(q,c){
const {pk,name}=itemOf(c);
// "which dish / drink is this?" only ever uses a real photo — drawings don't show the ingredients well enough
if(q.vis==="id") return q.prompt+visual(pk,name,"","","q");
if(q.vis==="q"&&pk) return visual(pk,name,"","","qs")+q.prompt;
return q.prompt;
}
// ---- rounds: one question per card, no repeats until the round is done ----
// queue entries are {k: card key, q: the exact question once asked}. Missed/skipped keep the exact
// question, so "Retry" re-asks what you missed (not a new random question about the same item).
// The round is saved per trainee, so a reload or a phone killing the tab doesn't lose it.
const ROUND_MAX=10; // short rounds — about one break's worth
const CARDBYKEY=new Map(CARDS.map(c=>[cardKey(c),c]));
let round={queue:[],i:0,right:0,answered:0,missed:[],skipped:[],cycle:new Set(),label:"",retry:false,done:false}, hintUsed=false;
const RKEY=()=>me?"av_round_"+me.slug:null;
function saveRound(){ const k=RKEY(); if(!k) return;
try{ localStorage.setItem(k,JSON.stringify({v:1,filter,label:round.label,queue:round.queue,i:round.i,right:round.right,answered:round.answered,missed:round.missed,skipped:round.skipped,retry:round.retry,done:round.done,cur:answered?"answered":"open",at:Date.now()})); }catch(e){} }
function restoreRound(){
const k=RKEY(); if(!k) return false; let o=null;
try{ o=JSON.parse(localStorage.getItem(k)||"null"); }catch(e){}
if(!o||o.v!==1||!Array.isArray(o.queue)||Date.now()-(o.at||0)>7*864e5) return false;
const ok=e=>e&&CARDBYKEY.has(e.k);
const queue=o.queue.filter(ok); if(!queue.length) return false;
filter=o.filter===undefined?null:o.filter; labelPicker(); deck=shuffleArr(pool()); idx=0; render();
Object.assign(round,{queue,i:Math.min(o.i||0,queue.length-1),right:o.right||0,answered:o.answered||0,missed:(o.missed||[]).filter(ok),skipped:(o.skipped||[]).filter(ok),retry:!!o.retry,done:!!o.done,label:filterLabel()});
if(round.done) finishRound();
else if(o.cur==="answered"){ if(round.i>=round.queue.length-1) finishRound(); else { round.i++; showPlay(); showQuestion(); } }
else { showPlay(); showQuestion(); }
return true;
}
function showPlay(){ $("qDone").classList.add("hidden"); $("qNavDone").classList.add("hidden"); $("qBox").classList.remove("hidden"); $("qNavPlay").classList.remove("hidden"); }
function startRound(entries){
const p=pool(), key=filterLabel();
if(round.label!==key){ round.cycle=new Set(); round.label=key; }
let queue;
if(entries){ queue=shuffleArr(entries.filter(e=>CARDBYKEY.has(e.k)).map(e=>({k:e.k,q:e.q?JSON.parse(JSON.stringify(e.q)):null}))); }
else {
let src=p.filter(c=>!round.cycle.has(cardKey(c)));
if(src.length<Math.min(ROUND_MAX,p.length)){ round.cycle=new Set(); src=p.slice(); } // cycle exhausted -> start over
queue=shuffleArr(src.slice()).slice(0,ROUND_MAX).map(c=>({k:cardKey(c),q:null}));
queue.forEach(e=>round.cycle.add(e.k));
}
Object.assign(round,{queue,i:0,right:0,answered:0,missed:[],skipped:[],retry:!!entries,done:false});
if(!queue.length){ finishRound(); return; }
showPlay(); showQuestion();
}
const KEYS=["A","B","C","D","E","F"];
function showQuestion(){
const e=round.queue[round.i], c=CARDBYKEY.get(e.k);
// a saved picture question with no live photo (or an old drawing question) gets a fresh question instead
const it=itemOf(c), noPic=e.q&&(e.q.vis==="illus"||(e.q.vis==="id"&&!(it.pk&&photoOf(it.pk,it.name))));
if(!e.q||noPic) e.q=makeQuestion(c); else e.q.choices=shuffleArr(e.q.choices.slice());
currentQ={...e.q,card:c}; answered=false; hintUsed=false;
$("qCat").textContent=filterLabel()+(round.retry?" · retry":""); $("qPos").textContent=`Question ${round.i+1} of ${round.queue.length}`;
$("qBar").style.width=(100*round.i/round.queue.length)+"%";
$("qPrompt").innerHTML=promptHTML(currentQ,c); $("qFeed").innerHTML=""; $("qOpts").innerHTML="";
currentQ.choices.forEach((ch,i)=>{ const b=document.createElement("button"); b.textContent=ch; b.dataset.v=ch; b.dataset.k=KEYS[i]; b.onclick=()=>reveal(ch===currentQ.answer?"right":"wrong",b); $("qOpts").appendChild(b); });
$("qHint").hidden=!currentQ.hint; $("qHint").disabled=false; $("qHintBox").hidden=true; $("qHintBox").innerHTML="";
$("qNoSe").disabled=false;
navLabel(); scoreLine(); saveRound();
}
function navLabel(){ const last=round.i>=round.queue.length-1;
$("qNext").classList.toggle("gold",answered);
$("qNext").textContent=answered?(last?"Finish round":"Next question"):(last?"Skip · finish":"Skip ›"); }
function scoreLine(){ $("qScore").textContent=`This round: ${round.right} / ${round.answered}`+(round.skipped.length?` · ${round.skipped.length} skipped`:"")+(me&&me.quiz.total?` · all-time ${Math.round(100*me.quiz.right/me.quiz.total)}%`:""); }
// kind: "right" · "wrong" · "nose" (No sé — counts as a miss, shows the answer kindly)
function reveal(kind,btn){
if(answered) return; answered=true; round.answered++;
const ok=kind==="right", e=round.queue[round.i];
[...$("qOpts").children].forEach(b=>{ b.disabled=true; if(b.dataset.v===currentQ.answer) b.classList.add("correct"); });
if(btn&&!ok) btn.classList.add("wrong");
$("qNoSe").disabled=true; $("qHint").disabled=true;
if(ok) round.right++; else round.missed.push({k:e.k,q:e.q});
const {pk,name}=itemOf(currentQ.card);
const hook=hookOf(currentQ.card);
let html=ok?`<span class="ok">¡Vale! Correct${hintUsed?" · with a hint":""}.</span>`
:kind==="nose"?`<span class="soft">No pasa nada — here it is.</span>`:`<span class="no">Not quite.</span>`;
if(hook) html+=`<div class="remember"><span class="lbl">Remember it</span>${esc(hook)}</div>`;
if(!ok) html+=`<div class="${hook?"fbdetail":"fbtext"}">${esc(currentQ.explain)}</div>`;
const sayb=name?Say.btn(name):""; if(sayb) html+=`<div class="fbx">${sayb}</div>`;
if(currentQ.vis==="after"&&pk) html+=visual(pk,name,"","","qs");
$("qFeed").innerHTML=html;
if(me){ const r=rec(currentQ.card); if(ok){r.right++;} else {r.wrong++; r.rate=null;} me.quiz={right:(me.quiz.right||0)+(ok?1:0),total:(me.quiz.total||0)+1}; score={right:me.quiz.right,total:me.quiz.total}; persist(); }
navLabel(); scoreLine(); saveRound();
}
function advance(){ if(round.i>=round.queue.length-1) finishRound(); else { round.i++; showQuestion(); } }
function skipQuestion(){ if(answered) return; const e=round.queue[round.i]; round.skipped.push({k:e.k,q:e.q}); toast("Skipped · it'll be in your retry"); advance(); }
$("qHint").onclick=()=>{
if(answered||!currentQ||!currentQ.hint) return; hintUsed=true;
$("qHintBox").innerHTML=`<span class="lbl">Pista · hint</span>${currentQ.hint}`; $("qHintBox").hidden=false; $("qHint").disabled=true;
if(currentQ.elim){ const wrong=[...$("qOpts").children].filter(b=>b.dataset.v!==currentQ.answer);
shuffleArr(wrong).slice(0,currentQ.elim).forEach(b=>{ b.classList.add("elim"); b.disabled=true; b.setAttribute("aria-label",b.textContent+" (ruled out)"); }); }
};
$("qNoSe").onclick=()=>reveal("nose",null);
function finishRound(){
round.done=true;
$("qBox").classList.add("hidden"); $("qNavPlay").classList.add("hidden"); $("qDone").classList.remove("hidden"); $("qNavDone").classList.remove("hidden");
const a=round.answered, pct=a?Math.round(100*round.right/a):0, sk=round.skipped.length;
$("qFinal").textContent=a?pct+"%":"—";
$("qFinalSub").textContent=(a?`${round.right} of ${a} correct`:"No questions answered")+(sk?` · ${sk} skipped`:"")+` · ${filterLabel()}`+(round.retry?" · retry round":"")+(a&&pct===100&&!sk?" · perfect round!":"");
const tag=c=>c.kind==="drink"?"drink":c.kind==="food"?"food":c.kind==="wine"?"wine":"guide";
const row=(e,lbl)=>{ const c=CARDBYKEY.get(e.k); return c?`<div class="weak"><span>${esc(cardTitle(c))}</span><span>${lbl||tag(c)}</span></div>`:""; };
$("qMissed").innerHTML=(round.missed.length?`<div class="eyebrow" style="margin-bottom:4px">Missed</div>`+round.missed.map(e=>row(e)).join(""):"")
+(sk?`<div class="eyebrow" style="margin:12px 0 4px">Skipped</div>`+round.skipped.map(e=>row(e,"skipped")).join(""):"")
+(!round.missed.length&&!sk?`<div class="subl" style="margin-top:8px">Nothing missed. Flip to a harder section.</div>`:"");
const redo=round.missed.length+sk;
$("qRetry").disabled=!redo; $("qRetry").style.opacity=redo?1:.4;
$("qRetry").textContent=redo?`Retry ${round.missed.length&&sk?"missed & skipped":sk?"skipped":"missed"} (${redo})`:"Retry missed";
$("qBar").style.width="100%"; scoreLine(); saveRound();
}
$("qNext").onclick=()=>{ if(!answered) skipQuestion(); else advance(); };
$("qRestart").onclick=()=>startRound();
$("qRetry").onclick=()=>{ const redo=[...round.missed,...round.skipped]; if(redo.length) startRound(redo); };
$("qNew").onclick=()=>startRound();
// ---------- key (quick reference) ----------
const GLASS=[["Coupe","Most up crafted cocktails"],["Nick & Nora","Spirit-forward cocktails"],["Rocks","On the rocks / king cube"],["Collins","Still Sant Aniol, beer, cider, highballs & long cocktails"],["Goblet","Gin tonics & sangria BTG"],["Tulip","NA beers & tulip NA builds"],["Neat glass","Shots"],["Wine (bar)","Sparkling Sant Aniol & spritz"],["Flute","Sparkling wine BTG & bottle"],["White wine glass","Sangria pitcher service"],["AP glass","All BTG still wine"]];
const POURS=[["Vodka","Tito's"],["Gin","Citadelle"],["Rum","Flor de Caña"],["Tequila","Exotico Blanco"],["Mezcal","Banhez"],["Bourbon","Maker's Mark"],["Rye","Rittenhouse"]];
function buildKey(){
$("keyColors").innerHTML=DRINKS.filter(d=>d.colors.length).map(d=>`<div class="krow"><span class="chips" style="margin:0">${d.colors.map(cl=>`<span class="chip" style="background:${TAPE[cl]}"></span>`).join("")}</span><span class="kname">${esc(d.name)}</span><span class="kval">${esc(d.bottle||d.colors.join(" + "))}</span></div>`).join("")
+`<div class="krow"><span class="kname mute" style="font-size:14px;font-style:italic">Sangrias & NA builds — no batch color, built à la minute</span></div>`;
const hh=FOOD.filter(f=>f.hh).sort((a,b)=>parseFloat(a.hh)-parseFloat(b.hh));
$("keyHH").innerHTML=hh.map(f=>`<div class="krow"><span class="kname">${esc(f.name)}</span><span class="kval">$${esc(f.hh)}${/piece/.test(f.price)||parseFloat(f.hh)<=3?" / piece":""}${f.cat!=="Happy Hour"?" · dinner "+esc(f.price):""}</span></div>`).join("");
$("keyGlass").innerHTML=GLASS.map(g=>`<div class="krow"><span class="gicon">${GICON[g[0]]||""}</span><span class="kname">${g[0]}</span><span class="kval">${g[1]}</span></div>`).join("");
const dietRows=[["VG","Vegan"],["V","Vegetarian"],["P","Pescatarian"],["GF","Gluten-free"],["DF","Dairy-free"]].map(([code,label])=>{
const strict=FOOD.filter(f=>(DIET[f.name]||[]).includes(code)).map(f=>f.name);
const mod=FOOD.filter(f=>(DIET[f.name]||[]).includes(code+"*")).map(f=>f.name);
return `<div class="krow"><span class="dbadge ${code}">${label.toUpperCase()}</span><span class="kval"><b>Strict:</b> ${strict.map(esc).join(", ")||"—"}${mod.length?`<br><b>w/ mod · ask:</b> ${mod.map(esc).join(", ")}`:""}</span></div>`;}).join("");
$("keyDiet").innerHTML=dietRows+`<div class="krow"><span class="dbadge NONE">ALWAYS</span><span class="kval">Nut, shellfish, egg & fin-fish allergies: check the card, tell the kitchen, never guess. Fried items share one fryer.</span></div>`;
const legend=[["Gluten","gluten"],["Dairy","dairy"],["Egg","egg"],["Fin fish","fish"],["Shellfish","shellfish"],["Mollusk","mollusk"],["Tree nuts","nut"],["Soy","soy"],["Sesame","sesame"],["Pork","pork"],["Nightshade","nightshade"],["Allium","allium"],["Citrus","citrus"],["Mustard","mustard"]];
$("keyAllergens").innerHTML=legend.map(([l,k])=>`<span class="achip ${MAJOR.test(l)?"major":""}">${AICON[k]}${l}</span>`).join("");
$("keyPours").innerHTML=POURS.map(g=>`<div class="krow"><span class="kname">${g[0]}</span><span class="kval">${g[1]}</span></div>`).join("");
}
buildKey();
// ---------- progress ----------
const SUBJECTS=["Drinks","Food","Allergens & Mods","Wines by the glass","Resource guide"];
function progressData(){
const out={}; SUBJECTS.forEach(s=>out[s]={total:0,mastered:0,learning:0});
CARDS.forEach(c=>{const s=subjectOf(c); const st=stateOf(c); out[s].total++; if(st==="mastered")out[s].mastered++; else if(st==="learning")out[s].learning++;});
const tot=CARDS.length, m=Object.values(out).reduce((a,b)=>a+b.mastered,0);
const weak=CARDS.map(c=>({c,r:me.items[cardKey(c)]})).filter(x=>x.r&&(x.r.wrong>0||x.r.rate==="learn")).sort((a,b)=>(b.r.wrong-b.r.right)-(a.r.wrong-a.r.right)).slice(0,10);
return {out,tot,m,weak};
}
function renderProgress(){
if(!me)return;
const {out,tot,m,weak}=progressData();
$("pName").textContent=me.name+" · Progress";
$("pPct").textContent=Math.round(100*m/tot)+"%";
const q=me.quiz; $("pQuiz").textContent=q.total?`Quiz accuracy ${Math.round(100*q.right/q.total)}% · ${q.right} of ${q.total} answered correctly`:"No quiz answers yet";
$("pSubjects").innerHTML=SUBJECTS.map(s=>{const o=out[s]; const pm=o.total?100*o.mastered/o.total:0, pl=o.total?100*o.learning/o.total:0;
return `<div class="prow"><div class="lab"><span>${s}</span><span>${o.mastered} / ${o.total} mastered</span></div><div class="bar"><i style="width:${pm}%"></i></div><div class="bar" style="height:4px;margin-top:0"><i class="q" style="width:${pl}%"></i></div></div>`;}).join("");
$("pWeak").innerHTML=weak.length?weak.map(x=>`<div class="weak"><span>${esc(cardTitle(x.c))}</span><span>${x.r.wrong?x.r.wrong+" wrong":"learning"}</span></div>`).join(""):`<div class="subl">Nothing flagged yet — take the quiz.</div>`;
}
$("pCopy").onclick=async()=>{
const {out,tot,m,weak}=progressData(); const q=me.quiz;
const txt=[`Aventura Menu Trainer — ${me.name}`,`${new Date().toLocaleDateString()}`,`Overall: ${Math.round(100*m/tot)}% mastered (${m}/${tot})`,`Quiz: ${q.total?Math.round(100*q.right/q.total)+"% accuracy ("+q.right+"/"+q.total+")":"none yet"}`,"",...SUBJECTS.map(s=>`${s}: ${out[s].mastered}/${out[s].total}`),"",weak.length?"Needs work: "+weak.map(x=>cardTitle(x.c)).join(", "):""].join("\n");
try{await navigator.clipboard.writeText(txt);$("pCopy").textContent="Copied ✓";}catch(e){prompt("Copy this:",txt);}
setTimeout(()=>$("pCopy").textContent="Copy report for manager",1500);
};
$("pReset").onclick=()=>{ if(!me||!confirm(`Reset all progress for ${me.name}?`))return; me.items={}; me.quiz={right:0,total:0}; score={right:0,total:0}; persist(); renderProgress(); };
// ---------- modes ----------
function setMode(m){
["Flash","Quiz","Prog","Key"].forEach(k=>$("m"+k).classList.toggle("on",k===m));
$("flash").classList.toggle("hidden",m!=="Flash");
$("quiz").classList.toggle("hidden",m!=="Quiz");
$("prog").classList.toggle("hidden",m!=="Prog");
$("key").classList.toggle("hidden",m!=="Key");
$("pickBtn").hidden = (m==="Key"||m==="Prog");
if(m==="Prog") renderProgress();
}
$("mFlash").onclick=()=>setMode("Flash");
$("mQuiz").onclick=()=>{setMode("Quiz"); if(!round.queue.length||round.label!==filterLabel()) startRound();};
$("mKey").onclick=()=>setMode("Key");
$("mProg").onclick=()=>setMode("Prog");
if(store.last&&store.profiles[store.last]) setProfile(store.profiles[store.last].name); else showGate();
function resumeQuiz(){ if(!restoreRound()) startRound(); }
filter=null; labelPicker(); resetDeck(); resumeQuiz();
if(coachSeen<3){ $("coach").hidden=false; setTimeout(()=>$("coach").hidden=true,3000); }
