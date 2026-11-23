/* rhy:se Weekly Plan — 📐 사업 관리 (feat-proj.js, v3.22.0 · v4.0.0 에서 가벼운 부분만)
   개발사업의 일정을 함께 관리하는 별도 모듈 (연구소 요청). rhy:se 는 개인별 업무 정리, 이건 그중 개발사업의 일정
   · 정보 흐름은 한 방향: 사업 관리 → rhy:se (개인이 필요한 일정만 골라 '이번 주 계획'으로 옮김). rhy:se → 사업 관리 없음
   · 사업 만들기: 팀장(그 팀) · 관리자. 대공정 · 하부 공정 · 일정 · 담당 · 산출물 · 완료 · 주차별 계획/실적: 그 팀 사람 누구나
   · 사업 정보 고치기 · 지우기: 책임자 · 팀장 · 관리자 / 검토 의견: 팀장 · 책임자 (메모는 누구나)
   · 화면: 공정 · 일정(트리) / 주차별 계획 · 실적(하부 공정 × 주, 할 것 · 한 것 · 특이사항) / 간트 / 🕘 바뀐 기록
   · 공정은 한 줄씩 저장(바꾼 칸만) → 여러 명이 동시에 고쳐도 덮어쓰지 않음. 바뀐 기록은 서버가 남김
   서버: 17-projects.sql + 18-projects-v2.sql. 이 파일이 고장 나도 주간 업무는 그대로 */
/* /pm/ 분리 (v3.21.0): 같은 사이트의 다른 주소(weekly/pm/)에서 열림 (로그인 그대로, 같은 창 전환)
   사용권: 회사(wk_company.modules.pm · 관리자) 하나 — v3.33.0 부터 팀별 켜기 없음(모든 팀). 미리보기에서는 주소 대신 #pm 으로 흉내
   🤝 v3.33.0 팀 함께 쓰기(참여 팀 · 협의 · Co-work 탭)는 feat-pmco.js. 여기선 F("pmco…")로만 부름 */
/* v4.0.0 정리: 늘 읽는 가벼운 부분(이 파일) / 사업관리 화면(pm.js · pm.css, 열 때 wkPart("pm")로 불러옴)으로 나눔
   이 파일: 상태(PJ) · 권한 · 데이터 읽기 · 🔔 알림 · rhy:se 쪽 표시(📐 태그 · 미리 세운 계획 · 넘어온 일정 채우기) · 열고 닫기
   pm.js: 화면 그리기 · 고치기 · 팝업 · 끌기. pm.js 가 없을 때 부르는 곳은 typeof 로 확인함 */
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
  sub:"tree",wk0:0,wfil:"all",wcell:null,pick:null,pend:{},notices:[],requests:[],app:{},approver:{},inbox:[],trash:[],dreq:null,lsort:{k:"start",d:-1},lfil:"active",lq:"",bfil:"all",nmode:null,send:null,logf:{who:"",k:""},ntcQ:null,ntcShown:false};
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
const pjTeamOn=id=>pmLicensed()&&!!id;   // v3.33.0: 회사가 쓰면 모든 팀 (팀별 켜기 없앰, 11/19 결정)
// 모듈을 쓸 팀: 지금 보는 팀이 켜져 있으면 그 팀, 아니면 내 팀(겸직 포함) 중 켜진 팀
// 관리자: 소속 팀이 없어도 📐 이 보이고, 화면 위에서 팀을 골라 봄 (안 켠 팀이면 그 자리에서 켜기)
const PJAK=()=>"wk-pm-admin-team-"+(st.me?st.me.email:"");
const pjCeo=()=>typeof isCeo==="function"&&isCeo();
// 볼 수 있는 팀: 관리자 = 모든 팀 / 대표 · 상급자 = 내 팀 + 맡은 팀 중 📐 켠 팀 / 팀원 = 내 팀 중 켠 팀
function pjViewTeams(){if(!st.me)return [];if(st.me.is_admin)return (st.teams||[]).map(t=>t.id);
  return [...new Set([...myTeams(),...(st.vteams||[]),...(pjCeo()?(st.teams||[]).map(t=>t.id):[])])].filter(pjTeamOn)}
