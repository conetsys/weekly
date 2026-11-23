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
document.addEventListener("input",e=>{if(e.target.id!=="ovQ")return;OV.q=e.target.value;wkTypeLater("ovQ",()=>{const q0=$("ovQ"),pos=q0?q0.selectionStart:OV.q.length;if(q0)OV.q=q0.value;ovRender();wkRefocus("ovQ",pos)})});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("orgModal").hidden){e.stopImmediatePropagation();orgClose()}},true);
wkGuideAdd("org",{
  member:[{after:"m2",sec:["x-org","🏢 조직도 보기",[
    ["p","**👤 내 메뉴(휴대폰은 나) → 🏢 조직도**에서 회사 전체 조직도를 봅니다. 조직장 · 팀원의 이름 · 직책 · 메일이 보이고, 메일을 누르면 바로 메일을 씁니다."],
    ["ul",["**🗂 그림 · ☰ 목록** 중 편한 보기로 봅니다. 그림에서 상자를 누르면 아래에 그 조직의 사람이 나옵니다.","**🔎**에 이름 · 팀 · 메일을 쓰면 맞는 조직이 펼쳐집니다.","위쪽 **내 결재 라인**은 내 팀 위 상급자 → 대표 순서입니다. 📐 사업 삭제 요청은 첫 번째 분에게 갑니다.","조직도는 보기만 합니다. 바꿀 곳이 있으면 관리자에게 알려 주세요."]]]]}],
  faq:[["조직도가 틀렸어요","조직도는 관리자가 ⚙ 관리 → 조직도에서 고칩니다. 💬 의견 보내기로 알려 주세요."]]});
/* ---------- 🏢 조직도에서 고르기 (v3.34.0.2) ----------
   회의 참석 요청 등에서 사람을 조직도로 고름. 사람마다 체크, 조직마다 [조직장] [전체], 맨 위 [모든 조직장](본부장 · 팀장 · 대표)
   F("orgPick",{max,have:[{email,name,team}],title}) → 고른 목록(Promise) · 취소하면 null. 나 자신은 못 고름. max 를 넘으면 넣지 않고 알려 줌
   부드럽게: 열고 닫을 때 살짝 떠오름 · 조직 펼치기는 높이가 자연스럽게 · 고른 사람 칩은 톡 하고 들어옴 (움직임 줄이기 설정이면 바로) */
const OP={res:null,sel:[],max:20,open:new Set(),q:"",title:"",fresh:new Set(),msgT:0};
const opLow=e=>String(e||"").toLowerCase();
const opMe=()=>opLow(st.me&&st.me.email);
const opCalm=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
function opPeopleIdx(){const m=new Map();(OV.people||[]).forEach(p=>{if(p.email)m.set(opLow(p.email),p)});return m}
function opInfo(email,fallback){const e=opLow(email),p=opPeopleIdx().get(e)||{},u=(OV.units||[]).find(x=>x.team_id&&x.team_id===p.team_id);
  const team=p.team_id?(typeof teamName==="function"?teamName(p.team_id):"")||(u&&u.name)||"":((OV.units||[]).find(x=>x.id===p.unit_id)||{}).name||"";
  return {email:e,name:p.name||(fallback&&fallback.name)||e.split("@")[0],team:team||(fallback&&fallback.team)||"",acct:!!p.email}}
