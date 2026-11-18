/* rhy:se Weekly Plan — 📝 팀 회의록 화면 (meet.js, v3.27.0 · 📝 회의록을 누를 때만 불러옴)
   목록(전체 · 내가 쓴 · 내 할 일 · 휴지통) · 보기 · 쓰기/고치기(작성자만) · 공유 범위 · 할 일 → rhy:se 가져오기 · 코멘트(참석자 · 담당자) · 🕘 바뀐 기록
   데이터는 feat-meet.js 의 MT (목록 · 코멘트 · 가져감)를 같이 씀 */
const MP={open:false,tab:"all",view:null,edit:null,q:"",dir:null,units:null,log:null,logRev:null,trash:null,busy:false};
const mpMe=()=>String(st.me.email).toLowerCase();
const mpName=e=>{e=String(e||"").toLowerCase();const p=(MP.dir||[]).find(x=>x.email===e);if(p)return p.name;const c=typeof CO!=="undefined"&&CO&&CO.ceo;if(c&&String(c.email||"").toLowerCase()===e)return c.name||"대표이사";return e.split("@")[0]};
const mpTeamNm=id=>{const t=(st.teams||[]).find(x=>x.id===id);return t?t.name:id};
const mpMD=d=>d?`${+d.slice(5,7)}/${+d.slice(8,10)}`:"";
const mpRange=t=>t.start&&t.due&&t.start!==t.due?`${mpMD(t.start)} → ${mpMD(t.due)}`:mpMD(t.due||t.start);
const mpMine=m=>m.author_email===mpMe();
const mpMember=m=>mpMine(m)||(m.members||[]).includes(mpMe());
const mpM=id=>MTG.list.find(m=>m.id===id);
async function mpPrep(){if(!MP.dir)try{MP.dir=(await api.directory()).map(p=>Object.assign({},p,{email:String(p.email).toLowerCase()}))}catch(_){MP.dir=[]}
  if(!MP.units)try{MP.units=(await api.units())||[]}catch(_){MP.units=[]}}
// 우리 본부: 조직도에서 내 팀 칸의 위 조직
function mpMyUnit(){const U=MP.units||[],u=U.find(x=>x.team_id===st.me.team_id),p=u&&U.find(x=>x.id===u.parent_id);return p?{id:p.id,name:p.name}:null}
function mpShareText(m){const s=mpShareNorm(m.share,m.team_id),out=[];s.units.forEach(u=>out.push(mpUnitNm(u)+" 전체"));s.teams.forEach(t=>out.push(mpTeamNm(t)));
  const all=out;return all.length?all.slice(0,3).join(" · ")+(all.length>3?` 외 ${all.length-3}`:""):"참석자 · 담당자만"}
async function openMeetPage(id,tab){if(!st.me)return;MP.open=true;if(tab)MP.tab=tab;MP.edit=null;MP.log=null;MP.logRev=null;MP.view=id||null;
  let pg=$("meetPage");if(!pg){pg=document.createElement("section");pg.id="meetPage";pg.setAttribute("aria-label","회의록");document.body.appendChild(pg);pg.addEventListener("click",mpClick);pg.addEventListener("input",mpInput);pg.addEventListener("compositionend",mpCompEnd);pg.addEventListener("change",mpChange)}
  pg.hidden=false;document.documentElement.classList.add("meet-on");pg.scrollTop=0;pg.innerHTML=`<div class="mp-wrap"><div class="mp-empty">불러오는 중…</div></div>`;
  await mpPrep();if(!MTG.loaded)await F("meetLoad");mpRender();if(MP.view){const m=mpM(MP.view);if(m)F("meetSeen",m)}}
function closeMeetPage(){MP.open=false;const pg=$("meetPage");if(pg)pg.hidden=true;document.documentElement.classList.remove("meet-on");F("meetPaint")}
window.meetPageRefresh=()=>{if(!MP.open||MP.edit)return;const a=document.activeElement;if(a&&a.closest&&a.closest("#meetPage")&&a.matches("input,textarea"))return;mpRender()};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&MP.open&&!document.querySelector("#drawer:not([hidden])")&&$("alertModal").hidden){e.stopPropagation();if(MP.edit){MP.edit=null;mpRender()}else if(MP.view){MP.view=null;mpRender()}else closeMeetPage()}},true);
function mpSyncDates(){const E=MP.edit;if(!E)return;E.tasks.forEach((t,i)=>{const s=$(`mtk${i}-start`),d=$(`mtk${i}-due`);if(s)t.start=s.value;if(d)t.due=d.value})}
function mpRender(){const pg=$("meetPage");if(!pg)return;mpSyncDates();
  const tabs=[["all","전체"],["mine","내가 쓴"],["todo","내 To-do"],["trash","휴지통"]],nTodo=mtTodo().length;
  const head=`<div class="mp-top"><div class="mp-bar"><button type="button" class="btn ghost" data-mpa="close">← rhy:se</button><h2>📝 회의록</h2>
    ${MP.edit?"":`<div class="tabs mp-tabs" role="tablist">${tabs.map(([k,n])=>`<button type="button" class="tab${!MP.view&&MP.tab===k?" active":""}" role="tab" data-mptab="${k}">${n}${k==="todo"&&nTodo?` <b class="mp-n">${nTodo}</b>`:""}</button>`).join("")}</div>`}
    <span class="spacer"></span><button type="button" class="btn ghost" data-mpa="guide" title="📝 회의록 사용법">📖<span class="mp-gl"> 사용법</span></button>${MP.edit||!mtCanWrite()?"":`<button type="button" class="btn primary" data-mpa="new">+ 새 회의록</button>`}</div></div>`;
  pg.innerHTML=head+`<div class="mp-wrap">${MP.edit?mpEditHtml():MP.view?mpViewHtml():mpListHtml()}</div>`;
  if(MP.edit){const f=pg.querySelector("[data-mpf=title]");if(f&&!f.value)setTimeout(()=>f.focus(),30)}}
