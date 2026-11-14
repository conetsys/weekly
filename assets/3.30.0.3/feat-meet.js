/* rhy:se Weekly Plan — 📝 팀 회의록 · 연결 부분 (feat-meet.js, v3.27.0)
   회의록 화면 자체(meet.js · meet.css)는 📝 회의록을 누를 때만 불러옴 (wkPart). 이 파일은 작게:
   · 팀 설정 스위치(팀장, 🧩 기능 더하기 → 우리 팀 설정) · 보고서 옆 📝 회의록 단추(우리 팀이 켰을 때)
   · 회의록 목록 · 코멘트 · 가져감 불러오기 (3분마다) → 🔔 알림 · '📝 회의에서 나온 일' 한 줄
   · 할 일 → rhy:se 가져오기 (업무 창을 미리 채워 열고, 저장하면 가져감 기록 · 📝 꼬리표)
   팀이 안 켰어도 참석자 · 담당자로 들어간 회의록은 알림 · 한 줄에서 열 수 있음. 이 파일이 고장 나도 업무 화면은 그대로 */
const MTG={list:[],cmts:[],pulls:[],rsvp:[],notes:[],loaded:false,busy:false,off:false,carry:null,justCarried:null,form:null};
// v3.28.0: 회의록 = 기본 기능 (팀 스위치 없음). 회사 전체 끄기는 ⚙ 관리 → 회사 설정 (modules.meet=false)
const meetOn=()=>!!st.me&&!st.me.is_admin&&!(typeof CO!=="undefined"&&CO&&CO.modules&&CO.modules.meet===false);
const mtTeamOn=()=>meetOn();
const mtStatus=m=>(m.body&&m.body.status)||"done";   // plan = 회의 일정에서 만든 예정 회의록
const mtRsvpOf=(m,em)=>MTG.rsvp.find(r=>r.meeting_id===m.id&&String(r.email).toLowerCase()===String(em||mtMe()).toLowerCase());
const mtMe=()=>st.me?String(st.me.email).toLowerCase():"";
const mtSeenK=()=>"wk-meet-seen-"+mtMe();
function mtSeen(){try{return JSON.parse(localStorage.getItem(mtSeenK())||"{}")}catch(_){return {}}}
function mtSeenSet(fn){const s=mtSeen();fn(s);try{localStorage.setItem(mtSeenK(),JSON.stringify(s))}catch(_){}}
const mtTaskKey=t=>[t.task||"",t.start||"",t.due||""].join("|");
const mtMyPull=(m,t)=>MTG.pulls.find(p=>p.meeting_id===m.id&&p.task_id===t.id&&String(p.email).toLowerCase()===mtMe());
// 내 할 일 중 아직 안 가져온 것
function mtTodo(){const me=mtMe(),out=[];for(const m of MTG.list)for(const t of (m.tasks||[]))if(String(t.owner_email||"").toLowerCase()===me&&!mtMyPull(m,t))out.push({m,t});return out}
// 가져간 뒤 바뀌거나 빠진 할 일
function mtChanged(){const me=mtMe(),sn=mtSeen(),out=[];for(const p of MTG.pulls){if(String(p.email).toLowerCase()!==me||!p.item_id)continue;const m=MTG.list.find(x=>x.id===p.meeting_id);if(!m)continue;
  const t=(m.tasks||[]).find(x=>x.id===p.task_id),k=t?mtTaskKey(t):"(빠짐)";if(p.task&&mtTaskKey(p.task)===k)continue;if(((sn[m.id]||{}).x||{})[p.task_id]===k)continue;out.push({m,t,p,k})}return out}
async function meetLoad(){if(!st.me||MTG.busy||MTG.off||st.me.is_admin)return;MTG.busy=true;
  try{const L=await api.meetList();if(L===null){MTG.off=true;return}MTG.list=L;const ids=L.slice(0,200).map(m=>m.id);[MTG.cmts,MTG.pulls,MTG.rsvp,MTG.notes]=await Promise.all([api.meetCmts(ids),api.meetPulls(ids),api.meetRsvp(ids),api.meetRsvpNotes(ids)]);MTG.loaded=true}
  catch(_){}finally{MTG.busy=false}
  meetPaint();F("alertPaint");if(window.meetPageRefresh)try{meetPageRefresh()}catch(_){}}
// 보고서 옆 단추 + 메인 위 '회의에서 나온 일' 한 줄
function meetPaint(){if(!st.me)return;
  let b=$("meetBtn");const on=meetOn();
  if(!b&&on){const rb=$("reportBtn");if(rb){b=document.createElement("button");b.className="btn";b.id="meetBtn";b.type="button";b.textContent="📝 회의록";b.onclick=()=>meetOpen();rb.insertAdjacentElement("afterend",b)}}
  if(b)b.hidden=!on;
  const T=mtTodo(),m=document.querySelector("main.wrap"),f=m&&m.querySelector(".filters");let bar=$("mtBar");
  if(!T.length||!f){if(bar)bar.remove();return}
  if(!bar){bar=document.createElement("div");bar.id="mtBar";bar.className="mtbar";f.insertAdjacentElement("beforebegin",bar)}
  const k=T.map(x=>x.m.id+x.t.id).join(",");if(bar.dataset.k===k)return;bar.dataset.k=k;
  bar.innerHTML=`<span class="mt-ic">📝</span><b>회의에서 나온 내 할 일 ${T.length}건</b><span class="mt-sub">${esc(T.slice(0,2).map(x=>x.t.task).join(" · "))}${T.length>2?` 외 ${T.length-2}건`:""}</span><button type="button" class="btn sm" data-mtgo="todo">가져오기</button>`}
