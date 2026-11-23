/* =====================================================================
   📇 명함 화면 (v3.30.0) — feat-card.js 가 누를 때 불러옴 (wkPart("card"))
   휴대폰: 목록(회사별 · 받은 사람별 · 최신순) → 찍기(연속) → 확인하고 저장 → 상세
   PC    : 거르기 · 정렬 · 표(회사 · 이름 · 연락처 · 이메일 · 구분 · 받은 날짜 · 연락 여부) · 오른쪽에서 고치기
   서버  : api.cardList/cardAdd/cardSet/cardDel/cardImgUp/cardImgUrl/cardImgDel/cardRead (core · demo 둘 다)
   한글 입력: 조합 중엔 화면을 다시 그리지 않음 (찾기 칸은 목록 부분만 다시 그림)
   ===================================================================== */
const CD={cm:{},list:[],loaded:false,err:"",v:"co",f:"all",todo:false,fB:"all",fTm:"all",fD:"all",q:"",sort:"c",dir:1,sel:{},cur:null,scr:"list",shell:"",
  imgs:{},reading:{},readMsg:"",readErr:"",ci:0,dirty:false,sheet:"",sc:"view",arm:""};
const CD_T={hot:["유망","#F2A170"],mid:["보통","#7DB0D4"],visit:["방문","#7F918C"]};
const CD_ORD=["hot","mid","visit"];
const cdMob=()=>matchMedia("(max-width:760px)").matches;
const cdMe=()=>st.me&&st.me.email;
const cdEvKey=()=>"wk-card-ev:"+(cdMe()||"");
const cdEv=()=>{try{return localStorage.getItem(cdEvKey())||""}catch(_){return ""}};
const cdEvSet=v=>{try{localStorage.setItem(cdEvKey(),v||"")}catch(_){}};
const cdD=iso=>{if(!iso)return "";const d=new Date(iso);return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`};
const cdDay=iso=>{if(!iso)return "";const d=new Date(iso);return `${d.getMonth()+1}/${d.getDate()}`};
const cdById=id=>CD.list.find(c=>c.id===id);
const cdCanDel=c=>c&&!cdShared(c)&&(c.owner_email===cdMe()||(st.me.role==="leader"&&c.team_id===st.me.team_id));
const cdCanEdit=c=>c&&!cdShared(c)&&(c.owner_email===cdMe()||(st.me.role==="leader"&&c.team_id===st.me.team_id)||(st.vteams||[]).includes(c.team_id));
const cdCanShoot=()=>!!(st.me&&st.me.team_id);
// 🔒 임원 명함 (v3.31.0): 공유받은 표시 · 코멘트 (보기 + 💬)
const cdIsExec=c=>!!(c&&F("exIsExecEmail",c.owner_email));
const cdShared=c=>cdIsExec(c)&&c.owner_email!==cdMe();
function cdCmHtml(c){if(!cdIsExec(c))return "";const L=CD.cm[c.id];if(L===undefined){CD.cm[c.id]=null;api.execComments("cards",[c.id]).then(r=>{CD.cm[c.id]=r||[];cdRender()}).catch(()=>{CD.cm[c.id]=[]});}
  return `<section class="cd-box cd-cm"><span class="cd-lb">💬 코멘트 <small>${c.owner_email===cdMe()?"공유한 사람들이 남긴 말":"보기 + 코멘트만 할 수 있어요"}</small></span>
    ${(L||[]).map(m=>`<div class="cd-cmi${m.author_email===cdMe()?" me":""}"><b>${esc(m.author_name)}</b><small>${cdD(m.created_at)}</small>${m.author_email===cdMe()||c.owner_email===cdMe()?`<button type="button" class="cd-cmx" data-cdcmdel="${esc(m.id)}" data-id="${esc(c.id)}" aria-label="지우기">✕</button>`:""}<p>${esc(m.body)}</p></div>`).join("")||(L===null?'<p class="cd-dim">불러오는 중…</p>':"")}
    <div class="cd-cmw"><textarea rows="1" maxlength="2000" data-cdcmin="${esc(c.id)}" placeholder="코멘트 남기기"></textarea><button type="button" class="cd-mini" data-cdcmadd="${esc(c.id)}">올리기</button></div></section>`}
// 보는 범위 이름표: 나 · 우리 팀 · 아래 조직 · 회사 전체
const cdScope=()=>{const vt=(st.vteams||[]).filter(t=>t!==st.me.team_id);return st.me.is_admin||(typeof isCeo==="function"&&isCeo())?"회사 전체 명함":vt.length?"아래 조직 명함":st.me.role==="leader"?"우리 팀 명함":"내 명함"};
const cdSvg=(d,s)=>`<svg width="${s||18}" height="${s||18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const CD_I={back:'<path d="M15 18l-6-6 6-6"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',dl:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',flag:'<path d="M4 21V4h11l-1.5 4L15 12H4"/>',
  find:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',cam:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',chk:'<path d="M5 12l4 4 10-10"/>',
  tel:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',sms:'<path d="M4 5h16v11H9l-5 4z"/>',mail:'<path d="M3 6h18v12H3zM3 7l9 6 9-6"/>',
  add:'<path d="M12 5v14M5 12h14"/>',down:'<path d="M6 9l6 6 6-6"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'};
const CD_PULSE='<svg class="cd-pulse" viewBox="0 0 150 96" aria-hidden="true"><circle cx="12" cy="62" r="11"/><path d="M12 62 H48 L60 22 L76 86 L90 46 L98 62 H138"/><circle cx="138" cy="62" r="11"/></svg>';

/* ---------- 열기 · 닫기 · 불러오기 ---------- */
function openCardPage(){let p=$("cardPage");if(!p){p=document.createElement("div");p.id="cardPage";p.className="cdp";p.setAttribute("role","dialog");p.setAttribute("aria-label","명함");document.body.appendChild(p);cdBind(p)}
  p.hidden=false;document.documentElement.classList.add("cd-open");CD.scr="list";CD.shell="";CD.sheet="";cdRender();cdLoad()}
function cdClose(){cdCamStop();const p=$("cardPage");if(p)p.hidden=true;document.documentElement.classList.remove("cd-open")}
async function cdLoad(){try{const L=await api.cardList();const keep=CD.list.filter(c=>c._local&&!L.some(x=>x.id===c.id));CD.list=keep.concat(L);CD.loaded=true;CD.err=""}catch(x){CD.loaded=true;CD.err=(x&&x.hint)||errText(x)}cdRender()}
let cdRT=0;const cdLater=()=>{clearTimeout(cdRT);cdRT=setTimeout(()=>{if(!$("cardPage")||$("cardPage").hidden)return;const a=document.activeElement;if(a&&a.closest&&a.closest("#cardPage")&&/INPUT|TEXTAREA/.test(a.tagName)&&CD.scr!=="list")return;cdRender()},60)};

/* ---------- 거르기 · 정렬 ---------- */
// 행사 목록 = 회사 기본(관리자 · wk_company.modules.card_events) + 내가 추가(my_lists.card_events) + 명함에 쓰인 것 (v3.30.0.4)
const cdCoEvents=()=>{try{const L=CO&&CO.modules&&CO.modules.card_events;return Array.isArray(L)?L.filter(Boolean):[]}catch(_){return []}};
const cdMyEvents=()=>{const l=st.me&&st.me.my_lists;return l&&Array.isArray(l.card_events)?l.card_events.filter(Boolean):[]};
const cdUsedEvents=()=>[...new Set(CD.list.map(c=>c.event).filter(Boolean))].filter(e=>!cdCoEvents().includes(e)&&!cdMyEvents().includes(e)).sort((a,b)=>a.localeCompare(b,"ko"));
function cdEvents(){return [...new Set([...cdCoEvents(),...cdMyEvents(),...cdUsedEvents()])]}
async function cdMyEvSave(L){const l=Object.assign({},st.me.my_lists||{},{card_events:L});await api.setPrefs(null,l);st.me.my_lists=l}
async function cdMyEvAdd(v){v=(v||"").trim();if(!v||cdCoEvents().includes(v)||cdMyEvents().includes(v))return;try{await cdMyEvSave([...cdMyEvents(),v])}catch(_){}}
function cdPass(c,skip){const ev=cdEv(),q=CD.q.trim().toLowerCase();
  return (!ev||c.event===ev)&&(skip==="t"||CD.f==="all"||c.tag===CD.f)&&(skip==="d"||(CD.todo?!c.done:CD.fD==="all"||(CD.fD==="done")===!!c.done))&&(skip==="b"||CD.fB==="all"||c.owner_email===CD.fB)&&(skip==="m"||CD.fTm==="all"||c.team_id===CD.fTm)
    &&(!q||[c.company,c.name,c.title,c.memo,c.owner_name,c.phone,c.email].some(v=>(v||"").toLowerCase().includes(q)))}
