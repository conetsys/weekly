/* rhy:se Weekly Plan — 📐 사업 관리 (feat-proj.js, v3.21.0)
   표준 공정으로 사업을 세우고, 정해 둔 일 · 산출물을 개발 기간 내내 놓치지 않게 챙기는 별도 모듈 (연구소 요청)
   · 주간 업무와 연결하지 않음. 같은 로그인 · 사람 · 팀만 씀. 필요할 때만 "이번 주 내 계획에 넣기"(한 방향 · 본인 선택)
   · 팀장이 🧩 기능 더하기 → 우리 팀 설정에서 켠 팀만 (wk_teams.features.dev). 담당자도 켠 팀 사람만
   · 사업을 만들면 기본 공정(연구소 엑셀: Kick-off/SRR·SFR → HDD → PDR → CDR → 시제 → TRR → 환경시험 → 납품)이 자동으로. 사업마다 더하고 빼기
   · 고치기: 사업 책임자 · 팀장 · 관리자 / 완료 표시: 담당자 / 검토 의견: 팀장 · 책임자 (메모는 누구나)
   · 진척: 완료일 기준 준수 / 미준수 / 7일 이상 · 달성율 (엑셀 방식)
   서버: 17-projects.sql. 이 파일이 고장 나도 주간 업무는 그대로 */
/* v3.21.0 /pm/ 분리: 사업 관리는 rhy:se 위에 얹는 '옵션' — 같은 사이트의 다른 주소(weekly/pm/)에서 열림 (로그인 그대로, 같은 창 전환)
   사용권 두 겹: ① 회사(wk_company.modules.pm · 관리자) ② 팀(features.dev · 팀장). 미리보기에서는 주소 대신 #pm 으로 흉내 */
const PM_MODE=/\/pm\/?(index\.html)?$/.test(location.pathname)||location.hash==="#pm";
const PM_REAL=typeof CONFIGURED!=="undefined"&&CONFIGURED&&/^https?:/.test(location.protocol);
const pmLicensed=()=>!!(typeof CO!=="undefined"&&CO&&CO.modules&&CO.modules.pm);
// 다른 화면으로: target "pm" | "app". 넘길 것은 sessionStorage 로 (같은 창)
function pmGo(target,carry){try{if(carry)sessionStorage.setItem(carry.k,JSON.stringify(carry.v))}catch(_){}
  if(PM_REAL){const base=location.pathname.replace(/pm\/?(index\.html)?$/,"").replace(/index\.html$/,"");location.href=base+(target==="pm"?"pm/":"");return}
  location.hash=target==="pm"?"#pm":"";location.reload()}
const pmTake=k=>{try{const v=sessionStorage.getItem(k);if(v){sessionStorage.removeItem(k);return JSON.parse(v)}}catch(_){}return null};
const PJ={open:false,view:"list",pid:null,list:[],marks:[],notes:[],dir:[],loaded:false,edit:false,info:false,fold:new Set(),thr:null,team:null};
const PJ_TPL=[
  ["Kick-off / SRR·SFR","착수회의 자료(PPT) · 요구사항 검토 결과",["기술협의","SOW/DPS 검토","KICK-OFF 자료 작성"]],
  ["HDD 하드웨어설계기술서","HDD",["HDD 작성"]],
  ["PDR 기본설계","기본설계 자료 · PDR 회의록",["구성품 선정","배치안 검토","PDR 자료 작성"]],
  ["CDR 상세설계","도면 · CDR 자료",["상세 설계 · 도면 작성","CDR 자료 작성","생산의뢰"]],
  ["시제 생산 · 조립","생산의뢰서 · 조립 완료",["발주 · 생산의뢰","입고 확인","조립"]],
  ["TRR 시험준비검토","시험절차서 · TRR 자료",["시험절차서 작성","TRR 자료 작성"]],
  ["환경시험","시험성적서",["환경시험 수행","성적서 정리"]],
  ["납품","납품 확인서",["출하 검사","납품"]]];
const pjD=s=>new Date(s+"T00:00:00"),pjDiff=(a,b)=>Math.round((pjD(b)-pjD(a))/864e5);
const pjAdd=(s,n)=>keyOf(addDays(pjD(s),n));
const pjMD=s=>s?String(+s.slice(5,7))+"/"+String(+s.slice(8,10)):"";
const pjId=()=>"p"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const pjTeamOn=id=>{const t=st.teams.find(x=>x.id===id);return !!(t&&t.features&&t.features.dev)};
// 모듈을 쓸 팀: 지금 보는 팀이 켜져 있으면 그 팀, 아니면 내 팀(겸직 포함) 중 켜진 팀
function pjTeam(){if(!st.me||!pmLicensed())return null;if(st.team&&pjTeamOn(st.team)&&canViewTeam(st.team))return st.team;return myTeams().find(pjTeamOn)||null}
const pjProj=id=>PJ.list.find(p=>p.id===id);
const pjTasks=p=>((p&&p.data.phases)||[]).flatMap(ph=>(ph.tasks||[]).map(t=>Object.assign({},t,{_ph:ph})));
const pjMark=(pid,tid)=>PJ.marks.find(m=>m.project_id===pid&&m.task_id===tid);
const pjCanEdit=p=>!!(st.me&&p&&(st.me.is_admin||p.owner_email===st.me.email||(st.me.role==="leader"&&p.team_id===st.me.team_id)));
const pjCanMark=(p,t)=>pjCanEdit(p)||!!(t&&st.me&&t.owner_email===st.me.email);
const pjReviewer=p=>pjCanEdit(p)||(st.me&&st.me.role==="leader")||isBoss();
const pjName=e=>{const x=PJ.dir.find(d=>d.email===e);return x?x.name:""};
// 할 일 상태: 완료(준수 · 미준수 · 7일 이상) / 지남 / 곧(2주) / 예정
function pjSt(p,t){const m=pjMark(p.id,t.id),done=m&&m.done_at;
  if(done){if(!t.due)return {k:"done",t:"완료",c:"ok",done};const g=pjDiff(t.due,done);return g<=0?{k:"done",t:g<0?`완료 · ${-g}일 먼저`:"완료 · 제때",c:"ok",ok:true,done}:{k:"done",t:`완료 · ${g}일 늦음`,c:g>=7?"bad":"warn",ok:false,late7:g>=7,done}}
  if(!t.due)return {k:"none",t:"목표일 없음",c:"dim"};
  const r=pjDiff(todayKey,t.due);if(r<0)return {k:"late",t:`${-r}일 지남`,c:"bad",d:r};if(r<=14)return {k:"soon",t:r?`D-${r}`:"오늘",c:"warn",d:r};return {k:"plan",t:`D-${r}`,c:"dim",d:r}}