function meetOpen(id,tab){return wkPart("meet").then(()=>openMeetPage(id,tab)).catch(()=>{})}
document.addEventListener("click",e=>{const g=e.target.closest&&e.target.closest("[data-mtgo]");if(!g)return;const v=g.dataset.mtgo;F("alertClose");if(v==="todo")meetOpen(null,"todo");else meetOpen(v)});
// 🔔 알림: 처음 공유된 회의록(참석자 · 담당자) · 남이 단 코멘트 · 가져간 할 일이 바뀜
function mtNews(){if(!st.me||!MTG.loaded)return [];const me=mtMe(),sn=mtSeen(),out=[];
  for(const m of MTG.list){const s=sn[m.id]||{};const mem=(m.members||[]).includes(me)||m.author_email===me;
    const inv=m.body&&m.body.item_id&&(m.attendees||[]).includes(me)&&m.author_email!==me;
    if(inv&&mtStatus(m)==="plan"&&!mtRsvpOf(m)&&!s.inv)out.push({m,k:"inv",at:m.created_at,txt:`<b>${esc(m.author_name||"")} 님 회의 초대</b> · ${esc(m.title)} · ${esc(mtWhen(m))}${m.body.place?` · ${esc(m.body.place)}`:""}${m.body.agenda?`<span class="mt-ag">안건: ${esc(String(m.body.agenda).split("\n")[0].slice(0,60))}</span>`:""}`});
    if(inv&&mtStatus(m)==="done"&&s.st!=="done"&&s.inv)out.push({m,k:"done",at:m.updated_at,txt:`<b>회의록이 작성됐어요</b> · ${esc(m.title)} (${esc(mtWhen(m))})`});
    if(m.author_email===me){const nn=MTG.rsvp.filter(r=>r.meeting_id===m.id&&r.status==="no"&&(!s.no||r.at>s.no));if(nn.length)out.push({m,k:"no",at:nn[nn.length-1].at,txt:`<b>불참 ${nn.length}명</b> · ${esc(m.title)} — ${esc(nn.map(r=>mtNm(r.email)).join(", "))}`})}
    if(!inv&&m.author_email!==me&&(m.members||[]).includes(me)&&!s.r){const n=(m.tasks||[]).filter(t=>String(t.owner_email||"").toLowerCase()===me).length;out.push({m,k:"new",at:m.updated_at,txt:`<b>${esc(m.author_name||"")} 님이 회의록에 넣었어요</b> · ${esc(m.title)}${n?` · 내 할 일 ${n}건`:""}`})}
    if(!mem&&(((m.share||{}).people)||[]).map(x=>String(x).toLowerCase()).includes(me)&&!s.r)out.push({m,k:"ref",at:m.updated_at,txt:`<b>${esc(m.author_name||"")} 님이 회의록에 참조로 넣었어요</b> · ${esc(m.title)}`});
    if(mem){const c=MTG.cmts.filter(c=>c.meeting_id===m.id&&String(c.author_email).toLowerCase()!==me&&(!s.c||c.created_at>s.c));if(c.length)out.push({m,k:"cmt",at:c[c.length-1].created_at,txt:`<b>💬 코멘트 ${c.length}개</b> · ${esc(m.title)} — ${esc(c[c.length-1].author_name||"")}: ${esc(c[c.length-1].body.slice(0,40))}`})}}
  for(const x of mtChanged())out.push({m:x.m,k:"chg",at:x.m.updated_at,txt:`<b>가져간 할 일이 ${x.t?"바뀌었어요":"회의록에서 빠졌어요"}</b> · ${esc(x.m.title)} — ${esc(x.t?x.t.task:(x.p.task&&x.p.task.task)||"")} (내 업무는 그대로라 필요하면 직접 고쳐 주세요)`});
  return out.sort((a,b)=>String(b.at||"").localeCompare(String(a.at||"")))}
function meetAlertCount(){return mtNews().length}
function meetAlertsHtml(){return mtNews().map(x=>`<div class="walr k-share"><span class="wlv">${x.k==="inv"?"📅":x.k==="no"?"🙅":"📝"}</span><button type="button" class="wtx" data-mtgo="${esc(x.m.id)}">${x.txt}<span class="wsub">${esc(fmtDT(x.at))}</span></button><span class="wact">${x.k==="inv"?`<button type="button" class="btn sm primary" data-mtrsvp="${esc(x.m.id)}|yes">내 계획에 넣기</button><button type="button" class="btn sm" data-mtrsvp="${esc(x.m.id)}|no">불참</button>`:`<button type="button" class="btn sm" data-mtgo="${esc(x.m.id)}">보기</button>`}</span></div>`).join("")}
const mtWhen=m=>{const b=m.body||{},d=m.mdate||"";const dt=d?`${+d.slice(5,7)}/${+d.slice(8,10)}(${"일월화수목금토"[new Date(d+"T00:00").getDay()]})`:"";return dt+(b.stime?` ${b.stime}${b.etime?"~"+b.etime:""}`:"")};
const mtNm=e=>{const p=(st.people||[]).find(x=>x.email===e)||((typeof SH!=="undefined"&&SH.dir)||[]).find(x=>x.email===e);return p?p.name:String(e||"").split("@")[0]};
// 참석 · 불참 (불참은 사유 필수, 사유는 작성자만 봄). 참석 = 그 회의를 내 계획에 넣기 (Co-work 넣기)
async function meetRsvp(m,status,reason){await api.meetRsvpSet(m.id,status,reason||null);
  const em=mtMe();MTG.rsvp=MTG.rsvp.filter(r=>!(r.meeting_id===m.id&&String(r.email).toLowerCase()===em)).concat([{meeting_id:m.id,email:em,status,at:new Date().toISOString()}]);
  MTG.notes=MTG.notes.filter(r=>!(r.meeting_id===m.id&&String(r.email).toLowerCase()===em)).concat(status==="no"?[{meeting_id:m.id,email:em,reason}]:[]);
  const sh=(typeof SH!=="undefined"?SH.list:[]).find(x=>x.to_email===em&&x.item_id===(m.body||{}).item_id&&!x.canceled_at);
  if(sh){const v=status==="yes"?new Date().toISOString():null;try{await api.updShare(sh.id,{joined_at:v,seen_at:new Date().toISOString()});sh.joined_at=v;F("shareLoad")}catch(_){}}
  mtSeenSet(s=>{const o=s[m.id]||{};o.inv=1;o.st=mtStatus(m);s[m.id]=o});F("alertPaint");if(window.meetPageRefresh)meetPageRefresh();
  toast(status==="yes"?(sh?"📅 회의를 내 계획에 넣었어요":"📅 참석으로 답했어요"):"🙅 불참으로 답했어요. 사유는 작성자에게만 보여요")}
