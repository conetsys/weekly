/* =====================================================================
   🔒 대표 · 임원 '보는 자리' (v3.31.0 · SQL 26 · 11/15 결정)
   - 임원 = 관리자가 ⚙ 관리 → 사람에서 켬 (대표는 저절로)
   - 임원이 쓴 업무 · 명함은 기본 본인만 → 내정보 → 🔒 내 공유 대상 (업무 · 명함 따로)에서 고른 사람만 봄
   - 공유받은 사람: 내정보 → 👁 공유받은 업무 (보기 + 💬 코멘트). 명함은 📇 명함에 '공유받음'으로 섞여 보이고 상세에서 코멘트
   - 팀 화면 · 팀 보고서에서는 임원 업무를 뺌 (core load 의 F("execHide"))
   - 팀 고르기에 '대표이사 · 회사 전체' · '○○ · 전체'(내가 조직장인 조직) → 팀별 요약 화면 (보기 전용, 사람별 순위 없음)
   이 파일이 고장 나면: 공유 화면만 꺼지고 서버 규칙(본인 · 대표 · 관리자 · 공유 대상만)은 그대로
   ===================================================================== */
const EX={execs:null,shares:null,toMe:[],cm:[],units:null,seenKey:()=>"wk-exc-seen:"+(st.me&&st.me.email)};
const exIsMe=()=>!!(st.me&&(st.me.is_exec||(typeof isCeo==="function"&&isCeo())));
const exLow=e=>String(e||"").toLowerCase();
function execHide(){if(!EX.execs)return null;const S=new Set(EX.execs.map(exLow));try{if(CO&&CO.ceo&&CO.ceo.email)S.add(exLow(CO.ceo.email))}catch(_){}S.delete(exLow(st.me&&st.me.email));return S.size?S:null}
const exIsExecEmail=e=>{const h=execHide();return !!(h&&h.has(exLow(e)))||(exIsMe()&&exLow(e)===exLow(st.me.email))};
let exBoot=false;
async function exLoad(){if(!st.me)return;try{const L=await api.execList();EX.execs=L||[]}catch(_){EX.execs=[]}
  {const h=execHide();if(h&&(st.items||[]).some(i=>i._email!==st.me.email&&h.has(exLow(i._email))))try{refresh()}catch(_){}}   // 처음 불러온 표에 임원 업무가 섞였으면 다시
  try{EX.toMe=await api.execSharedToMe()}catch(_){EX.toMe=[]}
  if(exIsMe()){try{EX.shares=await api.execShares()}catch(_){EX.shares=null}try{EX.cm=await api.execCommentsMine()}catch(_){EX.cm=[]}}
  execPaint();try{F("alertPaint")}catch(_){}}
function exSeen(){try{return JSON.parse(localStorage.getItem(EX.seenKey())||"{}")}catch(_){return {}}}
function exSeenSet(k,v){const S=exSeen();S[k]=v;try{localStorage.setItem(EX.seenKey(),JSON.stringify(S))}catch(_){}}
const exNew=()=>{const S=exSeen();return (EX.cm||[]).filter(c=>c.created_at>(S.c||""))};

/* ---------- 메뉴 · 배너 ---------- */
function execPaint(){if(!st.me)return;if(!exBoot){exBoot=true;exLoad();return}
  const a=$("miExShare"),b=$("miExSeen");if(a)a.hidden=!exIsMe();
  const seeAll=typeof isCeo==="function"&&isCeo();if(b){b.hidden=!(EX.toMe.length||seeAll);b.textContent=seeAll?"👁 임원 업무 보기":`👁 공유받은 업무${EX.toMe.length?` (${EX.toMe.length})`:""}`}
  let bn=$("exBan");const sm=$("summary");
  if(!exIsMe()||!sm||st.view!=="write"||!isMyTeam(st.team)){if(bn)bn.hidden=true;return}
  if(!bn){bn=document.createElement("div");bn.id="exBan";bn.className="ex-ban";sm.insertAdjacentElement("afterend",bn)}
  const who=(EX.shares||[]).filter(s=>s.kind==="items").map(s=>exName(s.viewer_email));
  bn.hidden=false;bn.innerHTML=`<span>🔒 <b>내 업무는 나만 봐요</b> <span class="dim">· 팀 화면 · 팀 보고서에 나오지 않아요</span></span><span class="ex-who">볼 수 있는 사람: ${who.length?esc(who.join(", ")):"나"}${typeof isCeo==="function"&&isCeo()?"":" · 대표"}</span><button type="button" class="btn sm ghost" data-exopen="share">공유 대상 바꾸기</button>`}
