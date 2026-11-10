/* rhy:se Weekly Plan — 🏢 조직도 보기 (feat-org.js, v3.24.0)
   직원 누구나 회사 전체 조직도를 읽기 전용으로 봄 (고치기는 ⚙ 관리 → 조직도, 관리자만)
   · 대표이사 · 임원 → 본부 › 실 › 팀 순서, 조직장 · 팀원의 이름 · 직책 · 메일
   · 내 팀 강조 + "내 결재 라인"(사업 삭제 요청 등이 가는 상급자 → 대표)
   · 🔎 이름 · 팀 · 메일로 찾기 (찾으면 그 조직이 펼쳐짐)
   · 보기 둘: 🗂 그림(조직도 그림, 상자를 누르면 아래에 사람 · 메일) / ☰ 목록 (PC 는 그림, 휴대폰은 목록으로 시작 · 마지막 고른 것 기억)
   · 위쪽(찾기 · 보기 고르기 · 결재 라인 · 대표)은 내려도 붙어 있음
   서버: 21-org-view.sql 의 wk_org_people (쓰는 중인 사람의 이름 · 메일 · 팀 · 직책). 조직(wk_units) · 대표(wk_company)는 원래 읽기 가능
   이 파일이 고장 나도 주간 업무는 그대로 */
const OV={units:null,people:null,err:"",q:"",open:new Set(),busy:false,sel:null,view:null};
const ovView=()=>{if(OV.view)return OV.view;let v="";try{v=localStorage.getItem("wk-org-view")||""}catch(_){}return OV.view=v==="chart"||v==="list"?v:(matchMedia("(max-width:720px)").matches?"list":"chart")};
async function ovLoad(){if(OV.busy)return;OV.busy=true;OV.err="";
  try{const [u,p]=await Promise.all([api.units(),api.orgPeople()]);OV.units=u||[];OV.people=p||[]}
  catch(x){OV.err=(x&&x.hint)||errText(x)}finally{OV.busy=false}}
const ovKids=id=>(OV.units||[]).filter(u=>(u.parent_id||null)===(id||null)).sort((a,b)=>(a.sort||0)-(b.sort||0)||String(a.name).localeCompare(String(b.name),"ko"));
const ovAnc=id=>{const out=[];let u=(OV.units||[]).find(x=>x.id===id),n=0;while(u&&n++<30){out.push(u);u=(OV.units||[]).find(x=>x.id===u.parent_id)}return out};
const ovMyUnit=()=>{const me=st.me;if(!me)return null;const p=(OV.people||[]).find(x=>x.email===me.email)||{};return (OV.units||[]).find(u=>u.team_id&&u.team_id===me.team_id)||(OV.units||[]).find(u=>u.id===p.unit_id)||null};
// 그 조직에 바로 속한 사람: 팀 조직이면 그 팀 사람(겸직 포함), 아니면 소속 조직이 그 조직인 사람 (조직장은 위에 따로)
function ovPeopleOf(u){const hE=String((u.head&&u.head.email)||"").toLowerCase();
  const L=(OV.people||[]).filter(p=>u.team_id?(p.team_id===u.team_id||p.extra_team===u.team_id):(!p.team_id&&p.unit_id===u.id)).filter(p=>p.email.toLowerCase()!==hE);
  return L.sort((a,b)=>(a.role==="leader"?0:1)-(b.role==="leader"?0:1)||String(a.name).localeCompare(String(b.name),"ko"))}