const mtCanWrite=()=>!!F("meetOn");   // v3.28.0: 기본 기능 (관리 › 회사 설정에서 끌 수 있음)
const mpBodyDef=b=>Object.assign({agenda:"",discussion:"",decisions:"",stime:"",etime:"",place:"",customer:"",guests:[],memo:""},b||{});
const mpEmptyTask=()=>({id:"t"+newId(),owner_email:"",owner_name:"",task:"",party:"",start:"",due:""});
const mpPlan=m=>mtStatus(m)==="plan";
/* ---------- 목록 ---------- */
function mpListHtml(){
  if(MP.tab==="trash")return mpTrashHtml();
  if(MP.tab==="todo")return mpTodoHtml();
  const q=MP.q.trim(),L=MTG.list.filter(m=>(MP.tab!=="mine"||mpMine(m))&&(!q||(m.title+" "+(m.author_name||"")+" "+(m.attendees||[]).map(mpName).join(" ")).includes(q)));
  const rows=L.map(m=>{const me=mpMe(),my=(m.tasks||[]).filter(t=>String(t.owner_email||"").toLowerCase()===me),nc=MTG.cmts.filter(c=>c.meeting_id===m.id).length;
    return `<button type="button" class="mp-row" data-mpopen="${esc(m.id)}"><span class="mp-d">${esc(mpMD(m.mdate))}</span><span class="mp-t"><b>${mpPlan(m)?`<span class="mp-chip plan">예정</span> `:""}${esc(m.title)}</b><span class="dim">${(m.body||{}).stime?esc((m.body||{}).stime)+" · ":""}${esc(m.author_name||"")} · 참석 ${(m.attendees||[]).length}명${((m.body||{}).guests||[]).length?` + 외부 ${(m.body||{}).guests.length}명`:""}${m.team_id!==st.me.team_id?` · ${esc(mpTeamNm(m.team_id))}`:""}</span></span>
      <span class="mp-meta">${my.length?`<span class="mp-chip me">내 To-do ${my.length}</span>`:""}${(m.tasks||[]).length?`<span class="mp-chip">To-do ${(m.tasks||[]).length}</span>`:""}${nc?`<span class="mp-chip">💬 ${nc}</span>`:""}<span class="mp-chip sh" title="공유 범위">👥 ${esc(mpShareText(m))}</span></span></button>`}).join("");
  return `<div class="mp-tools"><input type="search" class="mp-q" data-mpq="1" placeholder="제목 · 작성자 · 참석자로 찾기" value="${esc(MP.q)}"><span class="dim" id="mpCnt">${L.length}건</span></div>
    <div id="mpRows">${rows||`<div class="mp-empty">${MP.tab==="mine"?"내가 쓴 회의록이 없어요.":"볼 수 있는 회의록이 없어요."}${mtCanWrite()?" 위쪽 <b>+ 새 회의록</b>으로 시작해 보세요.":""}</div>`}</div>`}
function mpTodoHtml(){const me=mpMe(),R=[];for(const m of MTG.list)for(const t of (m.tasks||[]))if(String(t.owner_email||"").toLowerCase()===me)R.push({m,t,p:mtMyPull(m,t)});
  if(!R.length)return `<div class="mp-empty">회의에서 나에게 온 To-do가 없어요.</div>`;
  R.sort((a,b)=>(!!a.p-!!b.p)||String(a.t.due||"").localeCompare(String(b.t.due||"")));
  return `<p class="dim mp-lead">회의에서 내가 Action by 로 지정된 To-do입니다. <b>→ rhy:se 가져오기</b>를 누르면 업무 창이 채워진 채 열리고, 세부 사항을 넣어 저장하면 내 계획이 됩니다.</p>
    <div class="mp-tasks">${R.map(x=>`<div class="mp-task${x.p?" done":""}"><span class="mp-tw"><b>${esc(x.t.task)}</b><span class="dim">${esc(mpRange(x.t))} · <button type="button" class="mp-link" data-mpopen="${esc(x.m.id)}">${esc(x.m.title)} (${esc(mpMD(x.m.mdate))})</button></span></span>
      <span class="mp-ta">${x.p?(x.p.item_id?`<span class="mp-ok">✓ 가져감</span>`:`<span class="dim">안 가져옴</span> <button type="button" class="btn sm ghost" data-mppull="${esc(x.m.id)}|${esc(x.t.id)}">가져오기</button>`):`<button type="button" class="btn sm primary" data-mppull="${esc(x.m.id)}|${esc(x.t.id)}">→ rhy:se 가져오기</button><button type="button" class="btn sm ghost" data-mpskip="${esc(x.m.id)}|${esc(x.t.id)}" title="내 계획에 넣지 않고 목록에서 내려요">안 가져옴</button>`}</span></div>`).join("")}</div>`}
function mpTrashHtml(){if(!MP.trash){api.meetTrash().then(r=>{MP.trash=r;if(MP.open&&MP.tab==="trash")mpRender()});return `<div class="mp-empty">불러오는 중…</div>`}
  return `<p class="dim mp-lead">내가 지운 회의록은 90일 동안 여기 남고, 되살리면 코멘트 · 바뀐 기록까지 그대로 돌아옵니다.</p>`+(MP.trash.length?MP.trash.map(t=>`<div class="mp-row static"><span class="mp-d">${esc(mpMD(t.mdate))}</span><span class="mp-t"><b>${esc(t.title)}</b><span class="dim">지운 날 ${esc(fmtDT(t.deleted_at))}</span></span><span class="mp-meta"><button type="button" class="btn sm" data-mprestore="${esc(String(t.id))}">되살리기</button></span></div>`).join(""):`<div class="mp-empty">휴지통이 비어 있어요.</div>`)}
/* ---------- 보기 ---------- */
function mpBodyHtml(m,snap){const B=mpBodyDef(m.body),plan=mpPlan(m),later=`<div class="dim">${plan?"회의 뒤에 작성자가 채워요":"—"}</div>`;
  const sec=(k,n)=>`<section class="mp-sec"><h3>${n}</h3>${B[k]&&String(B[k]).trim()?`<div class="mp-txt">${esc(B[k])}</div>`:k==="agenda"?`<div class="dim">—</div>`:later}</section>`;
  const me=mpMe(),T=m.tasks||[],A=m.attendees||[],au=String(m.author_email||"").toLowerCase();
  const task=t=>{const mine=!snap&&String(t.owner_email||"").toLowerCase()===me,p=snap?null:MTG.pulls.find(x=>x.meeting_id===m.id&&x.task_id===t.id&&String(x.email).toLowerCase()===String(t.owner_email||"").toLowerCase()),got=p&&p.item_id;
    return `<tr${mine?' class="me"':""}><td>${esc(t.task)}</td><td>${esc(t.owner_name||mpName(t.owner_email))}${A.includes(String(t.owner_email||"").toLowerCase())?"":` <span class="mp-chip sm" title="회의에 참석하지 않은 담당자">참석 안 함</span>`}</td><td class="mono">${esc(mpRange(t))}</td>
      <td class="mp-st">${snap?"":mine?(got?`<span class="mp-ok">✓ 가져감</span>`:p?`<span class="dim">안 가져옴</span> <button type="button" class="btn sm ghost" data-mppull="${esc(m.id)}|${esc(t.id)}">가져오기</button>`:`<button type="button" class="btn sm primary" data-mppull="${esc(m.id)}|${esc(t.id)}">→ rhy:se 가져오기</button>`):(got?`<span class="mp-ok">가져감</span>`:"")}</td></tr>`};
  // 참석자 칩 + 답 (불참 사유는 작성자만: MTG.notes 는 서버가 작성자 · 본인에게만 줌)
  const chip=e=>{const rv=snap||e===au?null:mtRsvpOf(m,e),nt=rv&&rv.status==="no"&&mpMine(m)?MTG.notes.find(x=>x.meeting_id===m.id&&String(x.email).toLowerCase()===e):null;
    const bd=e===au?`<em class="mp-rv au">작성</em>`:rv?(rv.status==="yes"?`<em class="mp-rv yes">✓ 참석</em>`:`<em class="mp-rv no">불참</em>`):plan&&!snap?`<em class="mp-rv wait">답 전</em>`:"";
    return `<span class="mp-chip p${rv&&rv.status==="no"?" off":""}"${nt?` title="불참 사유: ${esc(nt.reason||"")}"`:""}>${esc(mpName(e))}${bd}</span>${nt?`<span class="mp-why">사유: ${esc(nt.reason||"")}</span>`:""}`};
  const myRv=!snap&&!mpMine(m)&&A.includes(me)&&plan?mtRsvpOf(m):null,askMe=!snap&&!mpMine(m)&&A.includes(me)&&plan;
  const info=[["일시",mtWhen(m)],["장소",B.place],["고객사",B.customer]].filter(x=>x[1]);
  return `${info.length?`<section class="mp-sec mp-info">${info.map(([k,v])=>`<span><b>${k}</b> ${esc(v)}</span>`).join("")}</section>`:""}
    <section class="mp-sec"><h3>참석자 <span class="dim">사내 ${A.length}명${B.guests.length?` · 외부 ${B.guests.length}명`:""}</span></h3><div class="mp-chips">${A.map(chip).join("")||`<span class="dim">—</span>`}</div>
      ${askMe?`<div class="mp-rsvp"><span>내 답: ${myRv?(myRv.status==="yes"?"<b>✓ 참석</b>":"<b>불참</b>"):"<b>아직</b>"}</span><button type="button" class="btn sm${myRv&&myRv.status==="yes"?"":" primary"}" data-mtrsvp="${esc(m.id)}|yes">참석 · 내 계획에 넣기</button><button type="button" class="btn sm ghost" data-mtrsvp="${esc(m.id)}|no">불참</button></div>`:""}
      ${B.guests.length?`<table class="mp-tt mp-gt"><thead><tr><th>외부 참석자</th><th>소속</th><th>직책</th></tr></thead><tbody>${B.guests.map(g=>`<tr><td>${esc(g.name)}</td><td>${esc(g.org||"")}</td><td>${esc(g.title||"")}</td></tr>`).join("")}</tbody></table>`:""}</section>
    ${sec("agenda","안건")}${sec("discussion","논의 내용")}${sec("decisions","결정 사항")}
    <section class="mp-sec"><h3>To-do <span class="dim">${T.length}건</span></h3>${T.length?`<table class="mp-tt mp-todo"><thead><tr><th>To-do</th><th>Action by</th><th>Due date</th><th></th></tr></thead><tbody>${T.map(task).join("")}</tbody></table>`:later}</section>
    ${String(B.memo||"").trim()?`<section class="mp-sec mp-memo"><h3>🔒 내부 메모 <span class="dim">워드로 내보낼 때는 빠져요</span></h3><div class="mp-txt">${esc(B.memo)}</div></section>`:""}`}
