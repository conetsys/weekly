/* rhy:se Weekly Plan — 🔑 계정 (feat-account.js, v3.15.0)
   · 로그인 화면 '비밀번호를 잊었어요' → 관리자에게 초기화 요청 (요청만으로는 아무것도 안 바뀜)
   · admin: 내정보 ▾ → 🔑 비밀번호 초기화 요청 (빨간 점) → 0426 으로 초기화 / 무시
   · 팀장: 내정보 ▾ → 👥 팀원 추가 (자기 팀에 '팀원'만. 고치기 · 퇴사 · 초기화는 admin)
   core.js 다음에 읽힘. core는 F("acctPaint")로만 부르고, 이 파일이 고장 나면 이 기능만 꺼짐 */
const ACC={reqs:[]};
const domOf=()=>{try{return typeof MAIL_DOMAIN!=="undefined"?MAIL_DOMAIN:""}catch(_){return ""}};
const toEmail=v=>{v=String(v||"").trim().toLowerCase();return !v?"":v.includes("@")?v:v+"@"+domOf()};
/* ---------- 로그인 화면: 비밀번호를 잊었어요 ---------- */
$("liForgot").onclick=()=>{const b=$("liForgotBox"),open=b.hidden;b.hidden=!open;$("liForgot").setAttribute("aria-expanded",open);$("lfDom").textContent=domOf()?"@"+domOf():"";
  if(open){$("lf-id").value=$("li-email")?$("li-email").value:"";$("lfMsg").textContent="";setTimeout(()=>$("lf-id").focus(),30)}};
$("lf-id").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("lfSend").click()}});
$("lfSend").onclick=async()=>{
  const em=toEmail($("lf-id").value);if(!em||!em.includes("@")){$("lfMsg").textContent="아이디를 넣어 주세요.";$("lf-id").focus();return}
  $("lfSend").disabled=true;
  try{await api.requestPin(em);$("lfMsg").textContent="✓ 요청했어요. 관리자가 초기화하면 연락드려요. 그때 0426으로 로그인하세요."}
  catch(e){$("lfMsg").textContent="요청하지 못했어요. 잠시 뒤 다시 해 주세요."}
  finally{setTimeout(()=>{$("lfSend").disabled=false},4000)}};
/* ---------- 공통 창 ---------- */
function acOpen(tag,title,body,okText){$("acTag").textContent=tag;$("acTitle").textContent=title;$("acBody").innerHTML=body;$("acErr").hidden=true;
  $("acOk").hidden=!okText;$("acOk").textContent=okText||"";$("mscrim").hidden=false;$("acctModal").hidden=false}
function acClose(){$("acctModal").hidden=true;$("mscrim").hidden=true;ACC.mode=""}
$("acClose").onclick=acClose;$("acCancel").onclick=acClose;
const acErr=m=>{$("acErr").textContent=m;$("acErr").hidden=!m};
/* ---------- admin: 비밀번호 초기화 요청 ---------- */
async function acctLoadReqs(){if(!st.me||!st.me.is_admin){ACC.reqs=[];return}try{ACC.reqs=await api.pinRequests()}catch(_){ACC.reqs=[]}acctPaint()}
function acctPaint(){
  const m=st.me;if(!m)return;
  $("miAddMember").hidden=!(m.role==="leader"&&!m.is_admin&&m.team_id);
  $("miPinReq").hidden=!m.is_admin;const n=ACC.reqs.length;$("miPinReqN").hidden=!n;$("miPinReqN").textContent=n?`${n}건`:"";
  if(m.is_admin&&n){const d=$("userDot");if(d)d.hidden=false}
  return true}