const pjMulti=()=>!!st.me&&(st.me.is_admin||pjViewTeams().length>1);
function pjTeam(){if(!st.me||!pmLicensed())return null;
  if(st.me.is_admin){let a="";try{a=localStorage.getItem(PJAK())||""}catch(_){}const T=st.teams||[];
    if(a&&T.some(t=>t.id===a))return a;if(st.team&&pjTeamOn(st.team))return st.team;const on=T.find(t=>pjTeamOn(t.id));return on?on.id:(T[0]||{}).id||null}
  const V=pjViewTeams();if(!V.length)return null;let a="";try{a=localStorage.getItem(PJAK())||""}catch(_){}
  if(a&&V.includes(a))return a;if(st.team&&V.includes(st.team))return st.team;return myTeams().find(t=>V.includes(t))||V[0]}
const pjProj=id=>PJ.list.find(p=>p.id===id);
const pjTasks=p=>((p&&p.data.phases)||[]).flatMap(ph=>(ph.tasks||[]).map(t=>Object.assign({},t,{_ph:ph})));
const pjItem=id=>PJ.items.find(i=>i.id===id);
const pjMark=(pid,tid)=>pjItem(tid);   // 완료일은 공정 줄에 (done_at)
// 권한: 그 팀 사람(겸직 포함)은 공정을 고침 · 정보/지우기는 책임자 · 팀장 · 관리자 · 사업 만들기는 팀장
const pjBossOf=t=>!!(st.me&&t&&(st.vteams||[]).includes(t)&&!isMyTeam(t));   // 그 팀 위 조직장 (연구소장 등)
const pjMember=p=>!!(st.me&&p&&(st.me.is_admin||pjCeo()||isMyTeam(p.team_id)||pjBossOf(p.team_id)));
// 🤝 수락한 참여 팀 사람: 하부 공정 넣기 + 본인 담당 줄만 (feat-pmco)
const pjPt=p=>!pjMember(p)&&!!F("pmcoPartner",p);
const pjRowEd=(p,t)=>pjMember(p)||(pjPt(p)&&!!t&&t.owner_email===st.me.email);
const pjCanEdit=pjMember,pjCanMark=p=>pjMember(p);
const pjCanInfo=p=>!!(st.me&&p&&(st.me.is_admin||pjCeo()||p.owner_email===st.me.email||(st.me.role==="leader"&&p.team_id===st.me.team_id)||pjBossOf(p.team_id)));
// 사업 지우기 결재: 그 팀의 상급자 · 대표 (서버가 알려 줌, 팀마다 한 번)
const pjCanApp=t=>!!(PJ.app[t]);
const pjBossAny=()=>!!st.me&&(pjCeo()||(st.vteams||[]).some(t=>!isMyTeam(t)));
const pjCanNew=()=>!!(st.me&&PJ.team&&(st.me.is_admin||(st.me.role==="leader"&&st.me.team_id===PJ.team)||pjBossOf(PJ.team)));   // 팀장 + 상급자(v3.33.0)
const pjReviewer=p=>pjCanInfo(p)||(st.me&&st.me.role==="leader")||isBoss()||pjCeo();
const pjIsCeoEmail=e=>!!(e&&CO&&CO.ceo&&CO.ceo.email&&String(CO.ceo.email).toLowerCase()===String(e).toLowerCase());
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
    if(!(t in PJ.app)){try{PJ.app[t]=await api.canApprove(t)}catch(_){PJ.app[t]=false}}
    if(!(t in PJ.approver)){try{PJ.approver[t]=await api.projApprover(t)}catch(_){PJ.approver[t]=null}}
    if(pjBossAny()||Object.values(PJ.app).some(Boolean)||st.me.is_admin){try{PJ.trash=await api.projTrash()}catch(_){PJ.trash=[]}}
    try{PJ.inbox=await api.projInbox()}catch(_){PJ.inbox=[]}
    PJ.list=r.projects||[];PJ.items=r.items||[];PJ.weeks=r.weeks||[];PJ.notes=r.notes||[];PJ.log=r.log||[];PJ.notices=r.notices||[];PJ.requests=r.requests||[];PJ.links=r.links||[];PJ.talk=r.talk||[];PJ.dir=d||[];PJ.err="";pjBuild();PJ.loaded=true;if(typeof pjNtcAuto==="function")pjNtcAuto()}
  catch(x){PJ.loaded=true;PJ.err=(x&&x.hint)||errText(x)}
  paintNoticeDot();if(PJ.open&&typeof pjRender==="function"&&!document.querySelector("#projPage input:focus,#projPage textarea:focus,#projPage select:focus"))pjRender()}