function meetAskNo(btn,m){const row=btn.closest(".walr,.mp-rsvp")||btn.parentElement;if(row.querySelector(".mt-no"))return;
  row.insertAdjacentHTML("beforeend",`<span class="mt-no"><input type="text" maxlength="300" placeholder="불참 사유 (작성자만 봐요)" aria-label="불참 사유"><button type="button" class="btn sm" data-mtnogo="${esc(m.id)}">보내기</button></span>`);
  const i=row.querySelector(".mt-no input");i.focus();i.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.isComposing&&e.keyCode!==229){e.preventDefault();row.querySelector("[data-mtnogo]").click()}})}
document.addEventListener("click",async e=>{const r=e.target.closest&&e.target.closest("[data-mtrsvp]");
  if(r){e.stopPropagation();const [id,v]=r.dataset.mtrsvp.split("|"),m=MTG.list.find(x=>x.id===id);if(!m)return;if(v==="no"){meetAskNo(r,m);return}
    r.disabled=true;try{await meetRsvp(m,"yes")}catch(x){r.disabled=false;toast((x&&x.hint)||errText(x))}return}
  const g=e.target.closest&&e.target.closest("[data-mtnogo]");if(g){e.stopPropagation();const m=MTG.list.find(x=>x.id===g.dataset.mtnogo),i=g.parentElement.querySelector("input"),why=i?i.value.trim():"";
    if(!why){i&&i.focus();toast("불참 사유를 적어 주세요");return}g.disabled=true;try{await meetRsvp(m,"no",why)}catch(x){g.disabled=false;toast((x&&x.hint)||errText(x))}}},true);
// 회의록을 열면 '봤음' (meet.js 가 부름)
function meetSeen(m){if(!m)return;const me=mtMe(),last=MTG.cmts.filter(c=>c.meeting_id===m.id).map(c=>c.created_at).sort().pop();
  const lastNo=MTG.rsvp.filter(r=>r.meeting_id===m.id&&r.status==="no").map(r=>r.at).sort().pop();
  mtSeenSet(s=>{const o=s[m.id]||{};o.r=m.rev;if(last)o.c=last;if(lastNo&&m.author_email===me)o.no=lastNo;if(o.inv||mtStatus(m)==="done")o.st=mtStatus(m);const x=o.x||{};for(const p of MTG.pulls)if(p.meeting_id===m.id&&String(p.email).toLowerCase()===me){const t=(m.tasks||[]).find(y=>y.id===p.task_id);x[p.task_id]=t?mtTaskKey(t):"(빠짐)"}o.x=x;s[m.id]=o});
  F("alertPaint")}
// → rhy:se 가져오기: 업무 창을 미리 채워 열기 (저장해야 가져감)
function meetPullTask(m,t){if(!m||!t)return;
  if(!canAddHere()){toast("내 팀 화면에서 가져올 수 있어요 (위쪽 팀 고르기에서 내 팀)");return}
  MTG.carry={from_meet:{mid:m.id,tid:t.id,title:m.title,mdate:m.mdate},_t:{task:t.task||"",start:t.start||"",due:t.due||""}};
  openDrawer(null,st.me.name);
  {let sn=false;const cw=setInterval(()=>{if(!$("drawer").hidden)sn=true;else if(sn){clearInterval(cw);setTimeout(()=>{MTG.carry=null},100)}},300)}
  setTimeout(()=>{$("w-task").value=t.task||"";let s=t.start||"",d=t.due||"";if(d&&d<todayKey)d=todayKey;if(s&&d&&s>d)s=d;if(s)$("w-start").value=s;if(d)$("w-due").value=d;try{d3Hint("w")}catch(_){}
    const mm=$("w-memo");if(mm&&!mm.value)mm.value=`📝 회의록: ${m.title} (${m.mdate?m.mdate.slice(5).replace("-","/"):""})`;
    toast("📝 회의에서 나온 할 일을 채워 뒀어요. 사업 · 구분 등 세부 사항을 넣고 저장하세요")},250)}
function meetBodyExtra(){const c=MTG.carry;MTG.carry=null;if(!c)return null;MTG.justCarried=c;return {from_meet:Object.assign({},c.from_meet)}}
async function meetAfterSave(id,body){if(body&&body.meet)await mtSyncMeeting(id,body);const c=MTG.justCarried;MTG.justCarried=null;if(!c||!body||!body.from_meet)return;
  const row={meeting_id:c.from_meet.mid,task_id:c.from_meet.tid,email:mtMe(),item_id:id,task:c._t};
  try{await api.meetPull(row);MTG.pulls=MTG.pulls.filter(p=>!(p.meeting_id===row.meeting_id&&p.task_id===row.task_id&&String(p.email).toLowerCase()===row.email)).concat([row]);meetPaint();F("alertPaint");if(window.meetPageRefresh)meetPageRefresh()}catch(_){}}