const ovMatch=(...v)=>{const q=OV.q.trim().toLowerCase();return !!q&&v.some(x=>String(x||"").toLowerCase().includes(q))};
const ovMail=e=>e?`<a class="ovmail mono" href="mailto:${esc(e)}">${esc(e)}</a>`:"";
const ovPerson=(name,title,email,cls)=>`<div class="ovp${cls?" "+cls:""}${ovMatch(name,title,email)?" hit":""}"><b>${esc(name||"이름 미정")}</b>${title?`<span class="ovt">${esc(title)}</span>`:""}${ovMail(email)}</div>`;
function ovHit(u){if(!OV.q.trim())return false;const h=u.head||{};if(ovMatch(u.name,h.name,h.title,h.email))return true;if(ovPeopleOf(u).some(p=>ovMatch(p.name,p.title,p.email)))return true;return ovKids(u.id).some(ovHit)}
const ovCount=u=>ovPeopleOf(u).length+((u.head&&(u.head.name||u.head.email))?1:0)+ovKids(u.id).reduce((n,k)=>n+ovCount(k),0);
function ovUnit(u,depth){const h=u.head||{},kids=ovKids(u.id),pp=ovPeopleOf(u),mine=st.me&&(u.team_id&&(u.team_id===st.me.team_id||u.team_id===st.me.extra_team)),q=!!OV.q.trim(),hit=q&&ovHit(u);
  if(q&&!hit)return "";const open=q||OV.open.has(u.id)||depth<1||mine;
  return `<div class="ovu${mine?" mine":""}${u.team_id?" team":""}" style="--d:${depth}"><button type="button" class="ovh" data-ovt="${esc(u.id)}" aria-expanded="${open}"><span class="ovar" aria-hidden="true">${kids.length||pp.length?(open?"▾":"▸"):"·"}</span><span class="ovlv">${esc(u.level||"")}</span><b class="${ovMatch(u.name)?"hit":""}">${esc(u.name)}</b>${mine?'<span class="ovme">내 팀</span>':""}<span class="ovn dim">${ovCount(u)}명</span></button>
    ${open?`<div class="ovbody">${h.name||h.email?ovPerson(h.name,h.title||(u.team_id?"팀장":"조직장"),h.email,"head"):""}${pp.map(p=>ovPerson(p.name,p.title||(p.role==="leader"?"팀장":""),p.email,p.role==="leader"?"lead":"")).join("")}${kids.map(k=>ovUnit(k,depth+1)).join("")}</div>`:""}</div>`}
// 🗂 그림 보기: 대표이사 → 맨 위 조직들을 가로로, 그 아래 조직은 세로로 (관리의 조직도와 같은 모양) · 상자를 누르면 아래에 사람
function ovChart(){const c=(CO&&CO.ceo)||{},roots=ovKids(null),q=!!OV.q.trim();
  const box=u=>{const h=u.head||{},mine=st.me&&u.team_id&&(u.team_id===st.me.team_id||u.team_id===st.me.extra_team),hit=q&&ovHit(u);
    return `<button type="button" class="ovcb${u.team_id?" team":""}${mine?" mine":""}${OV.sel===u.id?" on":""}${hit?" hit":q?" dimq":""}" data-ovsel="${esc(u.id)}" aria-pressed="${OV.sel===u.id}"><b>${u.team_id?'<i class="ovcdot" aria-hidden="true"></i>':""}${esc(u.name)}</b><small>${esc(h.name||"조직장 미정")} · ${ovCount(u)}명</small></button>`};
  const sub=k=>{const K=ovKids(k.id);return `<div class="ovcs">${box(k)}${K.length?`<div class="ovck">${K.map(sub).join("")}</div>`:""}</div>`};
  const col=u=>{const K=ovKids(u.id);return `<div class="ovcc">${box(u)}${K.length?`<div class="ovck">${K.map(sub).join("")}</div>`:""}</div>`};
  const sel=OV.sel&&(OV.units||[]).find(u=>u.id===OV.sel);
  const det=sel?(()=>{const h=sel.head||{},pp=ovPeopleOf(sel),K=ovKids(sel.id);return `<div class="ovdet"><div class="ovdh"><span class="ovlv">${esc(sel.level||"")}</span><b>${esc(sel.name)}</b><span class="dim">${ovCount(sel)}명</span><span class="spacer"></span><button type="button" class="pj-x on" data-ovsel="" aria-label="닫기">✕</button></div>
      ${ovAnc(sel.parent_id).length?`<div class="ovcrumb dim">${ovAnc(sel.parent_id).reverse().map(a=>esc(a.name)).join(" › ")} › ${esc(sel.name)}</div>`:""}
      ${h.name||h.email?ovPerson(h.name,h.title||(sel.team_id?"팀장":"조직장"),h.email,"head"):""}${pp.map(p=>ovPerson(p.name,p.title||(p.role==="leader"?"팀장":""),p.email,p.role==="leader"?"lead":"")).join("")}
      ${K.length?`<div class="ovsubs">${K.map(k=>`<button type="button" class="btn sm ghost" data-ovsel="${esc(k.id)}">${esc(k.name)} <span class="dim">${ovCount(k)}명</span></button>`).join("")}</div>`:""}${!pp.length&&!h.name&&!K.length?'<p class="hint" style="margin:4px 0">아직 사람이 없어요</p>':""}</div>`})():`<p class="hint ovpick" style="margin:10px 2px 0">상자를 누르면 그 조직의 사람과 메일이 여기에 보여요</p>`;
  return `<div class="ovcw"><div class="ovch"><div class="ovcceo"><div class="ovcb ceo"><b>${esc(c.title||"대표이사")}</b><small>${esc(c.name||"")}</small></div></div><div class="ovcr">${roots.map(col).join("")}</div></div></div>${det}`}
