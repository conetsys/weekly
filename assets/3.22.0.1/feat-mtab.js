/* rhy:se Weekly Plan — 📱 휴대폰 화면 (feat-mtab.js, v3.21.1)
   폭 720px 이하에서만, 디자인 시안(캔버스 'rhy:se 휴대폰 화면') 그대로. PC · 아이패드는 예전 화면 그대로.
   · 첫 화면 = 내 캘린더: 위 '팀 · 이름 / ‹ 2026년 11월 › / 월 · 주 · 오늘', 일~토 달력(칸마다 일정 이름), 고른 날의 카드
   · 아래 메뉴: 캘린더 · 점검 · (+ 업무추가) · 알림 · 나
   · 업무추가 시트: 무엇을 → 언제까지(오늘 · 내일 · 금요일 · 날짜) → 상태 → 어느 일(최근) · 구분 → 더 적기(전체 입력 창)
   · 점검: '확인할 것' 카드 (끝났어요 · 다음 주로 · 메모)  · 나: 아래 시트(보고서는 PC에서 · 팀원 일정 같이 보기)
   저장은 모두 기존 업무 창 · 저장 길을 그대로 씀 (보이지 않게 열어서 채우고 저장) → 규칙 · 점검이 PC와 같음
   이 파일이 고장 나면 휴대폰도 예전 화면 그대로 (html.mob-on 은 이 파일만 붙임) */
