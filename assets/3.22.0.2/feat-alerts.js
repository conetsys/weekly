/* rhy:se Weekly Plan — 🔔 알림 창 (feat-alerts.js, v3.18.0)
   머리(휴대폰은 아래 메뉴)의 🔔 알림 하나에 모든 알림을 종류 단추 없이 주르륵:
   🤝 Co-work(요청 · 바뀜 · 코멘트 · 함께해요 · 곧 시작) · 📣📢 새 공지 · 💬 내 의견 답변 · 📦 입고·회신 대기
   팀 공지 · 전체 공지 화면은 그대로(공지만). 이 파일이 고장 나면 알림은 예전처럼 📣 팀 공지 안에 보임 */
const AL={open:false};
const alNotices=()=>[...unseenNotices("team").map(n=>({n,t:"📣",lb:"새 팀 공지"})),...unseenNotices("all").map(n=>({n,t:"📢",lb:"새 전체 공지"}))].sort((a,b)=>(b.n.createdAt||"").localeCompare(a.n.createdAt||""));
function alertCount(){return (F("shareAlertCount")||0)+(F("waitAlertCount")||0)+alNotices().length+(F("boardAlertCount")||0)+(F("projAlertCount")||0)}
function alertPaint(){const n=alertCount(),b=$("alertN");if(b){b.hidden=!n;b.textContent=n>99?"99+":n}
  const d=document.querySelector('[data-mtdot="alert"]');if(d)d.hidden=!n;
  if(AL.open)alertRender();return true}
function alertRender(){if(!AL.open)return;const box=$("alList");if(!box)return;
  const a=document.activeElement;if(a&&box.contains(a)&&a.matches("input,textarea"))return;   // 입력 중이면 다시 그리지 않음
  const ns=alNotices().map(x=>`<div class="walr k-note"><span class="wlv">${x.t}</span><button type="button" class="wtx" data-alnote="${esc(x.n.id)}"><b>${x.lb}</b> · ${esc(x.n.title)}<span class="wsub">${esc(fmtDT(x.n.createdAt))}</span></button><span class="wact"><button type="button" class="btn sm" data-alnote="${esc(x.n.id)}">보기</button></span></div>`).join("");
  const html=FS("shareAlertsHtml")+ns+FS("projAlertsHtml")+FS("boardAlertsHtml")+FS("waitAlertsHtml");
  box.innerHTML=html.trim()?html:`<div class="nempty">새 알림이 없어요. 오늘도 좋은 흐름이에요.</div>`;return true}
function alertOpen(){AL.open=true;$("userMenu").hidden=true;alertRender();$("mscrim").hidden=false;$("alertModal").hidden=false;$("alertModal").scrollTop=0;setTimeout(()=>$("alClose").focus({preventScroll:true}),30)}
function alertClose(){if(!AL.open)return;AL.open=false;$("alertModal").hidden=true;if($("noticeModal").hidden&&$("acctModal").hidden&&$("modsModal").hidden)$("mscrim").hidden=true;return true}
$("alertBtn").hidden=false;$("alertBtn").onclick=alertOpen;$("alClose").onclick=alertClose;$("alOk").onclick=alertClose;
$("mscrim").addEventListener("click",()=>{if(AL.open)alertClose()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&AL.open){e.stopPropagation();alertClose()}},true);
// 알림 안에서 다른 화면으로 가는 단추는 알림 창을 먼저 닫음
document.addEventListener("click",e=>{if(!AL.open||!e.target.closest("#alertModal"))return;
  const nb=e.target.closest("[data-alnote]");if(nb){const n=notices.find(x=>x.id===nb.dataset.alnote);alertClose();if(n)openNotice([n],false);return}
  if(e.target.closest('[data-wa="open"],[data-shopen],[data-shthr],[data-shout],[data-fbopen],[data-pjopen]'))alertClose()},true);
// 📖 사용법
wkGuideAdd("alerts",{
  member:[{after:"m2",sec:["x-alerts","🔔 알림 한곳에서 보기",[
    ["p","나에게 온 알림은 위쪽(휴대폰은 아래 메뉴)의 **🔔 알림**에 모두 모입니다. 숫자가 붙어 있으면 새 알림이 있다는 뜻입니다."],
    ["img","g22_alerts","🔔 알림 — 종류 구분 없이 한 목록"],
    ["ul",["🤝 Co-work 요청 · 바뀐 계획 · 코멘트 · 함께해요","📣 📢 아직 안 읽은 공지","💬 내 의견에 달린 답변","📦 입고·회신 대기 (날짜가 다가오면)"]],
    ["tip","알림 안의 단추(받음 · 보기 · 확인)로 바로 처리합니다. 📣 팀 공지 · 📢 전체 공지는 공지만 모아 봅니다. 오른쪽 아래 안내 창을 닫아도 알림 목록에는 남습니다."]]]}]});
wkFeat("alerts",{alertPaint,alertRender,alertClose,alertCount});