// '안 가져옴' (한 줄 · 알림에서 다시 안 뜨게)
async function meetSkip(m,t){const row={meeting_id:m.id,task_id:t.id,email:mtMe(),item_id:null,task:{task:t.task||"",start:t.start||"",due:t.due||""}};
  await api.meetPull(row);MTG.pulls=MTG.pulls.filter(p=>!(p.meeting_id===row.meeting_id&&p.task_id===row.task_id&&String(p.email).toLowerCase()===row.email)).concat([row]);meetPaint();F("alertPaint")}
function meetTag(it){const f=it&&it.from_meet;return f?`<span class="pmtag" title="회의록에서 가져온 할 일 · ${esc(f.title||"")} (${esc(f.mdate||"")}) — 가져온 뒤엔 회의록과 따로 움직여요">📝</span>`:""}
function meetEditOpen(it,ro){mtFormOpen(it,ro);let n=$("mtFromNote");const f=(it&&it.from_meet)||(MTG.carry&&MTG.carry.from_meet);
  if(!f){if(n)n.hidden=true;return}
  if(!n){n=document.createElement("div");n.id="mtFromNote";n.className="pm-from";const fm=$("form");fm.insertBefore(n,fm.firstChild)}
  n.hidden=false;n.innerHTML=`<b>📝 회의록에서 가져온 할 일</b><span>${esc(f.title||"")} · ${esc(f.mdate||"")}</span><span class="dim">여기서 자유롭게 고쳐요. 회의록은 바뀌지 않아요.</span>`}
/* ---------- 업무 창 📅 회의 (v3.28.0): 일시 · 장소 · 외부 참석자 · 안건. 사내 참석자는 아래 🤝 칸(회의면 20명) ---------- */
function mtFormOpen(it,ro){let sec=$("mtSec");const share=$("shareSec");
  if(!meetOn()||ro||!share||share.hidden||(it&&!isMine(it))){if(sec)sec.hidden=true;MTG.form=null;mtShareLabel(false);mtLock(false);return}
  const m0=(it&&it.meet)||null,w0=it&&it.weeks&&(it.weeks[st.week]||Object.values(it.weeks).pop())||{};
  MTG.form={on:!!(m0&&m0.on),title:w0.task||"",date:w0.start||w0.due||"",stime:(m0&&m0.stime)||"",etime:(m0&&m0.etime)||"",place:(m0&&m0.place)||"",agenda:(m0&&m0.agenda)||"",guests:JSON.parse(JSON.stringify((m0&&m0.guests)||[])),mid:(m0&&m0.mid)||""};
  if(!sec){sec=document.createElement("section");sec.className="fsec fsec-meet";sec.id="mtSec";const fm=$("form"),c1=fm&&fm.querySelector(".fsec-common");if(c1)c1.parentElement.insertBefore(sec,c1);else share.parentElement.insertBefore(sec,share);
    sec.addEventListener("input",mtFormInput);sec.addEventListener("compositionend",e=>{if(e.target.id==="mtAttQ")setTimeout(()=>mtAttFind(e.target.value),0)});
    sec.addEventListener("keydown",e=>{if(e.target.id!=="mtAttQ"||e.key!=="Enter"||e.isComposing||e.keyCode===229)return;e.preventDefault();const b=$("mtAttL")&&$("mtAttL").querySelector("[data-mtaadd]");if(b)b.click()});sec.addEventListener("change",mtFormInput);sec.addEventListener("click",mtFormClick)}
  sec.hidden=false;mtFormPaint()}
function mtFormPaint(){const sec=$("mtSec"),f=MTG.form;if(!sec||!f)return;mtShareLabel(f.on);mtLock(f.on);
  sec.innerHTML=`<div class="fsec-h"><span class="fnum wfn">📅</span><b>회의</b><span class="fsub">회의 일정이면 켜세요 · 참석자에게 초대가 가고 회의록(예정)이 만들어져요</span><label class="mt-sw"><span class="switch"><input type="checkbox" data-mtf="on"${f.on?" checked":""}><i></i></span><span>${f.on?"회의":"꺼짐"}</span></label></div>
    ${f.on?`<div class="mt-body"><label class="mt-f"><span>회의 제목</span><input id="mtTitle" data-mtf="title" maxlength="120" value="${esc(f.title||"")}" placeholder="예: 수검 준비 점검 회의"></label>
      <div class="mt-r"><div class="mt-f"><span>일시</span>${tpkHtml("mtw",{date:true,d:f.date,s:f.stime,e:f.etime,da:'data-mtf="date"',sa:'data-mtf="stime"',ea:'data-mtf="etime"',ph:"날짜 · 시간 고르기"})}</div>
      <label class="mt-f grow"><span>장소</span><input data-mtf="place" maxlength="80" value="${esc(f.place)}" placeholder="예: 3층 회의실, 화상(Teams)"></label></div>
      <div class="mt-f"><span>참석 요청 <em class="dim">사내 · 20명까지 · 받는 분은 [내 계획에 넣기] 또는 [불참]으로 답해요</em></span><div class="mt-att" id="mtAtt">${mtAttHtml()}</div></div>
      <p class="hint mt-h">회의일 때는 아래 공통 정보 · 할일 · Co-work 칸을 쓰지 않아요.</p>
      <div class="mt-f"><span>외부 참석자 <em class="dim">이름 · 소속 · 직책만 (연락처는 적지 않아요)</em></span>
        ${f.guests.map((g,i)=>`<div class="mt-g" data-mtgi="${i}"><input data-mtg="name" value="${esc(g.name||"")}" placeholder="이름" maxlength="30"><input data-mtg="org" value="${esc(g.org||"")}" placeholder="소속 (예: 한화시스템)" maxlength="40"><input data-mtg="title" value="${esc(g.title||"")}" placeholder="직책" maxlength="20"><button type="button" class="mt-x" data-mtgdel="${i}" aria-label="외부 참석자 빼기">✕</button></div>`).join("")}
        <button type="button" class="btn sm ghost" data-mtgadd="1">+ 외부 참석자</button></div>
      <label class="mt-f"><span>안건 <em class="dim">초대 알림과 회의록에 미리 보여요</em></span><textarea data-mtf="agenda" rows="3" maxlength="2000" placeholder="오늘 다룰 것">${esc(f.agenda)}</textarea></label></div>`:""}`}