function mpViewHtml(){const m=mpM(MP.view);if(!m)return `<div class="mp-empty">회의록을 찾을 수 없어요. 지워졌거나 공유가 바뀌었을 수 있어요. <button type="button" class="btn sm" data-mptab="all">목록으로</button></div>`;
  const C=MTG.cmts.filter(c=>c.meeting_id===m.id),mem=mpMember(m);
  return `<div class="mp-vh"><button type="button" class="btn sm ghost" data-mptab="${MP.tab}">← 목록</button><div class="mp-vt"><h2>${mpPlan(m)?`<span class="mp-chip plan">예정</span> `:""}${esc(m.title)}</h2><span class="dim">${esc(m.mdate)} · 작성 ${esc(m.author_name||"")} · ${esc(mpTeamNm(m.team_id))}${m.rev>1?` · ${m.rev}번째 판`:""}</span></div><span class="spacer"></span>
      <button type="button" class="btn sm" data-mpa="docx" title="결재란이 있는 워드 파일 (내부 메모는 빠짐)">📄 워드로</button><button type="button" class="btn sm" data-mpa="log">🕘 바뀐 기록</button>${mpMine(m)?`<button type="button" class="btn sm" data-mpa="edit">✏️ 고치기</button><button type="button" class="btn sm ghost danger" data-mpa="del">지우기</button>`:""}</div>
    <div class="mp-share">👥 공유: <b>참석자 · Action by</b>${mpShareText(m)!=="참석자 · 담당자만"?` + ${esc(mpShareText(m))}`:""}${(mpShareNorm(m.share).people||[]).length?` · 참조 ${esc(mpShareNorm(m.share).people.map(mpName).join(", "))}`:""}${!mpMine(m)?`<span class="dim"> · 고칠 곳은 작성자에게 코멘트로 알려 주세요</span>`:""}</div>
    ${mpPlan(m)&&mpMine(m)?`<div class="mp-plan">📅 회의 일정에서 만든 <b>예정</b> 회의록입니다. 회의가 끝나면 <b>✏️ 고치기</b>로 논의 · 결정 · To-do 를 채워 저장하세요 → 참석자에게 '회의록 작성됨' 알림이 한 번 갑니다.</div>`:""}
    ${MP.log?mpLogHtml(m):""}
    <div class="mp-card">${mpBodyHtml(m)}</div>
    <section class="mp-sec mp-cm"><h3>💬 코멘트 <span class="dim">${C.length}</span></h3>
      ${C.map(c=>`<div class="mp-c"><b>${esc(c.author_name||mpName(c.author_email))}</b><span class="dim">${esc(fmtDT(c.created_at))}</span>${String(c.author_email).toLowerCase()===mpMe()?`<button type="button" class="mp-x" data-mpcdel="${esc(c.id)}" aria-label="코멘트 지우기">✕</button>`:""}<div class="mp-txt">${esc(c.body)}</div></div>`).join("")||`<div class="dim">아직 코멘트가 없어요.</div>`}
      ${mem?`<div class="mp-cf"><textarea data-mpcbody="1" rows="2" maxlength="1000" placeholder="${mpMine(m)?"참석자에게 남길 말":"고칠 곳 · 덧붙일 말을 작성자에게 남겨요"}"></textarea><button type="button" class="btn sm primary" data-mpa="cmt">남기기</button></div>`:`<div class="dim mp-cnote">코멘트는 참석자 · 담당자만 남길 수 있어요.</div>`}</section>`}
function mpLogHtml(m){if(MP.log==="loading")return `<div class="mp-log"><div class="dim">불러오는 중…</div></div>`;
  const L=MP.log||[],sel=L.find(x=>x.rev===MP.logRev);
  return `<div class="mp-log"><div class="mp-lh"><b>🕘 바뀐 기록</b><span class="dim">저장할 때마다 그때 판이 남아요. 줄을 누르면 그때 내용을 봐요.</span><span class="spacer"></span><button type="button" class="mp-x" data-mpa="logclose" aria-label="닫기">✕</button></div>
    ${L.map(x=>`<button type="button" class="mp-lr${x.rev===MP.logRev?" on":""}" data-mplog="${x.rev}"><span class="mono">${x.rev}판</span><span>${esc(fmtDT(x.at))}</span><span>${esc(x.by_name||"")}</span><span class="mp-ls">${esc(x.summary||"")}</span></button>`).join("")}
    ${sel?`<div class="mp-snap"><div class="mp-sh"><b>${sel.rev}판 내용</b> <span class="dim">${esc(fmtDT(sel.at))} · ${esc(sel.snap.title)} · ${esc(sel.snap.mdate)}</span></div>${mpBodyHtml(Object.assign({id:m.id},sel.snap),true)}</div>`:""}</div>`}
