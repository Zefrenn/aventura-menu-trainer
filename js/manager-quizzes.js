// ================= QUIZZES (manager-assigned) =================
// Staff never see a quiz unless it's here and set live. Learn mode is the everyday, no-pressure study tool;
// a quiz is a short check-in a manager chooses to run. Loaded after manager.js (uses pin, rows, say, esc, ico).
let QZ=[], qzOpen=new Set(), qzEdit=null;
const QDAY=t=>new Date(t).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
const SECTIONS=GROUPS.filter(g=>g[1]!=="hdr");
ICON.plus='<path d="M12 5v14M5 12h14"/>'; ICON.play='<path d="M7 5l12 7-12 7z"/>'; ICON.stop='<rect x="6" y="6" width="12" height="12" rx="2"/>'; ICON.chart='<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>';
function qzStatus(q){ const now=Date.now();
  if(q.status==="draft") return ["draft","Draft · staff can't see it"];
  if(q.status==="closed") return ["closed","Closed"];
  if(q.from&&q.from>now) return ["sched","Goes live "+QDAY(q.from)];
  if(q.until&&q.until<=now) return ["closed","Ended "+QDAY(q.until)];
  return ["live",q.until?"Live · until "+QDAY(q.until):"Live"]; }
const qzPool=q=>(q.sections||[]).length?cardsForMany(q.sections.map(s=>s==="__all__"?null:s)):[];
const qzSize=q=>{ const cu=(q.custom||[]).length; return Math.min(Math.max(q.count||10,cu),cu+qzPool(q).length); };
const qzSecLabel=q=>(q.sections||[]).map(s=>sectionLabel(s==="__all__"?null:s)).join(", ");
async function qzLoad(){
  try{ const r=await fetch("/api/quizzes?all=1",{cache:"no-store",headers:{"x-pin":pin}}); if(r.ok){ QZ=(await r.json()).quizzes||[]; } }catch(e){}
  { const n=QZ.filter(q=>qzStatus(q)[0]==="live").length; $("mQuizN").textContent=n?`· ${n}`:""; $("mQuiz").title=n?`${n} live`:""; }
}
function qzResults(q){ return rows.map(r=>({r,x:r.summary&&r.summary.quizzes&&r.summary.quizzes[q.id]})).filter(o=>o.x&&o.x.best); }
function renderQuizzes(){
  if(qzEdit){ renderEditor(); return; }
  $("qzEditor").classList.add("hidden"); $("qzListWrap").classList.remove("hidden");
  const list=$("qzList");
  if(!QZ.length){ list.innerHTML=`<div class="q empty">No quizzes yet. Staff study in <b>Learn</b> on their own time; make a quiz when you want a check-in (a new menu, a pre-shift topic, an allergen refresher).</div>`; return; }
  list.innerHTML="";
  QZ.forEach(q=>{
    const [st,stLabel]=qzStatus(q), res=qzResults(q), n=qzSize(q), open=qzOpen.has(q.id);
    const avg=res.length?Math.round(100*res.reduce((a,o)=>a+o.x.best.right/o.x.best.total,0)/res.length):null;
    const el=document.createElement("div"); el.className="q qzcard";
    el.innerHTML=`<div class="qzhead"><span class="stchip ${st}">${esc(stLabel)}</span><span class="mini">${n} question${n===1?"":"s"}${q.hints===false?" · no hints":""}</span></div>
      <h3 class="qztitle"></h3>${q.note?`<p class="qznote"></p>`:""}
      <div class="mini qzsecs">${esc(qzSecLabel(q)||"")}${(q.custom||[]).length?`${q.sections.length?" + ":""}${q.custom.length} written question${q.custom.length===1?"":"s"}`:""}</div>
      <div class="qzstats"><div><b>${res.length}</b><span>of ${rows.length} took it</span></div><div><b>${avg===null?"—":avg+"%"}</b><span>average best</span></div><div><b>${res.reduce((a,o)=>a+(o.x.tries||0),0)}</b><span>attempts</span></div></div>
      <div class="qzacts"></div>${open?qzResultsHTML(q,res):""}`;
    el.querySelector(".qztitle").textContent=q.title; if(q.note) el.querySelector(".qznote").textContent=q.note;
    const acts=el.querySelector(".qzacts"), btn=(t,ic,cls,fn)=>{ const b=document.createElement("button"); b.className="btn sm "+(cls||""); b.innerHTML=ico(ic)+"<span></span>"; b.querySelector("span").textContent=t; b.onclick=fn; acts.appendChild(b); };
    btn(open?"Hide results":"Results","chart","",()=>{ open?qzOpen.delete(q.id):qzOpen.add(q.id); renderQuizzes(); });
    btn("Edit","pencil","",()=>{ qzEdit=JSON.parse(JSON.stringify(q)); renderQuizzes(); window.scrollTo({top:0,behavior:"smooth"}); });
    if(st==="draft"||st==="closed") btn(st==="draft"?"Make live":"Reopen","play","gold",()=>qzSave({...q,status:"live",until:q.until&&q.until<=Date.now()?null:q.until},q.title+" is live"));
    else btn("Close","stop","warn",()=>{ if(confirm(`Close “${q.title}”? Staff won't see it anymore. Results stay.`)) qzSave({...q,status:"closed"},q.title+" closed"); });
    btn("Delete","trash","warn",()=>{ if(confirm(`Delete “${q.title}” for good? Staff results for it disappear from this board.`)) qzPost({action:"delete",id:q.id},"Deleted"); });
    if(open){ const c=el.querySelector(".copyq"); if(c) c.onclick=()=>copyText([q.title+" — "+new Date().toLocaleDateString(),...res.map(o=>`${o.r.name}: ${o.x.best.right}/${o.x.best.total}${o.x.tries>1?` (${o.x.tries} tries)`:""}`),...(rows.length>res.length?["Not taken: "+rows.filter(r=>!res.some(o=>o.r===r)).map(r=>r.name).join(", ")]:[])].join("\n"),"Results copied"); }
    list.appendChild(el);
  });
}
function qzResultsHTML(q,res){
  const not=rows.filter(r=>!res.some(o=>o.r===r));
  const miss={}; res.forEach(o=>(o.x.missed||[]).forEach(m=>miss[m]=(miss[m]||0)+1));
  const top=Object.entries(miss).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const sorted=[...res].sort((a,b)=>b.x.best.right/b.x.best.total-a.x.best.right/a.x.best.total);
  return `<div class="qzres">
    ${res.length?`<table class="tbl"><thead><tr><th><span class="lbl">Name</span></th><th><span class="lbl">Best</span></th><th class="hide"><span class="lbl">Tries</span></th><th><span class="lbl">Last missed</span></th></tr></thead><tbody>
    ${sorted.map(o=>{ const p=Math.round(100*o.x.best.right/o.x.best.total); return `<tr><td>${esc(o.r.name)}<div class="mini">${ago(o.x.at)}</div></td><td><span class="pct ${p>=80?"":p>=50?"mid":"low"}">${o.x.best.right}/${o.x.best.total}</span></td><td class="hide">${o.x.tries||1}</td><td class="mini">${esc((o.x.missed||[]).slice(0,3).join(", ")||"—")}</td></tr>`; }).join("")}</tbody></table>`:`<div class="empty">No one has taken it yet.</div>`}
    ${top.length?`<h4>Most missed</h4><div class="wchips">${top.map(([n,c])=>`<span>${esc(n)} · ${c}</span>`).join("")}</div>`:""}
    ${not.length?`<h4>Not taken yet</h4><div class="mini">${not.map(r=>esc(r.name)).join(", ")}</div>`:""}
    <div class="acts"><button class="btn sm copyq">${ico("copy")}<span>Copy results</span></button></div></div>`;
}
// ---------- editor ----------
const dateVal=t=>{ if(!t) return ""; const d=new Date(t); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const fromDate=(v,end)=>{ if(!v) return null; const [y,m,d]=v.split("-").map(Number); return end?new Date(y,m-1,d,23,59,59,999).getTime():new Date(y,m-1,d).getTime(); };
function newQuiz(){ return {title:"",note:"",sections:[],count:10,hints:true,custom:[],status:"draft",from:null,until:null}; }
function renderEditor(){
  const q=qzEdit; $("qzListWrap").classList.add("hidden"); $("qzEditor").classList.remove("hidden");
  $("qeHead").textContent=q.id?"Edit quiz":"New quiz";
  $("qeTitle").value=q.title||""; $("qeNote").value=q.note||""; $("qeHints").checked=q.hints!==false;
  $("qeCount").value=String(q.count||10); $("qeFrom").value=dateVal(q.from); $("qeUntil").value=dateVal(q.until);
  $("qeStatus").value=q.status==="live"?"live":"draft";
  // section chips, grouped like the trainer's section picker
  let html="", open=false;
  GROUPS.forEach(g=>{ if(g[1]==="hdr"){ if(open) html+="</div>"; html+=`<div class="secgrp"><span class="lbl">${esc(g[0])}</span>`; open=true; return; }
    const v=g[1]===null?"__all__":g[1], on=q.sections.includes(v);
    html+=`<button type="button" class="secchip${on?" on":""}" data-v="${esc(v)}" aria-pressed="${on}">${esc(g[0])} <i>${cardsFor(g[1]).length}</i></button>`; });
  if(open) html+="</div>";
  $("qeSecs").innerHTML=html;
  $("qeSecs").querySelectorAll(".secchip").forEach(b=>b.onclick=()=>{ const v=b.dataset.v, i=q.sections.indexOf(v); if(i>=0) q.sections.splice(i,1); else q.sections.push(v); renderEditor(); });
  renderCustom(); qeSummary();
}
function renderCustom(){
  const q=qzEdit, box=$("qeCustom"); box.innerHTML="";
  q.custom.forEach((c,i)=>{
    const d=document.createElement("div"); d.className="cq";
    d.innerHTML=`<div class="cqhead"><span class="lbl">Your question ${i+1}</span><button type="button" class="btn ghost sm rm">${ico("trash")}<span>Remove</span></button></div>
      <label class="vh" for="cq${i}">Question</label><textarea id="cq${i}" class="ff" rows="2" placeholder="e.g. What do we say when a guest asks for the wifi?"></textarea>
      <label class="lbl ok" for="ca${i}">Right answer</label><input id="ca${i}" class="ff" placeholder="The correct answer">
      <span class="lbl">Wrong answers (1–3)</span>${[0,1,2].map(j=>`<input class="ff w" data-j="${j}" aria-label="Wrong answer ${j+1}" placeholder="Wrong answer ${j+1}">`).join("")}`;
    d.querySelector("textarea").value=c.q||""; d.querySelector(`#ca${i}`).value=c.a||"";
    d.querySelectorAll("input.w").forEach(inp=>{ inp.value=(c.wrong||[])[+inp.dataset.j]||""; inp.oninput=()=>{ const w=[...d.querySelectorAll("input.w")].map(x=>x.value); c.wrong=w; qeSummary(); }; });
    d.querySelector("textarea").oninput=e=>{ c.q=e.target.value; qeSummary(); }; d.querySelector(`#ca${i}`).oninput=e=>{ c.a=e.target.value; qeSummary(); };
    d.querySelector(".rm").onclick=()=>{ q.custom.splice(i,1); renderCustom(); qeSummary(); };
    box.appendChild(d);
  });
}
function qeRead(){ const q=qzEdit; q.title=$("qeTitle").value; q.note=$("qeNote").value; q.hints=$("qeHints").checked; q.count=+$("qeCount").value;
  q.from=fromDate($("qeFrom").value,false); q.until=fromDate($("qeUntil").value,true); q.status=$("qeStatus").value; return q; }
const cqReady=c=>c.q&&c.q.trim()&&c.a&&c.a.trim()&&(c.wrong||[]).some(w=>w&&w.trim());
function qeSummary(){ const q=qeRead(), cu=q.custom.filter(cqReady).length, pool=qzPool(q).length, n=qzSize({...q,custom:q.custom.filter(cqReady)});
  const fromSec=n-cu;
  $("qeSum").innerHTML=!n?"Pick at least one section, or write a question.":
    `Each person gets <b>${n} question${n===1?"":"s"}</b>${cu?`: your ${cu} written + ${fromSec} from the sections`:""}${pool?` (picked at random from ${pool} cards, so everyone's quiz is a little different)`:""}.`
    +(q.status==="live"?(q.from&&q.from>Date.now()?` Staff see it from ${QDAY(q.from)}.`:" Staff see it as soon as you save."):" Saved as a draft, staff won't see it yet.");
  $("qeSave").querySelector("span").textContent=q.status==="live"?"Save & make live":"Save draft"; }
["qeTitle","qeNote","qeCount","qeFrom","qeUntil","qeStatus","qeHints"].forEach(id=>{ $(id).oninput=$(id).onchange=qeSummary; });
$("qeAdd").onclick=()=>{ qzEdit.custom.push({q:"",a:"",wrong:["","",""]}); renderCustom(); qeSummary(); setTimeout(()=>{ const t=$("qeCustom").querySelectorAll("textarea"); t[t.length-1].focus(); },30); };
$("qeCancel").onclick=()=>{ qzEdit=null; renderQuizzes(); };
$("qeSave").onclick=()=>{ const q=qeRead(); const custom=q.custom.filter(cqReady).map(c=>({q:c.q.trim(),a:c.a.trim(),wrong:c.wrong.map(w=>w.trim()).filter(Boolean)}));
  if(!q.title.trim()){ say("Give the quiz a name first."); $("qeTitle").focus(); return; }
  if(!q.sections.length&&!custom.length){ say("Pick a section or write a question."); return; }
  if(q.from&&q.until&&q.until<q.from){ say("The end date is before the start date."); return; }
  const skipped=q.custom.length-custom.length;
  qzSave({...q,custom,by:$("pBy").value.trim()||q.by||"Manager"},(q.status==="live"?"Live: ":"Saved: ")+q.title.trim()+(skipped?` · ${skipped} unfinished question${skipped>1?"s":""} left out`:""),true); };
$("qzNew").onclick=()=>{ qzEdit=newQuiz(); renderQuizzes(); setTimeout(()=>$("qeTitle").focus(),50); };
async function qzPost(body,okMsg,closeEditor){
  say("Saving…",true);
  try{ const r=await fetch("/api/quizzes",{method:"POST",headers:{"Content-Type":"application/json","x-pin":pin},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.error||r.status);
    if(closeEditor) qzEdit=null; await qzLoad(); renderQuizzes(); say(okMsg+" ✓");
  }catch(e){ say("Couldn't save ("+e.message+"). Check your connection and try again."); }
}
const qzSave=(quiz,msg,closeEditor)=>qzPost({action:"save",quiz},msg,closeEditor);
