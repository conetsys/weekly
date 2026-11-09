/* rhy:se Weekly Plan — 📐 사업 관리 (feat-proj.js, v3.22.0)
   개발사업의 일정을 함께 관리하는 별도 모듈 (연구소 요청). rhy:se 는 개인별 업무 정리, 이건 그중 개발사업의 일정
   · 정보 흐름은 한 방향: 사업 관리 → rhy:se (개인이 필요한 일정만 골라 '이번 주 계획'으로 옮김). rhy:se → 사업 관리 없음
   · 사업 만들기: 팀장(그 팀) · 관리자. 대공정 · 하부 공정 · 일정 · 담당 · 산출물 · 완료 · 주차별 계획/실적: 그 팀 사람 누구나
   · 사업 정보 고치기 · 지우기: 책임자 · 팀장 · 관리자 / 검토 의견: 팀장 · 책임자 (메모는 누구나)
   · 화면: 공정 · 일정(트리) / 주차별 계획 · 실적(하부 공정 × 주, 할 것 · 한 것 · 특이사항) / 간트 / 🕘 바뀐 기록
   · 공정은 한 줄씩 저장(바꾼 칸만) → 여러 명이 동시에 고쳐도 덮어쓰지 않음. 바뀐 기록은 서버가 남김
   서버: 17-projects.sql + 18-projects-v2.sql. 이 파일이 고장 나도 주간 업무는 그대로 */
/* /pm/ 분리 (v3.21.0): 같은 사이트의 다른 주소(weekly/pm/)에서 열림 (로그인 그대로, 같은 창 전환)
   사용권 두 겹: ① 회사(wk_company.modules.pm · 관리자) ② 팀(features.dev · 팀장). 미리보기에서는 주소 대신 #pm 으로 흉내 */
const PM_MODE=/\/pm\/?(index\.html)?$/.test(location.pathname)||location.hash==="#pm";
const PM_REAL=typeof CONFIGURED!=="undefined"&&CONFIGURED&&/^https?:/.test(location.protocol);
const pmLicensed=()=>!!(typeof CO!=="undefined"&&CO&&CO.modules&&CO.modules.pm);
// 다른 화면으로: target "pm" | "app". 넘길 것은 sessionStorage 로 (같은 창)
function pmGo(target,carry){try{if(carry)sessionStorage.setItem(carry.k,JSON.stringify(carry.v))}catch(_){}
  if(PM_REAL){const base=location.pathname.replace(/pm\/?(index\.html)?$/,"").replace(/index\.html$/,"");location.href=base+(target==="pm"?"pm/":"");return}
  location.hash=target==="pm"?"#pm":"";location.reload()}
const pmTake=k=>{try{const v=sessionStorage.getItem(k);if(v){sessionStorage.removeItem(k);return JSON.parse(v)}}catch(_){}return null};
const PJDG={on:false};   // ⋮⋮ 끌기 상태 (아래 '끌어서 순서 바꾸기')
const PJ={open:false,view:"list",pid:null,list:[],items:[],weeks:[],notes:[],log:[],dir:[],loaded:false,err:"",info:false,fold:new Set(),thr:null,team:null,
  sub:"tree",wk0:0,wfil:"all",wcell:null,pick:null,pend:{},notices:[],requests:[],lsort:{k:"start",d:-1},lfil:"active",lq:"",bfil:"all",nmode:null,send:null,logf:{who:"",k:""},ntcQ:null,ntcShown:false};
// 기본 공정 (연구소 엑셀 기준): [대공정, 산출물, 하부 공정들]
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
const pjMon=()=>keyOf(mondayOf(new Date()));
const pjTeamOn=id=>{const t=st.teams.find(x=>x.id===id);return !!(t&&t.features&&t.features.dev)};
// 모듈을 쓸 팀: 지금 보는 팀이 켜져 있으면 그 팀, 아니면 내 팀(겸직 포함) 중 켜진 팀
// 관리자: 소속 팀이 없어도 📐 이 보이고, 화면 위에서 팀을 골라 봄 (안 켠 팀이면 그 자리에서 켜기)
const PJAK=()=>"wk-pm-admin-team-"+(st.me?st.me.email:"");
function pjTeam(){if(!st.me||!pmLicensed())return null;
  if(st.me.is_admin){let a="";try{a=localStorage.getItem(PJAK())||""}catch(_){}const T=st.teams||[];
    if(a&&T.some(t=>t.id===a))return a;if(st.team&&pjTeamOn(st.team))return st.team;const on=T.find(t=>pjTeamOn(t.id));return on?on.id:(T[0]||{}).id||null}
  if(st.team&&pjTeamOn(st.team)&&canViewTeam(st.team))return st.team;return myTeams().find(pjTeamOn)||null}
const pjProj=id=>PJ.list.find(p=>p.id===id);
const pjTasks=p=>((p&&p.data.phases)||[]).flatMap(ph=>(ph.tasks||[]).map(t=>Object.assign({},t,{_ph:ph})));
const pjItem=id=>PJ.items.find(i=>i.id===id);
const pjMark=(pid,tid)=>pjItem(tid);   // 완료일은 공정 줄에 (done_at)
// 권한: 그 팀 사람(겸직 포함)은 공정을 고침 · 정보/지우기는 책임자 · 팀장 · 관리자 · 사업 만들기는 팀장
const pjMember=p=>!!(st.me&&p&&(st.me.is_admin||isMyTeam(p.team_id)));
const pjCanEdit=pjMember,pjCanMark=p=>pjMember(p);
const pjCanInfo=p=>!!(st.me&&p&&(st.me.is_admin||p.owner_email===st.me.email||(st.me.role==="leader"&&p.team_id===st.me.team_id)));
const pjCanNew=()=>!!(st.me&&PJ.team&&(st.me.is_admin||(st.me.role==="leader"&&st.me.team_id===PJ.team)));
const pjReviewer=p=>pjCanInfo(p)||(st.me&&st.me.role==="leader")||isBoss();
const pjName=e=>{const x=PJ.dir.find(d=>d.email===e);return x?x.name:""};
// 서버의 한 줄씩(PJ.items)을 화면용 대공정 ▸ 하부 공정으로
const pjBy=(a,b)=>(a.sort||0)-(b.sort||0)||String(a.created_at||"").localeCompare(String(b.created_at||""));
function pjBuild(){PJ.list.forEach(p=>{const its=PJ.items.filter(i=>i.project_id===p.id);
  p.data.phases=its.filter(i=>!i.parent_id).sort(pjBy).map(ph=>({id:ph.id,name:ph.name||"",deliverable:ph.deliverable||"",start:ph.start_date||"",due:ph.end_date||"",owner_email:ph.owner_email||"",
    tasks:its.filter(t=>t.parent_id===ph.id).sort(pjBy).map(t=>({id:t.id,name:t.name||"",owner_email:t.owner_email||"",deliverable:t.deliverable||"",start:t.start_date||"",due:t.end_date||"",done_at:t.done_at||null}))}))})}
// 하부 공정 상태: 완료(준수 · 미준수 · 7일 이상) / 지남 / 곧(2주) / 예정
function pjSt(p,t){const m=pjMark(p.id,t.id),done=m&&m.done_at;
  if(done){if(!t.due)return {k:"done",t:"완료",c:"ok",done};const g=pjDiff(t.due,done);return g<=0?{k:"done",t:g<0?`완료 · ${-g}일 먼저`:"완료 · 제때",c:"ok",ok:true,done}:{k:"done",t:`완료 · ${g}일 늦음`,c:g>=7?"bad":"warn",ok:false,late7:g>=7,done}}
  if(!t.due)return {k:"none",t:"완료일 없음",c:"dim"};
  const r=pjDiff(todayKey,t.due);if(r<0)return {k:"late",t:`${-r}일 지남`,c:"bad",d:r};if(r<=14)return {k:"soon",t:r?`D-${r}`:"오늘",c:"warn",d:r};return {k:"plan",t:`D-${r}`,c:"dim",d:r}}
function pjKpi(p){const T=pjTasks(p),S=T.map(t=>pjSt(p,t)),done=S.filter(s=>s.k==="done"),ok=done.filter(s=>s.ok).length;
  return {n:T.length,done:done.length,ok,miss:done.filter(s=>s.ok===false).length,l7:done.filter(s=>s.late7).length,late:S.filter(s=>s.k==="late").length,rate:done.length?Math.round(ok/done.length*100):null}}
async function pjLoad(){const t=pjTeam();PJ.team=t;if(!t){PJ.list=[];PJ.loaded=true;return}
  if(Object.keys(PJ.pend).length||PJDG.on){setTimeout(()=>{if(PJ.open)pjLoad()},1500);return}   // 저장 기다리는 칸 · 끄는 중이면 잠깐 뒤에
  try{const [r,d]=await Promise.all([api.projList(t),PJ.dir.length?Promise.resolve(PJ.dir):api.directory()]);
    PJ.list=r.projects||[];PJ.items=r.items||[];PJ.weeks=r.weeks||[];PJ.notes=r.notes||[];PJ.log=r.log||[];PJ.notices=r.notices||[];PJ.requests=r.requests||[];PJ.dir=d||[];PJ.err="";pjBuild();PJ.loaded=true;pjNtcAuto()}
  catch(x){PJ.loaded=true;PJ.err=(x&&x.hint)||errText(x)}
  paintNoticeDot();if(PJ.open&&!document.querySelector("#projPage input:focus,#projPage textarea:focus,#projPage select:focus"))pjRender()}
// 담당자로 넣을 수 있는 사람: 📐 켠 팀 사람만
const pjPeople=()=>PJ.dir.filter(d=>pjTeamOn(d.team_id));
/* ---------- 🔔 알림: 내 하부 공정 · 내 사업에 달린 새 검토 의견 · 메모 + 누가 나를 담당으로 정함 ---------- */
const PJK=()=>"wk-pj-seen-"+(st.me?st.me.email:"");
const pjSeen=()=>{try{return JSON.parse(localStorage.getItem(PJK())||"{}")}catch(_){return {}}};
const pjSeenSet=k=>{const m=pjSeen();m[k]=new Date().toISOString();try{localStorage.setItem(PJK(),JSON.stringify(m))}catch(_){}};
const pjIsLead=()=>!!(st.me&&PJ.team&&(st.me.is_admin||(st.me.role==="leader"&&st.me.team_id===PJ.team)));
function pjNews(){if(!st.me)return [];const S=pjSeen(),me=st.me.email;
  if(!S.own0){pjSeenSet("own0");S.own0=new Date().toISOString()}   // 처음 쓰는 날 이전의 담당 지정은 알리지 않음
  const N=PJ.notes.filter(n=>{if(n.author_email===me)return false;const p=pjProj(n.project_id);if(!p)return false;
    const t=pjTasks(p).find(x=>x.id===n.task_id),mine=(t&&t.owner_email===me)||p.owner_email===me;
    return mine&&n.created_at>(S[n.project_id+"|"+(n.task_id||"")]||"")}).map(n=>({k:"note",n}));
  const O=PJ.log.filter(l=>l.action==="owner"&&l.new_owner===me&&l.by_email!==me&&pjProj(l.project_id)&&l.at>(S["own|"+l.project_id+"|"+l.item_id]||S.own0)).map(l=>({k:"own",l}));
  const Q=pjIsLead()?PJ.requests.filter(r=>r.status==="pending"&&r.requester_email!==me).map(r=>({k:"req",r})):[];
  const D=PJ.requests.filter(r=>r.requester_email===me&&r.status!=="pending"&&(r.decided_at||"")>(S["req|"+r.id]||S.own0)).map(r=>({k:"reqd",r}));
  return N.concat(O,Q,D)}
function projAlertCount(){return pjNews().length}
function projAlertsHtml(){const row=(attrs,b,sub,btn)=>`<div class="walr k-share"><span class="wlv">📐</span><button type="button" class="wtx" ${attrs}>${b}<span class="wsub">${sub}</span></button><span class="wact"><button type="button" class="btn sm" ${attrs}>${btn||"보기"}</button></span></div>`;
  return pjNews().map(x=>{
  if(x.k==="req"){const r=x.r,d=r.data||{};return row(`data-pjlistgo="1"`,`<b>사업 추가 요청 · ${esc(r.requester_name||"")}</b> · ${esc(d.name||"")}`,`${esc(d.customer||"")}${d.customer?" · ":""}${pjMD(d.start)}~${pjMD(d.end)} · 수락하면 바로 만들어져요`,"검토")}
  if(x.k==="reqd"){const r=x.r,d=r.data||{},ok=r.status==="accepted";return row(ok?`data-pjopen="${esc(r.project_id||"")}" data-pjreq="${esc(r.id)}"`:`data-pjlistgo="1" data-pjreq="${esc(r.id)}"`,`<b>사업 추가 요청 ${ok?"수락":"반려"}</b> · ${esc(d.name||"")}`,ok?`${esc(r.decided_name||"팀장")}님이 수락해서 사업이 만들어졌어요`:`사유: ${esc(r.reason||"-")}`)}
  if(x.k==="own"){const l=x.l,p=pjProj(l.project_id);return row(`data-pjopen="${esc(l.project_id)}" data-pjtask="${esc(l.item_id||"")}" data-pjown="1"`,`<b>담당 · ${esc(l.by_name||"")}</b> · '${esc(l.item_name||"")}' 담당을 나로 정했어요`,esc(p.data.name))}
  const n=x.n,p=pjProj(n.project_id),t=pjTasks(p).find(y=>y.id===n.task_id);
  return row(`data-pjopen="${esc(n.project_id)}" data-pjtask="${esc(n.task_id||"")}"`,`<b>${n.is_review?"검토 의견":"메모"} · ${esc(n.author_name||"")}</b> · ${esc(n.body.slice(0,60))}`,`${esc(p.data.name)}${t?" · "+esc(t.name):""}`)}).join("")}
/* ---------- 화면 ---------- */
function pjEnsure(){if($("projPage"))return;const s=document.createElement("section");s.id="projPage";s.hidden=true;s.setAttribute("aria-label","사업 관리");
  s.innerHTML=`<div class="pj-top"><div class="wrap pj-bar"><div class="pm-sw" role="tablist" aria-label="화면 바꾸기"><button type="button" class="pm-swb" id="pjBack" role="tab" aria-selected="false">rhy:se 주간 업무</button><button type="button" class="pm-swb" role="tab" aria-selected="true">📐 사업 관리</button></div><h2><small id="pjTeamNm"></small></h2>
    <div class="tabs" id="pjTabs" role="tablist"></div><span class="spacer"></span><button class="btn primary" id="pjNew" type="button">+ 새 사업</button><button class="btn nbtn" id="pjNtc" type="button" aria-label="사업 공지" title="사업 공지">📣<b class="aln" id="pjNtcN" hidden></b></button><button class="btn nbtn" id="pjAlert" type="button" aria-label="알림">🔔<b class="aln" id="pjAlertN" hidden></b></button><span class="pm-me dim" id="pjMe"></span></div></div><div class="wrap pj-body" id="pjBody"></div><div class="pj-pickbar" id="pjPickBar" hidden></div><div class="pj-modal" id="pjModal" hidden><div class="pj-mbox" role="dialog" aria-modal="true" id="pjMbox"></div></div>`;
  document.body.appendChild(s)}
function pjPaint(){const on=!!pjTeam();
  let b=$("projBtn");if(!b&&on){const rb=$("reportBtn");if(rb){b=document.createElement("button");b.className="btn";b.id="projBtn";b.type="button";b.title="개발사업 일정 (주간 업무와 따로)";b.textContent="📐 사업 관리";rb.insertAdjacentElement("afterend",b);b.onclick=()=>pmGo("pm")}}
  if(b)b.hidden=!on;
  let m=$("miProj");if(!m&&on){const mm=$("miMods");if(mm){m=document.createElement("button");m.type="button";m.setAttribute("role","menuitem");m.id="miProj";m.textContent="📐 사업 관리";mm.insertAdjacentElement("beforebegin",m);m.onclick=()=>{$("userMenu").hidden=true;pmGo("pm")}}}
  if(m)m.hidden=!on;
  if(on&&!PJ.loaded&&!PJ.busy){PJ.busy=true;pjLoad().finally(()=>{PJ.busy=false})}
  if(PM_MODE&&st.me&&st.loaded&&!PJ.open){const g=pmTake("wk-pm-goto")||{};if(g.view)PJ.view=g.view;pjOpen(g.pid,g.tid)}
  if(!PM_MODE&&st.me&&st.loaded&&!PJ.planWait){const pl=pmTake("wk-pm-plan");if(pl){PJ.planWait=setInterval(()=>{   // 팝업 공지 · 다른 창이 닫힌 뒤에 채움
    if(!$("drawer").hidden||!$("noticeModal").hidden||!$("mscrim").hidden||!canAddHere())return;clearInterval(PJ.planWait);PJ.planWait=null;pjFillPlan(pl)},400)}}
  return true}
