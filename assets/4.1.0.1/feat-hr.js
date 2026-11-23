/* rhy:se Weekly Plan — 👤 인사 담당 (feat-hr.js, v4.1.0 · 서버 30-hr.sql)
   · 내정보 › 👤 인사 담당 지정: 시스템 관리자 · 대표만. 지금 인사 담당 목록 + 🏢 조직도에서 골라 지정 · 빼기 (wk_set_hr)
   · 🔔 인사 담당에게: 팀장이 '👥 팀원 추가'로 새 사람을 넣으면 한 번 알려 줌 (최근 14일, 본 뒤엔 다시 안 뜸)
   · 인사 관리 화면(사람 · 조직도 · 팀 · 🕘 인사 기록)은 admin.js — core 의 ⚙ 관리 메뉴가 인사 담당에게는 '👤 인사 관리'로 보임
   이 파일이 고장 나도 관리 화면 · 주간 업무는 그대로 */
const HR={list:null,news:[],t:0};
const hrMe=()=>st.me&&(st.me.is_admin||st.me.is_registrar);
const hrBoss=()=>st.me&&(st.me.is_admin||(typeof isCeo==="function"&&isCeo()));
function hrPaint(){const b=$("miHR");if(b)b.hidden=!hrBoss();if(hrMe()&&!HR.t){HR.t=1;setTimeout(hrLoadNews,4000)}return true}
/* ---------- 인사 담당 지정 (관리자 · 대표) ---------- */
async function hrOpen(){$("userMenu").hidden=true;let m=$("hrModal");
  if(!m){m=document.createElement("div");m.id="hrModal";m.className="modal hrm";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-labelledby","hrTitle");m.hidden=true;document.body.appendChild(m);
    m.addEventListener("click",hrClick)}
  m.innerHTML=`<div class="mtop"><span class="mtag" id="hrTitle">👤 인사 담당 지정</span><span class="spacer"></span><button class="btn icon" type="button" data-hr="close" aria-label="닫기">✕</button></div><div id="hrBody"><p class="hint">불러오는 중…</p></div>`;
  $("mscrim").hidden=false;m.hidden=false;await hrLoad()}
async function hrLoad(){try{HR.list=await api.hrList()}catch(e){HR.list=null;$("hrBody").innerHTML=`<p class="err">${esc(errText(e))} — 서버에 30-hr.sql 을 실행했는지 확인해 주세요.</p>`;return}hrRender()}
function hrRender(){const L=HR.list||[],b=$("hrBody");if(!b)return;
  b.innerHTML=`<p class="hint" style="margin:6px 0 12px;line-height:1.6">인사 담당은 <b>사람 등록 · 고치기 · 퇴사 처리 · 조직도 · 팀</b>을 맡아요. 회사 설정과 남의 업무 내용은 볼 수 없어요. 정하고 빼는 건 시스템 관리자와 대표만 할 수 있어요.</p>
    <div class="hr-list">${L.length?L.map(p=>`<div class="hr-row"><span class="hr-av">${esc((p.name||"?").slice(0,1))}</span><span class="hr-nm"><b>${esc(p.name)}</b><em>${esc(p.team_name||"")}</em></span><button type="button" class="btn sm ghost" data-hroff="${esc(p.email)}">빼기</button></div>`).join(""):'<p class="hint" style="margin:8px 0">아직 인사 담당이 없어요. 지금은 시스템 관리자만 사람과 조직도를 관리해요.</p>'}</div>
    <div class="mfoot"><button type="button" class="btn" data-hr="pick">🏢 조직도에서 골라 지정</button><span class="spacer"></span><button type="button" class="btn primary" data-hr="close">닫기</button></div>`}
function hrClose(){const m=$("hrModal");if(m)m.hidden=true;if([...document.querySelectorAll(".modal")].every(x=>x.hidden))$("mscrim").hidden=true}
async function hrClick(e){const b=e.target.closest("[data-hr],[data-hroff]");if(!b)return;
  if(b.dataset.hr==="close"){hrClose();return}
  if(b.dataset.hroff){const p=(HR.list||[]).find(x=>x.email===b.dataset.hroff);if(!p||!confirm(`${p.name} 님을 인사 담당에서 뺄까요?`))return;
    try{await api.hrSet(p.email,false);toast(`${p.name} 님을 인사 담당에서 뺐어요`);await hrLoad()}catch(x){toast(errText(x))}return}
  if(b.dataset.hr==="pick"){const r=await F("orgPick",{max:5,have:[],title:"인사 담당 지정"});if(!r||!r.length)return;let ok=0;
    for(const p of r){try{await api.hrSet(p.email,true);ok++}catch(x){toast(`${p.name}: ${errText(x)}`)}}
    if(ok)toast(`${ok}명을 인사 담당으로 정했어요 · 그분은 다시 로그인하면 내정보에 '👤 인사 관리'가 생겨요`);await hrLoad()}}
/* ---------- 🔔 팀장이 팀원을 등록했어요 (인사 담당에게) ---------- */
const hrSeenK=()=>"wk-hr-seen-"+(st.me?st.me.email:"");
async function hrLoadNews(){if(!hrMe()||!api.hrLog)return;try{const seen=+(localStorage.getItem(hrSeenK())||0),L=await api.hrLog(seen),lim=Date.now()-14*864e5;
  HR.news=L.filter(x=>x.kind==="add"&&x.detail&&x.detail.by_leader&&new Date(x.at).getTime()>lim);F("alertPaint")}catch(_){HR.news=[]}}
function hrAlertCount(){return hrMe()?HR.news.length:0}
function hrAlertsHtml(){if(!hrMe()||!HR.news.length)return "";const L=HR.news;
  return `<div class="walr k-hr"><span class="wlv">👤 인사</span><button type="button" class="wtx" data-hrgo="1"><b>팀장이 새 팀원을 등록했어요</b> · ${L.slice(0,3).map(x=>`${esc(x.target_name)}${x.detail.team?`(${esc(x.detail.team)})`:""}`).join(", ")}${L.length>3?` 외 ${L.length-3}명`:""}<span class="wsub">${esc(L[0].actor_name||"")} · ${esc(fmtDT(L[0].at))}</span></button><span class="wact"><button type="button" class="btn sm" data-hrgo="1">인사 기록</button><button type="button" class="btn sm ghost" data-hrok="1">확인</button></span></div>`}
function hrSeen(){const top=Math.max(0,...HR.news.map(x=>x.id));if(top)try{localStorage.setItem(hrSeenK(),String(top))}catch(_){}HR.news=[];F("alertPaint")}
document.addEventListener("click",e=>{
  if(e.target.closest("[data-hrok]")){hrSeen();return}
  if(e.target.closest("[data-hrgo]")){hrSeen();F("alertClose");wkPart("admin").then(async()=>{await openAdmin();const t=document.querySelector('#adTabs [data-ad="hrlog"]');if(t)t.click()});return}});
$("miHR")&&($("miHR").onclick=hrOpen);
setInterval(()=>{if(hrMe()&&document.visibilityState==="visible")hrLoadNews()},5*60000);
wkFeat("hr",{hrPaint,hrAlertCount,hrAlertsHtml});