function cdSorted(L){const s=CD.sort,d=CD.dir,tie=(a,b)=>(a.company||"").localeCompare(b.company||"","ko")||(a.name||"").localeCompare(b.name||"","ko");
  return L.slice().sort((a,b)=>{const v=s==="d"?a.created_at.localeCompare(b.created_at):s==="t"?CD_ORD.indexOf(a.tag)-CD_ORD.indexOf(b.tag):s==="done"?(a.done?1:0)-(b.done?1:0):s==="ph"?(a.phone||"").localeCompare(b.phone||""):s==="em"?(a.email||"").localeCompare(b.email||""):s==="n"?(a.name||"").localeCompare(b.name||"","ko"):(a.company||"").localeCompare(b.company||"","ko");return (v*d)||tie(a,b)})}
const cdUnchecked=()=>CD.list.filter(c=>c.owner_email===cdMe()&&!c.checked).sort((a,b)=>a.created_at.localeCompare(b.created_at));

/* ---------- 그리기 ---------- */
function cdRender(){const p=$("cardPage");if(!p||p.hidden)return;const mob=cdMob(),key=(mob?"m:":"p:")+CD.scr;
  if(CD.shell!==key){if(CD.shell.endsWith(":capture")&&!key.endsWith(":capture"))cdCamStop();CD.shell=key;p.className="cdp "+(mob?"is-mob":"is-pc")+" scr-"+CD.scr;p.innerHTML=mob?cdShellMob():cdShellPc()}
  if(mob){if(CD.scr==="list")cdPaintList();else if(CD.scr==="capture"){cdPaintCap();if(!CD.stream&&!CD.cam)cdCamStart()}else if(CD.scr==="confirm")cdPaintConf();else if(CD.scr==="detail")cdPaintDetail()}
  else cdPaintPc();
  cdPaintSheet();cdImgs()}
function cdBanner(){if(!CD.loaded)return `<p class="cd-note">불러오는 중…</p>`;if(CD.err)return `<p class="cd-err">${esc(CD.err)}</p>`;return ""}
function cdLogo(){return `<span class="cd-logo">RHY${CD_PULSE}SE</span>`}

/* ===== 휴대폰 ===== */
function cdShellMob(){
  if(CD.scr==="list")return `<header class="cd-h"><div class="cd-hr"><button type="button" class="cd-ib" data-cd="close" aria-label="rhy:se로 돌아가기">${cdSvg(CD_I.back,20)}</button>
      <div class="cd-tt">${cdLogo()}<span class="cd-sub">${cdScope()}</span><b>명함</b></div><span class="cd-sp"></span>
      <button type="button" class="cd-ib bd" data-cd="xlsx-sheet" aria-label="엑셀로 내려받기">${cdSvg(CD_I.dl)}</button><button type="button" class="cd-evb" data-cd="ev-sheet" id="cdEvBtn"></button></div>
    <label class="cd-find">${cdSvg(CD_I.find)}<span class="sr">이름, 회사로 찾기</span><input type="search" id="cdQ" placeholder="이름 · 회사로 찾기" value="${esc(CD.q)}" autocomplete="off"></label>
    <div id="cdMid"></div></header><main class="cd-body" id="cdBody"></main>
    ${cdCanShoot()?`<div class="cd-foot"><button type="button" class="cd-cta" data-cd="capture">${cdSvg(CD_I.cam,22)}명함 찍기</button></div>`:""}<div id="cdSheet"></div>`;
  if(CD.scr==="capture")return `<header class="cd-ch"><button type="button" class="cd-ib" data-cd="list" aria-label="닫기">${cdSvg(CD_I.x,22)}</button><div class="cd-ct" id="cdCapT"></div>
      <label class="cd-ib" aria-label="사진에서 고르기" title="사진에서 고르기"><input type="file" accept="image/*" multiple data-cdshot="1" hidden>${cdSvg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',21)}</label></header>
    <main class="cd-cam" id="cdCam"><video id="cdVid" playsinline muted autoplay></video>
      <div class="cd-mask"><div class="cd-win" id="cdWin"><img id="cdLast" alt="" hidden><div class="cd-ph" id="cdPh"><span></span><span></span><span></span><span></span></div>
        <svg class="cd-scan" viewBox="0 0 330 24" aria-hidden="true"><path d="M4 12 H130 L145 3 L160 21 L175 6 L183 12 H326"/></svg><i class="cd-c tl"></i><i class="cd-c tr"></i><i class="cd-c bl"></i><i class="cd-c br"></i><b class="cd-flash"></b></div></div>
      <p class="cd-hint" id="cdHint"></p></main>
    <div class="cd-capst" role="status" id="cdCapSt"></div><footer class="cd-capf" id="cdCapF"></footer><div id="cdSheet"></div>`;
  if(CD.scr==="confirm")return `<header class="cd-ch"><button type="button" class="cd-ib" data-cd="list" aria-label="목록으로">${cdSvg(CD_I.back,20)}</button><div class="cd-ct"><b>확인하고 저장</b><span id="cdConfStep"></span></div><button type="button" class="cd-tb" data-cd="conf-skip">건너뛰기</button></header>
    <div class="cd-prog"><i id="cdProg"></i></div><main class="cd-body cd-form" id="cdConf"></main><div class="cd-foot" id="cdConfF"></div><div id="cdSheet"></div>`;
  return `<header class="cd-ch"><button type="button" class="cd-ib" data-cd="list" aria-label="목록으로">${cdSvg(CD_I.back,20)}</button><span class="cd-sp"></span><button type="button" class="cd-tb" data-cd="edit">고치기</button></header>
    <main class="cd-body cd-det" id="cdDet"></main><div id="cdSheet"></div>`}
function cdChips(){const base=CD.list.filter(c=>cdPass(c,"t"));
  return [["all","전체"],...CD_ORD.map(k=>[k,CD_T[k][0]])].map(([k,l])=>`<button type="button" class="cd-chip${CD.f===k?" on":""}" data-cdf="${k}" aria-pressed="${CD.f===k}">${k==="all"?"":`<i style="background:${CD_T[k][1]}"></i>`}${l}<span>${base.filter(c=>k==="all"||c.tag===k).length}</span></button>`).join("")}
function cdPaintList(){const ev=cdEv();$("cdEvBtn").innerHTML=`${cdSvg(CD_I.flag,16)}<span>${esc(ev||"전체 행사")}</span>${cdSvg(CD_I.down,14)}`;
  $("cdMid").innerHTML=`<div class="cd-chips" role="group" aria-label="구분으로 거르기">${cdChips()}</div>
    <div class="cd-row"><button type="button" class="cd-sw${CD.todo?" on":""}" data-cd="todo" aria-pressed="${CD.todo}"><i><b></b></i>연락 전만 보기</button>
    <div class="cd-seg" role="group" aria-label="보는 방식">${[["co","회사별"],["by","받은 사람별"],["new","최신순"]].map(([k,l])=>`<button type="button" class="${CD.v===k?"on":""}" data-cdv="${k}" aria-pressed="${CD.v===k}">${l}</button>`).join("")}</div></div>`;
  cdPaintListBody()}