function pjOpen(pid,tid){pjEnsure();PJ.open=true;PJ.info=false;PJ.thr=tid||null;if(pid){PJ.view="proj";PJ.pid=pid;if(tid)PJ.sub="tree"}else if(PJ.view==="proj"&&!pjProj(PJ.pid))PJ.view="list";
  $("projPage").hidden=false;document.documentElement.classList.add("pj-on");pjRender();pjStickTop();pjLoad().then(()=>{if(tid){const r=document.querySelector(`[data-pjrow="${CSS.escape(tid)}"]`);if(r)r.scrollIntoView({block:"center"})}})}
function pjClose(){if(!PJ.open)return;if(PM_MODE){pmGo("app");return}PJ.open=false;$("projPage").hidden=true;document.documentElement.classList.remove("pj-on");paintNoticeDot()}
const pjBoss=()=>!!st.me&&(st.me.is_admin||isBoss()||(st.me.role==="leader")||PJ.list.some(p=>p.owner_email===st.me.email));
function pjRender(){if(!PJ.open)return;const B=$("pjBody");
  $("pjMe").textContent=st.me?st.me.name:"";if(PM_MODE)document.title="사업 관리"+(PJ.team?" - "+teamName(PJ.team):"")+" · rhy:se";const an=F("alertCount")||0,ab=$("pjAlertN");if(ab){ab.hidden=!an;ab.textContent=an>99?"99+":an}
  const tn=$("pjTeamNm");if(st.me.is_admin&&PJ.team){if(!tn.querySelector("select"))tn.innerHTML=`<select id="pjAdmTeam" class="pj-admt" aria-label="팀 고르기 (관리자)"></select>`;
    $("pjAdmTeam").innerHTML=(st.teams||[]).map(t=>`<option value="${esc(t.id)}"${t.id===PJ.team?" selected":""}>${esc(t.name)}${pjTeamOn(t.id)?"":" (꺼짐)"}</option>`).join("")}
  else tn.textContent=PJ.team?" "+teamName(PJ.team):"";
  const tabs=[["list","사업 목록"],["mine","내 공정"],...(pjBoss()?[["block","살펴볼 곳"]]:[])];
  if(PJ.view==="proj")tabs.push(["proj",(pjProj(PJ.pid)||{data:{name:"사업"}}).data.name]);
  $("pjTabs").innerHTML=tabs.map(([k,l])=>`<button class="tab" role="tab" type="button" data-pjv="${k}" aria-selected="${PJ.view===k}">${esc(l)}</button>`).join("");
  const nb=$("pjNew");nb.textContent=pjCanNew()?"+ 새 사업":"+ 사업 추가 요청";nb.hidden=!PJ.team||!isMyTeam(PJ.team)&&!pjCanNew()||PJ.view==="proj"||PJ.view==="new";
  const un=pjNtcUnseen().length,nn=$("pjNtcN");nn.hidden=!un;nn.textContent=un;$("pjNtc").hidden=!PJ.team;
  pjPickBar();
  if(!pmLicensed()){B.innerHTML=`<div class="pj-empty"><b>우리 회사는 📐 사업 관리를 쓰지 않아요</b>관리자가 ⚙ 관리 → 회사 설정 → 옵션 기능에서 켤 수 있어요.<br><br><button type="button" class="btn" data-pmgo="app">← rhy:se 주간 업무로</button></div>`;return}
  if(PJ.team&&st.me.is_admin&&!pjTeamOn(PJ.team)){B.innerHTML=`<div class="pj-empty"><b>${esc(teamName(PJ.team))}은(는) 아직 📐 사업 관리를 켜지 않았어요</b>관리자는 여기서 팀별로 켤 수 있어요. 켜면 그 팀 모두에게 📐 이 보이고, 팀 공지로 알려져요.<br>(팀장도 rhy:se 🧩 기능 더하기 → 우리 팀 설정에서 켤 수 있어요)<br><br><button type="button" class="btn primary" data-pjadmon="${esc(PJ.team)}">${esc(teamName(PJ.team))}에서 켜기</button></div>`;return}
  if(!PJ.team){B.innerHTML=`<div class="pj-empty"><b>우리 팀에서 📐 사업 관리를 켜지 않았어요</b>팀장이 rhy:se의 🧩 기능 더하기 → 우리 팀 설정에서 켤 수 있어요.<br><br><button type="button" class="btn" data-pmgo="app">← rhy:se 주간 업무로</button></div>`;return}
  if(!PJ.loaded){B.innerHTML=`<div class="pj-empty">불러오는 중…</div>`;return}
  if(PJ.err&&!PJ.list.length){B.innerHTML=`<div class="pj-empty"><b>사업 관리를 불러오지 못했어요</b>${esc(PJ.err)}</div>`;return}
  requestAnimationFrame(pjStickTop);PJ.hl=null;
  B.innerHTML=PJ.view==="mine"?pjMineHtml():PJ.view==="block"?pjBlockHtml():PJ.view==="new"?pjNewHtml():PJ.view==="proj"&&pjProj(PJ.pid)?pjProjHtml(pjProj(PJ.pid)):pjListHtml()}
function pjListHtml(){const me=st.me.email,lead=pjIsLead();
  const reqs=lead?PJ.requests.filter(r=>r.status==="pending"):[],mine=PJ.requests.filter(r=>r.requester_email===me&&(r.status==="pending"||(r.decided_at||"")>new Date(Date.now()-30*864e5).toISOString()));
  const rq=reqs.length?`<section class="pj-req"><h3>✋ 사업 추가 요청 <span>${reqs.length}</span></h3>${reqs.map(r=>{const d=r.data||{},rj=PJ.rej===r.id;return `<div class="pj-rqr"><div class="pj-rqi"><b>${esc(d.name||"")}</b>${d.code?` <span class="dim mono">${esc(d.code)}</span>`:""}<span class="dim">${esc(d.customer||"")}${d.customer?" · ":""}${esc(d.start||"")} ~ ${esc(d.end||"")} · 책임 ${esc(pjName(d.owner_email)||r.requester_name||"")} · 요청 ${esc(r.requester_name||"")} ${esc(fmtDT(r.created_at).slice(5,10))}</span>${d.memo?`<span class="pj-rqm">${esc(d.memo)}</span>`:""}</div>
    ${rj?`<div class="pj-rqa"><input id="pjRejWhy" maxlength="500" placeholder="반려 사유 (요청한 사람에게 보여요)"><button type="button" class="btn sm danger" data-pjrejok="${esc(r.id)}">반려</button><button type="button" class="btn sm" data-pjrejno="1">취소</button></div>`:`<div class="pj-rqa"><button type="button" class="btn sm" data-pjrej="${esc(r.id)}">반려</button><button type="button" class="btn sm" data-pjacce="${esc(r.id)}">고쳐서 수락</button><button type="button" class="btn sm primary" data-pjacc="${esc(r.id)}">수락</button></div>`}</div>`}).join("")}</section>`:"";
  const my=!lead&&mine.length?`<section class="pj-req mine"><h3>내 사업 추가 요청</h3>${mine.map(r=>{const d=r.data||{};return `<div class="pj-rqr"><div class="pj-rqi"><b>${esc(d.name||"")}</b><span class="dim">${esc(d.start||"")} ~ ${esc(d.end||"")} · ${esc(fmtDT(r.created_at).slice(5,10))} 요청</span>${r.status==="rejected"?`<span class="pj-rqm">반려 사유: ${esc(r.reason||"-")}</span>`:""}</div><div class="pj-rqa">${r.status==="pending"?`<span class="pj-tag warn">팀장 확인 중</span><button type="button" class="btn sm ghost" data-pjrqdel="${esc(r.id)}">요청 취소</button>`:r.status==="accepted"?`<span class="pj-tag ok">수락됨</span>${r.project_id&&pjProj(r.project_id)?`<button type="button" class="btn sm" data-pjopen="${esc(r.project_id)}">열기</button>`:""}`:`<span class="pj-tag bad">반려</span>`}</div></div>`}).join("")}</section>`:"";
  if(!PJ.list.length)return (st.me.is_admin?`<div class="pj-admbar"><span>🛠 관리자 · ${esc(teamName(PJ.team))} 사업 관리 켜짐</span><span class="spacer"></span><button type="button" class="btn sm ghost" data-pjadmoff="${esc(PJ.team)}">이 팀에서 끄기</button></div>`:"")+rq+my+`<div class="pj-empty"><b>아직 사업이 없어요</b>${pjCanNew()?"위쪽 <b>+ 새 사업</b>을 누르면 기본 공정(Kick-off → … → 납품)이 자동으로 들어가요.":"위쪽 <b>+ 사업 추가 요청</b>으로 팀장에게 요청해요. 수락되면 바로 만들어지고, 누구나 공정과 일정을 적을 수 있어요."}</div>`;
  const R=PJ.list.map(p=>{const k=pjKpi(p),d=p.data,nx=(d.phases||[]).find(ph=>(ph.tasks||[]).some(t=>!t.done_at));return {p,k,d,done:k.n>0&&k.done===k.n,nx:nx?nx.name:"",prog:k.n?k.done/k.n:0,own:pjName(p.owner_email)}});
  const q=PJ.lq.trim().toLowerCase(),F0=R.filter(x=>(PJ.lfil==="all"||(PJ.lfil==="done"?x.done:!x.done))&&(!q||[x.d.name,x.d.code,x.d.customer,x.own].some(v=>String(v||"").toLowerCase().includes(q))));
  const key={name:x=>x.d.name||"",code:x=>x.d.code||"",customer:x=>x.d.customer||"",owner:x=>x.own,start:x=>x.d.start||"",end:x=>x.d.end||"",prog:x=>x.prog,late:x=>x.k.late,rate:x=>x.k.rate==null?-1:x.k.rate,now:x=>x.nx}[PJ.lsort.k]||(x=>x.d.start||"");
  F0.sort((a,b)=>{const A=key(a),B=key(b);return (typeof A==="number"?A-B:String(A).localeCompare(String(B),"ko"))*PJ.lsort.d});
  const th=(k,l,c)=>`<th class="${c||""}"><button type="button" data-pjls="${k}" aria-sort="${PJ.lsort.k===k?(PJ.lsort.d>0?"ascending":"descending"):"none"}">${l}<i>${PJ.lsort.k===k?(PJ.lsort.d>0?"▲":"▼"):""}</i></button></th>`;
  const cnt={active:R.filter(x=>!x.done).length,done:R.filter(x=>x.done).length,all:R.length};
  const adm=st.me.is_admin?`<div class="pj-admbar"><span>🛠 관리자 · ${esc(teamName(PJ.team))} 사업 관리 켜짐</span><span class="spacer"></span><button type="button" class="btn sm ghost" data-pjadmoff="${esc(PJ.team)}">이 팀에서 끄기</button></div>`:"";
  return adm+rq+my+`<div class="pjl-bar"><div class="pj-seg">${[["active","진행 중"],["done","끝난 사업"],["all","전체"]].map(([k,l])=>`<button type="button" data-pjlf="${k}" aria-selected="${PJ.lfil===k}">${l} <span class="dim">${cnt[k]}</span></button>`).join("")}</div><span class="spacer"></span><input type="search" id="pjLq" class="pjl-q" placeholder="사업명 · 번호 · 고객사 · 책임자 찾기" value="${esc(PJ.lq)}"></div>
    <div class="pjl-wrap"><table class="pjl"><thead><tr>${th("name","사업명","w")}${th("code","번호")}${th("customer","고객사")}${th("owner","책임자")}${th("start","시작일")}${th("end","종료일")}${th("prog","진행","pg")}${th("late","지남","n")}${th("rate","달성율","n")}${th("now","지금 공정")}</tr></thead>
    <tbody>${F0.map(x=>`<tr data-pjopen="${esc(x.p.id)}" tabindex="0"><td class="w"><b>${esc(x.d.name)}</b></td><td class="mono dim">${esc(x.d.code||"")}</td><td>${esc(x.d.customer||"")}</td><td>${esc(x.own)}</td><td class="mono">${esc(x.d.start||"")}</td><td class="mono">${esc(x.d.end||"")}</td>
      <td class="pg"><span class="pjl-pg"><span class="pj-prog"><i style="width:${Math.round(x.prog*100)}%"></i></span><span class="mono">${x.k.done}/${x.k.n}</span></span></td><td class="n${x.k.late?" bad":""}">${x.k.late||"-"}</td><td class="n">${x.k.rate==null?"-":x.k.rate+"%"}</td><td class="dim">${x.done?'<span class="pj-tag ok">완료</span>':esc(x.nx)}</td></tr>`).join("")||`<tr><td colspan="10" class="dim" style="text-align:center;padding:20px">맞는 사업이 없어요</td></tr>`}</tbody></table></div>`}
function pjNewHtml(){const me=st.me,t=todayKey,ppl=pjPeople(),m=PJ.nmode||{k:pjCanNew()?"new":"req"},r=m.rid?PJ.requests.find(x=>x.id===m.rid):null,d=(r&&r.data)||{};
  const T={new:["새 사업","만들면 기본 대공정 "+PJ_TPL.length+"개와 하부 공정이 들어가요. 기간에 맞춰 일정을 나눠 넣고, 그다음은 담당자들이 각자 더하고 고쳐요.","만들기"],
    req:["사업 추가 요청","팀장에게 요청이 가요. 팀장이 수락하면 바로 사업이 만들어지고, 🔔 알림으로 알려 드려요.","요청 보내기"],
    accept:["요청 고쳐서 수락",(r?esc(r.requester_name||"")+"님의 요청이에요. 고칠 곳을 고치고 수락하면 바로 만들어져요.":""),"수락하고 만들기"]}[m.k];
  const ow=d.owner_email||(m.k==="accept"&&r?r.requester_email:me.email);
  return `<form class="pj-new" id="pjNewForm" novalidate data-mode="${m.k}"><h3>${T[0]}</h3><p class="hint" style="margin:0 0 10px">${T[1]}</p>
    <div class="pj-grid"><label>사업명 *<input id="pjnName" maxlength="60" placeholder="예: MUSV2 원격통제소" value="${esc(d.name||"")}"></label><label>사업 번호<input id="pjnCode" maxlength="30" placeholder="예: A-1" value="${esc(d.code||"")}"></label>
    <label>고객사<input id="pjnCust" maxlength="40" list="dl-pjcust" value="${esc(d.customer||"")}"></label><label>책임자<select id="pjnOwner">${ppl.map(p=>`<option value="${esc(p.email)}"${p.email===ow?" selected":""}>${esc(p.name)} · ${esc(p.team_name)}</option>`).join("")||`<option value="${esc(me.email)}">${esc(me.name)}</option>`}</select></label>
    <label>시작일 *<input type="date" id="pjnStart" value="${esc(d.start||t)}"></label><label>완료 예정일 *<input type="date" id="pjnEnd" value="${esc(d.end||pjAdd(t,365))}"></label></div>
    <label class="pj-blank"><input type="checkbox" id="pjnBlank"${d.blank?" checked":""}> 기본 공정 없이 빈 사업으로 만들기</label>
    ${m.k!=="new"?`<label class="pj-memo">${m.k==="req"?"요청 메모 (왜 필요한지 · 참고할 것)":"요청 메모"}<textarea id="pjnMemo" maxlength="500" rows="2"${m.k==="accept"?" readonly":""}>${esc(d.memo||"")}</textarea></label>`:""}
    <datalist id="dl-pjcust">${(st.lists.customers||[]).map(c=>`<option value="${esc(c)}">`).join("")}</datalist>
    <p class="err" id="pjnErr" hidden></p><div class="pj-foot"><button type="button" class="btn" data-pjv="list">취소</button><button type="submit" class="btn primary">${T[2]}</button></div></form>`}
