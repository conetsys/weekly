/* rhy:se Weekly Plan — 🧪 실험실 › 🖥 새 화면 (시험판) (feat-ui2.js, v3.34.0)
   PC(가로 1024px 이상)에서만: 왼쪽 메뉴 + 차분한 브랜드형 모양. 기능 · 화면 구성은 그대로 두고 모양과 메뉴 위치만 바꿈
   · 1280px 이상: 메뉴 펼침(232px) · 1024~1279px: 아이콘 메뉴(64px) · 1024px 미만(휴대폰 · 좁은 창): 예전 화면 그대로
   · 좌우 스크롤 없음: 주간 표는 좁으면 '다음 주' 칸을 아래로, 사업관리 공정 표는 산출물을 이름 아래로, 주차별은 6 → 4 → 3주
   · 메뉴 단추는 원래 단추를 대신 눌러 줌 (원래 단추는 숨김) → 기능 파일이 바뀌어도 따라감
   · '예전 화면으로'는 항상 메뉴 아래에 (my_lists.mods.ui2 = false)
   core.js 다음에 읽힘. core는 F("ui2Paint")로만 부르고, feat-proj는 F("ui2Narrow") · F("ui2WeekN")만 물어봄. 이 파일이 고장 나면 예전 화면 그대로 */