// 회의면 공통 정보 · 입고 대기 · 이번주 할일 · 다음주 계획을 잠금 (값은 그대로 두고 저장 때 쓰지 않음)
function mtLock(on){document.querySelectorAll("#form .fsec-common,#form .fsec-cur,#form .fsec-nxt,#waitSec").forEach(x=>{x.classList.toggle("mt-lock",!!on);if(on)x.setAttribute("inert","");else x.removeAttribute("inert")})}
// 저장할 때 (core): 회의면 {task,date} · 빠진 것이 있으면 {err,bad}
function meetSaveMode(){if(!meetFormOn())return null;const f=MTG.form,t=String(f.title||"").trim();
  if(!t)return {err:"회의 제목",bad:"mtTitle"};if(!f.date)return {err:"회의 날짜",bad:"mtw-tpkd"};return {task:t,date:f.date}}
// 📅 참석 요청 (사내): Co-work 와 같은 통로(SH.sel)를 쓰지만 화면은 회의 칸 안에서 따로. 회의면 아래 Co-work 칸은 숨김
function mtAttHtml(){const L=(typeof SH!=="undefined"&&SH.sel)||[];
  return `${L.map((p,i)=>`<span class="mt-chip">${esc(p.name)}<em>${esc(p.team||"")}</em><button type="button" data-mtarm="${i}" aria-label="${esc(p.name)} 빼기">✕</button></span>`).join("")}
    ${L.length<20?`<span class="mt-pick"><input type="search" id="mtAttQ" placeholder="이름으로 찾아 넣기" autocomplete="off" aria-label="참석자 찾기"><span class="mt-pl" id="mtAttL" hidden></span></span>`:""}<span class="mt-n dim">${L.length}/20</span>`}
function mtAttPaint(focus){const b=$("mtAtt");if(!b)return;b.innerHTML=mtAttHtml();if(focus!==false){const q=$("mtAttQ");if(q)q.focus()}}
async function mtAttFind(v){const q=String(v||"").trim(),box=$("mtAttL");if(!box)return;if(!q){box.hidden=true;box.innerHTML="";return}
  const dir=typeof shDir==="function"?await shDir():[],have=new Set(SH.sel.map(p=>p.email));if(($("mtAttQ")||{}).value!==v)return;
  const hit=dir.filter(p=>!have.has(p.email)&&(p.name.includes(q)||(p.team_name||"").includes(q)||p.email.startsWith(q.toLowerCase()))).sort((a,b)=>(b.name.startsWith(q))-(a.name.startsWith(q))||a.name.localeCompare(b.name,"ko")).slice(0,8);
  box.innerHTML=hit.length?hit.map((p,i)=>`<button type="button" data-mtaadd="${esc(p.email)}"${i===0?' class="on"':""}><b>${esc(p.name)}</b><span class="dim">${esc(p.team_name||"")}</span></button>`).join(""):`<span class="dim mt-pe">'${esc(q)}' 찾는 사람이 없어요</span>`;box.hidden=false}
async function mtAttAdd(em){const dir=typeof shDir==="function"?await shDir():[],p=dir.find(x=>x.email===em);if(!p||SH.sel.length>=20||SH.sel.some(x=>x.email===em))return;
  SH.sel.push({email:p.email,name:p.name,team:p.team_name||""});mtAttPaint()}
function mtShareLabel(on){const h=$("secShare"),sub=h&&h.parentElement.querySelector(".fsub");if(!h)return;
  if(!h.dataset.t0){h.dataset.t0=h.textContent;if(sub)sub.dataset.t0=sub.textContent}
  $("shareSec").classList.toggle("mt-hide",!!on);if(typeof paintShareEdit==="function"&&!$("shareSec").hidden)try{paintShareEdit()}catch(_){}}
function mtFormInput(e){const t=e.target,f=MTG.form;if(!f)return;
  if(t.id==="mtAttQ"){if(e.type==="input"&&!e.isComposing)mtAttFind(t.value);return}   // change(칸을 떠날 때)에는 다시 그리지 않음: 목록을 누르는 중에 바뀌면 안 눌림   // 한글 조합 중에는 화면을 건드리지 않음
  if(t.dataset.mtf==="on"){f.on=t.checked;if(!f.on&&typeof SH!=="undefined"&&SH.sel.length>3){SH.sel=SH.sel.slice(0,3);toast("Co-work 요청은 3명까지라 앞의 3명만 남겼어요")}if(f.on&&!f.title)f.title=($("w-task")&&$("w-task").value.trim())||"";if(f.on&&!f.date)f.date=($("w-start")&&$("w-start").value)||($("w-due")&&$("w-due").value)||"";mtFormPaint();if(f.on){const ti=$("mtTitle");if(ti&&!ti.value)ti.focus()}return}
  if(t.dataset.mtf){f[t.dataset.mtf]=t.value;return}
  if(t.dataset.mtg){const r=t.closest("[data-mtgi]"),g=r&&f.guests[+r.dataset.mtgi];if(g)g[t.dataset.mtg]=t.value}}