function cdPaintListBody(){const L=CD.list.filter(c=>cdPass(c)),un=cdUnchecked(),mk=(c,showCo)=>cdCardHtml(c,showCo);
  let body=cdBanner();
  if(un.length)body+=`<button type="button" class="cd-unc" data-cd="confirm"><span>${CD_PULSE}<b>확인 안 한 명함 ${un.length}장</b></span><span>확인하기 ›</span></button>`;
  if(CD.loaded&&!CD.err){
    const coN=new Set(L.map(c=>c.company||"(회사 없음)")).size,byN=new Set(L.map(c=>c.owner_email)).size;
    body+=`<div class="cd-sum"><span>${L.length}명${CD.todo?" · 연락 전":""}</span><span>${coN}개 회사${byN>1?` · ${byN}명이 받음`:""}</span></div>`;
    if(!L.length)body+=`<div class="cd-empty">${CD.list.length?(CD.todo?"연락할 명함이 모두 끝났어요":"맞는 명함이 없어요"):(cdCanShoot()?"아직 모은 명함이 없어요.<br>아래 <b>명함 찍기</b>로 시작해 보세요.":"아직 볼 수 있는 명함이 없어요.")}</div>`;
    else if(CD.v==="new")body+=cdSorted(L).sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(c=>mk(c,true)).join("");
    else{const key=CD.v==="co"?(c=>c.company||"(회사 없음)"):(c=>c.owner_email),m=new Map();L.forEach(c=>{const k=key(c);if(!m.has(k))m.set(k,[]);m.get(k).push(c)});
      const G=[...m.entries()].map(([k,xs])=>({k,xs,h:CD.v==="co"?k:`${xs[0].owner_name||k} 님이 받음`})).sort((a,b)=>a.h.localeCompare(b.h,"ko"));
      body+=G.map(g=>`<section class="cd-grp"><div class="cd-gh"><span><b>${esc(g.h)}</b><em>${g.xs.length}명</em></span><span>${CD.v==="co"?"받은 사람 "+esc([...new Set(g.xs.map(c=>c.owner_name))].join(" · ")):new Set(g.xs.map(c=>c.company)).size+"개 회사"}</span></div>
        ${g.xs.sort((a,b)=>(a.name||"").localeCompare(b.name||"","ko")).map(c=>mk(c,CD.v!=="co")).join("")}</section>`).join("")}}
  $("cdBody").innerHTML=body}
function cdCardHtml(c,showCo){const t=CD_T[c.tag]||CD_T.mid,rd=CD.reading[c.id];
  return `<button type="button" class="cd-card${c.checked?"":" unc"}" data-cdopen="${esc(c.id)}">
    <span class="cd-c1"><b>${esc(c.name||(rd?"읽는 중…":"(이름 없음)"))}<small>${esc(c.title||"")}</small></b><span class="cd-c1r">${cdShared(c)?'<span class="cd-shb">🔒 공유받음</span>':""}<span class="cd-tag t-${c.tag}">${t[0]}</span></span></span>
    ${showCo&&c.company?`<span class="cd-co">${esc(c.company)}</span>`:""}${c.memo?`<span class="cd-memo">"${esc(c.memo)}"</span>`:""}${c.checked?"":`<span class="cd-uncb">${rd?"AI가 읽는 중":"확인 전"}</span>`}
    <span class="cd-c3"><span class="cd-by"><i>${esc((c.owner_name||"").slice(-2))}</i><span><b>${esc(c.owner_name||"")}</b> 받음 · ${cdD(c.created_at)}</span></span><span class="cd-st ${c.done?"ok":"todo"}"><i></i>${c.done?"연락함":"연락 전"}</span></span></button>`}

/* 찍기: 앱 안 카메라 + 명함 틀(가로 9:5) 고정 → 틀 안만 잘라서 저장 (v3.30.0.3). 카메라를 못 열면 기본 카메라로 */
function cdPaintCap(){const ev=cdEv(),mine=CD.list.filter(c=>c.owner_email===cdMe()&&c._sess),n=mine.length,rd=Object.keys(CD.reading).length,last=mine[0],live=CD.cam==="on";
  $("cdCapT").innerHTML=`<b>${esc(ev||"행사 없음")} · 연속 촬영</b><button type="button" class="cd-lk" data-cd="ev-sheet">행사 바꾸기</button>`;
  $("cdCam").classList.toggle("live",live);$("cdWin").classList.toggle("reading",!!rd);
  const li=$("cdLast");if(!live&&last&&last.img&&CD.imgs[last.img]){li.src=CD.imgs[last.img];li.hidden=false;$("cdPh").hidden=true}else{li.hidden=true;$("cdPh").hidden=live}
  $("cdHint").innerHTML=`<i></i>${CD.cam==="wait"?"카메라를 여는 중…":live?(n?"좋아요! 다음 분 명함도 틀에 맞춰 찍으세요":"명함을 틀에 꽉 맞추고 둥근 단추를 누르세요"):CD.cam==="no"?"카메라를 열 수 없어 기본 카메라로 찍어요":"아래 둥근 단추를 누르면 카메라가 열려요"}`;
  $("cdCapSt").innerHTML=CD.readErr?`<span class="cd-err">${esc(CD.readErr)}</span>`:CD.readMsg||rd?`${cdSvg(CD_I.chk)}<span>${esc(CD.readMsg||"명함을 읽고 있어요")}</span><small>${rd?`읽는 중 ${rd}장`:""}</small>`:`<span class="cd-dim">찍은 명함은 바로 저장되고, AI가 뒤에서 읽어요</span>`;
  const thumb=last&&last.img&&CD.imgs[last.img];
  $("cdCapF").innerHTML=`<button type="button" class="cd-stack${thumb?" has":""}" data-cd="confirm" aria-label="찍은 명함 ${n}장 확인하기">${thumb?`<img src="${thumb}" alt="">`:"<i></i><i></i>"}<b>${n}</b></button>
    ${live?`<button type="button" class="cd-shut" data-cd="snap" aria-label="찍기"><span></span></button>`:`<label class="cd-shut" aria-label="찍기"><input type="file" accept="image/*" capture="environment" data-cdshot="1" hidden><span></span></label>`}
    <button type="button" class="cd-go" data-cd="confirm"${cdUnchecked().length?"":" disabled"}>확인하기</button>`}
async function cdCamStart(){if(CD.stream||CD.cam==="wait")return;const md=navigator.mediaDevices;if(!md||!md.getUserMedia){CD.cam="no";cdRender();return}
  CD.cam="wait";cdRender();
  try{const s=await md.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1080}},audio:false});
    if(CD.scr!=="capture"||!$("cdVid")){s.getTracks().forEach(t=>t.stop());CD.cam="";return}
    CD.stream=s;const v=$("cdVid");v.srcObject=s;try{await v.play()}catch(_){}CD.cam="on"}
  catch(_){CD.cam="no"}cdRender()}
function cdCamStop(){if(CD.stream){CD.stream.getTracks().forEach(t=>t.stop());CD.stream=null}const v=$("cdVid");if(v)v.srcObject=null;if(CD.cam!=="no")CD.cam=""}
// 화면에 보이는 틀 위치를 영상 원본 좌표로 바꿔 그 부분만 잘라냄 (영상은 object-fit:cover)
function cdSnap(){const v=$("cdVid"),w=$("cdWin");if(!v||!w||!v.videoWidth)return;const vr=v.getBoundingClientRect(),wr=w.getBoundingClientRect(),VW=v.videoWidth,VH=v.videoHeight;
  const k=Math.max(vr.width/VW,vr.height/VH),ox=(vr.width-VW*k)/2,oy=(vr.height-VH*k)/2,pad=.03;
  let sx=(wr.left-vr.left-ox)/k,sy=(wr.top-vr.top-oy)/k,sw=wr.width/k,sh=wr.height/k;sx-=sw*pad;sy-=sh*pad;sw*=1+2*pad;sh*=1+2*pad;
  sx=Math.max(0,sx);sy=Math.max(0,sy);sw=Math.min(VW-sx,sw);sh=Math.min(VH-sy,sh);
  const sc=Math.min(1,1600/sw),c=document.createElement("canvas");c.width=Math.round(sw*sc);c.height=Math.round(sh*sc);c.getContext("2d").drawImage(v,sx,sy,sw,sh,0,0,c.width,c.height);
  const f=w.querySelector(".cd-flash");if(f){f.classList.remove("go");void f.offsetWidth;f.classList.add("go")}try{navigator.vibrate&&navigator.vibrate(30)}catch(_){}
  c.toBlob(b=>{if(b)cdShot(b,true)},"image/jpeg",.88)}