function pjKpi(p){const T=pjTasks(p),S=T.map(t=>pjSt(p,t)),done=S.filter(s=>s.k==="done"),ok=done.filter(s=>s.ok).length;
  return {n:T.length,done:done.length,ok,miss:done.filter(s=>s.ok===false).length,l7:done.filter(s=>s.late7).length,late:S.filter(s=>s.k==="late").length,rate:done.length?Math.round(ok/done.length*100):null}}
async function pjLoad(){const t=pjTeam();PJ.team=t;if(!t){PJ.list=[];PJ.loaded=true;return}
  try{const [r,d]=await Promise.all([api.projList(t),PJ.dir.length?Promise.resolve(PJ.dir):api.directory()]);PJ.list=r.projects||[];PJ.marks=r.marks||[];PJ.notes=r.notes||[];PJ.dir=d||[];PJ.loaded=true}
  catch(_){PJ.loaded=true}
  paintNoticeDot();if(PJ.open)pjRender()}
// 담당자로 넣을 수 있는 사람: 📐 켠 팀 사람만
const pjPeople=()=>PJ.dir.filter(d=>pjTeamOn(d.team_id));
/* ---------- 🔔 알림: 내 할 일 · 내 사업에 달린 새 검토 의견 · 메모 ---------- */
const PJK=()=>"wk-pj-seen-"+(st.me?st.me.email:"");
const pjSeen=()=>{try{return JSON.parse(localStorage.getItem(PJK())||"{}")}catch(_){return {}}};
const pjSeenSet=k=>{const m=pjSeen();m[k]=new Date().toISOString();try{localStorage.setItem(PJK(),JSON.stringify(m))}catch(_){}};
function pjNews(){if(!st.me)return [];const S=pjSeen();
  return PJ.notes.filter(n=>{if(n.author_email===st.me.email)return false;const p=pjProj(n.project_id);if(!p)return false;
    const t=pjTasks(p).find(x=>x.id===n.task_id),mine=(t&&t.owner_email===st.me.email)||p.owner_email===st.me.email;
    return mine&&n.created_at>(S[n.project_id+"|"+(n.task_id||"")]||"")})}
function projAlertCount(){return pjNews().length}
function projAlertsHtml(){return pjNews().map(n=>{const p=pjProj(n.project_id),t=pjTasks(p).find(x=>x.id===n.task_id);
  return `<div class="walr k-share"><span class="wlv">📐</span><button type="button" class="wtx" data-pjopen="${esc(n.project_id)}" data-pjtask="${esc(n.task_id||"")}"><b>${n.is_review?"검토 의견":"메모"} · ${esc(n.author_name||"")}</b> · ${esc(n.body.slice(0,60))}<span class="wsub">${esc(p.data.name)}${t?" · "+esc(t.name):""}</span></button><span class="wact"><button type="button" class="btn sm" data-pjopen="${esc(n.project_id)}" data-pjtask="${esc(n.task_id||"")}">보기</button></span></div>`}).join("")}
/* ---------- 화면 ---------- */
function pjEnsure(){if($("projPage"))return;const s=document.createElement("section");s.id="projPage";s.hidden=true;s.setAttribute("aria-label","사업 관리");
  s.innerHTML=`<div class="pj-top"><div class="wrap pj-bar"><div class="pm-sw" role="tablist" aria-label="화면 바꾸기"><button type="button" class="pm-swb" id="pjBack" role="tab" aria-selected="false">rhy:se 주간 업무</button><button type="button" class="pm-swb" role="tab" aria-selected="true">📐 사업 관리</button></div><h2><small id="pjTeamNm"></small></h2>
    <div class="tabs" id="pjTabs" role="tablist"></div><span class="spacer"></span><button class="btn primary" id="pjNew" type="button">+ 새 사업</button><button class="btn nbtn" id="pjAlert" type="button" aria-label="알림">🔔<b class="aln" id="pjAlertN" hidden></b></button><span class="pm-me dim" id="pjMe"></span></div></div><div class="wrap pj-body" id="pjBody"></div>`;
  document.body.appendChild(s)}
function pjPaint(){const on=!!pjTeam();
  let b=$("projBtn");if(!b&&on){const rb=$("reportBtn");if(rb){b=document.createElement("button");b.className="btn";b.id="projBtn";b.type="button";b.title="사업별 공정 · 내 할 일 (주간 업무와 따로)";b.textContent="📐 사업 관리";rb.insertAdjacentElement("afterend",b);b.onclick=()=>pmGo("pm")}}
  if(b)b.hidden=!on;
  let m=$("miProj");if(!m&&on){const mm=$("miMods");if(mm){m=document.createElement("button");m.type="button";m.setAttribute("role","menuitem");m.id="miProj";m.textContent="📐 사업 관리";mm.insertAdjacentElement("beforebegin",m);m.onclick=()=>{$("userMenu").hidden=true;pmGo("pm")}}}
  if(m)m.hidden=!on;
  if(on&&!PJ.loaded&&!PJ.busy){PJ.busy=true;pjLoad().finally(()=>{PJ.busy=false})}
  if(PM_MODE&&st.me&&st.loaded&&!PJ.open){const g=pmTake("wk-pm-goto")||{};pjOpen(g.pid,g.tid)}
  if(!PM_MODE&&st.me&&st.loaded&&!PJ.planWait){const pl=pmTake("wk-pm-plan");if(pl){PJ.planWait=setInterval(()=>{   // 팝업 공지 · 다른 창이 닫힌 뒤에 채움
    if(!$("drawer").hidden||!$("noticeModal").hidden||!$("mscrim").hidden||!canAddHere())return;clearInterval(PJ.planWait);PJ.planWait=null;pjFillPlan(pl)},400)}}
  return true}
function pjOpen(pid,tid){pjEnsure();PJ.open=true;PJ.info=false;PJ.thr=tid||null;if(pid){PJ.view="proj";PJ.pid=pid}else if(PJ.view==="proj"&&!pjProj(PJ.pid))PJ.view="list";
  $("projPage").hidden=false;document.documentElement.classList.add("pj-on");pjRender();pjStickTop();pjLoad().then(()=>{if(tid){const r=document.querySelector(`[data-pjrow="${CSS.escape(tid)}"]`);if(r)r.scrollIntoView({block:"center"})}})}