function mtFormClick(e){const f=MTG.form;if(!f)return;
  const ad=e.target.closest("[data-mtaadd]");if(ad){mtAttAdd(ad.dataset.mtaadd);return}
  const rm=e.target.closest("[data-mtarm]");if(rm){SH.sel.splice(+rm.dataset.mtarm,1);mtAttPaint();return}
  if(e.target.closest("[data-mtgadd]")){f.guests.push({name:"",org:"",title:""});mtFormPaint();const ins=$("mtSec").querySelectorAll('[data-mtg="name"]');if(ins.length)ins[ins.length-1].focus();return}
  const d=e.target.closest("[data-mtgdel]");if(d){f.guests.splice(+d.dataset.mtgdel,1);mtFormPaint()}}
function meetFormOn(){return !!(MTG.form&&MTG.form.on&&$("mtSec")&&!$("mtSec").hidden)}
// 저장할 때 (core): 켜져 있으면 회의 정보, 껐으면 null(지움), 칸이 없으면 undefined(그대로)
function meetCollect(){const f=MTG.form;if(!f||!$("mtSec")||$("mtSec").hidden)return undefined;if(!f.on)return null;
  return {on:true,stime:f.stime||"",etime:f.etime||"",place:String(f.place||"").trim(),agenda:String(f.agenda||"").trim(),guests:f.guests.map(g=>({name:String(g.name||"").trim(),org:String(g.org||"").trim(),title:String(g.title||"").trim()})).filter(g=>g.name),mid:f.mid||""}}
// 저장 뒤: 회의록(예정) 만들기 · 맞추기
async function mtSyncMeeting(id,body){const mt=body.meet;if(!mt||!mt.on||!meetOn())return;
  const mid=mt.mid||("mi_"+id),W=st.week,w=(body.weeks||{})[W]||(body.weeks||{})[CUR]||Object.values(body.weeks||{}).pop()||{};
  const date=w.start||w.due||todayKey,att=[mtMe(),...((typeof SH!=="undefined"&&SH.sel)||[]).map(x=>String(x.email).toLowerCase())];
  const old=MTG.list.find(m=>m.id===mid);if(old&&old.author_email!==mtMe())return;
  const ob=(old&&old.body)||{},plan=!old||mtStatus(old)==="plan";
  const nb=Object.assign({discussion:"",decisions:"",memo:"",status:"plan"},ob,{item_id:id,stime:mt.stime,etime:mt.etime,place:mt.place,guests:mt.guests,customer:ob.customer||body.customer||""},plan?{agenda:mt.agenda}:{});
  const row={id:mid,title:w.task||(old&&old.title)||"회의",mdate:date,body:nb,attendees:[...new Set(att)],tasks:(old&&old.tasks)||[],share:(old&&old.share)||{units:[],teams:[],people:[]}};
  const ch=[];if(old){if(old.mdate!==row.mdate||ob.stime!==nb.stime||ob.etime!==nb.etime)ch.push("일시");if(ob.place!==nb.place)ch.push("장소");if(JSON.stringify([...(old.attendees||[])].sort())!==JSON.stringify([...row.attendees].sort()))ch.push("참석자");if(plan&&ob.agenda!==nb.agenda)ch.push("안건");if(old.title!==row.title)ch.push("제목")}
  if(old&&!ch.length&&JSON.stringify(ob.guests||[])===JSON.stringify(nb.guests||[]))return;
  try{const m=await api.meetSave(row,old?("회의 일정에서 고침: "+(ch.join(" · ")||"외부 참석자")):"회의 일정에서 만듦 (예정)");const i=MTG.list.findIndex(x=>x.id===m.id);if(i>=0)MTG.list[i]=m;else MTG.list.unshift(m);meetSeen(m);meetPaint()}
  catch(x){setTimeout(()=>toast("📝 회의록(예정)을 만들지 못했어요: "+((x&&x.hint)||errText(x))),600)}}
setTimeout(()=>{if(st.me)meetLoad()},4000);
setInterval(()=>{if(st.me&&document.visibilityState==="visible")meetLoad()},180000);
/* ---------- 🕐 일시 고르기 (v3.28.0): [날짜] [시간] 두 단추. 업무 창 📅 회의와 회의록 쓰기에서 같이 씀 ----------
   날짜: 달력에서 하루 누르면 바로 닫힘 / 시간: 시 → 분 → 길이(30분 · 1시간 · 1시간 30분 · 2시간). 누를 때마다 바로 반영
   오전 · 오후는 시를 누르면 알아서 (7~11시 오전, 12~6시 오후). 바꾸고 싶을 때만 누름
   숨은 칸(날짜 · 시작 · 끝)에 넣고 input 이벤트를 보냄 → 각 화면의 입력 처리기가 그대로 받음. 고르는 동안은 단추 색만 바꿈(다시 그리지 않음) */
