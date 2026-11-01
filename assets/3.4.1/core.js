/* rhy:se Weekly Plan — 모든 사람이 쓰는 화면 (업무 작성·점검·공지·로그인) */
let REPORT_BG="img/report-bg.jpg";


/* ================= 주간 업무 보고서 (별도 화면) =================
   팀원: 내 보고서 → 보고용 체크(업무에 report[주] 표시)
   팀장: 팀 보고서 → 최종 보고 체크(wk_reports) → PPT 내보내기
   금요일 작성 기준: 작성 주(W) = 보고서의 '지난주 실적', 다음 주(N) = '이번주 계획' */
let RP_DEPTS=["영업","구매","생산기술","가공","연구소","생산본부","원가관리","고객품질","구미기술","경영지원"];
var rp={open:false,tab:"mine",week:null,final:null,finalFor:"",saving:0,busy:false};

const CATS=["수검","출장검사","성적서","고객사 대응","불량·클레임","시정조치","품보","심사·감사","기타"];
const DEFAULT_LISTS={members:["한규철","김용진","김년수","한현호","이석희","김지민","유선영","문지원"],customers:["한화시스템","STX엔진","한화에어로스페이스","미래시스템","유니온","동아일렉콤","머큐리","국방기술진흥연구소","기타업체","내부"],vendors:[],cats:[...CATS]};
// 3주 간트 보기: 코드와 데이터는 그대로 두고 화면에서만 숨김 (다시 보이게 하려면 true)
const SHOW_GANTT=false;
const PALETTE_N=12;
// 공휴일 (날짜만 빨간색) — 출처: kholidayz.com 2026·2027
const HOLIDAYS=new Set(["2026-01-01","2026-02-16","2026-02-17","2026-02-18","2026-03-01","2026-03-02","2026-05-01","2026-05-05","2026-05-24","2026-05-25","2026-06-03","2026-06-06","2026-07-17","2026-08-15","2026-08-17","2026-09-24","2026-09-25","2026-09-26","2026-10-03","2026-10-05","2026-10-09","2026-12-25",
"2027-01-01","2027-02-06","2027-02-07","2027-02-08","2027-02-09","2027-03-01","2027-05-01","2027-05-03","2027-05-05","2027-05-13","2027-06-06","2027-07-17","2027-07-19","2027-08-15","2027-08-16","2027-09-14","2027-09-15","2027-09-16","2027-10-03","2027-10-04","2027-10-09","2027-10-11","2027-12-25","2027-12-27"]);
// 담당자 색: 목록 관리에서 고른 색 + 아직 안 고른 사람은 남은 색을 차례로
function personColors(){
  const ex=st.lists.colors||{},out={},used=new Set();
  st.lists.members.forEach(m=>{const c=ex[m];if(Number.isInteger(c)&&c>=0&&c<PALETTE_N&&!used.has(c)){out[m]=c;used.add(c)}});
  let k=0;st.lists.members.forEach(m=>{if(out[m]!=null)return;while(used.has(k%PALETTE_N)&&used.size<PALETTE_N)k++;out[m]=k%PALETTE_N;used.add(k%PALETTE_N);k++});
  return out;
}
const pcol=(map,name)=>map[name]!=null?map[name]:PALETTE_N-1;
const catsList=()=>st.lists.cats&&st.lists.cats.length?st.lists.cats:CATS;
const LIST_INFO={projects:{label:"대상사업",field:"project",hint:"",ph:"새 대상사업"},members:{label:"팀원 색",field:"owner",hint:"팀원 명단은 등록 담당자가 관리해요. 여기서는 내 색만 고를 수 있고, 고른 색은 모두에게 똑같이 보여요.",ph:""},
  customers:{label:"고객사",field:"customer",hint:"'내부'는 고객사가 없는 팀 내부 업무용이라 지울 수 없어요.",ph:"새 고객사 이름"},
  vendors:{label:"협력사",field:"vendor",hint:"업무를 쓸 때 협력사 칸에서 고르는 목록이에요. 가나다순으로 보여요.",ph:"새 협력사 이름"},
  cats:{label:"구분",field:"category",hint:"업무를 쓸 때 고르는 구분이에요. ↑↓로 고르는 순서를 바꿀 수 있어요.",ph:"새 구분 이름"}};
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,"0");
const keyOf=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parseKey=k=>{const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const mondayOf=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
const rangeOf=k=>{const m=parseKey(k),f=addDays(m,4);return `${m.getFullYear()}.${pad(m.getMonth()+1)}.${pad(m.getDate())} ~ ${pad(f.getMonth()+1)}.${pad(f.getDate())}`};
const shortRange=k=>{const m=parseKey(k),f=addDays(m,4);return `${pad(m.getMonth()+1)}.${pad(m.getDate())}–${pad(f.getMonth()+1)}.${pad(f.getDate())}`};
const shortDate=s=>{if(!s)return"";const [,m,d]=s.split("-");return `${+m}/${+d}`};
const weeksBetween=(a,b)=>Math.round((parseKey(b)-parseKey(a))/6048e5);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const todayKey=keyOf(new Date());
const CUR=keyOf(mondayOf(new Date()));
const prevKey=k=>keyOf(addDays(parseKey(k),-7));
const nextKey=k=>keyOf(addDays(parseKey(k),7));
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

const st={items:[],loaded:false,lists:DEFAULT_LISTS,week:CUR,owner:store.get("wk-owner")||"전체",cat:"전체",cust:"전체",status:null,q:"",
  view:store.get("wk-view")==="review"?"review":"write",moreOpen:false,layout:(v=>v==="cal"||v==="month"?"month":v==="gantt"?"gantt":v==="list"?"list":"table")(store.get("wk-layout")),month:null,mSel:null,doneMode:["hide","recent","all"].includes(store.get("wk-done"))?store.get("wk-done"):(store.get("wk-alldone")==="1"?"all":"recent"),canWrite:true,db:null,editing:null,popFor:null,me:null,team:null,teams:[],people:[]};
const isMine=it=>!!it&&!!st.me&&it._email===st.me.email;
const isMineId=id=>isMine(st.items.find(i=>i._id===id));
const canAddHere=()=>!!st.me&&st.team===st.me.team_id;

/* ---------- derived rows ---------- */
function buildRows(){
  const W=st.week,P=prevKey(W),N=nextKey(W);
  const out=[];
  for(const it of st.items){
    const w=it.weeks||{};
    let prev=w[P]||null,prevWk=P;
    if(!prev){const ks=Object.keys(w).filter(k=>k<P).sort();if(ks.length){prevWk=ks[ks.length-1];prev=w[prevWk]}}
    let cur=w[W]||null;
    if(!cur&&prev&&prev.status!=="완료")cur={task:prev.task,due:prev.due,status:prev.status,memo:"",carried:true};
    const nxt=w[N]||null;
    if(!cur&&!w[P]&&!nxt){
      // 끝난 일: 실제 이번주 기준 최근 2주 안에 끝난 건 앞으로의 주에서도 보이고, 스위치를 켜면 전부 보임
      if(!prev)continue;
      const anchorP=prevKey(W<CUR?W:CUR);
      if(!(st.doneMode==="all"||prevWk>=anchorP))continue;
    }
    const late=!!(cur&&cur.due&&cur.due<todayKey&&cur.status!=="완료");
    // 대기 연속 주수
    let waitN=0;
    if(cur&&cur.status==="대기"){
      const ks=Object.keys(w).filter(k=>k<=W).sort().reverse();
      let start=W;
      for(const k of ks){if(w[k].status==="대기")start=k;else break}
      waitN=weeksBetween(start,W)+1;
    }
    const isNew=!!it.createdAt&&keyOf(mondayOf(new Date(it.createdAt)))===W;
    out.push({it,prev,prevWk,stale:!!prev&&prevWk!==P,cur,nxt,late,waitN,isNew});
  }
  const mi=n=>{const i=st.lists.members.indexOf(n);return i<0?999:i};
  // 담당자 안에서: 남은 일을 '언제까지'가 가까운 순으로, 끝난 일은 맨 아래
  // 0: 남은 일, 1: 이번주에 완료한 일, 2: 그 전에 끝난 일
  const doneGrp=r=>(r.cur&&r.cur.status!=="완료")||(!r.cur&&r.nxt)?0:(r.cur&&r.cur.status==="완료")?1:2;
  const dueOf=r=>(r.cur&&r.cur.status!=="완료"&&r.cur.due)||(!r.cur&&r.nxt&&r.nxt.due)||(r.cur&&r.cur.due)||(r.prev&&r.prev.due)||"9999-12-31";
  out.sort((a,b)=>mi(a.it.owner)-mi(b.it.owner)||(a.it.owner||"").localeCompare(b.it.owner||"","ko")||doneGrp(a)-doneGrp(b)||dueOf(a).localeCompare(dueOf(b))||(a.it.owner||"").localeCompare(b.it.owner||"","ko")||(a.it.customer||"").localeCompare(b.it.customer||"","ko")||(a.it.project||"").localeCompare(b.it.project||"","ko")||(a.it.po||"").localeCompare(b.it.po||""));
  return out;
}
function passFilters(r,ignoreStatus){
  const it=r.it;
  if(st.owner!=="전체"&&it.owner!==st.owner)return false;
  if(st.cat!=="전체"&&it.category!==st.cat)return false;
  if(st.cust!=="전체"&&it.customer!==st.cust)return false;
  if(st.q){const hay=[it.project,it.part,it.po,it.vendor,it.customer,r.cur&&r.cur.task,r.prev&&r.prev.task,r.nxt&&r.nxt.task].join(" ").toLowerCase();if(!hay.includes(st.q.toLowerCase()))return false}
  if(!ignoreStatus&&st.status){
    if(st.status==="이월")return !!(r.cur&&r.cur.carried);
    if(st.status==="신규")return r.isNew;
    if(st.status==="기한 지남")return r.late;
    if(st.status==="오래 대기")return r.waitN>=2;
    return !!(r.cur&&r.cur.status===st.status);
  }
  return true;
}
const pill=(s,sm)=>s?`<span class="pill ${esc(s)}${sm?" sm":""}">${esc(s)}</span>`:"";
const vendorHtml=v=>v==="확인 필요"?`<span class="ck">협력사 미입력</span>`:esc(v);
const fixVendorBtn=id=>isMineId(id)?`<button type="button" class="ck ckbtn" data-fixv="${esc(id)}" title="눌러서 바로 입력">협력사 미입력</button>`:`<span class="ck">협력사 미입력</span>`;

/* ---------- render ---------- */
function render(){
  if(typeof rp!=="undefined"&&rp&&rp.open){renderReport();return}
  const W=st.week,P=prevKey(W);
  const diff=weeksBetween(CUR,W);
  $("weekTitle").textContent=diff===0?"이번주":diff<0?`${-diff}주 전`:`${diff}주 후`;
  $("weekRange").textContent=rangeOf(W);
  $("tab-write").setAttribute("aria-selected",st.view==="write");$("tab-review").setAttribute("aria-selected",st.view==="review");
  $("writeView").hidden=st.view!=="write";$("reviewView").hidden=st.view!=="review";
  const owners=["전체",...st.lists.members];
  paintOwnerChips(owners);
  fillSelect($("catFilter"),["전체",...new Set([...catsList(),...st.items.map(i=>i.category).filter(Boolean)])],st.cat);
  fillSelect($("custFilter"),["전체",...new Set([...st.lists.customers,...st.items.map(i=>i.customer).filter(Boolean)])],st.cust);
  const nf=(st.cat!=="전체")+(st.cust!=="전체");
  $("moreBtn").textContent=nf?`필터 ${nf}`:"필터";
  $("moreBtn").setAttribute("aria-expanded",st.moreOpen);$("moreFilters").hidden=!st.moreOpen;

  document.querySelectorAll("[data-done]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.done===st.doneMode));
  const all=buildRows();
  const base=all.filter(r=>passFilters(r,true));
  if(st.view==="review"){renderReview(base);return}

  const cnt={진행:0,대기:0,완료:0,"신규":0,"이월":0,"기한 지남":0,"오래 대기":0};
  for(const r of base){if(r.cur)cnt[r.cur.status]++;if(r.isNew)cnt["신규"]++;if(r.cur&&r.cur.carried)cnt["이월"]++;if(r.late)cnt["기한 지남"]++;if(r.waitN>=2)cnt["오래 대기"]++}
  const cls={진행:"prog",대기:"wait",완료:"done","신규":"new","이월":"need","기한 지남":"late","오래 대기":"wait"};
  $("summary").innerHTML=Object.keys(cnt).map(k=>`<button class="stat ${cls[k]}" aria-pressed="${st.status===k}" data-status="${esc(k)}"><b class="mono">${cnt[k]}</b><span>${esc(k)}</span></button>`).join("")+(st.status?`<button class="btn ghost" data-status="">전체 보기</button>`:"");
  $("sampleBanner").hidden=true;
  $("clearSamples").disabled=!st.canWrite;

  // header
  const N=nextKey(W),isCur=W===CUR;
  $("thead").innerHTML="";
  const headRow=`<tr class="group ghead"><th><b>업무</b>사업 · 품목 · 협력사</th>
    <th class="sep"><b>${isCur?"지난주":"이전 주"}</b><span class="mono">${shortRange(P)}</span></th>
    <th class="sep wk"><b>${isCur?"이번주":"선택한 주"}</b><span class="mono">${shortRange(W)}</span></th>
    <th class="sep nx"><b>${isCur?"다음주":"다음 주"}</b><span class="mono">${shortRange(N)}</span></th></tr>`;
  const cols=4;
  if(!st.loaded)return;
  const shown=base.filter(r=>passFilters(r,false));
  // 끝난 일 숨기기: 이번주 완료 + 예전에 끝난 일 (단, '완료' 요약을 눌렀을 때는 보여줌)
  const isDoneRow=r=>(r.cur&&r.cur.status==="완료")||(!r.cur&&!r.nxt);
  const rows=st.doneMode==="hide"&&st.status!=="완료"?shown.filter(r=>!isDoneRow(r)):shown;
  const extra=[...new Set(rows.map(r=>r.it.owner).filter(o=>o&&!st.lists.members.includes(o)))];
  const groups=st.owner!=="전체"?[st.owner]:[...st.lists.members,...extra];
  if(st.layout==="gantt"&&!SHOW_GANTT)st.layout="month";
  $("ganttBtn").hidden=!SHOW_GANTT;
  document.querySelectorAll("[data-layout]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.layout===st.layout));
  $("tableView").hidden=st.layout!=="table";$("calView").hidden=st.layout!=="gantt";$("monthView").hidden=st.layout!=="month";$("listView").hidden=st.layout!=="list";

  $("weekNav").hidden=false;$("thisWeek").textContent=st.layout==="month"?"이번달로":"이번주로";$("prevWeek").setAttribute("aria-label",st.layout==="month"?"이전 달":"이전 주");$("nextWeek").setAttribute("aria-label",st.layout==="month"?"다음 달":"다음 주");
  if(st.layout==="gantt"){renderCal(rows,shown,groups);return}
  if(st.layout==="month"){renderMonth();if(typeof fitMonth==="function")fitMonth();return}
  if(st.layout==="list"){renderList(rows);return}
  let html="";const pc=personColors();
  for(const o of groups){
    const rs=rows.filter(r=>r.it.owner===o);
    if(st.status&&!rs.length)continue;
    const hiddenN=shown.filter(r=>r.it.owner===o).length-rs.length;
    const bc={p:0,w:0,d:0,l:0};shown.filter(r=>r.it.owner===o).forEach(r=>{if(r.cur){if(r.cur.status==="진행")bc.p++;else if(r.cur.status==="대기")bc.w++;else bc.d++}if(r.late)bc.l++});
    html+=`${html?`<tr class="ggap"><td colspan="${cols}"></td></tr>`:""}<tr class="band"><td colspan="${cols}"><div class="bin"><span class="bn"><i class="pdot" style="background:var(--pc${pcol(pc,o)})"></i>${esc(o)}</span><span class="bc"><span class="p"><b>${bc.p}</b>진행</span><span class="w"><b>${bc.w}</b>대기</span><span class="d"><b>${bc.d}</b>완료</span>${bc.l?`<span class="l"><b>${bc.l}</b>기한 지남</span>`:""}</span>${canAddHere()&&o===st.me.name?`<button class="addbtn sm" type="button" data-add="${esc(o)}"><b>+</b>업무 추가</button>`:""}${hiddenN?`<span class="hid">끝난 일 ${hiddenN}건 숨김</span>`:""}</div></td></tr>${headRow}`;
    rs.forEach((r,i)=>{html+=rowHtml(r,i===0)});
    html+=`<tr class="addrow"><td colspan="${cols}">${canAddHere()&&o===st.me.name
      ?`<button class="addbtn" type="button" data-add="${esc(o)}"><b>+</b>${rs.length?"업무 추가":"첫 업무 추가"}</button>`
      :`<span class="dim">${rs.length?"":"표시할 업무가 없어요"}</span>`}</td></tr>`;
  }
  if(!html)html=`<tr><td colspan="${cols}" class="empty"><b>조건에 맞는 업무가 없어요</b>위의 '전체 보기'를 누르거나 필터를 바꿔보세요.</td></tr>`;
  $("rows").innerHTML=html;
}
/* ---------- 월 달력 보기 ---------- */
// 화면(데스크톱/휴대폰)과 계산을 나눠둠: monthModel()이 데이터를, renderMonth()가 그리기를 맡음
function itemPass(it){
  if(st.owner!=="전체"&&it.owner!==st.owner)return false;
  if(st.cat!=="전체"&&it.category!==st.cat)return false;
  if(st.cust!=="전체"&&it.customer!==st.cust)return false;
  if(st.q){const w=it.weeks||{};const hay=[it.project,it.part,it.po,it.vendor,it.customer,...Object.values(w).map(e=>e.task)].join(" ").toLowerCase();if(!hay.includes(st.q.toLowerCase()))return false}
  return true;
}
function monthEvents(){
  const ev=[];
  for(const it of st.items){
    if(!itemPass(it))continue;
    const w=it.weeks||{},ks=Object.keys(w).sort();
    const lastK=ks.filter(k=>k<=CUR).pop();
    ks.forEach(wk=>{
      const e=w[wk];if(!e||!e.task)return;
      const fri=keyOf(addDays(parseKey(wk),4));
      const wIso=writtenOf(it,e,wk);
      let start=e.planned||!wIso?wk:keyOf(new Date(wIso));if(start<wk)start=wk;
      let end=e.due||fri;
      const done=e.status==="완료";
      const late=!done&&e.due&&e.due<todayKey&&wk===lastK&&!w[CUR];
      const lateCur=!done&&e.due&&e.due<todayKey&&wk===CUR;
      if(lateCur)end=todayKey;
      if(end<start)start=end;
      ev.push({it,e,wk,start,end,done,late:lateCur,planned:!!e.planned&&wk>CUR,written:wIso});
      if(late){ // 지난주에서 끝나지 않고 넘어온 일: 이번주 월요일 ~ 오늘
        ev.push({it,e:Object.assign({},e,{carried:true}),wk:CUR,start:CUR,end:todayKey<CUR?CUR:todayKey,done:false,late:true,planned:false,carried:true});
      }
    });
  }
  return st.doneMode==="hide"?ev.filter(x=>!x.done):ev;
}
function monthModel(){
  const today=new Date();
  if(!st.month)st.month=keyOf(new Date(today.getFullYear(),today.getMonth(),1));
  const m1=parseKey(st.month),y=m1.getFullYear(),mo=m1.getMonth();
  const dim=new Date(y,mo+1,0).getDate(),lead=m1.getDay();
  const gridStart=addDays(m1,-lead),nWeeks=Math.ceil((lead+dim)/7);
  const evs=monthEvents().sort((a,b)=>(a.done-b.done)||a.start.localeCompare(b.start)||b.end.localeCompare(a.end));
  const weeks=[];
  for(let r=0;r<nWeeks;r++){
    const days=[...Array(7)].map((_,i)=>keyOf(addDays(gridStart,r*7+i)));
    const rs=days[0],re=days[6];
    const segs=[],lanes=[];
    evs.forEach(x=>{
      if(x.end<rs||x.start>re)return;
      const s=days.indexOf(x.start<rs?rs:x.start),t=days.indexOf(x.end>re?re:x.end);
      let li=lanes.findIndex(l=>l<s);if(li<0){li=lanes.length;lanes.push(-1)}lanes[li]=t;
      segs.push({x,s,t,lane:li,contL:x.start<rs,contR:x.end>re});
    });
    weeks.push({days,segs,lanes:lanes.length});
  }
  return {y,mo,weeks,evs};
}
function eventsOn(evs,day){return evs.filter(x=>x.start<=day&&x.end>=day)}
function renderMonth(){
  const M=monthModel(),pc=personColors(),MAXL=3;
  const one=st.owner!=="전체";
  const dow=["일","월","화","수","목","금","토"];
  if(!st.mSel||!st.mSel.startsWith(`${M.y}-${pad(M.mo+1)}`))st.mSel=todayKey.startsWith(`${M.y}-${pad(M.mo+1)}`)?todayKey:`${M.y}-${pad(M.mo+1)}-01`;
  const segHtml=(g)=>{const x=g.x,c=pcol(pc,x.it.owner);
    const label=`${x.carried?"↻ ":""}${one?"":x.it.owner+" · "}${x.e.task}`;
    const tip=`${x.it.owner} · ${x.it.project}${x.it.part?" "+x.it.part:""}\n${x.e.task}\n${x.written?shortDate(keyOf(new Date(x.written)))+" 작성 → ":""}~${shortDate(x.e.due)||"기한 없음"} · ${x.planned?"다음주 계획":x.e.status}${x.late?" · 기한 지남":""}`;
    return `<button type="button" class="mseg${x.done?" done":""}${x.late?" late":""}${x.planned?" planned":""}${g.contL?" cl":""}${g.contR?" cr":""}" data-id="${esc(x.it._id)}" title="${esc(tip)}" style="--c:var(--pc${c});--b:var(--pb${c});left:calc(${g.s} * 100% / 7 + 2px);width:calc(${g.t-g.s+1} * 100% / 7 - 4px);top:calc(${g.lane} * var(--lh))">${x.late?'<b class="lmark">!</b>':""}${esc(label)}</button>`};
  let grid="";
  M.weeks.forEach(w=>{
    const shownL=Math.min(w.lanes,MAXL);
    const cells=w.days.map((d,i)=>{
      const dt=parseKey(d),other=dt.getMonth()!==M.mo,red=i===0||HOLIDAYS.has(d);
      const hidden=w.segs.filter(g=>g.lane>=MAXL&&g.s<=i&&g.t>=i).length;
      const n=w.segs.filter(g=>g.s<=i&&g.t>=i).length;
      return `<button type="button" class="mday${other?" other":""}${d===todayKey?" today":""}${d===st.mSel?" sel":""}" data-day="${d}" aria-label="${dt.getMonth()+1}월 ${dt.getDate()}일 일정 ${n}건"><span class="dn${red?" red":""}">${dt.getDate()}</span>${n?`<span class="dot" aria-hidden="true"></span>`:""}${hidden?`<span class="more" data-more="${d}" role="button" title="이날 업무 모두 보기">+${hidden}건</span>`:""}${canAddHere()?`<span class="dadd" data-addday="${d}" role="button" title="${dt.getMonth()+1}/${dt.getDate()} 기한으로 업무 추가">+ 추가</span>`:""}</button>`}).join("");
    grid+=`<div class="mrow" style="--lanes:${shownL}"><div class="mdays">${cells}</div><div class="msegs">${w.segs.filter(g=>g.lane<MAXL).map(segHtml).join("")}</div></div>`;
  });
  // 선택한 날짜 목록
  const sel=st.mSel,sd=parseKey(sel),list=sortDay(eventsOn(M.evs,sel));
  const dayList=list.length?list.map(x=>mItemHtml(x,pc)).join("")
    :`<div class="mnone">이 날에 걸친 업무가 없어요.</div>`;
  const legend=st.lists.members.filter(m=>!one||m===st.owner).map(m=>`<span class="mleg"><i style="background:var(--pc${pcol(pc,m)})"></i>${esc(m)}</span>`).join("");
  st._mEvs=M.evs;
  $("monthView").innerHTML=`<div class="mhead">
      <button type="button" class="btn" data-mnav="today">오늘</button>
      <button type="button" class="btn icon" data-mnav="-1" aria-label="이전 달">◀</button>
      <h2 class="mtitle mono">${M.y}.${pad(M.mo+1)}</h2>
      <button type="button" class="btn icon" data-mnav="1" aria-label="다음 달">▶</button>
      <div class="mlegend">${legend}<span class="mleg st"><i class="dash"></i>다음주 계획</span><span class="mleg st"><b class="lmark">!</b>기한 지남</span><span class="mleg st">↻ 넘어온 일</span></div>
    </div>
    <div class="mcal">
      <div class="mdow">${dow.map((d,i)=>`<div class="${i===0?"red":""}">${d}</div>`).join("")}</div>
      ${grid}
    </div>
    <section class="mlist" aria-live="polite">
      <h3>${sd.getMonth()+1}월 ${sd.getDate()}일 (${MDOW[sd.getDay()]}) <span class="dim">${list.length}건</span>${canAddHere()?`<button type="button" class="btn" data-addday="${st.mSel||todayKey}">+ 이날 업무 추가</button>`:""}</h3>
      <div class="mitems">${dayList}</div>
    </section>`;
  paintMonthNav();
  {const lg=$("monthView").querySelector(".mlegend"),ps=lg?[...lg.querySelectorAll(".mleg:not(.st)")]:[];
   if(ps.length>8){ps.forEach(x=>x.classList.add("p"));lg.classList.toggle("lfold",!st.legOpen);lg.classList.toggle("lopen",!!st.legOpen);
     lg.insertAdjacentHTML("afterbegin",`<button type="button" class="mleg-more" data-legtog="1">${st.legOpen?"담당자 색 접기 ▴":`담당자 색 ${ps.length}명 ▾`}</button>`)}}
  if(st.mPop)openMpop(st.mPop,true);
}
const MDOW=["일","월","화","수","목","금","토"];
function sortDay(list){return list.sort((a,b)=>st.lists.members.indexOf(a.it.owner)-st.lists.members.indexOf(b.it.owner)||(a.end).localeCompare(b.end))}
function mItemHtml(x,pc){const c=pcol(pc,x.it.owner);return `<button type="button" class="mitem" data-id="${esc(x.it._id)}" style="--c:var(--pc${c});--b:var(--pb${c})">
      <span class="mbar"></span><span class="mwho">${esc(x.it.owner)}</span>
      <span class="mtask">${x.carried?"↻ ":""}${esc(x.e.task)}<span class="mproj">${esc(x.it.project)}${x.it.part?" · "+esc(x.it.part):""}</span></span>
      <span class="mwhen mono">${shortDate(x.start)}${x.end!==x.start?"–"+shortDate(x.end):""}</span>
      <span>${x.planned?'<span class="pill sm plan">계획</span>':pill(x.e.status,true)}${x.late?'<span class="pill sm latep">기한 지남</span>':""}</span></button>`}
function closeMpop(){st.mPop=null;const p=$("monthView").querySelector(".mpop");if(p)p.remove()}
function openMpop(k,keep){
  const mv=$("monthView");mv.querySelector(".mpop")?.remove();
  const cell=mv.querySelector(`.mday[data-day="${k}"]`);if(!cell||!st._mEvs){st.mPop=null;return}
  st.mPop=k;
  const pc=personColors(),d=parseKey(k),list=sortDay(eventsOn(st._mEvs,k));
  const el=document.createElement("div");el.className="mpop";el.setAttribute("role","dialog");el.setAttribute("aria-label",`${d.getMonth()+1}월 ${d.getDate()}일 업무`);
  el.innerHTML=`<div class="mpop-h"><h4>${d.getMonth()+1}월 ${d.getDate()}일 (${MDOW[d.getDay()]})</h4><span class="dim">${list.length}건</span><button type="button" class="btn icon x" data-mpclose aria-label="닫기">✕</button></div>
    <div class="mitems">${list.map(x=>mItemHtml(x,pc)).join("")||'<div class="mnone">이 날에 걸친 업무가 없어요.</div>'}</div>
    ${canAddHere()?`<div class="mpop-f"><button type="button" class="btn" data-addday="${k}">+ 이날 업무 추가</button></div>`:""}`;
  mv.appendChild(el);
  const mr=mv.getBoundingClientRect(),cr=cell.getBoundingClientRect();
  let left=cr.left-mr.left,top=cr.top-mr.top;
  left=Math.max(8,Math.min(left,mv.clientWidth-el.offsetWidth-8));
  el.style.left=left+"px";el.style.top=top+"px";
  if(!keep){const vb=window.innerHeight-el.getBoundingClientRect().bottom;if(vb<8)window.scrollBy({top:-vb+16,behavior:"smooth"});setTimeout(()=>el.querySelector("[data-mpclose]").focus(),20)}
}

/* ---------- 캘린더(간트) 보기: 작성일 → 언제까지 ---------- */
function calDays(){
  const P=prevKey(st.week),days=[];
  for(let w=0;w<3;w++)for(let d=0;d<5;d++)days.push(keyOf(addDays(parseKey(P),w*7+d)));
  return days;
}
function dayIdx(days,k,side){
  // 주말은 가까운 평일로: 시작은 다음 월요일, 끝은 앞 금요일
  if(!k)return -1;
  const dt=parseKey(k),wd=(dt.getDay()+6)%7;
  if(wd>4)k=side==="start"?keyOf(addDays(dt,7-wd)):keyOf(addDays(dt,4-wd));
  if(k<days[0])return side==="start"?0:-1;
  if(k>days[days.length-1])return side==="end"?days.length-1:days.length;
  let i=days.indexOf(k);return i;
}
function calBars(r){
  const it=r.it,out=[],W=st.week,P=prevKey(W),N=nextKey(W);
  const add=(e,wk,kind)=>{
    if(!e)return;
    const wIso=writtenOf(it,e,wk);
    let start=e.planned||!wIso?wk:keyOf(new Date(wIso));
    if(start<wk)start=wk;
    let end=e.due||keyOf(addDays(parseKey(wk),4));
    const late=e.status!=="완료"&&e.due&&e.due<todayKey;
    if(late&&kind!=="prev")end=todayKey;
    if(end<start)start=end;
    out.push({e,wk,kind,start,end,late,written:wIso});
  };
  if(r.prev&&r.prevWk===P)add(r.prev,P,"prev");
  if(r.cur)add(r.cur,W,"cur");
  if(r.nxt)add(r.nxt,N,"next");
  return out;
}
function renderCal(rows,shown,groups){
  const days=calDays(),n=days.length,W=st.week,P=prevKey(W),N=nextKey(W),isCur=W===CUR;
  const dow=["월","화","수","목","금"];
  const tIdx=days.indexOf(todayKey);
  const head=`<div class="cal-h"><div class="cal-l cal-hl">업무</div><div class="cal-r">
      <div class="cal-weeks">${[[P,isCur?"지난주":"이전 주"],[W,isCur?"이번주":"선택한 주"],[N,isCur?"다음주":"다음 주"]].map(([k,l],i)=>`<div class="cal-wk${i===1?" cur":""}"><b>${l}</b> <span class="mono">${shortRange(k)}</span></div>`).join("")}</div>
      <div class="cal-days">${days.map((k,i)=>`<div class="cal-d${k===todayKey?" today":""}${i%5===0?" wstart":""}"><span class="mono">${shortDate(k)}</span> ${dow[i%5]}</div>`).join("")}</div>
    </div></div>`;
  const grid=`style="--n:${n}"`;
  const todayLine=tIdx>=0?`<div class="cal-today" style="left:calc(${tIdx} * 100% / ${n});width:calc(100% / ${n})"></div>`:"";
  let html="";
  for(const o of groups){
    const rs=rows.filter(r=>r.it.owner===o);
    if(st.status&&!rs.length)continue;
    const bc={p:0,w:0,d:0,l:0};shown.filter(r=>r.it.owner===o).forEach(r=>{if(r.cur){if(r.cur.status==="진행")bc.p++;else if(r.cur.status==="대기")bc.w++;else bc.d++}if(r.late)bc.l++});
    html+=`<div class="cal-band band"><div class="bin"><span class="bn">${esc(o)}</span><span class="bc"><span class="p"><b>${bc.p}</b>진행</span><span class="w"><b>${bc.w}</b>대기</span><span class="d"><b>${bc.d}</b>완료</span>${bc.l?`<span class="l"><b>${bc.l}</b>기한 지남</span>`:""}</span>${canAddHere()&&o===st.me.name?`<button class="addbtn sm" type="button" data-add="${esc(o)}"><b>+</b>업무 추가</button>`:""}</div></div>`;
    if(!rs.length){html+=`<div class="cal-row cal-empty"><div class="cal-l dim">표시할 업무가 없어요</div><div class="cal-r cal-grid" ${grid}>${todayLine}</div></div>`;continue}
    for(const r of rs){
      const bars=calBars(r);
      // 겹치는 막대는 줄을 나눠 쌓기
      const lanes=[];
      bars.sort((x,y)=>x.start.localeCompare(y.start));
      bars.forEach(b=>{b.s=Math.max(0,dayIdx(days,b.start,"start"));b.t=dayIdx(days,b.end,"end");if(b.t<b.s)b.t=b.s;
        // 짧은 막대는 글자가 밖으로 이어지므로, 글자 길이만큼 칸을 차지한 것으로 보고 겹치면 아래 줄로
        const txt=`${b.e.carried?"↻ ":""}${b.e.task}`;
        const need=Math.ceil(([...txt].length*12.5+26)/74);
        const occ=b.t-b.s<1?Math.max(b.t,b.s+need-1):b.t;
        let li=lanes.findIndex(l=>l<b.s);if(li<0){li=lanes.length;lanes.push(-1)}lanes[li]=occ;b.lane=li});
      const vis=bars.filter(b=>b.s<n&&b.t>=0);
      const h=Math.max(1,lanes.length);
      const barHtml=vis.map(b=>{
        const cls=b.late?"late":({진행:"prog",대기:"wait",완료:"done"}[b.e.status]||"prog");
        const label=`${b.e.carried?"↻ ":""}${b.e.task}`;
        const narrow=b.t-b.s<1;
        const tip=`${label}\n${b.written?shortDate(keyOf(new Date(b.written)))+" 작성 → ":""}~${shortDate(b.e.due)||"기한 없음"} · ${b.kind==="next"&&b.e.planned?"계획":b.e.status}`;
        return `<button type="button" class="cal-bar ${cls}${b.kind==="next"&&b.e.planned?" planned":""}${narrow?" narrow":""}" data-id="${esc(r.it._id)}" title="${esc(tip)}" style="left:calc(${b.s} * 100% / ${n} + 2px);width:calc(${b.t-b.s+1} * 100% / ${n} - 4px);top:${6+b.lane*30}px">${esc(label)}</button>`;
      }).join("");
      html+=`<div class="cal-row${r.isNew?" isnew":""}" style="--h:${h}"><div class="cal-l" data-id="${esc(r.it._id)}"><span class="cat">${esc(r.it.category)}</span><span class="cal-t"><b>${esc(r.it.project)}</b>${r.it.part?` <span class="dim">${esc(r.it.part)}</span>`:""}</span></div>
        <div class="cal-r cal-grid" ${grid}>${todayLine}${barHtml}</div></div>`;
    }
  }
  if(!html)html=`<div class="empty"><b>조건에 맞는 업무가 없어요</b>위의 '전체 보기'를 누르거나 필터를 바꿔보세요.</div>`;
  $("calView").innerHTML=`<div class="cal" ${grid}>${head}${html}
    <div class="cal-legend"><span><i class="lg prog"></i>진행</span><span><i class="lg wait"></i>대기</span><span><i class="lg done"></i>완료</span><span><i class="lg late"></i>기한 지남</span><span><i class="lg planned"></i>다음주 계획</span><span>↻ 지난주에서 넘어온 일</span><span class="dim">막대: 작성한 날 → 언제까지 · 오늘은 세로 띠로 표시</span></div></div>`;
}
function workCell(it,isNew){
  const missing=!it.vendor||it.vendor==="확인 필요";
  const vendor=!missing?esc(it.vendor):"";
  return `<div class="wkcell">
    <div class="catcol"><span class="cat">${esc(it.category)}</span>${it.sample?'<span class="ex">예시</span>':""}</div>
    <div class="wkmain">
      <div class="w1">${isNew?'<span class="newb">신규</span>':""}<b>${esc(it.project)}</b>${it.part?`<span class="part">${esc(it.part)}</span>`:""}</div>
      <div class="w2">${it.customer?`<span class="mk"><i>고객</i>${esc(it.customer)}</span>`:""}${vendor?`<span class="mk"><i>협력</i>${vendor}</span>`:""}${it.po?`<span class="po mono">${esc(it.po)}</span>`:""}</div>
    </div></div>`;
}
function statusCell(r){
  const c=r.cur;
  const s=isMine(r.it)?`<button class="pill ${esc(c.status)}" type="button" data-qs="${esc(r.it._id)}" aria-haspopup="menu" aria-label="상태 ${esc(c.status)}, 바꾸기">${esc(c.status)}</button>`:pill(c.status);
  return s+(r.waitN>=2?`<span class="waitn">대기 ${r.waitN}주째</span>`:"");
}
// 작성일: 주별 할일을 처음 적은 시각 (예전 기록은 그 주에 만든·고친 날짜로 대신)
function writtenOf(it,e,wk){
  if(!e||e.carried)return null;
  if(e.writtenAt)return e.writtenAt;
  const inWk=iso=>iso&&keyOf(mondayOf(new Date(iso)))===wk;
  if(inWk(it.createdAt))return it.createdAt;
  if(inWk(it.updatedAt))return it.updatedAt;
  return null;
}
const wdateHtml=iso=>{if(!iso)return"";const d=new Date(iso);if(isNaN(d))return"";const t=`${d.getMonth()+1}/${d.getDate()}`;return `<span class="wdate mono" title="${t} 작성">${t} 작성</span>`};
const dueHtml=(d,late)=>d?`<span class="duev mono${late?" late":""}">~${esc(shortDate(d))}</span>`:"";
function rowHtml(r,first){
  const it=r.it,p=r.prev,c=r.cur,n=r.nxt;
  const W0=st.week;
  const prevCell=p?`<td class="sep wkc">${wdateHtml(writtenOf(it,p,r.prevWk))}${esc(p.task)}<div class="t2">${dueHtml(p.due)}${pill(p.status,true)}</div>${p.memo?`<div class="t3">${esc(p.memo)}</div>`:""}${r.stale?`<span class="oldwk mono">${shortRange(r.prevWk)} 기록</span>`:""}</td>`
    :`<td class="sep wkc dim">—</td>`;
  const curCell=c?`<td class="sep wk wkc">${wdateHtml(writtenOf(it,c,W0))}${c.carried?'<span class="carry">이월</span>':""}${esc(c.task)}<div class="t2">${dueHtml(c.due,r.late)}${statusCell(r)}</div>${c.carried?'<div class="t3">이번주 메모 없음</div>':c.memo?`<div class="t3">${esc(c.memo)}</div>`:""}</td>`
    :`<td class="sep wk wkc dim">${p&&p.status==="완료"?(r.stale?`${shortRange(r.prevWk)} 주에 완료`:"지난주 완료"):"—"}</td>`;
  const nextCell=n?`<td class="sep nx wkc">${wdateHtml(writtenOf(it,n,nextKey(W0)))}${esc(n.task)}<div class="t2">${dueHtml(n.due)}${n.planned?"":pill(n.status,true)}</div>${n.memo?`<div class="t3">${esc(n.memo)}</div>`:""}</td>`
    :`<td class="sep nx wkc">${isMine(it)&&c&&c.status!=="완료"?`<button class="planbtn" type="button" data-plan="${esc(it._id)}">+ 계획</button>`:""}</td>`;
  const done=(!c||c.status==="완료")&&!n;
  const sc=r.late?"s-late":c?({진행:"s-prog",대기:"s-wait",완료:"s-done"}[c.status]||""):"";
  return `<tr data-id="${esc(it._id)}" class="${sc}${done?" done":""}${r.isNew?" isnew":""}" tabindex="0">
    <td class="work">${workCell(it,r.isNew)}</td>${prevCell}${curCell}${nextCell}</tr>`;
}

function renderReview(base){
  const owners=[...st.lists.members,...new Set(base.map(r=>r.it.owner).filter(o=>o&&!st.lists.members.includes(o)))].filter(o=>st.owner==="전체"||o===st.owner);
  const keys=["진행","대기","완료","이월","기한 지남","오래 대기"];
  const stat=r=>({진행:r.cur&&r.cur.status==="진행",대기:r.cur&&r.cur.status==="대기",완료:r.cur&&r.cur.status==="완료",이월:r.cur&&r.cur.carried,"기한 지남":r.late,"오래 대기":r.waitN>=2});
  const tot=Object.fromEntries(keys.map(k=>[k,0]));
  const ownerRows=owners.map(o=>{
    const c=Object.fromEntries(keys.map(k=>[k,0]));
    base.filter(r=>r.it.owner===o).forEach(r=>{const s=stat(r);keys.forEach(k=>{if(s[k]){c[k]++;tot[k]++}})});
    return `<tr><td><b>${esc(o)}</b></td>${keys.map(k=>`<td class="mono ${c[k]?(k==="기한 지남"?"hot":k==="오래 대기"||k==="이월"?"warm":""):"z"}">${c[k]}</td>`).join("")}</tr>`;
  }).join("");
  const item=r=>`<button class="ritem" type="button" data-id="${esc(r.it._id)}">
      <span class="o">${esc(r.it.owner)}</span>
      <span class="t"><b>${esc(r.it.project)}</b>${r.it.part?` · ${esc(r.it.part)}`:""}<span class="w2" style="display:block">${[esc(r.it.customer),r.it.vendor?vendorHtml(r.it.vendor):""].filter(Boolean).join(" · ")}${r.it.po?` · <span class="mono">${esc(r.it.po)}</span>`:""}</span></span>
      <span class="t">${r.cur&&r.cur.carried?'<span class="carry">이월</span>':""}${esc(r.cur?r.cur.task:"")}</span>
      <span class="d mono ${r.late?"due late":""}">${esc(shortDate(r.cur&&r.cur.due))}</span>
      <span>${r.cur?pill(r.cur.status):""}${r.waitN>=2?`<span class="waitn">대기 ${r.waitN}주째</span>`:""}</span></button>`;
  const panel=(title,desc,list)=>`<div class="panel"><h2>${esc(title)} <span class="n">${list.length}</span><span>${esc(desc)}</span></h2><div class="rlist">${list.length?list.map(item).join(""):`<div class="rempty">해당하는 업무가 없어요.</div>`}</div></div>`;
  const late=base.filter(r=>r.late).sort((a,b)=>(a.cur.due||"").localeCompare(b.cur.due||""));
  const longWait=base.filter(r=>r.waitN>=2).sort((a,b)=>b.waitN-a.waitN);
  const carried=base.filter(r=>r.cur&&r.cur.carried);
  $("reviewView").innerHTML=`${myRhythmHtml(base)}
    <div class="panel"><h2>담당자별 현황 <span>${esc(rangeOf(st.week))}</span></h2><div class="scroll"><table class="otable">
      <thead><tr><th>담당자</th>${keys.map(k=>`<th>${k}</th>`).join("")}</tr></thead>
      <tbody>${ownerRows}<tr><td><b>합계</b></td>${keys.map(k=>`<td class="mono"><b>${tot[k]}</b></td>`).join("")}</tr></tbody></table></div></div>
    ${panel("기한 지남","언제까지가 지났는데 완료되지 않은 일",late)}
    <div class="grid2">
      ${panel("오래 대기","2주 이상 연속으로 대기 중 — 협력사·타부서 독촉 필요",longWait)}
      ${panel("이월 확인 전","지난주에서 넘어왔지만 아직 이번주 기준으로 고치지 않은 일",carried)}
    </div>`;
}
function fillSelect(el,opts,val){
  const html=opts.map(o=>`<option value="${esc(o)}"${o===val?" selected":""}>${esc(o)}</option>`).join("");
  if(el.dataset.h!==html){el.innerHTML=html;el.dataset.h=html}
  el.value=val;
}

/* ---------- quick status ---------- */
function openPop(btn){
  const pop=$("pop");st.popFor=btn.dataset.qs;pop.hidden=false;
  const r=btn.getBoundingClientRect(),pw=pop.offsetWidth,ph=pop.offsetHeight;
  let left=Math.min(r.left,window.innerWidth-pw-12),top=r.bottom+4;
  if(top+ph>window.innerHeight-12)top=r.top-ph-4;
  pop.style.left=Math.max(12,left)+"px";pop.style.top=Math.max(12,top)+"px";
  pop.querySelector("button").focus();
}
function closePop(){$("pop").hidden=true;st.popFor=null}
function quickStatus(id,s){if(!isMineId(id)){closePop();toast("담당자 본인만 고칠 수 있어요.");return}return quickStatus_(id,s)}
async function quickStatus_(id,status){
  closePop();
  const it=st.items.find(i=>i._id===id);if(!it||!st.db)return;
  const r=buildRows().find(x=>x.it._id===id);if(!r||!r.cur)return;
  const W=st.week;
  const entry={task:r.cur.task,due:r.cur.due||"",status,memo:r.cur.carried?"":(r.cur.memo||""),writtenAt:r.cur.carried?new Date().toISOString():(writtenOf(it,r.cur,W)||new Date().toISOString())};
  const {_id,...rest}=it;
  const body=Object.assign({},rest,{weeks:Object.assign({},it.weeks||{},{[W]:entry}),updatedAt:new Date().toISOString()});
  delete body.sample;
  try{await st.db.doc("items/"+id).set(body);toast(`'${it.project}' ${status}(으)로 바꿨어요`)}catch(e){handleWriteErr(e)}
}

/* ---------- drawer ---------- */
function setDatalists(){
  const uniq=f=>[...new Set(st.items.map(i=>i[f]).filter(v=>v&&v!=="확인 필요"))].sort((a,b)=>a.localeCompare(b,"ko"));
  const mine=st.lists.projects||[];
  $("dl-project").innerHTML=[...mine,...uniq("project").filter(v=>!mine.includes(v))].map(v=>`<option value="${esc(v)}">`).join("");
  $("dl-part").innerHTML=uniq("part").map(v=>`<option value="${esc(v)}">`).join("");
  $("dl-vendor").innerHTML=uniq("vendor").map(v=>`<option value="${esc(v)}">`).join("");
}
function sortKo(a){return [...a].sort((x,y)=>x.localeCompare(y,"ko"))}
function fillVendor(val){
  const vs=sortKo(st.lists.vendors||[]);
  const opts=[["","선택하세요"],...(val&&!vs.includes(val)?[[val,val+" (목록에 없음)"]]:[]),...vs.map(v=>[v,v]),["__new","+ 새 협력사…"]];
  $("f-vendor").innerHTML=opts.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join("");
  $("f-vendor").value=val;$("f-vendor-new").hidden=true;$("f-vendor-new").value="";
}
function fillCat(val){
  const cs=catsList();
  const opts=[...(val&&!cs.includes(val)?[[val,val+" (목록에 없음)"]]:[]),...cs.map(c=>[c,c]),["__new","+ 새 구분…"]];
  $("f-cat").innerHTML=opts.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join("");
  $("f-cat").value=val;$("f-cat-new").hidden=true;$("f-cat-new").value="";
}
function openDrawer(id,presetOwner,focusNext){
  closePop();
  const it=id?st.items.find(i=>i._id===id):null;
  if(id&&!it)return;
  st.editing=it?it._id:"__new";
  const W=st.week;
  const ow=it?it.owner:(st.me?st.me.name:"");
  $("dTitle").textContent=it?`${it.project||"업무"}${it.po?" · "+it.po:""}`:`${ow} · 새 업무`;
  fillSelect($("f-owner"),[ow],ow);$("f-owner").disabled=true;
  const custs=[...new Set([...st.lists.customers,it?.customer].filter(Boolean))];
  fillSelect($("f-customer"),custs,it?.customer||custs[0]);
  $("f-customer").insertAdjacentHTML("beforeend",'<option value="__new">+ 새 고객사…</option>');$("f-customer").value=it?.customer||custs[0];
  $("f-customer-new").hidden=true;$("f-customer-new").value="";
  $("f-project").value=it?.project||"";$("f-part").value=it?.part||"";$("f-po").value=it?.po||"";
  fillVendor(it&&it.vendor!=="확인 필요"?it.vendor||"":"");
  fillCat(it?.category||catsList()[0]);
  const w=it?.weeks||{};
  const ks=Object.keys(w).filter(k=>k<W).sort();const last=ks.length?w[ks[ks.length-1]]:null;
  const carried=!w[W]&&last&&last.status!=="완료";
  const cur=w[W]||(carried?{task:last.task,due:last.due,status:last.status,memo:""}:null);
  $("wLegend").textContent=W===CUR?"이번주 할일":"선택한 주 할일";$("wDates").textContent=rangeOf(W);
  $("w-task").value=cur?.task||"";$("w-due").value=cur?.due||"";$("w-memo").value=cur?.memo||"";
  const s=cur?.status||"진행";document.querySelectorAll('input[name="w-status"]').forEach(r=>r.checked=r.value===s);
  if(carried){$("carryHint").hidden=false;$("carryHint").innerHTML=`<span class="carry">이월</span>지난주에 끝나지 않아 그대로 넘어온 내용이에요. 이번주 기준으로 고치고 저장하면 이번주 기록이 됩니다.`}
  else $("carryHint").hidden=true;
  const N=nextKey(W),nx=w[N];
  $("nLegend").textContent=W===CUR?"다음주 계획":"다음 주 계획";$("nDates").textContent=rangeOf(N);
  $("carryNextMsg").hidden=true;
  $("n-task").value=nx?.task||"";$("n-due").value=nx?.due||"";$("n-memo").value=nx?.memo||"";
  const hk=Object.keys(w).filter(k=>k!==W&&k!==N).sort().reverse();
  $("historyBox").hidden=!hk.length;
  $("history").innerHTML=hk.map(k=>{const e=w[k];return `<div class="hrow"><div class="hw mono">${rangeOf(k)}</div><div class="ht">${esc(e.task)} ${pill(e.status)}${e.due?` <span class="mono dim" style="font-size:12px">~${shortDate(e.due)}</span>`:""}</div>${e.memo?`<div class="hm">${esc(e.memo)}</div>`:""}</div>`}).join("");
  $("formErr").hidden=true;document.querySelectorAll("[aria-invalid]").forEach(e=>e.removeAttribute("aria-invalid"));
  const ro=!!it&&!isMine(it);
  $("roNote").hidden=!ro;
  $("form").querySelectorAll("input,select,textarea,button").forEach(x=>{if(x.id!=="f-owner")x.disabled=ro});
  $("delBtn").hidden=!it||ro;$("delConfirm").hidden=true;
  $("saveBtn").hidden=ro;$("saveBtn").disabled=ro;
  setDatalists();
  $("scrim").hidden=false;$("drawer").hidden=false;
  setTimeout(()=>{(focusNext?$("n-task"):it&&it.vendor==="확인 필요"?$("f-vendor"):it?$("w-task"):$("f-project")).focus()},30);
}
/* ---------- 업무 요약 창 ---------- */
function rowFor(id){
  const r=buildRows().find(x=>x.it._id===id);if(r)return r;
  const it=st.items.find(i=>i._id===id);if(!it)return null;
  const w=it.weeks||{},W=st.week,ks=Object.keys(w).filter(k=>k<W).sort();
  return {it,prev:ks.length?w[ks[ks.length-1]]:null,prevWk:ks[ks.length-1],stale:true,cur:w[W]||null,nxt:w[nextKey(W)]||null,late:false,waitN:0,isNew:false};
}
function openSummary(id){
  closePop();
  const it=st.items.find(i=>i._id===id);if(!it)return;
  st.sumFor=id;st.fromSum=null;
  ["drawer","settings","copyDrawer"].forEach(i=>$(i).hidden=true);
  renderSummary();
  $("scrim").hidden=false;$("sumDrawer").hidden=false;
  setTimeout(()=>($("sumEdit").hidden?$("sumClose2"):$("sumEdit")).focus(),30);
}
function renderSummary(){
  const r=rowFor(st.sumFor);if(!r){closeAll();return}
  const it=r.it,W=st.week,P=prevKey(W),N=nextKey(W),isCur=W===CUR;
  $("sumTitle").textContent="업무 요약";
  const card=(label,dates,e,cls,extra)=>{
    if(!e)return `<div class="wcard wnone ${cls}"><div class="wl">${label}<span>${dates}</span></div><div class="wt">${cls==="cur"?"이번주 할일이 없어요":cls==="nxt"?"아직 계획이 없어요":"기록이 없어요"}</div>${extra||""}</div>`;
    return `<div class="wcard ${cls}"><div class="wl">${label}<span>${dates}</span></div>
      <div class="wt">${e.carried?'<span class="carry">이월</span>':""}${esc(e.task)}</div>
      <div class="wm">${e.due?`<span class="mono">~${esc(shortDate(e.due))}</span>`:""}${e.planned?"<span>계획</span>":pill(e.status)}</div>
      ${e.memo?`<div class="wn">${esc(e.memo)}</div>`:e.carried?'<div class="wn">지난주에서 넘어왔어요. 이번주 메모는 아직 없어요.</div>':""}${extra||""}</div>`;
  };
  const qs=isMine(it)&&r.cur?`<div class="qs-row"><span class="lab">상태 바꾸기</span>${["진행","대기","완료"].map(s=>`<button type="button" class="${s}" data-sumqs="${s}" aria-pressed="${r.cur.status===s}">${s}</button>`).join("")}</div>`:"";
  const flags=[r.late?'<span class="flag late">기한 지남</span>':"",r.waitN>=2?`<span class="flag wait">대기 ${r.waitN}주째</span>`:"",r.cur&&r.cur.carried?'<span class="flag carry">이월 확인 전</span>':""].join("");
  const w=it.weeks||{};
  const older=Object.keys(w).filter(k=>k<P&&k!==r.prevWk).sort().reverse();
  const prevLabel=r.stale&&r.prev?"마지막 기록":isCur?"지난주":"이전 주";
  const prevDates=r.stale&&r.prev&&r.prevWk?shortRange(r.prevWk):shortRange(P);
  $("sumBody").innerHTML=`
    <div class="sh">
      <div class="tags">${r.isNew?'<span class="newb">신규</span>':""}<span class="cat">${esc(it.category)}</span>${it.sample?'<span class="ex">예시</span>':""}<span class="own">담당 ${esc(it.owner)}</span></div>
      <h3>${esc(it.project)}${it.part?` <span>· ${esc(it.part)}</span>`:""}</h3>
      ${flags?`<div class="flags">${flags}</div>`:""}
    </div>
    <dl class="meta">
      <dt>고객사</dt><dd>${esc(it.customer)||"—"}</dd>
      <dt>협력사</dt><dd>${it.vendor&&it.vendor!=="확인 필요"?esc(it.vendor):"—"}</dd>
      <dt>관리번호</dt><dd class="mono">${esc(it.po)||"—"}</dd>
    </dl>
    <div class="wcards">
      ${card(prevLabel,prevDates,r.prev,"prev")}
      ${card(isCur?"이번주":"선택한 주",shortRange(W),r.cur,"cur",qs)}
      ${card(isCur?"다음주":"다음 주",shortRange(N),r.nxt,"nxt")}
    </div>
    ${older.length?`<div><p class="sec-t">이전 기록</p><div class="history">${older.map(k=>{const e=w[k];return `<div class="hrow"><div class="hw mono">${rangeOf(k)}</div><div class="ht">${esc(e.task)} ${pill(e.status)}${e.due?` <span class="mono dim" style="font-size:12px">~${shortDate(e.due)}</span>`:""}</div>${e.memo?`<div class="hm">${esc(e.memo)}</div>`:""}</div>`}).join("")}</div></div>`:""}`;
  $("sumEdit").hidden=!isMine(it);$("sumRO").hidden=isMine(it);$("sumRO").textContent="담당자 본인만 고칠 수 있어요";
}
function closeAll(){["drawer","settings","copyDrawer","sumDrawer","scrim"].forEach(i=>$(i).hidden=true);st.editing=null;st.sumFor=null;st.fromSum=null;closePop();
  if(st.weekBack){st.week=st.weekBack;st.weekBack=null;render()}}
function cancelEdit(){const back=st.fromSum;closeAll();if(back&&st.items.some(i=>i._id===back))openSummary(back)}

async function save(){
  if(!st.db||!st.me)return;
  if(st.editing!=="__new"&&!isMineId(st.editing)){toast("담당자 본인만 고칠 수 있어요.");return}
  if(st.editing==="__new"&&!canAddHere())return;
  const W=st.week;
  const vSel=$("f-vendor").value,isNewVendor=vSel==="__new";
  const v={owner:st.editing==="__new"?st.me.name:(st.items.find(i=>i._id===st.editing)||{}).owner,customer:($("f-customer").value==="__new"?$("f-customer-new").value:$("f-customer").value).trim(),project:$("f-project").value.trim(),part:$("f-part").value.trim(),po:$("f-po").value.trim(),vendor:(isNewVendor?$("f-vendor-new").value:vSel).trim(),category:($("f-cat").value==="__new"?$("f-cat-new").value:$("f-cat").value).trim()};
  const task=$("w-task").value.trim(),due=$("w-due").value,memo=$("w-memo").value.trim();
  const status=(document.querySelector('input[name="w-status"]:checked')||{}).value||"진행";
  const errs=[],bad=[];
  if(!v.project){errs.push("대상사업");bad.push("f-project")}
  if(isNewVendor&&!v.vendor){errs.push("새 협력사 이름");bad.push("f-vendor-new")}
  if(!v.category){errs.push("새 구분 이름");bad.push("f-cat-new")}
  if(!v.customer){errs.push("새 고객사 이름");bad.push("f-customer-new")}
  const isNew=st.editing==="__new";
  const existing=isNew?null:st.items.find(i=>i._id===st.editing);
  const N=nextKey(W);
  const nTask=$("n-task").value.trim(),nDue=$("n-due").value,nMemo=$("n-memo").value.trim();
  if(isNew&&!task&&!nTask){errs.push("이번주 또는 다음주 할일");bad.push("w-task")}
  if(task&&!due){errs.push("언제까지");bad.push("w-due")}
  if(nTask&&!nDue){errs.push("다음주 언제까지");bad.push("n-due")}
  document.querySelectorAll("[aria-invalid]").forEach(e=>e.removeAttribute("aria-invalid"));
  if(errs.length){bad.forEach(id=>$(id).setAttribute("aria-invalid","true"));$("formErr").textContent=`${errs.join(", ")}을(를) 채워주세요.`;$("formErr").hidden=false;$(bad[0]).focus();return}
  const weeks=Object.assign({},existing?.weeks||{});
  if(task)weeks[W]={task,due,status,memo,writtenAt:(existing&&writtenOf(existing,weeks[W],W))||new Date().toISOString()};
  const oldN=weeks[N];
  if(nTask){weeks[N]={task:nTask,due:nDue,memo:nMemo,status:oldN?oldN.status:"진행",writtenAt:(existing&&writtenOf(existing,oldN,N))||new Date().toISOString()};if(!oldN||oldN.planned)weeks[N].planned=true}
  else if(oldN&&oldN.planned)delete weeks[N];
  const rest=existing?(({_id,...r})=>r)(existing):{createdAt:new Date().toISOString()};
  const body=Object.assign({},rest,v,{weeks,updatedAt:new Date().toISOString()});
  delete body.sample;
  $("saveBtn").disabled=true;
  try{
    const ref=isNew?st.db.collection("items").doc():st.db.doc("items/"+existing._id);
    await ref.set(body);
    const addV=v.vendor&&!(st.lists.vendors||[]).includes(v.vendor),addC=v.category&&!catsList().includes(v.category),addP=v.project&&!(st.lists.projects||[]).includes(v.project),addU=v.customer&&!(st.lists.customers||[]).includes(v.customer);
    if(addV||addC||addP||addU){
      const nl=Object.assign({},st.lists,{cats:[...catsList()]});
      if(addP)nl.projects=[...(st.lists.projects||[]),v.project];
      if(addU)nl.customers=[...(st.lists.customers||[]),v.customer];
      if(addV)nl.vendors=[...(st.lists.vendors||[]),v.vendor];
      if(addC)nl.cats=[...nl.cats,v.category];
      try{await st.db.doc("config/lists").set(nl)}catch(_){}
    }
    closeAll();toast("저장했어요");
  }catch(e){handleWriteErr(e)}
  finally{$("saveBtn").disabled=!st.canWrite}
}
async function del(){
  const id=st.editing;if(!id||id==="__new")return;
  try{await st.db.doc("items/"+id).delete();closeAll();toast("삭제했어요")}catch(e){handleWriteErr(e)}
}
function handleWriteErr(e){
  const code=e&&e.code;
  if(code==="not_allowed"||code==="42501"){toast("담당자 본인 업무만 저장할 수 있어요.");return}
  if(code==="no_session"){toast("로그인이 끝났어요. 다시 로그인해 주세요.");showLogin();return}
  if(code==="invalid_argument"){st.canWrite=false;toast("이 화면에서는 저장 권한이 없어요. 공유 설정에서 편집 권한을 받아주세요.");render()}
  else if(code==="quota_exceeded")toast("저장 공간이 가득 찼어요. 오래된 업무를 지운 뒤 다시 저장해주세요.");
  else toast("저장하지 못했어요. 잠시 후 다시 눌러주세요.");
}
let tt;function toast(m){const t=$("toast");t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,3200)}

/* ---------- report copy ---------- */
function reportTSV(){
  const W=st.week,P=prevKey(W);
  const rows=buildRows().filter(r=>passFilters(r,true));
  const clean=s=>String(s??"").replace(/[\t\r\n]+/g," ").trim();
  const lines=[`고객품질팀 주간 업무 보고\t(${rangeOf(W)})`,"",
    ["담당자","고객사","대상사업","품목","관리번호","협력사","구분",`지난주 할일 (${shortRange(P)})`,"상태","메모",`이번주 할일 (${shortRange(W)})`,"언제까지","상태","메모",`다음주 할일 (${shortRange(nextKey(W))})`,"언제까지","메모"].join("\t")];
  let last=null;
  for(const r of rows){
    const it=r.it,p=r.prev,c=r.cur,n=r.nxt;
    lines.push([it.owner===last?"":it.owner,it.customer,it.project,it.part,it.po,it.vendor,it.category,
      p?p.task:"",p?p.status:"",p?p.memo:"",
      c?(c.carried?"(이월) ":"")+c.task:"",c?shortDate(c.due):"",c?c.status:"",c&&!c.carried?c.memo:"",
      n?n.task:"",n?shortDate(n.due):"",n?n.memo:""].map(clean).join("\t"));
    last=it.owner;
  }
  return lines.join("\n");
}
function copyReport(){
  const text=reportTSV();
  const fallback=()=>{$("copyText").value=text;$("scrim").hidden=false;$("copyDrawer").hidden=false;setTimeout(()=>{$("copyText").focus();$("copyText").select()},30)};
  try{navigator.clipboard.writeText(text).then(()=>toast("표를 복사했어요. 엑셀이나 메일에 붙여넣으세요."),fallback)}catch(e){fallback()}
}

/* ---------- settings ---------- */
let sEdit=null,sTab="members",sColor0=null;
function openSettings(){
  if(!canAddHere()){toast("내 목록은 내 팀 화면에서 고칠 수 있어요.");return}
  sEdit={};
  for(const k of Object.keys(LIST_INFO))sEdit[k]=(st.lists[k]||[]).map(x=>({orig:x,val:x}));
  {const pc=personColors();sEdit.members.forEach(x=>x.color=pcol(pc,x.orig));}sColorOpen=null;
  const mine=sEdit.members.find(x=>x.orig===st.me.name);sColor0=mine?mine.color:null;
  sTab="members";renderSettings();
  $("sSave").disabled=false;
  $("scrim").hidden=false;$("settings").hidden=false;setTimeout(()=>$("sSave").focus(),30);
}
function renderSettings(){
  const info=LIST_INFO[sTab],mem=sTab==="members";
  document.querySelectorAll("#sTabs [data-list]").forEach(b=>{const k=b.dataset.list;b.setAttribute("aria-selected",k===sTab);b.textContent=`${LIST_INFO[k].label} ${sEdit[k].length}`});
  $("sHint").textContent=mem?info.hint:`${info.label} 목록이에요. 안 쓰는 건 지우고(✕), 자주 쓰는 건 위로(↑) 올려두세요.`;
  $("s-new").placeholder=mem?"":`새 ${info.label} 이름`;
  document.querySelector("#settings .addline").hidden=mem;$("sFoot").hidden=mem;$("sReset").hidden=mem;
  let arr=sEdit[sTab].map((x,i)=>({...x,i}));
  if(sTab==="vendors")arr.sort((a,b)=>a.val.localeCompare(b.val,"ko"));
  const used=n=>st.items.filter(it=>it[info.field]===n).length;
  $("s-list").innerHTML=arr.length?arr.map((x,pos)=>{
    if(mem){const me_=x.orig===st.me.name;
      return `<div class="li" data-i="${x.i}"><span class="num mono">${pos+1}</span>
        ${me_?`<button type="button" class="swatch" data-sw="${x.i}" style="background:var(--pc${x.color})" aria-label="내 색 고르기" aria-expanded="${sColorOpen===x.i}"></button>`:`<span class="swatch" style="background:var(--pc${x.color});cursor:default" aria-hidden="true"></span>`}
        <span style="flex:1;font-weight:${me_?700:500}">${esc(x.val)}${me_?' <span class="rtag">나</span>':""}</span>
        ${me_?'<span class="use">색을 눌러 바꾸기</span>':""}</div>${sColorOpen===x.i?palRow(x):""}`}
    const lock=sTab==="customers"&&x.orig==="내부";const n=x.orig?used(x.orig):0;
    return `<div class="li" data-i="${x.i}">
      <span class="num mono">${pos+1}</span>
      <input value="${esc(x.val)}" data-edit="${x.i}" aria-label="${esc(info.label)} 이름" ${lock?"readonly":""}>
      ${!x.orig?`<span class="chg">새로 추가</span>`:n?`<span class="use">업무 ${n}건</span>`:""}
      ${sTab==="customers"||sTab==="cats"||sTab==="projects"?`<button class="ib" type="button" data-up="${x.i}" aria-label="위로" ${pos===0?"disabled":""}>↑</button><button class="ib" type="button" data-down="${x.i}" aria-label="아래로" ${pos===arr.length-1?"disabled":""}>↓</button>`:""}
      <button class="ib del" type="button" data-del="${x.i}" aria-label="삭제" ${lock?"disabled":""}>✕</button></div>`}).join("")
    :`<div class="none">아직 ${esc(info.label)}가 없어요. 위에서 추가하세요.</div>`;
}
let sColorOpen=null;
function palRow(x){
  const taken=new Map(sEdit.members.filter((m,k)=>k!==x.i&&m.val.trim()&&st.lists.colors&&st.lists.colors[m.orig]!=null).map(m=>[m.color,m.val]));
  return `<div class="palrow" role="group" aria-label="내 색">${[...Array(PALETTE_N)].map((_,c)=>{const who=taken.get(c);return `<button type="button" class="pal${c===x.color?" on":""}" data-pick="${c}" style="background:var(--pc${c})" ${who?`disabled title="${esc(who)} 님이 쓰는 색"`:`title="이 색 고르기"`} aria-label="${who?esc(who)+" 님이 쓰는 색":"색 "+(c+1)}">${who?"✕":c===x.color?"✓":""}</button>`}).join("")}<span class="hint" style="margin:0">✕는 같은 팀 다른 사람이 쓰는 색이에요.</span></div>`;
}
// 비슷한 이름 찾기: 띄어쓰기, (주), 주식회사, 대소문자 무시
const normName=v=>String(v||"").toLowerCase().replace(/\(주\)|㈜|주식회사|\s+/g,"");
function similarIn(list,v){const n=normName(v);return list.find(x=>normName(x)===n&&x!==v)||null}
function addListItem(){
  const v=$("s-new").value.trim();if(!v||sTab==="members")return;
  if(sEdit[sTab].some(x=>x.val.trim()===v)){toast(`'${v}'은(는) 이미 목록에 있어요.`);return}
  const team=(st.teams.find(t=>t.id===st.team)||{}).lists||{};
  const pool=[...new Set([...(team[sTab]||[]),...sEdit[sTab].map(x=>x.val),...st.items.map(i=>i[LIST_INFO[sTab].field]).filter(Boolean)])];
  const sim=similarIn(pool,v);
  if(sim&&$("s-new").dataset.sim!==v){$("s-new").dataset.sim=v;toast(`혹시 '${sim}'인가요? 그대로 추가하려면 한 번 더 누르세요.`);return}
  delete $("s-new").dataset.sim;
  sEdit[sTab].push({orig:null,val:v});$("s-new").value="";renderSettings();$("s-new").focus();
}
async function saveSettings(){
  const lists={};
  for(const k of ["projects","customers","vendors","cats"]){
    const vals=sEdit[k].map(x=>x.val.trim()).filter(Boolean);
    const dup=vals.find((v,i)=>vals.indexOf(v)!==i);
    if(dup){sTab=k;renderSettings();toast(`${LIST_INFO[k].label} '${dup}'이(가) 두 번 있어요.`);return}
    lists[k]=vals;
  }
  if(!lists.cats.length){sTab="cats";renderSettings();toast("구분을 하나 이상 남겨주세요.");return}
  if(!lists.customers.includes("내부"))lists.customers.push("내부");
  const mine=sEdit.members.find(x=>x.orig===st.me.name);
  const newColor=mine&&mine.color!==sColor0?mine.color:null;
  $("sSave").disabled=true;
  try{
    await api.setPrefs(newColor,lists);
    st.me.my_lists=lists;closeAll();toast("목록을 저장했어요");refreshSoon();
  }catch(e){toast(e&&e.code==="color_taken"?"같은 팀의 다른 사람이 쓰는 색이에요. 다른 색을 골라주세요.":errText(e))}
  finally{$("sSave").disabled=false}
}
$("sReset").onclick=()=>{
  const team=(st.teams.find(t=>t.id===st.team)||{}).lists||{};
  for(const k of ["projects","customers","vendors","cats"]){const src=Array.isArray(team[k])&&team[k].length?team[k]:(k==="cats"?CATS:k==="projects"?usedProjects():DEFAULT_LISTS[k]||[]);sEdit[k]=src.map(x=>({orig:x,val:x}))}
  renderSettings();toast("팀 기본 목록을 불러왔어요. 저장을 눌러야 적용돼요.");
};
async function clearSamples(){
  const ids=st.items.filter(i=>i.sample).map(i=>i._id);
  $("clearConfirm").hidden=true;
  try{for(const id of ids)await st.db.doc("items/"+id).delete();toast(`예시 ${ids.length}건을 지웠어요`)}catch(e){handleWriteErr(e)}
}

/* ---------- events ---------- */
$("tab-write").onclick=()=>{st.view="write";store.set("wk-view","write");render()};
$("tab-review").onclick=()=>{st.view="review";store.set("wk-view","review");render()};
function paintMonthNav(){
  if(st.layout!=="month")return;const t=new Date(),m=st.month?parseKey(st.month):new Date(t.getFullYear(),t.getMonth(),1);
  const diff=(m.getFullYear()-t.getFullYear())*12+m.getMonth()-t.getMonth();
  $("weekTitle").textContent=`${m.getFullYear()}년 ${m.getMonth()+1}월`;
  $("weekRange").textContent=diff===0?"이번달":diff<0?`${-diff}달 전`:`${diff}달 후`;
}
function monthNav(v){const t=new Date();
  if(v==="today"){st.month=keyOf(new Date(t.getFullYear(),t.getMonth(),1));st.mSel=todayKey}
  else{const m=st.month?parseKey(st.month):new Date(t.getFullYear(),t.getMonth(),1);st.month=keyOf(new Date(m.getFullYear(),m.getMonth()+v,1));st.mSel=null}
  render()}
$("prevWeek").onclick=()=>{if(st.layout==="month")return monthNav(-1);st.week=prevKey(st.week);render()};
$("nextWeek").onclick=()=>{if(st.layout==="month")return monthNav(1);st.week=keyOf(addDays(parseKey(st.week),7));render()};
$("thisWeek").onclick=()=>{if(st.layout==="month")return monthNav("today");st.week=CUR;render()};
function recentOwners(){try{return JSON.parse(store.get("wk-recent-owners")||"[]")}catch(_){return []}}
function pickOwner(o){st.owner=o;store.set("wk-owner",o);if(o!=="전체"){const r=[o,...recentOwners().filter(x=>x!==o)].slice(0,6);store.set("wk-recent-owners",JSON.stringify(r))}ownerPopOpen=false;render()}
let ownerPopOpen=false,ownerQ="";
function paintOwnerChips(owners){
  const box=$("ownerChips"),me=st.me&&owners.includes(st.me.name)?st.me.name:null,pc=personColors();
  const chip=o=>`<button class="chip" aria-pressed="${o===st.owner}" data-owner="${esc(o)}">${o===me?esc(o)+' <span class="hint" style="margin:0;font-size:11px">나</span>':esc(o)}</button>`;
  const ordered=me?["전체",me,...owners.filter(o=>o!=="전체"&&o!==me)]:owners;
  box.innerHTML=ordered.map(chip).join("");
  // 보이는 사람 수: 넓은 PC 8명, 좁은 PC 5명, 휴대폰 4명 (+N명). 한 명만 남으면 그냥 다 보여줌
  const one=()=>box.scrollHeight<=box.firstElementChild.offsetHeight*1.6;
  const cap=innerWidth>=1280?8:innerWidth>700?5:4;
  const people=ordered.filter(o=>o!=="전체");
  if(!box.firstElementChild||(people.length<=cap+1&&one())){if(!ownerPopOpen)return}
  const rest=owners.filter(o=>o!=="전체"&&o!==me);
  const rec=recentOwners().filter(o=>rest.includes(o));
  if(st.owner!=="전체"&&st.owner!==me&&!rec.includes(st.owner))rec.unshift(st.owner);
  const cand=[...rec,...rest.filter(o=>!rec.includes(o))];   // 최근 본 사람 먼저, 그다음 팀 순서
  for(let k=Math.min(cand.length,cap-(me?1:0));k>=0;k--){
    const shown=["전체",...(me?[me]:[]),...cand.slice(0,k)],hid=rest.filter(o=>!shown.includes(o));
    box.innerHTML=shown.map(chip).join("")+`<span class="ochip-more"><button class="chip" type="button" data-omore="1" aria-expanded="${ownerPopOpen}">+${hid.length}명 <span aria-hidden="true">▾</span></button>${ownerPopOpen?`<div class="opop" role="dialog" aria-label="담당자 고르기"><input id="ownerQ" placeholder="이름 찾기" autocomplete="off" value="${esc(ownerQ)}"><div class="ogrid">${ownerGrid(rest,pc)}</div></div>`:""}</span>`;
    if(one())break;
  }
  if(ownerPopOpen){const q=$("ownerQ");if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length)}}
}
function ownerGrid(rest,pc){const q=ownerQ.trim();const list=rest.filter(o=>!q||o.includes(q));
  return list.length?list.map(o=>`<button type="button" data-opick="${esc(o)}" aria-pressed="${o===st.owner}"><i style="background:var(--pc${pcol(pc,o)})"></i>${esc(o)}</button>`).join(""):`<div class="onone">'${esc(q)}'(이)라는 사람이 없어요</div>`}