const MT_Q=matchMedia("(max-width:720px)");
const MB={on:false,applied:false,desk:null,cal:"month",sheet:null,ghost:false};
const MBK=k=>"wk-mob-"+k+"-"+(st.me?st.me.email:"");
const mbGet=(k,d)=>{try{const v=localStorage.getItem(MBK(k));return v==null?d:JSON.parse(v)}catch(_){return d}};
const mbSet=(k,v)=>{try{localStorage.setItem(MBK(k),JSON.stringify(v))}catch(_){}};
const MB_DOW=["일","월","화","수","목","금","토"];
const MB_SC={진행:["#245FB8","#E2EBF9","#1D4F9C"],대기:["#9A6100","#FAEFD7","#7A4D00"],완료:["#3B7350","#E1EFE5","#2C5A3D"],late:["#B3261E","#FBE7E5","#A02018"]};
const mbSvg=(p,w=22,sw=2)=>`<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const MB_I={cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',review:'<path d="M5 12l4 4 10-10"/>',add:'<path d="M12 5v14M5 12h14"/>',
  alert:'<path d="M6 16V11a6 6 0 1112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>',me:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
  l:'<path d="M15 18l-6-6 6-6"/>',r:'<path d="M9 18l6-6-6-6"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',chk:'<path d="M5 12l4 4 10-10"/>',down:'<path d="M6 9l6 6 6-6"/>',date:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  notice:'<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M17 9a4 4 0 010 6"/>',list:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>',pm:'<path d="M3 21l6-6M14 4l6 6-8 8-6-6z"/>',
  mods:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="3"/>',fb:'<path d="M4 5h16v11H8l-4 4z"/>',rep:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>'};
/* ---------- 켜고 끄기 ---------- */
const mobTeamOn=()=>MB.on&&!!mbGet("team",false);
function mobPeople(){if(!MB.on||!st.me||!isMyTeam(st.team))return undefined;
  if(!mobTeamOn())return [st.me.name];
  return [st.me.name,...mbGet("people",[]).filter(n=>n!==st.me.name&&st.lists.members.includes(n))]}
function mobPre(){if(!MB.on||!st.me)return;
  if(!MB.applied){MB.desk=st.layout;MB.applied=true}
  st.layout="month";st.q="";st.cat="전체";st.cust="전체";st.status=null;st.moreOpen=false;
  if(isMyTeam(st.team))st.owner=mobTeamOn()&&mobPeople().length>1?"전체":st.me.name;return true}
function mtApply(){const on=MT_Q.matches;MB.on=on;
  document.documentElement.classList.toggle("wk-mtab",on);document.documentElement.classList.toggle("wk-mob",on);
  if(on){mtBuild();mbBuild()}
  else{document.documentElement.classList.remove("mob-on");if(MB.applied){MB.applied=false;st.layout=MB.desk||store.get("wk-layout")||"table";if(st.me)st.owner=isMyTeam(st.team)?st.me.name:"전체"}}
  if(st.me&&st.loaded)render();mtPaint()}
/* ---------- 아래 메뉴 ---------- */
const MT=[["cal","캘린더"],["review","점검"],["add","업무추가"],["alert","알림"],["me","나"]];
function mtBuild(){if($("mtab"))return;
  const n=document.createElement("nav");n.id="mtab";n.className="mtab";n.setAttribute("aria-label","아래 메뉴");
  n.innerHTML=MT.map(([k,l])=>`<button type="button" data-mt="${k}"${k==="me"?'':""}${k==="add"?' class="mt-add"':""}><span class="mti">${mbSvg(MB_I[k],k==="add"?24:22,k==="add"?2.6:2)}</span><span class="mtl">${l}</span>${k==="alert"?`<b class="mtn" data-mtdot="alert" hidden></b>`:k==="me"?`<i class="mtdot" data-mtdot="me" hidden></i>`:""}</button>`).join("");
  document.body.appendChild(n)}
function mtPaint(){const n=$("mtab");if(!n)return;const v=MB.tab==="me"?"me":st.view==="review"?"review":"cal";
  n.querySelectorAll("[data-mt]").forEach(b=>b.setAttribute("aria-current",(b.dataset.mt===v)?"page":"false"));
  const a=n.querySelector('[data-mtdot="alert"]'),cnt=WKF.alertPaint?(F("alertCount")||0):($("noticeDot").hidden?0:1);if(a){a.hidden=!cnt;a.textContent=cnt>99?"99+":cnt}
  const d2=n.querySelector('[data-mtdot="me"]');if(d2)d2.hidden=$("userDot").hidden&&$("noticeDot").hidden;
  const logged=!!st.me&&$("authScreen").hidden;n.hidden=!logged;
  document.documentElement.classList.toggle("mob-on",MB.on&&logged&&st.loaded);
  const ad=n.querySelector('[data-mt="add"]');if(ad)ad.disabled=!canAddHere();
  if(!n.hidden&&n.offsetHeight)document.documentElement.style.setProperty("--mbnav",n.offsetHeight+"px");mbClosePaint();return true}
/* ---------- 첫 화면: 내 캘린더 ---------- */
function mbBuild(){if($("mobApp"))return;const m=document.querySelector("main.wrap");if(!m)return;
  const s=document.createElement("section");s.id="mobApp";s.className="mob";s.setAttribute("aria-label","휴대폰 화면");m.insertBefore(s,m.firstChild)}
const mbMonthKey=k=>k.slice(0,8)+"01";
function mbEvents(){const M=monthModel();return M.evs}
function mbDayEvents(evs,d){return evs.filter(x=>x.end===d).sort((a,b)=>(b.late-a.late)||(a.done-b.done)||String(a.e.task).localeCompare(String(b.e.task),"ko"))}
function mbKind(x){return x.late?"late":(x.done?"완료":(x.e.status==="대기"?"대기":"진행"))}
function mbCalHtml(evs){const m1=parseKey(st.month),y=m1.getFullYear(),mo=m1.getMonth(),lead=m1.getDay(),dim=new Date(y,mo+1,0).getDate(),n=Math.ceil((lead+dim)/7),g0=addDays(m1,-lead);
  let days=[...Array(n*7)].map((_,i)=>keyOf(addDays(g0,i)));
  if(MB.cal==="week"){const i=days.indexOf(st.mSel),r=Math.max(0,Math.floor(i/7));days=days.slice(r*7,r*7+7)}
  const one=st.owner!=="전체",pc=personColors();
  return `<div class="mbdow">${MB_DOW.map((d,i)=>`<span class="${i===0?"sun":i===6?"sat":""}">${d}</span>`).join("")}</div><div class="mbgrid${MB.cal==="week"?" wk":""}">${days.map(d=>{const dt=parseKey(d),other=dt.getMonth()!==mo,L=mbDayEvents(evs,d),dw=dt.getDay();
    const chips=L.slice(0,2).map(x=>{const c=MB_SC[mbKind(x)];return `<span class="mbch" style="background:${c[1]};color:${c[2]}${!one?`;box-shadow:inset 3px 0 0 var(--pc${pcol(pc,x.it.owner)})`:""}">${esc(x.e.task)}</span>`}).join("");
    return `<button type="button" class="mbday${other?" other":""}${d===st.mSel?" sel":""}${d===todayKey?" today":""}" data-mbday="${d}" aria-pressed="${d===st.mSel}" aria-label="${dt.getMonth()+1}월 ${dt.getDate()}일, 일정 ${L.length}건"><span class="mbdn${dw===0?" sun":dw===6?" sat":""}">${dt.getDate()}</span>${chips}${L.length>2?`<span class="mbmore">+${L.length-2}</span>`:""}</button>`}).join("")}</div>`}
function mbHeadHtml(){const m1=parseKey(st.month);
  return `<header class="mbhead"><div class="mbhl"><span class="mbwho">${esc(st.team?teamName(st.team):"")} · ${esc(st.me.name)}</span>
      <div class="mbmon"><button type="button" class="mbib" data-mbnav="-1" aria-label="${MB.cal==="week"?"지난주":"지난달"}">${mbSvg(MB_I.l,18,2.2)}</button><b>${m1.getFullYear()}년 ${m1.getMonth()+1}월</b><button type="button" class="mbib" data-mbnav="1" aria-label="${MB.cal==="week"?"다음주":"다음달"}">${mbSvg(MB_I.r,18,2.2)}</button></div></div>
    <div class="mbhr"><div class="mbseg" role="group" aria-label="달력 보기"><button type="button" data-mbcal="month" aria-pressed="${MB.cal==="month"}">월</button><button type="button" data-mbcal="week" aria-pressed="${MB.cal==="week"}">주</button></div><button type="button" class="mbtoday" data-mbnav="0">오늘</button></div></header>`}
function mbPeopleHtml(){if(!mobTeamOn()||!isMyTeam(st.team))return "";const sel=mobPeople(),pc=personColors();
  return `<div class="mbppl" id="mobPeople" role="group" aria-label="함께 볼 팀원"><span class="mbppl-l">함께 보기</span>${st.lists.members.map(m=>{const me=m===st.me.name,on=sel.includes(m);
    return `<button type="button" class="mobpc${on?" on":""}" data-mobp="${esc(m)}" aria-pressed="${on}"${me?" disabled":""} style="--c:var(--pc${pcol(pc,m)});--b:var(--pb${pcol(pc,m)})"><i></i>${me?"나":esc(m)}</button>`}).join("")}</div>`}
/* ---------- 캘린더 카드 · 점검 · 나 ---------- */
function mbCardHtml(x,opt){const k=mbKind(x),mine=isMine(x.it),pc=personColors(),other=!mine,c=MB_SC[k];
  const sub=`${other?esc(x.it.owner)+" · ":""}${esc(x.it.project||"")}${x.it.customer?" · "+esc(x.it.customer):""}${x.it.category?" · "+esc(x.it.category):""}${opt&&opt.due&&x.e.due?" · ~"+shortDate(x.e.due):""}`;
  const dot=other?`<span class="mbav" style="--c:var(--pc${pcol(pc,x.it.owner)});--b:var(--pb${pcol(pc,x.it.owner)})">${esc(String(x.it.owner).slice(0,1))}</span>`
    :`<span class="mbring${x.done?" done":""}" aria-hidden="true" style="border-color:${c[0]};background:${x.done?c[0]:c[1]}">${x.done?mbSvg(MB_I.chk,14,3):""}</span>`;
  const st_=x.done?"완료":k==="late"?"기한 지남":(x.e.status||"진행");
  const okb=mine&&canEdit(x.it)&&!x.planned?(x.done?`<button type="button" class="mbok on" data-mbundo="${esc(x.it._id)}" data-mbwk="${esc(x.wk||"")}" aria-label="완료 취소">${mbSvg(MB_I.chk,16,3)}</button>`:`<button type="button" class="mbok" data-mbdone="${esc(x.it._id)}" data-mbwk="${esc(x.wk||"")}" aria-label="${esc(x.e.task)} 완료">완료</button>`):"";
  return `<article class="mbcard k-${k}${other?" other":""}"${other?` style="--c:var(--pc${pcol(pc,x.it.owner)})"`:""}>${dot}<button type="button" class="mbcb" data-mbopen="${esc(x.it._id)}" data-mbwk="${esc(x.wk||"")}" aria-label="${esc(x.e.task)}, ${st_}, 열기"><span class="mbtask${x.done?" done":""}">${FS("coTag",x.it)}${FS("pmTag",x.it)}${esc(x.e.task)}</span><span class="mbsub">${sub}</span></button>${okb}</article>`}
function mbRenderCal(box){if(!MB.calLoaded){MB.cal=mbGet("cal","month");MB.calLoaded=true}const evs=mbEvents();if(!st.mSel||(MB.cal==="month"&&mbMonthKey(st.mSel)!==st.month))st.mSel=mbMonthKey(todayKey)===st.month?todayKey:st.month;
  const sd=parseKey(st.mSel),L=mbDayEvents(evs,st.mSel),hide=!!MB.calHide;
  let list;
  if(hide){const m=st.month.slice(0,7),days=[...new Set(evs.map(x=>x.end).filter(d=>d.slice(0,7)===m))].sort();if(!days.includes(st.mSel)){days.push(st.mSel);days.sort()}
    list=days.map(d=>{const dt=parseKey(d),D=mbDayEvents(evs,d);return `<div class="mbdh${d===st.mSel?" cur":""}" id="mbd-${d}"><b>${dt.getMonth()+1}월 ${dt.getDate()}일 ${MB_DOW[dt.getDay()]}요일${d===todayKey?" · 오늘":""}</b><span>${D.length?`${D.length}건`:""}</span></div>${D.length?D.map(x=>mbCardHtml(x)).join(""):`<div class="mbempty sm">일정이 없어요</div>`}`}).join("")}
  else list=`<div class="mbdh"><b>${sd.getMonth()+1}월 ${sd.getDate()}일 ${MB_DOW[sd.getDay()]}요일${st.mSel===todayKey?" · 오늘":""}</b><span>${L.length?`일정 ${L.length}건`:""}</span></div>
    ${L.length?L.map(x=>mbCardHtml(x)).join(""):`<div class="mbempty">이날은 일정이 없어요<br>아래 <b>업무추가</b>를 누르면 이 날짜로 들어가요</div>`}`;
  box.innerHTML=mbHeadHtml()+mbPeopleHtml()+`<section class="mbcal${hide?" hide":""}" aria-label="${sd.getMonth()+1}월 달력"${hide?' aria-hidden="true"':""}><div class="mbcal-in">${mbCalHtml(evs)}</div></section>
    <section class="mbday-list${hide?" full":""}" aria-live="polite"><button type="button" class="mbhandle" data-mbtoggle="1" aria-label="${hide?"달력 보이기":"달력 접고 목록 크게 보기"}" aria-expanded="${!hide}"><i></i>${hide?"<span>달력 보기</span>":""}</button>${list}</section>`;
  if(hide&&MB.scrollTo){const t=$("mbd-"+st.mSel);MB.scrollTo=false;if(t)setTimeout(()=>{const h=document.querySelector("#mobApp .mbhead");scrollTo({top:t.getBoundingClientRect().top+scrollY-(h?h.offsetHeight:0)-8,behavior:"smooth"})},30)}}
// 점검: 이번 주 리듬 · 한 일 · 해야 할 일 · 놓친 일
function mbWeekData(){const me=st.me.name,mine=st.items.filter(it=>it.owner===me&&!it.co);const done=[],todo=[],missed=[];
  mine.forEach(it=>{const w=it.weeks||{},e=w[CUR];
    if(e&&e.task){const x={it,e,wk:CUR,done:e.status==="완료",late:false};if(x.done)done.push(x);else if(e.due&&e.due<todayKey){x.late=true;missed.push(x)}else todo.push(x);return}
    const lastK=Object.keys(w).sort().filter(k=>k<CUR&&w[k]&&w[k].task).pop();const le=lastK&&w[lastK];
    if(le&&le.status!=="완료"&&le.due&&le.due<todayKey)missed.push({it,e:Object.assign({},le,{carried:true}),wk:lastK,done:false,late:true,carried:true})});
  const byDue=(a,b)=>String(a.e.due||"9999").localeCompare(String(b.e.due||"9999"));todo.sort(byDue);missed.sort(byDue);
  const S=[];let k=CUR;for(let i=0;i<8;i++){let t=0,d=0;mine.forEach(it=>{const e=(it.weeks||{})[k];if(!e||!e.task)return;t++;if(e.status==="완료")d++});S.unshift({k,t,d,r:t?d/t:null});k=prevKey(k)}
  const t=done.length+todo.length+missed.length;S[S.length-1]=Object.assign(S[S.length-1],{t,d:done.length,r:t?done.length/t:null});
  const soon=todo.filter(x=>x.e.due&&pjDiffD(todayKey,x.e.due)<=2).length;
  const lv=!t?"none":missed.length>=2?"red":(missed.length===1||soon>=2)?"yellow":"green";
  return {done,todo,missed,S,lv,t}}
function mbRenderReview(box){const D=mbWeekData(),fri=keyOf(addDays(parseKey(CUR),4)),co=F("shareAlertCount")||0;
  const head={none:"이번 주 할 일이 아직 없어요",red:"밀리고 있어요",yellow:"조금 서둘러야 해요",green:"좋은 리듬이에요"}[D.lv];
  const lvc={none:"#8A939E",red:"#B3261E",yellow:"#C98A00",green:"#3B7350"}[D.lv];
  const cur=D.S[D.S.length-1],pct=cur.r==null?0:Math.round(cur.r*100);
  const bars=D.S.map((s,i)=>{const h=s.r==null?0:Math.max(6,Math.round(s.r*56));const last=i===D.S.length-1;return `<span class="mbbar${last?" now":""}" title="${shortDate(s.k)} 주 ${s.t?Math.round(s.r*100)+"%":"기록 없음"}"><i style="height:${h}px${last?";background:"+lvc:""}"></i><small>${last?"이번 주":parseKey(s.k).getMonth()+1+"/"+parseKey(s.k).getDate()}</small></span>`}).join("");
  const sec=(id,title,L,cls,empty,opt)=>`<section class="mbrs" id="${id}"><div class="mbdh"><b class="${cls}">${title}</b><span>${L.length}건</span></div>${L.length?L.map(x=>mbCardHtml(x,opt)).join(""):`<div class="mbempty sm">${empty}</div>`}</section>`;
  box.innerHTML=`<header class="mbhead rv"><div class="mbhl"><span class="mbwho">${shortDate(CUR)}–${shortDate(fri)} · ${esc(st.me.name)}</span><b class="mbrtitle">점검</b></div></header>
  <div class="mbrv">
    <section class="mbrhy" style="--lv:${lvc}"><div class="mbrhy-h"><span class="mbrhy-dot"></span><b>${head}</b><span class="dim">이번 주 리듬</span></div>
      <div class="mbrhy-b"><div class="mbrhy-n"><b>${pct}<small>%</small></b><span>${D.t}건 중 ${D.done.length}건 끝</span></div><div class="mbbars" aria-label="최근 8주 완료율">${bars}</div></div></section>
    <div class="mbsum"><button type="button" data-mbjump="mbr-miss" class="bad"><b>${D.missed.length}</b>놓친 일</button><button type="button" data-mbjump="mbr-todo"><b>${D.todo.length}</b>해야 할 일</button><button type="button" data-mbjump="mbr-done" class="ok"><b>${D.done.length}</b>한 일</button></div>
    ${co?`<button type="button" class="mbco" data-mbalert="1"><span class="mbtag co">Co-work</span><span>나에게 온 요청 · 코멘트 ${co}건</span>${mbSvg(MB_I.r,16)}</button>`:""}
    ${sec("mbr-miss","놓친 일",D.missed,"bad","놓친 일이 없어요",{due:true})}
    ${sec("mbr-todo","해야 할 일",D.todo,"","남은 일이 없어요. 수고했어요!",{due:true})}
    ${sec("mbr-done","한 일",D.done,"ok","아직 끝낸 일이 없어요")}
    <p class="mbpc">업무를 누르면 열어서 상태 · 일정 · 메모를 고칠 수 있어요</p></div>`}
// 나: 화면 (시트가 아니라 탭 화면)
function mbRenderMe(box){const pc=personColors(),c=pcol(pc,st.me.name),vis=id=>{const el=$(id);return el&&!el.hidden};
  const tile=(id,ic,l,sub)=>`<button type="button" class="mbtile" data-mbgo="${id}">${mbSvg(MB_I[ic],22)}<span>${l}</span>${sub?`<small>${sub}</small>`:""}${id==="miTeamNotice"&&!$("noticeDot").hidden?'<i class="mbdot"></i>':""}</button>`;
  const row=(id,l)=>vis(id)?`<button type="button" class="mbrow2" data-mbgo="${id}">${l}${mbSvg(MB_I.r,16)}</button>`:"";
  box.innerHTML=`<header class="mbhead me"><div class="mbme"><span class="mbav big" style="--c:var(--pc${c});--b:var(--pb${c})">${esc(st.me.name.slice(0,1))}</span><span class="mbhl"><b class="mbrtitle">${esc(st.me.name)}</b><span class="mbwho">${esc(st.me.team_id?teamName(st.me.team_id):"관리 계정")} · ${st.me.role==="leader"?"팀장":st.me.is_admin?"관리자":"팀원"}${st.me.extra_team&&st.me.extra_team!==st.me.team_id?" · 겸직 "+esc(teamName(st.me.extra_team)):""}</span></span></div></header>
  <div class="mbmepage"><div class="mbtiles">${tile("miTeamNotice","notice","팀 공지")}${tile("miLists","list","내 목록")}${tile("miMods","mods","기능 더하기")}${vis("miBoard")?tile("miBoard","fb","의견 보내기"):""}${tile("report","rep","보고서","작성은 PC에서")}</div>
    <label class="mbtog"><span><b>캘린더에 팀원 일정 같이 보기</b><small>휴대폰은 기본 끔 · PC · 아이패드는 그대로</small></span><span class="switch"><input type="checkbox" id="mbTeamCal"${mbGet("team",false)?" checked":""}><i></i></span></label>
    <div class="mblist">${row("miGuide","사용법")}${row("miNotice","전체 공지")}${row("miExport","내 일정 내려받기")}${row("miInstall","홈 화면에 앱 설치")}${row("miPin","비밀번호 바꾸기")}${row("miAddMember","팀원 추가")}${row("miPinReq","비밀번호 초기화 요청")}${row("miAdmin","⚙ 관리")}</div>
    <button type="button" class="mblogout" data-mbgo="miLogout">로그아웃</button><p class="mbpc">rhy:se Weekly Plan v${esc(VSHOW)}</p></div>`}
// 업무 열기: 그 일이 속한 주로 맞춰서 업무 창 (상태 · 일정 · 메모를 그 안에서 고침)
function mbOpenItem(id,wk){const it=st.items.find(i=>i._id===id);if(!it)return;const w=wk&&(it.weeks||{})[wk]?wk:CUR;if(w!==st.week){st.weekBack=st.week;st.week=w;render()}setTimeout(()=>openDrawer(it._id),0)}   // 바깥 누르면 닫히는 처리보다 뒤에 열기
function mbCalToggle(hide){const cal=document.querySelector("#mobApp .mbcal-in");
  if(!cal||MB.anim||matchMedia("(prefers-reduced-motion: reduce)").matches){MB.calHide=hide;MB.scrollTo=hide;if(!hide)scrollTo({top:0});mobRender();return}
  MB.anim=true;
  if(hide){cal.style.maxHeight=cal.scrollHeight+"px";cal.offsetHeight;cal.style.maxHeight="0px";cal.style.opacity="0";cal.parentElement.classList.add("hiding");
    setTimeout(()=>{MB.anim=false;MB.calHide=true;MB.scrollTo=true;mobRender();const l=document.querySelector("#mobApp .mbday-list");if(l)l.classList.add("mbfade")},420)}
  else{scrollTo({top:0,behavior:"smooth"});MB.calHide=false;mobRender();const c2=document.querySelector("#mobApp .mbcal-in");
    if(!c2){MB.anim=false;return}const h=c2.scrollHeight;c2.style.transition="none";c2.style.maxHeight="0px";c2.style.opacity="0";c2.offsetHeight;c2.style.transition="";
    requestAnimationFrame(()=>{c2.style.maxHeight=h+"px";c2.style.opacity="1"});setTimeout(()=>{c2.style.maxHeight="";MB.anim=false},460)}}
// 목록을 위로 밀면 달력이 접히고, 맨 위에서 아래로 당기면 다시 펼침 (손가락 · 마우스)
const MBG={y:null,t:0};
document.addEventListener("touchstart",e=>{if(!MB.on||MB.tab==="me"||st.view==="review"||!e.target.closest("#mobApp .mbday-list,#mobApp .mbcal"))return;MBG.y=e.touches[0].clientY;MBG.t=Date.now()},{passive:true});
document.addEventListener("touchmove",e=>{if(MBG.y==null)return;const dy=e.touches[0].clientY-MBG.y;
  if(!MB.calHide&&dy<-45&&e.target.closest("#mobApp .mbday-list")){MBG.y=null;mbCalToggle(true)}
  else if(MB.calHide&&dy>60&&scrollY<=2){MBG.y=null;mbCalToggle(false)}},{passive:true});
document.addEventListener("touchend",()=>{MBG.y=null},{passive:true});
document.addEventListener("pointerdown",e=>{if(e.pointerType==="touch"||!e.target.closest("#mobApp .mbhandle"))return;MBG.my=e.clientY});
document.addEventListener("pointerup",e=>{if(MBG.my==null)return;const dy=e.clientY-MBG.my;MBG.my=null;if(Math.abs(dy)>30){MBG.drag=true;mbCalToggle(dy<0);setTimeout(()=>{MBG.drag=false},50)}});
document.addEventListener("wheel",e=>{if(!MB.on||MB.tab==="me"||st.view==="review"||!e.target.closest("#mobApp .mbday-list"))return;if(!MB.calHide&&e.deltaY>30)mbCalToggle(true);else if(MB.calHide&&e.deltaY<-30&&scrollY<=2)mbCalToggle(false)},{passive:true});
// 달력 움직임: 달 · 주 넘기기는 방향대로 밀기, 월 ↔ 주 바꾸기는 높이를 부드럽게
const MB_RM=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const MB_EZ={duration:360,easing:"cubic-bezier(.22,.8,.22,1)"};
function mbSlide(dir,fn){const box=document.querySelector("#mobApp .mbcal-in");if(!box||!dir||MB_RM()||MB.calHide||!box.animate){fn();return}
  const h0=box.offsetHeight,old=box.cloneNode(true);fn();
  const nb=document.querySelector("#mobApp .mbcal-in"),cal=nb&&nb.parentElement;if(!nb)return;
  cal.classList.add("sliding");old.classList.add("mbold");old.setAttribute("aria-hidden","true");old.querySelectorAll("button").forEach(b=>b.tabIndex=-1);cal.appendChild(old);
  old.animate([{transform:"translateX(0)",opacity:1},{transform:`translateX(${-dir*100}%)`,opacity:0}],MB_EZ).onfinish=()=>{old.remove();cal.classList.remove("sliding")};
  nb.animate([{transform:`translateX(${dir*100}%)`,opacity:.2},{transform:"translateX(0)",opacity:1}],MB_EZ);
  const h1=nb.scrollHeight;if(Math.abs(h1-h0)>2)nb.animate([{maxHeight:h0+"px"},{maxHeight:h1+"px"}],MB_EZ)}
function mbResize(fn){const box=document.querySelector("#mobApp .mbcal-in");if(!box||MB_RM()||MB.calHide||!box.animate){fn();return}
  const h0=box.offsetHeight;fn();const nb=document.querySelector("#mobApp .mbcal-in");if(!nb)return;const h1=nb.scrollHeight;
  nb.animate([{maxHeight:h0+"px"},{maxHeight:h1+"px"}],{duration:380,easing:"cubic-bezier(.22,.8,.22,1)"});
  const g=nb.querySelector(".mbgrid");if(g)g.animate([{opacity:.35},{opacity:1}],{duration:300,easing:"ease-out"})}
const pjDiffD=(a,b)=>Math.round((parseKey(b)-parseKey(a))/864e5);
/* ---------- 그리기 (render 끝에서) ---------- */
function mobRender(){if(!MB.on||!st.me)return;mbBuild();const box=$("mobApp");if(!box)return;
  if(document.querySelector("#mobApp input:focus"))return;
  if(MB.tab==="me")mbRenderMe(box);else if(st.view==="review")mbRenderReview(box);else mbRenderCal(box);mtPaint();return true}
/* ---------- 상태 바꾸기 · 미루기 ---------- */
async function mbWrite(id,wk,patch,msg){const it=st.items.find(i=>i._id===id);if(!it||!st.db||!canEdit(it))return;
  const x=monthEvents().find(e=>e.it._id===id&&e.wk===wk)||monthEvents().find(e=>e.it._id===id&&e.late);
  const base=Object.assign({},(it.weeks||{})[wk]||(x?x.e:{}));delete base.carried;
  const tw=(it.weeks||{})[wk]?wk:CUR;const entry=Object.assign({task:base.task,due:base.due||"",status:base.status||"진행",memo:base.memo||"",writtenAt:base.writtenAt||new Date().toISOString()},base,patch);delete entry.carried;
  const {_id,...rest}=it;const body=Object.assign({},rest,{weeks:Object.assign({},it.weeks||{},{[tw]:entry}),updatedAt:new Date().toISOString()});delete body.sample;
  try{await st.db.doc("items/"+id).set(body);toast(msg)}catch(e){handleWriteErr(e)}}
document.addEventListener("click",e=>{
  if(e.target.closest("#mobApp")){
    const d=e.target.closest("[data-mbday]");if(d){st.mSel=d.dataset.mbday;MB.scrollTo=true;if(mbMonthKey(st.mSel)!==st.month)st.month=mbMonthKey(st.mSel);mobRender();return}
    const nv=e.target.closest("[data-mbnav]");if(nv){const v=+nv.dataset.mbnav,before=MB.cal==="week"?(st.mSel||todayKey):st.month;
      if(v===0){st.month=mbMonthKey(todayKey);st.mSel=todayKey}
      else if(MB.cal==="week"){st.mSel=keyOf(addDays(parseKey(st.mSel||todayKey),v*7));st.month=mbMonthKey(st.mSel)}
      else{const m=parseKey(st.month);st.month=keyOf(new Date(m.getFullYear(),m.getMonth()+v,1));st.mSel=mbMonthKey(todayKey)===st.month?todayKey:st.month}
      const after=MB.cal==="week"?st.mSel:st.month,dir=v||(after>before?1:after<before?-1:0);
      if(MB.cal==="week"&&v===0){const wk=d=>keyOf(mondayOf(parseKey(d)));mbSlide(wk(after)>wk(before)?1:wk(after)<wk(before)?-1:0,mobRender)}else mbSlide(dir,mobRender);return}
    const cv=e.target.closest("[data-mbcal]");if(cv){if(MB.cal===cv.dataset.mbcal)return;MB.cal=cv.dataset.mbcal;mbSet("cal",MB.cal);mbResize(mobRender);return}
    const p=e.target.closest("[data-mobp]");if(p){const n=p.dataset.mobp,cur=mbGet("people",[]);mbSet("people",cur.includes(n)?cur.filter(x=>x!==n):[...cur,n]);render();return}
    const op=e.target.closest("[data-mbopen]");if(op){mbOpenItem(op.dataset.mbopen,op.dataset.mbwk);return}
    const tg=e.target.closest("[data-mbtoggle]");if(tg){if(!MBG.drag)mbCalToggle(!MB.calHide);return}
    const jp=e.target.closest("[data-mbjump]");if(jp){const t=$(jp.dataset.mbjump),h=document.querySelector("#mobApp .mbhead");if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-(h?h.offsetHeight:0)-6,behavior:"smooth"});return}
    const go=e.target.closest("[data-mbgo]");if(go){const id=go.dataset.mbgo;if(id==="report"){toast("📄 보고서는 PC에서 작성해요. 휴대폰용 보고서는 새로 만들고 있어요");return}const el=$(id);if(el)el.click();return}
    const dn=e.target.closest("[data-mbdone]");if(dn){dn.disabled=true;mbWrite(dn.dataset.mbdone,dn.dataset.mbwk,{status:"완료",done_at:todayKey},"완료로 표시했어요");return}
    const ud=e.target.closest("[data-mbundo]");if(ud){ud.disabled=true;mbWrite(ud.dataset.mbundo,ud.dataset.mbwk,{status:"진행"},"완료를 풀고 진행으로 돌렸어요");return}
    const nx=e.target.closest("[data-mbnext]");if(nx){const nf=keyOf(addDays(parseKey(CUR),11));mbWrite(nx.dataset.mbnext,nx.dataset.mbwk,{due:nf,status:"진행"},`기한을 다음 주 금요일(${shortDate(nf)})로 미뤘어요`);return}
    if(e.target.closest("[data-mbalert]")){(WKF.alertPaint?$("alertBtn"):$("noticeBtn")).click();return}
    return}
  const b=e.target.closest("#mtab [data-mt]");if(!b)return;e.stopPropagation();const k=b.dataset.mt;
  mbCloseAll();
  if(k!=="add"&&k!=="alert")MB.tab=k==="me"?"me":null;
  if(k==="cal"){$("tab-write").click()}else if(k==="review"){$("tab-review").click()}
  else if(k==="add"){if(!canAddHere()){toast("내 팀 화면에서 업무를 추가할 수 있어요");return}mbAddOpen(st.view!=="review"&&st.mSel?st.mSel:todayKey)}
  else if(k==="alert")(WKF.alertPaint?$("alertBtn"):$("noticeBtn")).click();
  scrollTo(0,0);setTimeout(()=>{mobRender();mtPaint()},30)},true);
/* ---------- 아래에서 올라오는 시트 (업무추가 · 나) ---------- */
function mbSheetEl(){let s=$("mobSheet");if(!s){s=document.createElement("div");s.id="mobSheet";s.className="mbsheet-w";s.hidden=true;s.innerHTML=`<div class="mbscrim" data-mbclose="1"></div><section class="mbsheet" role="dialog" aria-modal="true" aria-labelledby="mbsTitle"></section>`;document.body.appendChild(s)}return s}
function mbSheetClose(){const s=$("mobSheet");if(s)s.hidden=true;MB.sheet=null;document.documentElement.classList.remove("mb-sheet");mbClosePaint()}
function mbSheetShow(kind,html){const s=mbSheetEl();s.querySelector(".mbsheet").innerHTML=html;s.querySelector(".mbsheet").className="mbsheet "+kind;s.hidden=false;MB.sheet=kind;document.documentElement.classList.add("mb-sheet");mbClosePaint()}
// 업무추가
const MBA={due:null,status:"진행",combo:null,cat:null};
function mbCombos(){const seen=new Set(),out=[];
  [...st.items].filter(i=>isMine(i)&&!i.co&&i.customer&&i.project).sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||""))).forEach(i=>{const k=i.customer+"|"+i.project;if(seen.has(k)||out.length>=4)return;seen.add(k);out.push(i)});return out}
function mbCats(){const use={};st.items.filter(isMine).forEach(i=>{if(i.category)use[i.category]=(use[i.category]||0)+1});
  const all=[...new Set([...(typeof catsList==="function"?catsList():[]),...Object.keys(use)])].filter(Boolean);
  return all.sort((a,b)=>(use[b]||0)-(use[a]||0)).slice(0,6)}
function mbFri(){const t=parseKey(todayKey),d=t.getDay();return keyOf(addDays(t,d<=5?5-d:12-d))}
function mbAddOpen(day){MBA.due=day;MBA.status="진행";MBA.combo=null;MBA.cat=null;const C=mbCombos();if(C.length){MBA.combo=0;MBA.cat=C[0].category||null}mbAddPaint(true)}
function mbAddPaint(first){const C=mbCombos(),cats=mbCats();if(MBA.cat&&!cats.includes(MBA.cat))cats.unshift(MBA.cat);
  const t=todayKey,tm=keyOf(addDays(parseKey(t),1)),fr=mbFri(),dd=parseKey(MBA.due),isQ=[t,tm,fr].includes(MBA.due);
  const chip=(k,l)=>`<button type="button" class="mbdq${MBA.due===k?" on":""}" data-mbdue="${k}" aria-pressed="${MBA.due===k}">${l}</button>`;
  const task=first?"":($("mbaTask")?$("mbaTask").value:"");
  mbSheetShow("add",`<div class="mbgrab"></div><div class="mbsh"><span><b id="mbsTitle">업무추가</b><small>${dd.getMonth()+1}월 ${dd.getDate()}일 ${MB_DOW[dd.getDay()]}요일까지</small></span><button type="button" class="mbx" data-mbclose="1" aria-label="닫기">${mbSvg(MB_I.x,16,2.4)}</button></div>
  <div class="mbsb">
    <div class="mbf"><label for="mbaTask">무엇을 할까요</label><input id="mbaTask" class="mbbig" autocomplete="off" placeholder="예: 성적서 회신 요청" value="${esc(task)}"></div>
    <div class="mbf"><span class="mbl">언제까지</span><div class="mbrow">${chip(t,"오늘")}${chip(tm,"내일")}${chip(fr,`금요일 ${shortDate(fr)}`)}<label class="mbdq${isQ?"":" on"}">${mbSvg(MB_I.date,16)}${isQ?"날짜":shortDate(MBA.due)}<input type="date" id="mbaDate" value="${MBA.due}" aria-label="날짜 고르기"></label></div></div>
    <div class="mbf"><span class="mbl">상태</span><div class="mbst3">${["진행","대기","완료"].map(s=>`<button type="button" class="s-${s}${MBA.status===s?" on":""}" data-mbas="${s}" aria-pressed="${MBA.status===s}">${s}</button>`).join("")}</div></div>
    <div class="mbf"><div class="mbl2"><span class="mbl">어느 일 · 고객사 <i>*</i></span><span class="dim">최근에 쓴 것</span></div>
      ${C.length?`<div class="mbcmb">${C.map((i,n)=>`<button type="button" class="${MBA.combo===n?"on":""}" data-mbcmb="${n}" aria-pressed="${MBA.combo===n}"><b>${esc(i.project)}</b><span>${esc(i.customer)}</span></button>`).join("")}</div>`:`<p class="dim" style="margin:0;font-size:13px">처음 쓰는 업무예요. 아래 '다른 사업 · 고객사'에서 골라 주세요.</p>`}
      <button type="button" class="mblink" data-mbfull="1">${mbSvg(MB_I.add,14,2.6)}다른 사업 · 고객사</button>
      <div class="mbcat"><span class="mbl">구분 <i>*</i></span><div class="mbrow">${cats.map(c=>`<button type="button" class="mbk${MBA.cat===c?" on":""}" data-mbcat="${esc(c)}" aria-pressed="${MBA.cat===c}">${esc(c)}</button>`).join("")}</div></div></div>
    <button type="button" class="mbmore" data-mbfull="1"><span><b>더 적기</b><small>품목 · 관리번호 · 협력사 · 입고·회신 대기 · 메모</small></span>${mbSvg(MB_I.down,18)}</button>
  </div>
  <div class="mbsf"><button type="button" class="mbcancel" data-mbclose="1">취소</button><button type="button" class="mbsave" data-mbsave="1">저장</button></div>`);
  if(first)setTimeout(()=>{const i=$("mbaTask");if(i)i.focus({preventScroll:true})},180)}
// 시트 값을 기존 업무 창에 옮겨 담기 (보이지 않게 연 상태)
function mbToDrawer(){const task=$("mbaTask")?$("mbaTask").value.trim():"";
  document.documentElement.classList.add("mb-ghost");addOnDay(MBA.due);
  const sel=(id,v,nid)=>{const s=$(id);if(!s||!v)return;if([...s.options].some(o=>o.value===v)){s.value=v;s.dispatchEvent(new Event("change",{bubbles:true}))}
    else if(nid&&[...s.options].some(o=>o.value==="__new")){s.value="__new";s.dispatchEvent(new Event("change",{bubbles:true}));$(nid).hidden=false;$(nid).value=v}};
  const c=MBA.combo!=null?mbCombos()[MBA.combo]:null;
  if(c){sel("f-customer",c.customer,"f-customer-new");$("f-project").value=c.project;$("f-project").dispatchEvent(new Event("change",{bubbles:true}));if(c.vendor)sel("f-vendor",c.vendor,"f-vendor-new")}
  if(MBA.cat)sel("f-cat",MBA.cat,"f-cat-new");
  $("w-task").value=task;const r=document.querySelector(`input[name="w-status"][value="${MBA.status}"]`);if(r){r.checked=true;r.dispatchEvent(new Event("change",{bubbles:true}))}
  $("w-due").value=MBA.due;if($("w-start").value>MBA.due)$("w-start").value=MBA.due;try{d3Hint("w")}catch(_){}}
function mbReveal(){document.documentElement.classList.remove("mb-ghost");mbSheetClose();const d=$("drawer");d.classList.add("mq","mq-more");$("dTitle").textContent="업무추가 · 더 적기"}
async function mbSave(){const task=$("mbaTask").value.trim();if(!task){$("mbaTask").focus();toast("무엇을 할지 적어 주세요");return}
  mbToDrawer();await new Promise(r=>setTimeout(r,60));$("saveBtn").click();
  for(let i=0;i<25;i++){await new Promise(r=>setTimeout(r,120));if($("drawer").hidden){document.documentElement.classList.remove("mb-ghost");mbSheetClose();st.mSel=MBA.due;st.month=mbMonthKey(MBA.due);mobRender();return}if(!$("formErr").hidden)break}
  mbReveal()}   // 빠진 칸이 있으면 전체 입력 창을 보여 줌
document.addEventListener("click",e=>{if(!e.target.closest("#mobSheet"))return;
  if(e.target.closest("[data-mbclose]")){mbSheetClose();return}
  if(MB.sheet==="add"){
    const dq=e.target.closest("[data-mbdue]");if(dq){MBA.due=dq.dataset.mbdue;mbAddPaint();return}
    const s=e.target.closest("[data-mbas]");if(s){MBA.status=s.dataset.mbas;mbAddPaint();return}
    const c=e.target.closest("[data-mbcmb]");if(c){MBA.combo=+c.dataset.mbcmb;const i=mbCombos()[MBA.combo];if(i&&i.category)MBA.cat=i.category;mbAddPaint();return}
    const k=e.target.closest("[data-mbcat]");if(k){MBA.cat=k.dataset.mbcat;mbAddPaint();return}
    if(e.target.closest("[data-mbfull]")){mbToDrawer();mbReveal();setTimeout(()=>{const s=e.target.closest(".mblink")?$("f-customer"):$("f-part");if(s)s.scrollIntoView({block:"center"})},120);return}
    if(e.target.closest("[data-mbsave]")){mbSave();return}}
});
document.addEventListener("change",e=>{if(e.target.id==="mbaDate"&&e.target.value){MBA.due=e.target.value;mbAddPaint()}
  if(e.target.id==="mbTeamCal"){mbSet("team",e.target.checked);render();toast(e.target.checked?"📅 캘린더 위 '함께 보기'에서 팀원을 골라 보세요":"📅 내 일정만 보여요")}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&MB.sheet){e.stopPropagation();mbSheetClose()}
  if(e.key==="Enter"&&e.target.id==="mbaTask"&&!e.isComposing){e.preventDefault();mbSave()}},true);
// 업무 창이 닫히면 보이지 않게 연 상태도 풂
new MutationObserver(()=>{if($("drawer").hidden)document.documentElement.classList.remove("mb-ghost")}).observe($("drawer"),{attributes:true,attributeFilter:["hidden"]});
$("miLists").onclick=()=>{$("userMenu").hidden=true;$("openSettings").click()};
$("miTeamNotice").onclick=()=>{$("userMenu").hidden=true;$("noticeBtn").click()};
/* ---------- 기존 업무 창을 휴대폰에서 열 때 (더 적기 · 고치기) ---------- */
function mobEditOpen(it,ro){const d=$("drawer");if(!document.documentElement.classList.contains("mb-ghost"))d.classList.remove("mq","mq-more");return true}
// 아래 메뉴를 누르면 열린 창(업무추가 · 업무 창 · 알림 · 공지 · 나에서 연 화면)은 모두 닫고 그 화면으로
function mbCloseAll(){mbSheetClose();document.documentElement.classList.remove("mb-ghost");$("userMenu").hidden=true;
  try{F("alertClose")}catch(_){}
  document.querySelectorAll(".modal:not([hidden])").forEach(m=>{const c=m.querySelector('[id$="Close"],.mclose,[aria-label="닫기"]');if(c)c.click();else m.hidden=true});
  ["settings","sumDrawer","copyDrawer"].forEach(id=>{const d=$(id);if(d&&!d.hidden){const c=d.querySelector('[id$="Close"]');if(c)c.click();else d.hidden=true}});
  if(!$("drawer").hidden){try{closeAll()}catch(_){$("drawer").hidden=true}}
  const gp=$("guidePage");if(gp&&!gp.hidden){const c=gp.querySelector('[id$="Close"],[data-gclose],.gclose');if(c)c.click();else gp.hidden=true}
  ["mscrim","scrim"].forEach(id=>{const s=$(id);if(s)s.hidden=true})}
// 휴대폰에서 화면 가득 여는 창(알림 · 공지 · 기능 더하기 · 내 목록 …): 아래 메뉴 바로 위에 '닫기'를 늘 같은 자리에
function mbTopPanel(){const L=[...document.querySelectorAll(".modal:not([hidden]),#settings:not([hidden]),#sumDrawer:not([hidden]),#copyDrawer:not([hidden]),#guidePage:not([hidden])")].filter(x=>!x.classList.contains("wkghost"));return L.pop()||null}
// 닫힐 때: 화면 가득 창은 제자리에서 흐려지지 않고, 들어온 쪽(오른쪽)으로 밀려 나감. 뒤 덮개는 바로 사라짐
wkFeat("mtab",{ghostFx(el,c){if(!MB.on||!document.documentElement.classList.contains("mob-on"))return;
  if(el.matches(".mscrim,.scrim"))return{k:[{opacity:0},{opacity:0}],o:{duration:1,fill:"forwards"}};
  if(c!=="modal"&&c!=="drawer"&&!el.matches("#settings,#sumDrawer,#copyDrawer,#guidePage"))return;
  return{k:[{transform:"translateX(0)",opacity:1},{transform:"translateX(100%)",opacity:1}],o:{duration:260,easing:"cubic-bezier(.4,0,.6,1)",fill:"forwards"}}}});
function mbClosePaint(){let b=$("mbCloseBar");const p=MB.on&&document.documentElement.classList.contains("mob-on")&&!MB.sheet?mbTopPanel():null;
  if(!p){if(b&&!b.hidden)b.hidden=true;if(document.documentElement.classList.contains("mb-panel"))document.documentElement.classList.remove("mb-panel");return}
  if(!b){b=document.createElement("div");b.id="mbCloseBar";b.className="mbclosebar";b.innerHTML=`<button type="button">닫기</button>`;document.body.appendChild(b);
    b.querySelector("button").onclick=()=>{const t=mbTopPanel();b.hidden=true;document.documentElement.classList.remove("mb-panel");if(!t)return;   // 누르는 순간 닫기 줄부터 내림
      const c=t.querySelector('[id$="Close"],.mclose,.dclose,[aria-label="닫기"],[data-close]')||[...t.querySelectorAll("button")].find(x=>/^(닫기|✕|×)$/.test(x.textContent.trim()));
      if(c)c.click();else{t.hidden=true;if($("mscrim"))$("mscrim").hidden=true;if($("scrim"))$("scrim").hidden=true}[60,250,600].forEach(t=>setTimeout(mbClosePaint,t))}}
  if(b.hidden)b.hidden=false;if(!document.documentElement.classList.contains("mb-panel"))document.documentElement.classList.add("mb-panel")}
new MutationObserver(ms=>{if(ms.some(m=>m.target.id!=="mbCloseBar"))mbClosePaint()}).observe(document.body,{subtree:true,attributes:true,attributeFilter:["hidden"]});
setInterval(()=>{const b=$("mbCloseBar");if(b&&!b.hidden)mbClosePaint()},250);   // 다른 길로 창이 닫혀도 닫기 줄이 남지 않게
// 상태가 바뀌면 아래 메뉴도 따라
const mtObs=new MutationObserver(()=>mtPaint());
["tab-write","noticeDot","userDot","authScreen","alertN"].forEach(id=>{const el=$(id);if(el)mtObs.observe(el,{attributes:true,attributeFilter:["hidden","aria-selected"]})});
(MT_Q.addEventListener?MT_Q.addEventListener("change",mtApply):MT_Q.addListener(mtApply));
mtApply();
// 📖 사용법 (사용법은 v3.19.0 기준으로 고정 · 새 휴대폰 화면 설명은 '사용법 최신화' 때)
wkGuideAdd("mtab",{
  member:[{after:"m2",sec:["x-mtab","휴대폰에서는 아래 메뉴",[
    ["p","휴대폰에서는 위쪽은 **팀 이름 · 주 이동** 한 줄만 두고, 자주 누르는 단추를 **화면 아래**에 모았습니다."],
    ["img","g24_mobile","휴대폰 화면 — 위는 한 줄, 아래 메뉴"],
    ["ul",["**캘린더 · 점검**: 내 일정 달력과 점검 화면","**＋ 업무추가**: 고른 날짜로 바로 업무 쓰기","**알림 · 나**: 나에게 온 알림, 보고서 · 팀 공지 · 내 목록 · 설정"]]]]}]});
wkFeat("mtab",{mtPaint,mobPre,mobPeople,mobEditOpen,mobRender});