const opCeo=()=>{const c=(typeof CO!=="undefined"&&CO&&CO.ceo)||{};return c.email?{email:opLow(c.email),name:c.name||"",title:c.title||"대표이사"}:null};
// 이 조직 아래 조직장들 (본인 포함 · 아래 조직 모두) / 이 조직 아래 모든 사람
function opHeads(u){const out=[];const h=u.head||{};if(h.email)out.push(opLow(h.email));ovKids(u.id).forEach(k=>out.push(...opHeads(k)));return out}
function opAll(u){const out=[];const h=u.head||{};if(h.email)out.push(opLow(h.email));ovPeopleOf(u).forEach(p=>out.push(opLow(p.email)));ovKids(u.id).forEach(k=>out.push(...opAll(k)));return out}
const opClean=L=>[...new Set(L)].filter(e=>e&&e!==opMe());
function opAllHeads(){const c=opCeo();return opClean([...(c?[c.email]:[]),...ovKids(null).flatMap(opHeads)])}
const opHas=e=>OP.sel.some(x=>x.email===e);
async function orgPick(o){o=o||{};
  if(!OV.units||!OV.people){for(let i=0;i<50&&OV.busy;i++)await new Promise(r=>setTimeout(r,100));if(!OV.units||!OV.people)await ovLoad()}
  if(OV.err&&!OV.units){toast(OV.err);return null}
  OP.max=o.max||20;OP.title=o.title||"고르기";OP.q="";OP.fresh=new Set();
  OP.sel=(o.have||[]).map(x=>({email:opLow(x.email),name:x.name||"",team:x.team||""})).filter(x=>x.email&&x.email!==opMe());
  // 처음엔 내 팀까지 펼쳐 둠
  OP.open=new Set();const mu=ovMyUnit();if(mu)ovAnc(mu.id).forEach(a=>OP.open.add(a.id));ovKids(null).forEach(u=>OP.open.add(u.id));
  return new Promise(res=>{OP.res=res;opMount()})}
function opMount(){let w=$("opWrap");if(w)w.remove();w=document.createElement("div");w.id="opWrap";w.className="op-wrap";
  w.innerHTML=`<div class="op-scrim" data-opx="1"></div><div class="op" role="dialog" aria-modal="true" aria-labelledby="opTitle">
    <div class="op-hd"><div><b id="opTitle">🏢 조직도에서 고르기</b><small>${esc(OP.title)} · ${OP.max}명까지 · 조직마다 [조직장] [전체]로 한 번에</small></div><button type="button" class="op-x" data-opx="1" aria-label="닫기">✕</button></div>
    <div class="op-tools"><label class="op-find"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3"></path></svg><input type="search" id="opQ" placeholder="이름 · 팀 · 직책으로 찾기" autocomplete="off" aria-label="찾기"></label>
      <button type="button" class="op-q big" data-opheads="*">👥 모든 조직장 <small>${opAllHeads().length}명</small></button></div>
    <div class="op-main"><div class="op-tree" id="opTree"></div>
      <aside class="op-side"><div class="op-sh"><b>고른 사람</b><span class="op-n" id="opN"></span></div><div class="op-bar"><i id="opBar"></i></div><div class="op-chips" id="opChips"></div></aside></div>
    <div class="op-msg" id="opMsg" role="status" aria-live="polite"></div>
    <div class="op-ft"><button type="button" class="btn" data-opx="1">취소</button><span class="spacer"></span><button type="button" class="btn primary" id="opOk">넣기</button></div></div>`;
  document.body.appendChild(w);
  w.addEventListener("click",opClick);w.addEventListener("change",opChange);
  $("opQ").addEventListener("input",e=>{OP.q=e.target.value;opTree()});
  w.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();opClose(null)}});
  opTree();opSide();
  requestAnimationFrame(()=>{w.classList.add("in");setTimeout(()=>{const q=$("opQ");if(q&&matchMedia("(min-width:721px)").matches)q.focus()},opCalm()?0:120)})}
function opClose(v){const w=$("opWrap"),res=OP.res;OP.res=null;if(!w){if(res)res(v);return}
  w.classList.remove("in");w.classList.add("out");setTimeout(()=>w.remove(),opCalm()?0:200);if(res)res(v)}
// 사람 한 줄
function opRow(email,name,title,cls,extra){const e=opLow(email),me=e===opMe(),on=opHas(e);
  return `<label class="op-p${cls?" "+cls:""}${me?" me":""}"><input type="checkbox" data-ope="${esc(e)}"${on?" checked":""}${me?" disabled":""}><span class="op-ck" aria-hidden="true"></span><b>${esc(name||e.split("@")[0])}</b>${title?`<span class="op-ti">${esc(title)}</span>`:""}${extra||""}${me?'<span class="op-ti">나</span>':""}</label>`}