const exPeople=()=>EX.people||[];
const exName=e=>{const p=exPeople().find(x=>exLow(x.email)===exLow(e))||(st.people||[]).find(x=>exLow(x.email)===exLow(e));return p?p.name:e};
async function exPeopleLoad(){if(EX.people)return EX.people;try{EX.people=await api.orgPeople()}catch(_){EX.people=[]}return EX.people}

/* ---------- 🔒 내 공유 대상 (업무 · 명함 따로) ---------- */
function exModal(html,cls){let m=$("exModal");if(!m){m=document.createElement("div");m.id="exModal";m.className="ex-modal";document.body.appendChild(m);exBind(m)}
  m.innerHTML=`<div class="ex-bg" data-exclose="1"></div><section class="ex-box ${cls||""}" role="dialog" aria-modal="true">${html}</section>`;m.hidden=false}
function exClose(){const m=$("exModal");if(m)m.hidden=true}
const EXS={kind:"items",sel:{items:[],cards:[]},q:"",busy:false};
async function exShareOpen(){await exPeopleLoad();try{EX.shares=await api.execShares()}catch(x){toast((x&&x.hint)||errText(x));return}
  EXS.sel={items:EX.shares.filter(s=>s.kind==="items").map(s=>s.viewer_email),cards:EX.shares.filter(s=>s.kind==="cards").map(s=>s.viewer_email)};EXS.q="";exSharePaint()}
function exSharePaint(){const k=EXS.kind,sel=EXS.sel[k],q=EXS.q.trim().toLowerCase();
  const P=exPeople().filter(p=>exLow(p.email)!==exLow(st.me.email));
  const hits=q?P.filter(p=>[p.name,p.email,p.title,teamName(p.team_id)].some(v=>String(v||"").toLowerCase().includes(q))).slice(0,8):[];
  exModal(`<div class="ex-h"><b>🔒 내 공유 대상</b><button type="button" class="ex-x" data-exclose="1" aria-label="닫기">✕</button></div>
    <p class="hint" style="margin:0 0 10px">임원 업무 · 명함은 기본으로 <b>나만</b> 봐요. 여기서 고른 사람은 <b>보기 + 💬 코멘트</b>만 할 수 있어요. 대표는 원래 다 볼 수 있어요.</p>
    <div class="ex-tabs" role="tablist">${[["items","📝 업무"],["cards","📇 명함"]].map(([v,l])=>`<button type="button" role="tab" aria-selected="${k===v}" class="${k===v?"on":""}" data-exkind="${v}">${l} <small>${EXS.sel[v].length}명</small></button>`).join("")}</div>
    <div class="ex-chips">${sel.length?sel.map(e=>`<span class="ex-chip">${esc(exName(e))}<button type="button" data-exdel="${esc(e)}" aria-label="${esc(exName(e))} 빼기">✕</button></span>`).join(""):`<span class="dim">아직 아무도 없어요 — 나만 봐요</span>`}</div>
    <label class="ex-find"><span class="sr">이름으로 찾기</span><input id="exQ" placeholder="이름 · 팀으로 찾아 넣기" value="${esc(EXS.q)}" autocomplete="off"></label>
    <div class="ex-hits" id="exHits">${hits.map(p=>`<button type="button" data-exadd="${esc(p.email)}"${sel.includes(p.email)?" disabled":""}><b>${esc(p.name)}</b><span>${esc([p.title,teamName(p.team_id)].filter(Boolean).join(" · "))}</span>${sel.includes(p.email)?"<em>넣음</em>":""}</button>`).join("")}</div>
    <div class="ex-ft"><span class="dim">업무와 명함은 따로 정해요. 저장하면 바로 적용돼요.</span><button type="button" class="btn primary" data-exsave="1"${EXS.busy?" disabled":""}>저장</button></div>`,"share");
  const i=$("exQ");if(i&&document.activeElement!==i&&EXS.q){i.focus();i.setSelectionRange(i.value.length,i.value.length)}}
async function exShareSave(){EXS.busy=true;exSharePaint();try{for(const k of ["items","cards"])await api.execShareSet(k,EXS.sel[k]);EX.shares=await api.execShares();toast("공유 대상을 저장했어요");exClose();execPaint()}catch(x){toast((x&&x.hint)||errText(x))}EXS.busy=false}