// 기본 공정 → 서버 줄: 대공정마다 기간을 나눠 시작 · 완료, 하부 공정은 그 대공정 기간 (담당은 미정 → 각자 정함)
function pjFromTpl(pid,start,end,owner){const span=Math.max(PJ_TPL.length,pjDiff(start,end)),n=PJ_TPL.length,R=[];
  PJ_TPL.forEach(([name,del,tasks],i)=>{const s=pjAdd(start,Math.round(span*i/n)+(i?1:0)),e=pjAdd(start,Math.round(span*(i+1)/n)),id=pjId()+i;
    R.push({id,project_id:pid,parent_id:null,sort:i+1,name,owner_email:owner,start_date:s,end_date:e,deliverable:del,done_at:null});
    tasks.forEach((x,j)=>R.push({id:pjId()+i+"_"+j,project_id:pid,parent_id:id,sort:j+1,name:x,owner_email:null,start_date:s,end_date:e,deliverable:null,done_at:null}))});
  return R}
// 사업 상세: 위는 틀 고정(사업 · 숫자 · 공정 흐름 · 화면 고르기), 아래는 공정 · 일정 / 주차별 계획 · 실적 / 간트
function pjProjHtml(p){const d=p.data,k=pjKpi(p),inf=pjCanInfo(p),ed=pjMember(p),ppl=pjPeople(),ph0=d.phases||[];
  const nowPh=ph0.find(ph=>(ph.tasks||[]).some(t=>!t.done_at));
  const info=PJ.info&&inf?`<div class="pj-info pj-grid"><label>사업명<input data-pji="name" value="${esc(d.name)}" maxlength="60"></label><label>사업 번호<input data-pji="code" value="${esc(d.code||"")}" maxlength="30"></label><label>고객사<input data-pji="customer" value="${esc(d.customer||"")}" maxlength="40"></label>
      <label>시작일<input type="date" data-pji="start" value="${esc(d.start||"")}"></label><label>완료 예정일<input type="date" data-pji="end" value="${esc(d.end||"")}"></label><label>책임자<select data-pji="owner">${ppl.map(x=>`<option value="${esc(x.email)}"${x.email===p.owner_email?" selected":""}>${esc(x.name)}</option>`).join("")}</select></label>
      <div class="pj-infof"><button type="button" class="btn danger sm" data-pja="delproj">사업 지우기</button><span class="spacer"></span><button type="button" class="btn sm primary" data-pja="info">닫기</button></div></div>`:"";
  const subs=[["tree","공정 · 일정"],["week","주차별 계획 · 실적"],["gantt","간트"]];
  const stick=`<div class="pj-stick" id="pjStick"><div class="pj-head"><div class="pj-hl"><b class="pj-nm">${esc(d.name)}</b>${d.code?`<span class="dim mono">${esc(d.code)}</span>`:""}<span class="dim pj-meta">${esc(d.customer||"")}${d.customer?" · ":""}${pjMD(d.start)}~${pjMD(d.end)} · 책임 ${esc(pjName(p.owner_email))}</span>${inf?`<button type="button" class="btn sm ghost" data-pja="info" aria-expanded="${!!PJ.info}">⚙ 정보</button>`:""}<span class="pj-sv dim" id="pjSv"></span></div>
      <div class="pj-kpis"><span><b>${k.done}/${k.n}</b>완료</span><span class="${k.late?"bad":""}"><b>${k.late}</b>지남</span><span><b>${k.ok}</b>준수</span><span class="${k.miss?"warn":""}"><b>${k.miss}</b>미준수</span><span class="${k.l7?"bad":""}"><b>${k.l7}</b>7일↑</span><span><b>${k.rate==null?"-":k.rate+"%"}</b>달성율</span><button type="button" class="btn sm ghost" data-pja="xls" title="엑셀로 받기">📥</button></div></div>
    <div class="pj-ms">${ph0.map(ph=>{const T=(ph.tasks||[]),dn=T.filter(t=>t.done_at).length,all=T.length&&dn===T.length,late=!all&&ph.due&&ph.due<todayKey;
      return `<button type="button" class="pj-msi${all?" ok":late?" bad":""}${ph===nowPh?" now":""}" data-pjgo="${esc(ph.id)}"><b>${esc(ph.name.split(/[ /]/)[0])}</b><span>${pjMD(ph.due)||"-"} · ${dn}/${T.length}</span><i style="width:${T.length?Math.round(dn/T.length*100):0}%"></i></button>`}).join("")}</div>
    <div class="pj-subs"><div class="pj-seg" role="tablist" aria-label="보기">${subs.map(([s,l])=>`<button type="button" role="tab" data-pjsub="${s}" aria-selected="${PJ.sub===s}">${l}</button>`).join("")}</div><span class="spacer"></span>
      ${ed&&PJ.sub==="tree"&&!PJ.pick?`<button type="button" class="btn sm" data-pja="addph" title="맨 아래에 대공정을 더해요. ⋮⋮ 로 순서를 옮겨요">+ 대공정</button>`:""}${ed&&PJ.sub==="tree"?`<button type="button" class="btn sm${PJ.pick?" primary":""}" data-pja="pick" title="여러 하부 공정을 골라 rhy:se 이번 주 계획으로 옮겨요">${PJ.pick?"고르기 끝":"☑ 골라서 rhy:se로"}</button>`:""}<button type="button" class="btn sm ghost" data-pja="log">🕘 바뀐 기록</button></div></div>`;
  const nt=PJ.notices.find(n=>n.project_id===p.id),ntl=nt?`<button type="button" class="pj-ntl" data-pjntc="${esc(nt.id)}"><b>📣</b><span>${esc(nt.title)}</span><span class="dim">${esc(nt.author_name||"")} · ${esc(fmtDT(nt.updated_at||nt.created_at).slice(5,10))}</span></button>`:"";
  const body=PJ.sub==="week"?pjWeekHtml(p):PJ.sub==="gantt"?pjGanttHtml(p):pjTreeHtml(p,ed,ppl);
  return stick+info+ntl+body}
function pjTreeHtml(p,ed,ppl){const ph0=p.data.phases||[];
  const inp=(f,v,ph,extra)=>ed?`<input class="pj-in" data-pjf="${f}" value="${esc(v||"")}"${ph?` placeholder="${ph}"`:""}${extra||""}>`:esc(v||"");
  const own=(o,f)=>ed?`<select class="pj-in" data-pjf="${f}" aria-label="담당"><option value="">미정</option>${ppl.map(x=>`<option value="${esc(x.email)}"${x.email===o?" selected":""}>${esc(x.name)}</option>`).join("")}${o&&!ppl.some(x=>x.email===o)?`<option value="${esc(o)}" selected>${esc(pjName(o)||o)}</option>`:""}</select>`:`<span class="${o?"":"dim"}">${esc(pjName(o)||"미정")}</span>`;
  const dt=(f,v,lb)=>ed?`<input type="date" class="pj-in mono" data-pjf="${f}" value="${esc(v||"")}" aria-label="${lb}">`:`<span class="mono">${pjMD(v)||"-"}</span>`;
  const h={inp,own,dt,ed};let rows="";
  ph0.forEach((ph,pi)=>{const T=ph.tasks||[],dn=T.filter(t=>t.done_at).length,fold=PJ.fold.has(ph.id),late=dn<T.length&&ph.due&&ph.due<todayKey,no=pi+1;
    rows+=`<tr class="pj-pr${late?" late":""}" data-k="ph" data-ph="${esc(ph.id)}" id="pj-${esc(ph.id)}" data-pjrow="${esc(ph.id)}"><td class="pj-h">${ed&&!PJ.pick?`<span class="pj-grip" data-grip="ph" title="끌어서 순서 바꾸기" aria-label="끌어서 순서 바꾸기">⋮⋮</span>`:""}</td>
      <td class="pj-nmc"><button type="button" class="pj-fold" data-pjfold="${esc(ph.id)}" aria-expanded="${!fold}">${fold?"▸":"▾"}</button><span class="pj-no">${no}</span>${inp("phname",ph.name,"대공정 이름",' aria-label="대공정 이름"')}</td>
      <td>${own(ph.owner_email,"phowner")}</td><td>${dt("phstart",ph.start,"대공정 시작일")}</td><td>${dt("phdue",ph.due,"대공정 완료일")}</td><td class="pj-sub">${inp("phdel",ph.deliverable,"산출물",' aria-label="산출물"')}</td>
      <td><span class="pj-pg"><i style="width:${T.length?Math.round(dn/T.length*100):0}%"></i></span><span class="pj-pn${late?" bad":""}">${dn}/${T.length}</span></td><td class="pj-act">${ed?`<button type="button" class="pj-x" data-pja="delph" title="대공정 빼기" aria-label="대공정 빼기">✕</button>`:""}</td></tr>`;
    if(fold)return;
    T.forEach((t,ti)=>{rows+=pjRowHtml(p,t,ph,`${no}.${ti+1}`,h)});
    if(ed&&!PJ.pick)rows+=`<tr class="pj-addr" data-ph="${esc(ph.id)}"><td></td><td colspan="7"><button type="button" class="pj-add" data-pja="addtask">+ 하부 공정</button></td></tr>`});
  return `<div class="pj-tree-w"><table class="pj-tree" id="pjTree"><thead><tr><th class="pj-h"></th><th>대공정 · 하부 공정</th><th>담당</th><th>시작</th><th>완료</th><th>산출물</th><th>상태</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    ${!ph0.length?`<div class="pj-empty">공정이 없어요${ed?" · 위쪽 <b>+ 대공정</b>으로 시작해요":""}</div>`:""}</div>
    ${ed?`<p class="hint pj-tip">그 팀 사람은 누구나 공정 · 일정 · 담당 · 산출물을 바로 고쳐요 (자동 저장, 🕘 바뀐 기록에 남아요). 필요한 일정은 <b>→ rhy:se</b>로 내 이번 주 계획에 옮겨요.</p>`:`<p class="hint pj-tip">👁 보기 전용이에요 (다른 팀 사업)</p>`}`}
function pjRowHtml(p,t,ph,no,h){const s=pjSt(p,t),can=pjCanMark(p),N=PJ.notes.filter(n=>n.project_id===p.id&&n.task_id===t.id),mine=st.me&&t.owner_email===st.me.email,open=PJ.thr===t.id;
  const S=pjSeen(),nw=N.some(n=>n.author_email!==st.me.email&&n.created_at>(S[p.id+"|"+t.id]||""));
  const lead=PJ.pick?`<input type="checkbox" class="pj-pk" data-pjpick="${esc(t.id)}"${PJ.pick.has(t.id)?" checked":""} aria-label="rhy:se로 옮길 공정 고르기">`:(h.ed?`<span class="pj-grip" data-grip="t" title="끌어서 순서 바꾸기" aria-label="끌어서 순서 바꾸기">⋮⋮</span>`:"");
  return `<tr class="pj-tr${s.k==="done"?" done":""}${mine?" mine":""}${PJ.pick&&PJ.pick.has(t.id)?" picked":""}" data-k="t" data-ph="${esc(ph.id)}" data-t="${esc(t.id)}" data-pjrow="${esc(t.id)}"><td class="pj-h">${lead}</td>
    <td class="pj-nmc"><span class="pj-br">└</span><input type="checkbox" class="pj-ck" data-pjdone="${esc(t.id)}"${t.done_at?" checked":""}${can?"":" disabled"} aria-label="완료"><span class="pj-no">${no}</span>${mine?'<span class="pj-me">나</span> ':""}${h.inp("tname",t.name,"하부 공정",' aria-label="하부 공정"')}</td>
    <td>${h.own(t.owner_email,"towner")}</td><td>${h.dt("tstart",t.start,"시작일")}</td><td>${h.dt("tdue",t.due,"완료일")}</td><td class="pj-sub">${h.inp("tdel",t.deliverable,"산출물",' aria-label="산출물"')}</td>
    <td><span class="pj-tag ${s.c}">${esc(s.t)}</span>${s.done?` <span class="dim mono pj-dd">${pjMD(s.done)}</span>`:""}</td>
    <td class="pj-act"><button type="button" class="pj-ib${nw?" new":""}" data-pjthr="${esc(t.id)}" aria-expanded="${open}" title="검토 의견 · 메모">💬${N.length?`<b>${N.length}</b>`:""}</button>${h.ed&&s.k!=="done"?`<button type="button" class="pj-ib" data-pjplan="${esc(t.id)}" title="rhy:se 이번 주 내 계획으로 옮기기 (업무 쓰기 창에 채워 드려요)">→ rhy:se</button>`:""}${h.ed?`<button type="button" class="pj-x" data-pja="deltask" title="하부 공정 빼기" aria-label="하부 공정 빼기">✕</button>`:""}</td></tr>
    ${open?`<tr class="pj-thr"><td></td><td colspan="7">${N.map(n=>`<div class="pj-note${n.is_review?" rv":""}"><b>${n.is_review?"검토 의견 · ":""}${esc(n.author_name||"")}</b> <span class="dim">${esc(fmtDT(n.created_at).slice(2))}</span>${n.author_email===st.me.email?` <button type="button" class="lnk" data-pjndel="${esc(n.id)}">지우기</button>`:""}<div>${esc(n.body)}</div></div>`).join("")||`<p class="hint" style="margin:0 0 6px">아직 남긴 글이 없어요</p>`}
      <div class="pj-nin"><input id="pjNote" maxlength="1000" placeholder="${pjReviewer(p)?"검토 의견을 남겨요 (담당자에게 🔔 알림)":"메모를 남겨요 (책임자에게 🔔 알림)"}"><button type="button" class="btn sm primary" data-pjnsend="${esc(t.id)}">남기기</button></div></td></tr>`:""}`}
/* ---------- 주차별 계획 · 실적 (하부 공정 × 주) : 이번 주 할 것 · 한 것 · 특이사항 ---------- */
const pjWk=(tid,wk)=>PJ.weeks.find(w=>w.item_id===tid&&w.week===wk);
const pjWeeks=()=>{const m=mondayOf(new Date());return [-3,-2,-1,0,1,2].map(i=>keyOf(addDays(m,(i+PJ.wk0)*7)))};
const pjInPeriod=(t,wk)=>{const fri=pjAdd(wk,4);return (t.start||t.due||"")<=fri&&(t.due||t.start||"9999")>=wk&&!!(t.start||t.due)};
function pjCell(t,wk){const r=pjWk(t.id,wk),mon=pjMon(),past=wk<mon,cur=wk===mon,act=pjInPeriod(t,wk)&&!(t.done_at&&t.done_at<wk);
  const c=r&&r.done?"ok":r&&r.plan?(past?"miss":"plan"):(act&&(past||cur)&&!t.done_at?"none":act?"act":"");return {r,c,cur}}