/* ---------- 쓰기 · 고치기 ---------- */
function mpNewDraft(){return {id:null,title:"",mdate:todayKey,body:mpBodyDef({status:"done"}),attendees:[mpMe()],tasks:[mpEmptyTask()],share:{units:[],teams:[],people:[]},pick:null,pq:"",err:""}}
// 예전 모양(team · unit)을 지금 모양(units · teams)으로
function mpShareNorm(s0,team){const s=JSON.parse(JSON.stringify(s0||{})),T=new Set(s.teams||[]),U=new Set(s.units||[]);if(s.team&&team)T.add(team);if(s.unit)U.add(s.unit);return {units:[...U],teams:[...T],people:[...(s.people||[])]}}
const mpUnitNm=id=>{const u=(MP.units||[]).find(x=>x.id===id);return u?u.name:"본부"};
const mpCeo=()=>{const c=(typeof CO!=="undefined"&&CO&&CO.ceo)||null;return c&&c.email?{email:String(c.email).toLowerCase(),name:c.name||"대표이사",title:c.title||"대표이사"}:null};
// 조직도 모양: 팀이 아닌 칸(본부 · 실 · 연구소)마다 한 줄 = [본부 전체] 칩 + 바로 아래 팀 칩. 조직도를 열 때마다 새로 읽으니 관리에서 더한 본부도 바로 보임
function mpOrgRows(){const U=MP.units||[],T=st.teams||[],rows=[],seen=new Set(),kids=id=>U.filter(u=>u.parent_id===id).sort((a,b)=>(a.sort||0)-(b.sort||0));
  const walk=(u,dep)=>{const tm=kids(u.id).filter(k=>k.team_id&&T.some(t=>t.id===k.team_id));tm.forEach(k=>seen.add(k.team_id));rows.push({u,dep,teams:tm.map(k=>k.team_id)});kids(u.id).filter(k=>!k.team_id).forEach(k=>walk(k,dep+1))};
  U.filter(u=>!u.team_id&&(!u.parent_id||!U.some(x=>x.id===u.parent_id))).sort((a,b)=>(a.sort||0)-(b.sort||0)).forEach(u=>walk(u,0));
  const rest=T.filter(t=>!seen.has(t.id)).map(t=>t.id);if(rest.length)rows.push({u:null,dep:0,teams:rest});return rows}
function mpPeopleHtml(kind,list){return `<div class="mp-chips">${list.map(e=>`<span class="mp-chip p">${esc(mpName(e))}<button type="button" class="mp-x" data-mprm="${kind}|${esc(e)}" aria-label="${esc(mpName(e))} 빼기">✕</button></span>`).join("")}
  <span class="mp-pick"><input type="search" data-mppick="${kind}" placeholder="이름으로 찾아 넣기" value="${MP.edit.pick===kind?esc(MP.edit.pq):""}" autocomplete="off">${MP.edit.pick===kind&&MP.edit.pq.trim()?mpPickList(kind,list):""}</span></div>`}
function mpPickList(kind,list){const q=MP.edit.pq.trim(),R=(MP.dir||[]).filter(p=>!list.includes(p.email)&&(p.name.includes(q)||p.email.includes(q)||(p.team_name||"").includes(q))).slice(0,8);
  return `<div class="mp-pl">${R.map(p=>`<button type="button" data-mpadd="${kind}|${esc(p.email)}">${esc(p.name)} <span class="dim">${esc(p.team_name||"")}</span></button>`).join("")||`<div class="dim">'${esc(q)}' 찾는 사람이 없어요</div>`}</div>`}
