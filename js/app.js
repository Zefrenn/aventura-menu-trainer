// Aventura Menu Trainer — app (v5: Learn mode, manager-set quizzes, nickname sign-in)
// theme: recolor the drawings for dark mode, wire the moon/sun button
inkSVG(ILLUS,FOODILLUS,WGLASS,GICON); AVTheme.bind();
// photos: fetch the index, then repaint the card on screen (without counting a view)
loadPhotoIndex().then(()=>{ if(deck.length) render(true); });
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
function subjectOf(c){ if(DRINKCATS.includes(c.cat))return "Drinks"; if(FOODCATS.includes(c.cat))return "Food"; if(c.cat==="Allergens & Mods")return "Allergens & Mods"; if(c.cat==="Wines BTG"||c.cat==="Vino de Postre")return "Wines by the glass"; return "Resource guide"; }
function rec(c){ const k=cardKey(c); return me.items[k]||(me.items[k]={seen:0,right:0,wrong:0,rate:null}); }
// lv (Learn level) wins when it's set: 0 to learn · 1 learning (right once) · 2 mastered (right again, on a different question)
function stateOf(c){ const r=me&&me.items[cardKey(c)]; if(!r||(!r.seen&&!r.right&&!r.wrong&&r.lv===undefined))return "unseen";
if(r.lv!==undefined) return r.lv>=2?"mastered":"learning";
if(r.rate==="learn")return "learning"; if(r.rate==="got"||(r.right>=2&&r.wrong===0))return "mastered"; return "learning"; }
function learnLevel(c){ const r=me&&me.items[cardKey(c)]; if(!r) return 0; if(r.lv!==undefined) return r.lv; return stateOf(c)==="mastered"?2:(r.right>0?1:0); }
let SYNC=false, syncTimer=null, dirty=false, saving=Promise.resolve();
function cloudSay(t){$("cloud").textContent=t;}
// quiz = manager-assigned quizzes (best attempt of each) · learn = Learn-mode answers
function quizTotals(){ let r=0,t=0; Object.values(me.quizzes||{}).forEach(x=>{ if(x&&x.best){ r+=x.best.right||0; t+=x.best.total||0; } }); return {right:r,total:t}; }
function summary(){
let m=0,t=0,learn=[]; const bySub={};
CARDS.forEach(c=>{t++; const sub=subjectOf(c); bySub[sub]=bySub[sub]||{m:0,t:0}; bySub[sub].t++;
const st=stateOf(c); if(st==="mastered"){m++;bySub[sub].m++;} const x=me.items[cardKey(c)]; if(x&&(x.wrong>0||x.rate==="learn")&&st!=="mastered") learn.push({n:cardTitle(c),w:x.wrong||0}); });
learn.sort((a,b)=>b.w-a.w);
return {pct:Math.round(100*m/t),mastered:m,total:t,bySub,weak:learn.slice(0,5).map(x=>x.n),quiz:quizTotals(),learn:me.learn||{right:0,total:0},quizzes:me.quizzes||{}};
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
const who=me.slug, remote=await remoteLoad(who);
if(!me||me.slug!==who) return; // switched people while loading
if(remote){ // union-merge: per card keep whichever side has more activity; never let an empty device wipe the server
const act=r=>(r.seen||0)+(r.right||0)+(r.wrong||0);
const merged=JSON.parse(JSON.stringify(remote)); merged.items=merged.items||{};
Object.keys(me.items).forEach(k=>{ const L=me.items[k], R=merged.items[k]; if(!R||act(L)>act(R)) merged.items[k]=L; });
const lq=me.quiz||{right:0,total:0}, rq=remote.quiz||{right:0,total:0}; merged.quiz=(lq.total>rq.total)?lq:rq;
const ll=me.learn||{right:0,total:0}, rl=remote.learn||{right:0,total:0}; merged.learn=(ll.total>rl.total)?ll:rl;
merged.quizzes=Object.assign({},remote.quizzes||{}); Object.entries(me.quizzes||{}).forEach(([id,x])=>{ const y=merged.quizzes[id]; if(!y||(x.tries||0)>(y.tries||0)) merged.quizzes[id]=x; });
merged.name=me.name; merged.slug=me.slug; merged.started=Math.min(merged.started||Date.now(),me.started||Date.now());
me=merged; score={right:me.quiz.right,total:me.quiz.total}; store.profiles[me.slug]=me; saveStore(store); resetDeck(); afterProfile(); }
SYNC=true; cloudSay("synced"); $("pWhere").textContent="Progress is saved under your name — pick up on any device.";
dirty=true; flush();
}
// keep what people type: "MR", "Jojo", "Maria R". All-lowercase gets tidied ("mr" -> "MR", "jojo b" -> "Jojo B").
function prettyName(n){ const t=String(n).trim().replace(/\s+/g," ");
if(/[A-ZÀ-Þ]/.test(t)) return t; if(/^[a-z]{1,3}$/.test(t)) return t.toUpperCase();
return t.replace(/(^|\s)(\S)/g,(m,s,ch)=>s+ch.toUpperCase()); }
function setProfile(name){
const sl=slug(name); if(!sl) return false;
me=store.profiles[sl]||{name:prettyName(name),slug:sl,items:{},quiz:{right:0,total:0},started:Date.now()};
if(!me.learn) me.learn={right:0,total:0}; if(!me.quizzes) me.quizzes={};
score={right:me.quiz.right,total:me.quiz.total};
$("whoName").textContent=me.name; $("gate").classList.add("hidden");
L={filter:undefined,items:[],queue:[],done:[],start:{},roundNo:0,review:false,state:"idle"}; activeQuiz=null; round.queue=[];
connectServer();
return true;
}
function showGate(){
const known=Object.values(store.profiles).sort((a,b)=>(b.updated||0)-(a.updated||0)).slice(0,8);
$("gateMsg").textContent=known.length?"Tap yours, or type your name, initials or a nickname below.":"Type your name, initials or a nickname — whatever you'll remember. Use the same one every time and your progress follows you to any phone.";
$("gateKnown").innerHTML=known.map(p=>`<button data-s="${p.slug}">${esc(p.name)}</button>`).join("");
[...$("gateKnown").children].forEach(b=>b.onclick=()=>enter(store.profiles[b.dataset.s].name));
$("gateName").value=""; $("gateErr").textContent=""; gateAsked=null; $("gate").classList.remove("hidden"); setTimeout(()=>$("gateName").focus(),50);
}
function enter(name){ if(!setProfile(name)) return; resetDeck(); afterProfile(); }
// someone new typing a nickname that's already taken gets asked first, so two "Sam"s don't share progress
let gateAsked=null;
async function gateSubmit(){
const v=$("gateName").value, sl=slug(v), err=$("gateErr");
if(!sl){ err.textContent="Use at least one letter or number."; $("gateName").focus(); return; }
if(store.profiles[sl]||gateAsked===sl){ enter(v); return; }
const b=$("gateGo"); b.disabled=true; b.textContent="One sec…";
const remote=await remoteLoad(sl);
b.disabled=false; b.textContent="Start studying";
if(remote){ gateAsked=sl; err.innerHTML=`<b>${esc(remote.name)}</b> already has progress saved. If that's you, tap Start studying again. If not, add a letter or try another nickname.`; return; }
enter(v);
}
$("gateGo").onclick=gateSubmit;
$("gateName").onkeydown=e=>{ if(e.key==="Enter") gateSubmit(); };
$("gateName").oninput=()=>{ if(gateAsked&&slug($("gateName").value)!==gateAsked){ gateAsked=null; $("gateErr").textContent=""; } };
$("whoSwitch").onclick=showGate;
// ---------- toast ----------
let toastT=null; function toast(t){ const el=$("toast"); el.textContent=t; el.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove("show"),1400); }
// ---------- pools ----------
function basePool(){ return cardsFor(filter); }
function pool(){
const p=basePool();
if(weakOnly&&me){ const w=p.filter(c=>stateOf(c)!=="mastered"); if(w.length) return w; }
return p;
}
function shuffleArr(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function filterLabel(){return filter===null?"Everything":(filter==="drinks"?"All drinks":filter==="food"?"All food":filter);}
function countFor(v){ return cardsFor(v).length; }
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
function setFilter(v){ filter=v; labelPicker(); resetDeck(); if(curMode==="Learn") learnOpen(false); }
// ---------- flashcards ----------
function resetDeck(){ deck=shuffleArr(pool()); idx=0; render(); }
function achipsHTML(list,major){ return `<div class="achips">${list.map(a=>`<span class="achip${major?" major":""}">${aicon(a)}${esc(a)}</span>`).join("")}</div>`; }
function pairingHTML(p){ return `<div class="pairing"><svg viewBox="0 0 24 24"><path d="M8 3h8l-1 7a3 3 0 0 1-6 0zM12 13v7M8 20h8"/></svg><span><span class="lbl" style="display:inline;margin-right:6px">Pair</span>${esc(p)}</span></div>`; }
// front + back of a card as HTML (also used by Learn to introduce a new card)
function faceHTML(c){ let fh="",bh="";
if(c.kind==="drink"){
const d=c.d;
fh=`<div class="inner"><div class="eyebrow cat">${esc(d.cat)}</div><div class="name">${esc(d.name)}</div><div class="price">${esc(d.price)}</div>${Say.btn(d.name)}${visual("d",d.name,ILLUS[d.name],"illus")}<div class="hint">Say the glass, build and garnish out loud — then tap to check.</div></div>`;
const chips=d.colors.length
?`<div class="chips">${d.colors.map(cl=>`<span class="chip" style="background:${TAPE[cl]}" aria-hidden="true"></span>`).join("")}<span class="lbl">Batch bottle: ${esc(d.bottle||d.colors.join(" + "))} tape</span></div>`
:`<div class="chips"><span class="lbl">No batch bottle — built to order</span></div>`;
bh=`<div class="top"><div class="vis">${visual("d",d.name,ILLUS[d.name],"illus","mini")}</div><div><div class="eyebrow">${esc(d.cat)} · ${esc(d.price)}</div><h2 class="dname">${esc(d.name)}</h2></div>${Say.btn(d.name,true)}</div>
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
fh=`<div class="inner"><div class="eyebrow cat">${esc(f.cat)}</div><div class="name${f.name.length>22?" long":""}">${esc(f.name)}</div><div class="price">${esc(f.price)}${hh}</div>${Say.btn(f.name)}${visual("f",f.name,FOODILLUS[f.ill],"fillus")}<div class="hint">Say the drop line, allergens and mods out loud — then tap to check.</div></div>`;
bh=`<div class="top"><div class="vis">${visual("f",f.name,FOODILLUS[f.ill],"fillus","mini")}</div><div><div class="eyebrow">${esc(f.cat)} · ${esc(f.price)}${hh}</div><h2 class="dname">${esc(f.name)}</h2></div>${Say.btn(f.name,true)}</div>
<div class="callout"><span class="lbl">Drop line</span><p class="drop">“${esc(f.drop)}”</p></div>
${f.tip?`<div class="callout${tipWarn?" warn":""}"><span class="lbl">${tipWarn?"Know this":"Tip"}</span><p>${esc(f.tip)}</p></div>`:""}
<div class="row"><span class="lbl">Major allergens</span>${major.length?achipsHTML(major,true):`<div class="also">None of the major allergens</div>`}${minor.length?`<div class="also">Also contains: ${esc(minor.join(", "))}</div>`:""}${parts[1]?`<div class="cc">⚠ ${esc(parts[1].trim())}</div>`:""}</div>
<div class="row"><span class="lbl">Diets</span>${dietBadges(f.name)}</div>
<div class="spec"><div><span class="lbl">Mods</span>${esc(f.mods)}</div><div><span class="lbl">Serve with</span>${esc(f.ut)}</div></div>
${f.pair?pairingHTML(f.pair):""}
<details class="ing"><summary>Full ingredient list</summary><p>${esc(f.ing)}</p></details>`;
} else if(c.kind==="fact"){
const f=c.f;
fh=`<div class="inner"><div class="eyebrow cat">${esc(f.cat)}</div><div class="rule"></div><div class="name qq">${esc(f.q)}</div><div class="hint">Tap to reveal</div></div>`;
bh=`<div class="eyebrow">${esc(f.cat)}</div><h2 class="dname" style="margin-top:6px;font-family:var(--body);text-transform:none;letter-spacing:0;font-weight:500;font-size:19px">${esc(f.q)}</h2>
<div class="callout"><span class="lbl">Answer</span><p>${esc(f.a)}</p></div>${f.x?`<div class="row"><span class="lbl">More</span>${esc(f.x)}</div>`:""}`;
} else {
const w=c.w, k=wineKind(w);
fh=`<div class="inner"><div class="eyebrow cat">${esc(c.cat)}</div><div class="name long">${esc(w.name)}</div><div class="price">${w.region?esc(w.region)+" · ":""}${esc(w.price)}</div>${Say.btn(w.name)}<div class="wglass">${WGLASS[k]||""}</div><div class="hint">Grape · place · notes · one story · pairing</div></div>`;
bh=`<div class="top"><div class="vis"><div class="wglass mini">${WGLASS[k]||""}</div></div><div><div class="eyebrow">${esc(c.cat)} · ${esc(w.price)}</div><h2 class="dname">${esc(w.name)}</h2>${w.region?`<div class="sub">${esc(w.region)}</div>`:""}</div>${Say.btn(w.name,true)}</div>
<div class="callout"><span class="lbl">Notes</span><p class="drop">${esc(w.notes)}</p></div>
<div class="spec"><div><span class="lbl">Grape</span>${esc(w.grape)}</div><div><span class="lbl">Similar to</span>${esc(w.like)}</div></div>
<div class="row"><span class="lbl">Story</span>${esc(w.story)}</div>
<div class="row"><span class="lbl">Pair with</span>${esc(w.pair)}</div>`;
}
return {F:fh,B:bh}; }
function render(quiet){
const c=deck[idx]; if(!c) return; if(!quiet){ $("card").classList.remove("flipped"); $("front").scrollTop=0; $("back").scrollTop=0; }
if(me&&!quiet){ rec(c).seen++; persist(); }
const F=$("front"), B=$("back"), fc=faceHTML(c); F.innerHTML=fc.F; B.innerHTML=fc.B;
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
function applyRate(v){ if(!me)return; const r=rec(deck[idx]); r.rate=v; if(v==="got"){r.right++; r.lv=2;} else r.lv=Math.min(r.lv===undefined?0:r.lv,1); persist(); toast(v==="got"?"Got it · mastered":"Still learning"); }
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
if(c.kind==="custom"){ const x=c.cq; q={prompt:esc(x.q),answer:x.a,opts:x.wrong.filter(w=>w&&w!==x.a).slice(0,3),vis:null,hint:null,explain:x.a}; }
else if(c.kind==="drink"){
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
// ================= LEARN (Quizlet-style) =================
// Small rounds of up to 7 cards. Each card climbs: To learn -> Learning (right once) -> Mastered (right again,
// on a different question, in a later round). Brand-new cards are shown first ("meet it") before any question.
// A miss comes back a couple of questions later in the same round. No score, no timer. After each round a
// checkpoint shows what moved. Everything saves per trainee, so a closed tab picks up where it left off.
const LEARN_N=7;
const CARDBYKEY=new Map(CARDS.map(c=>[cardKey(c),c]));
let CUSTOM=new Map(); // a manager's own written questions for the open quiz
const cardBy=k=>CARDBYKEY.get(k)||CUSTOM.get(k);
const KEYS=["A","B","C","D","E","F"];
const SVG_HINT='<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/></svg>';
const SVG_NOSE='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.7-.8 1.2V14M12 17.2v.1"/></svg>';
let curMode="Flash", studyMode="Flash";
let L={filter:undefined,items:[],queue:[],done:[],start:{},roundNo:0,review:false,state:"idle"}, lq=null, lAnswered=false;
const LKEY=()=>me?"av_learn_"+me.slug:null;
function saveLearn(){ const k=LKEY(); if(!k) return; try{ localStorage.setItem(k,JSON.stringify({v:1,filter:L.filter,items:L.items,queue:L.queue,done:L.done,start:L.start,roundNo:L.roundNo,review:L.review,state:L.state,at:Date.now()})); }catch(e){} }
function loadLearn(){ const k=LKEY(); if(!k) return null; try{ const o=JSON.parse(localStorage.getItem(k)||"null"); if(o&&o.v===1&&Date.now()-(o.at||0)<14*864e5) return o; }catch(e){} return null; }
const CHEER=["¡Vale! That's it.","Nice — you got it.","¡Eso es!","Exactly right.","Spot on.","You know this one."];
const SOFT=["No worries — this one comes back in a minute.","Close. It'll come around again shortly.","That's how it sticks. You'll see it again soon."];
const DONE_LINES=["Nice work.","¡Muy bien!","Good round.","Keep it rolling."];
function lvCounts(){ const p=basePool(), n=[0,0,0]; p.forEach(c=>n[learnLevel(c)]++); return {n,tot:p.length}; }
function learnBar(){
const {n,tot}=lvCounts(), w=x=>tot?(100*x/tot).toFixed(2):0;
$("lSeg").innerHTML=`<div class="lseg" role="img" aria-label="${esc(filterLabel())}: ${n[2]} mastered, ${n[1]} learning, ${n[0]} to learn"><i class="m" style="width:${w(n[2])}%"></i><i class="l" style="width:${w(n[1])}%"></i></div>
<div class="llegend" aria-hidden="true"><span><i class="m"></i>${n[2]} mastered</span><span><i class="l"></i>${n[1]} learning</span><span><i class="n"></i>${n[0]} to learn</span></div>
${filter===null&&n[2]<10?`<button class="ltip" id="lTip">Tip: pick one section, like Cócteles or Tapas, and learn it a few cards at a time ›</button>`:""}`;
if($("lTip")) $("lTip").onclick=openSheet;
}
function learnTop(){
return `<div class="rounds"><span>${esc(filterLabel())}${L.review?" · review":""}</span><span>Round ${L.roundNo} · ${L.done.length} of ${L.items.length}</span></div>
<div class="ldots" aria-hidden="true">${L.items.map(k=>`<i class="${L.done.includes(k)?"on":""}${L.queue[0]===k&&L.state!=="check"?" cur":""}"></i>`).join("")}</div>`;
}
// open Learn for the current section: resume the saved round if it's the same section, else start one
function learnOpen(fresh){
if(!me) return;
if(!fresh){
if(L.filter===filter&&L.state!=="idle"){ learnResume(); return; }
const o=loadLearn(), ok=k=>CARDBYKEY.has(k);
if(o&&o.filter===filter){ Object.assign(L,{filter:o.filter,items:(o.items||[]).filter(ok),queue:(o.queue||[]).filter(ok),done:(o.done||[]).filter(ok),start:o.start||{},roundNo:o.roundNo||1,review:!!o.review,state:o.state||"q"});
if(L.items.length){ learnResume(); return; } }
}
Object.assign(L,{filter,roundNo:0,review:false}); learnRound();
}
function learnResume(){ learnBar(); if(L.state==="check") learnCheckpoint(); else if(L.state==="done") learnAllDone(); else learnShow(); }
function learnRound(){
const p=basePool(); let pickd;
if(L.review) pickd=shuffleArr(p.slice()).slice(0,LEARN_N);
else { const l1=shuffleArr(p.filter(c=>learnLevel(c)===1)), l0=shuffleArr(p.filter(c=>learnLevel(c)===0));
// mix: up to 4 cards that are halfway there, the rest new — then top up from whichever has more
pickd=[...l1.slice(0,4),...l0.slice(0,LEARN_N)].slice(0,LEARN_N); if(pickd.length<LEARN_N) pickd=pickd.concat(l1.slice(4)).slice(0,LEARN_N); pickd=shuffleArr(pickd); }
if(!pickd.length){ learnAllDone(); return; }
L.filter=filter; L.items=pickd.map(cardKey); L.queue=L.items.slice(); L.done=[]; L.roundNo++; L.state="q";
L.start={}; pickd.forEach(c=>L.start[cardKey(c)]=learnLevel(c));
learnBar(); learnShow();
}
function learnShow(){
if(!L.queue.length){ learnCheckpoint(); return; }
const k=L.queue[0], c=cardBy(k); if(!c){ L.queue.shift(); learnShow(); return; }
const r=me.items[k], fresh=!r||(!r.seen&&!r.right&&!r.wrong);
if(!L.review&&learnLevel(c)===0&&fresh) learnIntro(c); else learnAsk(c);
}
// brand-new card: show it before asking anything about it
function learnIntro(c){
L.state="intro"; saveLearn();
const hook=hookOf(c), {B}=faceHTML(c);
$("lBox").innerHTML=`${learnTop()}<div class="lnew"><span class="newtag">New</span><span>Have a look first — the question comes next.</span></div>
${hook?`<div class="remember intro"><span class="lbl">Remember it</span>${esc(hook)}</div>`:""}
<div class="lcard back">${B}</div>
<div class="nav"><button class="gold" id="lGo">Got it — ask me</button></div>`;
rec(c).seen++; persist();
$("lGo").onclick=()=>{ learnAsk(c); window.scrollTo({top:$("learn").offsetTop-8,behavior:"smooth"}); };
}
function learnAsk(c){
L.state="q"; saveLearn();
const r=me.items[cardKey(c)];
let q=makeQuestion(c); // a second question on the same card should be a different one
for(let i=0;i<6&&r&&r.lp&&q.prompt===r.lp;i++) q=makeQuestion(c);
lq={...q,card:c}; lAnswered=false;
$("lBox").innerHTML=`${learnTop()}<div class="prompt">${promptHTML(lq,c)}</div>
${lq.hint?`<div class="qassist"><button id="lHint" aria-controls="lHintBox">${SVG_HINT}Pista · Hint</button></div><div class="hintbox" id="lHintBox" hidden aria-live="polite"></div>`:""}
<div class="opts" id="lOpts"></div>
<button class="nosabe" id="lNoSe">${SVG_NOSE}No sé · I don't know</button>
<div class="feedback" id="lFeed" aria-live="polite"></div>
<div class="nav hidden" id="lNav"><button class="gold" id="lNext">Continue</button></div>`;
lq.choices.forEach((ch,i)=>{ const b=document.createElement("button"); b.textContent=ch; b.dataset.v=ch; b.dataset.k=KEYS[i]; b.onclick=()=>learnAnswer(ch===lq.answer?"right":"wrong",b); $("lOpts").appendChild(b); });
if(lq.hint) $("lHint").onclick=()=>{ if(lAnswered) return; $("lHintBox").innerHTML=`<span class="lbl">Pista · hint</span>${lq.hint}`; $("lHintBox").hidden=false; $("lHint").disabled=true;
if(lq.elim) shuffleArr([...$("lOpts").children].filter(b=>b.dataset.v!==lq.answer)).slice(0,lq.elim).forEach(b=>{ b.classList.add("elim"); b.disabled=true; b.setAttribute("aria-label",b.textContent+" (ruled out)"); }); };
$("lNoSe").onclick=()=>learnAnswer("nose",null);
$("lNext").onclick=()=>{ learnShow(); };
}
function learnAnswer(kind,btn){
if(lAnswered) return; lAnswered=true;
const ok=kind==="right", c=lq.card, k=cardKey(c), r=rec(c), before=learnLevel(c);
[...$("lOpts").children].forEach(b=>{ b.disabled=true; if(b.dataset.v===lq.answer) b.classList.add("correct"); });
if(btn&&!ok) btn.classList.add("wrong");
$("lNoSe").hidden=true; if($("lHint")) $("lHint").closest(".qassist").hidden=true;
let lv=before;
L.queue.shift();
if(ok){ r.right++; lv=Math.min(2,before+1); r.lp=lq.prompt; L.done.push(k); }
else { r.wrong++; r.rate=null; if(before>=2) lv=1; L.queue.splice(Math.min(2,L.queue.length),0,k); }
r.lv=lv; me.learn={right:(me.learn.right||0)+(ok?1:0),total:(me.learn.total||0)+1}; persist();
const hook=hookOf(c), {pk,name}=itemOf(c);
let html=ok?`<span class="ok">${pick(CHEER)}</span>${lv>before?` <span class="lvup l${lv}">${lv>=2?"Mastered":"Learning"} ✓</span>`:""}`
:kind==="nose"?`<span class="soft">No pasa nada — here it is.</span><div class="fbtext">It'll come back in a minute.</div>`
:`<span class="no">Not quite.</span><div class="fbtext">${pick(SOFT)}</div>`;
if(hook) html+=`<div class="remember"><span class="lbl">Remember it</span>${esc(hook)}</div>`;
if(!ok) html+=`<div class="${hook?"fbdetail":"fbtext"}">${esc(lq.explain)}</div>`;
const sayb=name?Say.btn(name):""; if(sayb) html+=`<div class="fbx">${sayb}</div>`;
if(lq.vis==="after"&&pk) html+=visual(pk,name,"","","qs");
$("lFeed").innerHTML=html; $("lNav").classList.remove("hidden");
$("lNext").textContent=L.queue.length?"Continue":"Finish round";
learnBar(); saveLearn(); $("lNext").focus({preventScroll:true});
}
function learnCheckpoint(){
L.state="check"; saveLearn(); learnBar();
const {n,tot}=lvCounts(), left=n[0]+n[1];
const rows=L.items.map(k=>{ const c=cardBy(k); if(!c) return ""; const lv=learnLevel(c), was=L.start&&L.start[k]!==undefined?L.start[k]:lv;
return `<div class="weak"><span>${esc(cardTitle(c))}</span><span class="lvtag l${lv}">${lv>=2?"Mastered":lv===1?"Learning":"To learn"}${lv>was?" ↑":""}</span></div>`; }).join("");
$("lBox").innerHTML=`<div class="results"><div class="eyebrow">Round ${L.roundNo} done</div><div class="big sm">${pick(DONE_LINES)}</div>
<div class="subl">${left?`${esc(filterLabel())}: ${n[2]} mastered · ${n[1]} learning`:`That's every card in ${esc(filterLabel())}.`}</div></div>
<div class="missed">${rows}</div>
<div class="nav"><button class="gold" id="lMore">${left?"Keep going":"Finish"}</button></div>
<div class="subl lsmall">Stop anytime — everything's saved.</div>`;
$("lMore").onclick=()=>{ L.review=false; learnRound(); };
}
function learnAllDone(){
L.state="done"; L.queue=[]; L.items=[]; saveLearn(); learnBar();
const tot=basePool().length;
$("lBox").innerHTML=`<div class="results"><div class="eyebrow">${esc(filterLabel())}</div><div class="big sm">You know all ${tot}.</div>
<div class="subl">Every card here is mastered. Review to keep it fresh, or pick another section.</div></div>
<div class="nav"><button class="gold" id="lPick">Pick a section</button><button id="lReview">Review these</button></div>`;
$("lPick").onclick=openSheet; $("lReview").onclick=()=>{ L.review=true; learnRound(); };
}

// ================= QUIZZES (only when a manager sets one) =================
// Quizzes are made on the manager board (Manager → Quizzes). Staff only see the Quiz button while one is live.
// A quiz = cards from the chosen sections + any questions the manager wrote. Best score goes to the board.
let QUIZZES=[], activeQuiz=null;
let round={queue:[],i:0,right:0,answered:0,missed:[],skipped:[],retry:false,done:false,recorded:false}, hintUsed=false;
async function loadQuizzes(){
try{ const r=await fetch("/api/quizzes",{cache:"no-store"}); if(r.ok){ const j=await r.json(); QUIZZES=Array.isArray(j.quizzes)?j.quizzes:[]; } }catch(e){}
renderQuizCall(); if(curMode==="Quiz"&&!activeQuiz) renderQuizList();
}
const quizResult=q=>me&&me.quizzes&&me.quizzes[q.id]||null;
const fmtDay=t=>new Date(t).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
function quizPool(q){ return (q.sections||[]).length?cardsForMany(q.sections.map(s=>s==="__all__"?null:s)):[]; }
function quizSize(q){ const cu=(q.custom||[]).length; return Math.min(Math.max(q.count||10,cu),cu+quizPool(q).length); }
function renderQuizCall(){
const el=$("quizCall");
if(!QUIZZES.length||!me){ el.hidden=true; if(curMode==="Quiz") setMode(studyMode); return; }
const todo=QUIZZES.filter(q=>!quizResult(q));
el.hidden=curMode==="Quiz"; el.classList.toggle("done",!todo.length);
el.innerHTML=todo.length
?`<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/></svg><span class="qc-t"><small>Quiz from your manager</small><b>${todo.length===1?esc(todo[0].title):todo.length+" quizzes"}</b></span><span class="qc-go">Whenever you're ready ›</span>`
:`<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg><span class="qc-t"><small>Quizzes</small><b>All done</b></span><span class="qc-go">See them ›</span>`;
}
$("quizCall").onclick=()=>setMode("Quiz");
function showQuizPane(p){ const list=p==="list";
$("qList").classList.toggle("hidden",!list); $("qBox").classList.toggle("hidden",list||p==="done"); $("qDone").classList.toggle("hidden",p!=="done");
$("qNavPlay").classList.toggle("hidden",p!=="play"); $("qNavDone").classList.toggle("hidden",p!=="done"); $("qScore").classList.toggle("hidden",p!=="play");
$("qBack").textContent=list?"‹ Back to studying":"‹ All quizzes"; }
function renderQuizList(){
activeQuiz=null; CUSTOM=new Map(); showQuizPane("list");
const items=QUIZZES.map(q=>{ const r=quizResult(q), n=quizSize(q), mid=hasSavedRound(q);
return `<div class="q qitem"><div class="eyebrow">${r?"Done":"New"} · from ${!q.by||q.by==="Manager"?"your manager":esc(q.by)}</div><h3 class="qtitle">${esc(q.title)}</h3>
${q.note?`<p class="qnote">${esc(q.note)}</p>`:""}
<div class="subl">${n} question${n===1?"":"s"}${q.until?" · open until "+fmtDay(q.until):""}${q.hints!==false?" · hints on":""}</div>
${r?`<div class="qres">Your best: <b>${r.best.right} of ${r.best.total}</b> · ${r.tries} ${r.tries===1?"try":"tries"}</div>`:""}
<div class="nav"><button class="${r&&!mid?"":"gold"}" data-q="${esc(q.id)}">${mid?"Pick up where you left off":r?"Take it again":"Start quiz"}</button></div></div>`; }).join("");
$("qList").innerHTML=(items||`<div class="q"><p class="subl">No quizzes right now. Keep going in Learn.</p></div>`)
+`<p class="subl lsmall">Quizzes are short check-ins: no timer, hints are fine, and you can take them again. Your manager sees your best score.</p>`;
$("qList").querySelectorAll("button[data-q]").forEach(b=>b.onclick=()=>openQuiz(b.dataset.q));
}
function openQuiz(id){ const q=QUIZZES.find(x=>x.id===id); if(!q) return; activeQuiz=q;
CUSTOM=new Map((q.custom||[]).map((x,i)=>{ const key="c:"+q.id+":"+i; return [key,{kind:"custom",key,title:x.q.length>70?x.q.slice(0,68)+"…":x.q,cat:q.title,cq:x}]; }));
if(!restoreRound()) startRound(); window.scrollTo({top:0,behavior:"smooth"}); }
// ---- rounds: queue entries are {k: card key, q: the exact question once asked} ----
// Missed/skipped keep the exact question, so practice re-asks what you missed. Saved per trainee + quiz.
const RKEY=q=>me&&q?"av_quiz_"+me.slug+"_"+q.id:null;
function hasSavedRound(q){ try{ const o=JSON.parse(localStorage.getItem(RKEY(q))||"null"); return !!(o&&o.v===2&&!o.done&&o.updated===q.updated&&Date.now()-(o.at||0)<7*864e5); }catch(e){ return false; } }
function saveRound(){ const k=RKEY(activeQuiz); if(!k) return;
try{ localStorage.setItem(k,JSON.stringify({v:2,updated:activeQuiz.updated,queue:round.queue,i:round.i,right:round.right,answered:round.answered,missed:round.missed,skipped:round.skipped,retry:round.retry,done:round.done,recorded:round.recorded,cur:answered?"answered":"open",at:Date.now()})); }catch(e){} }
function restoreRound(){
const k=RKEY(activeQuiz); if(!k) return false; let o=null;
try{ o=JSON.parse(localStorage.getItem(k)||"null"); }catch(e){}
if(!o||o.v!==2||o.done||o.updated!==activeQuiz.updated||!Array.isArray(o.queue)||Date.now()-(o.at||0)>7*864e5) return false;
const ok=e=>e&&cardBy(e.k);
const queue=o.queue.filter(ok); if(!queue.length) return false;
Object.assign(round,{queue,i:Math.min(o.i||0,queue.length-1),right:o.right||0,answered:o.answered||0,missed:(o.missed||[]).filter(ok),skipped:(o.skipped||[]).filter(ok),retry:!!o.retry,done:false,recorded:!!o.recorded});
if(o.cur==="answered"){ if(round.i>=round.queue.length-1) finishRound(); else { round.i++; showPlay(); showQuestion(); } }
else { showPlay(); showQuestion(); }
return true;
}
function showPlay(){ showQuizPane("play"); }
function startRound(entries){
const q=activeQuiz; if(!q) return;
let queue;
if(entries){ queue=shuffleArr(entries.filter(e=>cardBy(e.k)).map(e=>({k:e.k,q:e.q?JSON.parse(JSON.stringify(e.q)):null}))); }
else { const cu=[...CUSTOM.keys()], n=quizSize(q);
queue=shuffleArr([...cu,...shuffleArr(quizPool(q)).slice(0,Math.max(0,n-cu.length)).map(cardKey)]).map(k=>({k,q:null})); }
Object.assign(round,{queue,i:0,right:0,answered:0,missed:[],skipped:[],retry:!!entries,done:false,recorded:false});
if(!queue.length){ renderQuizList(); return; }
showPlay(); showQuestion();
}
function showQuestion(){
const e=round.queue[round.i], c=cardBy(e.k);
// a saved picture question with no live photo gets a fresh question instead
const it=itemOf(c), noPic=e.q&&(e.q.vis==="illus"||(e.q.vis==="id"&&!(it.pk&&photoOf(it.pk,it.name))));
if(!e.q||noPic) e.q=makeQuestion(c); else e.q.choices=shuffleArr(e.q.choices.slice());
currentQ={...e.q,card:c}; answered=false; hintUsed=false;
$("qCat").textContent=activeQuiz.title+(round.retry?" · practice":""); $("qPos").textContent=`Question ${round.i+1} of ${round.queue.length}`;
$("qBar").style.width=(100*round.i/round.queue.length)+"%";
$("qPrompt").innerHTML=promptHTML(currentQ,c); $("qFeed").innerHTML=""; $("qOpts").innerHTML="";
currentQ.choices.forEach((ch,i)=>{ const b=document.createElement("button"); b.textContent=ch; b.dataset.v=ch; b.dataset.k=KEYS[i]; b.onclick=()=>reveal(ch===currentQ.answer?"right":"wrong",b); $("qOpts").appendChild(b); });
const hints=activeQuiz.hints!==false&&!!currentQ.hint;
$("qHint").hidden=!hints; $("qHint").disabled=false; $("qHintBox").hidden=true; $("qHintBox").innerHTML="";
$("qNoSe").disabled=false;
navLabel(); scoreLine(); saveRound();
}
function navLabel(){ const last=round.i>=round.queue.length-1;
$("qNext").classList.toggle("gold",answered);
$("qNext").textContent=answered?(last?"Finish":"Next question"):(last?"Skip · finish":"Skip ›"); }
function scoreLine(){ $("qScore").textContent=`So far: ${round.right} of ${round.answered}`+(round.skipped.length?` · ${round.skipped.length} skipped`:""); }
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
if(me&&currentQ.card.kind!=="custom"){ const r=rec(currentQ.card); if(ok){r.right++;} else {r.wrong++; r.rate=null; if(r.lv>=2) r.lv=1;} persist(); }
navLabel(); scoreLine(); saveRound();
}
function advance(){ if(round.i>=round.queue.length-1) finishRound(); else { round.i++; showQuestion(); } }
function skipQuestion(){ if(answered) return; const e=round.queue[round.i]; round.skipped.push({k:e.k,q:e.q}); toast("Skipped · you can practice it after"); advance(); }
$("qHint").onclick=()=>{
if(answered||!currentQ||!currentQ.hint) return; hintUsed=true;
$("qHintBox").innerHTML=`<span class="lbl">Pista · hint</span>${currentQ.hint}`; $("qHintBox").hidden=false; $("qHint").disabled=true;
if(currentQ.elim){ const wrong=[...$("qOpts").children].filter(b=>b.dataset.v!==currentQ.answer);
shuffleArr(wrong).slice(0,currentQ.elim).forEach(b=>{ b.classList.add("elim"); b.disabled=true; b.setAttribute("aria-label",b.textContent+" (ruled out)"); }); }
};
$("qNoSe").onclick=()=>reveal("nose",null);
function recordQuiz(){
const q=activeQuiz, tot=round.queue.length, right=round.right, prev=me.quizzes[q.id];
const missed=[...round.missed,...round.skipped].map(e=>{ const c=cardBy(e.k); return c?cardTitle(c):""; }).filter(Boolean);
const better=!prev||!prev.best||right/tot>=prev.best.right/prev.best.total;
me.quizzes[q.id]={title:q.title,best:better?{right,total:tot}:prev.best,last:{right,total:tot},tries:(prev&&prev.tries||0)+1,at:Date.now(),missed:missed.slice(0,15)};
round.recorded=true; persist(); renderQuizCall();
}
function finishRound(){
round.done=true;
if(!round.retry&&!round.recorded&&me) recordQuiz();
showQuizPane("done");
const tot=round.queue.length, sk=round.skipped.length, r=round.right, pct=tot?r/tot:0;
$("qFinal").textContent=`${r} of ${tot}`;
$("qFinalSub").textContent=round.retry?"Practice round · this doesn't change your score."
:pct===1?"Perfect. ¡Increíble!":pct>=.8?"Great work — you know this.":pct>=.5?"Solid. Practice the misses and they'll stick.":"Good start. The ones you missed are below — Learn will help them stick.";
const tag=c=>c.kind==="drink"?"drink":c.kind==="food"?"food":c.kind==="wine"?"wine":c.kind==="custom"?"question":"guide";
const row=(e,lbl)=>{ const c=cardBy(e.k); return c?`<div class="weak"><span>${esc(cardTitle(c))}</span><span>${lbl||tag(c)}</span></div>`:""; };
$("qMissed").innerHTML=(round.missed.length?`<div class="eyebrow" style="margin-bottom:4px">To brush up on</div>`+round.missed.map(e=>row(e)).join(""):"")
+(sk?`<div class="eyebrow" style="margin:12px 0 4px">Skipped</div>`+round.skipped.map(e=>row(e,"skipped")).join(""):"")
+(!round.missed.length&&!sk?`<div class="subl" style="margin-top:8px">Nothing missed.</div>`:"")
+(round.retry?"":`<div class="subl lsmall">Your manager sees your best score. You can take it again anytime it's open.</div>`);
const redo=round.missed.length+sk;
$("qRetry").hidden=!redo; $("qRetry").textContent=`Practice missed (${redo})`;
$("qBar").style.width="100%"; scoreLine(); saveRound();
}
$("qNext").onclick=()=>{ if(!answered) skipQuestion(); else advance(); };
$("qRestart").onclick=()=>{ if(confirm("Start this quiz over from question 1?")) startRound(); };
$("qRetry").onclick=()=>{ const redo=[...round.missed,...round.skipped]; if(redo.length) startRound(redo); };
$("qNew").onclick=renderQuizList;
$("qBack").onclick=()=>{ if($("qList").classList.contains("hidden")) renderQuizList(); else setMode(studyMode); };
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
const weak=CARDS.map(c=>({c,r:me.items[cardKey(c)]})).filter(x=>x.r&&(x.r.wrong>0||x.r.rate==="learn")&&stateOf(x.c)!=="mastered").sort((a,b)=>(b.r.wrong-b.r.right)-(a.r.wrong-a.r.right)).slice(0,10);
return {out,tot,m,weak};
}
function renderProgress(){
if(!me)return;
const {out,tot,m,weak}=progressData();
$("pName").textContent=me.name+" · Progress";
$("pPct").textContent=Math.round(100*m/tot)+"%";
const l=me.learn||{total:0}; $("pQuiz").textContent=l.total?`${l.total} Learn question${l.total===1?"":"s"} answered`:"Open Learn to start mastering cards";
$("pSubjects").innerHTML=SUBJECTS.map(s=>{const o=out[s]; const pm=o.total?100*o.mastered/o.total:0, pl=o.total?100*o.learning/o.total:0;
return `<div class="prow"><div class="lab"><span>${s}</span><span>${o.mastered} / ${o.total} mastered</span></div><div class="bar"><i style="width:${pm}%"></i></div><div class="bar" style="height:4px;margin-top:0"><i class="q" style="width:${pl}%"></i></div></div>`;}).join("");
$("pWeak").innerHTML=weak.length?weak.map(x=>`<div class="weak"><span>${esc(cardTitle(x.c))}</span><span>${x.r.wrong?x.r.wrong+" missed":"learning"}</span></div>`).join(""):`<div class="subl">Nothing flagged yet.</div>`;
const qz=Object.values(me.quizzes||{}).sort((a,b)=>(b.at||0)-(a.at||0));
$("pQuizBox").hidden=!qz.length;
$("pQuizzes").innerHTML=qz.map(x=>`<div class="weak"><span>${esc(x.title)}</span><span>best ${x.best.right}/${x.best.total}</span></div>`).join("");
}
$("pCopy").onclick=async()=>{
const {out,tot,m,weak}=progressData(); const qz=Object.values(me.quizzes||{});
const txt=[`Aventura Menu Trainer — ${me.name}`,`${new Date().toLocaleDateString()}`,`Overall: ${Math.round(100*m/tot)}% mastered (${m}/${tot})`,...(qz.length?["Quizzes: "+qz.map(x=>`${x.title} ${x.best.right}/${x.best.total}`).join(" · ")]:[]),"",...SUBJECTS.map(s=>`${s}: ${out[s].mastered}/${out[s].total}`),"",weak.length?"Needs work: "+weak.map(x=>cardTitle(x.c)).join(", "):""].join("\n");
try{await navigator.clipboard.writeText(txt);$("pCopy").textContent="Copied ✓";}catch(e){prompt("Copy this:",txt);}
setTimeout(()=>$("pCopy").textContent="Copy report for manager",1500);
};
$("pReset").onclick=()=>{ if(!me||!confirm(`Reset card progress for ${me.name}? Quiz scores stay.`))return; me.items={}; me.quiz={right:0,total:0}; me.learn={right:0,total:0}; score={right:0,total:0};
try{ localStorage.removeItem(LKEY()); }catch(e){} L={filter:undefined,items:[],queue:[],done:[],start:{},roundNo:0,review:false,state:"idle"}; persist(); renderProgress(); };
// ---------- modes ----------
function setMode(m){
curMode=m; if(m==="Flash"||m==="Learn") studyMode=m;
["Flash","Learn","Prog","Key"].forEach(k=>$("m"+k).classList.toggle("on",k===m));
["flash","learn","quiz","prog","key"].forEach(id=>$(id).classList.toggle("hidden",id!==({Flash:"flash",Learn:"learn",Quiz:"quiz",Prog:"prog",Key:"key"})[m]));
$("pickBtn").hidden=(m==="Key"||m==="Prog"||m==="Quiz");
$("quizCall").hidden=m==="Quiz"||!QUIZZES.length;
if(m==="Prog") renderProgress();
if(m==="Learn") learnOpen(false);
if(m==="Quiz"&&!(activeQuiz&&round.queue.length)) renderQuizList();
}
// after picking / switching a person: refresh whatever is on screen
function afterProfile(){ renderQuizCall(); if(curMode==="Learn") learnOpen(false); else if(curMode==="Quiz") renderQuizList(); else if(curMode==="Prog") renderProgress(); }
$("mFlash").onclick=()=>setMode("Flash");
$("mLearn").onclick=()=>setMode("Learn");
$("mKey").onclick=()=>setMode("Key");
$("mProg").onclick=()=>setMode("Prog");
filter=null; labelPicker();
if(store.last&&store.profiles[store.last]) setProfile(store.profiles[store.last].name); else showGate();
resetDeck(); loadQuizzes();
document.addEventListener("visibilitychange",()=>{ if(!document.hidden) loadQuizzes(); });
setInterval(()=>{ if(!document.hidden) loadQuizzes(); },5*60e3);
if(coachSeen<3){ $("coach").hidden=false; setTimeout(()=>$("coach").hidden=true,3000); }