function pjWeekHtml(p){const W=pjWeeks(),mon=pjMon(),me=st.me.email,ed=pjMember(p),T=pjTasks(p);
  const owners=[...new Set(T.map(t=>t.owner_email).filter(Boolean))].sort((a,b)=>(a===me?-1:b===me?1:pjName(a).localeCompare(pjName(b),"ko")));
  const fil=PJ.wfil,show=t=>fil==="all"||(fil==="none"?!t.owner_email:t.owner_email===fil);
  // 이번 주 기록 현황 (사람별): 이번 주에 걸친 진행 중 하부 공정 중 기록을 남긴 수
  const now=T.filter(t=>pjInPeriod(t,mon)&&!t.done_at),byP=owners.map(o=>{const L=now.filter(t=>t.owner_email===o);return {o,n:L.length,w:L.filter(t=>{const r=pjWk(t.id,mon);return r&&(r.plan||r.done)}).length}}).filter(x=>x.n);
  const summ=byP.length?`<div class="pw-sum"><b>이번 주 기록</b>${byP.map(x=>`<button type="button" class="pw-who${x.w<x.n?" short":""}${fil===x.o?" on":""}" data-pjwfil="${esc(x.o)}">${esc(pjName(x.o))} <span>${x.w}/${x.n}</span></button>`).join("")}<span class="dim">진행 중 하부 공정 중 이번 주에 적은 수</span></div>`:"";
  const chips=`<div class="pw-fil"><button type="button" data-pjwfil="all" aria-pressed="${fil==="all"}">전체</button><button type="button" data-pjwfil="${esc(me)}" aria-pressed="${fil===me}">나</button>${owners.filter(o=>o!==me).map(o=>`<button type="button" data-pjwfil="${esc(o)}" aria-pressed="${fil===o}">${esc(pjName(o))}</button>`).join("")}${T.some(t=>!t.owner_email)?`<button type="button" data-pjwfil="none" aria-pressed="${fil==="none"}">미정</button>`:""}
    <span class="spacer"></span><button type="button" class="btn sm" data-pjwk="-1" aria-label="이전 주">◀</button><button type="button" class="btn sm" data-pjwk="0">이번 주</button><button type="button" class="btn sm" data-pjwk="1" aria-label="다음 주">▶</button></div>`;
  const head=`<tr><th class="pw-nm">대공정 · 하부 공정</th><th class="pw-ow">담당</th>${W.map(w=>`<th class="${w===mon?"cur":""}"><span class="mono">${pjMD(w)}</span>${w===mon?'<b>이번 주</b>':""}</th>`).join("")}</tr>`;
  let rows="";(p.data.phases||[]).forEach(ph=>{const L=(ph.tasks||[]).filter(show);if(!L.length)return;
    rows+=`<tr class="pw-ph" data-ph="${esc(ph.id)}"><td colspan="${W.length+2}">${esc(ph.name)} <span class="dim">${pjMD(ph.start)}~${pjMD(ph.due)}</span></td></tr>`;
    L.forEach(t=>{rows+=`<tr class="pw-tr${t.done_at?" done":""}" data-pjrow="${esc(t.id)}" data-ph="${esc(ph.id)}"><td class="pw-nm">${t.done_at?"✓ ":""}${esc(t.name||"(이름 없음)")}<span class="dim mono">${pjMD(t.start)}~${pjMD(t.due)}</span></td><td class="pw-ow ${t.owner_email?"":"dim"}">${esc(pjName(t.owner_email)||"미정")}</td>
      ${W.map(w=>{const {r,c}=pjCell(t,w),on=PJ.wcell===t.id+"|"+w;return `<td class="pw-c ${c}${w===mon?" cur":""}${on?" on":""}"><button type="button" data-pjw="${esc(t.id)}|${w}" aria-expanded="${on}" aria-label="${esc(t.name)} ${pjMD(w)} 주">${r?`${r.plan?`<span class="pw-p">${esc(r.plan)}</span>`:""}${r.done?`<span class="pw-d">✓ ${esc(r.done)}</span>`:""}${r.issue?`<span class="pw-i">⚠ ${esc(r.issue)}</span>`:""}`:c==="none"?'<span class="pw-e">기록 없음</span>':c==="act"&&ed?'<span class="pw-add">+</span>':""}</button></td>`}).join("")}</tr>`;
      if(PJ.wcell&&PJ.wcell.split("|")[0]===t.id){const wk=PJ.wcell.split("|")[1],r=pjWk(t.id,wk)||{};
        rows+=`<tr class="pw-ed"><td colspan="${W.length+2}"><div class="pw-box"><div class="pw-bh"><b>${esc(t.name)}</b><span class="dim">${pjMD(wk)}~${pjMD(pjAdd(wk,4))} 주${wk===mon?" (이번 주)":""} · 담당 ${esc(pjName(t.owner_email)||"미정")}</span><span class="spacer"></span>${r.by_email?`<span class="dim pw-by">마지막 ${esc(pjName(r.by_email))} · ${esc(fmtDT(r.updated_at).slice(5))}</span>`:""}<button type="button" class="pj-x on" data-pjwclose="1" aria-label="닫기">✕</button></div>
          <div class="pw-fs"><label>이번 주 할 것 (계획)<textarea data-pjwf="plan" maxlength="500" rows="2"${ed?"":" readonly"} placeholder="예: 배치안 2안 작성">${esc(r.plan||"")}</textarea></label>
          <label>한 것 (실적)<textarea data-pjwf="done" maxlength="500" rows="2"${ed?"":" readonly"} placeholder="예: 1안 완료, 2안 70%">${esc(r.done||"")}</textarea></label>
          <label>특이사항<textarea data-pjwf="issue" maxlength="500" rows="2"${ed?"":" readonly"} placeholder="문제 · 지연 원인 · 요청 (보고는 rhy:se 주간 업무로)">${esc(r.issue||"")}</textarea></label></div>
          <div class="pw-bf"><span class="dim" id="pjWsv">적으면 저절로 저장돼요</span><span class="spacer"></span>${ed&&wk>=mon?`<button type="button" class="btn sm" data-pjwplan="${esc(t.id)}|${wk}" title="이 주 계획을 내 rhy:se 업무 쓰기 창에 채워 드려요">→ rhy:se 이번 주 계획</button>`:""}</div></div></td></tr>`}})});
  return `${summ}${chips}<div class="pw-wrap"><table class="pw" id="pjWeek"><thead>${head}</thead><tbody>${rows||`<tr><td colspan="${W.length+2}" class="dim" style="padding:20px;text-align:center">보여 줄 하부 공정이 없어요</td></tr>`}</tbody></table></div>
    <p class="hint pj-tip pw-lg"><span class="pw-c ok"><i></i></span>한 것 있음 <span class="pw-c plan"><i></i></span>계획 <span class="pw-c miss"><i></i></span>지난 주 계획만 있고 실적 없음 <span class="pw-c none"><i></i></span>진행 중인데 기록 없음 · 칸을 누르면 적어요</p>`}
/* ---------- 간트 ---------- */
function pjGanttHtml(p){const d=p.data,T=pjTasks(p),ph0=d.phases||[];
  const ds=[d.start,d.end,...ph0.flatMap(ph=>[ph.start,ph.due]),...T.flatMap(t=>[t.start,t.due])].filter(Boolean).sort();
  if(ds.length<2)return `<div class="pj-empty">일정이 있는 공정이 없어요. 공정 · 일정에서 시작 · 완료일을 넣으면 막대로 보여요.</div>`;
  const s0=ds[0],e0=ds[ds.length-1],span=Math.max(1,pjDiff(s0,e0)+1),X=v=>Math.max(0,Math.min(100,pjDiff(s0,v)/span*100));
  const months=[];{let c=new Date(pjD(s0).getFullYear(),pjD(s0).getMonth(),1);while(keyOf(c)<=e0){months.push(keyOf(c));c=new Date(c.getFullYear(),c.getMonth()+1,1)}}
  const td=todayKey>=s0&&todayKey<=e0?X(todayKey):null,few=months.length>14;
  const head=`<div class="pg-row pg-hd"><div class="pg-lb"></div><div class="pg-tl">${months.map(m=>{const x=X(m<s0?s0:m);const y=m.slice(5,7)==="01"||m===months[0];return `<span class="pg-m${y?" y":""}" style="left:${x}%">${few&&!y&&+m.slice(5,7)%3!==1?"":y?m.slice(2,4)+"."+(+m.slice(5,7)):+m.slice(5,7)+"월"}</span>`}).join("")}</div></div>`;
  const bar=(a,b,cls,tt)=>{if(!a&&!b)return `<span class="pg-no">일정 없음</span>`;a=a||b;b=b||a;if(b<a)[a,b]=[b,a];const l=X(a),w=Math.max(.6,X(pjAdd(b,1))-l);return `<i class="pg-bar ${cls}" style="left:${l}%;width:${w}%" title="${esc(tt)}"></i>`};
  let rows="";ph0.forEach(ph=>{const L=ph.tasks||[],ss=L.map(t=>t.start||t.due).filter(Boolean).sort(),ee=L.map(t=>t.due||t.start).filter(Boolean).sort(),dn=L.filter(t=>t.done_at).length;
    const a=ph.start||ss[0]||"",b=ph.due||ee[ee.length-1]||"",all=L.length&&dn===L.length,late=!all&&b&&b<todayKey;
    rows+=`<div class="pg-row pg-ph" data-ph="${esc(ph.id)}"><button type="button" class="pg-lb" data-pjgot="${esc(ph.id)}"><b>${esc(ph.name)}</b><span class="dim">${dn}/${L.length}</span></button><div class="pg-tl">${bar(a,b,"ph"+(all?" ok":late?" bad":""),`${ph.name} · ${a}~${b}`)}</div></div>`;
    L.forEach(t=>{const s=pjSt(p,t),cls=s.k==="done"?"ok":s.k==="late"?"bad":"";
      rows+=`<div class="pg-row${t.owner_email===st.me.email?" mine":""}" data-ph="${esc(ph.id)}"><button type="button" class="pg-lb" data-pjgot="${esc(t.id)}"><span class="pg-tn">${esc(t.name||"(이름 없음)")}</span><span class="dim">${esc(pjName(t.owner_email)||"미정")}</span></button><div class="pg-tl">${bar(t.start,t.due,cls,`${t.name} · ${t.start||"-"}~${t.due||"-"} · ${pjName(t.owner_email)||"미정"} · ${s.t}`)}</div></div>`})});
  return `<div class="pg-legend"><span><i class="pg-bar ph"></i>대공정</span><span><i class="pg-bar"></i>진행 · 예정</span><span><i class="pg-bar ok"></i>완료</span><span><i class="pg-bar bad"></i>지남</span><span><i class="pg-td"></i>오늘</span><span class="dim">· 이름을 누르면 공정 · 일정에서 열려요</span></div>
    <div class="pg-wrap"><div class="pg" style="${td==null?"":`--td:${td}%`}"${td==null?' data-notoday="1"':""}>${head}${rows}</div></div>`}
/* ---------- 🕘 바뀐 기록 ---------- */
function pjLogText(l){const n=`'${l.item_name||"(이름 없음)"}'`;
  return l.action==="add"?`${n} 추가`:l.action==="del"?`${n} 뺌`:l.action==="owner"?`${n} 담당 → ${pjName(l.new_owner)||"미정"}`:l.action==="done"?`${n} 완료`:l.action==="undone"?`${n} 완료 취소`:`${n} ${l.detail||"고침"}`}
const PJ_LOGK=[["","전체"],["add","추가"],["del","뺌"],["owner","담당"],["edit","고침"],["done","완료"]];
function pjLogModal(p){const f=PJ.logf,A=PJ.log.filter(l=>l.project_id===p.id),who=[...new Set(A.map(l=>l.by_email))];
  const L=A.filter(l=>(!f.who||l.by_email===f.who)&&(!f.k||l.action===f.k||(f.k==="done"&&l.action==="undone"))).slice(0,200);
  pjModal(`<div class="pj-mh"><b>🕘 바뀐 기록</b><span class="dim">${esc(p.data.name)} · 누가 언제 무엇을 바꿨는지</span><span class="spacer"></span><button type="button" class="pj-x on" data-pjmclose="1" aria-label="닫기">✕</button></div>
    <div class="pj-mf"><select id="pjLogWho" aria-label="사람"><option value="">모든 사람</option>${who.map(e=>`<option value="${esc(e)}"${f.who===e?" selected":""}>${esc(pjName(e)||e)}</option>`).join("")}</select><div class="pj-seg">${PJ_LOGK.map(([k,l])=>`<button type="button" data-pjlogk="${k}" aria-selected="${f.k===k}">${l}</button>`).join("")}</div></div>
    <div class="pj-mb">${L.length?`<ul class="pj-logl">${L.map(l=>`<li><button type="button" data-pjlogi="${esc(l.item_id||"")}"${pjItem(l.item_id)?"":" disabled"}><span class="mono dim">${esc(fmtDT(l.at).slice(5))}</span><b>${esc(l.by_name||pjName(l.by_email)||"")}</b><span class="pj-lk ${esc(l.action)}">${{add:"추가",del:"뺌",owner:"담당",edit:"고침",done:"완료",undone:"완료 취소"}[l.action]||""}</span><span>${esc(pjLogText(l))}</span></button></li>`).join("")}</ul>`:`<p class="hint" style="margin:16px 0;text-align:center">${A.length?"맞는 기록이 없어요":"아직 바뀐 기록이 없어요"}</p>`}</div>`,"log")}
function pjMineHtml(){const me=st.me.email,R=[];PJ.list.forEach(p=>pjTasks(p).forEach(t=>{if(t.owner_email!==me)return;const s=pjSt(p,t);if(s.k==="done")return;R.push({p,t,s})}));
  R.sort((a,b)=>(a.t.due||"9999").localeCompare(b.t.due||"9999"));
  const G=[["late","늦어진 일"],["soon","2주 안에 챙길 일"],["plan","그다음"],["none","완료일 없음"]],mon=pjMon();
  if(!R.length)return `<div class="pj-empty"><b>남은 내 공정이 없어요</b>사업에서 하부 공정의 담당을 나로 정하면 여기에 모여요.</div>`;
  return G.map(([k,l])=>{const L=R.filter(r=>r.s.k===k);return L.length?`<h3 class="pj-gh ${k}">${l} <span>${L.length}</span></h3><div class="pj-list">${L.map(({p,t,s})=>{const w=pjWk(t.id,mon);
    return `<div class="pj-li"><span class="pj-tag ${s.c}">${esc(s.t)}</span><button type="button" class="wtx" data-pjopen="${esc(p.id)}" data-pjtask="${esc(t.id)}"><b>${esc(t.name)}</b><span class="dim">${esc(p.data.name)} · ${esc(t._ph.name)} · ${esc(pjMD(t.start)||"-")}~${esc(pjMD(t.due)||"-")}${t.deliverable?" · "+esc(t.deliverable):""}${w&&w.plan?" · 이번 주: "+esc(w.plan):""}</span></button>
    <span class="pj-act"><button type="button" class="btn sm ghost" data-pjweek="${esc(p.id)}|${esc(t.id)}" title="주차별 계획 · 실적에 이번 주 할 것 · 한 것 적기">이번 주 적기</button><button type="button" class="btn sm" data-pjdone2="${esc(p.id)}|${esc(t.id)}">완료</button><button type="button" class="btn sm ghost" data-pjplan2="${esc(p.id)}|${esc(t.id)}">→ rhy:se</button></span></div>`}).join("")}</div>`:""}).join("")}
// 팀장 · 책임자: 지난 공정 + 이번 주 기록이 비어 있는 공정(사람별) + 지난주 계획만 있고 실적 없는 공정
function pjBlockHtml(){const mon=pjMon(),prev=keyOf(addDays(parseKey(mon),-7)),W={late:3,miss:2,empty:1};
  const P=PJ.list.map(p=>{const R=[];pjTasks(p).forEach(t=>{if(t.done_at)return;const s=pjSt(p,t),tg=[];
      if(s.k==="late")tg.push({k:"late",t:s.t,n:-s.d});
      const pr=pjWk(t.id,prev);if(pr&&pr.plan&&!pr.done)tg.push({k:"miss",t:"지난주 계획만",tip:pr.plan});
      const cw=pjWk(t.id,mon);if(pjInPeriod(t,mon)&&!(cw&&(cw.plan||cw.done)))tg.push({k:"empty",t:"이번 주 기록 없음"});
      if(tg.length)R.push({t,tg,w:Math.max(...tg.map(x=>W[x.k])),n:(tg.find(x=>x.k==="late")||{n:0}).n})});
    R.sort((a,b)=>b.w-a.w||b.n-a.n||pjName(a.t.owner_email).localeCompare(pjName(b.t.owner_email),"ko"));return {p,R}}).filter(x=>x.R.length);
  const all=P.flatMap(x=>x.R),c=k=>all.filter(r=>r.tg.some(g=>g.k===k)).length,f=PJ.bfil;
  if(!all.length)return `<div class="pj-empty"><b>살펴볼 곳이 없어요</b>완료일이 지났는데 끝나지 않은 공정, 지난주 계획만 있는 공정, 이번 주 기록이 빠진 공정이 생기면 사업별로 여기에 모여요.</div>`;
  const chips=`<div class="pjb-sum">${[["all","전체",all.length],["late","지남",c("late")],["miss","지난주 계획만",c("miss")],["empty","이번 주 기록 없음",c("empty")]].map(([k,l,n])=>`<button type="button" class="pjb-c ${k}" data-pjbf="${k}" aria-pressed="${f===k}"><b>${n}</b>${l}</button>`).join("")}</div>`;
  return chips+P.map(({p,R})=>{const L=R.filter(r=>f==="all"||r.tg.some(g=>g.k===f));if(!L.length)return "";
    return `<section class="pjb"><div class="pjb-h"><b>${esc(p.data.name)}</b><span class="dim">책임 ${esc(pjName(p.owner_email))}</span><span class="spacer"></span><span class="dim">${L.length}건</span><button type="button" class="btn sm ghost" data-pjopen="${esc(p.id)}">사업 열기</button></div>
      <table class="pjb-t"><thead><tr><th>하부 공정</th><th>대공정</th><th>담당</th><th>확인할 것</th><th>완료일</th><th></th></tr></thead><tbody>${L.map(({t,tg})=>`<tr><td class="${t.name?"":"dim"}"><b>${esc(t.name||"(이름 없음)")}</b></td><td class="dim">${esc(t._ph.name)}</td><td class="${t.owner_email?"":"dim"}">${esc(pjName(t.owner_email)||"미정")}</td>
        <td>${tg.map(g=>`<span class="pj-tag ${g.k==="late"?"bad":g.k==="miss"?"warn":"dim"}"${g.tip?` title="${esc(g.tip)}"`:""}>${esc(g.t)}</span>`).join(" ")}${tg.find(g=>g.tip)?`<span class="pjb-tip dim">${esc(tg.find(g=>g.tip).tip)}</span>`:""}</td><td class="mono">${pjMD(t.due)||"-"}</td>
        <td class="pj-act"><button type="button" class="btn sm ghost" data-pjopen="${esc(p.id)}" data-pjtask="${esc(t.id)}">열기</button></td></tr>`).join("")}</tbody></table></section>`}).join("")}