function mpEditHtml(){const E=MP.edit,B=E.body,S=E.share,ceo=mpCeo(),plan=B.status==="plan";
  const ta=(k,n,ph,rows)=>`<label class="mp-f"><span>${n}</span><textarea data-mpb="${k}" rows="${rows||3}" placeholder="${ph}">${esc(B[k]||"")}</textarea></label>`;
  const custs=[...new Set([...((st.lists&&st.lists.customers)||[]),B.customer].filter(Boolean))];
  return `<div class="mp-edit"><h2>${E.id?"회의록 고치기":"새 회의록"}</h2>${E.err?`<div class="mp-err">${esc(E.err)}</div>`:""}
    ${plan?`<div class="mp-plan">📅 지금은 <b>예정</b> 회의록입니다. 논의 내용 · 결정 사항 · To-do 중 하나라도 채워 저장하면 <b>작성됨</b>으로 바뀌고 참석자에게 알림이 한 번 갑니다. 일시 · 장소는 업무 창의 회의 일정에서 고치면 같이 바뀝니다.</div>`:""}
    <div class="mp-row2"><label class="mp-f grow"><span>제목</span><input data-mpf="title" maxlength="120" value="${esc(E.title)}" placeholder="예: 주간 팀 회의, PDR 준비 회의"></label><div class="mp-f"><span>일시</span>${F("tpkHtml","mpw",{date:true,d:E.mdate,s:B.stime,e:B.etime,da:'data-mpf="mdate"',sa:'data-mpb="stime"',ea:'data-mpb="etime"',ph:"날짜 · 시간 고르기"})||""}</div></div>
    <div class="mp-row2"><label class="mp-f grow"><span>장소</span><input data-mpb="place" maxlength="80" value="${esc(B.place||"")}" placeholder="예: 3층 회의실, Teams"></label><label class="mp-f grow"><span>고객사 <em class="dim">없으면 비워 둬요</em></span><input data-mpb="customer" list="mpCustList" maxlength="60" value="${esc(B.customer||"")}" placeholder="고르거나 적기" autocomplete="off"><datalist id="mpCustList">${custs.map(c=>`<option value="${esc(c)}">`).join("")}</datalist></label></div>
    <div class="mp-f"><span>참석자 <em class="dim">사내 · 넣은 사람에게 공유되고 🔔 알림이 한 번 가요</em></span>${mpPeopleHtml("att",E.attendees)}</div>
    <div class="mp-f"><span>외부 참석자 <em class="dim">이름 · 소속 · 직책만 (연락처는 적지 않아요)</em></span>
      <div class="mp-ge">${B.guests.map((g,i)=>`<div class="mp-gr" data-mpgi="${i}"><input data-mpg="name" value="${esc(g.name||"")}" placeholder="이름" maxlength="30"><input data-mpg="org" value="${esc(g.org||"")}" placeholder="소속 (예: 한화시스템)" maxlength="40"><input data-mpg="title" value="${esc(g.title||"")}" placeholder="직책" maxlength="20"><button type="button" class="mp-x" data-mpgdel="${i}" aria-label="외부 참석자 빼기">✕</button></div>`).join("")}
      <button type="button" class="btn sm ghost" data-mpa="gadd">+ 외부 참석자</button></div></div>
    ${ta("agenda","안건","오늘 다룰 것")}${ta("discussion","논의 내용","오간 이야기 · 의견",6)}${ta("decisions","결정 사항","정해진 것")}
    <div class="mp-f"><span>To-do <em class="dim">To-do – Action by – Due date. Action by 가 직접 rhy:se로 가져가요 (참석하지 않은 사람도 넣을 수 있어요). 비워 둔 줄은 저장할 때 빠져요</em></span>
      <div class="mp-teh"><span>To-do</span><span>Action by</span><span>Due date</span><span></span></div>
      <div class="mp-te">${E.tasks.map((t,i)=>`<div class="mp-ter" data-mpti="${i}"><input data-mpt="task" value="${esc(t.task)}" placeholder="To-do" maxlength="200" aria-label="To-do">
        <span class="mp-pick own">${t.owner_email?`<span class="mp-chip p">${esc(t.owner_name||mpName(t.owner_email))}<button type="button" class="mp-x" data-mptown="${i}" aria-label="Action by 바꾸기">✕</button></span>`:`<input type="search" data-mpowq="${i}" placeholder="Action by" value="${E.pick==="own"+i?esc(E.pq):""}" autocomplete="off" aria-label="Action by">${E.pick==="own"+i&&E.pq.trim()?mpOwnList(i):""}`}</span>
        <span class="mp-rng"><button type="button" class="rbtn${t.due?"":" empty"}" id="mtk${i}-rng" data-rpk="mtk${i}" aria-haspopup="dialog" title="Due date: 달력에서 시작 → 종료 (하루면 같은 날 두 번)"><span class="rb-s" data-rpk-side="s"><small>시작</small><b id="mtk${i}-rs">${t.start?dLabel(t.start):"-"}</b></span><span class="rb-arr" aria-hidden="true">→</span><span class="rb-e" data-rpk-side="e"><small>종료</small><b id="mtk${i}-re">${t.due?dLabel(t.due):"고르기"}</b></span></button><input id="mtk${i}-start" type="hidden" value="${esc(t.start||"")}"><input id="mtk${i}-due" type="hidden" value="${esc(t.due||"")}"><span id="mtk${i}-d3hint" hidden></span></span><button type="button" class="mp-x" data-mptdel="${i}" aria-label="To-do 빼기">✕</button></div>`).join("")}
      <button type="button" class="btn sm ghost" data-mpa="taskadd">+ To-do</button></div></div>
    ${ta("memo","🔒 내부 메모 <em class=\"dim\">우리끼리 보는 메모 · 워드로 내보낼 때 빠져요</em>","고객 앞에 내놓지 않을 이야기",2)}
    <div class="mp-f"><span>공유 범위 <em class="dim">참석자 · Action by 는 늘 봐요. 더 넓히려면 본부 · 팀을 고르세요 (본부를 고르면 그 아래 모든 팀)</em></span>
      <div class="mp-sub"><span class="dim">팀</span><div class="mp-org">${mpOrgRows().map(r=>{const uon=r.u&&S.units.includes(r.u.id);
        return `<div class="mp-orow" style="--dep:${r.dep}">${r.u?`<button type="button" class="mp-chip un${uon?" on":""}" data-mpshu="${esc(r.u.id)}" aria-pressed="${uon}">${esc(r.u.name)} 전체</button>`:`<span class="mp-ol dim">그 밖의 팀</span>`}
          ${r.teams.map(id=>{const on=S.teams.includes(id)||uon;return `<button type="button" class="mp-chip tg${on?" on":""}${uon?" via":""}" data-mpsht="${esc(id)}" aria-pressed="${on}"${uon?' disabled title="본부 전체로 이미 공유돼요"':""}>${esc(mpTeamNm(id))}${id===st.me.team_id?" (우리 팀)":""}</button>`}).join("")}</div>`}).join("")}</div></div>
      <div class="mp-sub"><span class="dim">참조 <em>보기만 하고, 넣으면 🔔 알림이 한 번 가요</em></span>${mpPeopleHtml("ppl",S.people)}</div></div>
    <div class="mp-foot"><button type="button" class="btn" data-mpa="cancel">취소</button><button type="button" class="btn primary" data-mpa="save"${MP.busy?" disabled":""}>${MP.busy?"저장 중…":"저장"}</button></div></div>`}
function mpOwnList(i){const q=MP.edit.pq.trim(),R=(MP.dir||[]).filter(p=>p.name.includes(q)||p.email.includes(q)||(p.team_name||"").includes(q)).slice(0,8),A=MP.edit.attendees;
  R.sort((a,b)=>(A.includes(b.email)-A.includes(a.email)));
  return `<div class="mp-pl">${R.map(p=>`<button type="button" data-mpownset="${i}|${esc(p.email)}">${esc(p.name)} <span class="dim">${esc(p.team_name||"")}${A.includes(p.email)?" · 참석":""}</span></button>`).join("")||`<div class="dim">'${esc(q)}' 찾는 사람이 없어요</div>`}</div>`}
function mpSummary(o,n){if(!o)return "처음 작성";const out=[],eq=(a,b)=>JSON.stringify(a||"")===JSON.stringify(b||"");
  if(o.title!==n.title)out.push("제목");if(o.mdate!==n.mdate||!eq((o.body||{}).stime,n.body.stime)||!eq((o.body||{}).etime,n.body.etime))out.push("일시");
  [["place","장소"],["customer","고객사"],["agenda","안건"],["discussion","논의 내용"],["decisions","결정 사항"],["memo","내부 메모"]].forEach(([k,l])=>{if(!eq((o.body||{})[k],n.body[k]))out.push(l)});
  if(!eq((o.body||{}).guests||[],n.body.guests||[]))out.push("외부 참석자");
  if((o.body||{}).status==="plan"&&n.body.status==="done")out.unshift("회의록 작성");
  const oa=o.attendees||[],na=n.attendees,add=na.filter(x=>!oa.includes(x)),rm=oa.filter(x=>!na.includes(x));
  if(add.length)out.push("참석자 추가: "+add.map(mpName).join(", "));if(rm.length)out.push("참석자 뺌: "+rm.map(mpName).join(", "));
  const ot=o.tasks||[],nt=n.tasks,ti=t=>t.id;const ta=nt.filter(t=>!ot.some(x=>x.id===t.id)).length,tr=ot.filter(t=>!nt.some(x=>x.id===t.id)).length,tc=nt.filter(t=>{const x=ot.find(y=>y.id===t.id);return x&&(x.task!==t.task||x.owner_email!==t.owner_email||(x.party||"")!==(t.party||"")||(x.start||"")!==(t.start||"")||(x.due||"")!==(t.due||""))}).length;
  if(ta)out.push(`할 일 ${ta}건 더함`);if(tc)out.push(`할 일 ${tc}건 바뀜`);if(tr)out.push(`할 일 ${tr}건 뺌`);
  const os=mpShareNorm(o.share,o.team_id),ns=mpShareNorm(n.share);if(!eq([os.units.sort(),os.teams.sort()],[ns.units.slice().sort(),ns.teams.slice().sort()]))out.push("공유 범위");if(!eq(os.people.slice().sort(),ns.people.slice().sort()))out.push("참조");
  return out.length?out.join(" · ").slice(0,480):"고침 (바뀐 내용 없음)"}