function pjClose(){if(!PJ.open)return;if(PM_MODE){pmGo("app");return}PJ.open=false;$("projPage").hidden=true;document.documentElement.classList.remove("pj-on");paintNoticeDot()}
const pjBoss=()=>!!st.me&&(st.me.is_admin||isBoss()||(st.me.role==="leader")||PJ.list.some(p=>p.owner_email===st.me.email));
function pjRender(){if(!PJ.open)return;const B=$("pjBody");
  $("pjMe").textContent=st.me?st.me.name:"";if(PM_MODE)document.title="사업 관리"+(PJ.team?" - "+teamName(PJ.team):"")+" · rhy:se";const an=F("alertCount")||0,ab=$("pjAlertN");if(ab){ab.hidden=!an;ab.textContent=an>99?"99+":an}
  $("pjTeamNm").textContent=PJ.team?" "+teamName(PJ.team):"";
  const tabs=[["list","사업 목록"],["mine","내 할 일"],...(pjBoss()?[["block","막히는 곳"]]:[])];
  if(PJ.view==="proj")tabs.push(["proj",(pjProj(PJ.pid)||{data:{name:"사업"}}).data.name]);
  $("pjTabs").innerHTML=tabs.map(([k,l])=>`<button class="tab" role="tab" type="button" data-pjv="${k}" aria-selected="${PJ.view===k}">${esc(l)}</button>`).join("");
  $("pjNew").hidden=!PJ.team||!isMyTeam(PJ.team)||PJ.view==="proj";
  if(!pmLicensed()){B.innerHTML=`<div class="pj-empty"><b>우리 회사는 📐 사업 관리를 쓰지 않아요</b>관리자가 ⚙ 관리 → 회사 설정 → 옵션 기능에서 켤 수 있어요.<br><br><button type="button" class="btn" data-pmgo="app">← rhy:se 주간 업무로</button></div>`;return}
  if(!PJ.team){B.innerHTML=`<div class="pj-empty"><b>우리 팀에서 📐 사업 관리를 켜지 않았어요</b>팀장이 rhy:se의 🧩 기능 더하기 → 우리 팀 설정에서 켤 수 있어요.<br><br><button type="button" class="btn" data-pmgo="app">← rhy:se 주간 업무로</button></div>`;return}
  if(!PJ.loaded){B.innerHTML=`<div class="pj-empty">불러오는 중…</div>`;return}
  requestAnimationFrame(pjStickTop);
  B.innerHTML=PJ.view==="mine"?pjMineHtml():PJ.view==="block"?pjBlockHtml():PJ.view==="new"?pjNewHtml():PJ.view==="proj"&&pjProj(PJ.pid)?pjProjHtml(pjProj(PJ.pid)):pjListHtml()}
function pjListHtml(){if(!PJ.list.length)return `<div class="pj-empty"><b>아직 사업이 없어요</b>위쪽 <b>+ 새 사업</b>을 누르면 기본 공정(Kick-off → … → 납품)이 자동으로 들어가요.</div>`;
  return `<div class="pj-cards">${PJ.list.map(p=>{const k=pjKpi(p),d=p.data,nx=(d.phases||[]).find(ph=>pjTasks({data:{phases:[ph]}}).some(t=>!(pjMark(p.id,t.id)||{}).done_at));
    return `<button type="button" class="pj-card" data-pjopen="${esc(p.id)}"><div class="pj-ch"><b>${esc(d.name)}</b>${d.code?`<span class="dim mono">${esc(d.code)}</span>`:""}</div>
      <div class="dim">${esc(d.customer||"")}${d.customer?" · ":""}${pjMD(d.start)}~${pjMD(d.end)} · 책임 ${esc(pjName(p.owner_email)||"")}</div>
      <div class="pj-prog"><i style="width:${k.n?Math.round(k.done/k.n*100):0}%"></i></div>
      <div class="pj-cs"><span>할 일 <b>${k.done}/${k.n}</b></span>${k.late?`<span class="bad">지남 <b>${k.late}</b></span>`:""}<span>달성율 <b>${k.rate==null?"-":k.rate+"%"}</b></span>${nx?`<span class="dim">지금: ${esc(nx.name)}</span>`:""}</div></button>`}).join("")}</div>`}
function pjNewHtml(){const me=st.me,t=todayKey,ppl=pjPeople();
  return `<form class="pj-new" id="pjNewForm" novalidate><h3>새 사업</h3><p class="hint" style="margin:0 0 10px">만들면 기본 공정 ${PJ_TPL.length}개와 할 일이 들어가요. 기간에 맞춰 목표일을 나눠 넣고, 만든 뒤에 더하고 빼면 돼요.</p>
    <div class="pj-grid"><label>사업명 *<input id="pjnName" maxlength="60" placeholder="예: MUSV2 원격통제소"></label><label>사업 번호<input id="pjnCode" maxlength="30" placeholder="예: A-1"></label>
    <label>고객사<input id="pjnCust" maxlength="40" list="dl-pjcust"></label><label>책임자<select id="pjnOwner">${ppl.map(p=>`<option value="${esc(p.email)}"${p.email===me.email?" selected":""}>${esc(p.name)} · ${esc(p.team_name)}</option>`).join("")||`<option value="${esc(me.email)}">${esc(me.name)}</option>`}</select></label>
    <label>시작일 *<input type="date" id="pjnStart" value="${t}"></label><label>완료 예정일 *<input type="date" id="pjnEnd" value="${pjAdd(t,365)}"></label></div>
    <datalist id="dl-pjcust">${(st.lists.customers||[]).map(c=>`<option value="${esc(c)}">`).join("")}</datalist>
    <p class="err" id="pjnErr" hidden></p><div class="pj-foot"><button type="button" class="btn" data-pjv="list">취소</button><button type="submit" class="btn primary">만들기</button></div></form>`}
function pjFromTpl(start,end,owner){const span=Math.max(PJ_TPL.length,pjDiff(start,end)),n=PJ_TPL.length;
  return PJ_TPL.map(([name,del,tasks],i)=>{const due=pjAdd(start,Math.round(span*(i+1)/n));return {id:pjId(),name,deliverable:del,due,tasks:tasks.map(x=>({id:pjId(),name:x,owner_email:owner,deliverable:"",due}))}})}
