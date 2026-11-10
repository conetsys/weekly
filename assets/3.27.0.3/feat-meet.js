/* rhy:se Weekly Plan — 📝 팀 회의록 · 연결 부분 (feat-meet.js, v3.27.0)
   회의록 화면 자체(meet.js · meet.css)는 📝 회의록을 누를 때만 불러옴 (wkPart). 이 파일은 작게:
   · 팀 설정 스위치(팀장, 🧩 기능 더하기 → 우리 팀 설정) · 보고서 옆 📝 회의록 단추(우리 팀이 켰을 때)
   · 회의록 목록 · 코멘트 · 가져감 불러오기 (3분마다) → 🔔 알림 · '📝 회의에서 나온 일' 한 줄
   · 할 일 → rhy:se 가져오기 (업무 창을 미리 채워 열고, 저장하면 가져감 기록 · 📝 꼬리표)
   팀이 안 켰어도 참석자 · 담당자로 들어간 회의록은 알림 · 한 줄에서 열 수 있음. 이 파일이 고장 나도 업무 화면은 그대로 */
const MTG={list:[],cmts:[],pulls:[],loaded:false,busy:false,off:false,carry:null,justCarried:null};
const mtTeamOn=id=>{const t=(st.teams||[]).find(x=>x.id===id);return !!(t&&t.features&&t.features.meet)};
const meetOn=()=>!!st.me&&!st.me.is_admin&&(mtTeamOn(st.me.team_id)||mtTeamOn(st.me.extra_team));
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
  try{const L=await api.meetList();if(L===null){MTG.off=true;return}MTG.list=L;const ids=L.slice(0,200).map(m=>m.id);[MTG.cmts,MTG.pulls]=await Promise.all([api.meetCmts(ids),api.meetPulls(ids)]);MTG.loaded=true}
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
    if(m.author_email!==me&&(m.members||[]).includes(me)&&!s.r){const n=(m.tasks||[]).filter(t=>String(t.owner_email||"").toLowerCase()===me).length;out.push({m,k:"new",at:m.updated_at,txt:`<b>${esc(m.author_name||"")} 님이 회의록에 넣었어요</b> · ${esc(m.title)}${n?` · 내 할 일 ${n}건`:""}`})}
    if(!mem&&(((m.share||{}).people)||[]).map(x=>String(x).toLowerCase()).includes(me)&&!s.r)out.push({m,k:"ref",at:m.updated_at,txt:`<b>${esc(m.author_name||"")} 님이 회의록에 참조로 넣었어요</b> · ${esc(m.title)}`});
    if(mem){const c=MTG.cmts.filter(c=>c.meeting_id===m.id&&String(c.author_email).toLowerCase()!==me&&(!s.c||c.created_at>s.c));if(c.length)out.push({m,k:"cmt",at:c[c.length-1].created_at,txt:`<b>💬 코멘트 ${c.length}개</b> · ${esc(m.title)} — ${esc(c[c.length-1].author_name||"")}: ${esc(c[c.length-1].body.slice(0,40))}`})}}
  for(const x of mtChanged())out.push({m:x.m,k:"chg",at:x.m.updated_at,txt:`<b>가져간 할 일이 ${x.t?"바뀌었어요":"회의록에서 빠졌어요"}</b> · ${esc(x.m.title)} — ${esc(x.t?x.t.task:(x.p.task&&x.p.task.task)||"")} (내 업무는 그대로라 필요하면 직접 고쳐 주세요)`});
  return out.sort((a,b)=>String(b.at||"").localeCompare(String(a.at||"")))}