/* 확인하고 저장 / 고치기 */
function cdFormCard(){if(CD.edit)return cdById(CD.edit);const U=cdUnchecked();if(CD.ci>=U.length)CD.ci=0;return U[CD.ci]}
function cdPaintConf(){const U=cdUnchecked(),c=cdFormCard();
  if(!c){$("cdConfStep").textContent="";$("cdProg").style.width="100%";$("cdConf").innerHTML=`<div class="cd-empty">확인할 명함이 없어요.<br>모두 정리했어요!</div>`;$("cdConfF").innerHTML=`<button type="button" class="cd-cta" data-cd="list">목록으로</button>`;return}
  const idx=CD.edit?0:U.indexOf(c),tot=CD.edit?1:U.length,rd=CD.reading[c.id];
  $("cdConfStep").textContent=CD.edit?"고치기":`${idx+1} / ${tot}장`;$("cdProg").style.width=Math.round((idx+1)/tot*100)+"%";
  const F=[["company","회사"],["name","이름"],["title","직함"],["phone","휴대폰","tel"],["email","이메일","email"]];
  $("cdConf").innerHTML=`<div class="cd-ci">${c.img?`<button type="button" class="cd-thumb" data-cdbig="${esc(c.img)}" aria-label="사진 크게 보기"><img data-cdimg="${esc(c.img)}" alt="찍은 명함"></button>`:`<div class="cd-thumb ph"></div>`}
      <div>${rd?`<b class="cd-reading">${CD_PULSE}AI가 읽는 중…</b><span>읽으면 칸이 저절로 채워져요</span>`:`<b>${CD_PULSE}${CD.edit?"명함 고치기":"자동으로 채웠어요"}</b><span>틀린 곳만 눌러서 고치세요<br>사진을 누르면 크게 보여요</span>`}</div></div>
    <section class="cd-fields" aria-label="명함 정보">${F.map(([k,l,ty])=>`<label><span>${l}</span><input data-cdfld="${k}" type="${ty||"text"}" value="${esc(c[k]||"")}" maxlength="200"${rd?" disabled":""}>${!rd&&!c[k]&&k!=="title"?'<em>확인 필요</em>':""}</label>`).join("")}</section>
    <section><span class="cd-lb" id="cdTagH">구분</span><div class="cd-tags" role="group" aria-labelledby="cdTagH">${CD_ORD.map(k=>`<button type="button" class="t-${k}${(CD.ftag||c.tag)===k?" on":""}" data-cdftag="${k}" aria-pressed="${(CD.ftag||c.tag)===k}"><i></i>${CD_T[k][0]}</button>`).join("")}</div></section>
    <label class="cd-memoin"><span class="cd-lb">메모 <small>(선택)</small></span><input data-cdfld="memo" value="${esc(c.memo||"")}" maxlength="500" placeholder="예: 다음 달 시연 원함, 견적 요청"></label>
    ${cdEvField(c)}
    <p class="cd-meta">받은 사람 ${esc(c.owner_name||"")} · ${cdD(c.created_at)}</p>
    ${cdCanDel(c)?`<button type="button" class="cd-del${CD.arm===c.id?" arm":""}" data-cddel="${esc(c.id)}">${cdSvg(CD_I.trash,15)}${CD.arm===c.id?"정말 지울까요? 한 번 더 누르세요":"이 명함 지우기"}</button>`:""}`;
  const last=CD.edit||idx>=tot-1;$("cdConfF").innerHTML=`<button type="button" class="cd-cta" data-cd="conf-save"${rd?" disabled":""}>${CD.edit?"저장":last?"저장하고 끝내기":"저장하고 다음 명함"}</button>`;CD.dirty=false}

/* 행사 칸: 직접 쓰거나 지금까지 쓴 행사를 눌러 고름 (확인하고 저장 · 고치기 · PC 상세) */
function cdEvField(c){const E=cdEvents(),v=c.event||"";
  return `<section class="cd-evf"><span class="cd-lb">행사 <small>(선택 · 이 명함을 받은 자리)</small></span>
    <label class="cd-evin">${cdSvg(CD_I.flag,16)}<span class="sr">행사 이름</span><input data-cdfld="event" value="${esc(v)}" maxlength="40" placeholder="예: K-DEX 2026" list="cdEvList" autocomplete="off"></label>
    <datalist id="cdEvList">${E.map(e=>`<option value="${esc(e)}">`).join("")}</datalist>
    ${E.length?`<div class="cd-evchips">${E.map(e=>`<button type="button" class="${e===v?"on":""}" data-cdevpick="${esc(e)}">${esc(e)}</button>`).join("")}<button type="button" data-cdevpick="">행사 없음</button></div>`:""}</section>`}
/* 상세 */
function cdPaintDetail(){const c=cdById(CD.cur);if(!c){CD.scr="list";CD.shell="";cdRender();return}const t=CD_T[c.tag]||CD_T.mid;
  const tel=(c.phone||"").replace(/[^0-9+]/g,"");
  const act=(href,ic,l)=>href?`<a class="cd-act" href="${esc(href)}">${cdSvg(ic,20)}<span>${l}</span></a>`:`<span class="cd-act off">${cdSvg(ic,20)}<span>${l}</span></span>`;
  $("cdDet").innerHTML=`${c.img?`<button type="button" class="cd-photo" data-cdbig="${esc(c.img)}" aria-label="사진 크게 보기"><img data-cdimg="${esc(c.img)}" alt="명함 사진"></button>`:""}
    <div class="cd-dn"><b>${esc(c.name||"(이름 없음)")}</b><span class="cd-tag t-${c.tag}">${t[0]}</span></div><p class="cd-dco">${esc([c.company,c.title].filter(Boolean).join(" · "))}</p>
    <div class="cd-acts">${act(tel?"tel:"+tel:"",CD_I.tel,"전화")}${act(tel?"sms:"+tel:"",CD_I.sms,"문자")}${act(c.email?"mailto:"+c.email:"",CD_I.mail,"메일")}<button type="button" class="cd-act" data-cdvcf="${esc(c.id)}">${cdSvg(CD_I.add,20)}<span>연락처 저장</span></button></div>
    <section class="cd-box${c.done?" done":""}"><button type="button" class="cd-done" data-cddone="${esc(c.id)}" aria-pressed="${!!c.done}"><i>${c.done?cdSvg(CD_I.chk,15):""}</i><span><b>${c.done?"연락함":"아직 연락 전"}</b><small>${c.done?`${cdDay(c.done_at)} · ${esc(c.done_by)}이 체크`:"연락했으면 눌러서 체크하세요"}</small></span></button>
      <div class="cd-tags sm" role="group" aria-label="구분 바꾸기">${CD_ORD.map(k=>`<button type="button" class="t-${k}${c.tag===k?" on":""}" data-cdtag="${k}" data-id="${esc(c.id)}" aria-pressed="${c.tag===k}"><i></i>${CD_T[k][0]}</button>`).join("")}</div></section>
    ${c.memo?`<section class="cd-box"><span class="cd-lb">메모</span><p class="cd-mtx">${esc(c.memo)}</p></section>`:""}
    <section class="cd-box cd-info">${[["휴대폰",c.phone],["이메일",c.email],["회사",[c.company,c.title].filter(Boolean).join(" · ")]].map(([l,v])=>`<div><span>${l}</span><b>${esc(v||"—")}</b></div>`).join("")}</section>
    ${cdCmHtml(c)}
    <p class="cd-meta">${cdSvg(CD_I.flag,14)}${c.event?esc(c.event):`행사 없음 <button type="button" class="cd-lk" data-cd="edit">행사 넣기</button>`} · 받은 사람 ${esc(c.owner_name)} · ${cdD(c.created_at)}</p>`;
  const ed=$("cardPage").querySelector('.cd-ch [data-cd="edit"]');if(ed)ed.hidden=!cdCanEdit(c);if(!cdCanEdit(c))$("cdDet").querySelectorAll("[data-cdtag],[data-cddone],[data-cd=\"edit\"]").forEach(x=>{x.disabled=true})}