// 사업 상세: 위는 틀 고정(사업 · 숫자 · 공정 흐름), 아래는 대공정 ▸ 세부 할 일 트리. 고칠 수 있는 사람은 그 자리에서 바로 고치고 ⋮⋮ 로 끌어 순서 바꿈
function pjProjHtml(p){const d=p.data,k=pjKpi(p),ed=pjCanEdit(p),ppl=pjPeople(),ph0=d.phases||[];
  const nowPh=ph0.find(ph=>(ph.tasks||[]).some(t=>!(pjMark(p.id,t.id)||{}).done_at));
  const info=PJ.info&&ed?`<div class="pj-info pj-grid"><label>사업명<input data-pji="name" value="${esc(d.name)}" maxlength="60"></label><label>사업 번호<input data-pji="code" value="${esc(d.code||"")}" maxlength="30"></label><label>고객사<input data-pji="customer" value="${esc(d.customer||"")}" maxlength="40"></label>
      <label>시작일<input type="date" data-pji="start" value="${esc(d.start||"")}"></label><label>완료 예정일<input type="date" data-pji="end" value="${esc(d.end||"")}"></label><label>책임자<select data-pji="owner">${ppl.map(x=>`<option value="${esc(x.email)}"${x.email===p.owner_email?" selected":""}>${esc(x.name)}</option>`).join("")}</select></label>
      <div class="pj-infof"><button type="button" class="btn danger sm" data-pja="delproj">사업 지우기</button><span class="spacer"></span><button type="button" class="btn sm primary" data-pja="info">닫기</button></div></div>`:"";
  const stick=`<div class="pj-stick" id="pjStick"><div class="pj-head"><div class="pj-hl"><b class="pj-nm">${esc(d.name)}</b>${d.code?`<span class="dim mono">${esc(d.code)}</span>`:""}<span class="dim pj-meta">${esc(d.customer||"")}${d.customer?" · ":""}${pjMD(d.start)}~${pjMD(d.end)} · 책임 ${esc(pjName(p.owner_email))}</span>${ed?`<button type="button" class="btn sm ghost" data-pja="info" aria-expanded="${!!PJ.info}">⚙ 정보</button>`:""}<span class="pj-sv dim" id="pjSv"></span></div>
      <div class="pj-kpis"><span><b>${k.done}/${k.n}</b>완료</span><span class="${k.late?"bad":""}"><b>${k.late}</b>지남</span><span><b>${k.ok}</b>준수</span><span class="${k.miss?"warn":""}"><b>${k.miss}</b>미준수</span><span class="${k.l7?"bad":""}"><b>${k.l7}</b>7일↑</span><span><b>${k.rate==null?"-":k.rate+"%"}</b>달성율</span><button type="button" class="btn sm ghost" data-pja="xls" title="엑셀로 받기">📥</button></div></div>
    <div class="pj-ms">${ph0.map(ph=>{const T=(ph.tasks||[]),dn=T.filter(t=>(pjMark(p.id,t.id)||{}).done_at).length,all=T.length&&dn===T.length,late=!all&&ph.due&&ph.due<todayKey;
      return `<button type="button" class="pj-msi${all?" ok":late?" bad":""}${ph===nowPh?" now":""}" data-pjgo="${esc(ph.id)}"><b>${esc(ph.name.split(/[ /]/)[0])}</b><span>${pjMD(ph.due)||"-"} · ${dn}/${T.length}</span><i style="width:${T.length?Math.round(dn/T.length*100):0}%"></i></button>`}).join("")}</div></div>`;
  const inp=(f,v,ph,extra)=>ed?`<input class="pj-in" data-pjf="${f}" value="${esc(v||"")}"${ph?` placeholder="${ph}"`:""}${extra||""}>`:esc(v||"");
  const own=t=>ed?`<select class="pj-in" data-pjf="owner" aria-label="담당"><option value="">미정</option>${ppl.map(x=>`<option value="${esc(x.email)}"${x.email===t.owner_email?" selected":""}>${esc(x.name)}</option>`).join("")}${t.owner_email&&!ppl.some(x=>x.email===t.owner_email)?`<option value="${esc(t.owner_email)}" selected>${esc(pjName(t.owner_email)||t.owner_email)}</option>`:""}</select>`:esc(pjName(t.owner_email)||"미정");
  const due=(f,v)=>ed?`<input type="date" class="pj-in mono" data-pjf="${f}" value="${esc(v||"")}" aria-label="목표일">`:`<span class="mono">${pjMD(v)||"-"}</span>`;
  let rows="",no=0;
  ph0.forEach((ph,pi)=>{const T=ph.tasks||[],dn=T.filter(t=>(pjMark(p.id,t.id)||{}).done_at).length,fold=PJ.fold.has(ph.id),late=dn<T.length&&ph.due&&ph.due<todayKey;no=pi+1;
    rows+=`<tr class="pj-pr${late?" late":""}" data-k="ph" data-ph="${esc(ph.id)}" id="pj-${esc(ph.id)}"><td class="pj-h">${ed?`<span class="pj-grip" data-grip="ph" title="끌어서 순서 바꾸기" aria-label="끌어서 순서 바꾸기">⋮⋮</span>`:""}</td>
      <td class="pj-nmc"><button type="button" class="pj-fold" data-pjfold="${esc(ph.id)}" aria-expanded="${!fold}">${fold?"▸":"▾"}</button><span class="pj-no">${no}</span>${inp("phname",ph.name,"대공정 이름",' aria-label="대공정 이름"')}</td>
      <td class="pj-sub">${inp("phdel",ph.deliverable,"산출물",' aria-label="산출물"')}</td><td class="dim pj-c3">대공정</td><td>${due("phdue",ph.due)}</td>
      <td><span class="pj-pg"><i style="width:${T.length?Math.round(dn/T.length*100):0}%"></i></span><span class="pj-pn${late?" bad":""}">${dn}/${T.length}</span></td><td class="pj-act">${ed?`<button type="button" class="pj-x" data-pja="delph" title="대공정 빼기" aria-label="대공정 빼기">✕</button>`:""}</td></tr>`;
    if(fold)return;
    T.forEach((t,ti)=>{rows+=pjRowHtml(p,t,ph,`${no}.${ti+1}`,{inp,own,due,ed})});
    if(ed)rows+=`<tr class="pj-addr" data-ph="${esc(ph.id)}"><td></td><td colspan="6"><button type="button" class="pj-add" data-pja="addtask">+ 세부 할 일</button></td></tr>`});
  return stick+info+`<div class="pj-tree-w"><table class="pj-tree" id="pjTree"><thead><tr><th class="pj-h"></th><th>공정 · 할 일</th><th>산출물</th><th>담당</th><th>목표일</th><th>상태</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    ${ed?`<button type="button" class="pj-add big" data-pja="addph">+ 대공정 추가</button>`:""}${!ph0.length?`<div class="pj-empty">공정이 없어요${ed?" · + 대공정 추가로 시작해요":""}</div>`:""}</div>`}