async function mpSave(){const E=MP.edit;if(MP.busy)return;mpSyncDates();E.title=E.title.trim();
  E.tasks=E.tasks.filter(t=>t.task.trim()||t.owner_email||t.due);
  const B=E.body;B.guests=(B.guests||[]).map(g=>({name:String(g.name||"").trim(),org:String(g.org||"").trim(),title:String(g.title||"").trim()})).filter(g=>g.name);
  ["place","customer"].forEach(k=>B[k]=String(B[k]||"").trim());
  const bad=!E.title?"제목을 적어 주세요":!E.mdate?"날짜를 넣어 주세요":E.tasks.some(t=>!t.task.trim())?"To-do 내용을 적어 주세요":E.tasks.some(t=>!t.owner_email)?"To-do 의 Action by 를 골라 주세요":E.tasks.some(t=>!t.due)?"To-do 의 Due date 를 골라 주세요":E.tasks.some(t=>t.start&&t.due&&t.start>t.due)?"Due date 의 시작이 종료보다 늦지 않게 해 주세요":B.stime&&B.etime&&B.stime>B.etime?"끝 시각이 시작 시각보다 늦게 해 주세요":"";
  if(bad){E.err=bad;if(!E.tasks.length)E.tasks.push(mpEmptyTask());mpRender();return}
  const wasPlan=B.status==="plan";if(wasPlan&&(String(B.discussion||"").trim()||String(B.decisions||"").trim()||E.tasks.length))B.status="done";if(!B.status)B.status="done";
  const old=E.id?mpM(E.id):null,row={id:E.id||("m"+newId()),title:E.title,mdate:E.mdate,body:E.body,attendees:E.attendees,tasks:E.tasks.map(t=>({id:t.id,owner_email:t.owner_email,owner_name:t.owner_name||mpName(t.owner_email),task:t.task.trim(),party:t.party||"",start:t.start||"",due:t.due||t.start||""})),share:E.share};
  MP.busy=true;mpRender();
  try{const m=await api.meetSave(row,mpSummary(old,row));const i=MTG.list.findIndex(x=>x.id===m.id);if(i>=0)MTG.list[i]=m;else MTG.list.unshift(m);
    MP.edit=null;MP.view=m.id;MP.log=null;F("meetSeen",m);toast(wasPlan&&m.body&&m.body.status==="done"?"📝 회의록을 작성했어요. 참석자에게 알림이 한 번 가요":old?"회의록을 고쳤어요. 바뀐 기록에 남았어요":"회의록을 저장했어요. 참석자 · 담당자에게 공유돼요");F("meetPaint")}
  catch(x){E.err=(x&&x.hint)||errText(x);if(wasPlan)B.status="plan";if(!E.tasks.length)E.tasks.push(mpEmptyTask())}finally{MP.busy=false;mpRender()}}
/* ---------- 이벤트 ---------- */
function mpTaskAt(el){const r=el.closest("[data-mpti]");return r?MP.edit.tasks[+r.dataset.mpti]:null}
async function mpClick(e){const t=e.target,E=MP.edit;
  const a=t.closest("[data-mpa]");if(a){const k=a.dataset.mpa,m=MP.view&&mpM(MP.view);
    if(k==="close"){closeMeetPage();return}
    if(k==="guide"){if(typeof wkGuide==="function")wkGuide("meet");return}
    if(k==="new"){MP.edit=mpNewDraft();MP.view=null;mpRender();return}
    if(k==="cancel"){MP.edit=null;mpRender();return}
    if(k==="save"){mpSave();return}
    if(k==="taskadd"){mpSyncDates();E.tasks.push(mpEmptyTask());mpRender();const r=$("meetPage").querySelectorAll("[data-mpt=task]");if(r.length)r[r.length-1].focus();return}
    if(k==="gadd"){E.body.guests.push({name:"",org:"",title:""});mpSyncDates();mpRender();const r=$("meetPage").querySelectorAll("[data-mpg=name]");if(r.length)r[r.length-1].focus();return}
    if(k==="docx"&&m){a.disabled=true;try{await mpDocx(m)}catch(x){console.warn(x);toast("워드 파일을 만들지 못했어요. 다시 눌러 주세요.")}finally{a.disabled=false}return}
    if(k==="edit"&&m){const B0=JSON.parse(JSON.stringify(mpBodyDef(m.body))),T0=JSON.parse(JSON.stringify(m.tasks||[]));if(!T0.length)T0.push(mpEmptyTask());
      MP.edit={id:m.id,title:m.title,mdate:m.mdate,body:B0,attendees:[...(m.attendees||[])],tasks:T0,share:mpShareNorm(m.share,m.team_id),pick:null,pq:"",err:""};mpRender();return}
    if(k==="del"&&m){if(a.dataset.arm!=="1"){a.dataset.arm="1";a.textContent="한 번 더 누르면 휴지통으로";setTimeout(()=>{a.dataset.arm="";a.textContent="지우기"},3500);return}
      try{await api.meetDelete(m.id);MTG.list=MTG.list.filter(x=>x.id!==m.id);MP.view=null;MP.trash=null;toast("🗑 휴지통으로 옮겼어요 (휴지통 탭에서 90일 안에 되살릴 수 있어요)");F("meetPaint");mpRender()}catch(x){toast((x&&x.hint)||errText(x))}return}
    if(k==="log"&&m){if(MP.log){MP.log=null;mpRender();return}MP.log="loading";MP.logRev=null;mpRender();try{MP.log=await api.meetLog(m.id)}catch(x){MP.log=[];toast(errText(x))}mpRender();return}
    if(k==="logclose"){MP.log=null;MP.logRev=null;mpRender();return}
    if(k==="cmt"&&m){const ta=$("meetPage").querySelector("[data-mpcbody]"),b=ta&&ta.value.trim();if(!b)return;a.disabled=true;
      const row={id:"c"+newId(),meeting_id:m.id,author_email:mpMe(),author_name:st.me.name,body:b};
      try{await api.meetCmtAdd(row);MTG.cmts.push(Object.assign({created_at:new Date().toISOString()},row));F("meetSeen",m);mpRender();toast("💬 코멘트를 남겼어요")}catch(x){a.disabled=false;toast((x&&x.hint)||errText(x))}return}
    return}
  const tb=t.closest("[data-mptab]");if(tb){MP.tab=tb.dataset.mptab;MP.view=null;MP.log=null;if(MP.tab==="trash")MP.trash=null;mpRender();return}
  const op=t.closest("[data-mpopen]");if(op){MP.view=op.dataset.mpopen;MP.log=null;mpRender();$("meetPage").scrollTop=0;const m=mpM(MP.view);if(m)F("meetSeen",m);return}
  const pl=t.closest("[data-mppull]");if(pl){const [mid,tid]=pl.dataset.mppull.split("|"),m=mpM(mid),tk=m&&(m.tasks||[]).find(x=>x.id===tid);if(tk)F("meetPullTask",m,tk);return}
  const sk=t.closest("[data-mpskip]");if(sk){const [mid,tid]=sk.dataset.mpskip.split("|"),m=mpM(mid),tk=m&&(m.tasks||[]).find(x=>x.id===tid);if(tk)try{await F("meetSkip",m,tk);mpRender()}catch(x){toast(errText(x))}return}
  const rs=t.closest("[data-mprestore]");if(rs){rs.disabled=true;try{await api.meetRestore(+rs.dataset.mprestore||rs.dataset.mprestore);MP.trash=null;await F("meetLoad");toast("회의록을 되살렸어요");mpRender()}catch(x){rs.disabled=false;toast((x&&x.hint)||errText(x))}return}
  const lg=t.closest("[data-mplog]");if(lg){const r=+lg.dataset.mplog;MP.logRev=MP.logRev===r?null:r;mpRender();return}
  const cd=t.closest("[data-mpcdel]");if(cd){if(cd.dataset.arm!=="1"){cd.dataset.arm="1";cd.textContent="지울까요?";setTimeout(()=>{cd.dataset.arm="";cd.textContent="✕"},3000);return}
    try{await api.meetCmtDel(cd.dataset.mpcdel);MTG.cmts=MTG.cmts.filter(c=>c.id!==cd.dataset.mpcdel);mpRender()}catch(x){toast(errText(x))}return}
  if(!E)return;
  const ad=t.closest("[data-mpadd]");if(ad){const [kind,em]=ad.dataset.mpadd.split("|"),L=kind==="att"?E.attendees:E.share.people;if(!L.includes(em))L.push(em);E.pick=null;E.pq="";mpRender();const i=$("meetPage").querySelector(`[data-mppick="${kind}"]`);if(i)i.focus();return}
  const rm=t.closest("[data-mprm]");if(rm){const [kind,em]=rm.dataset.mprm.split("|");if(kind==="att")E.attendees=E.attendees.filter(x=>x!==em);else E.share.people=E.share.people.filter(x=>x!==em);mpRender();return}
  const os=t.closest("[data-mpownset]");if(os){const [i,em]=os.dataset.mpownset.split("|"),tk=E.tasks[+i];tk.owner_email=em;tk.owner_name=mpName(em);E.pick=null;E.pq="";mpRender();const r=$("meetPage").querySelector(`[data-mpti="${i}"] [data-mpt=task]`);if(r)r.focus();return}
  const ow=t.closest("[data-mptown]");if(ow){const tk=E.tasks[+ow.dataset.mptown];tk.owner_email="";tk.owner_name="";mpRender();return}
  const gd=t.closest("[data-mpgdel]");if(gd){mpSyncDates();E.body.guests.splice(+gd.dataset.mpgdel,1);$("meetPage").querySelectorAll("[data-mpgi]").forEach(r=>r.remove());mpRender();return}
  const td=t.closest("[data-mptdel]");if(td){mpSyncDates();E.tasks.splice(+td.dataset.mptdel,1);$("meetPage").querySelectorAll("[data-mpti]").forEach(r=>r.remove());mpRender();return}   // 줄을 먼저 지워야 다시 그릴 때 칸 번호가 어긋나지 않음
  const shu=t.closest("[data-mpshu]");if(shu){const id=shu.dataset.mpshu,L=E.share.units;E.share.units=L.includes(id)?L.filter(x=>x!==id):[...L,id];mpRender();return}
  const sht=t.closest("[data-mpsht]");if(sht){const id=sht.dataset.mpsht,L=E.share.teams;E.share.teams=L.includes(id)?L.filter(x=>x!==id):[...L,id];mpRender();return}}