/* 아래에서 올라오는 창: 행사 고르기 · 엑셀 · 사진 크게 */
function cdPaintSheet(){const box=$("cdSheet");if(!box)return;if(!CD.sheet){box.innerHTML="";return}
  let inner="";
  if(CD.sheet==="ev"){const ev=cdEv(),cnt=v=>CD.list.filter(c=>c.event===v).length;
    const row=(v,l,del)=>`<div class="cd-evr"><button type="button" class="${ev===v?"on":""}" data-cdev="${esc(v)}"><i></i>${esc(l)}<small>${v&&cnt(v)?cnt(v)+"명":""}</small></button>${del?`<button type="button" class="cd-evx" data-cdevdel="${esc(v)}" aria-label="${esc(v)} 내 목록에서 빼기">✕</button>`:""}</div>`;
    const C=cdCoEvents(),M=cdMyEvents(),U=cdUsedEvents();
    inner=`<h3>${cdSvg(CD_I.flag,18)}행사</h3><p class="cd-dim">고른 행사로 목록을 거르고, 찍는 명함도 이 행사로 모여요</p>
      <div class="cd-evl">${row("","전체 행사 (찍을 땐 행사 없음)")}
        ${C.length?`<span class="cd-evh">회사 기본</span>${C.map(e=>row(e,e)).join("")}`:""}
        ${M.length?`<span class="cd-evh">내가 추가한 행사</span>${M.map(e=>row(e,e,true)).join("")}`:""}
        ${U.length?`<span class="cd-evh">그 밖에 명함에 쓰인 행사</span>${U.map(e=>row(e,e)).join("")}`:""}</div>
      <label class="cd-newev"><span class="sr">새 행사 이름</span><input id="cdNewEv" maxlength="40" placeholder="내 행사 더 넣기 (예: 고객사 방문 11월)"><button type="button" class="cd-mini" data-cd="ev-new">추가</button></label>`}
  else if(CD.sheet==="xlsx"){const L=CD.list.filter(c=>cdPass(c)),ev=cdEv(),A=CD.list.filter(c=>!ev||c.event===ev);
    const filt=[CD.f!=="all"?CD_T[CD.f][0]:"",CD.todo?"연락 전":"",CD.q?`"${CD.q}"`:""].filter(Boolean).join(" · ");
    inner=`<h3>${cdSvg('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>',18)}엑셀로 내려받기</h3><p class="cd-dim">.xlsx 파일 · 한 줄에 한 명</p>
      <div class="cd-scope" role="radiogroup" aria-label="내려받을 범위">${[["view","지금 보이는 목록",`${L.length}명 · ${filt||"거르기 없음"}`],["all",`${ev||"전체 행사"} 전체`,`${A.length}명 · 내가 볼 수 있는 것 모두`]].map(([k,t,s])=>`<button type="button" role="radio" aria-checked="${CD.sc===k}" class="${CD.sc===k?"on":""}" data-cdsc="${k}"><i></i><span><b>${t}</b><small>${esc(s)}</small></span></button>`).join("")}</div>
      <p class="cd-dim sm">들어가는 칸(이 순서로): 회사 · 이름 · 휴대폰 · 이메일 · 구분 · 받은 날 · 연락 여부 · 받은 사람 · 직함 · 메모 · 행사</p>
      <button type="button" class="cd-cta" data-cd="xlsx-go">${cdSvg(CD_I.dl,20)}${CD.sc==="all"?A.length:L.length}명 엑셀로 받기</button>`}
  else if(CD.sheet.startsWith("big:")){const path=CD.sheet.slice(4);box.innerHTML=`<div class="cd-big" data-cd="sheet-x"><img data-cdimg="${esc(path)}" alt="명함 사진 크게"><button type="button" class="cd-ib" data-cd="sheet-x" aria-label="닫기">${cdSvg(CD_I.x,22)}</button></div>`;return}
  box.innerHTML=`<div class="cd-shw"><button type="button" class="cd-shbg" data-cd="sheet-x" aria-label="닫기"></button><section class="cd-sh" role="dialog"><span class="cd-grab" aria-hidden="true"></span>${inner}</section></div>`}

/* ===== PC ===== */
function cdShellPc(){return `<header class="cd-pch"><button type="button" class="cd-logo-b" data-cd="close" aria-label="rhy:se로 돌아가기">${cdLogo()}</button><span class="cd-vl"></span><h1>명함 정리</h1><span class="cd-dim">${cdScope()} · PC에서는 찍지 않고, 휴대폰으로 모인 명함을 정리해요</span><span class="cd-sp"></span>
    <label class="cd-find pc">${cdSvg(CD_I.find)}<span class="sr">이름, 회사, 메모로 찾기</span><input type="search" id="cdQ" placeholder="이름 · 회사 · 메모로 찾기" value="${esc(CD.q)}" autocomplete="off"></label>
    <button type="button" class="cd-btn pri" data-cd="xlsx-pc" id="cdDl"></button><button type="button" class="cd-ib bd" data-cd="close" aria-label="닫기">${cdSvg(CD_I.x,20)}</button></header>
  <div class="cd-pw"><nav class="cd-nav" id="cdNav" aria-label="거르기"></nav><main class="cd-main" id="cdMain"></main><aside class="cd-side" id="cdSide" aria-label="명함 상세"></aside></div><div id="cdSheet"></div>`}
