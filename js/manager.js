// ================= MANAGER BOARD =================
const $=id=>document.getElementById(id);
const SUBS=["Drinks","Food","Allergens & Mods","Wines by the glass","Resource guide"];
const SUBSHORT={"Drinks":"Drinks","Food":"Food","Allergens & Mods":"Allergens","Wines by the glass":"Wines","Resource guide":"Guide"};
// chart colors follow the theme; grid / label colors flip for dark mode
const C_LIGHT={brick:"#C88F79",gold:"#E3B7A5",olive:"#7C8A7E",rose:"#D19E8C",line:"#E6E3E1",ink:"#55565A",mute:"#8A8B8F",grid:"#EFECEA"};
const C_DARK={brick:"#D59C86",gold:"#E3B7A5",olive:"#93A596",rose:"#DDAA98",line:"#4A4B51",ink:"#E7E4E1",mute:"#9A9BA0",grid:"#3A3B40"};
let C=AVTheme.isDark()?C_DARK:C_LIGHT;
inkSVG(ILLUS,FOODILLUS); AVTheme.bind();
AVTheme.onChange(t=>{ C=t==="dark"?C_DARK:C_LIGHT; if(rows.length&&!$("board").classList.contains("hidden")) render(); });
const ICON={
  chev:'<path d="M6 9l6 6 6-6"/>', sortNone:'<path d="M8 4v16M8 20l-3-3M8 20l3-3M16 20V4M16 4l-3 3M16 4l3 3"/>', sortAsc:'<path d="M12 19V5M5 12l7-7 7 7"/>', sortDesc:'<path d="M12 5v14M5 12l7 7 7-7"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', check:'<path d="M20 6L9 17l-5-5"/>',
  eye:'<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:'<path d="M3 3l18 18M10.5 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.6-1.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
  flag:'<path d="M5 21V4h11l-2 4 2 4H5"/>', pencil:'<path d="M4 20l4-1 11-11-3-3L5 16z"/>', unfold:'<path d="M7 14l5 5 5-5M7 10l5-5 5 5"/>', fold:'<path d="M7 10l5 5 5-5"/>'
};
const ico=n=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
let pin=sessionStorage.getItem("av_pin")||"", rows=[], charts={}, sortK="pct", sortDir=-1, openRows=new Set();
$("host").textContent=location.host;
let toastT=null; function say(t,sticky){ const el=$("pMsg"); el.textContent=t; el.classList.toggle("show",!!t); clearTimeout(toastT); if(t&&!sticky) toastT=setTimeout(()=>el.classList.remove("show"),2600); }
function ago(t){ if(!t) return "—"; const d=(Date.now()-t)/36e5; if(d<1) return "just now"; if(d<24) return Math.round(d)+"h ago"; return Math.round(d/24)+"d ago"; }
const fmtDate=t=>t?new Date(t).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}):"—";
const qpct=r=>{const q=r.summary&&r.summary.quiz; return q&&q.total?Math.round(100*q.right/q.total):null;};
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

