// unified cards
const CARDS = [
...DRINKS.map(d=>({cat:d.cat, kind:"drink", d})),
...FOOD.map(f=>({cat:f.cat, kind:"food", fd:f})),
...ALLERGY_FACTS.map(f=>({cat:f.cat, kind:"fact", f})),
...FACTS.map(f=>({cat:f.cat, kind:"fact", f})),
...WINES.map(w=>({cat:"Wines BTG", kind:"wine", w})),
];
const GROUPS = [
["Everything", null],
["— DRINKS —", "hdr"],
["All drinks","drinks"],["Cócteles","Cócteles"],["Clásicos","Clásicos"],["Gin-Tonics","Gin-Tonics"],["Sangria","Sangria"],["Sin Alcohol","Sin Alcohol"],
["— FOOD —","hdr"],
["All food","food"],["Aperitivo","Aperitivo"],["Tapas","Tapas"],["Paella","Paella"],["Postres","Postres"],["Allergens & Mods","Allergens & Mods"],
["— RESOURCE GUIDE —","hdr"],
["House Pours","House Pours"],["Service & Glassware","Service & Glassware"],["Spirits 101","Spirits 101"],
["Wine 101","Wine 101"],["Wines BTG","Wines BTG"],["Sherry & Vermouth","Sherry & Vermouth"],
["Beer & Cider","Beer & Cider"],["NA Program","NA Program"],
];
const DRINKCATS = ["Cócteles","Clásicos","Gin-Tonics","Sangria","Sin Alcohol"];
const FOODCATS = ["Aperitivo","Tapas","Paella","Postres"];
const MAJOR=/gluten|dairy|egg|fish|shellfish|crustacean|mollusk|nut|soy|sesame|pork|mustard|dijon/i;
function achips(str){return `<div class="achips">${str.split("·")[0].split(",").map(a=>a.trim()).filter(Boolean).map(a=>`<span class="achip ${MAJOR.test(a)?"major":""}">${aicon(a)}${a}</span>`).join("")}</div>`+(str.includes("·")?`<div class="cc">⚠ ${str.split("·")[1].trim()}</div>`:"");}
const $=id=>document.getElementById(id);
let filter=null, deck=[], idx=0, score={right:0,total:0}, currentQ=null, answered=false, weakOnly=false;
// ---------- progress (per device, per name) ----------
const STORE="av_trainer_v1";
function loadStore(){try{return JSON.parse(localStorage.getItem(STORE)||"{}");}catch(e){return {};}}
function saveStore(st){try{localStorage.setItem(STORE,JSON.stringify(st));}catch(e){}}
let store=loadStore(); if(!store.profiles) store.profiles={};
let me=null;
function slug(n){return n.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
function cardKey(c){return c.kind==="drink"?"d:"+c.d.name:c.kind==="food"?"f:"+c.fd.name:c.kind==="wine"?"w:"+c.w.name:"q:"+c.f.q;}
function cardTitle(c){return c.kind==="drink"?c.d.name:c.kind==="food"?c.fd.name:c.kind==="wine"?c.w.name.split(",")[0]:c.f.q;}
function subjectOf(c){ if(DRINKCATS.includes(c.cat))return "Drinks"; if(FOODCATS.includes(c.cat))return "Food"; if(c.cat==="Allergens & Mods")return "Allergens & Mods"; if(c.cat==="Wines BTG")return "Wines by the glass"; return "Resource guide"; }
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
.then(r=>{ if(r.ok){SYNC=true;cloudSay("· saved");} else throw 0; }).catch(()=>{dirty=true;cloudSay("· offline — will retry");}); }
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
SYNC=true; cloudSay("· synced"); $("pWhere").textContent="Progress is saved under your name — pick up on any device.";
dirty=true; flush();
}
function renderTeam(){}
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
$("gateMsg").textContent="Enter your first name and last initial (e.g. Maria R). Use the same name every time — your progress is saved under it.";
$("gateKnown").innerHTML=known.map(p=>`<button data-s="${p.slug}">${p.name}</button>`).join("");
[...$("gateKnown").children].forEach(b=>b.onclick=()=>{setProfile(store.profiles[b.dataset.s].name);resetDeck();});
$("gateName").value=""; $("gate").classList.remove("hidden"); setTimeout(()=>$("gateName").focus(),50);
}
$("gateGo").onclick=()=>{ if(setProfile($("gateName").value)) resetDeck(); else $("gateName").focus(); };
$("gateName").onkeydown=e=>{ if(e.key==="Enter") $("gateGo").click(); };
$("whoSwitch").onclick=showGate;
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
// category select
GROUPS.forEach(g=>{
const o=document.createElement("option");
o.textContent=g[0];
if(g[1]==="hdr"){o.disabled=true;}
else o.value = g[1]===null ? "__all__" : g[1];
$("catSel").appendChild(o);
});
$("catSel").value="__all__";
$("catSel").onchange=e=>{
const v=e.target.value;
filter = v==="__all__" ? null : v;
resetDeck(); if(!$("quiz").classList.contains("hidden")) startRound();
};
// ---- flashcards ----
function resetDeck(){ deck=shuffleArr(pool()); idx=0; render(); }
function render(){
const c=deck[idx]; $("card").classList.remove("flipped");
if(me){ rec(c).seen++; persist(); }
if(c.kind==="drink"){
const d=c.d;
$("front").innerHTML=`<div class="cat">${d.cat.toUpperCase()}</div><div class="name">${d.name}</div><div class="price">${d.price}</div>${ILLUS[d.name]?`<div class="illus">${ILLUS[d.name]}</div>`:""}<div class="hint">Say glass, build & garnish — tap to check</div>`;
const chips=d.colors.length
?`<div class="chips">${d.colors.map(cl=>`<span class="chip" style="background:${TAPE[cl]}"></span>`).join("")}<span class="lbl">batch bottle — ${d.bottle||d.colors.join(" + ")}</span></div>`
:`<div class="chips"><span class="lbl">no batch color — built à la minute</span></div>`;
const sell=d.sell?`<div class="row"><b>SELL IT</b><br><i>${d.sell}</i></div>`:"";
$("back").innerHTML=`<div class="cat">${d.cat.toUpperCase()}</div>${ILLUS[d.name]?`<div class="illus mini">${ILLUS[d.name]}</div>`:""}<h3>${d.name}</h3>
<div class="row"><b>MENU</b><br>${d.menu}</div>
<div class="row"><b>GLASS</b><br>${d.glass}</div>
<div class="row"><b>BUILD</b><br>${d.build.join(" · ")}</div>
<div class="row"><b>GARNISH</b><br>${d.garnish}</div>${sell}${chips}`;
} else if(c.kind==="food"){
const f=c.fd;
$("front").innerHTML=`<div class="cat">${f.cat.toUpperCase()}</div><div class="name">${f.name}</div><div class="fillus">${FOODILLUS[f.ill]}</div><div class="hint">Say the drop line, allergens & mods — tap to check</div>`;
$("back").innerHTML=`<div class="cat">${f.cat.toUpperCase()}</div><div class="fillus mini">${FOODILLUS[f.ill]}</div><h3>${f.name}</h3>
<div class="row"><b>DROP LINE</b><div class="drop">“${f.drop}”</div></div>
<div class="row"><b>ALLERGENS</b>${achips(f.all)}</div>
<div class="row"><b>DIETS</b>${dietBadges(f.name)}</div>
<div class="row"><b>MODS</b><br>${f.mods}</div>
<div class="row"><b>SERVE WITH</b><br>${f.ut}</div>
<div class="row"><b>IN IT</b><br><span style="font-size:13px;color:var(--mute)">${f.ing}</span></div>${f.tip?`<div class="tip">★ ${f.tip}</div>`:""}`;
} else if(c.kind==="fact"){
const f=c.f;
$("front").innerHTML=`<div class="cat">${f.cat.toUpperCase()}</div><div class="name" style="font-size:24px">${f.q}</div><div class="hint">Tap to reveal</div>`;
$("back").innerHTML=`<div class="cat">${f.cat.toUpperCase()}</div><h3 style="font-size:18px">${f.q}</h3>
<div class="row"><b>ANSWER</b><br>${f.a}</div>${f.x?`<div class="row"><b>MORE</b><br>${f.x}</div>`:""}`;
} else {
const w=c.w;
$("front").innerHTML=`<div class="cat">WINES BY THE GLASS</div><div class="name" style="font-size:22px">${w.name}</div><div class="price">${w.price}</div><div class="wglass">${WGLASS[wineKind(w)]}</div><div class="hint">Grape · place · notes · one story · pairing</div>`;
$("back").innerHTML=`<div class="cat">WINES BY THE GLASS</div><div class="wglass mini">${WGLASS[wineKind(w)]}</div><h3 style="font-size:17px">${w.name}</h3>
<div class="row"><b>NOTES</b><br><i>${w.notes}</i></div>
<div class="row"><b>GRAPE</b><br>${w.grape}</div>
<div class="row"><b>STORY</b><br>${w.story}</div>
<div class="row"><b>SIMILAR TO</b><br>${w.like}</div>
<div class="row"><b>PAIR WITH</b><br>${w.pair}</div>`;
}
const st=stateOf(c);
$("front").insertAdjacentHTML("beforeend",`<div class="mstate ${st}">${st==="mastered"?"MASTERED":st==="learning"?"STILL LEARNING":"NEW"}</div>`);
$("counter").textContent=`${idx+1} of ${deck.length}${weakOnly?" · weak cards":""}`;
// grow card to fit the taller face (so nothing is clipped)
const card=$("card"); card.style.minHeight="360px";
requestAnimationFrame(()=>{card.style.minHeight=Math.max(360,$("front").scrollHeight+4,$("back").scrollHeight+4)+"px";});
}
$("card").onclick=()=>$("card").classList.toggle("flipped");
$("flip").onclick=()=>$("card").classList.toggle("flipped");
$("next").onclick=()=>{idx=(idx+1)%deck.length;render();};
$("prev").onclick=()=>{idx=(idx-1+deck.length)%deck.length;render();};
$("shuffle").onclick=()=>{shuffleArr(deck);idx=0;render();};
$("weakOnly").onclick=()=>{weakOnly=!weakOnly;$("weakOnly").textContent=weakOnly?"All cards":"Weak cards only";resetDeck();};
function rate(v){ if(!me)return; const r=rec(deck[idx]); r.rate=v; if(v==="got"){r.right++;} persist(); idx=(idx+1)%deck.length; render(); }
$("rGot").onclick=()=>rate("got"); $("rLearn").onclick=()=>rate("learn");
// ---- quiz ----
function distractors(correct, values, n=3, fallback=[]){
let set=[...new Set(values.filter(v=>v && v!==correct))];
if(set.length<n) set=[...new Set([...set,...fallback.filter(v=>v && v!==correct)])];
return shuffleArr(set).slice(0,n);
}
function makeQuestion(c){
let q;
const _c=c;
if(c.kind==="drink"){
const d=c.d, all=DRINKS;
const types=[
()=>({prompt:`What glass does <b>${d.name}</b> go in?`,answer:d.glass,opts:distractors(d.glass,all.map(x=>x.glass))}),
()=>({prompt:`Which drink is this?<br><i>"${d.menu}"</i>`,answer:d.name,opts:distractors(d.name,all.map(x=>x.name))}),
];
if(d.cat!=="Sangria"){
types.push(()=>({prompt:`What's the garnish on <b>${d.name}</b>?`,answer:d.garnish,opts:distractors(d.garnish,all.map(x=>x.garnish).filter(g=>!/confirm/i.test(g)))}));
types.push(()=>({prompt:`What's the build for <b>${d.name}</b>?`,answer:d.build.join(" · "),opts:distractors(d.build.join(" · "),all.filter(x=>x.cat!=="Sangria").map(x=>x.build.join(" · ")))}));
}
if(d.colors.length) types.push(()=>({prompt:`Batch bottle color for <b>${d.name}</b>?`,answer:d.colors.join(" + "),opts:distractors(d.colors.join(" + "),all.filter(x=>x.colors.length).map(x=>x.colors.join(" + ")))}));
if(ILLUS[d.name]) types.push(()=>({prompt:`Which drink is served like this?<div class="qillus">${ILLUS[d.name]}</div>`,answer:d.name,opts:distractors(d.name,all.map(x=>x.name))}));
q=pick(types)(); q.explain=`${d.name}: ${d.glass} · ${d.build.join(" · ")} · garnish ${d.garnish}.`;
} else if(c.kind==="food"){
const f=c.fd, all=FOOD;
const types=[
()=>({prompt:`Which dish is this?<br><i>“${f.drop}”</i>`,answer:f.name,opts:distractors(f.name,all.map(x=>x.name))}),
()=>({prompt:`Allergens in <b>${f.name}</b>?`,answer:f.all,opts:distractors(f.all,all.map(x=>x.all))}),
()=>({prompt:`Which dish is served like this?<div class="fillus">${FOODILLUS[f.ill]}</div>`,answer:f.name,opts:distractors(f.name,all.filter(x=>x.ill===f.ill).map(x=>x.name),3,all.map(x=>x.name))}),
];
if(f.mods!=="None") types.push(()=>({prompt:`Approved mods for <b>${f.name}</b>?`,answer:f.mods,opts:distractors(f.mods,all.filter(x=>x.mods!=="None").map(x=>x.mods))}));
if(!/^None/.test(f.ut)) types.push(()=>({prompt:`What drops with <b>${f.name}</b>?`,answer:f.ut,opts:distractors(f.ut,all.map(x=>x.ut))}));
// scenario: guest allergy — which dish is SAFE
const words=f.all.split("·")[0].split(",").map(a=>a.trim()).filter(a=>MAJOR.test(a));
if(words.length){
const w=pick(words); const key=w.replace(/\s*\(.*\)/,"").toLowerCase();
const safe=all.filter(x=>!x.all.toLowerCase().includes(key.split(" ")[0]));
const unsafe=all.filter(x=>x!==f && x.all.toLowerCase().includes(key.split(" ")[0]));
if(safe.length&&unsafe.length>=2) types.push(()=>{const ans=pick(safe).name;return {prompt:`A guest has a <b>${key}</b> allergy. Which of these can they order?`,answer:ans,opts:distractors(ans,[f.name,...shuffleArr(unsafe).slice(0,2).map(x=>x.name)])};});
}
// scenario: dietary restriction — which dish is safe as printed
["V","VG","GF","DF"].forEach(code=>{
const has=x=>(DIET[x.name]||[]).includes(code);
if(!has(f)) return;
const bad=all.filter(x=>!(DIET[x.name]||[]).some(t=>t.replace("*","")===code));
if(bad.length>=3) types.push(()=>({prompt:`A guest is <b>${DIETNAME[code].toLowerCase()}</b>. Which of these can they order as printed?`,answer:f.name,opts:shuffleArr(bad).slice(0,3).map(x=>x.name)}));
});
q=pick(types)(); q.explain=`${f.name}: ${f.all} · diets: ${(DIET[f.name]||[]).map(t=>DIETNAME[t.replace("*","")]+(t.endsWith("*")?" w/ mod":"")).join(", ")||"none"} · mods: ${f.mods}.`;
} else if(c.kind==="fact"){
const f=c.f;
const same=(f.cat==="Allergens & Mods"?ALLERGY_FACTS:FACTS).filter(x=>x.cat===f.cat).map(x=>x.a);
q={prompt:f.q, answer:f.a, opts:distractors(f.a, same, 3, [...FACTS,...ALLERGY_FACTS].map(x=>x.a))};
q.explain=f.a + (f.x?" — "+f.x:"");
} else {
const w=c.w;
const types=[
()=>({prompt:`Which wine tastes like <i>"${w.notes}"</i>?`,answer:w.name,opts:distractors(w.name,WINES.map(x=>x.name))}),
()=>({prompt:`Which wine do you hand a guest who loves <b>${w.like}</b>?`,answer:w.name,opts:distractors(w.name,WINES.map(x=>x.name))}),
()=>({prompt:`Tasting notes for <b>${w.name}</b>?`,answer:w.notes,opts:distractors(w.notes,WINES.map(x=>x.notes))}),
];
q=pick(types)(); q.explain=`${w.name} (${w.price}): ${w.notes} · ${w.grape} · like ${w.like}.`;
}
q.choices=shuffleArr([q.answer,...q.opts]); q.card=_c;
return q;
}
// ---- rounds: one question per card, no repeats until the round is done ----
const ROUND_MAX=30;
let round={queue:[],i:0,right:0,missed:[],cycle:new Set(),label:""};
function filterLabel(){return filter===null?"Everything":(filter==="drinks"?"All drinks":filter==="food"?"All food":filter);}
function startRound(cards){
const p=pool(); const key=filterLabel();
if(round.label!==key){ round.cycle=new Set(); round.label=key; }
let src=cards||p.filter(c=>!round.cycle.has(cardKey(c)));
if(!cards&&src.length<Math.min(ROUND_MAX,p.length)){ round.cycle=new Set(); src=p.slice(); } // cycle exhausted -> start over
round.queue=shuffleArr(src.slice()).slice(0,ROUND_MAX); round.i=0; round.right=0; round.missed=[];
round.queue.forEach(c=>round.cycle.add(cardKey(c)));
$("qDone").classList.add("hidden"); $("qNavDone").classList.add("hidden"); $("qBox").classList.remove("hidden"); $("qNavPlay").classList.remove("hidden");
showQuestion();
}
function showQuestion(){
const c=round.queue[round.i]; currentQ=makeQuestion(c); answered=false;
$("qCat").textContent=filterLabel(); $("qPos").textContent=`Question ${round.i+1} of ${round.queue.length}`;
$("qBar").style.width=(100*round.i/round.queue.length)+"%";
$("qPrompt").innerHTML=currentQ.prompt; $("qFeed").innerHTML=""; $("qOpts").innerHTML="";
currentQ.choices.forEach(ch=>{ const b=document.createElement("button"); b.innerHTML=ch; b.dataset.v=ch; b.onclick=()=>answer(b,ch); $("qOpts").appendChild(b); });
$("qNext").textContent = round.i===round.queue.length-1 ? "Finish round" : "Next question";
$("qScore").textContent=`This round: ${round.right} / ${round.i}` + (me&&me.quiz.total?` · all-time ${Math.round(100*me.quiz.right/me.quiz.total)}%`:"");
}
function answer(btn,choice){
if(answered)return; answered=true;
const ok=choice===currentQ.answer;
if(ok){round.right++;btn.classList.add("correct");$("qFeed").innerHTML=`<span class="ok">Vale! Correct.</span>`;}
else{btn.classList.add("wrong"); round.missed.push(currentQ.card);
[...$("qOpts").children].forEach(b=>{if(b.dataset.v===currentQ.answer)b.classList.add("correct");});
$("qFeed").innerHTML=`<span class="no">Not quite.</span> ${currentQ.explain}`;}
if(me){ const r=rec(currentQ.card); if(ok){r.right++;} else {r.wrong++; r.rate=null;} me.quiz={right:(me.quiz.right||0)+(ok?1:0),total:(me.quiz.total||0)+1}; score={right:me.quiz.right,total:me.quiz.total}; persist(); }
$("qScore").textContent=`This round: ${round.right} / ${round.i+1}`;
}
function finishRound(){
$("qBox").classList.add("hidden"); $("qNavPlay").classList.add("hidden"); $("qDone").classList.remove("hidden"); $("qNavDone").classList.remove("hidden");
const n=round.queue.length, pct=Math.round(100*round.right/n);
$("qFinal").textContent=pct+"%"; $("qFinalSub").textContent=`${round.right} of ${n} correct · ${filterLabel()}` + (pct===100?" · perfect round!":"");
$("qMissed").innerHTML=round.missed.length?`<div class="cat">MISSED</div>`+round.missed.map(c=>`<div class="weak"><span>${cardTitle(c)}</span><span>${c.kind==="drink"?"drink":c.kind==="food"?"food":c.kind==="wine"?"wine":"guide"}</span></div>`).join(""):`<div class="sub" style="margin-top:8px">Nothing missed. Flip to a harder section.</div>`;
$("qRetry").disabled=!round.missed.length; $("qRetry").style.opacity=round.missed.length?1:.4;
}
function nextQuestion(){ startRound(); }
$("qNext").onclick=()=>{ if(!answered){ $("qFeed").innerHTML=`<span class="no">Pick an answer first.</span>`; return; } if(round.i>=round.queue.length-1) finishRound(); else { round.i++; showQuestion(); } };
$("qRestart").onclick=()=>startRound();
$("qRetry").onclick=()=>{ if(round.missed.length) startRound(round.missed.slice()); };
$("qNew").onclick=()=>startRound();
// ---- key (quick reference) ----
const GLASS=[["Coupe","Most up crafted cocktails"],["Nick & Nora","Spirit-forward cocktails"],["Rocks","On the rocks / king cube"],["Collins","Still Sant Aniol, beer, cider, highballs & long cocktails"],["Goblet","Gin tonics & sangria BTG"],["Tulip","NA beers & tulip NA builds"],["Neat glass","Shots"],["Wine (bar)","Sparkling Sant Aniol & spritz"],["Flute","Sparkling wine BTG & bottle"],["White wine glass","Sangria pitcher service"],["AP glass","All BTG still wine"]];
const POURS=[["Vodka","Tito's"],["Gin","Citadelle"],["Rum","Flor de Caña"],["Tequila","Exotico Blanco"],["Mezcal","Banhez"],["Bourbon","Maker's Mark"],["Rye","Rittenhouse"]];
function buildKey(){
$("keyColors").innerHTML=DRINKS.filter(d=>d.colors.length).map(d=>`<div class="krow"><span class="chips" style="margin:0">${d.colors.map(cl=>`<span class="chip" style="background:${TAPE[cl]}"></span>`).join("")}</span><span class="kname">${d.name}</span><span class="kval">${d.bottle||d.colors.join(" + ")}</span></div>`).join("")
+`<div class="krow"><span class="kname" style="color:var(--mute);font-size:13px">Sangrias & NA builds — no batch color, built à la minute</span></div>`;
$("keyGlass").innerHTML=GLASS.map(g=>`<div class="krow"><span class="gicon">${GICON[g[0]]||""}</span><span class="kname">${g[0]}</span><span class="kval">${g[1]}</span></div>`).join("");
const dietRows=[["V","Vegan"],["VG","Vegetarian"],["P","Pescatarian"],["GF","Gluten-free"],["DF","Dairy-free"]].map(([code,label])=>{
const strict=FOOD.filter(f=>(DIET[f.name]||[]).includes(code)).map(f=>f.name);
const mod=FOOD.filter(f=>(DIET[f.name]||[]).includes(code+"*")).map(f=>f.name+(DIETNOTE[f.name]?" ("+DIETNOTE[f.name]+")":""));
return `<div class="krow"><span class="dbadge ${code}">${label.toUpperCase()}</span><span class="kval"><b>Strict:</b> ${strict.join(", ")||"—"}${mod.length?`<br><b>w/ mod:</b> ${mod.join(", ")}`:""}</span></div>`;}).join("");
$("keyDiet").innerHTML=dietRows+`<div class="krow"><span class="dbadge NONE">ALWAYS</span><span class="kval">Nut, shellfish, egg & fin-fish allergies: check the card, tell the kitchen, never guess. Fried items share one fryer.</span></div>`;
const legend=[["Gluten","gluten"],["Dairy","dairy"],["Egg","egg"],["Fin fish","fish"],["Shellfish","shellfish"],["Mollusk","mollusk"],["Tree nuts","nut"],["Soy","soy"],["Sesame","sesame"],["Pork","pork"],["Nightshade","nightshade"],["Allium","allium"],["Citrus","citrus"],["Mustard","mustard"]];
$("keyAllergens").innerHTML=legend.map(([l,k])=>`<span class="achip ${MAJOR.test(l)?"major":""}">${AICON[k]}${l}</span>`).join("");
$("keyPours").innerHTML=POURS.map(g=>`<div class="krow"><span class="kname">${g[0]}</span><span class="kval">${g[1]}</span></div>`).join("");
}
buildKey();
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
$("pName").textContent=me.name.toUpperCase()+" · PROGRESS";
$("pPct").textContent=Math.round(100*m/tot)+"%";
const q=me.quiz; $("pQuiz").textContent=q.total?`Quiz accuracy ${Math.round(100*q.right/q.total)}% · ${q.right} of ${q.total} answered correctly`:"No quiz answers yet";
$("pSubjects").innerHTML=SUBJECTS.map(s=>{const o=out[s]; const pm=o.total?100*o.mastered/o.total:0, pl=o.total?100*o.learning/o.total:0;
return `<div class="prow"><div class="lab"><span>${s}</span><span>${o.mastered} / ${o.total} mastered</span></div><div class="bar"><i style="width:${pm}%"></i></div><div class="bar" style="height:4px;margin-top:0"><i class="q" style="width:${pl}%"></i></div></div>`;}).join("");
$("pWeak").innerHTML=weak.length?weak.map(x=>`<div class="weak"><span>${cardTitle(x.c)}</span><span>${x.r.wrong?x.r.wrong+" wrong":"learning"}</span></div>`).join(""):`<div class="sub">Nothing flagged yet — take the quiz.</div>`;
}
$("pCopy").onclick=async()=>{
const {out,tot,m,weak}=progressData(); const q=me.quiz;
const txt=[`Aventura Menu Trainer — ${me.name}`,`${new Date().toLocaleDateString()}`,`Overall: ${Math.round(100*m/tot)}% mastered (${m}/${tot})`,`Quiz: ${q.total?Math.round(100*q.right/q.total)+"% accuracy ("+q.right+"/"+q.total+")":"none yet"}`,"",...SUBJECTS.map(s=>`${s}: ${out[s].mastered}/${out[s].total}`),"",weak.length?"Needs work: "+weak.map(x=>cardTitle(x.c)).join(", "):""].join("\n");
try{await navigator.clipboard.writeText(txt);$("pCopy").textContent="Copied ✓";}catch(e){prompt("Copy this:",txt);}
setTimeout(()=>$("pCopy").textContent="Copy report for manager",1500);
};
$("pReset").onclick=()=>{ if(!me||!confirm(`Reset all progress for ${me.name}?`))return; me.items={}; me.quiz={right:0,total:0}; score={right:0,total:0}; persist(); renderProgress(); };
function setMode(m){
["Flash","Quiz","Prog","Key"].forEach(k=>$("m"+k).classList.toggle("on",k===m));
$("flash").classList.toggle("hidden",m!=="Flash");
$("quiz").classList.toggle("hidden",m!=="Quiz");
$("prog").classList.toggle("hidden",m!=="Prog");
$("key").classList.toggle("hidden",m!=="Key");
$("catSel").style.display = (m==="Key"||m==="Prog") ? "none" : "";
if(m==="Prog") renderProgress();
}
$("mFlash").onclick=()=>setMode("Flash");
$("mQuiz").onclick=()=>{setMode("Quiz"); if(!round.queue.length||round.label!==filterLabel()) startRound();};
$("mKey").onclick=()=>setMode("Key");
$("mProg").onclick=()=>setMode("Prog");
if(store.last&&store.profiles[store.last]) setProfile(store.profiles[store.last].name); else showGate();
resetDeck(); startRound();