function cdPaintPc(){const L=cdSorted(CD.list.filter(c=>cdPass(c))),ev=cdEv(),E=cdEvents(),sel=Object.keys(CD.sel).filter(id=>L.some(c=>c.id===id)),selN=sel.length;
  const nb=(on,attr,l,n,dot)=>`<button type="button" class="${on?"on":""}" ${attr} aria-pressed="${on}">${dot?`<i style="background:${dot}"></i>`:""}<span>${esc(l)}</span><small>${n}</small></button>`;
  const TM=[...new Set(CD.list.map(c=>c.team_id))].sort((a,b)=>String(typeof teamName==="function"?teamName(a):a).localeCompare(String(typeof teamName==="function"?teamName(b):b),"ko"));
  const by=[...new Map(CD.list.filter(c=>CD.fTm==="all"||c.team_id===CD.fTm).map(c=>[c.owner_email,c.owner_name])).entries()].sort((a,b)=>(a[1]||"").localeCompare(b[1]||"","ko"));
  $("cdNav").innerHTML=`<section><span>행사</span>${nb(!ev,'data-cdev=""',"전체 행사",CD.list.length)}${E.map(e=>nb(ev===e,`data-cdev="${esc(e)}"`,e,CD.list.filter(c=>c.event===e).length)).join("")}</section>
    <section><span>구분</span>${[["all","전체","#F4F7F6"],...CD_ORD.map(k=>[k,CD_T[k][0],CD_T[k][1]])].map(([k,l,dot])=>nb(CD.f===k,`data-cdf="${k}"`,l,CD.list.filter(c=>cdPass(c,"t")&&(k==="all"||c.tag===k)).length,dot)).join("")}</section>
    <section><span>후속 연락</span>${[["all","전체","#F4F7F6"],["todo","연락 전","#F2A170"],["done","연락함","#6FD3AE"]].map(([k,l,dot])=>nb(CD.fD===k&&!CD.todo||k==="todo"&&CD.todo,`data-cdfd="${k}"`,l,CD.list.filter(c=>cdPass(c,"d")&&(k==="all"||(k==="done")===!!c.done)).length,dot)).join("")}</section>
    ${TM.length>1?`<section><span>팀</span>${nb(CD.fTm==="all",'data-cdftm="all"',"모든 팀",CD.list.filter(c=>cdPass(c,"m")).length)}${TM.map(t=>nb(CD.fTm===t,`data-cdftm="${esc(t)}"`,typeof teamName==="function"?teamName(t):t,CD.list.filter(c=>cdPass(c,"m")&&c.team_id===t).length)).join("")}</section>`:""}
    <section><span>받은 사람</span>${nb(CD.fB==="all",'data-cdfb="all"',"모두",CD.list.filter(c=>cdPass(c,"b")).length)}${by.map(([e,n])=>nb(CD.fB===e,`data-cdfb="${esc(e)}"`,n||e,CD.list.filter(c=>cdPass(c,"b")&&c.owner_email===e).length)).join("")}</section>`;
  const A=CD.list.filter(c=>!ev||c.event===ev),un=A.filter(c=>!c.checked).length;
  const stat=(l,v,cl)=>`<div class="cd-stat ${cl||""}"><span>${l}</span><b>${v}</b></div>`;
  const arrow=k=>CD.sort===k?(CD.dir>0?"▲":"▼"):"";
  const allOn=L.length>0&&L.every(c=>CD.sel[c.id]),multiTm=TM.length>1;
  $("cdMain").innerHTML=`${cdBanner()}<div class="cd-stats">${stat("모은 명함",A.length)}${stat("유망",A.filter(c=>c.tag==="hot").length,"hot")}${stat("연락 전",A.filter(c=>!c.done).length,"todo")}${stat("연락함",A.filter(c=>c.done).length,"ok")}</div>
    <div class="cd-tool">${selN?`<div class="cd-bulk"><b>${selN}명 골랐어요</b><span class="cd-dim">구분 바꾸기</span>${CD_ORD.map(k=>`<button type="button" class="cd-bt t-${k}" data-cdbulk="${k}"><i></i>${CD_T[k][0]}</button>`).join("")}<button type="button" class="cd-btn pri sm" data-cd="bulk-done">연락함으로 표시</button><button type="button" class="cd-tb" data-cd="sel-clear">고르기 풀기</button></div>`
      :`<span class="cd-dim">${L.length}명${un?` · 확인 전 ${un}장`:""} · 줄 앞 칸을 골라 구분 바꾸기 · 연락함 표시를 한 번에 할 수 있어요</span>`}</div>
    <div class="cd-sorts" role="group" aria-label="정렬"><span>정렬</span>${[["c","회사순"],["n","이름순"],["t","구분순"],["d","받은 날짜순"],["done","연락 여부순"]].map(([k,l])=>`<button type="button" class="${CD.sort===k?"on":""}" data-cdsort="${k}" aria-pressed="${CD.sort===k}">${l}<small>${arrow(k)}</small></button>`).join("")}<em>같은 단추를 한 번 더 누르면 거꾸로</em></div>
    <div class="cd-tw"><table class="cd-tbl"><thead><tr><th class="ck"><button type="button" class="cd-ck${allOn?" on":""}" data-cd="sel-all" aria-label="모두 고르기">${allOn?cdSvg(CD_I.chk,12):""}</button></th>
      ${[["c","회사"],["n","이름"],["ph","연락처"],["em","이메일"],["t","구분"],["d","받은 날짜"],["done","연락 여부"]].map(([k,l])=>`<th><button type="button" class="${CD.sort===k?"on":""}" data-cdsort="${k}">${l}<small>${arrow(k)}</small></button></th>`).join("")}</tr></thead>
      <tbody>${L.map(c=>{const on=!!CD.sel[c.id],t=CD_T[c.tag]||CD_T.mid;return `<tr class="${c.id===CD.cur?"cur":""}${on?" sel":""}"><td class="ck"><button type="button" class="cd-ck${on?" on":""}" data-cdsel="${esc(c.id)}" aria-label="${esc(c.name)} 고르기" aria-pressed="${on}">${on?cdSvg(CD_I.chk,12):""}</button></td>
        <td class="co">${esc(c.company||"—")}</td><td><button type="button" class="cd-nm" data-cdpick="${esc(c.id)}">${esc(c.name||(CD.reading[c.id]?"읽는 중…":"(이름 없음)"))}</button>${c.checked?"":`<span class="cd-uncb">확인 전</span>`}${cdShared(c)?'<span class="cd-shb">🔒 공유받음</span>':""}<small>${esc(c.title||"")}</small></td>
        <td class="num">${esc(c.phone||"—")}</td><td>${esc(c.email||"—")}</td><td><span class="cd-tag t-${c.tag}">${t[0]}</span></td><td class="dt">${cdD(c.created_at)}<small>${esc(c.owner_name)} 받음${multiTm&&typeof teamName==="function"?` · ${esc(teamName(c.team_id))}`:""}</small></td>
        <td><span class="cd-st ${c.done?"ok":"todo"}"><i></i>${c.done?"연락함":"연락 전"}</span></td></tr>`}).join("")}</tbody></table>
      ${CD.loaded&&!L.length?`<div class="cd-empty">${CD.list.length?"맞는 명함이 없어요":"아직 모은 명함이 없어요. 휴대폰에서 📇 명함 → 명함 찍기로 모아 주세요."}</div>`:""}</div>
    <p class="cd-dim sm">이름을 누르면 오른쪽에서 고칠 수 있어요. 칸 이름이나 위 정렬 단추로 정렬하고, 엑셀도 이 순서 그대로 나가요.</p>`;
  $("cdDl").innerHTML=`${cdSvg(CD_I.dl)}${selN?`고른 ${selN}명 엑셀로`:`${L.length}명 엑셀로`}`;
  cdPaintSide()}
function cdPaintSide(){const box=$("cdSide");if(!box)return;const c=cdById(CD.cur);
  if(!c){box.innerHTML=`<div class="cd-empty sm">표에서 이름을 누르면<br>명함 사진을 보며 여기서 고칠 수 있어요</div>`;return}
  const F=[["company","회사"],["name","이름"],["title","직함"],["phone","휴대폰"],["email","이메일"]],ro=!cdCanEdit(c);
  box.innerHTML=`<div class="cd-sdh"><span>명함 상세</span><small>받은 사람 ${esc(c.owner_name)} · ${cdD(c.created_at)}</small></div>
    ${c.img?`<button type="button" class="cd-photo" data-cdbig="${esc(c.img)}" aria-label="사진 크게 보기"><img data-cdimg="${esc(c.img)}" alt="명함 사진"></button>`:`<div class="cd-photo ph">사진 없음</div>`}
    <section class="cd-fields">${F.map(([k,l])=>`<label><span>${l}</span><input data-cdfld="${k}" value="${esc(c[k]||"")}" maxlength="200"></label>`).join("")}</section>
    <div class="cd-tags sm" role="group" aria-label="구분">${CD_ORD.map(k=>`<button type="button" class="t-${k}${c.tag===k?" on":""}" data-cdtag="${k}" data-id="${esc(c.id)}" aria-pressed="${c.tag===k}"><i></i>${CD_T[k][0]}</button>`).join("")}</div>
    <label class="cd-memoin"><span class="cd-lb">메모</span><textarea data-cdfld="memo" rows="3" maxlength="500">${esc(c.memo||"")}</textarea></label>
    ${cdEvField(c)}
    <button type="button" class="cd-done box${c.done?" on":""}" data-cddone="${esc(c.id)}" aria-pressed="${!!c.done}"><i>${c.done?cdSvg(CD_I.chk,14):""}</i><span><b>${c.done?"연락함":"아직 연락 전"}</b><small>${c.done?`${cdDay(c.done_at)} · ${esc(c.done_by)}이 체크`:"연락했으면 눌러서 체크하세요"}</small></span></button>
    ${cdCmHtml(c)}
    <div class="cd-sbtn">${ro?`<span class="cd-dim grow">보기만 할 수 있어요</span>`:`<button type="button" class="cd-btn pri grow" data-cd="side-save">${c.checked?"저장":"확인하고 저장"}</button>`}<button type="button" class="cd-btn" data-cdvcf="${esc(c.id)}">연락처 파일</button></div>
    ${cdCanDel(c)?`<button type="button" class="cd-del${CD.arm===c.id?" arm":""}" data-cddel="${esc(c.id)}">${cdSvg(CD_I.trash,15)}${CD.arm===c.id?"정말 지울까요? 한 번 더 누르세요":"이 명함 지우기"}</button>`:""}`;
  if(ro)box.querySelectorAll("input,textarea,[data-cdtag],[data-cddone],[data-cdevpick]").forEach(x=>{x.disabled=true})}

/* ---------- 사진 ---------- */
async function cdImgs(){const p=$("cardPage");if(!p)return;for(const im of p.querySelectorAll("img[data-cdimg]")){const k=im.dataset.cdimg;if(CD.imgs[k]){if(im.src!==CD.imgs[k])im.src=CD.imgs[k];continue}
  if(CD.imgs[k]===null)continue;CD.imgs[k]=null;api.cardImgUrl(k).then(u=>{CD.imgs[k]=u||"";p.querySelectorAll(`img[data-cdimg="${CSS.escape(k)}"]`).forEach(x=>{x.src=u})}).catch(()=>{CD.imgs[k]=""})}}
function cdShrink(file){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const k=Math.min(1,1600/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement("canvas");c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);
  const g=c.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?ok(b):no(new Error("toBlob")),"image/jpeg",.85)};im.onerror=()=>{URL.revokeObjectURL(u);no(new Error("img"))};im.src=u})}