async function load(){
  $("err").textContent=""; say("Loading…",true);
  let r; try{ r=await fetch("/api/progress?all=1",{cache:"no-store",headers:{"x-pin":pin}}); }catch(e){ say(""); $("err").textContent="Couldn't reach the server. Check your connection."; return false; }
  say("");
  if(r.status===401){ $("err").textContent="That PIN didn't work. Check it and try again."; sessionStorage.removeItem("av_pin"); $("pin").select(); return false; }
  if(!r.ok){ $("err").textContent="Could not load ("+r.status+")."; return false; }
  rows=(await r.json()).sort((a,b)=>(b.summary?.pct||0)-(a.summary?.pct||0)); sessionStorage.setItem("av_pin",pin);
  $("gate").classList.add("hidden"); $("board").classList.remove("hidden"); render(); qzLoad().then(()=>{ if(!$("quizzes").classList.contains("hidden")) renderQuizzes(); }); loadPhotoIndex().then(()=>{ countPhotos(); if(!$("photos").classList.contains("hidden")) renderPhotos(); });
  return true;
}
// ---------- team ----------
function visibleRows(){
  const q=$("search").value.trim().toLowerCase(), f=$("fAct").value, l=$("fLvl").value, wk=7*864e5;
  return rows.filter(r=>{ const p=r.summary?.pct||0, w=(r.summary?.weak||[]).length;
    return (!q||r.name.toLowerCase().includes(q))
      &&(f==="all"||(f==="7"&&r.updated&&Date.now()-r.updated<wk)||(f==="idle"&&(!r.updated||Date.now()-r.updated>=wk)))
      &&(l==="all"||(l==="hi"&&p>=80)||(l==="mid"&&p>=40&&p<80)||(l==="lo"&&p<40)||(l==="weak"&&w>0)); });
}
function mkChart(id,cfg){ if(typeof Chart==="undefined") return; if(charts[id]) charts[id].destroy(); charts[id]=new Chart($(id),cfg); }
const baseOpts=(fmt)=>({responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.parsed.x??c.parsed.y)}}},
  scales:{x:{grid:{display:false},ticks:{color:C.mute,font:{family:"Josefin Sans"}}},y:{grid:{color:C.grid},ticks:{color:C.mute,font:{family:"Josefin Sans"}}}}});