function pjRowHtml(p,t,ph,no,h){const s=pjSt(p,t),m=pjMark(p.id,t.id),can=pjCanMark(p,t),N=PJ.notes.filter(n=>n.project_id===p.id&&n.task_id===t.id),mine=st.me&&t.owner_email===st.me.email,open=PJ.thr===t.id;
  const S=pjSeen(),nw=N.some(n=>n.author_email!==st.me.email&&n.created_at>(S[p.id+"|"+t.id]||""));
  return `<tr class="pj-tr${s.k==="done"?" done":""}${mine?" mine":""}" data-k="t" data-ph="${esc(ph.id)}" data-t="${esc(t.id)}" data-pjrow="${esc(t.id)}"><td class="pj-h">${h.ed?`<span class="pj-grip" data-grip="t" title="끌어서 순서 바꾸기" aria-label="끌어서 순서 바꾸기">⋮⋮</span>`:""}</td>
    <td class="pj-nmc"><span class="pj-br">└</span><input type="checkbox" class="pj-ck" data-pjdone="${esc(t.id)}"${m&&m.done_at?" checked":""}${can?"":" disabled"} aria-label="완료"><span class="pj-no">${no}</span>${mine?'<span class="pj-me">나</span> ':""}${h.inp("tname",t.name,"할 일",' aria-label="할 일"')}</td>
    <td class="pj-sub">${h.inp("tdel",t.deliverable,"산출물",' aria-label="산출물"')}</td><td>${h.own(t)}</td><td>${h.due("tdue",t.due)}</td>
    <td><span class="pj-tag ${s.c}">${esc(s.t)}</span>${s.done?` <span class="dim mono pj-dd">${pjMD(s.done)}</span>`:""}</td>
    <td class="pj-act"><button type="button" class="pj-ib${nw?" new":""}" data-pjthr="${esc(t.id)}" aria-expanded="${open}" title="검토 의견 · 메모">💬${N.length?`<b>${N.length}</b>`:""}</button>${mine&&s.k!=="done"?`<button type="button" class="pj-ib" data-pjplan="${esc(t.id)}" title="이번 주 내 계획에 넣기 (업무 쓰기 창에 채워 드려요)">→계획</button>`:""}${h.ed?`<button type="button" class="pj-x" data-pja="deltask" title="할 일 빼기" aria-label="할 일 빼기">✕</button>`:""}</td></tr>
    ${open?`<tr class="pj-thr"><td></td><td colspan="6">${N.map(n=>`<div class="pj-note${n.is_review?" rv":""}"><b>${n.is_review?"검토 의견 · ":""}${esc(n.author_name||"")}</b> <span class="dim">${esc(fmtDT(n.created_at).slice(2))}</span>${n.author_email===st.me.email?` <button type="button" class="lnk" data-pjndel="${esc(n.id)}">지우기</button>`:""}<div>${esc(n.body)}</div></div>`).join("")||`<p class="hint" style="margin:0 0 6px">아직 남긴 글이 없어요</p>`}
      <div class="pj-nin"><input id="pjNote" maxlength="1000" placeholder="${pjReviewer(p)?"검토 의견을 남겨요 (담당자에게 🔔 알림)":"메모를 남겨요 (책임자에게 🔔 알림)"}"><button type="button" class="btn sm primary" data-pjnsend="${esc(t.id)}">남기기</button></div></td></tr>`:""}`}
function pjMineHtml(){const me=st.me.email,R=[];PJ.list.forEach(p=>pjTasks(p).forEach(t=>{if(t.owner_email!==me)return;const s=pjSt(p,t);if(s.k==="done")return;R.push({p,t,s})}));
  R.sort((a,b)=>(a.t.due||"9999").localeCompare(b.t.due||"9999"));
  const G=[["late","늦어진 일"],["soon","2주 안에 챙길 일"],["plan","그다음"],["none","목표일 없음"]];
  if(!R.length)return `<div class="pj-empty"><b>남은 내 할 일이 없어요</b>맡은 할 일이 생기면 여기에 모여요.</div>`;
  return G.map(([k,l])=>{const L=R.filter(r=>r.s.k===k);return L.length?`<h3 class="pj-gh ${k}">${l} <span>${L.length}</span></h3><div class="pj-list">${L.map(({p,t,s})=>`<div class="pj-li"><span class="pj-tag ${s.c}">${esc(s.t)}</span><button type="button" class="wtx" data-pjopen="${esc(p.id)}" data-pjtask="${esc(t.id)}"><b>${esc(t.name)}</b><span class="dim">${esc(p.data.name)} · ${esc(t._ph.name)} · 목표 ${esc(t.due||"-")}${t.deliverable?" · "+esc(t.deliverable):""}</span></button>
    <span class="pj-act"><button type="button" class="btn sm" data-pjdone2="${esc(p.id)}|${esc(t.id)}">완료</button><button type="button" class="btn sm ghost" data-pjplan2="${esc(p.id)}|${esc(t.id)}">→ 이번 주 내 계획</button></span></div>`).join("")}</div>`:""}).join("")}
function pjBlockHtml(){const out=PJ.list.map(p=>{const L=pjTasks(p).map(t=>({t,s:pjSt(p,t)})).filter(x=>x.s.k==="late");if(!L.length)return "";
  const byPh=[...new Set(L.map(x=>x.t._ph.id))].map(id=>L.filter(x=>x.t._ph.id===id));
  return `<section class="pj-ph"><div class="pj-phh"><b>${esc(p.data.name)}</b><span class="dim">책임 ${esc(pjName(p.owner_email))}</span><span class="pj-pn bad">지남 ${L.length}</span></div>
    ${byPh.map(g=>`<div class="pj-bk"><span class="pj-bkph">${esc(g[0].t._ph.name)}</span>${g.map(({t,s})=>`<button type="button" class="pj-bki" data-pjopen="${esc(p.id)}" data-pjtask="${esc(t.id)}"><span class="pj-tag bad">${esc(s.t)}</span> ${esc(t.name)} <span class="dim">· ${esc(pjName(t.owner_email)||"미정")}</span></button>`).join("")}</div>`).join("")}</section>`}).join("");
  return out||`<div class="pj-empty"><b>막히는 곳이 없어요</b>목표일이 지났는데 끝나지 않은 할 일이 생기면 사업 · 공정별로 여기에 모여요.</div>`}
/* ---------- 동작 ---------- */
async function pjSaveMark(pid,tid,on){try{await api.projMark(pid,tid,on?todayKey:null,null);const i=PJ.marks.findIndex(m=>m.project_id===pid&&m.task_id===tid),row={project_id:pid,task_id:tid,done_at:on?todayKey:null,by_email:st.me.email};if(i>=0)PJ.marks[i]=row;else PJ.marks.push(row);
  toast(on?"완료로 표시했어요":"완료를 풀었어요");pjRender()}catch(x){toast((x&&x.hint)||errText(x));pjRender()}}
// → 이번 주 내 계획: 사업 관리(/pm/)에서 rhy:se 로 넘어가며 업무 쓰기 창에 채움 (저장은 본인이)
function pjToPlan(pid,tid){const p=pjProj(pid),t=p&&pjTasks(p).find(x=>x.id===tid);if(!t)return;
  const v={customer:p.data.customer||"",project:p.data.name,part:t._ph.name,task:t.name,due:t.due||""};
  if(PM_MODE){pmGo("app",{k:"wk-pm-plan",v});return}pjFillPlan(v)}
