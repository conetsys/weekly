/* rhy:se Weekly Plan — 🔎 사람 찾기 (feat-find.js, v3.23.0)
   사람이 많아도 이름 한두 글자로 찾아 고르는 작은 창. 지금은 📐 사업 관리의 담당 · 책임자 · 주차별 사람 고르기에서 씀
   peoplePick(누른 칸, {people:[{email,name,sub}], first:[먼저 보여 줄 메일], value, none:true, title, onPick(메일|null)})
   이 파일이 고장 나면 사업 관리는 예전처럼 목록(select)으로 고름 */
const PF={el:null,o:null,q:"",i:0,anchor:null};
function pfClose(){if(PF.el){PF.el.remove();PF.el=null;PF.o=null;if(PF.anchor)PF.anchor.setAttribute("aria-expanded","false");PF.anchor=null}}
function pfList(){const o=PF.o,q=PF.q.trim().toLowerCase(),F0=new Set(o.first||[]);
  const hit=p=>!q||String(p.name||"").toLowerCase().includes(q)||String(p.sub||"").toLowerCase().includes(q)||String(p.email||"").toLowerCase().startsWith(q);
  const A=o.people.filter(hit),top=A.filter(p=>F0.has(p.email)).sort((a,b)=>(o.first||[]).indexOf(a.email)-(o.first||[]).indexOf(b.email)),rest=A.filter(p=>!F0.has(p.email));
  return (o.none&&!q?[{email:null,name:o.noneLabel||"미정",sub:""}]:[]).concat(top,rest)}
function pfPaint(){if(!PF.el)return;const L=pfList();PF.i=Math.max(0,Math.min(PF.i,L.length-1));const F0=new Set(PF.o.first||[]);let sep=false;
  PF.el.querySelector(".pf-l").innerHTML=L.length?L.map((p,i)=>{let h="";if(!sep&&p.email&&!F0.has(p.email)&&L.some(x=>x.email&&F0.has(x.email))){sep=true;h='<div class="pf-sep">그 밖의 사람</div>'}
    return h+`<button type="button" role="option" data-pfi="${i}" aria-selected="${i===PF.i}" class="${p.email===PF.o.value?"cur":""}${p.email?"":" none"}"><b>${esc(p.name)}</b>${p.sub?`<span>${esc(p.sub)}</span>`:""}${p.email===PF.o.value?'<i aria-hidden="true">✓</i>':""}</button>`}).join("")
    :`<div class="pf-no">'${esc(PF.q)}'(이)라는 사람이 없어요</div>`;
  const c=PF.el.querySelector(`[data-pfi="${PF.i}"]`);if(c)c.scrollIntoView({block:"nearest"})}
function peoplePick(anchor,o){pfClose();PF.o=o;PF.q="";PF.i=0;PF.anchor=anchor;anchor.setAttribute("aria-expanded","true");
  const d=document.createElement("div");d.className="pfpop";d.setAttribute("role","dialog");d.setAttribute("aria-label",o.title||"사람 고르기");
  d.innerHTML=`${o.title?`<div class="pf-t">${esc(o.title)}</div>`:""}<input class="pf-q" type="search" placeholder="이름 · 팀으로 찾기" autocomplete="off" aria-label="사람 찾기"><div class="pf-l" role="listbox"></div>`;
  document.body.appendChild(d);PF.el=d;
  const r=anchor.getBoundingClientRect(),w=Math.max(260,Math.min(340,r.width+80)),h=Math.min(360,innerHeight-24),below=innerHeight-r.bottom>=h*.6||r.top<innerHeight-r.bottom;
  d.style.width=w+"px";d.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left))+"px";d.style.maxHeight=(below?Math.min(h,innerHeight-r.bottom-12):Math.min(h,r.top-12))+"px";
  if(below)d.style.top=(r.bottom+4)+"px";else d.style.bottom=(innerHeight-r.top+4)+"px";
  pfPaint();const q=d.querySelector(".pf-q");q.focus();
  q.addEventListener("input",()=>{PF.q=q.value;PF.i=0;pfPaint()});
  q.addEventListener("keydown",e=>{const L=pfList();if(e.key==="ArrowDown"){e.preventDefault();PF.i=Math.min(L.length-1,PF.i+1);pfPaint()}else if(e.key==="ArrowUp"){e.preventDefault();PF.i=Math.max(0,PF.i-1);pfPaint()}
    else if(e.key==="Enter"&&!e.isComposing){e.preventDefault();const p=L[PF.i];if(p){const f=PF.o.onPick,a=PF.anchor;pfClose();f(p.email);try{a.focus()}catch(_){}}}else if(e.key==="Escape"){e.preventDefault();e.stopPropagation();const a=PF.anchor;pfClose();try{a.focus()}catch(_){}}});
  d.addEventListener("click",e=>{const b=e.target.closest("[data-pfi]");if(!b)return;const p=pfList()[+b.dataset.pfi];if(!p)return;const f=PF.o.onPick;pfClose();f(p.email)})}
document.addEventListener("pointerdown",e=>{if(PF.el&&!e.target.closest(".pfpop")&&e.target!==PF.anchor&&!(PF.anchor&&PF.anchor.contains(e.target)))pfClose()},true);
addEventListener("resize",pfClose);
document.addEventListener("scroll",e=>{if(PF.el&&!(e.target.closest&&e.target.closest(".pfpop")))pfClose()},true);
wkFeat("find",{peoplePick,pfClose});