// 담당자로 넣을 수 있는 사람: 📐 켠 팀 사람만
const pjPeople=()=>PJ.dir.slice();
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
  const RQ=[...PJ.requests,...PJ.inbox.filter(x=>!PJ.requests.some(y=>y.id===x.id))];
  const D=RQ.filter(r=>r.requester_email===me&&r.status!=="pending"&&(r.decided_at||"")>(S["req|"+r.id]||S.own0)).map(r=>({k:"reqd",r}));
  Q.splice(0,Q.length,...Q.filter(x=>(x.r.kind||"create")==="create"));
  const DQ=PJ.inbox.filter(r=>r.kind==="delete"&&r.status==="pending"&&r.requester_email!==me&&!st.me.is_admin).map(r=>({k:"dreq",r}));
  return N.concat(O,Q,DQ,D)}
const r_isDel=r=>r&&r.kind==="delete";
function projAlertCount(){return pjNews().length+(F("pmcoAlertCount")||0)}
function projAlertsHtml(){const row=(attrs,b,sub,btn)=>`<div class="walr k-share"><span class="wlv">📐</span><button type="button" class="wtx" ${attrs}>${b}<span class="wsub">${sub}</span></button><span class="wact"><button type="button" class="btn sm" ${attrs}>${btn||"보기"}</button></span></div>`;
  return pjNews().map(x=>{
  if(x.k==="req"){const r=x.r,d=r.data||{};return row(`data-pjlistgo="1"`,`<b>사업 추가 요청 · ${esc(r.requester_name||"")}</b> · ${esc(d.name||"")}`,`${esc(d.customer||"")}${d.customer?" · ":""}${pjMD(d.start)}~${pjMD(d.end)} · 수락하면 바로 만들어져요`,"검토")}
  if(x.k==="dreq"){const r=x.r,d=r.data||{};return row(`data-pjinbox="1"`,`<b>사업 삭제 요청 · ${esc(r.requester_name||"")}</b> · ${esc(d.name||"")}`,`${esc(teamName(r.team_id))} · 사유: ${esc(r.reason||"")}`,"검토")}
  if(x.k==="reqd"&&r_isDel(x.r)){const r=x.r,d=r.data||{},ok=r.status==="accepted";return row(`data-pjlistgo="1" data-pjreq="${esc(r.id)}"`,`<b>사업 삭제 요청 ${ok?"승인":"반려"}</b> · ${esc(d.name||"")}`,ok?`${esc(r.decided_name||"상급자")}님이 승인해 휴지통으로 옮겼어요`:`사유: ${esc(r.reason||"-")}`)}
  if(x.k==="reqd"){const r=x.r,d=r.data||{},ok=r.status==="accepted";return row(ok?`data-pjopen="${esc(r.project_id||"")}" data-pjreq="${esc(r.id)}"`:`data-pjlistgo="1" data-pjreq="${esc(r.id)}"`,`<b>사업 추가 요청 ${ok?"수락":"반려"}</b> · ${esc(d.name||"")}`,ok?`${esc(r.decided_name||"팀장")}님이 수락해서 사업이 만들어졌어요`:`사유: ${esc(r.reason||"-")}`)}
  if(x.k==="own"){const l=x.l,p=pjProj(l.project_id);return row(`data-pjopen="${esc(l.project_id)}" data-pjtask="${esc(l.item_id||"")}" data-pjown="1"`,`<b>담당 · ${esc(l.by_name||"")}</b> · '${esc(l.item_name||"")}' 담당을 나로 정했어요`,esc(p.data.name))}
  const n=x.n,p=pjProj(n.project_id),t=pjTasks(p).find(y=>y.id===n.task_id);
  return row(`data-pjopen="${esc(n.project_id)}" data-pjtask="${esc(n.task_id||"")}"`,`<b>${n.is_review?"검토 의견":"메모"} · ${esc(n.author_name||"")}</b> · ${esc(n.body.slice(0,60))}`,`${esc(p.data.name)}${t?" · "+esc(t.name):""}`)}).join("")+FS("pmcoAlertsHtml")}