$("ownerChips").onclick=e=>{
  if(e.target.closest("#ownerQ"))return;
  const mo=e.target.closest("[data-omore]");if(mo){ownerPopOpen=!ownerPopOpen;ownerQ="";render();return}
  const pk=e.target.closest("[data-opick]");if(pk){pickOwner(pk.dataset.opick);return}
  const b=e.target.closest("[data-owner]");if(!b)return;pickOwner(b.dataset.owner)};
$("ownerChips").addEventListener("input",e=>{if(e.target.id!=="ownerQ")return;ownerQ=e.target.value;const g=$("ownerChips").querySelector(".ogrid");
  const owners=["전체",...st.lists.members];const me=st.me&&owners.includes(st.me.name)?st.me.name:null;
  if(g)g.innerHTML=ownerGrid(owners.filter(o=>o!=="전체"&&o!==me),personColors())});
$("ownerChips").addEventListener("keydown",e=>{if(e.target.id==="ownerQ"&&e.key==="Enter"){const f=$("ownerChips").querySelector("[data-opick]");if(f)pickOwner(f.dataset.opick)}});
document.addEventListener("click",e=>{if(ownerPopOpen&&!e.target.closest(".ochip-more")){ownerPopOpen=false;render()}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&ownerPopOpen){ownerPopOpen=false;render()}});
addEventListener("resize",()=>{if(st.me&&!$("ownerChips").closest("[hidden]"))paintOwnerChips(["전체",...st.lists.members])});
$("moreBtn").addEventListener("click",()=>requestAnimationFrame(()=>{if(st.me)paintOwnerChips(["전체",...st.lists.members])}));
$("summary").onclick=e=>{const b=e.target.closest("[data-status]");if(!b)return;const s=b.dataset.status;st.status=!s||st.status===s?null:s;render()};
$("moreBtn").onclick=()=>{st.moreOpen=!st.moreOpen;render()};
$("resetFilters").onclick=()=>{st.cat="전체";st.cust="전체";render()};
$("catFilter").onchange=e=>{st.cat=e.target.value;render()};
$("custFilter").onchange=e=>{st.cust=e.target.value;render()};
$("q").oninput=e=>{st.q=e.target.value.trim();render()};
$("rows").onclick=e=>{
  const fv=e.target.closest("[data-fixv]");if(fv){e.stopPropagation();openVpop(fv);return}
  const q=e.target.closest("[data-qs]");if(q){e.stopPropagation();st.popFor===q.dataset.qs?closePop():openPop(q);return}
  const a=e.target.closest("[data-add]");if(a){if(canAddHere())openDrawer(null,st.me.name);return}
  const pl=e.target.closest("[data-plan]");if(pl){openDrawer(pl.dataset.plan,null,true);return}
  const tr=e.target.closest("tr[data-id]");if(tr)openSummary(tr.dataset.id)};