/* ---------- 👁 공유받은 업무 (보기 + 코멘트) ---------- */
const EXV={owner:null,items:[],cm:[],list:[]};
async function exSeenOpen(){const ceo=typeof isCeo==="function"&&isCeo();
  if(ceo){await exPeopleLoad();const S=new Set((EX.execs||[]).map(exLow));S.delete(exLow(st.me.email));EXV.list=[...S].map(e=>({owner_email:e,name:exName(e),kinds:["items","cards"]}))}
  else{try{EX.toMe=await api.execSharedToMe()}catch(_){}EXV.list=EX.toMe.filter(x=>x.kinds.includes("items"))}
  if(!EXV.list.length){exModal(`<div class="ex-h"><b>👁 ${ceo?"임원 업무":"공유받은 업무"}</b><button type="button" class="ex-x" data-exclose="1" aria-label="닫기">✕</button></div><p class="dim">${ceo?"임원으로 정한 사람이 아직 없어요 (⚙ 관리 → 사람)":"아직 업무를 공유한 임원이 없어요"}</p>`);return}
  await exSeenLoad(EXV.owner&&EXV.list.some(x=>x.owner_email===EXV.owner)?EXV.owner:EXV.list[0].owner_email)}
async function exSeenLoad(owner){EXV.owner=owner;try{EXV.items=await api.execItems(owner)}catch(x){EXV.items=[];toast((x&&x.hint)||errText(x))}
  try{EXV.cm=await api.execComments("items",EXV.items.map(i=>i.id))}catch(_){EXV.cm=[]}exSeenPaint()}
function exSeenPaint(){const W=st.week||CUR,N=nextKey(W),ceo=typeof isCeo==="function"&&isCeo();
  const row=r=>{const d=r.data||{},w=(d.weeks||{})[W],n=(d.weeks||{})[N],ks=Object.keys(d.weeks||{}).filter(k=>k<=W).sort(),lw=w||(ks.length?d.weeks[ks[ks.length-1]]:null);if(!lw&&!n)return "";
    const C=EXV.cm.filter(c=>c.target_id===r.id);
    return `<article class="ex-it"><div class="ex-it1"><b>${esc((lw&&lw.task)||(n&&n.task)||"(할일 없음)")}</b>${lw?`<span class="ex-st s-${esc(lw.status||"진행")}">${esc(w?(lw.status||"진행"):"지난 주")}</span>`:""}</div>
      <div class="ex-it2 dim">${esc([d.customer,d.project,d.category].filter(Boolean).join(" · "))}${lw&&lw.due?` · ~${esc(lw.due.slice(5).replace("-","/"))}`:""}</div>
      ${n&&n.task?`<div class="ex-it3"><span class="dim">다음 주</span> ${esc(n.task)}</div>`:""}${lw&&lw.memo?`<div class="ex-it3 dim">${esc(lw.memo)}</div>`:""}
      <div class="ex-cm">${C.map(c=>`<div class="ex-c${c.author_email===st.me.email?" me":""}"><b>${esc(c.author_name)}</b><span class="dim">${esc(fmtDT(c.created_at).slice(2))}</span>${c.author_email===st.me.email?`<button type="button" class="ex-cdel" data-excdel="${esc(c.id)}" aria-label="지우기">✕</button>`:""}<p>${esc(c.body)}</p></div>`).join("")}
        <div class="ex-cw"><textarea rows="1" maxlength="2000" data-excin="${esc(r.id)}" placeholder="💬 코멘트 (Ctrl+Enter 올리기)" aria-label="코멘트"></textarea><button type="button" class="btn sm" data-excadd="${esc(r.id)}">올리기</button></div></div></article>`};
  const body=EXV.items.map(row).filter(Boolean).join("");
  exModal(`<div class="ex-h"><b>👁 ${ceo?"임원 업무":"공유받은 업무"}</b><span class="dim">보기 + 💬 코멘트 · ${esc(String(W).slice(5).replace("-","/"))} 주</span><button type="button" class="ex-x" data-exclose="1" aria-label="닫기">✕</button></div>
    <div class="ex-ow">${EXV.list.map(x=>`<button type="button" class="${x.owner_email===EXV.owner?"on":""}" data-exowner="${esc(x.owner_email)}">${esc(x.name||x.owner_email)}${x.title?`<small>${esc(x.title)}</small>`:""}</button>`).join("")}</div>
    <div class="ex-list">${body||`<p class="dim">이번 주에 보이는 업무가 없어요</p>`}</div>`,"seen")}