// 📐 미리 세운 계획: 사업관리에서 넘어온 뒤 아직 표에 안 보이는(다다음 주 이후에 시작하는) 내 업무 → 눌러서 그 주로 (v3.29.0)
function pjAheadPaint(){let b=$("pjAhead");const sm=$("summary");if(!sm)return;const W=st.week,N=nextKey(W),me=st.me&&st.me.email;
  const L=me&&st.view==="write"?st.items.filter(i=>i._email===me&&i.from_pm&&i.weeks).map(i=>{const ks=Object.keys(i.weeks).sort();return ks.length&&ks[0]>N?ks[0]:null}).filter(Boolean).sort():[];
  if(!L.length){if(b)b.hidden=true;return}
  if(!b){b=document.createElement("button");b.type="button";b.id="pjAhead";b.className="pj-ahead";sm.insertAdjacentElement("afterend",b);b.onclick=()=>{const k=b.dataset.k;if(!k)return;st.week=k;render();try{wkIn(wkCur(),1)}catch(_){}}}
  b.hidden=false;b.dataset.k=L[0];b.innerHTML=`<span>📐 미리 세운 계획 <b>${L.length}</b>건</span><span class="dim">사업관리 일정대로 ${pjMD(L[0])} 주부터 보여요</span><span aria-hidden="true">›</span>`;b.title="사업관리에서 넘긴 일 중 아직 시작 전인 일이에요. 그 주가 오면 표와 보고서에 나와요. 누르면 그 주로 가요"}
function pjPaint(){const on=!!pjTeam();try{pjAheadPaint()}catch(_){}if(on)pjPreload();
  let b=$("projBtn");if(!b&&on){const rb=$("reportBtn");if(rb){b=document.createElement("button");b.className="btn";b.id="projBtn";b.type="button";b.title="개발사업 일정 (주간 업무와 따로)";b.textContent="📐 사업 관리";rb.insertAdjacentElement("afterend",b);b.onclick=()=>pmGo("pm")}}
  if(b)b.hidden=!on;
  let m=$("miProj");if(!m&&on){const mm=$("miMods");if(mm){m=document.createElement("button");m.type="button";m.setAttribute("role","menuitem");m.id="miProj";m.textContent="📐 사업 관리";mm.insertAdjacentElement("beforebegin",m);m.onclick=()=>{$("userMenu").hidden=true;pmGo("pm")}}}
  if(m)m.hidden=!on;
  if(on&&!PJ.loaded&&!PJ.busy){PJ.busy=true;pjLoad().finally(()=>{PJ.busy=false})}
  if(PM_MODE&&st.me&&st.loaded&&!PJ.open){const g=pmTake("wk-pm-goto")||{};if(g.view)PJ.view=g.view;if(g.co)PJ.coAfter=g.co;pjOpen(g.pid,g.tid)}
  if(!PM_MODE&&st.me&&st.loaded&&!PJ.planWait){const pl=pmTake("wk-pm-plan");if(pl){PJ.planWait=setInterval(()=>{   // 팝업 공지 · 다른 창이 닫힌 뒤에 채움
    if(!$("drawer").hidden||!$("noticeModal").hidden||!$("mscrim").hidden||!canAddHere())return;clearInterval(PJ.planWait);PJ.planWait=null;pjFillPlan(pl)},400)}}
  return true}