$("rows").onkeydown=e=>{if(e.key==="Enter"&&e.target.matches("tr[data-id]"))openSummary(e.target.dataset.id)};
$("reviewView").onclick=e=>{const ad=e.target.closest("[data-rhadd]");const rw=e.target.closest("[data-rhwho]");if(rw){pickOwner(rw.dataset.rhwho);return}if(ad){st.view="write";store.set("wk-view","write");render();if(canAddHere())openDrawer(null,st.me.name);return}const b=e.target.closest("[data-id]");if(b)openSummary(b.dataset.id)};
$("pop").onclick=e=>{const b=e.target.closest("[data-set]");if(b&&st.popFor)quickStatus(st.popFor,b.dataset.set)};
document.addEventListener("click",e=>{if(!$("pop").hidden&&!e.target.closest("#pop")&&!e.target.closest("[data-qs]"))closePop();
  if(!$("vpop").hidden&&!e.target.closest("#vpop")&&!e.target.closest("[data-fixv]"))closeVpop()});
window.addEventListener("scroll",e=>{closePop();if(!$("vpop").hidden&&!(e.target&&e.target.closest&&e.target.closest("#vpop")))closeVpop()},true);window.addEventListener("resize",()=>{closePop();closeVpop()});
/* ---------- 협력사 미입력 바로 수정 ---------- */
let vpFor=null;
function openVpop(btn){
  closePop();
  const it=st.items.find(i=>i._id===btn.dataset.fixv);if(!isMine(it))return;
  vpFor=it._id;
  const vs=[...st.lists.vendors||[]].sort((a,b)=>a.localeCompare(b,"ko"));
  $("vp-sel").innerHTML=[["","선택하세요"],...vs.map(v=>[v,v]),["__new","+ 새 협력사…"]].map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join("");
  $("vp-new").hidden=true;$("vp-new").value="";$("vp-err").hidden=true;
  $("vp-what").textContent=`${it.project}${it.part?" · "+it.part:""}`;
  const pop=$("vpop");pop.hidden=false;
  const r=btn.getBoundingClientRect(),pw=pop.offsetWidth,ph=pop.offsetHeight;
  let top=r.bottom+6;if(top+ph>innerHeight-12)top=r.top-ph-6;
  pop.style.left=Math.max(12,Math.min(r.left,innerWidth-pw-12))+"px";pop.style.top=Math.max(12,top)+"px";
  $("vp-sel").focus();
}
function closeVpop(){$("vpop").hidden=true;vpFor=null}
async function saveVpop(){
  const it=st.items.find(i=>i._id===vpFor);if(!it||!st.db)return;
  const sel=$("vp-sel").value,v=(sel==="__new"?$("vp-new").value:sel).trim();
  if(!v){$("vp-err").textContent="협력사를 고르거나 이름을 적어주세요.";$("vp-err").hidden=false;(sel==="__new"?$("vp-new"):$("vp-sel")).focus();return}
  const {_id,...rest}=it;
  const body=Object.assign({},rest,{vendor:v,updatedAt:new Date().toISOString()});delete body.sample;
  $("vp-save").disabled=true;
  try{
    await st.db.doc("items/"+_id).set(body);
    if(!(st.lists.vendors||[]).includes(v)){try{await st.db.doc("config/lists").set(Object.assign({},st.lists,{vendors:[...(st.lists.vendors||[]),v]}))}catch(_){}}
    closeVpop();toast(`'${it.project}' 협력사를 ${v}(으)로 입력했어요`);
  }catch(e){handleWriteErr(e)}
  finally{$("vp-save").disabled=false}
}
$("vp-sel").onchange=e=>{const n=e.target.value==="__new";$("vp-new").hidden=!n;if(n)$("vp-new").focus()};
$("vp-cancel").onclick=closeVpop;$("vp-save").onclick=saveVpop;
$("vpop").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.tagName!=="BUTTON"){e.preventDefault();saveVpop()}});
$("dClose").onclick=cancelEdit;$("cancelBtn").onclick=cancelEdit;
$("doneMode").onclick=e=>{const b=e.target.closest("[data-done]");if(!b)return;st.doneMode=b.dataset.done;store.set("wk-done",st.doneMode);render()};
$("carryNext").onclick=()=>{
  const task=$("w-task").value.trim(),msg=$("carryNextMsg");
  if(!task){msg.textContent="이번주 할일이 비어 있어서 가져올 내용이 없어요.";msg.hidden=false;$("w-task").focus();return}
  const N=nextKey(st.week),nFri=keyOf(addDays(parseKey(N),4)),due=$("w-due").value;
  $("n-task").value=task;
  $("n-due").value=due&&due>=N?due:nFri;
  msg.textContent=due&&due>=N?"이번주 할일과 기한을 그대로 가져왔어요. 필요하면 고친 뒤 저장하세요.":`이번주 할일을 가져오고, 기한은 다음주 금요일(${shortDate(nFri)})로 맞췄어요. 필요하면 고친 뒤 저장하세요.`;
  msg.hidden=false;$("n-task").focus();
};
$("sumClose").onclick=closeAll;$("sumClose2").onclick=closeAll;
$("sumEdit").onclick=()=>{const id=st.sumFor;$("sumDrawer").hidden=true;st.sumFor=null;openDrawer(id);st.fromSum=id};
$("sumBody").onclick=e=>{const fv=e.target.closest("[data-fixv]");if(fv){e.stopPropagation();openVpop(fv);return}const b=e.target.closest("[data-sumqs]");if(b&&st.sumFor)quickStatus(st.sumFor,b.dataset.sumqs)};$("scrim").onclick=closeAll;$("cClose").onclick=closeAll;
$("saveBtn").onclick=save;$("form").onsubmit=e=>{e.preventDefault();save()};
$("delBtn").onclick=()=>{$("delConfirm").hidden=false;$("delBtn").hidden=true};
$("delNo").onclick=()=>{$("delConfirm").hidden=true;$("delBtn").hidden=false};
$("delYes").onclick=del;
$("copyReport").onclick=copyReport;
document.querySelector(".viewmode").onclick=e=>{const b=e.target.closest("[data-layout]");if(!b)return;st.layout=b.dataset.layout;store.set("wk-layout",st.layout);render()};
$("monthView").onclick=e=>{
  if(e.target.closest("[data-legtog]")){st.legOpen=!st.legOpen;renderMonth();return}
  const nv=e.target.closest("[data-mnav]");
  if(nv){const v=nv.dataset.mnav,t=new Date();
    if(v==="today"){st.month=keyOf(new Date(t.getFullYear(),t.getMonth(),1));st.mSel=todayKey}
    else{const m=parseKey(st.month);st.month=keyOf(new Date(m.getFullYear(),m.getMonth()+(+v),1));st.mSel=null}
    renderMonth();return}
  if(e.target.closest("[data-mpclose]")){closeMpop();return}
  const ad=e.target.closest("[data-addday]");if(ad){e.stopPropagation();closeMpop();addOnDay(ad.dataset.addday);return}
  const mo=e.target.closest("[data-more]");
  if(mo&&!matchMedia("(max-width:720px)").matches&&innerWidth<1000){e.stopPropagation();const k=mo.dataset.more;if(st.mPop===k){closeMpop();return}st.mSel=k;st.mPop=null;renderMonth();openMpop(k);return}
  if(e.target.closest(".mpop")&&!e.target.closest("[data-id]"))return;
  if(st.mPop&&!e.target.closest("[data-id]")){closeMpop()}
  const seg=e.target.closest("[data-id]");if(seg){openSummary(seg.dataset.id);return}
  const d=e.target.closest("[data-day]");if(d){const k=d.dataset.day;if(k.slice(0,7)!==st.month.slice(0,7))st.month=k.slice(0,8)+"01";st.mSel=k;renderMonth();
    if(matchMedia("(max-width:720px)").matches)setTimeout(()=>$("monthView").querySelector(".mlist").scrollIntoView({behavior:"smooth",block:"start"}),30)}
};
function addOnDay(k){
  // 그 날짜가 속한 주를 '이번주'로 잡고, 언제까지에 그 날짜를 미리 넣어 새 업무 창을 연다
  st.mSel=k;
  const wk=keyOf(mondayOf(parseKey(k)));
  if(wk!==st.week){st.weekBack=st.week;st.week=wk}
  if(!canAddHere())return;
  openDrawer(null,st.me.name);
  $("w-due").value=k;
}
document.addEventListener("mousedown",e=>{if(st.mPop&&!e.target.closest(".mpop")&&!e.target.closest("[data-more]")&&!e.target.closest("#sumDrawer")&&!e.target.closest("#drawer"))closeMpop()});
$("calView").onclick=e=>{const a=e.target.closest("[data-add]");if(a){if(canAddHere())openDrawer(null,st.me.name);return}const b=e.target.closest("[data-id]");if(b)openSummary(b.dataset.id)};
$("f-customer").onchange=e=>{const n=e.target.value==="__new";$("f-customer-new").hidden=!n;if(n)$("f-customer-new").focus()};
$("f-cat").onchange=e=>{const n=e.target.value==="__new";$("f-cat-new").hidden=!n;if(n)$("f-cat-new").focus()};
$("f-vendor").onchange=e=>{const n=e.target.value==="__new";$("f-vendor-new").hidden=!n;if(n)$("f-vendor-new").focus()};
$("sTabs").onclick=e=>{const b=e.target.closest("[data-list]");if(!b)return;sTab=b.dataset.list;renderSettings()};
$("s-add").onclick=addListItem;
$("s-new").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();addListItem()}};
$("s-list").oninput=e=>{const i=e.target.dataset.edit;if(i==null)return;sEdit[sTab][+i].val=e.target.value};
$("s-list").addEventListener("change",e=>{if(e.target.dataset.edit!=null)renderSettings()});
$("s-list").onclick=e=>{
  const sw=e.target.closest("[data-sw]");if(sw){const i=+sw.dataset.sw;sColorOpen=sColorOpen===i?null:i;renderSettings();return}
  const pk=e.target.closest("[data-pick]");if(pk&&sColorOpen!=null){sEdit.members[sColorOpen].color=+pk.dataset.pick;sColorOpen=null;renderSettings();return}
  const d=e.target.closest("[data-del]"),u=e.target.closest("[data-up]"),w=e.target.closest("[data-down]");
  const a=sEdit[sTab];
  if(d){a.splice(+d.dataset.del,1);renderSettings()}
  else if(u){const i=+u.dataset.up;if(i>0){[a[i-1],a[i]]=[a[i],a[i-1]];renderSettings()}}
  else if(w){const i=+w.dataset.down;if(i<a.length-1){[a[i+1],a[i]]=[a[i],a[i+1]];renderSettings()}}
};
$("openSettings").onclick=openSettings;$("sClose").onclick=closeAll;$("sCancel").onclick=closeAll;$("sSave").onclick=saveSettings;
$("clearSamples").onclick=()=>{$("clearConfirm").hidden=false};
$("clearNo").onclick=()=>{$("clearConfirm").hidden=true};
$("clearYes").onclick=clearSamples;
document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(st.mPop&&$("drawer").hidden&&$("sumDrawer").hidden){closeMpop();return}if(!$("vpop").hidden){closeVpop();return}if(!$("pop").hidden){closePop();return}if(!$("drawer").hidden){cancelEdit();return}if(!$("settings").hidden||!$("copyDrawer").hidden||!$("sumDrawer").hidden)closeAll()});