function opUnit(u,depth){const h=u.head||{},kids=ovKids(u.id),pp=ovPeopleOf(u),open=OP.open.has(u.id),hs=opClean(opHeads(u)),al=opClean(opAll(u));
  const hOn=hs.length&&hs.every(opHas),aOn=al.length&&al.every(opHas),mine=st.me&&u.team_id&&(u.team_id===st.me.team_id||u.team_id===st.me.extra_team);
  return `<div class="op-u${mine?" mine":""}" style="--d:${depth}"><div class="op-uh"><button type="button" class="op-tg" data-optg="${esc(u.id)}" aria-expanded="${open}"><span class="op-car" aria-hidden="true">${kids.length||pp.length||h.email?"›":"·"}</span>${u.level?`<span class="ovlv">${esc(u.level)}</span>`:""}<b>${esc(u.name)}</b>${mine?'<span class="ovme">내 팀</span>':""}<span class="op-cnt">${al.length}명</span></button>
    ${hs.length?`<button type="button" class="op-q${hOn?" on":""}" data-opheads="${esc(u.id)}" title="${esc(u.name)} 아래 조직장 ${hs.length}명">조직장${hs.length>1?` ${hs.length}`:""}</button>`:""}${al.length?`<button type="button" class="op-q${aOn?" on":""}" data-opall="${esc(u.id)}" title="${esc(u.name)} 전체 ${al.length}명">전체</button>`:""}</div>
    <div class="op-kids${open?" open":""}" data-opk="${esc(u.id)}"><div class="op-in">${open||OP.q?opUnitBody(u,depth):""}</div></div></div>`}
function opUnitBody(u,depth){const h=u.head||{};return `${h.email?opRow(h.email,h.name,h.title||(u.team_id?"팀장":"조직장"),"head",'<span class="op-hb">조직장</span>'):""}${ovPeopleOf(u).map(p=>opRow(p.email,p.name,p.title||(p.role==="leader"?"팀장":""))).join("")}${ovKids(u.id).map(k=>opUnit(k,depth+1)).join("")}`}
function opTree(){const T=$("opTree");if(!T)return;const q=OP.q.trim().toLowerCase();
  if(q){// 찾기: 맞는 사람만 한 줄씩 (소속 경로와 함께)
    const seen=new Set(),hit=[];const c=opCeo();if(c&&(c.name+" "+c.title).toLowerCase().includes(q)){seen.add(c.email);hit.push(opRow(c.email,c.name,c.title,"head"))}
    (OV.units||[]).forEach(u=>{const path=ovAnc(u.id).reverse().map(a=>a.name).join(" › "),h=u.head||{};
      const one=(e,n,t,cls)=>{const le=opLow(e);if(!le||seen.has(le))return;if(![n,t,u.name,le].some(x=>String(x||"").toLowerCase().includes(q)))return;seen.add(le);hit.push(opRow(le,n,t,cls,`<span class="op-path">${esc(path)}</span>`))};
      if(h.email)one(h.email,h.name,h.title||(u.team_id?"팀장":"조직장"),"head");ovPeopleOf(u).forEach(p=>one(p.email,p.name,p.title||(p.role==="leader"?"팀장":"")))});
    T.innerHTML=hit.length?`<div class="op-hits">${hit.join("")}</div>`:`<p class="op-none">'${esc(OP.q.trim())}' 찾는 사람이 없어요</p>`;return}
  const c=opCeo();
  T.innerHTML=`${c?`<div class="op-ceo">${opRow(c.email,c.name,c.title,"head",'<span class="op-hb">대표</span>')}</div>`:""}${ovKids(null).map(u=>opUnit(u,0)).join("")||'<p class="op-none">조직도가 아직 없어요 · 관리자가 ⚙ 관리 › 조직도에서 만들어요</p>'}`}
// 고른 상태만 맞춤 (다시 그리지 않아 펼침 움직임이 끊기지 않음)
function opSync(){const w=$("opWrap");if(!w)return;
  w.querySelectorAll("[data-ope]").forEach(i=>{i.checked=opHas(i.dataset.ope)});
  w.querySelectorAll("[data-opheads],[data-opall]").forEach(b=>{const id=b.dataset.opheads||b.dataset.opall,L=b.dataset.opheads==="*"?opAllHeads():(()=>{const u=(OV.units||[]).find(x=>x.id===id);return u?opClean(b.dataset.opheads?opHeads(u):opAll(u)):[]})();b.classList.toggle("on",!!L.length&&L.every(opHas))});
  opSide()}