// 한글 조합 중에는 화면을 전혀 건드리지 않음 (v3.27.0.3): 글자가 다 만들어지면(compositionend) 그때 목록을 바꿈
function mpInput(e){const t=e.target,E=MP.edit;
  if(e.isComposing&&(t.dataset.mpq||t.dataset.mppick||t.dataset.mpowq!==undefined)){if(t.dataset.mpq)MP.q=t.value;else if(E){E.pick=t.dataset.mppick||"own"+t.dataset.mpowq;E.pq=t.value}return}
  if(t.dataset.mpq){MP.q=t.value;const tmp=document.createElement("div");tmp.innerHTML=mpListHtml();const r=tmp.querySelector("#mpRows"),c=tmp.querySelector("#mpCnt");if(r&&$("mpRows"))$("mpRows").replaceWith(r);if(c&&$("mpCnt"))$("mpCnt").textContent=c.textContent;return}
  if(!E)return;
  if(t.dataset.mpf){E[t.dataset.mpf]=t.value;return}
  if(t.dataset.mpb){E.body[t.dataset.mpb]=t.value;return}
  if(t.dataset.mpt){const tk=mpTaskAt(t);if(tk)tk[t.dataset.mpt]=t.value;return}
  if(t.dataset.mpg){const r=t.closest("[data-mpgi]"),g=r&&E.body.guests[+r.dataset.mpgi];if(g)g[t.dataset.mpg]=t.value;return}
  const k=t.dataset.mppick||(t.dataset.mpowq!==undefined?"own"+t.dataset.mpowq:null);
  if(k){E.pick=k;E.pq=t.value;const box=t.closest(".mp-pick");if(!box)return;const old=box.querySelector(".mp-pl");if(old)old.remove();
    if(!E.pq.trim())return;const L=t.dataset.mppick==="att"?E.attendees:t.dataset.mppick==="ppl"?E.share.people:null;
    box.insertAdjacentHTML("beforeend",L?mpPickList(t.dataset.mppick,L):mpOwnList(+t.dataset.mpowq))}}
function mpCompEnd(e){const t=e.target;if(!t||!t.dataset)return;if(t.dataset.mpq||t.dataset.mppick||t.dataset.mpowq!==undefined)setTimeout(()=>mpInput({target:t,isComposing:false}),0)}
function mpChange(e){const t=e.target,E=MP.edit;if(!E)return;
  if(t.dataset.mpt){const tk=mpTaskAt(t);if(tk)tk[t.dataset.mpt]=t.value}}
document.addEventListener("keydown",e=>{if(!MP.open||!MP.edit||e.key!=="Enter"||e.isComposing||e.keyCode===229)return;const t=e.target;if(!t.matches)return;
  if(t.matches("[data-mppick],[data-mpowq]")){const f=$("meetPage").querySelector(".mp-pl button");if(f){e.preventDefault();f.click()}}});
/* ---------- 📄 워드로 내보내기 (v3.28.0) : 결재란 · 표. 내부 메모는 빠짐. 라이브러리(docx, MIT)는 누를 때만 받음 ---------- */
function mpDocxLib(){if(window.docx)return Promise.resolve(window.docx);
  return wkLoad("script",{src:window.WK_BASE?window.WK_BASE+"docx.js":"vendor/docx-9.0.2.min.js"}).then(()=>window.docx)}