render();

/* ---------- 데이터·로그인 (Supabase. 주소가 없으면 체험용 브라우저 저장) ---------- */
const CONFIGURED=!!(SUPABASE_URL&&SUPABASE_ANON_KEY&&window.supabase);
const DEFAULT_PIN="0426";
const DEMO_ITEMS=[];
function pinProblem(pin){
  if(!/^\d{6}$/.test(pin))return "숫자 6자리로 입력해 주세요.";
  if(/^(\d)\1{5}$/.test(pin))return "같은 숫자만 반복할 수는 없어요.";
  const d=[...pin].map(Number);
  if(d.every((v,i)=>i===0||v===(d[i-1]+1)%10)||d.every((v,i)=>i===0||v===(d[i-1]+9)%10))return "123456처럼 이어지는 숫자는 쓸 수 없어요.";
  if(pin.startsWith(DEFAULT_PIN))return "처음 비밀번호(0426)로 시작하는 번호는 쓸 수 없어요.";
  return null;
}
const mkErr=(code,message,extra)=>Object.assign(new Error(message||code),{code},extra||{});
function errText(e){
  if(!e)return "처리하지 못했어요. 잠시 후 다시 해주세요.";
  if(e.hint)return e.hint;
  if(e.code==="42501"||e.code==="not_allowed")return "이 작업을 할 권한이 없어요.";
  if(e.code==="23505")return "이미 등록된 값이에요.";
  if(e.message&&/[가-힣]/.test(e.message))return e.message;
  return "처리하지 못했어요. 인터넷 연결을 확인하고 다시 해주세요.";
}
const stripPriv=d=>{const o={};for(const k in d)if(k[0]!=="_")o[k]=d[k];delete o.sample;return o};