/* ---------- 저장: 공정은 한 줄씩, 바꾼 칸만 ---------- */
let pjSvT=null;
function pjSvMsg(t){const s=$("pjSv");if(!s)return;s.textContent=t;if(t==="✓ 저장됨")setTimeout(()=>{if(s.textContent==="✓ 저장됨")s.textContent=""},1800)}
function pjSet(id,patch,now){const it=pjItem(id);if(!it)return;Object.assign(it,patch,{updated_by:st.me.email});pjBuild();
  PJ.pend[id]=Object.assign(PJ.pend[id]||{},patch);pjSvMsg("저장 중…");clearTimeout(pjSvT);pjSvT=setTimeout(pjFlush,now?0:500)}
async function pjFlush(){const P=PJ.pend;PJ.pend={};const ids=Object.keys(P);if(!ids.length)return;
  try{await Promise.all(ids.map(id=>api.projItemSet(id,P[id])));pjSvMsg("✓ 저장됨");pjLogSoon()}
  catch(x){pjSvMsg("");toast((x&&x.hint)||errText(x));pjLoad()}}
// 바뀐 기록은 서버가 남김 → 잠깐 뒤 다시 불러와 기록 · 남이 고친 것도 맞춤
let pjLgT=null;const pjLogSoon=()=>{clearTimeout(pjLgT);pjLgT=setTimeout(()=>{if(PJ.open)pjLoad()},4000)};
async function pjAddRows(rows){PJ.items.push(...rows.map(r=>Object.assign({created_at:new Date().toISOString(),updated_by:st.me.email},r)));pjBuild();pjSvMsg("저장 중…");
  try{await api.projItemAdd(rows);pjSvMsg("✓ 저장됨");pjLogSoon()}catch(x){pjSvMsg("");toast((x&&x.hint)||errText(x));pjLoad()}}
async function pjDelRows(ids){PJ.items=PJ.items.filter(i=>!ids.includes(i.id));PJ.weeks=PJ.weeks.filter(w=>!ids.includes(w.item_id));ids.forEach(id=>delete PJ.pend[id]);pjBuild();
  try{await api.projItemDel(ids);pjSvMsg("✓ 저장됨");pjLogSoon()}catch(x){toast((x&&x.hint)||errText(x));pjLoad()}}
// 화면에서 바뀐 순서 · 소속(p.data.phases)을 sort · parent_id 로 맞춤 → 바뀐 줄만 저장
function pjSyncOrder(p){(p.data.phases||[]).forEach((ph,i)=>{const r=pjItem(ph.id);if(r&&r.sort!==i+1)pjSet(ph.id,{sort:i+1},true);
  (ph.tasks||[]).forEach((t,j)=>{const x=pjItem(t.id);if(!x)return;const pt={};if(x.sort!==j+1)pt.sort=j+1;if(x.parent_id!==ph.id)pt.parent_id=ph.id;if(Object.keys(pt).length)pjSet(t.id,pt,true)})})}
async function pjSaveMark(pid,tid,on){pjSet(tid,{done_at:on?todayKey:null},true);toast(on?"완료로 표시했어요":"완료를 풀었어요");pjRender()}
let pjInfoT=null;
function pjSaveInfo(p){pjSvMsg("저장 중…");clearTimeout(pjInfoT);pjInfoT=setTimeout(async()=>{const {phases,...data}=p.data;
  try{await api.projSave({id:p.id,data,owner_email:p.owner_email},false);pjSvMsg("✓ 저장됨")}catch(x){pjSvMsg("");toast((x&&x.hint)||errText(x));pjLoad()}},500)}
// 주차별 기록 저장 (칸마다 한 줄)
let pjWT=null;
function pjWeekSave(pid,tid,wk){clearTimeout(pjWT);const sv=$("pjWsv");if(sv)sv.textContent="저장 중…";
  pjWT=setTimeout(async()=>{const box=document.querySelector(".pw-box");if(!box)return;const v=f=>(box.querySelector(`[data-pjwf="${f}"]`).value||"").trim()||null;
    const row={project_id:pid,item_id:tid,week:wk,plan:v("plan"),done:v("done"),issue:v("issue"),by_email:st.me.email};
    PJ.weeks=PJ.weeks.filter(w=>!(w.item_id===tid&&w.week===wk));PJ.weeks.push(Object.assign({updated_at:new Date().toISOString()},row));
    try{await api.projWeekSave(row);const s=$("pjWsv");if(s)s.textContent="✓ 저장됨";pjWeekPaintCell(tid,wk)}catch(x){const s=$("pjWsv");if(s)s.textContent="";toast((x&&x.hint)||errText(x))}},600)}
function pjWeekPaintCell(tid,wk){const b=document.querySelector(`[data-pjw="${CSS.escape(tid+"|"+wk)}"]`),p=pjProj(PJ.pid),t=p&&pjTasks(p).find(x=>x.id===tid);if(!b||!t)return;const {r,c}=pjCell(t,wk);
  b.parentElement.className=`pw-c ${c}${wk===pjMon()?" cur":""} on`;b.innerHTML=r?`${r.plan?`<span class="pw-p">${esc(r.plan)}</span>`:""}${r.done?`<span class="pw-d">✓ ${esc(r.done)}</span>`:""}${r.issue?`<span class="pw-i">⚠ ${esc(r.issue)}</span>`:""}`:""}
/* ---------- → rhy:se (한 방향 · 본인이 골라서) ---------- */
function pjPlanV(p,t,o){return Object.assign({customer:p.data.customer||"",project:p.data.name,part:t._ph.name,task:t.name,ptask:t.name,due:t.due||"",memo:"",pid:p.id,tid:t.id},o||{})}
// 사업 관리 안에서 팝업으로: 요약을 보여 주고 고친 뒤 '작성' → 페이지를 넘기지 않고 rhy:se 업무로 저장 (보이지 않는 업무 창에 채워 저장)
// list: [{p,t,task?,memo?}] · 'rhy:se에서 열기'는 예전처럼 rhy:se 업무 창으로 넘어감 (pjOpenInApp)
function pjOpenInApp(list){if(!list.length)return;if(PM_MODE){pmGo("app",{k:"wk-pm-plan",v:list});return}pjFillPlan(list)}
const pjCatKey=()=>"wk-pm-cat-"+(st.me?st.me.email:"");
function pjToPlan(list){if(!list.length)return;let cat="";try{cat=localStorage.getItem(pjCatKey())||""}catch(_){}if(!catsList().includes(cat))cat="";
  PJ.send={wk:"this",rows:list.map(x=>({pid:x.p.id,tid:x.t.id,proj:x.p.data.name,cust:x.p.data.customer||"",ph:x.t._ph.name,tname:x.t.name,due0:x.t.due||"",task:x.task||x.t.name,memo:x.memo||"",cat,status:"진행",due:"",err:""}))};
  pjSendDue();pjSendPaint()}
const pjWkRange=w=>{const m=w==="next"?keyOf(addDays(parseKey(CUR),7)):CUR;return [m,pjAdd(m,4)]};
function pjSendDue(){const [m,f]=pjWkRange(PJ.send.wk);PJ.send.rows.forEach(r=>{let d=r.due0&&r.due0<=f?r.due0:f;if(d<m)d=m;if(PJ.send.wk==="this"&&d<todayKey)d=todayKey<=f?todayKey:f;r.due=d})}
function pjSendPaint(){const S=PJ.send;if(!S)return;const [m,f]=pjWkRange(S.wk),cats=catsList(),n=S.rows.length;
  pjModal(`<div class="pj-mh"><b>→ rhy:se ${S.wk==="next"?"다음 주":"이번 주"} 계획으로 ${n}건</b><span class="dim">${pjMD(m)}~${pjMD(f)} · 고칠 것만 고치고 작성하세요</span><span class="spacer"></span><button type="button" class="pj-x on" data-pjmclose="1" aria-label="닫기">✕</button></div>
    <div class="pj-mf"><div class="pj-seg"><button type="button" data-pjswk="this" aria-selected="${S.wk==="this"}">이번 주</button><button type="button" data-pjswk="next" aria-selected="${S.wk==="next"}">다음 주</button></div><span class="dim">사업 · 고객사 · 품목(대공정)은 저절로 채워져요. 옮긴 뒤엔 서로 따라가지 않아요</span></div>
    <div class="pj-mb">${S.rows.map((r,i)=>`<div class="pjs-r${r.err?" err":""}" data-pjsi="${i}"><div class="pjs-h"><span class="dim">📐 ${esc(r.proj)} · ${esc(r.ph)} · ${esc(r.tname||"(이름 없음)")}</span>${n>1?`<button type="button" class="pj-x on" data-pjsdel="${i}" aria-label="이 줄 빼기">✕</button>`:""}</div>
      <div class="pjs-g"><label class="w">할일<input data-pjsf="task" value="${esc(r.task)}" maxlength="200"></label><label>기한<input type="date" data-pjsf="due" value="${esc(r.due)}" min="${m}" max="${f}"></label>
      <label>구분<select data-pjsf="cat"><option value="">고르기</option>${cats.map(c=>`<option${c===r.cat?" selected":""}>${esc(c)}</option>`).join("")}</select></label>
      ${S.wk==="this"?`<label>상태<select data-pjsf="status">${["진행","대기","완료"].map(x=>`<option${x===r.status?" selected":""}>${x}</option>`).join("")}</select></label>`:`<label>상태<span class="pjs-st dim">다음 주 계획</span></label>`}
      <label class="w">메모<input data-pjsf="memo" value="${esc(r.memo)}" maxlength="500" placeholder="특이사항 · 참고"></label></div>${r.err?`<p class="err">${esc(r.err)}</p>`:""}</div>`).join("")}</div>
    <div class="pj-mft">${n===1?`<button type="button" class="btn sm ghost" data-pjsapp="1" title="rhy:se 업무 창을 열어 다른 칸까지 자세히 써요">rhy:se에서 열기</button>`:""}<span class="spacer"></span><button type="button" class="btn" data-pjmclose="1">취소</button><button type="button" class="btn primary" data-pjsgo="1"${S.busy?" disabled":""}>${S.busy?"작성 중…":`작성 ${n}건`}</button></div>`,"send")}
const pjSleep=ms=>new Promise(r=>setTimeout(r,ms));
async function pjSendSave(){const S=PJ.send;if(!S||S.busy)return;
  S.rows.forEach(r=>{r.err=!r.task.trim()?"할일을 적어 주세요":!r.cat?"구분을 골라 주세요":!r.due?"기한을 넣어 주세요":""});if(S.rows.some(r=>r.err)){pjSendPaint();return}
  if(!st.me||!myTeams().length){toast("rhy:se 업무를 쓸 수 있는 팀이 없어요");return}
  S.busy=true;pjSendPaint();try{localStorage.setItem(pjCatKey(),S.rows[S.rows.length-1].cat)}catch(_){}
  const keep={week:st.week,team:st.team};if(!canAddHere())st.team=myTeams()[0];st.week=CUR;document.documentElement.classList.add("pm-ghost");let ok=0;
  const sel=(id,v,nid)=>{const x=$(id);if(!x||!v)return;if([...x.options].some(o=>o.value===v)){x.value=v;x.dispatchEvent(new Event("change",{bubbles:true}))}else if(nid&&[...x.options].some(o=>o.value==="__new")){x.value="__new";x.dispatchEvent(new Event("change",{bubbles:true}));$(nid).hidden=false;$(nid).value=v}};
  for(const r of [...S.rows]){
    PJ.carry={from_pm:{pid:r.pid,tid:r.tid,project:r.proj,phase:r.ph,task:r.tname}};
    try{openDrawer(null,st.me.name);await pjSleep(80);
      sel("f-customer",r.cust,"f-customer-new");$("f-project").value=r.proj;$("f-project").dispatchEvent(new Event("change",{bubbles:true}));$("f-part").value=r.ph;sel("f-cat",r.cat,"f-cat-new");
      if(S.wk==="this"){$("w-task").value=r.task.trim();$("w-due").value=r.due;if($("w-start").value&&$("w-start").value>r.due)$("w-start").value=r.due;$("w-memo").value=r.memo.trim();
        const rb=document.querySelector(`input[name="w-status"][value="${r.status}"]`);if(rb){rb.checked=true;rb.dispatchEvent(new Event("change",{bubbles:true}))}}
      else{$("w-task").value="";$("n-task").value=r.task.trim();$("n-due").value=r.due;if($("n-start")&&$("n-start").value>r.due)$("n-start").value=r.due;$("n-memo").value=r.memo.trim()}
      try{d3Hint("w");d3Hint("n")}catch(_){}await pjSleep(40);$("saveBtn").click();
      let done=false;for(let i=0;i<30;i++){await pjSleep(120);if($("drawer").hidden){done=true;break}if(!$("formErr").hidden){r.err=$("formErr").textContent+" — rhy:se에서 열기로 자세히 써 주세요";break}}
      if(done){ok++;S.rows=S.rows.filter(x=>x!==r)}else{if(!r.err)r.err="저장하지 못했어요";closeAll()}}
    catch(x){r.err=(x&&x.hint)||errText(x);try{closeAll()}catch(_){}}
    PJ.carry=null}
  document.documentElement.classList.remove("pm-ghost");st.week=keep.week;if(keep.team!==st.team){st.team=keep.team}S.busy=false;
  if(ok)toast(`📐 rhy:se ${S.wk==="next"?"다음 주":"이번 주"} 계획에 ${ok}건 넣었어요 (rhy:se에서 📐 표시로 보여요)`);
  if(!S.rows.length){PJ.send=null;pjModalClose()}else pjSendPaint()}
// rhy:se 쪽: 사업 관리에서 넘어온 업무 표시 · 업무 창 안내
function pmBodyExtra(){const c=PJ.carry;PJ.carry=null;return c?JSON.parse(JSON.stringify(c)):null}
function pmTag(it){const f=it&&it.from_pm;return f?`<span class="pmtag" title="사업관리에서 넘어온 일정 · ${esc(f.project||"")} › ${esc(f.phase||"")} › ${esc(f.task||"")} (rhy:se에서 고쳐도 사업관리는 그대로예요)">📐</span>`:""}
function pmEditOpen(it){let n=$("pmFromNote");const f=it&&it.from_pm;
  if(!f){if(n)n.hidden=true;return}
  if(!n){n=document.createElement("div");n.id="pmFromNote";n.className="pm-from";const fm=$("form");fm.insertBefore(n,fm.firstChild)}
  n.hidden=false;n.innerHTML=`<b>📐 사업관리에서 넘어온 일정</b><span>${esc(f.project||"")} › ${esc(f.phase||"")} › ${esc(f.task||"")}</span><span class="dim">여기서 자유롭게 고쳐요. 사업관리 일정은 바뀌지 않아요.</span>`}