function markSelects(){ document.querySelectorAll(".field select").forEach(s=>s.classList.toggle("on",s.selectedIndex>0)); $("searchClear").hidden=!$("search").value; $("pSearchClear").hidden=!$("pSearch").value; }
function render(){
  markSelects();
  const vis=visibleRows(), all=rows, wk=7*864e5;
  $("mTeamN").textContent=all.length?`· ${all.length}`:"";
  const act=all.filter(r=>r.updated&&Date.now()-r.updated<wk).length;
  const qs=all.reduce((a,r)=>{const q=r.summary&&r.summary.quiz; if(q){a.r+=q.right||0;a.t+=q.total||0;} return a;},{r:0,t:0});
  $("kN").textContent=all.length; $("kNs").textContent=all.length===1?"trainee":"trainees";
  $("kM").textContent=(all.length?Math.round(all.reduce((a,r)=>a+(r.summary?.pct||0),0)/all.length):0)+"%"; { const tot=Math.max(0,...all.map(r=>r.summary?.total||0)); $("kCards").textContent=tot?`of ${tot} cards`:"of all cards"; }
  $("kA").textContent=act; $("kAs").textContent=all.length?`of ${all.length}`:"";
  $("kQ").textContent=qs.t?Math.round(100*qs.r/qs.t)+"%":"—"; $("kQs").textContent=qs.t?`${qs.t} quiz answers`:"no quizzes taken yet";
  // charts follow the filters
  const subs=SUBS.map(k=>{ let m=0,t=0; vis.forEach(r=>{const b=r.summary&&r.summary.bySub&&r.summary.bySub[k]; if(b){m+=b.m;t+=b.t;}}); return t?Math.round(100*m/t):0; });
  mkChart("cSub",{type:"bar",data:{labels:SUBS.map(k=>SUBSHORT[k]),datasets:[{data:subs,backgroundColor:[C.brick,C.gold,C.rose,C.olive,C.mute],borderRadius:5}]},
    options:{...baseOpts(v=>v+"% mastered"),indexAxis:"y",scales:{x:{min:0,max:100,grid:{color:C.grid},ticks:{callback:v=>v+"%",color:C.mute}},y:{grid:{display:false},ticks:{color:C.ink,font:{family:"Josefin Sans",weight:"bold"}}}}}});
  $("cSub").setAttribute("aria-label","Team mastery by subject: "+SUBS.map((k,i)=>SUBSHORT[k]+" "+subs[i]+"%").join(", "));
  const miss={}; vis.forEach(r=>(r.summary?.weak||[]).forEach(n=>miss[n]=(miss[n]||0)+1));
  const top=Object.entries(miss).sort((a,b)=>b[1]-a[1]).slice(0,8);
  $("missEmpty").textContent=top.length?"":"Nothing flagged yet — this fills in as staff study in Learn.";
  mkChart("cMiss",{type:"bar",data:{labels:top.map(x=>x[0].length>22?x[0].slice(0,21)+"…":x[0]),datasets:[{data:top.map(x=>x[1]),backgroundColor:C.brick,borderRadius:5}]},
    options:{...baseOpts(v=>v+(v===1?" person":" people")),indexAxis:"y",scales:{x:{beginAtZero:true,ticks:{precision:0,color:C.mute},grid:{color:C.grid}},y:{grid:{display:false},ticks:{color:C.ink}}}}});
  $("cMiss").setAttribute("aria-label","Most-missed cards: "+(top.length?top.map(x=>`${x[0]} (${x[1]})`).join(", "):"none yet"));
  const bins=[0,0,0,0]; vis.forEach(r=>{const p=r.summary?.pct||0; bins[p>=75?3:p>=50?2:p>=25?1:0]++;});
  mkChart("cDist",{type:"bar",data:{labels:["0–24%","25–49%","50–74%","75–100%"],datasets:[{data:bins,backgroundColor:[C.line,C.gold,C.rose,C.olive],borderRadius:5}]},
    options:{...baseOpts(v=>v+(v===1?" person":" people")),scales:{y:{beginAtZero:true,ticks:{precision:0,color:C.mute},grid:{color:C.grid}},x:{grid:{display:false},ticks:{color:C.ink}}}}});
  $("cDist").setAttribute("aria-label","Staff by mastery range: "+["0–24%","25–49%","50–74%","75–100%"].map((l,i)=>`${l}: ${bins[i]}`).join(", "));
  // table
  const key=r=>sortK==="name"?r.name.toLowerCase():sortK==="quiz"?(qpct(r)??-1):sortK==="updated"?(r.updated||0):(r.summary?.pct||0);
  const sorted=[...vis].sort((a,b)=>{const x=key(a),y=key(b); return (x<y?-1:x>y?1:0)*sortDir;});
  document.querySelectorAll("button.sort").forEach(bt=>{ const on=bt.dataset.k===sortK; bt.closest("th").setAttribute("aria-sort",on?(sortDir>0?"ascending":"descending"):"none"); bt.querySelector("svg").innerHTML=on?(sortDir>0?ICON.sortAsc:ICON.sortDesc):ICON.sortNone; });
  $("tCount").textContent=rows.length?(vis.length===rows.length?`${rows.length} ${rows.length===1?"person":"people"}`:`${vis.length} of ${rows.length}`):"";
  const allOpen=sorted.length&&sorted.every(r=>openRows.has(r.slug||r.name));
  $("tToggle").hidden=!sorted.length; $("tToggle").querySelector("span").textContent=allOpen?"Collapse all":"Expand all"; $("tToggle").querySelector("svg").innerHTML=allOpen?ICON.unfold:ICON.fold;
  const tb=$("rows"); tb.innerHTML="";
  sorted.forEach(r=>{ const s=r.summary||{pct:0,bySub:{},weak:[],quiz:{right:0,total:0}}, id=r.slug||r.name, open=openRows.has(id);
    const p=s.pct||0, cls=p>=80?"":p>=40?"mid":"low", q=qpct(r);
    const bars=SUBS.map(k=>{const b=s.bySub&&s.bySub[k]; const w=b&&b.t?Math.round(100*b.m/b.t):0; return `<i title="${esc(k)}: ${w}%"><b style="width:${w}%"></b></i>`;}).join("");
    const tr=document.createElement("tr"); tr.className="person"; tr.setAttribute("aria-expanded",open); tr.tabIndex=0;
    tr.innerHTML=`<td class="namecell"><div class="nm"><button class="exp" tabindex="-1" aria-hidden="true">${ico("chev")}</button><span class="name-cell"></span></div><div class="subbars" aria-hidden="true">${bars}</div></td><td><span class="pct ${cls}">${p}%</span><div class="mini">${s.mastered||0}/${s.total||0}</div></td><td class="hide">${q===null?"<span class='mini'>—</span>":q+"% <span class='mini'>("+s.quiz.total+")</span>"}</td><td class="mini weakcell"></td><td class="hide mini">${ago(r.updated)}</td>`;
    tr.querySelector(".name-cell").textContent=r.name; tr.querySelector(".weakcell").textContent=(s.weak||[]).slice(0,3).join(", ")+((s.weak||[]).length>3?` +${s.weak.length-3}`:"")||"—";
    const toggle=()=>{ if(openRows.has(id)) openRows.delete(id); else openRows.add(id); render(); };
    tr.onclick=e=>{ if(e.target.closest("button:not(.exp),a")) return; toggle(); };
    tr.onkeydown=e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); toggle(); } };
    tb.appendChild(tr);
    if(open){ const d=document.createElement("tr"); d.className="detail"; d.innerHTML=`<td colspan="5">${detailPanel(r,s,q)}</td>`;
      d.querySelector(".copy1").onclick=()=>copyText(personLine(r),"Copied "+r.name); tb.appendChild(d); }
  });
  if(!sorted.length) tb.innerHTML=rows.length?`<tr><td colspan="5" class="empty">No one matches that search or filter.</td></tr>`:`<tr><td colspan="5" class="empty">No one has studied yet. Share <b>${location.host}</b> with staff — they show up here after their first card.</td></tr>`;
}
function detailPanel(r,s,q){
  const subs=SUBS.map(k=>{const b=s.bySub&&s.bySub[k]; const w=b&&b.t?Math.round(100*b.m/b.t):0; return `<div class="r"><span>${esc(SUBSHORT[k])}</span><div class="bar"><i style="width:${w}%"></i></div><span class="v">${w}% · ${b?b.m:0}/${b?b.t:0}</span></div>`;}).join("");
  const weak=(s.weak||[]).length?`<div class="wchips">${s.weak.map(w=>`<span>${esc(w)}</span>`).join("")}</div>`:`<span class="mini">Nothing flagged — no wrong answers or “learning” cards yet.</span>`;
  return `<div class="dpanel"><div><h4>By subject</h4><div class="dsub">${subs}</div></div>
    <div><div class="dfacts"><div><b>Quizzes</b>${q===null?"None taken yet":`${q}% · ${s.quiz.right}/${s.quiz.total} right`}${Object.values(s.quizzes||{}).map(x=>`<div class="mini">${esc(x.title)}: ${x.best.right}/${x.best.total}</div>`).join("")}</div><div><b>Learn</b>${s.learn&&s.learn.total?`${s.learn.total} questions answered`:"Not started"}</div><div><b>Mastered</b>${s.mastered||0} of ${s.total||0} cards</div><div><b>Last active</b>${ago(r.updated)}<div class="mini">${fmtDate(r.updated)}</div></div><div><b>Started</b>${fmtDate(r.started)}</div></div>
    <h4 style="margin-top:14px">Needs work</h4>${weak}</div>
    <div class="acts full"><button class="btn sm copy1">${ico("copy")}Copy ${esc(r.name.split(" ")[0])}'s summary</button></div></div>`;
}
const personLine=r=>{const s=r.summary||{};return `${r.name}: ${s.pct||0}% mastered${s.weak&&s.weak.length?" · needs "+s.weak.slice(0,3).join(", "):""} · ${ago(r.updated)}`;};
async function copyText(t,ok){ try{ await navigator.clipboard.writeText(t); say(ok+" ✓"); }catch(e){ prompt("Copy:",t); } }
document.querySelectorAll("button.sort").forEach(bt=>bt.onclick=()=>{ if(sortK===bt.dataset.k) sortDir*=-1; else { sortK=bt.dataset.k; sortDir=sortK==="name"?1:-1; } render(); });
$("fAct").onchange=$("fLvl").onchange=render; $("search").oninput=render;
$("searchClear").onclick=()=>{ $("search").value=""; render(); $("search").focus(); };
$("tToggle").onclick=()=>{ const vis=visibleRows(); if(vis.every(r=>openRows.has(r.slug||r.name))) vis.forEach(r=>openRows.delete(r.slug||r.name)); else vis.forEach(r=>openRows.add(r.slug||r.name)); render(); };
$("go").onclick=()=>{ pin=$("pin").value.trim(); if(pin) load(); }; $("pin").onkeydown=e=>{ if(e.key==="Enter") $("go").click(); };
$("refresh").onclick=async()=>{ if(await load()) say("Refreshed ✓"); };
$("csv").onclick=()=>{ const esc=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
  const lines=[["Name","Mastery %","Mastered","Total","Quiz %","Quiz answered",...SUBS.map(s=>s+" %"),"Needs work","Started","Last active"].map(esc).join(",")];
  rows.forEach(r=>{ const s=r.summary||{}; const qz=s.quiz&&s.quiz.total?Math.round(100*s.quiz.right/s.quiz.total):""; lines.push([r.name,s.pct||0,s.mastered||0,s.total||0,qz,s.quiz?.total||0,...SUBS.map(k=>{const b=s.bySub&&s.bySub[k];return b&&b.t?Math.round(100*b.m/b.t):0;}),(s.weak||[]).join("; "),r.started?new Date(r.started).toLocaleString():"",r.updated?new Date(r.updated).toLocaleString():""].map(esc).join(",")); });
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([lines.join("\n")],{type:"text/csv"})); a.download="aventura-trainer-progress.csv"; a.click(); say("CSV downloaded ✓"); };
$("copy").onclick=()=>copyText(["Aventura trainer — "+new Date().toLocaleDateString(),...rows.map(personLine)].join("\n"),"Summary copied");