// 열기: 사업관리 화면(pm.js · pm.css)을 불러온 뒤 (처음 한 번만 받음)
function pjOpen(pid,tid){if(PJ.opening&&!pid)return PJ.opening;return PJ.opening=wkPart("pm").then(()=>pmOpen(pid,tid)).catch(()=>{}).finally(()=>{PJ.opening=null})}
function pjClose(){if(!PJ.open)return;if(PM_MODE){pmGo("app");return}PJ.open=false;if($("projPage"))$("projPage").hidden=true;document.documentElement.classList.remove("pj-on");paintNoticeDot()}
// rhy:se 쪽: 사업 관리에서 넘어온 업무 표시 · 업무 창 안내
function pmBodyExtra(){const c=PJ.carry;PJ.carry=null;return c?JSON.parse(JSON.stringify(c)):null}   // c.weeks 가 있으면 업무 창의 주별 칸 대신 그대로 (사업관리 일정 그대로, v3.29.0)
function pmTag(it){const f=it&&it.from_pm;return f?`<span class="pmtag" title="사업관리에서 넘어온 일정 · ${esc(f.project||"")} › ${esc(f.phase||"")} › ${esc(f.task||"")} (rhy:se에서 고쳐도 사업관리는 그대로예요)">📐</span>`:""}
function pmEditOpen(it){let n=$("pmFromNote");const f=it&&it.from_pm;
  if(!f){if(n)n.hidden=true;return}
  if(!n){n=document.createElement("div");n.id="pmFromNote";n.className="pm-from";const fm=$("form");fm.insertBefore(n,fm.firstChild)}
  n.hidden=false;n.innerHTML=`<b>📐 사업관리에서 넘어온 일정</b><span>${esc(f.project||"")} › ${esc(f.phase||"")} › ${esc(f.task||"")}</span><span class="dim">여기서 자유롭게 고쳐요. 사업관리 일정은 바뀌지 않아요.</span>`}
/* ---------- 팝업 틀 (기록 · 공지 · rhy:se 보내기) ---------- */
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
// 🔔 알림 · 목록에서 사업으로 가는 단추 (rhy:se 화면에서도 눌리도록 늘 읽는 쪽에)
document.addEventListener("click",e=>{
  const ib=e.target.closest("[data-pjinbox]");if(ib){if(!e.target.closest("#projPage"))F("alertClose");if(!PM_MODE){pmGo("pm",{k:"wk-pm-goto",v:{view:"inbox"}});return}PJ.view="inbox";if(typeof pjModalClose==="function")pjModalClose();pjOpen();return}
  const lg=e.target.closest("[data-pjlistgo]");if(lg){if(!e.target.closest("#projPage"))F("alertClose");if(lg.dataset.pjreq)pjSeenSet("req|"+lg.dataset.pjreq);if(!PM_MODE){pmGo("pm",{k:"wk-pm-goto",v:{view:"list"}});return}PJ.view="list";if(typeof pjModalClose==="function")pjModalClose();pjOpen();return}
  const op=e.target.closest("[data-pjopen]");if(op&&!e.target.closest("#pjTree")){if(!e.target.closest("#projPage"))F("alertClose");if(op.dataset.pjreq)pjSeenSet("req|"+op.dataset.pjreq);if(!op.dataset.pjopen){PJ.view="list";if(typeof pjRender==="function")pjRender();return}const tid=op.dataset.pjtask||null;
    if(tid)pjSeenSet(op.dataset.pjown?"own|"+op.dataset.pjopen+"|"+tid:op.dataset.pjopen+"|"+tid);
    if(!PM_MODE){pmGo("pm",{k:"wk-pm-goto",v:{pid:op.dataset.pjopen,tid}});return}pjOpen(op.dataset.pjopen,tid);return}});
// 사업관리를 쓰는 회사면 로그인 뒤 잠시 있다가 화면을 미리 받아 둠 (누르면 바로 열림)
let pjPre=false;function pjPreload(){if(pjPre||!pjTeam())return;pjPre=true;setTimeout(()=>{wkPart("pm").catch(()=>{pjPre=false})},PM_MODE?0:2500)}

/* ---------- 🧩 기능 더하기 → 우리 팀 설정 (팀장) ---------- */
function projModCard(){return ""}   // v3.33.0: 팀별 켜기 없앰 (회사가 쓰면 모든 팀)
function projTeamText(){return ""}
wkFeat("proj",{pjRender:()=>{if(typeof pjRender==="function")pjRender()},projPaint:pjPaint,projModCard,projTeamText,projAlertCount,projAlertsHtml,pjOpen,pjClose,pmBodyExtra,pmTag,pmEditOpen});