/* ---------- 팝업 틀 (기록 · 공지 · rhy:se 보내기) ---------- */
function pjModal(html,kind){pjEnsure();const m=$("pjModal"),b=$("pjMbox");const keep=b.querySelector(".pj-mb"),st0=keep?keep.scrollTop:0,same=m.dataset.k===kind&&!m.hidden;
  b.className="pj-mbox "+(kind||"");b.innerHTML=html;m.dataset.k=kind||"";m.hidden=false;document.documentElement.classList.add("pj-modal-on");if(same){const nb=b.querySelector(".pj-mb");if(nb)nb.scrollTop=st0}}
function pjModalClose(){const m=$("pjModal");if(!m||m.hidden)return;m.hidden=true;m.dataset.k="";document.documentElement.classList.remove("pj-modal-on");if(PJ.send&&!PJ.send.busy)PJ.send=null;if(PJ.ntcQ){PJ.ntcQ=null}pjRender()}
/* ---------- 📣 사업별 공지 (팀장이 사업을 골라 머리말로) ---------- */
const pjNtcSeenK=n=>"ntc|"+n.id;
function pjNtcUnseen(){const S=pjSeen();return PJ.notices.filter(n=>n.popup&&(n.updated_at||n.created_at)>(S[pjNtcSeenK(n)]||"")&&(n.created_at||"")>new Date(Date.now()-45*864e5).toISOString()&&pjProj(n.project_id))}
function pjNtcAuto(){if(!PJ.open||PJ.ntcShown||!st.me)return;const U=pjNtcUnseen();if(!U.length)return;if(document.querySelector("#pjModal:not([hidden])"))return;PJ.ntcShown=true;PJ.ntcQ=U.map(n=>n.id);pjNtcView(U[0].id)}
function pjNtcView(id){const n=PJ.notices.find(x=>x.id===id);if(!n){pjNtcBoard();return}const p=pjProj(n.project_id),Q=PJ.ntcQ,qi=Q?Q.indexOf(id):-1,lead=pjIsLead();
  pjModal(`<div class="pj-mh"><b>📣 사업 공지</b>${Q&&Q.length>1?`<span class="dim">${qi+1}/${Q.length}</span>`:""}<span class="spacer"></span><button type="button" class="pj-x on" data-pjmclose="1" aria-label="닫기">✕</button></div>
    <div class="pj-mb pj-ntv"><div class="pj-nth"><span class="pj-nhead">${esc(p?p.data.name:"")}</span><h3>${esc(n.title)}</h3><span class="dim">${esc(n.author_name||"")} · ${esc(fmtDT(n.updated_at||n.created_at))}</span></div><div class="pj-ntb fmt">${typeof fmtNotice==="function"?fmtNotice(n.body||""):esc(n.body||"").replace(/\n/g,"<br>")}</div></div>
    <div class="pj-mft">${lead?`<button type="button" class="btn sm ghost" data-pjntedit="${esc(n.id)}">고치기</button>`:""}<button type="button" class="btn sm ghost" data-pjntboard="1">공지 목록</button>${p?`<button type="button" class="btn sm ghost" data-pjntproj="${esc(p.id)}">사업 열기</button>`:""}<span class="spacer"></span><button type="button" class="btn primary" data-pjntok="${esc(n.id)}">${Q&&qi<Q.length-1?"확인 · 다음":"확인"}</button></div>`,"ntc");
  pjSeenSet(pjNtcSeenK(n))}
function pjNtcBoard(){PJ.ntcQ=null;const lead=pjIsLead(),S=pjSeen();
  pjModal(`<div class="pj-mh"><b>📣 사업 공지</b><span class="dim">${esc(teamName(PJ.team))} · 사업별로 팀장이 알려요</span><span class="spacer"></span>${lead&&PJ.list.length?`<button type="button" class="btn sm primary" data-pjntnew="1">+ 공지 쓰기</button>`:""}<button type="button" class="pj-x on" data-pjmclose="1" aria-label="닫기">✕</button></div>
    <div class="pj-mb">${PJ.notices.length?`<ul class="pj-ntl2">${PJ.notices.map(n=>{const p=pjProj(n.project_id),nw=(n.updated_at||n.created_at)>(S[pjNtcSeenK(n)]||"");return `<li><button type="button" data-pjntc="${esc(n.id)}"><span class="pj-nhead">${esc(p?p.data.name:"(지운 사업)")}</span><b>${esc(n.title)}</b>${nw?'<span class="nnew">NEW</span>':""}<span class="dim mono">${esc(fmtDT(n.updated_at||n.created_at).slice(2,10))}</span></button></li>`}).join("")}</ul>`:`<p class="hint" style="margin:18px 0;text-align:center">아직 사업 공지가 없어요${lead?" · + 공지 쓰기로 사업을 골라 알려요":""}</p>`}</div>`,"ntc")}
function pjNtcForm(id){const n=id?PJ.notices.find(x=>x.id===id):null,pid=n?n.project_id:(PJ.view==="proj"&&PJ.pid)||(PJ.list[0]||{}).id;
  pjModal(`<div class="pj-mh"><b>📣 ${n?"공지 고치기":"사업 공지 쓰기"}</b><span class="spacer"></span><button type="button" class="pj-x on" data-pjmclose="1" aria-label="닫기">✕</button></div>
    <form class="pj-mb pj-ntf" id="pjNtcForm" novalidate data-id="${esc(n?n.id:"")}"><label>사업 (머리말)<select id="pjNtP">${PJ.list.map(p=>`<option value="${esc(p.id)}"${p.id===pid?" selected":""}>${esc(p.data.name)}</option>`).join("")}</select></label>
      <label>제목<input id="pjNtT" maxlength="120" value="${esc(n?n.title:"")}" placeholder="예: PDR 회의 11/20(금)으로 변경합니다"></label>
      <label>내용<textarea id="pjNtB" maxlength="3000" rows="8" placeholder="다나까체로 써 주세요">${esc(n?n.body:"")}</textarea></label>
      <label class="pj-blank"><input type="checkbox" id="pjNtPop"${!n||n.popup?" checked":""}> 📐 사업 관리에 들어올 때 팝업으로 한 번 보여 주기</label><p class="err" id="pjNtErr" hidden></p></form>
    <div class="pj-mft">${n?`<button type="button" class="btn sm danger" data-pjntdel="${esc(n.id)}">지우기</button>`:""}<span class="spacer"></span><button type="button" class="btn" data-pjntboard="1">취소</button><button type="submit" form="pjNtcForm" class="btn primary">${n?"저장":"올리기"}</button></div>`,"ntc");setTimeout(()=>{const x=$("pjNtT");if(x)x.focus()},30)}

function pjFillPlan(v){const L=(Array.isArray(v)?v:[v]).filter(Boolean);if(!L.length)return;
  if(!canAddHere()){toast("내 팀 화면에서 넣을 수 있어요 (위쪽 팀 고르기에서 내 팀)");return}
  const one=(x,i)=>{PJ.carry=x.pid?{from_pm:{pid:x.pid,tid:x.tid,project:x.project,phase:x.part,task:x.ptask||x.task}}:null;openDrawer(null,st.me.name);
    {let sn=false;const cw=setInterval(()=>{if(!$("drawer").hidden)sn=true;else if(sn){clearInterval(cw);setTimeout(()=>{PJ.carry=null},100)}},300)}
    setTimeout(()=>{const cs=$("f-customer"),c=x.customer||"";
      if(c){if([...cs.options].some(o=>o.value===c))cs.value=c;else{cs.value="__new";cs.dispatchEvent(new Event("change",{bubbles:true}));$("f-customer-new").hidden=false;$("f-customer-new").value=c}}
      $("f-project").value=x.project;$("f-part").value=x.part;$("w-task").value=x.task;if(x.memo&&$("w-memo"))$("w-memo").value=x.memo;
      const fri=keyOf(addDays(parseKey(CUR),4));if(x.due){$("w-due").value=x.due<fri?(x.due<todayKey?todayKey:x.due):fri;try{d3Hint("w")}catch(_){}}
      $("f-project").dispatchEvent(new Event("change",{bubbles:true}));
      toast(L.length>1?`📐 ${i+1}/${L.length} 채워 뒀어요. 확인하고 저장하면 다음 것이 열려요 (사업 관리와는 따로 저장돼요)`:"📐 이번 주 할일로 채워 뒀어요. 확인하고 저장하세요 (사업 관리와는 따로 저장돼요)")},250);
    if(i+1<L.length){let seen=false;const w=setInterval(()=>{const open=!$("drawer").hidden;if(open)seen=true;else if(seen){clearInterval(w);setTimeout(()=>one(L[i+1],i+1),350)}},300)}};
  one(L[0],0)}
function pjPickBar(){const b=$("pjPickBar");if(!b)return;const on=!!(PJ.pick&&PJ.open&&PJ.view==="proj"&&PJ.sub==="tree");b.hidden=!on;if(!on)return;const n=PJ.pick.size;
  b.innerHTML=`<span><b>${n}</b>개 골랐어요</span><span class="dim">rhy:se 이번 주 계획으로 하나씩 채워 드려요. 옮긴 뒤엔 서로 따라가지 않아요</span><span class="spacer"></span><button type="button" class="btn sm" data-pja="pick">그만</button><button type="button" class="btn sm primary" data-pja="pickgo"${n?"":" disabled"}>→ rhy:se 이번 주 계획</button>`}