function meetAlertCount(){return mtNews().length}
function meetAlertsHtml(){return mtNews().map(x=>`<div class="walr k-share"><span class="wlv">📝</span><button type="button" class="wtx" data-mtgo="${esc(x.m.id)}">${x.txt}<span class="wsub">${esc(fmtDT(x.at))}</span></button><span class="wact"><button type="button" class="btn sm" data-mtgo="${esc(x.m.id)}">보기</button></span></div>`).join("")}
// 회의록을 열면 '봤음' (meet.js 가 부름)
function meetSeen(m){if(!m)return;const me=mtMe(),last=MTG.cmts.filter(c=>c.meeting_id===m.id).map(c=>c.created_at).sort().pop();
  mtSeenSet(s=>{const o=s[m.id]||{};o.r=m.rev;if(last)o.c=last;const x=o.x||{};for(const p of MTG.pulls)if(p.meeting_id===m.id&&String(p.email).toLowerCase()===me){const t=(m.tasks||[]).find(y=>y.id===p.task_id);x[p.task_id]=t?mtTaskKey(t):"(빠짐)"}o.x=x;s[m.id]=o});
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
async function meetAfterSave(id,body){const c=MTG.justCarried;MTG.justCarried=null;if(!c||!body||!body.from_meet)return;
  const row={meeting_id:c.from_meet.mid,task_id:c.from_meet.tid,email:mtMe(),item_id:id,task:c._t};
  try{await api.meetPull(row);MTG.pulls=MTG.pulls.filter(p=>!(p.meeting_id===row.meeting_id&&p.task_id===row.task_id&&String(p.email).toLowerCase()===row.email)).concat([row]);meetPaint();F("alertPaint");if(window.meetPageRefresh)meetPageRefresh()}catch(_){}}
// '안 가져옴' (한 줄 · 알림에서 다시 안 뜨게)
async function meetSkip(m,t){const row={meeting_id:m.id,task_id:t.id,email:mtMe(),item_id:null,task:{task:t.task||"",start:t.start||"",due:t.due||""}};
  await api.meetPull(row);MTG.pulls=MTG.pulls.filter(p=>!(p.meeting_id===row.meeting_id&&p.task_id===row.task_id&&String(p.email).toLowerCase()===row.email)).concat([row]);meetPaint();F("alertPaint")}
function meetTag(it){const f=it&&it.from_meet;return f?`<span class="pmtag" title="회의록에서 가져온 할 일 · ${esc(f.title||"")} (${esc(f.mdate||"")}) — 가져온 뒤엔 회의록과 따로 움직여요">📝</span>`:""}
function meetEditOpen(it){let n=$("mtFromNote");const f=(it&&it.from_meet)||(MTG.carry&&MTG.carry.from_meet);
  if(!f){if(n)n.hidden=true;return}
  if(!n){n=document.createElement("div");n.id="mtFromNote";n.className="pm-from";const fm=$("form");fm.insertBefore(n,fm.firstChild)}
  n.hidden=false;n.innerHTML=`<b>📝 회의록에서 가져온 할 일</b><span>${esc(f.title||"")} · ${esc(f.mdate||"")}</span><span class="dim">여기서 자유롭게 고쳐요. 회의록은 바뀌지 않아요.</span>`}
// 🧩 기능 더하기 → 우리 팀 설정 (팀장)
function meetModCard(){if(!st.me||st.me.role!=="leader"||st.me.is_admin||!st.me.team_id||MTG.off)return "";const on=mtTeamOn(st.me.team_id);
  return `<div class="modc team${on?" on":""}"><div class="modi">📝</div><div class="modb"><b>회의록</b><p>누구나 회의록을 쓰고 참석자를 넣으면 그 사람에게 공유돼요. 회의에서 나온 할 일은 담당자가 직접 rhy:se 계획으로 가져가요.</p><span class="hint" style="margin:0">켜면 우리 팀 모두에게 보고서 옆 📝 회의록이 보이고, 📣 팀 공지로 알려져요</span></div>
    <label class="modt"><span class="switch"><input type="checkbox" data-mtteam="1"${on?" checked":""}><i></i></span><span>${on?"켜짐":"꺼짐"}</span></label></div>`}
document.addEventListener("change",async e=>{const x=e.target;if(!x.matches||!x.matches("[data-mtteam]"))return;const on=x.checked;x.disabled=true;
  try{await api.setTeamMeet(on);try{st.teams=await api.teams()}catch(_){}meetPaint();toast(on?"📝 회의록을 켰어요. 팀 공지로 알렸어요":"📝 회의록을 껐어요. 팀 공지로 알렸어요");F("openMods");loadNotice()}
  catch(err){x.checked=!on;toast((err&&err.hint)||errText(err))}finally{x.disabled=false}});
setTimeout(()=>{if(st.me)meetLoad()},4000);
setInterval(()=>{if(st.me&&document.visibilityState==="visible")meetLoad()},180000);
wkFeat("meet",{meetPaint,meetAlertCount,meetAlertsHtml,meetModCard,meetBodyExtra,meetAfterSave,meetTag,meetEditOpen,meetSeen,meetPullTask,meetSkip,meetLoad,meetOpen});