const TPK={p:null,mode:"t",btn:null,pop:null,d:"",s:null,dur:60,ap:null,ym:""};
const TPK_DUR=[[30,"30분"],[60,"1시간"],[90,"1시간 30분"],[120,"2시간"]];
const tpkParse=v=>{if(!v||!/^\d\d?:\d\d/.test(v))return null;let [h,m]=v.split(":").map(Number);m=Math.min(50,Math.round(m/10)*10);return {ap:h<12?"am":"pm",h:h%12||12,m}};
const tpk24=x=>x?`${String((x.h%12)+(x.ap==="pm"?12:0)).padStart(2,"0")}:${String(x.m).padStart(2,"0")}`:"";
const tpkMin=x=>{const v=tpk24(x);return v?+v.slice(0,2)*60+ +v.slice(3):-1};
const tpkOfMin=n=>{n=Math.max(0,Math.min(23*60+50,n));return tpkParse(`${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`)};
const tpkTxt=x=>x?`${x.ap==="am"?"오전":"오후"} ${x.h}:${String(x.m).padStart(2,"0")}`:"";
const tpkDay=d=>d?`${+d.slice(5,7)}/${+d.slice(8,10)}(${"일월화수목금토"[new Date(d+"T00:00").getDay()]})`:"";
function tpkTime(s,e){const a=tpkParse(s),b=tpkParse(e);if(!a)return "";return tpkTxt(a)+(b?" ~ "+(a.ap===b.ap?`${b.h}:${String(b.m).padStart(2,"0")}`:tpkTxt(b)):"")}
function tpkHtml(p,o){const tt=tpkTime(o.s,o.e),dd=tpkDay(o.d);
  return `<span class="tpk-two">${o.date?`<button type="button" class="tpk-btn${dd?"":" empty"}" id="${p}-tpkd" data-tpk="${p}" data-tpk-mode="d" aria-haspopup="dialog"><span class="tpk-ic" aria-hidden="true">📅</span><span class="tpk-l">${esc(dd||"날짜")}</span></button>`:""}<button type="button" class="tpk-btn${tt?"":" empty"}" id="${p}-tpk" data-tpk="${p}" data-tpk-mode="t" aria-haspopup="dialog"><span class="tpk-ic" aria-hidden="true">🕐</span><span class="tpk-l">${esc(tt||"시간")}</span></button></span>${o.date?`<input type="hidden" id="${p}-d" ${o.da||""} value="${esc(o.d||"")}">`:""}<input type="hidden" id="${p}-s" ${o.sa||""} value="${esc(o.s||"")}"><input type="hidden" id="${p}-e" ${o.ea||""} value="${esc(o.e||"")}">`}
function tpkOpen(btn){tpkClose();const p=btn.dataset.tpk,mode=btn.dataset.tpkMode||"t",sv=$(p+"-s").value,ev=$(p+"-e").value,s=tpkParse(sv),e=tpkParse(ev);
  Object.assign(TPK,{p,mode,btn,d:$(p+"-d")?$(p+"-d").value:"",s,ap:s?s.ap:null,apSet:false,dur:s&&e&&tpkMin(e)>tpkMin(s)?tpkMin(e)-tpkMin(s):60});TPK.ym=(TPK.d||todayKey).slice(0,7);
  const pop=document.createElement("div");pop.className="tpk-pop "+(mode==="d"?"is-d":"is-t");pop.setAttribute("role","dialog");pop.setAttribute("aria-label",mode==="d"?"날짜 고르기":"시간 고르기");
  pop.innerHTML=mode==="d"?`<div class="tpk-ch"><button type="button" class="tpk-nav" data-tpkm="-1" aria-label="이전 달">‹</button><b class="tpk-ym"></b><button type="button" class="tpk-nav" data-tpkm="1" aria-label="다음 달">›</button></div><div class="tpk-wk">${"일월화수목금토".split("").map(x=>`<span>${x}</span>`).join("")}</div><div class="tpk-days"></div>`
   :`<div class="tpk-top"><div class="tpk-seg"><i class="tpk-ind" aria-hidden="true"></i><button type="button" data-tpkap="am">오전</button><button type="button" data-tpkap="pm">오후</button></div></div>
    <div class="tpk-rw"><span class="tpk-k">시</span><div class="tpk-hrs">${[1,2,3,4,5,6,7,8,9,10,11,12].map(h=>`<button type="button" data-tpkh="${h}">${h}</button>`).join("")}</div></div>
    <div class="tpk-rw"><span class="tpk-k">분</span><div class="tpk-mns">${[0,10,20,30,40,50].map(m=>`<button type="button" data-tpkn="${m}">${String(m).padStart(2,"0")}</button>`).join("")}</div></div>
    <div class="tpk-rw"><span class="tpk-k">길이</span><div class="tpk-durs">${TPK_DUR.map(([n,l])=>`<button type="button" data-tpku="${n}">${l}</button>`).join("")}</div></div>
    <div class="tpk-sum"><b class="tpk-out"></b><button type="button" class="tpk-clr" data-tpka="clear">지우기</button><button type="button" class="btn sm primary" data-tpka="ok">완료</button></div>`;
  document.body.appendChild(pop);TPK.pop=pop;pop.addEventListener("click",tpkClick);btn.setAttribute("aria-expanded","true");
  if(mode==="d")tpkCal();else tpkPaint();tpkPlace();requestAnimationFrame(()=>pop.classList.add("in"))}
function tpkPlace(){const pop=TPK.pop,b=TPK.btn;if(!pop||!b)return;if(innerWidth<700){pop.classList.add("sheet");return}
  const r=b.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight;let top=r.bottom+6;if(top+h>innerHeight-8&&r.top-h-6>8)top=r.top-h-6;top=Math.max(8,Math.min(top,innerHeight-h-8));
  pop.style.top=top+"px";pop.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+"px"}