function paintReqs(){
  const fmt=t=>{try{const d=new Date(t);return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`}catch(_){return ""}};
  $("acBody").innerHTML=ACC.reqs.length?`<p class="hint" style="margin:0 0 8px">로그인 화면에서 '비밀번호를 잊었어요'로 들어온 요청이에요. <b>본인이 맞는지 확인한 뒤</b> 초기화하고, 바로 로그인해서 바꾸라고 연락해 주세요. 초기화하면 처음 비밀번호 <b>0426</b>이 돼요.</p>
    <div class="acreqs">${ACC.reqs.map(r=>`<div class="acreq"><span><b>${esc(r.email)}</b><span class="hint" style="margin:0"> · ${fmt(r.created_at)} 요청</span></span>
      <span class="acbtns"><button type="button" class="btn sm primary" data-acr="reset" data-em="${esc(r.email)}">0426으로 초기화</button><button type="button" class="btn sm ghost" data-acr="drop" data-em="${esc(r.email)}">무시</button></span></div>`).join("")}</div>`
    :`<div class="nempty">들어온 요청이 없어요.</div>`}
async function openReqs(){ACC.mode="reqs";acOpen("🔑 비밀번호","비밀번호 초기화 요청","<div class='nempty'>불러오는 중…</div>","");await acctLoadReqs();paintReqs()}
$("acBody").addEventListener("click",async e=>{const b=e.target.closest("[data-acr]");if(!b)return;const em=b.dataset.em;b.disabled=true;
  try{if(b.dataset.acr==="reset"){await api.resetPin(em);toast(`${em} 을(를) 0426으로 초기화했어요. 본인에게 바로 연락해 주세요`)}
    await api.delPinRequest(em);ACC.reqs=ACC.reqs.filter(r=>r.email!==em);paintReqs();acctPaint();paintNoticeDot()}
  catch(x){b.disabled=false;acErr(x&&x.message||errText(x))}});
$("miPinReq").onclick=()=>{$("userMenu").hidden=true;openReqs()};
/* ---------- 팀장: 팀원 추가 ---------- */
function addRowHtml(i){return `<div class="acrow" data-i="${i}"><input class="acn" placeholder="이름" aria-label="이름" autocomplete="off"><span class="acid"><input class="ace" placeholder="아이디" aria-label="아이디 (회사 메일 앞부분)" autocomplete="off"><span>@${esc(domOf())}</span></span></div>`}
function openAddMember(){
  ACC.mode="add";
  acOpen("👥 팀원 추가",`${teamName(st.me.team_id)}에 팀원 추가`,`<p class="hint" style="margin:0 0 8px">우리 팀에 <b>팀원</b>으로 추가돼요. 처음 비밀번호는 <b>0426</b>이고, 처음 로그인할 때 바꿔요. 이름 · 소속 고치기와 퇴사는 관리자에게 요청하세요.</p>
    <div id="acRows">${addRowHtml(0)}</div><button type="button" class="btn sm ghost" id="acMore">+ 한 명 더</button>`,"추가");
  setTimeout(()=>{const n=$("acRows").querySelector(".acn");n&&n.focus()},30)}
$("acBody").addEventListener("click",e=>{if(e.target.id==="acMore"){const r=$("acRows");r.insertAdjacentHTML("beforeend",addRowHtml(r.children.length));r.lastElementChild.querySelector(".acn").focus()}});
$("acOk").onclick=async()=>{
  if(ACC.mode!=="add")return;
  const rows=[...$("acRows").querySelectorAll(".acrow")].map(r=>({name:r.querySelector(".acn").value.trim(),id:r.querySelector(".ace").value.trim()})).filter(r=>r.name||r.id);
  if(!rows.length){acErr("이름과 아이디를 넣어 주세요.");return}
  const bad=rows.find(r=>!r.name||!r.id||!/^[a-z0-9._-]+$/i.test(r.id.replace(/@.*/,"")));if(bad){acErr("이름과 아이디(영문 · 숫자 · . _ -)를 모두 넣어 주세요.");return}
  let unit=null;try{const us=await api.units();const u=(us||[]).find(x=>x.team_id===st.me.team_id);if(u)unit=u.id}catch(_){}
  const recs=rows.map(r=>Object.assign({email:toEmail(r.id),name:r.name,team_id:st.me.team_id,role:"member"},unit?{unit_id:unit}:{}));
  $("acOk").disabled=true;
  try{await api.addPeople(recs);acClose();toast(`${recs.map(r=>r.name).join(", ")}님을 추가했어요. 처음 비밀번호 0426으로 로그인하면 돼요`);refresh()}
  catch(x){acErr(/23505|duplicate/.test(String(x&&(x.code||x.message)))?"이미 등록된 아이디가 있어요. 아이디를 확인해 주세요.":(x&&x.hint)||errText(x))}
  finally{$("acOk").disabled=false}};
$("miAddMember").onclick=()=>{$("userMenu").hidden=true;openAddMember()};
// admin 이면 들어올 때 요청 확인 (1분마다 한 번 더)
setInterval(()=>{if(st.me&&st.me.is_admin&&document.visibilityState==="visible")acctLoadReqs()},60000);
// 📖 사용법
wkGuideAdd("account",{
  member:[{after:"m1",sec:["x-forgot","비밀번호를 잊었을 때",[
    ["img","g17_forgot","로그인 화면 — 비밀번호를 잊었어요"],
    ["ol",["로그인 화면에서 **비밀번호를 잊었어요**를 누릅니다.","아이디를 넣고 **초기화 요청**을 누릅니다. 관리자에게 알림이 갑니다.","관리자가 초기화했다고 연락하면, 처음 비밀번호 **0426**으로 로그인해서 바로 새 비밀번호를 정합니다."]],
    ["tip","초기화된 뒤에는 0426을 아는 누구나 들어올 수 있으니, 연락을 받으면 **바로** 로그인해서 바꿔 주세요."]]]}],
  leader:[{after:"l1",sec:["x-addmember","팀원 추가하기",[
    ["p","새로 온 사람은 팀장이 바로 우리 팀에 추가할 수 있습니다. 이름 · 소속 고치기, 퇴사, 비밀번호 초기화는 관리자가 합니다."],
    ["img","g18_addmember","내정보 ▾ → 👥 팀원 추가"],
    ["ol",["**내정보 ▾ → 👥 팀원 추가**를 누릅니다.","**이름**과 **아이디**(회사 메일 앞부분)를 넣습니다. 여러 명이면 **+ 한 명 더**를 누릅니다.","**추가**를 누릅니다. 새 팀원에게 처음 비밀번호 **0426**으로 로그인하라고 알려 주세요."]]]]}],
  faq:[["비밀번호 초기화는 누가 하나요?","관리자(admin)만 합니다. 로그인 화면의 '비밀번호를 잊었어요'로 요청하면 관리자에게 알림이 갑니다."]]});
wkFeat("account",{acctPaint,acctLoadReqs});