// 내 결재 라인: 내 팀 위 조직장들 → 대표 (사업 삭제 요청 등이 가는 곳)
function ovLine(){const u=ovMyUnit();if(!u)return "";const H=ovAnc(u.parent_id).map(x=>x.head).filter(h=>h&&(h.name||h.email));const c=(CO&&CO.ceo)||{};
  const L=H.map(h=>`<b>${esc(h.name||h.email)}</b> <span class="dim">${esc(h.title||"")}</span>`);if(c.name||c.email)L.push(`<b>${esc(c.name||c.email)}</b> <span class="dim">${esc(c.title||"대표이사")}</span>`);
  return L.length?`<div class="ovline"><span>내 결재 라인</span>${L.join('<i aria-hidden="true">→</i>')}<span class="dim ovlh">사업 삭제 요청은 첫 번째 분에게 가요</span></div>`:""}
function ovRender(){const B=$("orgBody");if(!B)return;
  if(OV.err){B.innerHTML=`<div class="rp-empty">${esc(OV.err)}</div>`;return}
  if(!OV.units){B.innerHTML=`<div class="rp-empty">불러오는 중…</div>`;return}
  const c=(CO&&CO.ceo)||{},ex=((CO&&CO.execs)||[]).filter(x=>x&&x.name),roots=ovKids(null),V=ovView();
  const top=V==="list"?`<div class="ovtop">${ovPerson(c.name,c.title||"대표이사",c.email,"ceo")}${ex.map(x=>ovPerson(x.name,x.title,x.email,"exec")).join("")}</div>`:"";
  const empty=OV.q.trim()?`<div class="rp-empty">'${esc(OV.q)}'(으)로 찾은 사람이 없어요</div>`:`<div class="rp-empty">아직 조직도가 없어요. 관리자가 ⚙ 관리 → 조직도에서 만들어요.</div>`;
  const body=V==="chart"?(roots.length?ovChart():empty):`<div class="ovtree">${roots.map(u=>ovUnit(u,0)).join("")||empty}</div>`;
  B.innerHTML=`<div class="ovstick"><div class="ovbar"><div class="pj-seg" role="tablist" aria-label="보기"><button type="button" role="tab" data-ovview="chart" aria-selected="${V==="chart"}">🗂 그림</button><button type="button" role="tab" data-ovview="list" aria-selected="${V==="list"}">☰ 목록</button></div>
      <input type="search" id="ovQ" placeholder="🔎 이름 · 팀 · 메일로 찾기" value="${esc(OV.q)}" autocomplete="off">${V==="list"?`<button type="button" class="btn sm ghost" data-ovall="1">${OV.open.size?"모두 접기":"모두 펼치기"}</button>`:""}${st.me&&st.me.is_admin?`<button type="button" class="btn sm" data-ovadmin="1">⚙ 관리에서 고치기</button>`:""}</div>
    ${ovLine()}${top}</div>${body}
    <p class="hint" style="margin:10px 2px 0">조직도는 관리자가 ⚙ 관리 → 조직도에서 고쳐요. 틀린 곳이 있으면 관리자에게 알려 주세요.</p>`;
  const mt=document.querySelector("#orgModal .mtop");if(mt)$("orgModal").style.setProperty("--ovtop",mt.offsetHeight+"px")}