const mpDept=e=>{const p=(MP.dir||[]).find(x=>x.email===String(e||"").toLowerCase());return p?p.team_name||mpTeamNm(p.team_id):""};
async function mpDocx(m){const D=await mpDocxLib(),B=mpBodyDef(m.body);
  const {Document,Footer,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,AlignmentType,BorderStyle,ShadingType,VerticalAlign,TableLayoutType}=D;
  const FONT={ascii:"맑은 고딕",eastAsia:"맑은 고딕",hAnsi:"맑은 고딕",cs:"맑은 고딕"},W=9866,LINE={style:BorderStyle.SINGLE,size:4,color:"808080"},NONE={style:BorderStyle.NONE,size:0,color:"FFFFFF"};
  const B4=b=>({top:b,bottom:b,left:b,right:b});
  const run=(t,o)=>new TextRun(Object.assign({text:String(t==null?"":t),font:FONT,size:20},o||{}));
  const paras=(t,o)=>{const L=String(t||"").split("\n");return L.map(l=>new Paragraph({children:[run(l,o)],spacing:{after:40}}))};
  const cell=(t,o)=>{o=o||{};return new TableCell({children:o.kids||paras(t||(o.head?"":" "),o.head?{bold:true,size:19}:o.run),
    width:{size:o.w||1000,type:WidthType.DXA},columnSpan:o.span,rowSpan:o.rows,verticalAlign:VerticalAlign.CENTER,
    shading:o.head?{type:ShadingType.CLEAR,color:"auto",fill:"EEF1F5"}:undefined,margins:{top:60,bottom:60,left:100,right:100},borders:o.borders||B4(LINE)})};
  const cc=(t,o)=>cell(null,Object.assign({kids:[new Paragraph({alignment:AlignmentType.CENTER,children:[run(t,o&&o.head?{bold:true,size:19}:{})]})]},o));
  const table=(rows,cols)=>new Table({width:{size:W,type:WidthType.DXA},columnWidths:cols,layout:TableLayoutType.FIXED,rows});
  const gap=n=>new Paragraph({children:[],spacing:{after:n||120}});
  const h=t=>new Paragraph({children:[run(t,{bold:true,size:22,color:"1F3A5F"})],spacing:{before:200,after:80}});
  const co=(CO&&CO.name)||"",au=String(m.author_email||"").toLowerCase(),dept=mpDept(au)||mpTeamNm(m.team_id)||"";
  // 머리: 왼쪽 회사 · 제목, 오른쪽 결재란 (작성 · 검토 · 승인)
  const sign=new Table({width:{size:3900,type:WidthType.DXA},columnWidths:[500,1133,1133,1134],layout:TableLayoutType.FIXED,rows:[
    new TableRow({children:[cc("결\n재",{head:true,w:500,rows:2}),cc("작성",{head:true,w:1133}),cc("검토",{head:true,w:1133}),cc("승인",{head:true,w:1134})]}),
    new TableRow({height:{value:900,rule:"atLeast"},children:[cc("",{w:1133}),cc("",{w:1133}),cc("",{w:1134})]})]});
  const head=new Table({width:{size:W,type:WidthType.DXA},columnWidths:[W-3900,3900],layout:TableLayoutType.FIXED,rows:[new TableRow({children:[
    cell(null,{w:W-3900,borders:B4(NONE),kids:[new Paragraph({children:[run(co,{size:18,color:"666666"})]}),new Paragraph({children:[run("회 의 록",{bold:true,size:40})],spacing:{before:60}})]}),
    cell(null,{w:3900,borders:B4(NONE),kids:[sign,new Paragraph({children:[]})]})]})]});
  const when=(m.mdate?`${m.mdate.replace(/-/g,". ")} (${"일월화수목금토"[new Date(m.mdate+"T00:00").getDay()]})`:"")+(B.stime?` ${B.stime}${B.etime?" ~ "+B.etime:""}`:"");
  const wdate=String(m.updated_at||m.created_at||"").slice(0,10)||todayKey;
  const L1=1400,V1=(W-2*L1)/2;
  const info=table([
    new TableRow({children:[cc("회의명",{head:true,w:L1}),cell(m.title,{w:W-L1,span:3,run:{bold:true}})]}),
    new TableRow({children:[cc("일시",{head:true,w:L1}),cell(when,{w:V1}),cc("장소",{head:true,w:L1}),cell(B.place,{w:V1})]}),
    new TableRow({children:[cc("고객사",{head:true,w:L1}),cell(B.customer||"-",{w:V1}),cc("작성자",{head:true,w:L1}),cell(`${m.author_name||mpName(au)}${dept?" ("+dept+")":""} · ${wdate.replace(/-/g,". ")}`,{w:V1})]})],[L1,V1,L1,V1]);
  // 참석자: 사내 → 외부
  const no=e=>{const r=MTG.rsvp.find(x=>x.meeting_id===m.id&&String(x.email).toLowerCase()===e);return r&&r.status==="no"};
  const AC=[1100,2400,3466,2900],AR=[new TableRow({tableHeader:true,children:["구분","이름","소속","직책 · 비고"].map((t,i)=>cc(t,{head:true,w:AC[i]}))})];
  (m.attendees||[]).forEach(e=>AR.push(new TableRow({children:[cc("사내",{w:AC[0]}),cell(mpName(e),{w:AC[1]}),cell(mpDept(e)||(co||""),{w:AC[2]}),cell(e===au?"작성자":no(e)?"불참":"",{w:AC[3]})]})));
  B.guests.forEach(g=>AR.push(new TableRow({children:[cc("외부",{w:AC[0]}),cell(g.name,{w:AC[1]}),cell(g.org||"",{w:AC[2]}),cell(g.title||"",{w:AC[3]})]})));
  const att=table(AR,AC);
  // 안건 · 논의 · 결정
  const L2=1400,body=table([["안건",B.agenda],["논의 내용",B.discussion],["결정 사항",B.decisions]].map(([k,v])=>new TableRow({children:[cc(k,{head:true,w:L2}),cell(String(v||"").trim()||"-",{w:W-L2})]})),[L2,W-L2]);
  // To-do
  const T=m.tasks||[],TC=[700,5566,1800,1800],TR=[new TableRow({tableHeader:true,children:["No","To-do","Action by","Due date"].map((t,i)=>cc(t,{head:true,w:TC[i]}))})];
  T.forEach((t,i)=>TR.push(new TableRow({cantSplit:true,children:[cc(String(i+1),{w:TC[0]}),cell(t.task,{w:TC[1]}),cc(t.owner_name||mpName(t.owner_email),{w:TC[2]}),cc(t.start&&t.due&&t.start!==t.due?`${mpMD(t.start)} ~ ${mpMD(t.due)}`:mpMD(t.due||t.start),{w:TC[3]})]})));
  if(!T.length)TR.push(new TableRow({children:[cc("-",{w:TC[0]}),cell("-",{w:TC[1]}),cc("",{w:TC[2]}),cc("",{w:TC[3]})]}));
  const doc=new Document({creator:m.author_name||"rhy:se",title:"회의록 "+m.title,styles:{default:{document:{run:{font:FONT,size:20}}}},
    sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1020,bottom:1020,left:1020,right:1020}}},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[run(`rhy:se 회의록에서 내보냄 · ${todayKey.replace(/-/g,". ")}`,{size:16,color:"999999"})]})]})},
      children:[head,gap(160),info,h("참석자"),att,h("회의 내용"),body,h("To-do"),new Table({width:{size:W,type:WidthType.DXA},columnWidths:TC,layout:TableLayoutType.FIXED,rows:TR})]}]});
  const blob=await Packer.toBlob(doc),fn=`회의록_${(dept||"부서").replace(/[\\/:*?"<>|\s]+/g,"")}_${String(m.mdate||todayKey).replace(/-/g,"")}.docx`;
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=fn;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
  window.__mpDocxLast={fn,size:blob.size};toast(`📄 ${fn} 을(를) 받았어요`)}