/* ---------- 팀 고르기: 대표이사 · 회사 전체 / ○○ · 전체 ---------- */
async function exUnits(){if(EX.units)return EX.units;try{EX.units=await api.units()||[]}catch(_){EX.units=[]}return EX.units}
function execTeamOpts(){const U=EX.units;if(!U||!st.me)return "";const me=exLow(st.me.email),ceo=typeof isCeo==="function"&&isCeo();
  const kids=id=>U.filter(u=>(u.parent_id||null)===id),teamsUnder=u=>{const out=[];const walk=x=>{if(x.team_id)out.push(x.team_id);kids(x.id).forEach(walk)};walk(u);return out};
  const mine=U.filter(u=>!u.team_id&&exLow(u.head&&u.head.email)===me&&teamsUnder(u).length>1);
  const o=[];if(ceo)o.push(`<option value="unit:*">🏛 대표이사 · 회사 전체</option>`);
  (ceo?U.filter(u=>!u.team_id&&teamsUnder(u).length>1).sort((a,b)=>(a.sort||0)-(b.sort||0)):mine).forEach(u=>o.push(`<option value="unit:${esc(u.id)}">▦ ${esc(u.name)} · 전체</option>`));
  return o.join("")}
async function exUnitOpen(uid){const U=await exUnits(),kids=id=>U.filter(u=>(u.parent_id||null)===id).sort((a,b)=>(a.sort||0)-(b.sort||0));
  const root=uid==="*"?null:U.find(u=>u.id===uid);const groups=[];
  const walk=(x,path)=>{if(x.team_id)groups.push({team:x.team_id,name:x.name,path});kids(x.id).forEach(k=>walk(k,x.team_id?path:[...path,x.name]))};
  if(root)walk(root,[]);else kids(null).forEach(r=>walk(r,[]));
  const title=root?`${root.name} · 전체`:"대표이사 · 회사 전체";exModal(`<div class="ex-h"><b>${esc(title)}</b><span class="dim">불러오는 중…</span><button type="button" class="ex-x" data-exclose="1" aria-label="닫기">✕</button></div>`,"unit");
  let rows=[];try{rows=await api.unitItems(groups.map(g=>g.team))}catch(x){toast((x&&x.hint)||errText(x))}
  const hide=execHide(),W=st.week||CUR;rows=rows.filter(r=>!(hide&&hide.has(exLow(r.owner_email))));
  const nm=e=>exName(e);await exPeopleLoad();
  const html=groups.map(g=>{const R=rows.filter(r=>r.team_id===g.team).map(r=>({r,w:((r.data||{}).weeks||{})[W]})).filter(x=>x.w);const c=s=>R.filter(x=>(x.w.status||"진행")===s).length;
    return `<details class="ex-team"><summary><span class="ex-tn">${g.path.length?`<small>${esc(g.path.join(" › "))} ›</small> `:""}<b>${esc(g.name)}</b></span><span class="ex-cnt"><i class="s-진행">진행 ${c("진행")}</i><i class="s-완료">완료 ${c("완료")}</i><i class="s-대기">대기 ${c("대기")}</i></span></summary>
      <div class="ex-tl">${R.length?R.sort((a,b)=>nm(a.r.owner_email).localeCompare(nm(b.r.owner_email),"ko")).map(x=>`<div><span class="ex-tw">${esc(nm(x.r.owner_email))}</span><span class="ex-tt">${esc(x.w.task||"")}</span><span class="ex-st s-${esc(x.w.status||"진행")}">${esc(x.w.status||"진행")}</span></div>`).join(""):`<p class="dim">이번 주 업무가 없어요</p>`}</div></details>`}).join("");
  exModal(`<div class="ex-h"><b>${esc(title)}</b><span class="dim">${esc(String(W).slice(5).replace("-","/"))} 주 · 보기 전용 · 팀을 누르면 펼쳐져요</span><button type="button" class="ex-x" data-exclose="1" aria-label="닫기">✕</button></div><div class="ex-list">${html||`<p class="dim">조직도에 팀이 없어요</p>`}</div>`,"unit")}

/* ---------- 🔔 알림: 내 임원 업무 · 명함에 달린 코멘트 ---------- */
function execAlertCount(){return exIsMe()?exNew().length:0}
function execAlertsHtml(){if(!exIsMe())return "";const L=exNew();if(!L.length)return "";const last=L[0];
  return `<div class="walr k-share"><span class="wlv">💬</span><button type="button" class="wtx" data-exalr="1"><b>내 ${last.kind==="cards"?"명함":"업무"}에 코멘트${L.length>1?` ${L.length}개`:""}</b> · ${esc(last.author_name)}: ${esc(last.body.slice(0,60))}</button><span class="wact"><button type="button" class="btn sm" data-exalr="1">확인</button></span></div>`}