function pjFillPlan(v){if(!canAddHere()){toast("내 팀 화면에서 넣을 수 있어요 (위쪽 팀 고르기에서 내 팀)");return}
  openDrawer(null,st.me.name);
  setTimeout(()=>{const cs=$("f-customer"),c=v.customer||"";
    if(c){if([...cs.options].some(o=>o.value===c))cs.value=c;else{cs.value="__new";cs.dispatchEvent(new Event("change",{bubbles:true}));$("f-customer-new").hidden=false;$("f-customer-new").value=c}}
    $("f-project").value=v.project;$("f-part").value=v.part;$("w-task").value=v.task;
    const fri=keyOf(addDays(parseKey(CUR),4));if(v.due){$("w-due").value=v.due<fri?(v.due<todayKey?todayKey:v.due):fri;try{d3Hint("w")}catch(_){}}
    $("f-project").dispatchEvent(new Event("change",{bubbles:true}));
    toast("📐 이번 주 할일로 채워 뒀어요. 확인하고 저장하세요 (사업 관리와는 따로 저장돼요)")},250)}
function pjExport(p){const d=p.data,k=pjKpi(p),e=s=>esc(s==null?"":String(s)),row=c=>`<tr>${c.map(x=>`<td>${x}</td>`).join("")}</tr>`;
  const N=t=>PJ.notes.filter(n=>n.project_id===p.id&&n.task_id===t.id).map(n=>`${n.is_review?"[검토] ":""}${n.author_name}: ${n.body}`).join(" / ");
  let h=`<table border="1"><tr><td colspan="9"><b>${e(d.name)}</b> ${e(d.code)} · 고객 ${e(d.customer)} · ${e(d.start)} ~ ${e(d.end)} · 책임 ${e(pjName(p.owner_email))}</td></tr>
    <tr><td colspan="9">완료 ${k.done}/${k.n} · 준수 ${k.ok} · 미준수 ${k.miss} · 7일 이상 ${k.l7} · 지남 ${k.late} · 계획 달성율 ${k.rate==null?"-":k.rate+"%"} (기준일 ${todayKey})</td></tr>
    <tr><td><b>Milestone</b></td>${(d.phases||[]).map(ph=>`<td><b>${e(ph.name)}</b><br>${e(ph.due)}<br>${e(ph.deliverable)}</td>`).join("")}</tr></table><br>
    <table border="1"><tr>${["공정","할 일","산출물","담당","계획 일정","완료일","차이(일)","상태","메모 · 검토 의견"].map(x=>`<th>${x}</th>`).join("")}</tr>`;
  (d.phases||[]).forEach(ph=>(ph.tasks||[]).forEach(t=>{const s=pjSt(p,t);h+=row([e(ph.name),e(t.name),e(t.deliverable),e(pjName(t.owner_email)),e(t.due),e(s.done||""),s.done&&t.due?String(pjDiff(s.done,t.due)):"",e(s.k==="done"?(s.ok===false?(s.late7?"미준수(7일 이상)":"미준수"):"준수"):s.t),e(N(t))])}));
  const blob=new Blob(["﻿<html><head><meta charset='utf-8'></head><body>"+h+"</table></body></html>"],{type:"application/vnd.ms-excel"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=`사업관리_${d.name}_${todayKey}.xls`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast("엑셀 파일을 받았어요")}
// 바로 고치기: 바꿀 때마다 잠깐 뒤 저장 (사업 책임자 · 팀장 · 관리자)
let pjSvT=null;
function pjSaveSoon(p,now){const sv=$("pjSv");if(sv)sv.textContent="저장 중…";clearTimeout(pjSvT);
  pjSvT=setTimeout(async()=>{try{await api.projSave({id:p.id,data:p.data,owner_email:p.owner_email},false);const s=$("pjSv");if(s){s.textContent="✓ 저장됨";setTimeout(()=>{if(s.textContent==="✓ 저장됨")s.textContent=""},1800)}}
    catch(x){const s=$("pjSv");if(s)s.textContent="";toast((x&&x.hint)||errText(x));pjLoad()}},now?0:500)}
const pjPhOf=(p,el)=>{const r=el.closest("[data-ph]");return r&&(p.data.phases||[]).find(x=>x.id===r.dataset.ph)};
function pjStickTop(){const t=document.querySelector("#projPage .pj-top");if(t)document.documentElement.style.setProperty("--pjtop",t.offsetHeight+"px")}
addEventListener("resize",()=>{if(PJ.open)pjStickTop()});
document.addEventListener("click",async e=>{
  const op=e.target.closest("[data-pjopen]");if(op&&!e.target.closest("#pjTree")){if(!e.target.closest("#projPage"))F("alertClose");const tid=op.dataset.pjtask||null;if(tid)pjSeenSet(op.dataset.pjopen+"|"+tid);
    if(!PM_MODE){pmGo("pm",{k:"wk-pm-goto",v:{pid:op.dataset.pjopen,tid}});return}pjOpen(op.dataset.pjopen,tid);return}
  const pg=e.target.closest("[data-pmgo]");if(pg){pmGo(pg.dataset.pmgo);return}
  if(e.target.closest("#pjAlert")){const b=$("alertBtn");if(b&&!b.hidden)b.click();else $("noticeBtn").click();return}
  if(!e.target.closest("#projPage"))return;
  if(e.target.closest("#pjBack")){pjClose();return}
  if(e.target.closest("#pjNew")){PJ.view="new";pjRender();setTimeout(()=>$("pjnName")&&$("pjnName").focus(),30);return}
  const v=e.target.closest("[data-pjv]");if(v){PJ.view=v.dataset.pjv;PJ.info=false;pjRender();return}
  const go=e.target.closest("[data-pjgo]");if(go){const id=go.dataset.pjgo;PJ.fold.delete(id);pjRender();const r=$("pj-"+id),sk=$("pjStick");if(r){const y=r.getBoundingClientRect().top+$("projPage").scrollTop-(sk?sk.offsetHeight:0)-(document.querySelector("#projPage .pj-top")||{offsetHeight:0}).offsetHeight-6;$("projPage").scrollTo({top:y,behavior:"smooth"})}return}
  const fo=e.target.closest("[data-pjfold]");if(fo){const id=fo.dataset.pjfold;PJ.fold.has(id)?PJ.fold.delete(id):PJ.fold.add(id);pjRender();return}
  const th=e.target.closest("[data-pjthr]");if(th){const id=th.dataset.pjthr;PJ.thr=PJ.thr===id?null:id;if(PJ.thr)pjSeenSet(PJ.pid+"|"+id);pjRender();paintNoticeDot();if(PJ.thr)setTimeout(()=>$("pjNote")&&$("pjNote").focus(),30);return}
  const ns=e.target.closest("[data-pjnsend]");if(ns){const body=$("pjNote").value.trim();if(!body){$("pjNote").focus();return}const p=pjProj(PJ.pid);ns.disabled=true;
    try{const row={id:"pn"+newId(),project_id:p.id,task_id:ns.dataset.pjnsend,author_email:st.me.email,author_name:st.me.name,is_review:!!pjReviewer(p),body};await api.projNoteAdd(row);PJ.notes.push(Object.assign({created_at:new Date().toISOString()},row));pjSeenSet(p.id+"|"+row.task_id);pjRender();toast(row.is_review?"검토 의견을 남겼어요. 담당자 🔔 알림에 보여요":"메모를 남겼어요")}
    catch(x){ns.disabled=false;toast((x&&x.hint)||errText(x))}return}
  const nd=e.target.closest("[data-pjndel]");if(nd){try{await api.projNoteDel(nd.dataset.pjndel);PJ.notes=PJ.notes.filter(n=>n.id!==nd.dataset.pjndel);pjRender()}catch(x){toast(errText(x))}return}
  const pl=e.target.closest("[data-pjplan]");if(pl){pjToPlan(PJ.pid,pl.dataset.pjplan);return}
  const pl2=e.target.closest("[data-pjplan2]");if(pl2){const [a,b]=pl2.dataset.pjplan2.split("|");pjToPlan(a,b);return}
  const d2=e.target.closest("[data-pjdone2]");if(d2){const [a,b]=d2.dataset.pjdone2.split("|");d2.disabled=true;await pjSaveMark(a,b,true);return}
  const ac=e.target.closest("[data-pja]");if(!ac)return;const k=ac.dataset.pja,p=pjProj(PJ.pid);if(!p)return;
  if(k==="xls"){pjExport(p);return}
  if(k==="info"){PJ.info=!PJ.info;pjRender();return}
  if(!pjCanEdit(p))return;const D=p.data;D.phases=D.phases||[];
  if(k==="delproj"){if(ac.dataset.arm!=="1"){ac.dataset.arm="1";ac.textContent="한 번 더 누르면 사업이 지워져요";setTimeout(()=>{ac.dataset.arm="";ac.textContent="사업 지우기"},3500);return}
    try{await api.projDel(p.id);PJ.list=PJ.list.filter(x=>x!==p);PJ.info=false;PJ.view="list";pjRender();toast("사업을 지웠어요")}catch(x){toast((x&&x.hint)||errText(x))}return}
  if(k==="addph"){const ph={id:pjId(),name:"",deliverable:"",due:D.end||"",tasks:[]};D.phases.push(ph);pjSaveSoon(p);pjRender();const i=document.querySelector(`tr[data-k="ph"][data-ph="${CSS.escape(ph.id)}"] [data-pjf="phname"]`);if(i){i.focus();i.scrollIntoView({block:"center"})}return}
  const ph=pjPhOf(p,ac);if(!ph)return;
  if(k==="addtask"){const t={id:pjId(),name:"",owner_email:st.me.email,deliverable:"",due:ph.due||""};(ph.tasks=ph.tasks||[]).push(t);pjSaveSoon(p);pjRender();const i=document.querySelector(`tr[data-t="${CSS.escape(t.id)}"] [data-pjf="tname"]`);if(i)i.focus();return}
  if(k==="deltask"||k==="delph"){if(ac.dataset.arm!=="1"){ac.dataset.arm="1";ac.textContent=k==="delph"?"한 번 더 (할 일까지 빠져요)":"한 번 더";ac.classList.add("arm");setTimeout(()=>{ac.dataset.arm="";ac.textContent="✕";ac.classList.remove("arm")},3000);return}
    if(k==="delph")D.phases=D.phases.filter(x=>x!==ph);else{const tr=ac.closest("[data-t]");ph.tasks=ph.tasks.filter(t=>t.id!==tr.dataset.t)}pjSaveSoon(p,true);pjRender();return}});
document.addEventListener("change",e=>{if(!e.target.closest||!e.target.closest("#projPage"))return;
  const dn=e.target.closest("[data-pjdone]");if(dn){pjSaveMark(PJ.pid,dn.dataset.pjdone,dn.checked);return}
  const p=pjProj(PJ.pid);if(!p||!pjCanEdit(p))return;const D=p.data,x=e.target;
  if(x.dataset.pji){if(x.dataset.pji==="owner")p.owner_email=x.value;else D[x.dataset.pji]=x.value.trim();if(x.dataset.pji==="name"&&!D.name){toast("사업명을 넣어 주세요");return}pjSaveSoon(p);return}
  const f=x.dataset.pjf;if(!f)return;const ph=pjPhOf(p,x);if(!ph)return;let re=false;
  if(f==="phname")ph.name=x.value.trim();else if(f==="phdue"){ph.due=x.value;re=true}else if(f==="phdel")ph.deliverable=x.value.trim();
  else{const tr=x.closest("[data-t]"),t=tr&&(ph.tasks||[]).find(y=>y.id===tr.dataset.t);if(!t)return;
    if(f==="tname")t.name=x.value.trim();else if(f==="tdel")t.deliverable=x.value.trim();else if(f==="tdue"){t.due=x.value;re=true}else if(f==="owner"){t.owner_email=x.value;t.owner_name=pjName(x.value);re=true}}
  pjSaveSoon(p);if(re)pjRender()});
// Enter 로 다음 칸 · 할 일 이름에서 Enter 면 아래에 새 할 일
document.addEventListener("keydown",e=>{const x=e.target;if(!x.closest||!x.closest("#pjTree")||e.key!=="Enter"||e.isComposing||!x.matches("input.pj-in"))return;e.preventDefault();x.blur();
  if(x.dataset.pjf==="tname"||x.dataset.pjf==="phname"){const r=x.closest("tr"),b=r&&document.querySelector(`tr.pj-addr[data-ph="${CSS.escape(r.dataset.ph)}"] [data-pja="addtask"]`);if(b&&x.value.trim())setTimeout(()=>b.click(),30)}});
// ⋮⋮ 끌어서 순서 바꾸기 (마우스 · 손가락). 할 일은 다른 대공정으로도 옮김
const PJDG={on:false};
document.addEventListener("pointerdown",e=>{const g=e.target.closest&&e.target.closest("#pjTree [data-grip]");if(!g)return;const p=pjProj(PJ.pid);if(!p||!pjCanEdit(p))return;e.preventDefault();
  const row=g.closest("tr"),kind=g.dataset.grip;Object.assign(PJDG,{on:true,p,kind,id:kind==="ph"?row.dataset.ph:row.dataset.t,row,target:null,after:false,y0:e.clientY,moved:false});
  row.classList.add("pj-drag");document.documentElement.classList.add("pj-dragging");try{g.setPointerCapture(e.pointerId)}catch(_){}});
document.addEventListener("pointermove",e=>{if(!PJDG.on)return;if(Math.abs(e.clientY-PJDG.y0)>3)PJDG.moved=true;
  document.querySelectorAll("#pjTree .pj-dropb,#pjTree .pj-dropa").forEach(r=>r.classList.remove("pj-dropb","pj-dropa"));
  const el=document.elementFromPoint(e.clientX,e.clientY),r=el&&el.closest&&el.closest("#pjTree tbody tr[data-k],#pjTree tbody tr.pj-addr");PJDG.target=null;
  const pg=$("projPage"),R=pg.getBoundingClientRect();if(e.clientY<R.top+140)pg.scrollTop-=12;else if(e.clientY>R.bottom-50)pg.scrollTop+=12;
  if(!r||r===PJDG.row)return;let tgt=r;
  if(PJDG.kind==="ph"){const phId=r.dataset.ph;if(phId===PJDG.id)return;tgt=document.querySelector(`#pjTree tr[data-k="ph"][data-ph="${CSS.escape(phId)}"]`)}
  const b=r.getBoundingClientRect(),after=r.classList.contains("pj-addr")||(PJDG.kind==="t"&&r.dataset.k==="ph")?(r.dataset.k==="ph"):e.clientY>b.top+b.height/2;
  PJDG.target=tgt;PJDG.after=PJDG.kind==="ph"?(()=>{const L=PJDG.p.data.phases,si=L.findIndex(x=>x.id===PJDG.id),ti=L.findIndex(x=>x.id===tgt.dataset.ph);return ti>si})():after;PJDG.tRow=r;
  (PJDG.kind==="t"&&r.classList.contains("pj-addr")?r:tgt).classList.add(PJDG.after&&!r.classList.contains("pj-addr")?"pj-dropa":"pj-dropb")});
function pjDragEnd(){if(!PJDG.on)return;PJDG.on=false;document.documentElement.classList.remove("pj-dragging");if(PJDG.row)PJDG.row.classList.remove("pj-drag");
  document.querySelectorAll("#pjTree .pj-dropb,#pjTree .pj-dropa").forEach(r=>r.classList.remove("pj-dropb","pj-dropa"));
  const {p,kind,id,target,after,tRow,moved}=PJDG;if(!moved||!target)return;const L=p.data.phases;
  if(kind==="ph"){const si=L.findIndex(x=>x.id===id),it=L[si];L.splice(si,1);const ti=L.findIndex(x=>x.id===target.dataset.ph);L.splice(after?ti+1:ti,0,it)}
  else{const from=L.find(ph=>(ph.tasks||[]).some(t=>t.id===id)),t=from.tasks.find(x=>x.id===id);from.tasks=from.tasks.filter(x=>x!==t);
    const to=L.find(ph=>ph.id===tRow.dataset.ph);to.tasks=to.tasks||[];
    if(tRow.dataset.k==="ph")to.tasks.unshift(t);else if(tRow.classList.contains("pj-addr"))to.tasks.push(t);else{const ti=to.tasks.findIndex(x=>x.id===tRow.dataset.t);to.tasks.splice(after?ti+1:ti,0,t)}}
  pjSaveSoon(p,true);pjRender();toast("순서를 바꿨어요")}
document.addEventListener("pointerup",pjDragEnd);document.addEventListener("pointercancel",pjDragEnd);
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="pjNote"&&!e.isComposing){e.preventDefault();const b=document.querySelector("[data-pjnsend]");if(b)b.click()}
  if(e.key==="Escape"&&PJ.open&&!document.querySelector(".drawer:not([hidden]),.modal:not([hidden])")){pjClose()}});