const U2={on:false,wide:false,lastLay:"table",mo:null,raf:0,font:false,pjKey:""};
const U2_Q=matchMedia("(min-width:1024px)"),U2_W=matchMedia("(min-width:1280px)");
const U2_ICON={
  week:"M3 5h18v14H3zM3 10h18M9 10v9M15 10v9",
  check:"M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  report:"M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5",
  alerts:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  cowork:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  pm:"M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18",
  meet:"M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4zM8 9h8M8 13h6",
  notice:"M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1zM16 9a3 3 0 0 1 0 6",
  old:"M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
  fb:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"};
const U2_MARK=`<svg class="u2mark" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="112" fill="#10201D"></rect><rect x="76" y="76" width="360" height="360" rx="86" fill="none" stroke="#F4F7F6" stroke-width="30"></rect><g transform="translate(134,168) scale(1.6267)"><circle cx="12" cy="62" r="16" fill="#F4F7F6"></circle><path d="M12 62 H48 L60 22 L76 86 L90 46 L98 62 H138" fill="none" stroke="#F4F7F6" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="138" cy="62" r="16" fill="#F4F7F6"></circle></g></svg>`;
const U2_NAV=[["week","주간 업무"],["check","점검"],["report","보고서"],["alerts","알림"],["cowork","Co-work"],["pm","사업관리"],["meet","회의록"]];
const u2Svg=k=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${U2_ICON[k]}"></path></svg>`;
const u2Want=()=>!!F("labOn","ui2");
const u2Html=document.documentElement.classList;
const u2Shown=id=>{const b=$(id);return !!b&&!b.hidden};

/* ---------- 켜고 끄기 ---------- */
function ui2Paint(){const on=u2Want()&&U2_Q.matches,wide=on&&U2_W.matches;
  if(on!==U2.on||wide!==U2.wide){U2.on=on;U2.wide=wide;document.body.classList.toggle("ui2",on);document.body.classList.toggle("u2wide",wide);
    if(on){u2Font();u2Rail();F("useMark","ui2")}else{const r=$("u2Rail");if(r)r.hidden=true;document.body.classList.remove("u2pjsub");const b=$("u2Beat");if(b)b.hidden=true}
    u2PjRe()}
  if(on){if(st.layout&&st.layout!=="share")U2.lastLay=st.layout;u2Later();u2Beat();
    if(st.loaded&&!U2.took){U2.took=true;let k=null;try{k=JSON.parse(sessionStorage.getItem("wk-u2-go")||"null");sessionStorage.removeItem("wk-u2-go")}catch(_){}if(k)setTimeout(()=>u2Go(k),400)}}
  return true}
function u2Font(){if(U2.font)return;U2.font=true;const l=document.createElement("link");l.rel="stylesheet";
  l.href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";document.head.appendChild(l)}
U2_Q.addEventListener("change",()=>ui2Paint());U2_W.addEventListener("change",()=>ui2Paint());
let u2RT=0;addEventListener("resize",()=>{if(!U2.on)return;clearTimeout(u2RT);u2RT=setTimeout(u2PjRe,180)});
// 사업관리: 폭이 바뀌어 '산출물 위치' · '보이는 주 수'가 달라질 때만 다시 그림
function u2PjRe(){const k=ui2Narrow()+"|"+ui2WeekN();if(k===U2.pjKey)return;U2.pjKey=k;if(u2Html.contains("pj-on"))F("pjRender")}
function u2Body(){const b=$("pjBody");return b&&b.clientWidth?b.clientWidth:innerWidth-(U2.wide?232:64)-48}
function ui2Narrow(){return !!U2.on&&u2Body()<1120}
function ui2WeekN(){if(!U2.on)return 6;const w=u2Body();return w>=1060?6:w>=820?4:3}

/* ---------- 왼쪽 메뉴 ---------- */
function u2Rail(){let r=$("u2Rail");
  if(!r){r=document.createElement("aside");r.id="u2Rail";r.setAttribute("aria-label","메뉴");
    r.innerHTML=`<button type="button" class="u2brand" data-u2="week" title="주간 업무">${U2_MARK}<span class="u2l"><b>rhy:se</b><span class="u2wp">Weekly Plan</span><small id="u2Team"></small></span></button>
      <nav class="u2nav" aria-label="화면">${U2_NAV.map(([k,l])=>`<button type="button" class="u2i" data-u2="${k}" title="${l}">${u2Svg(k)}<span class="u2l">${l}</span><b class="u2n" hidden></b></button>${k==="pm"?'<div class="u2sub" id="u2Sub" hidden></div>':""}`).join("")}</nav>
      <span class="u2sp"></span>
      <div class="u2lab"><span class="u2l">🧪 새 화면 · 시험판</span><button type="button" data-u2="fb" title="💬 써 보니 어때요?">${u2Svg("fb")}<span class="u2l">의견</span></button><button type="button" data-u2="old" title="예전 화면으로">${u2Svg("old")}<span class="u2l">예전 화면으로</span></button></div>
      <button type="button" class="u2i" data-u2="notice" title="팀 공지">${u2Svg("notice")}<span class="u2l">팀 공지</span><i class="u2dot" hidden></i></button>
      <button type="button" class="u2me" data-u2="me" title="내 정보" aria-haspopup="menu"><span class="u2av"></span><span class="u2l"><b></b><small></small></span><i class="u2dot" hidden></i></button>`;
    document.body.prepend(r);r.addEventListener("click",u2Click);
    U2.mo=new MutationObserver(()=>u2Later());
    const hd=document.querySelector("header.top");if(hd)U2.mo.observe(hd,{subtree:true,childList:true,attributes:true,characterData:true,attributeFilter:["hidden","aria-selected"]});
    U2.mo.observe(document.documentElement,{attributes:true,attributeFilter:["class"]});const rp=$("reportPage");if(rp)U2.mo.observe(rp,{attributes:true,attributeFilter:["hidden"]})}
  r.hidden=false;u2RailPaint()}
function u2Later(){if(U2.raf)return;U2.raf=requestAnimationFrame(()=>{U2.raf=0;if(U2.on)u2RailPaint()})}
function u2Act(){if(u2Html.contains("pj-on"))return "pm";if(u2Html.contains("meet-on"))return "meet";const rp=$("reportPage");if(rp&&!rp.hidden)return "report";
  if(st.view==="review")return "check";if(st.layout==="share")return "cowork";return "week"}
function u2RailPaint(){const r=$("u2Rail");if(!r||!st.me)return;const act=u2Act(),pm=u2Html.contains("pj-on");
  // 프로젝트 화면이 열리면 사업관리 탭이 그려진 뒤 하위 메뉴를 따라 그림
  const pt=$("pjTabs");if(pt&&!pt.dataset.u2){pt.dataset.u2="1";U2.mo.observe(pt,{childList:true,subtree:true,attributes:true,attributeFilter:["aria-selected"]});
    const pp=$("projPage");if(pp)U2.mo.observe(pp,{attributes:true,attributeFilter:["hidden"]})}
  const vis={week:true,check:!!$("tab-review")&&!$("tab-review").hidden,report:u2Shown("reportBtn"),alerts:u2Shown("alertBtn")||pm,cowork:u2Shown("shareBtn"),pm:u2Shown("projBtn")||pm,meet:u2Shown("meetBtn")};
  const an=$("alertN"),sn=$("shareN"),pan=$("pjAlertN");
  const badge={alerts:pm&&pan&&!pan.hidden?pan.textContent:an&&!an.hidden?an.textContent:"",cowork:sn&&!sn.hidden?sn.textContent.replace(/^새\s*/,""):""};
  r.querySelectorAll(".u2nav .u2i").forEach(b=>{const k=b.dataset.u2;b.hidden=!vis[k];b.classList.toggle("on",k===act);if(k===act)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");
    const n=b.querySelector(".u2n");n.hidden=!badge[k];n.textContent=badge[k]||""});
  // 사업관리 하위 메뉴 (펼친 메뉴일 때만 — 아이콘 메뉴에서는 사업관리 위쪽 탭 그대로)
  const sub=$("u2Sub"),tabs=pm&&pt?[...pt.querySelectorAll("[data-pjv]")]:[];
  sub.hidden=!U2.wide||!tabs.length;document.body.classList.toggle("u2pjsub",!sub.hidden);
  if(!sub.hidden){const h=tabs.map(t=>`<button type="button" class="u2s${t.getAttribute("aria-selected")==="true"?" on":""}" data-u2pj="${esc(t.dataset.pjv)}">${esc(t.textContent)}</button>`).join("");if(sub.innerHTML!==h)sub.innerHTML=h}
  const tm=$("u2Team"),ts=$("teamSwitch"),tn=ts&&ts.selectedOptions&&ts.selectedOptions[0]?ts.selectedOptions[0].textContent:(typeof teamName==="function"?teamName(st.me.team_id):"");if(tm.textContent!==tn)tm.textContent=tn||"";
  const me=r.querySelector(".u2me"),role=st.me.is_admin?"관리자":typeof isCeo==="function"&&isCeo()?"대표":st.me.role==="leader"?"팀장":"팀원";
  me.querySelector(".u2av").textContent=(st.me.name||"나").slice(0,1);me.querySelector("b").textContent=st.me.name||"";me.querySelector("small").textContent=role+" · 내 정보";
  const ud=$("userDot");me.querySelector(".u2dot").hidden=!ud||ud.hidden;
  const nd=$("noticeDot"),nb=r.querySelector('[data-u2="notice"]');nb.hidden=!u2Shown("noticeBtn")&&!pm;nb.querySelector(".u2dot").hidden=!nd||nd.hidden}

/* ---------- 위쪽: 이번 주 박자 카드 ("이번주 ○○님의 rhy:se") ---------- */
// 요일별로 끝낸 일만큼 두근 (많을수록 높게), 진행 중인 일은 아래 글로
function u2BeatPath(days){let d="M0 16",x=0;days.forEach(n=>{const a=n?Math.min(13,5+n*3):2,b=n?Math.round(a*.6):1;d+=` h10 l3 ${-a} l3 ${a+b} l3 ${-b} h5`;x+=24});return d+" h4"}
function u2Beat(){const nav=$("weekNav");if(!nav)return;let c=$("u2Beat");
  if(!c){c=document.createElement("button");c.type="button";c.id="u2Beat";c.className="u2beat";c.onclick=()=>{u2Go("check");u2Later()};nav.insertAdjacentElement("afterend",c)}
  const me=st.me,show=!!me&&isMyTeam(st.team)&&st.view==="write"&&st.layout!=="month";c.hidden=!show;if(!show)return;
  const W=st.week,end=keyOf(addDays(parseKey(W),6)),days=[0,0,0,0,0];let done=0,prog=0;
  // 이번 주 칸이 없어도 지난 기록이 안 끝났으면 이월로 셈 (위 숫자 요약과 같게)
  st.items.filter(it=>it._email===me.email&&!it.co&&it.weeks).forEach(it=>{let e=it.weeks[W];
    if(!e&&W<=CUR){const k=Object.keys(it.weeks).filter(x=>x<W).sort().pop(),pe=k&&it.weeks[k];if(pe&&pe.task&&pe.status!=="완료"&&!pe.planned)e={status:pe.status}}
    if(!e||(e.planned&&W>CUR)||(!e.task&&!e.status))return;
    if(e.status==="완료"){done++;const at=e.done_at&&e.done_at>=W&&e.done_at<=end?e.done_at:e.due&&e.due>=W&&e.due<=end?e.due:keyOf(addDays(parseKey(W),4));
    days[Math.max(0,Math.min(4,Math.round((parseKey(at)-parseKey(W))/864e5)))]++}else if(e.status==="진행")prog++});
  const wt=($("weekTitle")||{}).textContent||"이번주";
  const h=`<svg width="124" height="28" viewBox="0 0 124 28" fill="none" stroke="#18B094" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="요일별 끝낸 일"><path d="${u2BeatPath(days)}"></path></svg><span class="u2bt"><small>${esc(wt)} ${esc(me.name)}님의 rhy:se</small><b>끝낸 일 ${done} · 진행 ${prog}</b></span>`;
  if(c.innerHTML!==h)c.innerHTML=h;c.title="점검으로 · 이번 주를 챙겨요"}

/* ---------- 점검: 확인할 업무 + 내 리듬 (나만 봐요) ---------- */
function ui2Review(need){if(!U2.on||!st.me)return;const V=$("reviewView");if(!V)return;
  const W=st.week,self=isMyTeam(st.team)&&st.owner===st.me.name,all=st.owner==="전체";
  const ago=d=>d?Math.max(0,Math.round((parseKey(todayKey)-parseKey(d))/864e5)):0;
  const run=it=>{let n=0,k=W;while(it.weeks&&it.weeks[k]&&it.weeks[k].task&&n<52){n++;k=prevKey(k)}return n};
  const chev='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"></path></svg>';
  const row=r=>{const e=r.cur||{},t=r.late?["late","기한 지남"]:r.waitN>=2?["wait","오래 대기"]:["carry","이월"];
    const when=r.late?`${shortDate(e.due)} · ${ago(e.due)}일 지남`:r.waitN>=2?`대기 ${r.waitN}주째`:`${Math.max(2,run(r.it))}주째`;
    const meta=r.late||r.waitN>=2?[r.it.project,r.it.part,r.it.customer].filter(Boolean).map(esc).join(" · "):"지난주에서 넘어옴"+(r.it.project?" · "+esc(r.it.project):"");
    return `<button type="button" class="u2r" data-id="${esc(r.it._id)}"><span class="u2tag ${t[0]}">${t[1]}</span><span class="u2rt"><b>${esc(e.task||"")}</b><small>${all?`<i>${esc(r.it.owner)}</i>`:""}${meta}</small></span><span class="u2rw">${when}</span>${chev}</button>`};
  const n3=k=>need.filter(r=>k==="late"?r.late:k==="wait"?r.waitN>=2:r.cur&&r.cur.carried).length;
  const list=`<section class="u2need"><div class="u2sh"><h2>확인할 업무</h2><span class="u2cnt">${need.length}</span><span class="spacer"></span><span class="u2sum">기한 지남 ${n3("late")} · 이월 ${n3("carry")} · 오래 대기 ${n3("wait")}</span></div>
    ${need.length?need.map(row).join(""):`<p class="u2empty">챙길 업무가 없어요. 좋은 흐름이에요.</p>`}</section>`;
  V.querySelectorAll('[data-fold="need"]').forEach(x=>x.remove());
  if(self)V.querySelectorAll(".panel.rhythm").forEach(x=>x.remove());
  V.insertAdjacentHTML("afterbegin",`<div class="u2chk${self?"":" one"}">${list}${self?u2Rhythm(W):""}</div>`)}
// 최근 8주: 막대 = 그 주 완료율, 심박선 = 그 주 끝낸 일 수
function u2Rhythm(W){const me=st.me.email,ks=[];let k=W;for(let i=0;i<8;i++){ks.unshift(k);k=prevKey(k)}
  const mine=st.items.filter(it=>it._email===me&&!it.co&&it.weeks),why={};let T=0,D=0,dn=0,on=0,mv=0;
  const S=ks.map(k=>{let t=0,d=0;mine.forEach(it=>{const e=it.weeks[k];if(!e||!e.task||(e.planned&&k>CUR))return;t++;
    if(e.status==="완료"){d++;if(e.done_at&&e.due){dn++;if(e.done_at<=e.due)on++}}
    (e.chg||[]).forEach(x=>{if(x&&x.d0&&x.d1&&x.d1>x.d0){mv++;const w=(x.why||"").trim();if(w)why[w]=(why[w]||0)+1}})});T+=t;D+=d;return {k,t,d}});
  let p="M0 40";S.forEach(s=>{const a=s.d?Math.min(30,8+s.d*5):3,b=s.d?Math.round(a*.55):2;p+=` h22 l6 ${-a} l6 ${a+b} l6 ${-b} h5`});
  const bars=S.map((s,i)=>{const r=s.t?s.d/s.t:0,last=i===S.length-1,lab=last&&W===CUR?"이번":i%2===0?shortDate(s.k):"";
    return `<div class="u2bar" title="${shortDate(s.k)} 주 · ${s.t?`${s.d}/${s.t}건 완료`:"쓴 일 없음"}"><i class="${last?"cur":""}" style="height:${s.t?Math.max(8,Math.round(r*100)):4}%"></i><span>${lab}</span></div>`}).join("");
  const top=Object.entries(why).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const pc=(a,b)=>b?Math.round(a*100/b)+"%":"-";
  return `<section class="u2rhy"><div class="u2sh"><h2>내 리듬</h2><small>나만 봐요</small></div>
    <svg class="u2rp" width="100%" height="56" viewBox="0 0 360 56" preserveAspectRatio="none" fill="none" stroke="#18B094" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="최근 8주 박자"><path d="${p}" vector-effect="non-scaling-stroke"></path></svg>
    <div class="u2bars">${bars}</div>
    <div class="u2kpi"><div><small>8주 완료율</small><b>${pc(D,T)}</b></div><div><small>계획 지킴</small><b>${pc(on,dn)}</b></div><div><small>미룬 일</small><b>${mv}</b></div></div>
    <div class="u2why"><small>자주 미루는 이유</small><span>${top.length?top.map(([w,n])=>`${esc(w)} ${n}`).join(" · "):mv?"이유를 고르지 않고 미뤘어요":"최근 8주 동안 미룬 일이 없어요"}</span></div></section>`}

/* ---------- 메뉴 누르기: 원래 단추를 대신 누름 ---------- */
function u2Leave(k){
  if(k!=="pm"&&u2Html.contains("pj-on"))F("pjClose");
  if(k!=="meet"&&u2Html.contains("meet-on")&&typeof closeMeetPage==="function")closeMeetPage();
  const rp=$("reportPage");if(k!=="report"&&rp&&!rp.hidden&&$("rpBack"))$("rpBack").click()}
const u2Press=id=>{const b=$(id);if(b)b.click();return !!b};
function u2Go(k){
  // 📐 사업관리 주소(/pm/)에서는 rhy:se 화면이 따로 열리므로, 넘어간 뒤 그 메뉴를 열도록 적어 두고 이동
  if(typeof PM_MODE!=="undefined"&&PM_MODE&&["week","check","cowork","report","meet"].includes(k)){if(typeof pmGo==="function")pmGo("app",k==="week"?null:{k:"wk-u2-go",v:k});return}
  if(k==="week"||k==="check"||k==="cowork"){u2Leave(k);if(typeof PM_MODE!=="undefined"&&PM_MODE)return;
    if(k==="check"){if(st.view!=="review")u2Press("tab-review");return}
    if(st.view!=="write")u2Press("tab-write");
    if(k==="cowork"){if(st.layout!=="share")u2Press("shareBtn");return}
    if(st.layout==="share"){const b=document.querySelector(`[data-layout="${U2.lastLay}"]`)||document.querySelector('[data-layout="table"]');if(b)b.click()}
    scrollTo({top:0});return}
  if(k==="report"){u2Leave(k);const rp=$("reportPage");if(!rp||rp.hidden)u2Press("reportBtn");return}
  if(k==="pm"){if(u2Html.contains("pj-on")){const t=document.querySelector('#pjTabs [data-pjv="list"]');if(t)t.click();return}u2Leave(k);u2Press("projBtn");return}
  if(k==="meet"){u2Leave(k);if(!u2Html.contains("meet-on"))u2Press("meetBtn");return}
  if(k==="alerts"){if(u2Html.contains("pj-on")&&u2Press("pjAlert"))return;u2Press("alertBtn");return}
  if(k==="notice"){u2Press("noticeBtn");return}
  if(k==="old"){F("setMod","ui2",false);toast("예전 화면으로 돌아왔어요 · 🧪 실험실에서 언제든 다시 켤 수 있어요");return}
  if(k==="fb"){F("boardOpen");setTimeout(()=>{const t=$("fbBody");if(t&&!t.value.trim()){t.value="[🧪 실험실 · 🖥 새 화면 (시험판)] ";t.focus();t.setSelectionRange(t.value.length,t.value.length)}},80);return}}
function u2Click(e){const s=e.target.closest("[data-u2pj]");
  if(s){const t=document.querySelector(`#pjTabs [data-pjv="${CSS.escape(s.dataset.u2pj)}"]`);if(t)t.click();return}
  const b=e.target.closest("[data-u2]");if(!b)return;const k=b.dataset.u2;
  if(k==="me"){e.stopPropagation();u2Me(b);return}
  u2Go(k);u2Later()}
// 내 정보: 원래 메뉴를 메뉴 옆에 띄움 (바깥을 누르면 닫히는 core 동작 그대로)
function u2Me(b){const m=$("userMenu");if(!m)return;if(!m.hidden){m.hidden=true;return}
  m.hidden=false;$("userBtn").setAttribute("aria-expanded","true");const r=b.getBoundingClientRect();
  m.style.left=(r.right+8)+"px";m.style.top=Math.max(12,Math.min(r.bottom-m.offsetHeight,innerHeight-m.offsetHeight-12))+"px";
  const f=m.querySelector("button:not([hidden])");if(f)f.focus()}

wkFeat("ui2",{ui2Paint,ui2Narrow,ui2WeekN,ui2Review,ui2On:()=>U2.on});