function pjExport(p){const d=p.data,k=pjKpi(p),e=s=>esc(s==null?"":String(s)),row=c=>`<tr>${c.map(x=>`<td>${x}</td>`).join("")}</tr>`,mon=pjMon(),W=[-1,0].map(i=>keyOf(addDays(parseKey(mon),i*7)));
  const N=t=>PJ.notes.filter(n=>n.project_id===p.id&&n.task_id===t.id).map(n=>`${n.is_review?"[검토] ":""}${n.author_name}: ${n.body}`).join(" / ");
  const wk=(t,w)=>{const r=pjWk(t.id,w);return r?[r.plan&&"할 것: "+r.plan,r.done&&"한 것: "+r.done,r.issue&&"특이: "+r.issue].filter(Boolean).join(" / "):""};
  let h=`<table border="1"><tr><td colspan="12"><b>${e(d.name)}</b> ${e(d.code)} · 고객 ${e(d.customer)} · ${e(d.start)} ~ ${e(d.end)} · 책임 ${e(pjName(p.owner_email))}</td></tr>
    <tr><td colspan="12">완료 ${k.done}/${k.n} · 준수 ${k.ok} · 미준수 ${k.miss} · 7일 이상 ${k.l7} · 지남 ${k.late} · 계획 달성율 ${k.rate==null?"-":k.rate+"%"} (기준일 ${todayKey})</td></tr>
    <tr><td><b>Milestone</b></td>${(d.phases||[]).map(ph=>`<td><b>${e(ph.name)}</b><br>${e(ph.start)}~${e(ph.due)}<br>${e(ph.deliverable)}</td>`).join("")}</tr></table><br>
    <table border="1"><tr>${["대공정","하부 공정","담당","시작","완료","산출물","완료일","차이(일)","상태",`지난주(${W[0]})`,`이번 주(${W[1]})`,"메모 · 검토 의견"].map(x=>`<th>${x}</th>`).join("")}</tr>`;
  (d.phases||[]).forEach(ph=>(ph.tasks||[]).forEach(t=>{const s=pjSt(p,t);h+=row([e(ph.name),e(t.name),e(pjName(t.owner_email)),e(t.start),e(t.due),e(t.deliverable),e(s.done||""),s.done&&t.due?String(pjDiff(s.done,t.due)):"",e(s.k==="done"?(s.ok===false?(s.late7?"미준수(7일 이상)":"미준수"):"준수"):s.t),e(wk(t,W[0])),e(wk(t,W[1])),e(N(t))])}));
  const blob=new Blob(["﻿<html><head><meta charset='utf-8'></head><body>"+h+"</table></body></html>"],{type:"application/vnd.ms-excel"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=`사업관리_${d.name}_${todayKey}.xls`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast("엑셀 파일을 받았어요")}
async function pjCreate(d,rid){const row={id:pjId(),team_id:PJ.team,owner_email:d.owner_email||st.me.email,created_by:st.me.email,data:{name:d.name,code:d.code||"",customer:d.customer||"",start:d.start,end:d.end}};
  await api.projSave(row,true);const its=d.blank?[]:pjFromTpl(row.id,d.start,d.end,row.owner_email);if(its.length)await api.projItemAdd(its);
  PJ.list.push(Object.assign({created_at:new Date().toISOString()},row));PJ.items.push(...its);pjBuild();
  if(rid){const pt={status:"accepted",project_id:row.id,decided_name:st.me.name};await api.projReqSet(rid,pt);const r=PJ.requests.find(x=>x.id===rid);if(r)Object.assign(r,pt,{decided_by:st.me.email,decided_at:new Date().toISOString()})}
  return row}
const pjPhOf=(p,el)=>{const r=el.closest("[data-ph]");return r&&(p.data.phases||[]).find(x=>x.id===r.dataset.ph)};
function pjStickTop(){const t=document.querySelector("#projPage .pj-top"),k=$("pjStick"),R=document.documentElement.style;if(t)R.setProperty("--pjtop",t.offsetHeight+"px");R.setProperty("--pjstick",(k&&PJ.view==="proj"?k.offsetHeight-2:0)+"px")}
addEventListener("resize",()=>{if(PJ.open)pjStickTop()});
function pjScrollTo(id){const r=document.querySelector(`#projPage [data-pjrow="${CSS.escape(id)}"]`),sk=$("pjStick");if(!r)return;
  const y=r.getBoundingClientRect().top+$("projPage").scrollTop-(sk?sk.offsetHeight:0)-(document.querySelector("#projPage .pj-top")||{offsetHeight:0}).offsetHeight-6;$("projPage").scrollTo({top:y,behavior:"smooth"});r.classList.add("pj-flash");setTimeout(()=>r.classList.remove("pj-flash"),1600)}
document.addEventListener("click",async e=>{
  const lg=e.target.closest("[data-pjlistgo]");if(lg){if(!e.target.closest("#projPage"))F("alertClose");if(lg.dataset.pjreq)pjSeenSet("req|"+lg.dataset.pjreq);if(!PM_MODE){pmGo("pm",{k:"wk-pm-goto",v:{view:"list"}});return}PJ.view="list";pjModalClose();pjOpen();return}
  const op=e.target.closest("[data-pjopen]");if(op&&!e.target.closest("#pjTree")){if(!e.target.closest("#projPage"))F("alertClose");if(op.dataset.pjreq)pjSeenSet("req|"+op.dataset.pjreq);if(!op.dataset.pjopen){PJ.view="list";pjRender();return}const tid=op.dataset.pjtask||null;
    if(tid)pjSeenSet(op.dataset.pjown?"own|"+op.dataset.pjopen+"|"+tid:op.dataset.pjopen+"|"+tid);
    if(!PM_MODE){pmGo("pm",{k:"wk-pm-goto",v:{pid:op.dataset.pjopen,tid}});return}pjOpen(op.dataset.pjopen,tid);return}
  const pg=e.target.closest("[data-pmgo]");if(pg){pmGo(pg.dataset.pmgo);return}
  if(e.target.closest("#pjAlert")){const b=$("alertBtn");if(b&&!b.hidden)b.click();else $("noticeBtn").click();return}
  if(!e.target.closest("#projPage"))return;
  if(e.target.closest("#pjBack")){pjClose();return}
  const ao=e.target.closest("[data-pjadmon],[data-pjadmoff]");if(ao){const on=!!ao.dataset.pjadmon,t=ao.dataset.pjadmon||ao.dataset.pjadmoff;
    if(!on&&ao.dataset.arm!=="1"){ao.dataset.arm="1";ao.textContent="한 번 더 누르면 꺼져요 (기록은 남아요)";setTimeout(()=>{ao.dataset.arm="";ao.textContent="이 팀에서 끄기"},3500);return}
    ao.disabled=true;try{await api.setTeamDevFor(t,on);try{st.teams=await api.teams()}catch(_){}PJ.loaded=false;PJ.list=[];await pjLoad();pjRender();pjPaint();toast(on?`📐 ${teamName(t)}에서 사업 관리를 켰어요. 팀 공지로 알렸어요`:`📐 ${teamName(t)}에서 사업 관리를 껐어요`)}catch(x){ao.disabled=false;toast((x&&x.hint)||errText(x))}return}
  if(e.target.id==="pjModal"||e.target.closest("[data-pjmclose]")){pjModalClose();return}
  if(e.target.closest("#pjNtc")){pjNtcBoard();return}
  if(e.target.closest("#pjNew")){PJ.nmode={k:pjCanNew()?"new":"req"};PJ.view="new";pjRender();setTimeout(()=>$("pjnName")&&$("pjnName").focus(),30);return}
  // 사업 목록 · 살펴볼 곳 · 요청
  const ls=e.target.closest("[data-pjls]");if(ls){const k=ls.dataset.pjls;PJ.lsort=PJ.lsort.k===k?{k,d:-PJ.lsort.d}:{k,d:["prog","late","rate","start","end"].includes(k)?-1:1};pjRender();return}
  const lf=e.target.closest("[data-pjlf]");if(lf){PJ.lfil=lf.dataset.pjlf;pjRender();return}
  const bf=e.target.closest("[data-pjbf]");if(bf){PJ.bfil=bf.dataset.pjbf;pjRender();return}
  const rj=e.target.closest("[data-pjrej]");if(rj){PJ.rej=rj.dataset.pjrej;pjRender();setTimeout(()=>$("pjRejWhy")&&$("pjRejWhy").focus(),30);return}
  if(e.target.closest("[data-pjrejno]")){PJ.rej=null;pjRender();return}
  const rk=e.target.closest("[data-pjrejok]");if(rk){const why=$("pjRejWhy").value.trim();if(!why){$("pjRejWhy").focus();toast("반려 사유를 적어 주세요");return}rk.disabled=true;
    try{const pt={status:"rejected",reason:why,decided_name:st.me.name};await api.projReqSet(rk.dataset.pjrejok,pt);Object.assign(PJ.requests.find(x=>x.id===rk.dataset.pjrejok)||{},pt,{decided_at:new Date().toISOString()});PJ.rej=null;pjRender();toast("반려했어요. 요청한 사람 🔔 알림에 사유가 보여요")}catch(x){rk.disabled=false;toast((x&&x.hint)||errText(x))}return}
  const ak=e.target.closest("[data-pjacc]");if(ak){const r=PJ.requests.find(x=>x.id===ak.dataset.pjacc);if(!r)return;ak.disabled=true;
    try{const row=await pjCreate(Object.assign({},r.data,{owner_email:(r.data||{}).owner_email||r.requester_email}),r.id);PJ.view="proj";PJ.pid=row.id;PJ.sub="tree";pjRender();toast(`✋ 수락했어요. 📐 ${row.data.name} 사업이 만들어졌어요`)}catch(x){ak.disabled=false;toast((x&&x.hint)||errText(x))}return}
  const ae=e.target.closest("[data-pjacce]");if(ae){PJ.nmode={k:"accept",rid:ae.dataset.pjacce};PJ.view="new";pjRender();return}
  const rd=e.target.closest("[data-pjrqdel]");if(rd){try{await api.projReqDel(rd.dataset.pjrqdel);PJ.requests=PJ.requests.filter(x=>x.id!==rd.dataset.pjrqdel);pjRender();toast("요청을 취소했어요")}catch(x){toast((x&&x.hint)||errText(x))}return}
  // 공지
  const nc=e.target.closest("[data-pjntc]");if(nc){if(!e.target.closest("#pjModal"))PJ.ntcQ=null;pjNtcView(nc.dataset.pjntc);return}
  const nk=e.target.closest("[data-pjntok]");if(nk){const Q=PJ.ntcQ,i=Q?Q.indexOf(nk.dataset.pjntok):-1;if(Q&&i>=0&&i<Q.length-1){pjNtcView(Q[i+1]);return}pjModalClose();return}
  if(e.target.closest("[data-pjntboard]")){pjNtcBoard();return}
  if(e.target.closest("[data-pjntnew]")){pjNtcForm(null);return}
  const ne=e.target.closest("[data-pjntedit]");if(ne){pjNtcForm(ne.dataset.pjntedit);return}
  const np=e.target.closest("[data-pjntproj]");if(np){pjModalClose();pjOpen(np.dataset.pjntproj);return}
  const nx=e.target.closest("[data-pjntdel]");if(nx){if(nx.dataset.arm!=="1"){nx.dataset.arm="1";nx.textContent="한 번 더 누르면 지워져요";setTimeout(()=>{nx.dataset.arm="";nx.textContent="지우기"},3000);return}
    try{await api.projNoticeDel(nx.dataset.pjntdel);PJ.notices=PJ.notices.filter(n=>n.id!==nx.dataset.pjntdel);pjNtcBoard();toast("공지를 지웠어요")}catch(x){toast((x&&x.hint)||errText(x))}return}
  // 바뀐 기록 팝업
  const lk=e.target.closest("[data-pjlogk]");if(lk){PJ.logf.k=lk.dataset.pjlogk;pjLogModal(pjProj(PJ.pid));return}
  const li=e.target.closest("[data-pjlogi]");if(li){const id=li.dataset.pjlogi;pjModalClose();PJ.sub="tree";const it=pjItem(id);if(it&&it.parent_id)PJ.fold.delete(it.parent_id);pjRender();pjScrollTo(id);return}
  // rhy:se 보내기 팝업
  const sw=e.target.closest("[data-pjswk]");if(sw&&PJ.send){PJ.send.wk=sw.dataset.pjswk;pjSendDue();pjSendPaint();return}
  const sd=e.target.closest("[data-pjsdel]");if(sd&&PJ.send){PJ.send.rows.splice(+sd.dataset.pjsdel,1);pjSendPaint();return}
  if(e.target.closest("[data-pjsgo]")){pjSendSave();return}
  if(e.target.closest("[data-pjsapp]")&&PJ.send){const r=PJ.send.rows[0],p=pjProj(r.pid),t=p&&pjTasks(p).find(x=>x.id===r.tid);PJ.send=null;pjModalClose();if(t)pjOpenInApp([pjPlanV(p,t,{task:r.task,memo:r.memo,due:r.due,pid:r.pid,tid:r.tid})]);return}
  const v=e.target.closest("[data-pjv]");if(v){PJ.view=v.dataset.pjv;PJ.info=false;PJ.pick=null;pjRender();return}
  const sb2=e.target.closest("[data-pjsub]");if(sb2){PJ.sub=sb2.dataset.pjsub;PJ.pick=null;PJ.wcell=null;pjRender();return}
  const go=e.target.closest("[data-pjgo]");if(go){const id=go.dataset.pjgo;PJ.fold.delete(id);if(PJ.sub!=="tree"){PJ.sub="tree"}pjRender();pjScrollTo(id);return}
  const gt=e.target.closest("[data-pjgot]");if(gt){PJ.sub="tree";pjRender();pjScrollTo(gt.dataset.pjgot);return}
  const fo=e.target.closest("[data-pjfold]");if(fo){const id=fo.dataset.pjfold;PJ.fold.has(id)?PJ.fold.delete(id):PJ.fold.add(id);pjRender();return}
  const th=e.target.closest("[data-pjthr]");if(th){const id=th.dataset.pjthr;PJ.thr=PJ.thr===id?null:id;if(PJ.thr)pjSeenSet(PJ.pid+"|"+id);pjRender();paintNoticeDot();if(PJ.thr)setTimeout(()=>$("pjNote")&&$("pjNote").focus(),30);return}
  const ns=e.target.closest("[data-pjnsend]");if(ns){const body=$("pjNote").value.trim();if(!body){$("pjNote").focus();return}const p=pjProj(PJ.pid);ns.disabled=true;
    try{const row={id:"pn"+newId(),project_id:p.id,task_id:ns.dataset.pjnsend,author_email:st.me.email,author_name:st.me.name,is_review:!!pjReviewer(p),body};await api.projNoteAdd(row);PJ.notes.push(Object.assign({created_at:new Date().toISOString()},row));pjSeenSet(p.id+"|"+row.task_id);pjRender();toast(row.is_review?"검토 의견을 남겼어요. 담당자 🔔 알림에 보여요":"메모를 남겼어요")}
    catch(x){ns.disabled=false;toast((x&&x.hint)||errText(x))}return}
  const nd=e.target.closest("[data-pjndel]");if(nd){try{await api.projNoteDel(nd.dataset.pjndel);PJ.notes=PJ.notes.filter(n=>n.id!==nd.dataset.pjndel);pjRender()}catch(x){toast(errText(x))}return}
  const pl=e.target.closest("[data-pjplan]");if(pl){const p=pjProj(PJ.pid),t=pjTasks(p).find(x=>x.id===pl.dataset.pjplan);if(t)pjToPlan([{p,t}]);return}
  const pl2=e.target.closest("[data-pjplan2]");if(pl2){const [a,b]=pl2.dataset.pjplan2.split("|"),p=pjProj(a),t=p&&pjTasks(p).find(x=>x.id===b);if(t)pjToPlan([{p,t}]);return}
  const wp=e.target.closest("[data-pjwplan]");if(wp){const [tid,wk]=wp.dataset.pjwplan.split("|"),p=pjProj(PJ.pid),t=pjTasks(p).find(x=>x.id===tid),r=pjWk(tid,wk)||{};if(!t)return;
    pjToPlan([{p,t,task:r.plan||t.name,memo:r.issue||""}]);if(PJ.send&&wk>CUR){PJ.send.wk="next";pjSendDue();pjSendPaint()}return}
  const d2=e.target.closest("[data-pjdone2]");if(d2){const [a,b]=d2.dataset.pjdone2.split("|");d2.disabled=true;await pjSaveMark(a,b,true);return}
  const wkb=e.target.closest("[data-pjweek]");if(wkb){const [a,b]=wkb.dataset.pjweek.split("|");PJ.view="proj";PJ.pid=a;PJ.sub="week";PJ.wk0=0;PJ.wfil="all";PJ.wcell=b+"|"+pjMon();pjRender();pjScrollTo(b);setTimeout(()=>{const x=document.querySelector('.pw-box [data-pjwf="plan"]');if(x)x.focus()},350);return}
  const wf=e.target.closest("[data-pjwfil]");if(wf){PJ.wfil=PJ.wfil===wf.dataset.pjwfil&&wf.classList.contains("pw-who")?"all":wf.dataset.pjwfil;PJ.wcell=null;pjRender();return}
  const wn=e.target.closest("[data-pjwk]");if(wn){const n=+wn.dataset.pjwk;PJ.wk0=n?PJ.wk0+n:0;PJ.wcell=null;pjRender();return}
  const wc=e.target.closest("[data-pjw]");if(wc){const k=wc.dataset.pjw;PJ.wcell=PJ.wcell===k?null:k;pjRender();if(PJ.wcell)setTimeout(()=>{const x=document.querySelector('.pw-box [data-pjwf="plan"]');if(x&&!x.readOnly)x.focus()},30);return}
  if(e.target.closest("[data-pjwclose]")){PJ.wcell=null;pjRender();return}
  const pk=e.target.closest("[data-pjpick]");if(pk){const id=pk.dataset.pjpick;pk.checked?PJ.pick.add(id):PJ.pick.delete(id);pk.closest("tr").classList.toggle("picked",pk.checked);pjPickBar();return}
  const ac=e.target.closest("[data-pja]");if(!ac)return;const k=ac.dataset.pja,p=pjProj(PJ.pid);if(!p)return;
  if(k==="xls"){pjExport(p);return}
  if(k==="info"){PJ.info=!PJ.info;pjRender();return}
  if(k==="log"){PJ.logf={who:"",k:""};pjLogModal(p);return}
  if(k==="pick"){PJ.pick=PJ.pick?null:new Set();pjRender();return}
  if(k==="pickgo"){const T=pjTasks(p).filter(t=>PJ.pick.has(t.id));PJ.pick=null;pjRender();pjToPlan(T.map(t=>({p,t})));return}
  if(k==="delproj"){if(!pjCanInfo(p))return;if(ac.dataset.arm!=="1"){ac.dataset.arm="1";ac.textContent="한 번 더 누르면 사업이 지워져요";setTimeout(()=>{ac.dataset.arm="";ac.textContent="사업 지우기"},3500);return}
    try{await api.projDel(p.id);PJ.list=PJ.list.filter(x=>x!==p);PJ.items=PJ.items.filter(i=>i.project_id!==p.id);PJ.info=false;PJ.view="list";pjRender();toast("사업을 지웠어요")}catch(x){toast((x&&x.hint)||errText(x))}return}
  if(!pjMember(p))return;const D=p.data;
  if(k==="addph"){const mx=Math.max(0,...(D.phases||[]).map(ph=>(pjItem(ph.id)||{}).sort||0)),row={id:pjId(),project_id:p.id,parent_id:null,sort:mx+1,name:"",owner_email:st.me.email,start_date:null,end_date:D.end||null,deliverable:null,done_at:null};
    await pjAddRows([row]);pjRender();pjScrollTo(row.id);setTimeout(()=>{const i=document.querySelector(`tr[data-k="ph"][data-ph="${CSS.escape(row.id)}"] [data-pjf="phname"]`);if(i)i.focus({preventScroll:true})},380);return}
  const ph=pjPhOf(p,ac);if(!ph)return;
  if(k==="addtask"){const mx=Math.max(0,...(ph.tasks||[]).map(t=>(pjItem(t.id)||{}).sort||0)),row={id:pjId(),project_id:p.id,parent_id:ph.id,sort:mx+1,name:"",owner_email:st.me.email,start_date:ph.start||null,end_date:ph.due||null,deliverable:null,done_at:null};
    pjAddRows([row]);pjRender();const i=document.querySelector(`tr[data-t="${CSS.escape(row.id)}"] [data-pjf="tname"]`);if(i)i.focus();return}
  if(k==="deltask"||k==="delph"){if(ac.dataset.arm!=="1"){ac.dataset.arm="1";ac.textContent=k==="delph"?"한 번 더 (하부 공정까지 빠져요)":"한 번 더";ac.classList.add("arm");setTimeout(()=>{ac.dataset.arm="";ac.textContent="✕";ac.classList.remove("arm")},3000);return}
    const ids=k==="delph"?[ph.id,...(ph.tasks||[]).map(t=>t.id)]:[ac.closest("[data-t]").dataset.t];await pjDelRows(ids);pjRender();return}});
document.addEventListener("change",e=>{if(!e.target.closest||!e.target.closest("#projPage"))return;
  const dn=e.target.closest("[data-pjdone]");if(dn){pjSaveMark(PJ.pid,dn.dataset.pjdone,dn.checked);return}
  const p=pjProj(PJ.pid);if(!p)return;const D=p.data,x=e.target;
  if(x.dataset.pji){if(!pjCanInfo(p))return;if(x.dataset.pji==="owner")p.owner_email=x.value;else D[x.dataset.pji]=x.value.trim();if(x.dataset.pji==="name"&&!D.name){toast("사업명을 넣어 주세요");return}pjSaveInfo(p);return}
  if(!pjMember(p))return;const f=x.dataset.pjf;if(!f)return;const ph=pjPhOf(p,x);if(!ph)return;
  const tr=x.closest("[data-t]"),id=f.startsWith("ph")?ph.id:tr&&tr.dataset.t;if(!id)return;
  const M={phname:"name",tname:"name",phdel:"deliverable",tdel:"deliverable",phstart:"start_date",tstart:"start_date",phdue:"end_date",tdue:"end_date",phowner:"owner_email",towner:"owner_email"},col=M[f];if(!col)return;
  let val=x.value.trim()||null;if(col==="name")val=val||"";
  const it=pjItem(id);if(col==="end_date"&&val&&it&&it.start_date&&val<it.start_date){toast("완료일이 시작일보다 빨라서 시작일도 같이 바꿨어요");pjSet(id,{start_date:val,end_date:val});pjRender();return}
  if(col==="start_date"&&val&&it&&it.end_date&&val>it.end_date){toast("시작일이 완료일보다 늦어서 완료일도 같이 바꿨어요");pjSet(id,{start_date:val,end_date:val});pjRender();return}
  pjSet(id,{[col]:val});if(col!=="name"&&col!=="deliverable")pjRender()});
document.addEventListener("change",async e=>{const x=e.target;if(x.id!=="pjAdmTeam")return;try{localStorage.setItem(PJAK(),x.value)}catch(_){}PJ.view="list";PJ.pid=null;PJ.loaded=false;PJ.list=[];PJ.ntcShown=false;await pjLoad();pjRender()});
document.addEventListener("change",e=>{const x=e.target;if(!x.closest||!x.closest("#pjModal"))return;
  if(x.id==="pjLogWho"){PJ.logf.who=x.value;pjLogModal(pjProj(PJ.pid));return}
  const f=x.dataset.pjsf,r=x.closest("[data-pjsi]");if(f&&r&&PJ.send){const row=PJ.send.rows[+r.dataset.pjsi];if(row){row[f]=x.value;if(row.err){row.err="";r.classList.remove("err");const er=r.querySelector(".err");if(er)er.remove()}}}});
document.addEventListener("input",e=>{const x=e.target;if(!x.closest||!x.closest("#projPage"))return;
  if(x.id==="pjLq"){PJ.lq=x.value;const pos=x.selectionStart;pjRender();const y=$("pjLq");if(y){y.focus();try{y.setSelectionRange(pos,pos)}catch(_){}}return}
  const f=x.dataset.pjsf,r=x.closest("[data-pjsi]");if(f&&r&&PJ.send){const row=PJ.send.rows[+r.dataset.pjsi];if(row)row[f]=x.value}});
document.addEventListener("input",e=>{const x=e.target;if(!x.matches||!x.matches(".pw-box [data-pjwf]")||x.readOnly||!PJ.wcell)return;const [tid,wk]=PJ.wcell.split("|");pjWeekSave(PJ.pid,tid,wk)});
// Enter 로 다음 칸 · 하부 공정 이름에서 Enter 면 아래에 새 하부 공정
document.addEventListener("keydown",e=>{const x=e.target;if(!x.closest||!x.closest("#pjTree")||e.key!=="Enter"||e.isComposing||!x.matches("input.pj-in"))return;e.preventDefault();x.blur();
  if(x.dataset.pjf==="tname"||x.dataset.pjf==="phname"){const r=x.closest("tr"),b=r&&document.querySelector(`tr.pj-addr[data-ph="${CSS.escape(r.dataset.ph)}"] [data-pja="addtask"]`);if(b&&x.value.trim())setTimeout(()=>b.click(),30)}});
// ⋮⋮ 끌어서 순서 바꾸기 (마우스 · 손가락). 하부 공정은 다른 대공정으로도 옮김
const pjGroup=(tb,ph)=>[...tb.rows].filter(r=>r.dataset.ph===ph&&(r.dataset.k||r.classList.contains("pj-addr")));
function pjFlipMove(tb,rows,ref){const all=[...tb.rows],y=new Map(all.map(r=>[r,r.getBoundingClientRect().top]));
  rows.forEach(x=>tb.insertBefore(x,ref));
  all.forEach(r=>{if(rows.includes(r))return;const d=y.get(r)-r.getBoundingClientRect().top;if(!d)return;r.style.transition="none";r.style.transform=`translateY(${d}px)`;r.getBoundingClientRect();r.style.transition="transform .2s cubic-bezier(.2,.8,.2,1)";r.style.transform=""})}
document.addEventListener("pointerdown",e=>{const g=e.target.closest&&e.target.closest("#pjTree [data-grip]");if(!g||e.button>0)return;const p=pjProj(PJ.pid);if(!p||!pjMember(p))return;e.preventDefault();
  const tbl=$("pjTree"),tb=tbl.tBodies[0];tb.querySelectorAll(".pj-thr").forEach(r=>r.remove());PJ.thr=null;
  const row=g.closest("tr"),kind=g.dataset.grip,grp=kind==="ph"?pjGroup(tb,row.dataset.ph):[row],r0=row.getBoundingClientRect(),tr=tbl.getBoundingClientRect();
  const fl=document.createElement("div");fl.className="pj-float";const ft=document.createElement("table");ft.className="pj-tree";ft.style.width=tr.width+"px";
  const fb=document.createElement("tbody");grp.slice(0,6).forEach(r=>{const c=r.cloneNode(true);c.querySelectorAll("[id]").forEach(x=>x.removeAttribute("id"));[...c.cells].forEach((td,i)=>{td.style.width=r.cells[i]?r.cells[i].getBoundingClientRect().width+"px":""});fb.appendChild(c)});
  ft.appendChild(fb);fl.appendChild(ft);fl.style.left=tr.left+"px";fl.style.top=r0.top+"px";document.body.appendChild(fl);
  grp.forEach(r=>r.classList.add("pj-hole"));
  Object.assign(PJDG,{on:true,p,kind,id:kind==="ph"?row.dataset.ph:row.dataset.t,grp,fl,tb,offY:e.clientY-r0.top,y0:e.clientY,moved:false,sig:[...tb.rows].map(r=>r.dataset.t||r.dataset.ph||"").join()});
  document.documentElement.classList.add("pj-dragging");try{g.setPointerCapture(e.pointerId)}catch(_){}});
document.addEventListener("pointermove",e=>{if(!PJDG.on)return;if(Math.abs(e.clientY-PJDG.y0)>3)PJDG.moved=true;
  PJDG.fl.style.top=(e.clientY-PJDG.offY)+"px";
  const pg=$("projPage"),R=pg.getBoundingClientRect();if(e.clientY<R.top+160)pg.scrollTop-=10;else if(e.clientY>R.bottom-50)pg.scrollTop+=10;
  const tb=PJDG.tb,G=PJDG.grp,x=Math.min(Math.max(e.clientX,tb.getBoundingClientRect().left+60),tb.getBoundingClientRect().right-60),el=document.elementFromPoint(x,e.clientY),r=el&&el.closest&&el.closest("#pjTree tbody tr");
  if(!r||G.includes(r))return;const b=r.getBoundingClientRect(),mid=b.top+b.height/2;
  if(PJDG.kind==="t"){let ref=null;
    if(r.dataset.k==="t")ref=e.clientY<mid?r:r.nextSibling;
    else if(r.dataset.k==="ph"){if(e.clientY<mid&&r.previousSibling&&!G.includes(r.previousSibling)){const pv=r.previousSibling;ref=pv.classList.contains("pj-addr")?pv:r}else ref=r.nextSibling}
    else if(r.classList.contains("pj-addr"))ref=r;else return;
    if(ref===G[0]||(ref&&ref.previousSibling===G[0]&&ref!==r.nextSibling&&false))return;if(G[0].nextSibling===ref)return;pjFlipMove(tb,G,ref)}
  else{const ph=r.dataset.ph;if(!ph||ph===PJDG.id)return;const T=pjGroup(tb,ph),top=T[0].getBoundingClientRect().top,bot=T[T.length-1].getBoundingClientRect().bottom,before=e.clientY<(top+bot)/2;
    const ref=before?T[0]:T[T.length-1].nextSibling;if(before&&G[G.length-1].nextSibling===T[0])return;if(!before&&T[T.length-1].nextSibling===G[0])return;pjFlipMove(tb,G,ref)}});
function pjDragEnd(){if(!PJDG.on)return;PJDG.on=false;document.documentElement.classList.remove("pj-dragging");
  const {kind,grp,fl,tb,moved,sig}=PJDG,p=pjProj(PJDG.p.id)||PJDG.p;
  const t0=grp[0].getBoundingClientRect().top,f0=parseFloat(fl.style.top)||t0;
  const fin=()=>{fl.remove();grp.forEach(r=>r.classList.remove("pj-hole"))};
  if(fl.animate&&Math.abs(f0-t0)>2){const a=fl.animate([{top:f0+"px"},{top:t0+"px"}],{duration:150,easing:"cubic-bezier(.2,.8,.2,1)"});a.onfinish=fin;setTimeout(fin,260)}else fin();
  const now=[...tb.rows].map(r=>r.dataset.t||r.dataset.ph||"").join();if(!moved||now===sig)return;
  // 화면 순서 그대로 대공정 ▸ 하부 공정을 다시 엮어 저장 (접힌 대공정의 하부 공정은 그대로)
  const ph0=p.data.phases||[],phM=new Map(ph0.map(x=>[x.id,x])),tM=new Map(ph0.flatMap(x=>(x.tasks||[]).map(t=>[t.id,t]))),L=[];let cur=null;
  [...tb.rows].forEach(r=>{if(r.dataset.k==="ph"){const ph=phM.get(r.dataset.ph);if(!ph)return;cur={ph,tasks:PJ.fold.has(ph.id)?[...(ph.tasks||[])]:[]};L.push(cur)}else if(r.dataset.k==="t"&&cur){const t=tM.get(r.dataset.t);if(t&&!cur.tasks.includes(t))cur.tasks.push(t)}});
  p.data.phases=L.map(x=>Object.assign(x.ph,{tasks:x.tasks}));
  setTimeout(()=>{pjSyncOrder(p);pjRender();toast(kind==="ph"?"대공정 순서를 바꿨어요":"순서를 바꿨어요")},160)}
document.addEventListener("pointerup",pjDragEnd);
document.addEventListener("mouseover",e=>{if(!PJ.open||PJDG.on||PJ.view!=="proj"||!e.target.closest)return;const r=e.target.closest("#pjBody [data-ph]");const ph=r?r.dataset.ph:null;if(ph===PJ.hl)return;PJ.hl=ph;
  document.querySelectorAll("#projPage .pj-msi.hl,#projPage .pj-phhl").forEach(x=>x.classList.remove("hl","pj-phhl"));if(!ph)return;
  const m=document.querySelector(`#projPage .pj-msi[data-pjgo="${CSS.escape(ph)}"]`);if(m)m.classList.add("hl");document.querySelectorAll(`#pjBody [data-ph="${CSS.escape(ph)}"]`).forEach(x=>x.classList.add("pj-phhl"))});document.addEventListener("pointercancel",pjDragEnd);
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="pjNote"&&!e.isComposing){e.preventDefault();const b=document.querySelector("[data-pjnsend]");if(b)b.click()}
  if(e.key==="Escape"&&PJ.open&&document.querySelector("#pjModal:not([hidden])")){if(!(PJ.send&&PJ.send.busy))pjModalClose();return}
  if(e.key==="Escape"&&PJ.open&&!document.querySelector(".drawer:not([hidden]),.modal:not([hidden])")){if(PJ.wcell){PJ.wcell=null;pjRender();return}if(PJ.pick){PJ.pick=null;pjRender();return}pjClose()}});