function opSide(){const n=OP.sel.length,N=$("opN"),B=$("opBar"),C=$("opChips"),ok=$("opOk");if(!C)return;
  N.textContent=`${n}/${OP.max}`;N.classList.toggle("full",n>=OP.max);B.style.width=Math.min(100,n/OP.max*100)+"%";B.classList.toggle("full",n>=OP.max);
  C.innerHTML=n?OP.sel.map(p=>`<span class="op-chip${OP.fresh.has(p.email)?" new":""}"><b>${esc(p.name)}</b><em>${esc(p.team)}</em><button type="button" data-oprm="${esc(p.email)}" aria-label="${esc(p.name)} 빼기">✕</button></span>`).join(""):`<p class="op-empty">왼쪽에서 사람을 체크하거나<br>조직의 [조직장] · [전체]를 눌러요</p>`;
  OP.fresh.clear();ok.textContent=n?`${n}명 넣기`:"넣기"}
function opMsg(t){const m=$("opMsg");if(!m)return;m.textContent=t;m.classList.add("show");clearTimeout(OP.msgT);OP.msgT=setTimeout(()=>m.classList.remove("show"),3200);
  const N=$("opN");if(N&&!opCalm()){N.classList.remove("shake");void N.offsetWidth;N.classList.add("shake")}}
// 여러 명을 한 번에: 모두 들어 있으면 빼고, 아니면 넣음 (넘치면 넣지 않고 알림)
function opToggleMany(L,label){L=opClean(L);if(!L.length)return;
  if(L.every(opHas)){OP.sel=OP.sel.filter(x=>!L.includes(x.email));opSync();return}
  const add=L.filter(e=>!opHas(e));
  if(OP.sel.length+add.length>OP.max){opMsg(`${label} ${add.length}명을 더하면 ${OP.sel.length+add.length}명이라 ${OP.max}명을 넘어요. 조직을 나눠서 골라 주세요.`);return}
  add.forEach(e=>{OP.sel.push(opInfo(e));OP.fresh.add(e)});opSync()}
function opClick(e){const t=e.target;
  if(t.closest("[data-opx]")){opClose(null);return}
  if(t.closest("#opOk")){opClose(OP.sel.slice());return}
  const tg=t.closest("[data-optg]");if(tg){const id=tg.dataset.optg,k=$("opWrap").querySelector(`[data-opk="${CSS.escape(id)}"]`),u=(OV.units||[]).find(x=>x.id===id);if(!k||!u)return;
    const open=!OP.open.has(id);if(open){OP.open.add(id);const inn=k.querySelector(".op-in");if(!inn.innerHTML.trim())inn.innerHTML=opUnitBody(u,+(getComputedStyle(k.parentNode).getPropertyValue("--d")||0))}else OP.open.delete(id);
    tg.setAttribute("aria-expanded",open);k.classList.toggle("open",open);return}
  const hb=t.closest("[data-opheads]");if(hb){const id=hb.dataset.opheads;if(id==="*"){opToggleMany(opAllHeads(),"모든 조직장");return}const u=(OV.units||[]).find(x=>x.id===id);if(u)opToggleMany(opHeads(u),`${u.name} 조직장`);return}
  const ab=t.closest("[data-opall]");if(ab){const u=(OV.units||[]).find(x=>x.id===ab.dataset.opall);if(u)opToggleMany(opAll(u),`${u.name} 전체`);return}
  const rm=t.closest("[data-oprm]");if(rm){const e2=rm.dataset.oprm,chip=rm.closest(".op-chip");const go=()=>{OP.sel=OP.sel.filter(x=>x.email!==e2);opSync()};if(chip&&!opCalm()){chip.classList.add("bye");setTimeout(go,140)}else go()}}
function opChange(e){const i=e.target.closest("[data-ope]");if(!i)return;const em=i.dataset.ope;
  if(i.checked){if(opHas(em))return;if(OP.sel.length>=OP.max){i.checked=false;opMsg(`${OP.max}명까지 고를 수 있어요.`);return}OP.sel.push(opInfo(em));OP.fresh.add(em)}
  else OP.sel=OP.sel.filter(x=>x.email!==em);
  opSync()}
wkFeat("org",{orgPaint,orgOpen,orgClose,orgPick});