// ================= PHOTOS =================
const PITEMS=[...FOOD.map(f=>({kind:"f",name:f.name,cat:f.cat,svg:FOODILLUS[f.ill]})),...DRINKS.map(d=>({kind:"d",name:d.name,cat:d.cat,svg:ILLUS[d.name]||""}))];
const FCATS=[...new Set(FOOD.map(f=>f.cat))], DCATS=[...new Set(DRINKS.map(d=>d.cat))];
{ const sel=$("pCat"), og=(l,cats,all)=>{ const g=document.createElement("optgroup"); g.label=l; g.appendChild(new Option("All "+l.toLowerCase(),all)); cats.forEach(c=>g.appendChild(new Option(c,c))); sel.appendChild(g); }; og("Food",FCATS,"food"); og("Drinks",DCATS,"drinks"); }
let pTarget=null, pOpen={}, pLast=null;
$("pBy").value=localStorage.getItem("av_photo_by")||"";
$("pBy").oninput=()=>localStorage.setItem("av_photo_by",$("pBy").value.trim());
function setMode(m){ [["mTeam","team"],["mQuiz","quizzes"],["mPhotos","photos"]].forEach(([b,id])=>{ $(b).classList.toggle("on",m===id); $(b).setAttribute("aria-pressed",m===id); $(id).classList.toggle("hidden",m!==id); });
  if(m==="photos") loadPhotos(); if(m==="quizzes"){ qzLoad().then(renderQuizzes); } }