function tpkCal(){const box=TPK.pop.querySelector(".tpk-days");if(!box)return;const [y,mo]=TPK.ym.split("-").map(Number),f=new Date(y,mo-1,1),n=new Date(y,mo,0).getDate(),k=d=>`${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  TPK.pop.querySelector(".tpk-ym").textContent=`${y}년 ${mo}월`;
  box.innerHTML="<span></span>".repeat(f.getDay())+Array.from({length:n},(_,i)=>{const d=k(i+1),wd=(f.getDay()+i)%7;return `<button type="button" data-tpkd="${d}" class="${d===todayKey?"td ":""}${wd===0?"sun ":wd===6?"sat ":""}${d===TPK.d?"on":""}">${i+1}</button>`}).join("")}
function tpkPaint(){const pop=TPK.pop;if(!pop||TPK.mode!=="t")return;const x=TPK.s,ap=x?x.ap:TPK.ap;
  const sg=pop.querySelector(".tpk-seg");sg.classList.toggle("pm",ap==="pm");sg.classList.toggle("none",!ap);
  pop.querySelectorAll("[data-tpkap]").forEach(b=>b.classList.toggle("on",ap===b.dataset.tpkap));
  pop.querySelectorAll("[data-tpkh]").forEach(b=>b.classList.toggle("on",!!x&&x.h===+b.dataset.tpkh));
  pop.querySelectorAll("[data-tpkn]").forEach(b=>b.classList.toggle("on",!!x&&x.m===+b.dataset.tpkn));
  pop.querySelectorAll("[data-tpku]").forEach(b=>b.classList.toggle("on",TPK.dur===+b.dataset.tpku));
  const o=pop.querySelector(".tpk-out");o.textContent=x?tpkTime(tpk24(x),tpk24(tpkOfMin(tpkMin(x)+TPK.dur))):"시를 눌러 주세요";o.classList.toggle("dim",!x)}
// 숨은 칸에 넣고 단추 글자 바꾸기
function tpkApply(){const p=TPK.p,set=(id,v)=>{const el=$(id);if(el&&el.value!==v){el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}))}};
  if(TPK.mode==="d"){set(p+"-d",TPK.d);const b=$(p+"-tpkd");if(b){b.classList.toggle("empty",!TPK.d);b.querySelector(".tpk-l").textContent=tpkDay(TPK.d)||"날짜";b.removeAttribute("aria-invalid")}return}
  const sv=tpk24(TPK.s),ev=TPK.s?tpk24(tpkOfMin(tpkMin(TPK.s)+TPK.dur)):"";set(p+"-s",sv);set(p+"-e",ev);
  const b=$(p+"-tpk");if(b){const tt=tpkTime(sv,ev);b.classList.toggle("empty",!tt);b.querySelector(".tpk-l").textContent=tt||"시간"}}
const tpkGuess=h=>h>=7&&h<=11?"am":"pm";   // 회사 시간대: 7~11시는 오전, 12~6시는 오후
function tpkClick(e){const t=e.target.closest("button");if(!t)return;
  if(t.dataset.tpkm){const [y,m]=TPK.ym.split("-").map(Number),d=new Date(y,m-1+(+t.dataset.tpkm),1);TPK.ym=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;tpkCal();return}
  if(t.dataset.tpkd){TPK.d=t.dataset.tpkd;tpkCal();tpkApply();setTimeout(()=>{tpkClose();const nb=$(TPK.p+"-tpk");if(nb)nb.focus()},120);return}
  if(t.dataset.tpkap){TPK.ap=t.dataset.tpkap;TPK.apSet=true;if(TPK.s)TPK.s.ap=TPK.ap;tpkPaint();tpkApply();return}
  if(t.dataset.tpkh){const h=+t.dataset.tpkh;if(TPK.s)TPK.s.h=h;else TPK.s={ap:"am",h,m:0};TPK.s.ap=TPK.apSet?TPK.ap:tpkGuess(h);TPK.ap=TPK.s.ap;tpkPaint();tpkApply();return}
  if(t.dataset.tpkn){if(!TPK.s)TPK.s={ap:TPK.ap||"am",h:10,m:0};TPK.s.m=+t.dataset.tpkn;tpkPaint();tpkApply();return}
  if(t.dataset.tpku){TPK.dur=+t.dataset.tpku;tpkPaint();tpkApply();return}
  const a=t.dataset.tpka;if(a==="clear"){TPK.s=null;TPK.ap=null;tpkPaint();tpkApply();return}
  if(a==="ok"){const b=TPK.btn;tpkClose();if(b)b.focus()}}
function tpkClose(){const pop=TPK.pop;if(!pop)return;TPK.pop=null;if(TPK.btn)TPK.btn.setAttribute("aria-expanded","false");pop.classList.remove("in");pop.classList.add("out");setTimeout(()=>pop.remove(),160)}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-tpk]");if(b){e.preventDefault();if(TPK.pop&&TPK.btn===b){tpkClose();return}tpkOpen(b)}});
document.addEventListener("pointerdown",e=>{if(TPK.pop&&!TPK.pop.contains(e.target)&&!(e.target.closest&&e.target.closest("[data-tpk]")))tpkClose()},true);
window.addEventListener("keydown",e=>{if(TPK.pop&&e.key==="Escape"){e.stopPropagation();e.preventDefault();tpkClose()}},true);
window.addEventListener("resize",()=>tpkPlace());document.addEventListener("scroll",e=>{if(TPK.pop&&!TPK.pop.contains(e.target))tpkPlace()},true);
wkFeat("meet",{tpkHtml,meetSaveMode,meetPaint,meetAlertCount,meetAlertsHtml,meetBodyExtra,meetAfterSave,meetTag,meetEditOpen,meetSeen,meetPullTask,meetSkip,meetLoad,meetOpen,meetOn,meetFormOn,meetCollect,meetRsvp,meetAskNo});