const cdB64=b=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(",")[1]||"");r.onerror=no;r.readAsDataURL(b)});
async function cdShot(file,ready){const id="cd"+newId(),path=`${st.me.team_id}/${id}.jpg`;let blob;
  try{blob=ready?file:await cdShrink(file)}catch(_){toast("사진을 읽지 못했어요");return}
  CD.imgs[path]=URL.createObjectURL(blob);CD.readErr="";
  const row={id,team_id:st.me.team_id,owner_email:cdMe(),owner_name:st.me.name,event:cdEv(),company:"",name:"",title:"",phone:"",email:"",tag:"mid",memo:"",done:false,checked:false,img:path,created_at:new Date().toISOString(),_local:1,_sess:1};
  CD.list.unshift(row);CD.reading[id]=1;cdRender();
  // 명함 줄을 먼저 만들고 → 사진 올리기 (사진 읽기 권한이 '그 명함을 볼 수 있는 사람'이라서)
  try{await api.cardAdd({id,team_id:row.team_id,owner_email:row.owner_email,owner_name:row.owner_name,event:row.event,img:path,tag:"mid",checked:false});delete row._local}
  catch(x){delete CD.reading[id];CD.list=CD.list.filter(c=>c!==row);CD.readErr="저장하지 못했어요: "+((x&&x.hint)||(x&&x.message)||errText(x));cdRender();return}
  try{await api.cardImgUp(path,blob)}catch(x){CD.readErr=(x&&x.hint)||("사진을 올리지 못했어요: "+((x&&x.message)||errText(x)))}
  try{const r=await api.cardRead(await cdB64(blob));const patch={};["company","name","title","phone","email"].forEach(k=>{if(r&&r[k])patch[k]=r[k]});
    if(Object.keys(patch).length){await api.cardSet(id,patch);Object.assign(row,patch)}CD.readMsg=patch.name||patch.company?`${[patch.name,patch.company].filter(Boolean).join(" · ")} 읽었어요`:"글자를 찾지 못했어요. 확인할 때 직접 채워 주세요"}
  catch(x){if(!CD.readErr)CD.readErr=(x&&x.message&&/[가-힣]/.test(x.message)?x.message:"AI가 명함을 읽지 못했어요"+(x&&x.message?` (${x.message})`:"")+". 확인할 때 직접 채워 주세요")}
  finally{delete CD.reading[id];cdLater()}}

/* ---------- 저장 ---------- */
function cdFormVals(root){const o={};root.querySelectorAll("[data-cdfld]").forEach(x=>{o[x.dataset.cdfld]=x.value.trim()});return o}
async function cdPatch(id,patch,msg){const c=cdById(id);if(!c)return;try{await api.cardSet(id,patch);Object.assign(c,patch);if(patch.done===true){c.done_by=st.me.name;c.done_at=new Date().toISOString()}if(msg)toast(msg)}catch(x){toast((x&&x.hint)||errText(x))}cdRender()}
async function cdDelete(id){const c=cdById(id);if(!c)return;try{await api.cardDel(id);if(c.img)api.cardImgDel(c.img).catch(()=>{});CD.list=CD.list.filter(x=>x!==c);delete CD.sel[id];if(CD.cur===id)CD.cur=null;CD.arm="";toast("명함을 지웠어요");
  if(CD.scr==="detail"||CD.edit){CD.edit=null;CD.scr="list";CD.shell=""}}catch(x){toast((x&&x.hint)||errText(x))}cdRender()}
function cdVcf(c){const L=["BEGIN:VCARD","VERSION:3.0",`N:${c.name||""};;;;`,`FN:${c.name||c.company||"명함"}`,c.company?`ORG:${c.company}`:"",c.title?`TITLE:${c.title}`:"",c.phone?`TEL;TYPE=CELL:${c.phone}`:"",c.email?`EMAIL:${c.email}`:"",c.memo?`NOTE:${c.memo.replace(/\n/g," ")}`:"","END:VCARD"].filter(Boolean);
  cdSave(new Blob([L.join("\r\n")],{type:"text/vcard"}),`${c.name||"명함"}.vcf`)}
function cdSave(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}

/* ---------- 엑셀(.xlsx): 압축 없이 묶는 작은 zip ---------- */
const CD_CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function cdCrc(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CD_CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function cdZip(files){const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  for(const [name,text] of files){const nb=enc.encode(name),db=enc.encode(text),crc=cdCrc(db),h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint32(14,crc,true);h.setUint32(18,db.length,true);h.setUint32(22,db.length,true);h.setUint16(26,nb.length,true);
    parts.push(new Uint8Array(h.buffer),nb,db);
    const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint32(16,crc,true);c.setUint32(20,db.length,true);c.setUint32(24,db.length,true);c.setUint16(28,nb.length,true);c.setUint32(42,off,true);
    cen.push(new Uint8Array(c.buffer),nb);off+=30+nb.length+db.length}
  const cs=cen.reduce((a,b)=>a+b.length,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cen,new Uint8Array(e.buffer)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})}