document.addEventListener("submit",async e=>{if(e.target.id!=="pjNewForm")return;e.preventDefault();
  const name=$("pjnName").value.trim(),start=$("pjnStart").value,end=$("pjnEnd").value,owner=$("pjnOwner").value||st.me.email,err=m=>{$("pjnErr").textContent=m;$("pjnErr").hidden=false};
  if(!name){err("사업명을 넣어 주세요.");$("pjnName").focus();return}if(!start||!end||end<start){err("시작일과 완료 예정일을 확인해 주세요.");return}
  const row={id:pjId(),team_id:PJ.team,owner_email:owner,created_by:st.me.email,data:{name,code:$("pjnCode").value.trim(),customer:$("pjnCust").value.trim(),start,end,phases:pjFromTpl(start,end,owner)}};
  try{await api.projSave(row,true);PJ.list.push(Object.assign({created_at:new Date().toISOString()},row));PJ.view="proj";PJ.pid=row.id;pjRender();toast(`📐 ${name} 사업을 만들었어요. 기본 공정 ${PJ_TPL.length}개가 들어갔어요`)}
  catch(x){err((x&&x.hint)||errText(x))}});
/* ---------- 🧩 기능 더하기 → 우리 팀 설정 (팀장) ---------- */
function projModCard(){if(!pmLicensed()||!st.me||st.me.role!=="leader"||st.me.is_admin||!st.me.team_id)return "";const on=pjTeamOn(st.me.team_id);
  return `<div class="modc team${on?" on":""}"><div class="modi">📐</div><div class="modb"><b>사업 관리</b><p>사업을 만들면 표준 공정(Kick-off → PDR → CDR → … → 납품)이 자동으로 들어가고, 정해 둔 일 · 산출물을 놓치지 않게 챙겨요. 주간 업무와는 따로 열려요.</p><span class="hint" style="margin:0">켜면 우리 팀 모두에게 📐 사업 관리가 보이고, 📣 팀 공지로 알려져요</span></div>
    <label class="modt"><span class="switch"><input type="checkbox" data-pjteam="1"${on?" checked":""}><i></i></span><span>${on?"켜짐":"꺼짐"}</span></label></div>`}