/* ----- 실제 서버 ----- */
const sb=CONFIGURED?window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:"wk-auth"}}):null;
const FN_URL=SUPABASE_URL.replace(/\/+$/,"")+"/functions/v1/wk-auth";
const chk=r=>{if(r.error)throw r.error;return r.data};
const remote={
  async sessionEmail(){const {data}=await sb.auth.getSession();return data.session&&data.session.user&&data.session.user.email?data.session.user.email.toLowerCase():null},
  async fn(action,body,withAuth){
    const h={"Content-Type":"application/json",apikey:SUPABASE_ANON_KEY};
    if(withAuth){const {data}=await sb.auth.getSession();if(data.session)h.Authorization="Bearer "+data.session.access_token}
    let r;try{r=await fetch(FN_URL,{method:"POST",headers:h,body:JSON.stringify(Object.assign({action},body))})}catch(_){throw mkErr("network","서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.")}
    let j={};try{j=await r.json()}catch(_){}
    if(!r.ok)throw mkErr(j.error||"server",j.message||"서버에서 문제가 생겼어요. 잠시 후 다시 해주세요.",{left:j.left,seconds:j.seconds});
    return j;
  },
  async login(email,pin){const j=await this.fn("login",{email,pin});const r=await sb.auth.setSession(j.session);if(r.error)throw r.error;return j},
  async changePin(oldPin,newPin){return this.fn("change_pin",{old_pin:oldPin,new_pin:newPin},true)},
  async resetPin(email){return this.fn("reset_pin",{email},true)},
  async logout(){try{await sb.auth.signOut()}catch(_){}},
  async me(email){return chk(await sb.from("wk_people").select("*").eq("email",email).maybeSingle())},
  async teams(){return chk(await sb.from("wk_teams").select("*").order("sort").order("name"))},
  async load(team){
    const [it,pp]=await Promise.all([
      sb.from("wk_items").select("id,owner_email,team_id,data").eq("team_id",team),
      sb.from("wk_people").select("email,name,team_id,role,active,color").eq("team_id",team)]);
    return {rows:chk(it),people:chk(pp)};
  },
  async setItem(id,data,isNew){
    if(isNew){chk(await sb.from("wk_items").insert({id,team_id:st.me.team_id,owner_email:st.me.email,data}));return}
    const r=chk(await sb.from("wk_items").update({data}).eq("id",id).select("id"));
    if(!r||!r.length)throw mkErr("not_allowed");
  },
  async delItem(id){const r=chk(await sb.from("wk_items").delete().eq("id",id).select("id"));if(!r||!r.length)throw mkErr("not_allowed")},
  async setPrefs(color,lists){const r=await sb.rpc("wk_set_my_prefs",{p_color:color==null?null:color,p_lists:lists||null,p_clear_color:false});if(r.error)throw Object.assign(r.error,{code:/color_taken/.test(r.error.message)?"color_taken":r.error.code})},
  async notices(){return chk(await sb.from("wk_notices").select("*").order("created_at",{ascending:false}))},
  async saveNotice(n,isNew){
    if(isNew){chk(await sb.from("wk_notices").insert(n));return}
    const {id,...patch}=n;const r=chk(await sb.from("wk_notices").update(patch).eq("id",id).select("id"));if(!r||!r.length)throw mkErr("not_allowed");
  },
  // 관리
  async people(){return chk(await sb.from("wk_people").select("*").order("team_id").order("name"))},
  async addPeople(rows){chk(await sb.from("wk_people").insert(rows))},
  async updatePerson(email,patch){const r=chk(await sb.from("wk_people").update(patch).eq("email",email).select("email"));if(!r||!r.length)throw mkErr("not_allowed")},
  async deletePerson(email){const r=chk(await sb.from("wk_people").delete().eq("email",email).select("email"));if(!r||!r.length)throw mkErr("not_allowed")},
  async overview(){return chk(await sb.rpc("wk_auth_overview"))||[]},
  async unlock(email){chk(await sb.rpc("wk_unlock",{p_email:email}))},
  async units(){const r=await sb.from("wk_units").select("*").order("sort");return r.error?null:r.data},
  async saveUnit(u,isNew){if(isNew)chk(await sb.from("wk_units").insert(u));else{const {id,...patch}=u;chk(await sb.from("wk_units").update(patch).eq("id",id))}},
  async delUnit(id){chk(await sb.from("wk_units").delete().eq("id",id))},
  async company(){const r=await sb.from("wk_company").select("*").eq("id",1).maybeSingle();return r.error?null:r.data},
  async saveCompany(c){chk(await sb.from("wk_company").upsert(Object.assign({id:1},c,{updated_by:st.me.email,updated_at:new Date().toISOString()})))},
  async setupNeeded(){const r=await sb.rpc("wk_setup_needed");return !r.error&&r.data===true},
  async bootstrap(o){const r=await sb.rpc("wk_bootstrap",{p_company:o.company,p_domain:o.domain,p_team:o.team,p_name:o.name,p_email:o.email});if(r.error)throw r.error;return r.data},
  async reportGet(team,week){return chk(await sb.from("wk_reports").select("*").eq("team_id",team).eq("week",week).maybeSingle())},
  async reportSave(team,week,data){chk(await sb.from("wk_reports").upsert({team_id:team,week,data,updated_by:st.me.email,updated_at:new Date().toISOString()},{onConflict:"team_id,week"}))},
  async saveTeam(t,isNew){if(isNew)chk(await sb.from("wk_teams").insert(t));else{const {id,...patch}=t;chk(await sb.from("wk_teams").update(patch).eq("id",id))}},
  async importLegacy(src,team,dry,reset){return chk(await sb.rpc("wk_import_legacy",{p_src:src,p_team:team,p_dry:dry,p_reset:reset}))},
  async trashList(){const r=await sb.rpc("wk_trash_list",{p_limit:300});if(r.error){if(/wk_trash_list/.test(r.error.message||""))throw mkErr("no_trash_setup","휴지통 설정(3-trash.sql)이 아직 Supabase에 실행되지 않았어요.");throw r.error}return r.data||[]},
  async trashRestore(id){const r=await sb.rpc("wk_trash_restore",{p_id:id});if(r.error)throw r.error;return r.data}
};
const api=CONFIGURED?remote:(typeof local!=="undefined"?local:remote);

/* ----- 화면 ↔ 저장소 연결 (예전 코드와 같은 모양) ----- */
const newId=()=>"i"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const dbShim={
  doc(path){const [c,id]=path.split("/");return {
    async set(data){
      if(c==="items"){const isNew=!st.items.some(i=>i._id===id);await api.setItem(id,stripPriv(wkStampDone(data,st.items.find(i=>i._id===id))),isNew)}
      else{const l={projects:data.projects||st.lists.projects||[],customers:data.customers||st.lists.customers,vendors:data.vendors||st.lists.vendors,cats:data.cats||st.lists.cats};if(st.me&&st.me.my_lists&&Array.isArray(st.me.my_lists.order))l.order=st.me.my_lists.order;await api.setPrefs(null,l);if(st.me)st.me.my_lists=l}
      refreshSoon()},
    async delete(){await api.delItem(id);refreshSoon()},
    async update(patch){const it=st.items.find(i=>i._id===id);if(!it)return;await api.setItem(id,stripPriv(wkStampDone(Object.assign({},it,patch),it)),false);refreshSoon()}
  }},
  collection(c){return {doc(){return dbShim.doc(c+"/"+newId())}}}
};
// 팀 업무에 쓰인 대상사업 (내 목록이 아직 없을 때 처음 목록)
function usedProjects(){const m=new Map();st.items.forEach(i=>{if(i.project)m.set(i.project,(m.get(i.project)||0)+1)});return [...m.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"ko")).map(x=>x[0])}
const personOrder=(a,b)=>(a.role==="leader"?0:1)-(b.role==="leader"?0:1)||a.name.localeCompare(b.name,"ko");
function applyLoad(d){
  st.people=d.people;
  const by=Object.fromEntries(d.people.map(p=>[p.email,p]));
  const act=d.people.filter(p=>p.active).sort(personOrder);
  st.items=d.rows.map(r=>{const o=Object.assign({},r.data,{_id:r.id,_email:r.owner_email});const p=by[r.owner_email];if(p)o.owner=p.name;return o});
  const team=st.teams.find(t=>t.id===st.team)||{lists:{}};
  const base=team.lists||{},mine=st.team===st.me.team_id&&st.me.my_lists?st.me.my_lists:null;
  const pick=k=>mine&&Array.isArray(mine[k])?mine[k]:Array.isArray(base[k])&&base[k].length?base[k]:k==="cats"?CATS:k==="projects"?usedProjects():(DEFAULT_LISTS[k]||[]);
  st.lists={members:act.map(p=>p.name),projects:[...pick("projects")],customers:[...pick("customers")],vendors:[...pick("vendors")],cats:[...pick("cats")],
    colors:Object.fromEntries(d.people.filter(p=>Number.isInteger(p.color)).map(p=>[p.name,p.color]))};
  if(!st.lists.customers.includes("내부"))st.lists.customers.push("내부");
  if(!st.lists.cats.length)st.lists.cats=[...CATS];
}
let loading=false,again=false,rt=null;
async function refresh(){
  if(!st.me)return;
  if(loading){again=true;return}
  loading=true;
  try{
    const me=await api.me(st.me.email);
    if(!me||!me.active){toast("사용할 수 없는 계정이에요. 등록 담당자에게 문의해 주세요.");await doLogout();return}
    if(me.must_change){st.me=me;showPinForm(true);return}
    st.me=me;paintUser();
    const d=await api.load(st.team);
    applyLoad(d);st.loaded=true;render();
    if(st.sumFor&&!$("sumDrawer").hidden)renderSummary();
  }catch(e){
    st.loaded=true;
    if(!st.items.length)$("rows").innerHTML=`<tr><td colspan="4" class="empty"><b>업무 목록을 불러오지 못했어요</b>인터넷 연결을 확인하고 잠시 후 다시 열어주세요.</td></tr>`;
    else toast("서버에 연결하지 못했어요. 잠시 후 다시 시도할게요.");
  }finally{loading=false;if(again){again=false;refresh()}}
}
function refreshSoon(){clearTimeout(rt);rt=setTimeout(refresh,150)}
/* ---------- 공지사항 (전체 공지: 관리자, 팀 공지: 팀장) ---------- */
let notices=[],noticeShownOnce=false,ntQ=[],ntI=0,ntPopup=false,ntScope="all";
const NSEEN=()=>"wk-notice-seen-"+(st.me?st.me.email:"");
function seenSet(){try{const v=localStorage.getItem(NSEEN());return new Set(v?JSON.parse(v):[])}catch(e){return new Set()}}
function markSeen(id){const s_=seenSet();s_.add(id);try{localStorage.setItem(NSEEN(),JSON.stringify([...s_].slice(-300)))}catch(e){}}
const fmtDT=iso=>{const d=new Date(iso);return isNaN(d)?"":`${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`};
const teamName=id=>(st.teams.find(t=>t.id===id)||{}).name||id;
const myTeamScope=()=>st.me?st.me.team_id:"";
function normRow(n){return {id:n.id,scope:n.scope,title:n.title,body:n.body||"",popup:n.popup!==false,active:n.active!==false,createdAt:n.created_at,updatedAt:n.updated_at}}
// 보이는 공지: 전체 공지 + 내 팀 공지 (관리자도 팀 탭에는 내 팀 것만)
// 공지는 관리자가 쓰는 전체 공지 하나의 목록만 써요 (팀 공지는 보이지 않음)
const activeNotices=()=>notices.filter(n=>n.active&&n.title&&n.scope==="all")
  .sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
const unseenNotices=()=>{const ss=seenSet();return activeNotices().filter(n=>!ss.has(n.id))};
function paintNoticeDot(){$("noticeDot").hidden=!unseenNotices().length}
const canWriteNotice=scope=>!!st.me&&scope==="all"&&!!st.me.is_admin;
const canAnyNotice=()=>canWriteNotice("all");
async function loadNotice(){
  if(!st.me)return;
  try{
    const n=(await api.notices()).map(normRow);
    const changed=JSON.stringify(n)!==JSON.stringify(notices);
    notices=n;paintNoticeDot();
    const ss=seenSet();
    const pop=activeNotices().filter(x=>x.popup!==false&&!ss.has(x.id));
    if(!noticeShownOnce&&pop.length&&!anyModalOpen())openNotice(pop,true);
    else if(changed&&!$("noticeModal").hidden&&!ntPopup)fillNotice();
    noticeShownOnce=true;
  }catch(e){}
}
function anyModalOpen(){return !$("noticeModal").hidden||!$("noticeEdit").hidden||!$("authScreen").hidden||!$("adminPanel").hidden}
let ntMode="view";
function fillBoard(){
  const act=activeNotices(ntScope),ss=seenSet();
  $("ntTabs").hidden=true;
  document.querySelectorAll("#ntTabs [data-ns]").forEach(b=>{const k=b.dataset.ns,l=activeNotices(k),un=l.filter(n=>!ss.has(n.id)).length;
    b.setAttribute("aria-selected",k===ntScope);b.innerHTML=`${k==="all"?"전체 공지":esc(teamName(myTeamScope()))+" 공지"}<span class="cnt">${l.length}${un?` · 새 글 ${un}`:""}</span>`});
  $("ntView").hidden=true;$("ntNav").hidden=true;$("ntBack").hidden=true;$("ntHideWrap").hidden=true;
  $("ntBoard").hidden=false;$("ntEmpty").hidden=act.length>0;
  $("ntEmpty").textContent="올라와 있는 공지가 없어요.";
  $("ntRows").innerHTML=act.map((n,i)=>`<button type="button" class="nrow${ss.has(n.id)?" read":""}" data-ni="${i}"><span class="nno mono">${act.length-i}</span><span class="nt">${esc(n.title)}${ss.has(n.id)?"":'<span class="nnew">NEW</span>'}</span><span class="nd mono">${esc(fmtDT(n.createdAt).slice(0,10))}</span></button>`).join("");
  $("ntOk").textContent="닫기";$("ntAdmin").hidden=!canAnyNotice();
}
function fillNotice(){
  if(ntMode==="board"){fillBoard();return}
  $("ntBoard").hidden=true;$("ntBack").hidden=false;
  const n=ntQ[ntI],ok=!!n;
  $("ntView").hidden=!ok;$("ntEmpty").hidden=ok;$("ntHideWrap").hidden=!ok||!ntPopup;
  if(ok){$("ntTitle").textContent=n.title;
    $("ntBody").className="nbody fmt";$("ntBody").innerHTML=fmtNotice(n.body||"");$("ntDate").textContent=fmtDT(n.createdAt)+" 게시"+(n.updatedAt&&n.createdAt&&n.updatedAt.slice(0,16)!==n.createdAt.slice(0,16)?` · ${fmtDT(n.updatedAt)} 수정`:"");
    $("ntNew").hidden=seenSet().has(n.id);if(!ntPopup){markSeen(n.id);paintNoticeDot()}}
  const many=ntQ.length>1;$("ntNav").hidden=!many;$("ntPos").textContent=`${ntI+1} / ${ntQ.length}`;
  $("ntPrev").disabled=ntI===0;$("ntNext").disabled=ntI>=ntQ.length-1;
  const last=ntI>=ntQ.length-1;
  $("ntOk").textContent=ntPopup&&!last?`다음 공지 (${ntI+2}/${ntQ.length})`:"확인";
  $("ntAdmin").hidden=!(n&&canWriteNotice(n.scope));
  $("ntHide").checked=false;
}
// list 를 주면 그 공지들을 차례로(팝업), 없으면 게시판
function fmtInline(t){
  let h=esc(t);
  h=h.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>");
  h=h.replace(/(https?:\/\/[^\s<]+[^\s<.,)])/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
  return h;
}
function fmtNotice(body){
  const lines=String(body||"").replace(/\r/g,"").split("\n");
  let out="",sec=null,list=null,para=[],gap=false;
  const flushP=()=>{if(para.length){const h=(sec?"<p>":'<p class="nend">')+para.map(fmtInline).join("<br>")+"</p>";if(sec)sec.c+=h;else out+=h;para=[]}};
  const flushL=()=>{if(list){const h="<ul>"+list.map(x=>"<li>"+fmtInline(x)+"</li>").join("")+"</ul>";if(sec)sec.c+=h;else out+=h;list=null}};
  const flushS=()=>{flushP();flushL();if(sec){out+=`<div class="nsec"><span class="nn">${esc(sec.n)}</span><div class="nc"><h4>${fmtInline(sec.t)}</h4>${sec.c}</div></div>`;sec=null}};
  for(const raw of lines){
    const l=raw.trim();
    let m;
    if(!l){flushP();flushL();gap=true;continue}
    if((m=l.match(/^(\d{1,2})[.)]\s+(.+)$/))){flushS();sec={n:m[1],t:m[2].replace(/^\*\*(.+)\*\*$/,"$1"),c:""};gap=false;continue}
    if((m=l.match(/^[-•·*]\s+(.+)$/))){flushP();(list=list||[]).push(m[1]);gap=false;continue}
    if(gap&&sec&&sec.c){flushS()}
    gap=false;flushL();
    para.push(l);
  }
  flushS();
  return out;
}
function openNotice(list,popup){
  ntPopup=!!popup;ntQ=Array.isArray(list)?list:activeNotices(ntScope);ntI=0;ntMode=popup?"view":"board";
  fillNotice();$("noticeEdit").hidden=true;$("mscrim").hidden=false;$("noticeModal").hidden=false;setTimeout(()=>$("ntOk").focus(),30)}