function cdXlsx(L,fname){const x=s=>String(s==null?"":s).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"");
  const H=["회사","이름","휴대폰","이메일","구분","받은 날","연락 여부","받은 사람","직함","메모","행사"],W=[18,10,15,24,7,12,9,10,16,34,14];
  const col=i=>String.fromCharCode(65+i),cell=(r,i,v,s)=>`<c r="${col(i)}${r}" t="inlineStr"${s?` s="${s}"`:""}><is><t xml:space="preserve">${x(v)}</t></is></c>`;
  const rows=[`<row r="1">${H.map((h,i)=>cell(1,i,h,1)).join("")}</row>`].concat(L.map((c,j)=>{const r=j+2,v=[c.company,c.name,c.phone,c.email,(CD_T[c.tag]||CD_T.mid)[0],cdD(c.created_at),c.done?"연락함":"연락 전",c.owner_name,c.title,c.memo,c.event];return `<row r="${r}">${v.map((s,i)=>cell(r,i,s)).join("")}</row>`}));
  const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${W.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join("")}</cols><sheetData>${rows.join("")}</sheetData><autoFilter ref="A1:${col(H.length-1)}${L.length+1}"/></worksheet>`;
  const files=[["[Content_Types].xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
    ["_rels/.rels",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ["xl/workbook.xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="명함" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'명함'!$A$1:$${col(H.length-1)}$${L.length+1}</definedName></definedNames></workbook>`],
    ["xl/_rels/workbook.xml.rels",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ["xl/styles.xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="맑은 고딕"/></font><font><b/><sz val="11"/><name val="맑은 고딕"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDDF3EC"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`],
    ["xl/worksheets/sheet1.xml",sheet]];
  cdSave(cdZip(files),fname);toast(`📇 ${L.length}명을 엑셀로 받았어요`)}
const cdFname=()=>{const d=new Date(),ev=cdEv();return `명함_${ev?ev.replace(/[\\/:*?"<>|]/g,"")+"_":""}${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}.xlsx`};

/* ---------- 누르기 ---------- */
function cdBind(p){
  p.addEventListener("click",async e=>{const t=e.target.closest("button,a,[data-cd]");if(!t||!p.contains(t))return;const d=t.dataset;
    if(d.cd){const a=d.cd;
      if(a==="close"){cdClose();return}
      if(a==="list"){CD.scr="list";CD.edit=null;CD.ftag="";CD.readMsg="";CD.readErr="";CD.list.forEach(c=>delete c._sess);cdRender();return}
      if(a==="capture"){CD.scr="capture";CD.readMsg="";CD.readErr="";if(CD.cam==="no")CD.cam="";cdRender();return}
      if(a==="snap"){cdSnap();return}
      if(a==="confirm"){if(!cdUnchecked().length&&CD.scr==="capture")return;CD.scr="confirm";CD.edit=null;CD.ci=0;CD.ftag="";cdRender();return}
      if(a==="todo"){CD.todo=!CD.todo;cdRender();return}
      if(a==="ev-sheet"){CD.sheet="ev";cdPaintSheet();return}
      if(a==="xlsx-sheet"){CD.sheet="xlsx";cdPaintSheet();return}
      if(a==="sheet-x"){if(e.target.closest(".cd-big img"))return;CD.sheet="";cdPaintSheet();return}
      if(a==="ev-new"){const v=($("cdNewEv").value||"").trim();if(!v){$("cdNewEv").focus();return}await cdMyEvAdd(v);cdEvSet(v);CD.sheet="";toast(`🏁 '${v}' 행사를 내 목록에 넣고, 이 행사로 모아요`);cdRender();return}
      if(a==="xlsx-go"){const ev=cdEv(),L=CD.sc==="all"?CD.list.filter(c=>!ev||c.event===ev):CD.list.filter(c=>cdPass(c));cdXlsx(cdSorted(L),cdFname());CD.sheet="";cdPaintSheet();return}
      if(a==="xlsx-pc"){const L=cdSorted(CD.list.filter(c=>cdPass(c))),S=L.filter(c=>CD.sel[c.id]);cdXlsx(S.length?S:L,cdFname());return}
      if(a==="conf-skip"){if(CD.edit){CD.edit=null;CD.scr="detail";cdRender();return}CD.ci++;CD.ftag="";cdRender();return}
      if(a==="conf-save"){const c=cdFormCard();if(!c)return;const v=cdFormVals($("cdConf"));v.tag=CD.ftag||c.tag;v.checked=true;t.disabled=true;
        try{await api.cardSet(c.id,v);Object.assign(c,v);if(v.event)cdMyEvAdd(v.event);CD.ftag="";if(CD.edit){CD.edit=null;CD.scr="detail";toast("고쳤어요")}else{toast(`${v.name||"명함"} 저장했어요`)}}catch(x){toast((x&&x.hint)||errText(x));t.disabled=false;return}
        cdRender();return}
      if(a==="edit"){CD.edit=CD.cur;CD.ftag="";CD.scr="confirm";cdRender();return}
      if(a==="side-save"){const c=cdById(CD.cur);if(!c)return;const v=cdFormVals($("cdSide"));v.checked=true;if(v.event)cdMyEvAdd(v.event);await cdPatch(c.id,v,"저장했어요");return}
      if(a==="sel-all"){const L=CD.list.filter(c=>cdPass(c)),all=L.length&&L.every(c=>CD.sel[c.id]);CD.sel={};if(!all)L.forEach(c=>CD.sel[c.id]=1);cdRender();return}
      if(a==="sel-clear"){CD.sel={};cdRender();return}
      if(a==="bulk-done"){const ids=Object.keys(CD.sel);for(const id of ids){try{await api.cardSet(id,{done:true});const c=cdById(id);if(c&&!c.done){c.done=true;c.done_by=st.me.name;c.done_at=new Date().toISOString()}}catch(_){}}CD.sel={};toast(`${ids.length}명을 연락함으로 표시했어요`);cdRender();return}
      return}
    if(d.cdf){CD.f=d.cdf;cdRender();return}
    if(d.cdv){CD.v=d.cdv;cdRender();return}
    if(d.cdfd){if(d.cdfd==="todo"){CD.todo=true;CD.fD="all"}else{CD.todo=false;CD.fD=d.cdfd}CD.sel={};cdRender();return}
    if(d.cdfb){CD.fB=d.cdfb;CD.sel={};cdRender();return}
    if(d.cdftm){CD.fTm=d.cdftm;CD.fB="all";CD.sel={};cdRender();return}
    if(d.cdevdel!==undefined){try{await cdMyEvSave(cdMyEvents().filter(e=>e!==d.cdevdel));if(cdEv()===d.cdevdel)cdEvSet("");toast("내 행사 목록에서 뺐어요 (이미 찍은 명함은 그대로)")}catch(x){toast(errText(x))}cdPaintSheet();return}
    if(d.cdev!==undefined){cdEvSet(d.cdev);CD.sheet="";CD.sel={};cdRender();return}
    if(d.cdsc){CD.sc=d.cdsc;cdPaintSheet();return}
    if(d.cdsort){const k=d.cdsort;CD.dir=CD.sort===k?-CD.dir:(k==="d"?-1:1);CD.sort=k;cdRender();return}
    if(d.cdsel){if(CD.sel[d.cdsel])delete CD.sel[d.cdsel];else CD.sel[d.cdsel]=1;cdRender();return}
    if(d.cdpick){CD.cur=d.cdpick;CD.arm="";cdRender();return}
    if(d.cdopen){CD.cur=d.cdopen;const c=cdById(d.cdopen);if(c&&!c.checked&&c.owner_email===cdMe()){CD.scr="confirm";CD.edit=null;CD.ci=Math.max(0,cdUnchecked().indexOf(c))}else CD.scr="detail";CD.arm="";cdRender();return}
    if(d.cdevpick!==undefined){const f=t.closest(".cd-evf"),inp=f&&f.querySelector('[data-cdfld="event"]');if(inp){inp.value=d.cdevpick;CD.dirty=true;f.querySelectorAll("[data-cdevpick]").forEach(b=>b.classList.toggle("on",b===t&&!!d.cdevpick))}return}
    if(d.cdcmadd){const ta=$("cardPage").querySelector(`[data-cdcmin="${CSS.escape(d.cdcmadd)}"]`),body=(ta&&ta.value||"").trim();if(!body){ta&&ta.focus();return}t.disabled=true;
      try{await api.execCommentAdd({id:"x"+newId(),kind:"cards",target_id:d.cdcmadd,owner_email:(cdById(d.cdcmadd)||{}).owner_email,author_email:cdMe(),author_name:st.me.name,body});CD.cm[d.cdcmadd]=await api.execComments("cards",[d.cdcmadd]);toast("코멘트를 남겼어요")}catch(x){toast((x&&x.hint)||errText(x))}cdRender();return}
    if(d.cdcmdel){try{await api.execCommentDel(d.cdcmdel);CD.cm[d.id]=(CD.cm[d.id]||[]).filter(m=>m.id!==d.cdcmdel)}catch(x){toast(errText(x))}cdRender();return}
    if(d.cdftag){CD.ftag=d.cdftag;$("cdConf").querySelectorAll("[data-cdftag]").forEach(b=>{const on=b.dataset.cdftag===CD.ftag;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});return}
    if(d.cdtag){cdPatch(d.id,{tag:d.cdtag});return}
    if(d.cddone){const c=cdById(d.cddone);if(c)cdPatch(c.id,{done:!c.done},c.done?"연락 전으로 돌렸어요":"연락함으로 표시했어요");return}
    if(d.cdvcf){const c=cdById(d.cdvcf);if(c)cdVcf(c);return}
    if(d.cdbig){CD.sheet="big:"+d.cdbig;cdPaintSheet();cdImgs();return}
    if(d.cdbulk){const ids=Object.keys(CD.sel);for(const id of ids){try{await api.cardSet(id,{tag:d.cdbulk});const c=cdById(id);if(c)c.tag=d.cdbulk}catch(_){}}CD.sel={};toast(`${ids.length}명을 '${CD_T[d.cdbulk][0]}'(으)로 바꿨어요`);cdRender();return}
    if(d.cddel){if(CD.arm!==d.cddel){CD.arm=d.cddel;cdRender();setTimeout(()=>{if(CD.arm===d.cddel){CD.arm="";cdRender()}},3500);return}cdDelete(d.cddel);return}
  });
  p.addEventListener("change",e=>{const x=e.target;if(x.dataset&&x.dataset.cdshot){const fs=[...(x.files||[])];x.value="";fs.slice(0,10).forEach(f=>cdShot(f))}});
  p.addEventListener("input",e=>{const x=e.target;if(x.id==="cdQ"&&!e.isComposing){CD.q=x.value;if(cdMob())cdPaintListBody();else cdPaintPc()}if(x.dataset&&x.dataset.cdfld)CD.dirty=true});
  p.addEventListener("compositionend",e=>{const x=e.target;if(x.id==="cdQ"){CD.q=x.value;if(cdMob())cdPaintListBody();else cdPaintPc()}});
  p.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="cdNewEv"&&!e.isComposing){e.preventDefault();p.querySelector('[data-cd="ev-new"]').click()}});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)cdCamStop();else if(CD.scr==="capture"&&$("cardPage")&&!$("cardPage").hidden){CD.cam="";cdCamStart()}});
  let mw=cdMob();addEventListener("resize",()=>{const m=cdMob();if(m!==mw){mw=m;CD.shell="";if(!m&&CD.scr!=="list")CD.scr="list";cdRender()}});
}