/* ---------- 누르기 ---------- */
function exBind(m){
  m.addEventListener("click",async e=>{const t=e.target.closest("[data-exclose],[data-exkind],[data-exadd],[data-exdel],[data-exsave],[data-exowner],[data-excadd],[data-excdel]");if(!t)return;const d=t.dataset;
    if(d.exclose){exClose();return}
    if(d.exkind){EXS.kind=d.exkind;EXS.q="";exSharePaint();return}
    if(d.exadd){const L=EXS.sel[EXS.kind];if(!L.includes(d.exadd))L.push(d.exadd);EXS.q="";exSharePaint();setTimeout(()=>$("exQ")&&$("exQ").focus(),20);return}
    if(d.exdel){EXS.sel[EXS.kind]=EXS.sel[EXS.kind].filter(x=>x!==d.exdel);exSharePaint();return}
    if(d.exsave){exShareSave();return}
    if(d.exowner){exSeenLoad(d.exowner);return}
    if(d.excadd){const ta=m.querySelector(`[data-excin="${CSS.escape(d.excadd)}"]`),body=(ta&&ta.value||"").trim();if(!body){ta&&ta.focus();return}t.disabled=true;
      try{await api.execCommentAdd({id:"x"+newId(),kind:"items",target_id:d.excadd,owner_email:EXV.owner,author_email:st.me.email,author_name:st.me.name,body});EXV.cm=await api.execComments("items",EXV.items.map(i=>i.id));exSeenPaint();toast("코멘트를 남겼어요")}catch(x){toast((x&&x.hint)||errText(x));t.disabled=false}return}
    if(d.excdel){try{await api.execCommentDel(d.excdel);EXV.cm=EXV.cm.filter(c=>c.id!==d.excdel);exSeenPaint()}catch(x){toast(errText(x))}return}});
  m.addEventListener("input",e=>{const x=e.target;if(x.id==="exQ"&&!e.isComposing){EXS.q=x.value;exHits()}if(x.dataset&&x.dataset.excin){x.style.height="auto";x.style.height=Math.min(x.scrollHeight,200)+"px"}});
  m.addEventListener("compositionend",e=>{if(e.target.id==="exQ"){EXS.q=e.target.value;exHits()}});
  m.addEventListener("keydown",e=>{const x=e.target;if(e.key==="Escape"){exClose();return}if(x.dataset&&x.dataset.excin&&e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();m.querySelector(`[data-excadd="${CSS.escape(x.dataset.excin)}"]`).click()}});
}
// 찾기 칸은 그대로 두고 결과만 다시 그림 (한글 조합 중 화면 바꾸지 않음)
function exHits(){const box=$("exHits");if(!box)return;const k=EXS.kind,sel=EXS.sel[k],q=EXS.q.trim().toLowerCase();
  const P=exPeople().filter(p=>exLow(p.email)!==exLow(st.me.email)),hits=q?P.filter(p=>[p.name,p.email,p.title,teamName(p.team_id)].some(v=>String(v||"").toLowerCase().includes(q))).slice(0,8):[];
  box.innerHTML=hits.map(p=>`<button type="button" data-exadd="${esc(p.email)}"${sel.includes(p.email)?" disabled":""}><b>${esc(p.name)}</b><span>${esc([p.title,teamName(p.team_id)].filter(Boolean).join(" · "))}</span>${sel.includes(p.email)?"<em>넣음</em>":""}</button>`).join("")}
document.addEventListener("click",e=>{const t=e.target.closest("[data-exopen],[data-exalr]");if(!t)return;
  if(t.dataset.exopen==="share"){exShareOpen();return}
  if(t.dataset.exalr){const L=exNew();if(L.length)exSeenSet("c",L[0].created_at);try{F("alertPaint")}catch(_){}
    const c=L[0];if(c&&c.kind==="cards"){F("cardOpen")}else toast("코멘트는 업무 창 아래 💬 에서 볼 수 있어요");return}});
$("miExShare").onclick=()=>{$("userMenu").hidden=true;exShareOpen()};
$("miExSeen").onclick=()=>{$("userMenu").hidden=true;exSeenOpen()};
// 팀 고르기에서 '전체' 줄을 고르면 요약 화면을 열고 고르기는 원래 팀으로 되돌림
$("teamSwitch").addEventListener("change",e=>{const v=e.target.value;if(!v.startsWith("unit:"))return;e.stopImmediatePropagation();e.target.value=st.team;exUnitOpen(v.slice(5))},true);
exUnits().then(()=>{try{paintUser()}catch(_){}});

wkFeat("exec",{execPaint,execHide,execTeamOpts,execAlertCount,execAlertsHtml,exIsExecEmail,execShareOpen:exShareOpen});