document.addEventListener("change",async e=>{const x=e.target;if(!x.matches||!x.matches("[data-pjteam]"))return;const on=x.checked;x.disabled=true;
  try{await api.setTeamDev(on);try{st.teams=await api.teams()}catch(_){}PJ.loaded=false;pjPaint();toast(on?"📐 사업 관리를 켰어요. 팀 공지로 알렸어요":"📐 사업 관리를 껐어요. 팀 공지로 알렸어요");F("openMods");loadNotice()}
  catch(err){x.checked=!on;toast((err&&err.hint)||errText(err))}finally{x.disabled=false}});
// 처음에 한 번, 이후 3분마다 (검토 의견 알림)
setTimeout(()=>{if(pjTeam())pjLoad()},5000);setInterval(()=>{if(st.me&&pjTeam()&&document.visibilityState==="visible"&&!document.querySelector("#projPage input:focus,#projPage select:focus")&&!PJDG.on)pjLoad()},180000);
if(PM_MODE){document.documentElement.classList.add("pm-mode");document.title="사업 관리 · rhy:se"}
// rhy:se 로 넘어온 '→ 이번 주 내 계획'은 화면이 다 열린 뒤에 꼭 한 번 확인 (첫 그리기가 불러오기보다 먼저 끝나는 경우)
if(!PM_MODE){let n=0;const t=setInterval(()=>{n++;let has=false;try{has=!!sessionStorage.getItem("wk-pm-plan")}catch(_){}if(!has||n>60){clearInterval(t);return}if(st.me&&st.loaded){clearInterval(t);pjPaint()}},500)}
wkFeat("proj",{projPaint:pjPaint,projModCard,projAlertCount,projAlertsHtml,pjOpen,pjClose});