document.addEventListener("submit",async e=>{if(e.target.id!=="pjNewForm")return;e.preventDefault();
  const mode=e.target.dataset.mode,err=m=>{$("pjnErr").textContent=m;$("pjnErr").hidden=false};
  const d={name:$("pjnName").value.trim(),code:$("pjnCode").value.trim(),customer:$("pjnCust").value.trim(),start:$("pjnStart").value,end:$("pjnEnd").value,owner_email:$("pjnOwner").value||st.me.email,blank:$("pjnBlank").checked};
  if(!d.name){err("사업명을 넣어 주세요.");$("pjnName").focus();return}if(!d.start||!d.end||d.end<d.start){err("시작일과 완료 예정일을 확인해 주세요.");return}
  const sb=e.target.querySelector('[type="submit"]');sb.disabled=true;
  try{if(mode==="req"){d.memo=($("pjnMemo")||{value:""}).value.trim();const row={id:"rq"+pjId(),team_id:PJ.team,requester_email:st.me.email,requester_name:st.me.name,data:d,status:"pending"};
      await api.projReqAdd(row);PJ.requests.unshift(Object.assign({created_at:new Date().toISOString()},row));PJ.nmode=null;PJ.view="list";pjRender();toast("✋ 팀장에게 사업 추가를 요청했어요. 수락되면 🔔 알림으로 알려 드려요");return}
    if(!pjCanNew()){err("사업은 팀장이 만들어요.");sb.disabled=false;return}
    const rid=mode==="accept"?PJ.nmode&&PJ.nmode.rid:null;const row=await pjCreate(d,rid);PJ.nmode=null;PJ.view="proj";PJ.pid=row.id;PJ.sub="tree";pjRender();
    toast(rid?`✋ 수락했어요. 📐 ${d.name} 사업이 만들어졌어요`:d.blank?`📐 ${d.name} 사업을 만들었어요. + 대공정으로 시작해요`:`📐 ${d.name} 사업을 만들었어요. 기본 대공정 ${PJ_TPL.length}개가 들어갔어요`)}
  catch(x){sb.disabled=false;err((x&&x.hint)||errText(x))}});
document.addEventListener("submit",async e=>{if(e.target.id!=="pjNtcForm")return;e.preventDefault();const id=e.target.dataset.id,err=m=>{$("pjNtErr").textContent=m;$("pjNtErr").hidden=false};
  const row={project_id:$("pjNtP").value,title:$("pjNtT").value.trim(),body:$("pjNtB").value.trim(),popup:$("pjNtPop").checked};if(!row.project_id){err("사업을 골라 주세요.");return}if(!row.title){err("제목을 넣어 주세요.");$("pjNtT").focus();return}
  try{if(id){await api.projNoticeSave(Object.assign({id},row),false);const n=PJ.notices.find(x=>x.id===id);Object.assign(n,row,{updated_at:new Date().toISOString()});pjSeenSet(pjNtcSeenK(n));toast("공지를 고쳤어요")}
    else{const n=Object.assign({id:"pn"+pjId(),team_id:PJ.team,author_email:st.me.email,author_name:st.me.name},row);await api.projNoticeSave(n,true);const now=new Date().toISOString();PJ.notices.unshift(Object.assign(n,{created_at:now,updated_at:now}));pjSeenSet(pjNtcSeenK(n));toast("📣 사업 공지를 올렸어요. 팀원이 📐 에 들어오면 한 번 보여요")}
    pjNtcBoard();pjRender()}catch(x){err((x&&x.hint)||errText(x))}});
/* ---------- 🧩 기능 더하기 → 우리 팀 설정 (팀장) ---------- */
function projModCard(){if(!pmLicensed()||!st.me||st.me.role!=="leader"||st.me.is_admin||!st.me.team_id)return "";const on=pjTeamOn(st.me.team_id);
  return `<div class="modc team${on?" on":""}"><div class="modi">📐</div><div class="modb"><b>사업 관리</b><p>개발사업마다 대공정 ▸ 하부 공정 일정을 팀이 함께 적고, 주차별 계획 · 실적과 간트로 진행을 봐요. 필요한 일정은 각자 rhy:se 이번 주 계획으로 옮겨요.</p><span class="hint" style="margin:0">켜면 우리 팀 모두에게 📐 사업 관리가 보이고, 📣 팀 공지로 알려져요</span></div>
    <label class="modt"><span class="switch"><input type="checkbox" data-pjteam="1"${on?" checked":""}><i></i></span><span>${on?"켜짐":"꺼짐"}</span></label></div>`}
document.addEventListener("change",async e=>{const x=e.target;if(!x.matches||!x.matches("[data-pjteam]"))return;const on=x.checked;x.disabled=true;
  try{await api.setTeamDev(on);try{st.teams=await api.teams()}catch(_){}PJ.loaded=false;pjPaint();toast(on?"📐 사업 관리를 켰어요. 팀 공지로 알렸어요":"📐 사업 관리를 껐어요. 팀 공지로 알렸어요");F("openMods");loadNotice()}
  catch(err){x.checked=!on;toast((err&&err.hint)||errText(err))}finally{x.disabled=false}});
// 처음에 한 번, 이후 3분마다 (사업 관리 화면이 열려 있으면 1분마다: 다른 사람이 고친 것 맞추기)
setTimeout(()=>{if(pjTeam())pjLoad()},5000);
setInterval(()=>{if(!st.me||!pjTeam()||document.visibilityState!=="visible"||PJDG.on)return;PJ.tick=(PJ.tick||0)+1;if(!PJ.open&&PJ.tick%3)return;
  if(document.querySelector("#projPage input:focus,#projPage textarea:focus,#projPage select:focus"))return;pjLoad()},60000);
if(PM_MODE){document.documentElement.classList.add("pm-mode");document.title="사업 관리 · rhy:se"}
// rhy:se 로 넘어온 '→ rhy:se'는 화면이 다 열린 뒤에 꼭 한 번 확인 (첫 그리기가 불러오기보다 먼저 끝나는 경우)
if(!PM_MODE){let n=0;const t=setInterval(()=>{n++;let has=false;try{has=!!sessionStorage.getItem("wk-pm-plan")}catch(_){}if(!has||n>60){clearInterval(t);return}if(st.me&&st.loaded){clearInterval(t);pjPaint()}},500)}
wkFeat("proj",{projPaint:pjPaint,projModCard,projAlertCount,projAlertsHtml,pjOpen,pjClose,pmBodyExtra,pmTag,pmEditOpen});