function leaveCurrent(){if(ntMode!=="view")return;const n=ntQ[ntI];if(n&&(!ntPopup||$("ntHide").checked))markSeen(n.id)}
function stepNotice(d){leaveCurrent();ntI=Math.max(0,Math.min(ntQ.length-1,ntI+d));fillNotice()}
function closeNotice(){
  if(!$("noticeModal").hidden)leaveCurrent();
  $("noticeModal").hidden=true;$("noticeEdit").hidden=true;$("mscrim").hidden=true;paintNoticeDot();
}
let neWant="",neEditId="";
function openNoticeEdit(){
  neWant=(!$("noticeModal").hidden&&ntMode==="view"&&ntQ[ntI])?ntQ[ntI].id:"";
  const want=notices.find(n=>n.id===neWant);
  const scopes=[["all","전체 공지"]].filter(([k])=>canWriteNotice(k));
  if(!scopes.length)return;
  $("ne-scope").innerHTML=scopes.map(([k,l])=>`<option value="${esc(k)}">${esc(l)}</option>`).join("");
  $("ne-scope").value=want&&canWriteNotice(want.scope)?want.scope:(ntMode==="board"&&ntScope==="team"&&canWriteNotice(myTeamScope())?myTeamScope():scopes[0][0]);
  $("ne-scope").closest(".f").hidden=true;
  $("noticeModal").hidden=true;$("mscrim").hidden=false;$("noticeEdit").hidden=false;$("neErr").hidden=true;
  fillNoticeForm(want&&canWriteNotice(want.scope)?want.id:"");
  setTimeout(()=>$("ne-title").focus(),30);
}
function fillNoticeForm(pick){
  const sc=$("ne-scope").value;
  const act=notices.filter(n=>n.active&&n.scope===sc).sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));
  neEditId=act.some(n=>n.id===pick)?pick:"";
  $("ne-pick").innerHTML=`<option value="">+ 새 공지 쓰기</option>`+act.map(n=>`<option value="${esc(n.id)}">${esc(fmtDT(n.createdAt).slice(5,10))} · ${esc(n.title)}</option>`).join("");
  $("ne-pick").value=neEditId;
  const n=act.find(x=>x.id===neEditId);
  $("ne-title").value=n?n.title:"";$("ne-body").value=n?(n.body||""):"";$("ne-prev").innerHTML=fmtNotice($("ne-body").value);
  $("ne-pop").checked=n?n.popup!==false:true;$("neRemove").hidden=!n;
  $("neSave").textContent=n?"수정 저장":"게시";
  $("neHint").textContent=n?"고친 내용은 바로 반영돼요. 이미 읽은 사람에게 다시 팝업으로 뜨지는 않아요.":sc==="all"?"모든 사람에게 보여요. 안 읽은 사람에게는 접속할 때 팝업으로 떠요.":`${teamName(sc)} 사람에게만 보여요. 안 읽은 사람에게는 접속할 때 팝업으로 떠요.`;
  $("neErr").hidden=true;
}
$("ne-scope").onchange=()=>fillNoticeForm("");
$("ne-pick").onchange=e=>{fillNoticeForm(e.target.value);$("ne-title").focus()};
$("noticeBtn").onclick=()=>openNotice();
$("ntTabs").onclick=e=>{const b=e.target.closest("[data-ns]");if(!b)return;ntScope=b.dataset.ns;fillBoard()};
$("ntRows").onclick=e=>{const r=e.target.closest("[data-ni]");if(!r)return;ntPopup=false;ntQ=activeNotices(ntScope);ntI=+r.dataset.ni;ntMode="view";fillNotice();$("ntBack").focus()};
$("ntBack").onclick=()=>{leaveCurrent();ntPopup=false;ntMode="board";fillNotice()};
$("ntPrev").onclick=()=>stepNotice(-1);$("ntNext").onclick=()=>stepNotice(1);
$("ntOk").onclick=()=>{if(ntPopup&&ntI<ntQ.length-1)stepNotice(1);else closeNotice()};$("ntClose").onclick=closeNotice;
$("ntAdmin").onclick=openNoticeEdit;
$("ne-body").addEventListener("input",()=>{$("ne-prev").innerHTML=fmtNotice($("ne-body").value)});
$("neClose").onclick=closeNotice;$("neCancel").onclick=closeNotice;
$("mscrim").onclick=closeNotice;
$("neForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const title=$("ne-title").value.trim(),body=$("ne-body").value.trim(),scope=$("ne-scope").value;
  if(!title||!body){$("neErr").textContent="제목과 내용을 모두 적어주세요.";$("neErr").hidden=false;(title?$("ne-body"):$("ne-title")).focus();return}
  $("neSave").disabled=true;
  try{
    if(neEditId)await api.saveNotice({id:neEditId,title,body,popup:$("ne-pop").checked},false);
    else{const nid="n"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);await api.saveNotice({id:nid,scope,title,body,popup:$("ne-pop").checked,active:true,author_email:st.me.email},true);markSeen(nid)}
    closeNotice();toast(neEditId?"공지를 고쳤어요":"공지를 게시했어요");await loadNotice();
  }catch(x){$("neErr").textContent=x&&(x.code==="not_allowed"||x.code==="42501")?"이 공지를 쓸 권한이 없어요.":"저장하지 못했어요. 잠시 후 다시 눌러주세요.";$("neErr").hidden=false}
  finally{$("neSave").disabled=false}
});
$("neRemove").onclick=async()=>{
  try{await api.saveNotice({id:neEditId,active:false},false);closeNotice();toast("공지를 내렸어요");await loadNotice()}
  catch(x){$("neErr").textContent="처리하지 못했어요. 잠시 후 다시 눌러주세요.";$("neErr").hidden=false}
};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&(!$("noticeModal").hidden||!$("noticeEdit").hidden)){e.stopImmediatePropagation();closeNotice()}},true);
/* ---------- 바탕화면에 추가 (앱 설치) ---------- */
let installEvt=null;
if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost")){navigator.serviceWorker.register("sw.js").catch(()=>{})}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e;paintInstall()});
window.addEventListener("appinstalled",()=>{installEvt=null;paintInstall();closeInstall();toast("앱으로 설치했어요")});
// 앱(설치된 아이콘)으로 열었으면 설치 버튼을 숨김
const isApp=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const devKind=()=>{const u=navigator.userAgent;return /iPhone|iPad|iPod/i.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1)?"ios":/Android/i.test(u)?"android":"pc"};
function paintInstall(){$("installBtn").hidden=isApp();$("liInstall").hidden=isApp();document.querySelectorAll("[data-insnow]").forEach(b=>b.hidden=!installEvt)}
function insTab(k){document.querySelectorAll("[data-ins]").forEach(b=>b.setAttribute("aria-selected",b.dataset.ins===k));document.querySelectorAll("[data-ip]").forEach(p=>p.hidden=p.dataset.ip!==k)}
let qrDone=false;
function drawQr(){
  if(qrDone)return;const url=location.href.split("#")[0];$("insUrl").textContent=url;
  const go=()=>{try{new QRCode($("insQr"),{text:url,width:120,height:120,correctLevel:QRCode.CorrectLevel.M});qrDone=true}catch(_){}};
  if(window.QRCode){go();return}
  const sc=document.createElement("script");sc.src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";sc.onload=go;sc.onerror=()=>{$("insQr").textContent="QR을 불러오지 못했어요"};document.head.appendChild(sc);
}
function openInstall(){paintInstall();insTab(devKind());drawQr();$("insScrim").hidden=false;$("installModal").hidden=false;setTimeout(()=>$("insClose").focus(),30)}
function closeInstall(){$("installModal").hidden=true;$("insScrim").hidden=true}
$("insClose").onclick=closeInstall;$("insScrim").onclick=closeInstall;
document.querySelector(".instabs").onclick=e=>{const b=e.target.closest("[data-ins]");if(b){insTab(b.dataset.ins);if(b.dataset.ins==="pc")drawQr()}};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("installModal").hidden){e.stopImmediatePropagation();closeInstall()}},true);
$("liInstall").onclick=openInstall;
document.querySelectorAll("[data-insnow]").forEach(b=>b.onclick=async()=>{
  if(!installEvt)return;
  installEvt.prompt();
  try{await installEvt.userChoice}catch(_){}
  installEvt=null;paintInstall();
});
paintInstall();
$("installBtn").onclick=()=>{openInstall();
};
/* ---------- 로그인 화면 ---------- */
const LAST_EMAIL="wk-last-email";
// 숫자 비밀번호 상자: 숨은 입력칸 하나 + 보이는 6칸
const pinBoxes=[...document.querySelectorAll("[data-pin]")].map(box=>{
  const inp=box.querySelector("input"),cells=[...box.querySelectorAll("i")];
  const paint=()=>{const v=inp.value.replace(/\D/g,"").slice(0,6);if(v!==inp.value)inp.value=v;const n=v.length,f=document.activeElement===inp;
    cells.forEach((c,k)=>{c.classList.toggle("fill",k<n);c.classList.toggle("cur",f&&k===Math.min(n,5))})};
  ["input","focus","blur"].forEach(ev=>inp.addEventListener(ev,paint));
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();inp.form.requestSubmit()}});
  paint();return paint;
});
const paintPins=()=>pinBoxes.forEach(f=>f());
const mailOf=v=>{v=String(v||"").trim().toLowerCase();return v&&!v.includes("@")&&MAIL_DOMAIN?v+"@"+MAIL_DOMAIN:v};
const idOf=email=>MAIL_DOMAIN&&email.endsWith("@"+MAIL_DOMAIN)?email.slice(0,-(MAIL_DOMAIN.length+1)):email;
function paintHero(){
  const now=new Date(),mon=new Date(now.getFullYear(),now.getMonth(),now.getDate()-((now.getDay()+6)%7));
  const u=new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()));u.setUTCDate(u.getUTCDate()+4-(u.getUTCDay()||7));
  const y=u.getUTCFullYear(),wk=Math.ceil(((u-Date.UTC(y,0,1))/864e5+1)/7);
  const dow=now.getDay(),seg=96,MN=["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"],DN=["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const sp=k=>{const x=k*seg;return k>=1&&k<=5?` H${x+30} L${x+40} 14 L${x+50} 62 L${x+58} 34 L${x+63} 46 H${x+seg}`:` H${x+seg}`};
  let full="M0 46",done="M0 46";for(let k=0;k<7;k++){full+=sp(k);if(k<=dow)done+=sp(k)}
  const nth=Math.ceil((now.getDate()+new Date(now.getFullYear(),now.getMonth(),1).getDay())/7),cx=dow*seg+seg-6;
  const days=DN.map((n,k)=>{const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-dow+k);return `<div class="${k===dow?"td":k===0||k===6?"we":""}"><b>${n}</b><span>${pad(d.getMonth()+1)}.${pad(d.getDate())}</span></div>`}).join("");
  $("aWeek").innerHTML=`<div class="rz-wl"><b>${MN[now.getMonth()]} ${now.getFullYear()} · WEEK ${nth}</b><span>W${String(wk).padStart(2,"0")}</span></div><svg class="rz-tl" viewBox="0 0 672 70"><path class="bg" d="${full}"></path><path class="rz-draw" pathLength="1" d="${done}"></path><circle class="rz-halo" cx="${cx}" cy="46" r="6"></circle><circle class="rz-dot" cx="${cx}" cy="46" r="6"></circle></svg><div class="rz-days">${days}</div>`;
  $("aVer").textContent="v"+APP_VERSION;if($("bVer"))$("bVer").textContent="v"+APP_VERSION;
}
$("liDom").textContent=MAIL_DOMAIN?"@"+MAIL_DOMAIN:"";
$("li-email").placeholder=MAIL_DOMAIN?"아이디":"회사 메일 주소";
$("liTipBtn").onclick=()=>{const t=$("liTip");t.hidden=!t.hidden;$("liTipBtn").setAttribute("aria-expanded",!t.hidden)};
function showLogin(msg){
  st.me=null;closeAll();closeNotice();$("adminPanel").hidden=true;$("userMenu").hidden=true;
  paintHero();
  $("authScreen").hidden=false;$("loginForm").hidden=false;$("pinForm").hidden=true;if($("setupForm"))$("setupForm").hidden=true;
  $("liErr").hidden=!msg;if(msg)$("liErr").textContent=msg;
  $("li-pin").value="";$("li-email").value=$("li-email").value||idOf(store.get(LAST_EMAIL)||"");paintPins();
  $("authTrial").hidden=CONFIGURED;
  if(!CONFIGURED)$("authTrial").innerHTML="체험 화면이에요. 아이디 <code>admin</code>(관리자) · <code>han</code>(팀장) · <code>kim</code>(팀원) · <code>reg</code>(등록 담당자)로 들어가 보세요. 처음 비밀번호는 모두 <b>0426</b>이에요.";
  setTimeout(()=>($("li-email").value?$("li-pin"):$("li-email")).focus(),30);
}
let pinForced=false;
function showPinForm(forced){
  pinForced=!!forced;closeAll();$("userMenu").hidden=true;paintHero();
  $("authScreen").hidden=false;$("loginForm").hidden=true;$("pinForm").hidden=false;$("authTrial").hidden=true;
  const knowOld=forced&&st._loginPin;
  $("pfOldWrap").hidden=!!knowOld;$("pf-old").value=knowOld?st._loginPin:"";$("pf-new").value="";$("pf-new2").value="";$("pfErr").hidden=true;paintPins();
  $("pinTitle").textContent=forced?"새 비밀번호 정하기":"비밀번호 바꾸기";
  $("pinLead").textContent=forced?(knowOld?`${st.me.name} 님, 처음 비밀번호(0426)로 로그인했어요. 나만 아는 숫자 6자리로 바꾸면 업무 화면이 열려요.`:`${st.me.name} 님, 비밀번호가 0426으로 초기화됐어요. 지금 비밀번호에 0426을 넣고 새 6자리를 정해주세요.`):"지금 비밀번호와 새로 쓸 숫자 6자리를 넣어주세요.";
  $("pfCancel").textContent=forced?"로그아웃":"취소";
  setTimeout(()=>($("pfOldWrap").hidden?$("pf-new"):$("pf-old")).focus(),30);
}
$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const email=mailOf($("li-email").value),pin=$("li-pin").value.trim();
  const err=m=>{$("liErr").textContent=m;$("liErr").hidden=false};
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){err(MAIL_DOMAIN?"회사 메일 아이디를 넣어주세요.":"회사 메일 주소를 정확히 넣어주세요.");$("li-email").focus();return}
  if(!/^\d{4,6}$/.test(pin)){err("비밀번호는 숫자로 넣어주세요. 처음이면 0426이에요.");$("li-pin").focus();return}
  $("liBtn").disabled=true;$("liBtn").textContent="확인하는 중…";
  try{
    const r=await api.login(email,pin);
    store.set(LAST_EMAIL,email);st._loginPin=r.must_change?pin:null;
    await afterLogin(email);
  }catch(x){
    err(x.code==="bad_login"&&x.left!=null&&x.left<=2?`${x.message} (${x.left}번 더 틀리면 10분 동안 잠겨요)`:x.message||errText(x));
    $("li-pin").value="";paintPins();$("li-pin").focus();
  }finally{$("liBtn").disabled=false;$("liBtn").textContent="로그인"}
});
$("pinForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const o=$("pf-old").value.trim(),n=$("pf-new").value.trim(),n2=$("pf-new2").value.trim();
  const err=(m,f)=>{$("pfErr").textContent=m;$("pfErr").hidden=false;if(f){if(f.id==="pf-old")f.value="";else{$("pf-new").value="";$("pf-new2").value="";f=$("pf-new")}paintPins();f.focus()}};
  if(!$("pfOldWrap").hidden&&!o){err("지금 비밀번호를 넣어주세요.",$("pf-old"));return}
  const pr=pinProblem(n);if(pr){err(pr,$("pf-new"));return}
  if(n!==n2){err("새 비밀번호 두 칸이 서로 달라요.",$("pf-new2"));return}
  $("pfBtn").disabled=true;
  try{
    await api.changePin(o,n);st._loginPin=null;
    toast("비밀번호를 바꿨어요");
    if(pinForced){await afterLogin(st.me.email)}else{$("authScreen").hidden=true}
  }catch(x){
    if(x.code==="no_session"){showLogin("다시 로그인해 주세요.");return}
    if(x.code==="locked"){await doLogout(x.message);return}
    if(x.code==="bad_old"){$("pfOldWrap").hidden=false}
    err(x.message||errText(x),x.code==="bad_old"?$("pf-old"):$("pf-new"));
  }finally{$("pfBtn").disabled=false}
});
$("pfCancel").onclick=()=>{if(pinForced)doLogout();else $("authScreen").hidden=true};
async function afterLogin(email){
  wkPreload();
  const me=await api.me(email);
  if(!me||!me.active){await doLogout("사용할 수 없는 계정이에요. 등록 담당자에게 문의해 주세요.");return}
  st.me=me;
  if(me.must_change){showPinForm(true);return}
  await startApp();
}
async function doLogout(msg){
  if(rp.open){rp.open=false;$("reportPage").hidden=true;document.querySelector("header.top").hidden=false;document.querySelector("main.wrap").hidden=false}rp.final=null;rp.finalFor="";
  await api.logout();st.me=null;st.items=[];st.people=[];notices=[];noticeShownOnce=false;
  render();showLogin(msg||"");
}

/* ---------- 내 메뉴 · 팀 바꾸기 ---------- */
function paintUser(){
  const m=st.me;if(!m)return;
  const tn=teamName(st.team);
  const ttl=TITLE_FORMAT.replace("{앱}",APP_TITLE).replace("{팀}",tn||"");$("brandTitle").textContent=ttl;document.title=ttl;
  $("userName").textContent=`내정보 - ${m.name}`;
  const reg=m.is_admin||m.is_registrar;
  $("adminBtn").hidden=!reg;$("miAdmin").hidden=true;
  $("openSettings").hidden=!canAddHere();
  const multi=m.is_admin&&st.teams.length>1;
  $("teamSwitch").hidden=!multi;
  if(multi){$("teamSwitch").innerHTML=[...st.teams].sort((x,y)=>(y.id===m.team_id)-(x.id===m.team_id)).map(t=>`<option value="${esc(t.id)}">${esc(t.name)}${t.id===m.team_id?" (내 팀)":""}</option>`).join("");$("teamSwitch").value=st.team}
  $("userMeta").innerHTML=`<b>${esc(m.name)}${m.role==="leader"?'<span class="rtag">팀장</span>':""}${m.is_admin?'<span class="rtag adm">관리자</span>':m.is_registrar?'<span class="rtag reg">등록 담당자</span>':""}</b><span>${esc(m.email)}</span><br><span>${esc(teamName(m.team_id))}</span>`;
}
$("teamSwitch").onchange=e=>{st.team=e.target.value;store.set("wk-team-"+st.me.email,st.team);st.owner=st.team===st.me.team_id?st.me.name:"전체";st.items=[];closeAll();paintUser();render();refresh()};
$("userBtn").onclick=e=>{
  const m=$("userMenu");if(!m.hidden){m.hidden=true;$("userBtn").setAttribute("aria-expanded","false");return}
  m.hidden=false;$("userBtn").setAttribute("aria-expanded","true");
  const r=$("userBtn").getBoundingClientRect();m.style.top=(r.bottom+6)+"px";m.style.left=Math.max(12,Math.min(r.right-m.offsetWidth,innerWidth-m.offsetWidth-12))+"px";
  m.querySelector("button:not([hidden])").focus();
};
document.addEventListener("click",e=>{if(!$("userMenu").hidden&&!e.target.closest("#userMenu")&&!e.target.closest("#userBtn")){$("userMenu").hidden=true;$("userBtn").setAttribute("aria-expanded","false")}});
$("miPin").onclick=()=>{$("userMenu").hidden=true;showPinForm(false)};
$("miLogout").onclick=()=>{$("userMenu").hidden=true;doLogout()};
$("miAdmin").onclick=()=>{$("userMenu").hidden=true;wkPart("admin").then(()=>openAdmin())};
$("adminBtn").onclick=()=>wkPart("admin").then(()=>openAdmin());
$("reportBtn").onclick=()=>wkPart("report").then(()=>openReport());

/* ---------- 실험: 캘린더를 화면 아래 끝까지 ---------- */
function fitMonth(){
  const mv=$("monthView");if(!mv)return;
  if(mv.hidden||innerWidth<1000){mv.classList.remove("fit");mv.style.height="";return}
  // 아래에 달력 한 주 칸만큼 여백을 남김: 남은 높이를 (주 수 + 1)로 나눠 한 칸 높이를 정함
  const top=mv.getBoundingClientRect().top+scrollY;
  const head=mv.querySelector(".mhead"),dow=mv.querySelector(".mdow"),n=mv.querySelectorAll(".mrow").length||5;
  const fixed=(head?head.offsetHeight:0)+(dow?dow.offsetHeight:0)+2;
  const row=(innerHeight-top-fixed)/(n+1);
  mv.classList.add("fit");mv.style.height=Math.max(460,Math.round(fixed+row*n))+"px";
}
// 같은 업무 함께 강조
let hlId=null;
function setHl(id,from){
  const mv=$("monthView");if(id===hlId)return;hlId=id;
  mv.querySelectorAll(".hl").forEach(el=>el.classList.remove("hl"));
  if(!id)return;
  const sel=`[data-id="${CSS.escape(id)}"]`;
  mv.querySelectorAll(".mseg"+sel+",.mitem"+sel).forEach(el=>el.classList.add("hl"));
}
$("monthView").addEventListener("mouseover",e=>{const t=e.target.closest(".mseg[data-id],.mitem[data-id]");setHl(t?t.dataset.id:null,t&&t.classList.contains("mseg")?"cal":"list")});
$("monthView").addEventListener("mouseleave",()=>setHl(null));
$("monthView").addEventListener("focusin",e=>{const t=e.target.closest(".mseg[data-id],.mitem[data-id]");if(t)setHl(t.dataset.id,t.classList.contains("mseg")?"cal":"list")});
new MutationObserver(()=>{hlId=null}).observe($("monthView"),{childList:true});
new MutationObserver(()=>requestAnimationFrame(fitMonth)).observe($("monthView"),{childList:true,attributes:true,attributeFilter:["hidden"]});
addEventListener("resize",fitMonth);
/* ---------- 시작 ---------- */
let timersOn=false;
async function startApp(){
  $("authScreen").hidden=true;
  try{st.teams=await api.teams()}catch(_){st.teams=[]}
  const saved=st.me.is_admin?store.get("wk-team-"+st.me.email):null;
  st.team=saved&&st.teams.some(t=>t.id===saved)?saved:st.me.team_id;
  st.owner=st.team===st.me.team_id?st.me.name:"전체";
  st.db=dbShim;st.canWrite=true;st.items=[];
  paintUser();render();
  noticeShownOnce=false;
  await refresh();loadNotice();
  if(location.hash==="#report")wkPart("report").then(()=>openReport());
  if(!timersOn){timersOn=true;
    setInterval(()=>{if(document.visibilityState==="visible")loadNotice()},60000);
    setInterval(()=>{if(document.visibilityState==="visible")refresh()},15000);
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refresh()});}
}