$("mTeam").onclick=()=>setMode("team"); $("mQuiz").onclick=()=>setMode("quizzes"); $("mPhotos").onclick=()=>setMode("photos");
async function loadPhotos(){ say("Loading photos…",true); await loadPhotoIndex(); say(""); renderPhotos(); }
function photoRows(){ return PITEMS.map(it=>{ const p=photoOf(it.kind,it.name,true); return {it,p,st:p?p.status:"none"}; }); }
function countPhotos(){ let nF=0,nD=0,nP=0; photoRows().forEach(({it,st})=>{ if(st==="ok"){ if(it.kind==="f")nF++; else nD++; } if(st==="pending") nP++; });
  $("kPF").textContent=nF+"/"+FOOD.length; $("kPD").textContent=nD+"/"+DRINKS.length; $("kPP").textContent=nP; $("mPhotosN").textContent=nP?`· ${nP}`:""; return {nF,nD,nP}; }
function renderPhotos(){
  markSelects(); countPhotos();
  const f=$("pFilter").value, c=$("pCat").value, q=$("pSearch").value.trim().toLowerCase();
  $("kFood").classList.toggle("on",c==="food"); $("kDrink").classList.toggle("on",c==="drinks"); $("kConf").classList.toggle("on",f==="pending");
  const all=photoRows();
  const vis=all.filter(r=>(f==="all"||(f==="need"&&(r.st==="none"||r.st==="hidden"))||(f==="pending"&&r.st==="pending")||(f==="have"&&r.st==="ok")||(f==="hidden"&&r.st==="hidden"))
    &&(c==="all"||(c==="food"&&r.it.kind==="f")||(c==="drinks"&&r.it.kind==="d")||r.it.cat===c)
    &&(!q||r.it.name.toLowerCase().includes(q)||r.it.cat.toLowerCase().includes(q)));
  $("pCount").textContent=`${vis.length} of ${all.length} items`;
  const cats=[...FCATS,...DCATS].filter(k=>vis.some(r=>r.it.cat===k));
  const allOpen=cats.every(k=>pOpen[k]!==false);
  $("pToggle").hidden=!cats.length; $("pToggle").querySelector("span").textContent=allOpen?"Collapse all":"Expand all"; $("pToggle").querySelector("svg").innerHTML=allOpen?ICON.unfold:ICON.fold;
  const list=$("pList"); list.innerHTML=cats.length?"":`<div class="q empty">Nothing here${q?` for “${esc(q)}”`:""}. Try another filter.</div>`;
  cats.forEach(k=>{
    const items=vis.filter(r=>r.it.cat===k), tot=all.filter(r=>r.it.cat===k), have=tot.filter(r=>r.st==="ok").length;
    const d=document.createElement("details"); d.className="grp"; d.open=pOpen[k]!==false;
    d.innerHTML=`<summary><span class="gname">${esc(k)}</span><span class="gcount"><b class="${have?"":"zero"}">${have}</b>/${tot.length} live${items.length!==tot.length?` · ${items.length} shown`:""}</span><span class="gbar" aria-hidden="true"><i style="width:${tot.length?Math.round(100*have/tot.length):0}%"></i></span>${ico("chev").replace('class="i"','class="i chev"')}</summary><div class="glist"></div>`;
    d.ontoggle=()=>{ pOpen[k]=d.open; const o=cats.every(x=>pOpen[x]!==false); $("pToggle").querySelector("span").textContent=o?"Collapse all":"Expand all"; $("pToggle").querySelector("svg").innerHTML=o?ICON.unfold:ICON.fold; };
    const gl=d.querySelector(".glist");
    items.forEach(({it,p,st})=>{
      const row=document.createElement("div"); row.className="prow2";
      const tag={ok:["check","Live"],pending:["flag","Confirm ID"],hidden:["eyeOff","Hidden"],none:["pencil","Drawing"]}[st];
      row.innerHTML=`<div class="thumb">${p?`<img src="${p.url}" alt="" loading="lazy">`:(it.svg||"")}</div>
        <div class="pinfo"><div class="pn"></div><div class="mini"><span class="tag ${st}">${ico(tag[0])}${tag[1]}</span>${p?`<span>${photoWhen(p)}${p.by?" · "+esc(p.by):""}</span>`:""}</div>${p&&p.note?`<div class="pnote"></div>`:""}</div>
        <div class="pact"></div>`;
      row.querySelector(".pn").textContent=it.name; if(p&&p.note) row.querySelector(".pnote").textContent="⚑ "+p.note;
      const act=row.querySelector(".pact"); const btn=(t,ic,cls,fn)=>{const b=document.createElement("button");b.innerHTML=ico(ic)+"<span></span>";b.querySelector("span").textContent=t;if(cls)b.className=cls;b.onclick=fn;act.appendChild(b);};
      btn(p?"Replace":"Add photo","camera",p?"":"gold",e=>{pTarget=it; pLast=e.currentTarget; $("pFile").value=""; $("pFile").click();});
      if(st==="pending") btn("Confirm","check","gold",()=>setStatus(it,"ok",""));
      if(st==="ok") btn("Hide","eyeOff","warn",()=>{ if(confirm(`Hide the ${it.name} photo from staff?`)) setStatus(it,"hidden"); });
      if(st==="hidden") btn("Show","eye",null,()=>setStatus(it,"ok"));
      if(p&&p.src==="blob") btn("Delete","trash","warn",()=>{ if(confirm(`Delete the uploaded ${it.name} photo?`)) pPost({action:"delete",id:photoId(it.kind,it.name)},"Deleted "+it.name); });
      gl.appendChild(row);
    });
    list.appendChild(d);
  });
}
$("pFilter").onchange=$("pCat").onchange=renderPhotos; $("pSearch").oninput=renderPhotos;
$("pSearchClear").onclick=()=>{ $("pSearch").value=""; renderPhotos(); $("pSearch").focus(); };
$("pToggle").onclick=()=>{ const open=[...document.querySelectorAll("details.grp")]; const allOpen=open.every(d=>d.open); open.forEach(d=>{ d.open=!allOpen; }); };
const kpiFilter=(catV,statusV)=>{ const c=$("pCat"), f=$("pFilter"); if(catV!==undefined) c.value=c.value===catV?"all":catV; if(statusV!==undefined) f.value=f.value===statusV?"need":statusV; if(catV!==undefined&&c.value!=="all"&&f.value==="need") f.value="all"; renderPhotos(); };
$("kFood").onclick=()=>kpiFilter("food"); $("kDrink").onclick=()=>kpiFilter("drinks"); $("kConf").onclick=()=>kpiFilter(undefined,"pending");
async function pPost(body,okMsg){
  say("Saving…",true);
  try{ const r=await fetch("/api/photo",{method:"POST",headers:{"Content-Type":"application/json","x-pin":pin},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({})); if(!r.ok) throw new Error(j.error||r.status);
    await loadPhotoIndex(); renderPhotos(); say(okMsg+" ✓");
  }catch(e){ say("Couldn't save ("+e.message+"). Check your connection and try again."); }
}
function setStatus(it,status,note){ const b={action:"status",id:photoId(it.kind,it.name),status}; if(note!==undefined) b.note=note; pPost(b,it.name+" → "+{ok:"live",hidden:"hidden",pending:"to confirm"}[status]); }
// ---------- photo framing (crop) ----------
let cSrc=null, cRot=0, cFrame={x:0,y:0,w:1,h:1}; // frame in 0..1 of the rotated image
function rotated(img,deg){ const c=document.createElement("canvas"), r=deg%180!==0; c.width=r?img.height:img.width; c.height=r?img.width:img.height;
  const x=c.getContext("2d"); x.translate(c.width/2,c.height/2); x.rotate(deg*Math.PI/180); x.drawImage(img,-img.width/2,-img.height/2); return c; }
async function loadImg(file){ try{ return await createImageBitmap(file,{imageOrientation:"from-image"}); }catch(e){}
  return await new Promise((res,rej)=>{const i=new Image(); i.onload=()=>res(i); i.onerror=()=>rej(new Error("that file isn't a readable image")); i.src=URL.createObjectURL(file);}); }
function showCrop(){ const c=rotated(cSrc,cRot); $("cImg").src=c.toDataURL("image/jpeg",0.8); $("cImg").onload=()=>{ setZoom(); }; }
function setZoom(){ const z=$("cZoom").value/100, img=$("cImg"), W=img.naturalWidth, H=img.naturalHeight;
  let fw=W, fh=W*3/4; if(fh>H){ fh=H; fw=H*4/3; } if(z>=1 && $("cZoom").dataset.whole==="1"){ fw=W; fh=H; }
  fw*=z; fh*=z; const cx=(cFrame.x+cFrame.w/2)*W||W/2, cy=(cFrame.y+cFrame.h/2)*H||H/2;
  cFrame={w:fw/W,h:fh/H,x:0,y:0}; placeFrame(cx/W-cFrame.w/2, cy/H-cFrame.h/2); }
function placeFrame(x,y){ cFrame.x=Math.min(Math.max(0,x),1-cFrame.w); cFrame.y=Math.min(Math.max(0,y),1-cFrame.h);
  const img=$("cImg"), ox=img.offsetLeft, oy=img.offsetTop, w=img.clientWidth, h=img.clientHeight, b=$("cBox");
  b.style.left=(ox+cFrame.x*w)+"px"; b.style.top=(oy+cFrame.y*h)+"px"; b.style.width=(cFrame.w*w)+"px"; b.style.height=(cFrame.h*h)+"px";
  b.setAttribute("aria-valuetext",`frame ${Math.round(cFrame.w*100)}% wide, ${Math.round(cFrame.x*100)}% from left, ${Math.round(cFrame.y*100)}% from top`); }
(function(){ const b=$("cBox"); let st=null;
  b.onpointerdown=e=>{ st={sx:e.clientX,sy:e.clientY,x:cFrame.x,y:cFrame.y}; b.setPointerCapture(e.pointerId); };
  b.onpointermove=e=>{ if(!st) return; const img=$("cImg"); placeFrame(st.x+(e.clientX-st.sx)/img.clientWidth, st.y+(e.clientY-st.sy)/img.clientHeight); };
  b.onpointerup=b.onpointercancel=()=>{ st=null; };
  b.onkeydown=e=>{ const d=e.shiftKey?0.05:0.01, m={ArrowLeft:[-d,0],ArrowRight:[d,0],ArrowUp:[0,-d],ArrowDown:[0,d]}[e.key]; if(m){ e.preventDefault(); placeFrame(cFrame.x+m[0],cFrame.y+m[1]); } };
})();
$("cZoom").oninput=()=>{ $("cZoom").dataset.whole="0"; setZoom(); };
$("cWhole").onclick=()=>{ $("cZoom").value=100; $("cZoom").dataset.whole="1"; cFrame={x:0,y:0,w:1,h:1}; setZoom(); };
$("cRot").onclick=()=>{ cRot=(cRot+90)%360; cFrame={x:0,y:0,w:1,h:1}; showCrop(); };
function closeCrop(){ $("crop").classList.add("hidden"); cSrc=null; if(pLast&&pLast.isConnected) pLast.focus(); }
$("cCancel").onclick=()=>{ closeCrop(); say("Photo not saved."); };
$("crop").onkeydown=e=>{ if(e.key==="Escape") $("cCancel").click(); };
$("cSave").onclick=async()=>{ const it=pTarget; if(!cSrc||!it) return;
  const full=rotated(cSrc,cRot), sx=cFrame.x*full.width, sy=cFrame.y*full.height, sw=cFrame.w*full.width, sh=cFrame.h*full.height;
  const k=Math.min(1,1080/Math.max(sw,sh)), c=document.createElement("canvas"); c.width=Math.round(sw*k); c.height=Math.round(sh*k);
  c.getContext("2d").drawImage(full,sx,sy,sw,sh,0,0,c.width,c.height);
  let type="image/webp", url=c.toDataURL(type,0.82); if(!url.startsWith("data:image/webp")){ type="image/jpeg"; url=c.toDataURL(type,0.85); }
  closeCrop();
  await pPost({action:"upload",id:photoId(it.kind,it.name),type,data:url.split(",")[1],by:$("pBy").value.trim()||"Manager"},"Saved "+it.name);
};
$("pFile").onchange=async()=>{ const file=$("pFile").files[0], it=pTarget; if(!file||!it) return;
  try{ say("Opening photo…",true); cSrc=await loadImg(file); cRot=0; cFrame={x:0,y:0,w:1,h:1};
    $("cName").textContent=it.name; $("cZoom").value=100; $("cZoom").dataset.whole="1";
    $("crop").classList.remove("hidden"); showCrop(); say(""); setTimeout(()=>$("cBox").focus(),60);
  }catch(e){ say("Couldn't open that photo — "+e.message+". Try a JPG or PNG."); } };
window.addEventListener("resize",()=>{ if(!$("crop").classList.contains("hidden")) placeFrame(cFrame.x,cFrame.y); });
if(pin) load(); else setTimeout(()=>$("pin").focus(),50);