async function orgOpen(){const m=$("userMenu");if(m)m.hidden=true;$("mscrim").hidden=false;$("orgModal").hidden=false;ovRender();await ovLoad();ovRender();const q=$("ovQ");if(q&&matchMedia("(min-width:721px)").matches)q.focus()}
function orgClose(){if($("orgModal").hidden)return;$("orgModal").hidden=true;if([...document.querySelectorAll(".modal")].every(x=>x.hidden))$("mscrim").hidden=true}
function orgPaint(){const b=$("miOrg");if(b)b.hidden=!st.me}
document.addEventListener("click",e=>{
  if(e.target.closest("#miOrg")){orgOpen();return}
  if(e.target.closest("#orgClose")||(e.target.id==="mscrim"&&!$("orgModal").hidden)){orgClose();return}
  if(!e.target.closest("#orgModal"))return;
  const vw=e.target.closest("[data-ovview]");if(vw){OV.view=vw.dataset.ovview;try{localStorage.setItem("wk-org-view",OV.view)}catch(_){}ovRender();return}
  const sl=e.target.closest("[data-ovsel]");if(sl){OV.sel=sl.dataset.ovsel||null;ovRender();if(OV.sel){const d=document.querySelector("#orgBody .ovdet");if(d)d.scrollIntoView({block:"nearest",behavior:"smooth"})}return}
  const t=e.target.closest("[data-ovt]");if(t){const id=t.dataset.ovt;OV.open.has(id)?OV.open.delete(id):OV.open.add(id);ovRender();return}
  if(e.target.closest("[data-ovall]")){if(OV.open.size)OV.open.clear();else (OV.units||[]).forEach(u=>OV.open.add(u.id));ovRender();return}
  if(e.target.closest("[data-ovadmin]")){orgClose();const a=$("miAdmin")||$("adminBtn");if(a)a.click();setTimeout(()=>{const b=document.querySelector('#adTabs [data-ad="org"]');if(b)b.click()},600);return}});
document.addEventListener("input",e=>{if(e.target.id!=="ovQ")return;OV.q=e.target.value;const pos=e.target.selectionStart;ovRender();const q=$("ovQ");if(q){q.focus();try{q.setSelectionRange(pos,pos)}catch(_){}}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("orgModal").hidden){e.stopImmediatePropagation();orgClose()}},true);
wkGuideAdd("org",{
  member:[{after:"m2",sec:["x-org","🏢 조직도 보기",[
    ["p","**👤 내 메뉴(휴대폰은 나) → 🏢 조직도**에서 회사 전체 조직도를 봅니다. 조직장 · 팀원의 이름 · 직책 · 메일이 보이고, 메일을 누르면 바로 메일을 씁니다."],
    ["ul",["**🗂 그림 · ☰ 목록** 중 편한 보기로 봅니다. 그림에서 상자를 누르면 아래에 그 조직의 사람이 나옵니다.","**🔎**에 이름 · 팀 · 메일을 쓰면 맞는 조직이 펼쳐집니다.","위쪽 **내 결재 라인**은 내 팀 위 상급자 → 대표 순서입니다. 📐 사업 삭제 요청은 첫 번째 분에게 갑니다.","조직도는 보기만 합니다. 바꿀 곳이 있으면 관리자에게 알려 주세요."]]]]}],
  faq:[["조직도가 틀렸어요","조직도는 관리자가 ⚙ 관리 → 조직도에서 고칩니다. 💬 의견 보내기로 알려 주세요."]]});
wkFeat("org",{orgPaint,orgOpen,orgClose});