/* ---------- 목록 보기: 한 업무 한 줄, 기한 순. 체크하면 '완료' ---------- */
let lvSort={key:"",dir:1};
const LV_SORTS=[["","기본 순서"],["wrote","작성일"],["due","기한"],["flag","일정 상태"],["cat","구분"],["proj","대상사업"],["cust","고객사"],["own","담당"]];
function renderList(rows){
  const W=st.week,N=nextKey(W),isCur=W===CUR,pc=personColors(),all=st.owner==="전체";
  const canDrag=!lvSort.key;
  const myOrd=(st.me&&st.me.my_lists&&Array.isArray(st.me.my_lists.order))?st.me.my_lists.order:[];
  const list=[];let i=0;
  for(const r of rows){
    if(r.cur)list.push({r,e:r.cur,k:"cur",i:i++});
    if(r.nxt&&!r.nxt.carried)list.push({r,e:r.nxt,k:"nxt",i:i++});
  }
  if(myOrd.length){const pos=new Map(lvKeys(myOrd).map((key,k)=>[key,k]));
    list.sort((a,b)=>{const A=pos.get(a.r.it._id+"|"+a.k)??1e6+a.i,B=pos.get(b.r.it._id+"|"+b.k)??1e6+b.i;return A-B});list.forEach((x,k)=>x.i=k)}
  // 일정 상태: 0 기한 지남, 1 오늘까지, 2 이번주, 3 다음주 계획, 4 완료
  const flagOf=x=>{const e=x.e;if(x.k==="nxt")return 3;if(e.status==="완료")return 4;if(isCur&&e.due&&e.due<todayKey)return 0;if(isCur&&e.due===todayKey)return 1;return 2};
  list.forEach(x=>{x.f=flagOf(x);x.w=(x.e.carried?writtenOf(x.r.it,x.r.prev,x.r.prevWk):writtenOf(x.r.it,x.e,x.k==="cur"?W:N))||""});
  const FL=[["late","기한 지남"],["today","오늘까지"],["week",isCur?"이번주":"이 주"],["next",isCur?"다음주 계획":"다음 주 계획"],["done","완료"]];
  const stRank={대기:0,진행:1,완료:2};
  const val={wrote:x=>x.w||"0000",due:x=>x.e.due||"9999",flag:x=>x.f,cat:x=>x.r.it.category||"",proj:x=>x.r.it.project||"",cust:x=>x.r.it.customer||"",own:x=>x.r.it.owner||"",task:x=>x.e.task||"",part:x=>x.r.it.part||"",st:x=>x.k==="nxt"?3:stRank[x.e.status]??1};
  if(lvSort.key&&val[lvSort.key]){const f=val[lvSort.key],d=lvSort.dir;
    list.sort((a,b)=>{const A=f(a),B=f(b);const c=typeof A==="number"?A-B:String(A).localeCompare(String(B),"ko");return c*d||(a.e.due||"9999").localeCompare(b.e.due||"9999")||a.i-b.i})}
  const line=x=>{const {r,e,k}=x;
    const it=r.it,mine=isMine(it),done=x.f===4;
    const ck=k==="nxt"?`<span class="lv-plan">계획</span>`
      :`<button type="button" class="lv-ck${done?" on":""}" data-lvck="${esc(it._id)}" ${mine?"":"disabled"} aria-pressed="${done}" aria-label="${esc(e.task)} ${done?"완료 취소":"완료로 표시"}" title="${mine?(done?"체크를 풀면 '진행'으로 돌아가요":"체크하면 '완료'가 돼요"):"담당자 본인만 체크할 수 있어요"}"><i>✓</i></button>`;
    const stc={진행:"prog",대기:"wait",완료:"done"}[e.status]||"prog";
    const stHtml=(e.carried?'<span class="lv-st carry">이월</span>':"")+(k==="nxt"?"":`<span class="lv-st ${stc}">${esc(e.status||"진행")}</span>`);
    const [fc,fl]=FL[x.f];
    return `<tr class="lv-row${done?" done":""}" data-lvopen="${esc(it._id)}" data-lvkey="${esc(it._id+"|"+k)}" tabindex="0"><td class="c-drag"><span class="lv-hd${canDrag?"":" off"}" data-lvdrag="1" title="${canDrag?"끌어서 순서 바꾸기":"기본 순서에서 끌어서 옮길 수 있어요"}" aria-label="끌어서 순서 바꾸기">⠿</span></td>
      <td class="c-cat"><span class="cat">${esc(it.category||"-")}</span></td>
      <td class="c-task">${esc(e.task)}</td>
      <td class="c-proj">${esc(it.project||"")}</td><td class="c-cust">${esc(it.customer||"")}</td><td class="c-part">${esc(it.part||"")}</td>
      <td class="c-wrote">${x.w?esc(shortDate(keyOf(new Date(x.w)))):(e.carried?'<span class="lv-dim">이월</span>':"")}</td>
      <td class="c-due">${e.due?`<span class="dd">~${esc(shortDate(e.due))}</span>`:""}<span class="lv-f ${fc}">${fl}</span></td>
      <td class="c-st">${stHtml}</td>
      ${all?`<td class="c-own"><i class="pdot" style="background:var(--pc${pcol(pc,it.owner)})"></i>${esc(it.owner||"")}</td>`:""}<td class="c-ck">${ck}</td></tr>`;
  };
  const th=(key,label,cls)=>{const on=lvSort.key===key;return `<th class="${cls||""}${on?" on":""}"><button type="button" class="lv-sh" data-lvsort="${key}" aria-sort="${on?(lvSort.dir>0?"ascending":"descending"):"none"}">${label}<span class="ar">${on?(lvSort.dir>0?"▲":"▼"):"↕"}</span></button></th>`};
  const head=`<thead><tr><th class="c-drag" title="⠿를 끌어서 내 순서를 정할 수 있어요"></th>${th("cat","구분","c-cat")}${th("task","할 일")}${th("proj","대상사업")}${th("cust","고객사","c-cust")}${th("part","품목","c-part")}${th("wrote","작성일","c-wrote")}${th("due","기한","c-due")}${th("st","상태")}${all?th("own","담당"):""}<th class="c-ck">완료</th></tr></thead>`;
  const cnt=[0,0,0,0,0];list.forEach(x=>cnt[x.f]++);
  const sortBar=`<div class="lv-sort" role="group" aria-label="정렬"><span class="dlab">정렬</span>${LV_SORTS.map(([k,l])=>`<button type="button" data-lvsort="${k}" aria-pressed="${lvSort.key===k}">${l}${lvSort.key===k&&k?(lvSort.dir>0?" ▲":" ▼"):""}</button>`).join("")}${myOrd.length?'<button type="button" data-lvreset="1" title="끌어서 바꾼 내 순서를 지워요">↺ 내 순서 지우기</button>':""}</div>`;
  const sum=`<span class="lv-sum">${cnt[0]?`<span class="lv-f late">기한 지남 ${cnt[0]}</span>`:""}${cnt[1]?`<span class="lv-f today">오늘까지 ${cnt[1]}</span>`:""}</span>`;
  $("listView").innerHTML=`<div class="lvbox"><div class="lv-top">${canAddHere()?`<button class="btn" type="button" data-lvadd="1">+ 업무 추가</button>`:""}${sum}<span class="spacer" style="flex:1"></span><span class="hint" style="margin:0">⠿를 끌어서 내 순서로 바꿀 수 있어요${canDrag?"":" (기본 순서에서)"}${myOrd.length&&canDrag?' · <button type="button" class="lv-reset" data-lvreset="1">순서 처음대로</button>':""}</span>${sortBar}</div>`
    +(list.length?`<div class="lvwrap"><table class="lvt">${head}<tbody>${list.map(line).join("")}${canAddHere()?`<tr class="lv-addrow"><td colspan="${all?12:11}"><button type="button" class="lv-addbtn" data-lvadd="1">+ 업무 추가</button></td></tr>`:""}</tbody></table></div>`:`<div class="lv-empty"><b>이 주에 할 일이 없어요</b><br>${canAddHere()?'<button type="button" class="lv-addbtn" data-lvadd="1" style="margin-top:10px">+ 업무 추가</button>':""}</div>`)+`</div>`;
}
$("listView").addEventListener("click",e=>{
  const ck=e.target.closest("[data-lvck]");
  if(ck){e.stopPropagation();if(ck.disabled)return;const on=ck.classList.contains("on");quickStatus(ck.dataset.lvck,on?"진행":"완료");return}
  if(e.target.closest("[data-lvreset]")){saveMyOrder([]);return}
  if(e.target.closest("[data-lvdrag]")||lvDragJust)return;
  const so=e.target.closest("[data-lvsort]");if(so){const k=so.dataset.lvsort;if(!k)lvSort={key:"",dir:1};else if(lvSort.key===k)lvSort.dir*=-1;else lvSort={key:k,dir:k==="wrote"?-1:1};render();return}
  if(e.target.closest("[data-lvadd]")){if(canAddHere())openDrawer(null,st.me.name);return}
  const row=e.target.closest("[data-lvopen]");
  if(row)openSummary(row.dataset.lvopen)
});
let lvDrag=null,lvDragJust=false;
// 저장된 순서: 줄 단위("업무id|cur" 이번주 할 일, "업무id|nxt" 다음주 계획). 예전처럼 업무id만 있으면 두 줄로 풀어서 읽음
const lvKeys=a=>a.flatMap(x=>String(x).includes("|")?[x]:[x+"|cur",x+"|nxt"]);
async function saveMyOrder(order){
  const prev=st.me.my_lists||null;
  const l=Object.assign({},prev||{});if(order.length)l.order=order;else delete l.order;
  st.me.my_lists=Object.keys(l).length?l:null;render();
  try{await api.setPrefs(null,st.me.my_lists||{order:[]});if(!order.length)toast("처음 순서로 돌아왔어요")}catch(e){st.me.my_lists=prev;render();toast(errText(e))}
}
/* 부드럽게 끌기: 잡은 줄은 손가락을 따라오고, 나머지 줄은 미끄러지듯 자리를 비켜줌 */
const lvReduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
function lvFlip(rows,mutate){
  const before=new Map(rows.map(r=>[r,r.getBoundingClientRect().top]));
  mutate();
  for(const r of rows){const d=before.get(r)-r.getBoundingClientRect().top;if(!d||lvReduce)continue;
    r.style.transition="none";r.style.transform=`translateY(${d}px)`;r.getBoundingClientRect();
    r.style.transition="transform .18s cubic-bezier(.2,.8,.2,1)";r.style.transform=""}
}
function lvFollow(){const d=lvDrag;if(!d)return;
  d.group.forEach(r=>{r.style.transition="none";r.style.transform=""});
  const top=d.group[0].getBoundingClientRect().top;const dy=d.y-d.grab-top;
  d.group.forEach(r=>r.style.transform=`translateY(${dy}px)`);
}
function lvTick(){const d=lvDrag;if(!d)return;
  const edge=70,vh=innerHeight;let v=0;if(d.y>vh-edge)v=Math.min(14,(d.y-(vh-edge))/4);else if(d.y<edge)v=-Math.min(14,(edge-d.y)/4);
  if(v){scrollBy(0,v);lvPlace()}
  d.raf=requestAnimationFrame(lvTick);
}
function lvPlace(){const d=lvDrag;if(!d)return;
  const others=[...d.tb.querySelectorAll("tr.lv-row")].filter(r=>!d.group.includes(r));
  const mid=d.y-d.grab+d.h/2;let before=null;
  for(const r of others){const b=r.getBoundingClientRect(),t=b.top-(parseFloat((r.style.transform.match(/-?[\d.]+/)||[0])[0])||0);if(mid<t+b.height/2){before=r;break}}
  const cur=d.group[d.group.length-1].nextElementSibling;
  if(before!==cur&&before!==d.group[0]){lvFlip(others,()=>d.group.forEach(r=>d.tb.insertBefore(r,before)));d.moved=true}
  lvFollow();
}
$("listView").addEventListener("pointerdown",e=>{
  const h=e.target.closest("[data-lvdrag]");if(!h||e.button>0)return;
  if(lvSort.key){toast("'기본 순서'를 누르면 끌어서 옮길 수 있어요");return}
  e.preventDefault();const tr=h.closest("tr");const tb=tr.parentElement;
  const id=tr.dataset.lvkey;const group=[tr];
  const top=group[0].getBoundingClientRect().top,bot=group[group.length-1].getBoundingClientRect().bottom;
  group.forEach(r=>r.classList.add("lv-dragging","lv-lift"));document.body.classList.add("lv-grabbing");
  lvDrag={id,group,tb,y:e.clientY,y0:e.clientY,grab:e.clientY-top,h:bot-top,moved:false,raf:0};
  try{h.setPointerCapture(e.pointerId)}catch(_){}
  lvDrag.raf=requestAnimationFrame(lvTick);
});
$("listView").addEventListener("pointermove",e=>{
  const d=lvDrag;if(!d)return;d.y=e.clientY;if(Math.abs(d.y-d.y0)>3)d.moved=true;lvPlace();
});
function lvDrop(){
  const d=lvDrag;if(!d)return;lvDrag=null;cancelAnimationFrame(d.raf);document.body.classList.remove("lv-grabbing");
  d.group.forEach(r=>{r.style.transition=lvReduce?"none":"transform .2s cubic-bezier(.2,.8,.2,1)";r.style.transform="";r.classList.remove("lv-lift")});
  setTimeout(()=>d.group.forEach(r=>r.classList.remove("lv-dragging")),lvReduce?0:220);
  if(!d.moved)return;lvDragJust=true;setTimeout(()=>lvDragJust=false,50);
  const vis=[...d.tb.querySelectorAll("tr.lv-row")].map(r=>r.dataset.lvkey);
  const old=lvKeys((st.me.my_lists&&Array.isArray(st.me.my_lists.order))?st.me.my_lists.order:[]);
  const has=x=>st.items.some(i=>i._id===x.split("|")[0]);
  const nat=[];buildRows().forEach(r=>{nat.push(r.it._id+"|cur",r.it._id+"|nxt")});
  const base=[...old.filter(has),...nat.filter(x=>!old.includes(x))];
  const visSet=new Set(vis);let k=0;const full=base.map(x=>visSet.has(x)?vis[k++]:x);
  vis.slice(k).forEach(x=>{if(!full.includes(x))full.push(x)});
  // 내려앉는 움직임이 끝난 뒤 저장(다시 그리기)
  setTimeout(()=>saveMyOrder([...new Set([...full,...old.filter(x=>!has(x))])].slice(0,800)),lvReduce?0:230);
}
$("listView").addEventListener("pointerup",lvDrop);
$("listView").addEventListener("pointercancel",lvDrop);
$("listView").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.matches("[data-lvopen]"))e.target.click()});

(()=>{const segs=[document.querySelector("#writeView>.bar>.viewmode"),$("doneMode")].filter(Boolean);
  const paint=el=>{let ind=el.querySelector(".seg-ind");if(!ind){ind=document.createElement("span");ind.className="seg-ind";ind.setAttribute("aria-hidden","true");el.prepend(ind)}
    const on=el.querySelector('button[aria-pressed="true"]');if(!on||!on.offsetWidth){ind.style.opacity=0;return}
    ind.style.opacity=1;ind.style.width=on.offsetWidth+"px";ind.style.height=on.offsetHeight+"px";ind.style.transform=`translate(${on.offsetLeft}px,${on.offsetTop}px)`;
    if(!el.classList.contains("seg-ready"))requestAnimationFrame(()=>el.classList.add("seg-ready"))};
  const mo=new MutationObserver(()=>segs.forEach(paint));
  segs.forEach(el=>mo.observe(el,{subtree:true,attributes:true,attributeFilter:["aria-pressed"]}));
  addEventListener("resize",()=>segs.forEach(paint));
  document.fonts&&document.fonts.ready.then(()=>segs.forEach(paint));
  setTimeout(()=>segs.forEach(paint),0);
})();
/* 아이폰처럼 넘어가기: 지금 화면은 옆으로 밀려나며 흐려지고, 새 화면이 반대쪽에서 들어옴 */
(()=>{const V={month:"monthView",table:"tableView",list:"listView",gantt:"calView"},ORD=["month","table","list"];
  const reduce=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE="cubic-bezier(.32,.72,0,1)",DUR=380;
  let busy=null;
  function swap(change,dir){
    const host=$("writeView"),old=$(V[st.layout]);
    if(busy){busy();busy=null}
    if(reduce()||!old||old.hidden||!old.animate){change();return}
    if(!dir){ // 같은 화면 안에서 내용만 바뀜: 살짝 겹쳐 바뀌기
      change();const now=$(V[st.layout]);if(now)now.animate([{opacity:.35},{opacity:1}],{duration:260,easing:"ease-out"});return}
    const hr=host.getBoundingClientRect(),r=old.getBoundingClientRect(),sc=old.scrollLeft;
    const dx=Math.min(140,r.width*.16);
    change();                                   // 새 화면 그리기 (옛 화면은 숨겨짐)
    const now=$(V[st.layout]);
    // 옛 화면을 다시 꺼내 같은 자리에 겹쳐 두고 밀어내기 (복사하지 않아 가벼움)
    const oldCss=old.style.cssText;
    old.hidden=false;
    Object.assign(old.style,{position:"absolute",left:(r.left-hr.left)+"px",top:(r.top-hr.top)+"px",width:r.width+"px",height:r.height+"px",margin:"0",pointerEvents:"none",zIndex:"1",willChange:"transform,opacity"});
    old.scrollLeft=sc;old.setAttribute("aria-hidden","true");
    const nowCss=now?now.style.cssText:"";
    if(now){now.style.position=getComputedStyle(now).position==="static"?"relative":now.style.position;now.style.zIndex="2";now.style.willChange="transform,opacity"}
    const a1=old.animate([{transform:"translate3d(0,0,0)",opacity:1},{transform:`translate3d(${-dir*dx}px,0,0)`,opacity:0}],{duration:DUR*.75,easing:EASE,fill:"forwards"});
    const a2=now?now.animate([{transform:`translate3d(${dir*dx}px,0,0)`,opacity:0},{transform:"translate3d(0,0,0)",opacity:1}],{duration:DUR,easing:EASE}):null;
    const done=()=>{a1.cancel();old.style.cssText=oldCss;old.removeAttribute("aria-hidden");old.hidden=V[st.layout]!==old.id;if(now)now.style.cssText=nowCss};
    busy=done;
    (a2||a1).onfinish=()=>{if(busy===done){done();busy=null}};
  }
  const vm=document.querySelector("#writeView>.bar>.viewmode");
  if(vm)vm.onclick=e=>{const b=e.target.closest("[data-layout]");if(!b||b.dataset.layout===st.layout)return;
    const a=ORD.indexOf(st.layout),z=ORD.indexOf(b.dataset.layout);
    swap(()=>{st.layout=b.dataset.layout;store.set("wk-layout",st.layout);render()},z>a?1:-1)};
  $("doneMode").onclick=e=>{const b=e.target.closest("[data-done]");if(!b||b.dataset.done===st.doneMode)return;
    swap(()=>{st.doneMode=b.dataset.done;store.set("wk-done",st.doneMode);render()},0)};
})();
(()=>{const q=$("q");if(!q)return;const slot=document.createElement("div");slot.id="filtSlot";q.parentNode.insertBefore(slot,q);slot.append($("moreFilters"),$("moreBtn"),q)})();


/* ---------- 회사 설정: 로그인 전에도 쓰이는 값 (회사 이름·로고·메일 도메인·보고서 팀 탭·배경) ---------- */
let CO=null,CO0=null;
function applyCompany(co){
  const img=document.querySelector("#authScreen .afull");
  if(!CO0)CO0={dom:MAIL_DOMAIN,depts:RP_DEPTS,bg:REPORT_BG,logo:img?img.src:""};
  CO=co||null;
  MAIL_DOMAIN=(co&&co.mail_domain)||CO0.dom;
  RP_DEPTS=co&&Array.isArray(co.report_depts)&&co.report_depts.length?co.report_depts:CO0.depts;
  REPORT_BG=(co&&co.report_bg)||CO0.bg;
  if(img){img.src=(co&&co.logo)||CO0.logo;img.alt=(co&&co.name)||"회사 로고"}
  $("liDom").textContent=MAIL_DOMAIN?"@"+MAIL_DOMAIN:"";$("li-email").placeholder=MAIL_DOMAIN?"아이디":"회사 메일 주소";
}
function showSetup(){showLogin("");$("loginForm").hidden=true;$("setupForm").hidden=false;$("authTrial").hidden=true;$("suErr").hidden=true;
  const c=CO||{},u=c.setup||{},put=(id,v)=>{if(v&&!$(id).value)$(id).value=v};
  put("su-co",c.name);put("su-dom",c.mail_domain);put("su-team",u.team);put("su-name",u.name);put("su-id",u.email?String(u.email).replace("@"+(c.mail_domain||"#"),""):"");
  paintSu();setTimeout(()=>$("suBtn").focus(),40)}
$("liSetup").addEventListener("click",showSetup);
$("suBack").addEventListener("click",()=>showLogin(""));
function paintSu(){const d=$("su-dom").value.replace(/^@+/,"").trim().toLowerCase();$("suDom").textContent=d?"@"+d:""}
$("su-dom").addEventListener("input",paintSu);
$("setupForm").addEventListener("submit",async e=>{
  e.preventDefault();const v=id=>$(id).value.trim();
  const o={company:v("su-co"),domain:v("su-dom").replace(/^@+/,"").toLowerCase(),team:v("su-team"),name:v("su-name"),email:v("su-id").toLowerCase()};
  const err=m=>{$("suErr").textContent=m;$("suErr").hidden=false};$("suErr").hidden=true;
  if(!o.company||!o.team||!o.name||!o.email){err("빈칸을 모두 채워주세요.");return}
  if(!o.email.includes("@")&&!o.domain){err("회사 메일 주소 뒷부분을 적거나, 관리자 메일을 전부 적어주세요.");return}
  $("suBtn").disabled=true;
  try{const em=await api.bootstrap(o);try{applyCompany(await api.company())}catch(_){}
    $("liSetup").hidden=true;showLogin("");$("li-email").value=idOf(em);$("li-pin").value="";paintPins();toast("설정이 끝났어요. 처음 비밀번호 0426으로 로그인하세요.");setTimeout(()=>$("li-pin").focus(),60)}
  catch(x){err(errText(x))}
  finally{$("suBtn").disabled=false}
});
// 보고서 위쪽 팀 탭: 조직도(팀 순서)에서 자동
function rpDeptsNow(){const ts=[...(st.teams||[])].sort((a,b)=>(+a.sort||0)-(+b.sort||0));return ts.length>1?ts.map(t=>t.name.replace(/팀$/,"")):RP_DEPTS}

/* ---------- 완료 날짜 기록 ---------- */
function wkStampDone(data,prev){
  if(!data||!data.weeks)return data;const out=Object.assign({},data,{weeks:{}});
  Object.entries(data.weeks).forEach(([k,e])=>{if(!e||typeof e!=="object"){out.weeks[k]=e;return}const x=Object.assign({},e),pe=prev&&prev.weeks&&prev.weeks[k];
    if(x.status==="완료"){if(!x.done_at)x.done_at=(pe&&pe.status==="완료"&&pe.done_at)||todayKey}else delete x.done_at;out.weeks[k]=x});
  return out}
/* ---------- 점검 → 내 리듬 (개인) ---------- */
// 누구의 리듬을 볼지: 본인은 항상, 팀장은 내 팀원, 관리자는 모든 팀의 사람
function rhCanSee(name){if(!st.me)return false;if(st.me.is_admin)return true;if(st.team!==st.me.team_id)return false;return name===st.me.name||st.me.role==="leader"}
function myRhythmHtml(base){
  if(!st.me)return "";
  const self=st.team===st.me.team_id?st.me.name:null,boss=!!st.me.is_admin||(st.me.role==="leader"&&st.team===st.me.team_id);
  const pick=st.owner&&st.owner!=="전체"?st.owner:null;
  const who=pick?(rhCanSee(pick)?pick:null):self;
  const strip=boss&&!pick?rhStrip(base):"";
  if(!who)return strip?`<div class="panel rhythm none"><h2>팀원 리듬 <span>${esc(rangeOf(st.week))} · 이름을 누르면 그 사람의 리듬을 자세히 봐요</span></h2>${strip}</div>`:"";
  return rhPanel(base,who,strip);
}
function rhLevel(base,name){const dd=d=>d?Math.round((parseKey(d)-parseKey(todayKey))/864e5):null;
  const rows=(base||[]).filter(r=>r.it.owner===name&&r.cur&&r.cur.task),open=rows.filter(r=>r.cur.status!=="완료");
  const late=open.filter(r=>r.late||(r.cur.due&&dd(r.cur.due)<0)).length,soon=open.filter(r=>!r.late&&r.cur.due&&dd(r.cur.due)>=0&&dd(r.cur.due)<=2).length;
  return {t:rows.length,d:rows.length-open.length,late,lv:!rows.length?"none":late>=2?"red":(late===1||soon>=2)?"yellow":"green"}}
function rhStrip(base){const names=[...new Set([...(st.lists.members||[]),...(base||[]).map(r=>r.it.owner).filter(Boolean)])];
  const L=names.map(n=>({n,...rhLevel(base,n)})).filter(x=>x.t||(st.lists.members||[]).includes(x.n));
  const ord={red:0,yellow:1,green:2,none:3};L.sort((a,b)=>ord[a.lv]-ord[b.lv]||a.n.localeCompare(b.n,"ko"));
  const cnt=k=>L.filter(x=>x.lv===k).length;
  return `<div class="rteam"><span class="rsub" style="margin:0 4px 0 0;min-height:0">팀원 리듬</span><span class="rtsum"><i class="red"></i>${cnt("red")} <i class="yellow"></i>${cnt("yellow")} <i class="green"></i>${cnt("green")}</span>
    ${L.map(x=>`<button type="button" class="rchip ${x.lv}" data-rhwho="${esc(x.n)}" title="${x.t?`${x.d}/${x.t}건 완료${x.late?` · 기한 지남 ${x.late}건`:""}`:"이번 주 할 일 없음"}"><i></i>${esc(x.n)}<small>${x.t?`${x.d}/${x.t}`:"-"}</small></button>`).join("")}</div>`}
function rhPanel(base,me,strip){
  const W=st.week,mine=st.items.filter(it=>it.owner===me),isMe=me===st.me.name&&st.team===st.me.team_id;
  const dd=d=>d?Math.round((parseKey(d)-parseKey(todayKey))/864e5):null;
  const stat=k=>{let t=0,d=0,on=0,dn=0;mine.forEach(it=>{const e=(it.weeks||{})[k];if(!e||!e.task)return;t++;if(e.status==="완료"){d++;if(e.done_at&&e.due){dn++;if(e.done_at<=e.due)on++}}});return {k,t,d,on,dn,r:t?d/t:null}};
  const ks=[];let k=W;for(let i=0;i<8;i++){ks.unshift(k);k=prevKey(k)}
  // 이번 주는 점검 화면과 같은 목록(이월 포함)으로 셈
  const rows=(base||[]).filter(r=>r.it.owner===me&&r.cur&&r.cur.task);
  const S=ks.map(stat);S[S.length-1]=Object.assign(S[S.length-1],{t:rows.length,d:rows.filter(r=>r.cur.status==="완료").length});S[S.length-1].r=S[S.length-1].t?S[S.length-1].d/S[S.length-1].t:null;
  const cur=S[S.length-1],past=S.slice(-5,-1).filter(x=>x.t),avg=past.length?past.reduce((a,x)=>a+x.r,0)/past.length:null;
  const open=rows.filter(r=>r.cur.status!=="완료").map(r=>({it:r.it,e:r.cur,late:r.late}));
  const late=open.filter(x=>x.late||(x.e.due&&dd(x.e.due)<0)),soon=open.filter(x=>!x.late&&x.e.due&&dd(x.e.due)>=0&&dd(x.e.due)<=2);
  const isCur=W===CUR;
  const lv=!cur.t?"none":late.length>=2?"red":(late.length===1||soon.length>=2)?"yellow":"green";
  const head={none:"이번 주 할 일이 아직 없어요",red:"밀리고 있어요",yellow:"조금 서둘러야 해요",green:"좋은 리듬이에요"}[lv];
  const pct=x=>Math.round(x*100);
  const lines=[];
  if(cur.t){lines.push(`이번 주 할 일 <b>${cur.t}건</b> 중 <b>${cur.d}건</b> 완료 (${pct(cur.r)}%)`);
    const ended=W<CUR||(W===CUR&&[0,6].includes(new Date().getDay()));
    if(!ended)lines.push(W>CUR?`다음 주 예정 · 할 일 <b>${cur.t-cur.d}건</b>`:`주 중간이에요 · 남은 일 <b>${cur.t-cur.d}건</b>`);
    else if(avg!==null){const g=cur.r-avg;lines.push(`최근 4주 평균 ${pct(avg)}%${Math.abs(g)<.05?"과 비슷해요":g>0?`보다 <b class="up">${pct(g)}%p 높아요</b>`:`보다 <b class="down">${pct(-g)}%p 낮아요</b>`}`)}}
  if(late.length)lines.push(`<b class="down">기한 지난 일 ${late.length}건</b>이 있어요`);
  if(soon.length)lines.push(`이틀 안에 끝내야 할 일 <b>${soon.length}건</b>`);
  if(!cur.t)lines.push(W>=CUR?(isMe?"이번 주 할 일을 먼저 써 두면 리듬을 보여드려요.":"이번 주에 쓴 할 일이 아직 없어요."):"이 주에 쓴 할 일이 없어요.");
  const allDn=S.reduce((a,x)=>a+x.dn,0),allOn=S.reduce((a,x)=>a+x.on,0);
  // 먼저 할 일 (기한 기준)
  const top=[...open].sort((a,b)=>{const x=a.e.due||"9999",y=b.e.due||"9999";return x.localeCompare(y)||(b.e.carried?1:0)-(a.e.carried?1:0)}).slice(0,5);
  const why=e=>{const d=dd(e.due);const c=[];
    if(d===null)c.push('<i class="g">기한 없음</i>');else if(d<0)c.push(`<i class="r">기한 지남 ${-d}일</i>`);else if(d===0)c.push('<i class="o">오늘까지</i>');else if(d===1)c.push('<i class="o">내일까지</i>');else if(d<=6)c.push(`<i class="y">D-${d}</i>`);else c.push(`<i class="g">${shortDate(e.due)}까지</i>`);
    if(e.status==="대기")c.push('<i class="g">대기</i>');if(e.carried)c.push('<i class="g">이월</i>');return c.join("")};
  const topHtml=top.length?top.map((x,i)=>`<button type="button" class="rtop" data-id="${esc(x.it._id)}"><span class="rn">${i+1}</span><span class="rt"><b>${esc(x.e.task)}</b><span>${esc([x.it.project,x.it.customer].filter(Boolean).join(" · "))}</span></span><span class="rw">${why(x.e)}</span></button>`).join("")
    :`<div class="rempty">${cur.t?"남은 일이 없어요. 수고했어요!":"이번 주 할 일이 없어요."}</div>`;
  // 리듬 그래프 (맥박선 모양)
  const Wd=320,H=96,px=i=>16+i*(Wd-32)/(S.length-1),py=r=>H-20-(r*(H-38));
  const pts=S.map((x,i)=>x.r===null?null:[px(i),py(x.r)]);
  let path="";pts.forEach((pt,i)=>{if(!pt)return;const prevPt=pts.slice(0,i).reverse().find(Boolean);path+=(prevPt&&pts[i-1]?"L":"M")+pt[0].toFixed(1)+" "+pt[1].toFixed(1)+" "});
  const avgY=avg!==null?py(avg):null;
  const svg=`<svg class="rpulse" viewBox="0 0 ${Wd} ${H}" role="img" aria-label="최근 8주 완료율">
    <line x1="16" x2="${Wd-16}" y1="${py(1)}" y2="${py(1)}" class="gl"/><line x1="16" x2="${Wd-16}" y1="${py(.5)}" y2="${py(.5)}" class="gl"/><line x1="16" x2="${Wd-16}" y1="${py(0)}" y2="${py(0)}" class="gl"/>
    ${avgY!==null?`<line x1="16" x2="${Wd-16}" y1="${avgY}" y2="${avgY}" class="av"/>`:""}
    <path d="${path}" class="ln"/>
    ${pts.map((pt,i)=>pt?`<circle cx="${pt[0]}" cy="${pt[1]}" r="${i===S.length-1?5:3.2}" class="${i===S.length-1?"cur":"pt"}"><title>${shortRange(S[i].k)} · ${S[i].d}/${S[i].t}건 완료 (${pct(S[i].r)}%)</title></circle>`:"").join("")}
    ${S.map((x,i)=>`<text x="${px(i)}" y="${H-4}" class="lb${i===S.length-1?" on":""}">${shortDate(x.k)}</text>`).join("")}
    <text x="${Wd-16}" y="${py(1)-4}" class="ax">100%</text></svg>`;
  return `<div class="panel rhythm ${lv}"><h2>${isMe?"내 리듬":`${esc(me)} 님의 리듬`} <span>${isMe?esc(me)+" · ":""}${esc(rangeOf(W))}</span>${!isMe?`<button type="button" class="btn ghost rback" data-rhwho="전체">← 전체로</button>`:""}</h2>
    ${strip}<div class="rhgrid">
      <div class="rcol rsig"><div class="rsub">${W===CUR?"이번 주":W>CUR?"다음 주":shortRange(W)} 상태</div><div class="rlamp"><i></i><b>${head}</b></div><ul>${lines.map(l=>`<li>${l}</li>`).join("")}</ul>
        ${!cur.t&&W>=CUR&&isMe?`<button class="btn primary rhadd" type="button" data-rhadd="1">+ ${W===CUR?"이번 주":"다음 주"} 할 일 작성하기</button>`:""}
        ${allDn?`<p class="rnote">최근 8주 기한 안에 끝낸 비율 <b>${pct(allOn/allDn)}%</b> <span>(완료 날짜가 기록된 ${allDn}건 기준)</span></p>`:`<p class="rnote">완료 날짜를 오늘부터 기록해요. 쌓이면 '기한 안에 끝낸 비율'도 보여드려요.</p>`}</div>
      <div class="rcol rgraph"><div class="rsub">최근 8주 완료율 <span>— 점선은 4주 평균</span></div>${svg}</div>
      <div class="rcol rtops"><div class="rsub">먼저 할 일 <span>— 기한이 가까운 순서</span></div>${topHtml}</div>
    </div></div>`;
}

/* ---------- 필요할 때만 불러오는 화면 (관리·보고서) ---------- */
const WK_PARTS={};
// 배포본은 assets/버전/ 한 폴더, 원본(src)은 js/ · css/ 폴더
const wkUrl=(n,ext)=>window.WK_BASE?window.WK_BASE+n+"."+ext:(ext==="css"?"css/":"js/")+n+"."+ext;
function wkLoad(tag,attrs){return new Promise((ok,no)=>{const el=document.createElement(tag);Object.assign(el,attrs);el.onload=()=>ok();el.onerror=()=>no(new Error("load "+(attrs.src||attrs.href)));document.head.appendChild(el)})}
function wkPart(n){return WK_PARTS[n]||(WK_PARTS[n]=Promise.all([wkLoad("link",{rel:"stylesheet",href:wkUrl(n,"css")}),wkLoad("script",{src:wkUrl(n,"js")})])
  .catch(e=>{delete WK_PARTS[n];toast("화면을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");throw e}))}
// 로그인하고 잠시 뒤 미리 받아 두기 → 버튼을 누르면 바로 열림
function wkPreload(){setTimeout(()=>{wkPart("report").catch(()=>{});if(st.me&&(st.me.is_admin||st.me.is_registrar))wkPart("admin").catch(()=>{})},1200)}
// 첫 화면 인트로: 점이 두근두근 → 심박 선 → rhy:se → 제자리로 (앱을 열 때 로그인 화면이면 한 번)
function wkIntro(){
  const real=document.querySelector("#authScreen .rz-wm");
  if(!real||!document.body.animate||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const q=s=>document.querySelector("#authScreen "+s);
  const kb=q(".rz-kb"),tg=q(".rz-tg"),br=q(".abrand"),wk=q(".rz-week"),side=q(".aside");
  const fx=[br,kb,tg,wk,side].filter(Boolean);
  const E={io:"cubic-bezier(.65,0,.35,1)",out:"cubic-bezier(.22,1,.36,1)"};
  let ov=null,timer=0,ended=false;
  real.style.visibility="hidden";fx.forEach(e=>e.style.opacity=0);
  const go=()=>{
    ov=document.createElement("div");ov.className="rzi";ov.setAttribute("aria-hidden","true");
    ov.innerHTML=`<div class="rz-wm">${real.innerHTML}<i></i><i></i><i></i></div><div class="rzi-skip">TAP TO SKIP</div>`;
    document.body.appendChild(ov);
    const wm=ov.firstElementChild;wm.style.fontSize=getComputedStyle(real).fontSize;
    const [rhy,se]=wm.querySelectorAll("span"),svg=wm.querySelector("svg"),[c1,c2]=svg.querySelectorAll("circle"),path=svg.querySelector("path"),rings=[...wm.querySelectorAll("i")];
    path.setAttribute("pathLength","1");path.style.strokeDasharray="1";path.style.strokeDashoffset="1";
    [c1,c2].forEach(c=>{c.style.transformBox="fill-box";c.style.transformOrigin="center"});
    c2.style.opacity=0;rhy.style.opacity=0;se.style.opacity=0;
    const wr=wm.getBoundingClientRect(),cr=c1.getBoundingClientRect(),cx=cr.left+cr.width/2;
    rings.forEach(r=>{r.style.left=(cx-wr.left)+"px";r.style.top=(cr.top+cr.height/2-wr.top)+"px"});
    const shift=innerWidth/2-cx;
    const A=(el,kf,o)=>el.animate(kf,{fill:"both",...o});
    A(wm,[{transform:`translateX(${shift}px)`},{transform:"translateX(0)"}],{duration:640,delay:1480,easing:E.io});
    A(c1,[{transform:"scale(0)"},{transform:"scale(1)"}],{duration:260,easing:E.out});
    [380,1000].forEach((t,i)=>{
      A(c1,[{transform:"scale(1)"},{transform:"scale(1.7)",offset:.18},{transform:"scale(1)",offset:.42},{transform:"scale(1.4)",offset:.6},{transform:"scale(1)"}],{duration:560,delay:t,easing:"ease-out",fill:"none"});
      A(rings[i],[{opacity:.7,transform:"scale(.6)"},{opacity:0,transform:"scale(4)"}],{duration:900,delay:t+60,easing:E.out});
    });
    A(path,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:620,delay:1500,easing:E.io});
    A(c2,[{opacity:0,transform:"scale(0)"},{opacity:1,transform:"scale(1.5)",offset:.6},{opacity:1,transform:"scale(1)"}],{duration:320,delay:2060,easing:E.out});
    A(rhy,[{opacity:0,transform:"translateX(.35em)",filter:"blur(6px)"},{opacity:1,transform:"none",filter:"blur(0)"}],{duration:520,delay:2120,easing:E.out});
    A(se,[{opacity:0,transform:"translateX(-.35em)",filter:"blur(6px)"},{opacity:1,transform:"none",filter:"blur(0)"}],{duration:520,delay:2180,easing:E.out});
    A(rings[2],[{opacity:.6,transform:"scale(1)"},{opacity:0,transform:"scale(14)"}],{duration:1100,delay:2700,easing:E.out});
    A(wm,[{scale:1},{scale:1.07,offset:.25},{scale:.99,offset:.6},{scale:1}],{duration:560,delay:2700,easing:"ease-out",fill:"none"});
    timer=setTimeout(land,3350);
    ov.addEventListener("click",skip,{once:true});
  };
  function land(){
    const wm=ov.firstElementChild,a=wm.getBoundingClientRect(),b=real.getBoundingClientRect();
    wm.animate([{translate:"0 0"},{translate:`${b.left-a.left}px ${b.top-a.top}px`}],{duration:700,easing:E.io,fill:"forwards"});
    ov.animate([{backgroundColor:"rgba(16,32,29,1)"},{backgroundColor:"rgba(16,32,29,0)"}],{duration:520,delay:260,easing:"ease",fill:"forwards"});
    ov.lastElementChild.remove();
    fx.forEach((e,i)=>{let an;
      if(e===kb)an=e.animate([{opacity:1,clipPath:"inset(-10% 100% -10% 0)",transform:"translateX(-12px)"},{opacity:1,clipPath:"inset(-10% 0 -10% 0)",transform:"none"}],{duration:560,delay:620,easing:"cubic-bezier(.77,0,.18,1)",fill:"forwards"});
      else if(e===tg||e===br)an=e.animate([{opacity:0},{opacity:1}],{duration:380,delay:1080,easing:"ease-out",fill:"forwards"});
      else{if(e===wk)e.innerHTML=e.innerHTML;an=e.animate([{opacity:0,transform:"translateY(10px)"},{opacity:1,transform:"none"}],{duration:520,delay:500+i*90,easing:E.out,fill:"forwards"})}
      an.onfinish=()=>{e.style.opacity="";an.cancel()};
    });
    timer=setTimeout(end,1500);
  }
  function skip(){clearTimeout(timer);fx.forEach(e=>{e.getAnimations().forEach(x=>x.cancel());e.style.opacity=""});ov.animate([{opacity:1},{opacity:0}],{duration:240,fill:"forwards"}).onfinish=end}
  function end(){if(ended)return;ended=true;clearTimeout(timer);real.style.visibility="";fx.forEach(e=>{e.getAnimations().forEach(x=>x.cancel());e.style.opacity=""});if(ov)ov.remove();ov=null}
  (document.fonts?Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,800))]):Promise.resolve()).then(()=>{if($("authScreen").hidden){end();return}go()});
  setTimeout(()=>{if(!ended&&!ov)end()},2500);
}
$("localNote").hidden=CONFIGURED;
if($("bVer"))$("bVer").textContent="v"+APP_VERSION;   // 저장된 로그인으로 바로 열려도 버전 표시
(async()=>{
  try{applyCompany(await api.company())}catch(_){applyCompany(null)}
  try{const email=await api.sessionEmail();if(email){await afterLogin(email);return}}catch(_){}
  showLogin("");wkIntro();
  try{$("liSetup").hidden=!(await api.setupNeeded())}catch(_){}
})();
