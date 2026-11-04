/* rhy:se Weekly Plan — 📱 휴대폰 아래 탭 (feat-mtab.js, v3.17.4)
   휴대폰(폭 720px 이하)에서 머리를 한 줄(이름 · 주 이동)로 줄이고, 자주 누르는 단추를 엄지 닿는 아래로.
   📝 작성 · 💚 점검 · 📄 보고서 · 🔔 알림 · 👤 나   (📣 팀 공지 · 📲 앱 설치 · 🗂️ 내 목록은 👤 나 메뉴 안)
   머리 단추를 숨기는 건 이 파일이 html 에 wk-mtab 을 붙였을 때만 → 이 파일이 고장 나면 예전 머리 그대로 */
const MT_Q=matchMedia("(max-width:720px)");
const MT=[["write","📝","작성"],["review","💚","점검"],["report","📄","보고서"],["alert","🔔","알림"],["me","👤","나"]];
function mtBuild(){if($("mtab"))return;
  const n=document.createElement("nav");n.id="mtab";n.className="mtab";n.setAttribute("aria-label","아래 메뉴");
  n.innerHTML=MT.map(([k,i,l])=>`<button type="button" data-mt="${k}"${k==="me"?' aria-haspopup="menu"':""}><span class="mti" aria-hidden="true">${i}</span><span class="mtl">${l}</span>${k==="alert"||k==="me"?`<i class="mtdot" data-mtdot="${k}" hidden></i>`:""}</button>`).join("");
  document.body.appendChild(n)}
function mtApply(){const on=MT_Q.matches;document.documentElement.classList.toggle("wk-mtab",on);if(on)mtBuild();mtPaint()}
function mtPaint(){const n=$("mtab");if(!n)return;const v=st.view==="review"?"review":"write";
  n.querySelectorAll("[data-mt]").forEach(b=>b.setAttribute("aria-current",(b.dataset.mt===v)?"page":"false"));
  const d1=n.querySelector('[data-mtdot="alert"]'),d2=n.querySelector('[data-mtdot="me"]');
  if(d1)d1.hidden=WKF.alertPaint?$("alertN").hidden:$("noticeDot").hidden;if(d2)d2.hidden=$("userDot").hidden&&$("noticeDot").hidden;
  n.hidden=!st.me||!$("authScreen").hidden}
function mtMenu(){const m=$("userMenu"),bar=$("mtab");if(!m.hidden){m.hidden=true;return}
  m.hidden=false;const r=bar.getBoundingClientRect();
  m.style.left=Math.max(8,innerWidth-m.offsetWidth-8)+"px";m.style.top=Math.max(8,r.top-m.offsetHeight-8)+"px";m.classList.add("mtup");
  const f=m.querySelector("button:not([hidden])");if(f)f.focus()}
document.addEventListener("click",e=>{const b=e.target.closest("#mtab [data-mt]");if(!b)return;e.stopPropagation();const k=b.dataset.mt;
  if(k!=="me")$("userMenu").hidden=true;
  if(k==="write")$("tab-write").click();else if(k==="review")$("tab-review").click();
  else if(k==="report")$("reportBtn").click();else if(k==="alert")(WKF.alertPaint?$("alertBtn"):$("noticeBtn")).click();else mtMenu();
  setTimeout(mtPaint,30)},true);
$("miLists").onclick=()=>{$("userMenu").hidden=true;$("openSettings").click()};
$("miTeamNotice").onclick=()=>{$("userMenu").hidden=true;$("noticeBtn").click()};
// 상태가 바뀌면 아래 탭도 따라 (작성/점검 · 빨간 점 · 로그인 화면)
const mtObs=new MutationObserver(()=>mtPaint());
["tab-write","noticeDot","userDot","authScreen","alertN"].forEach(id=>{const el=$(id);if(el)mtObs.observe(el,{attributes:true,attributeFilter:["hidden","aria-selected"]})});
(MT_Q.addEventListener?MT_Q.addEventListener("change",mtApply):MT_Q.addListener(mtApply));
mtApply();
// 📖 사용법
wkGuideAdd("mtab",{
  member:[{after:"m2",sec:["x-mtab","휴대폰에서는 아래 메뉴",[
    ["p","휴대폰에서는 위쪽은 **팀 이름 · 주 이동** 한 줄만 두고, 자주 누르는 단추를 **화면 아래**에 모았습니다."],
    ["img","g24_mobile","휴대폰 화면 — 위는 한 줄, 아래 메뉴"],
    ["ul",["**📝 작성 · 💚 점검**: 업무 쓰기와 점검 화면","**📄 보고서 · 🔔 알림**: 보고서와 나에게 온 알림 모아 보기","**👤 나**: 📣 팀 공지 · 📢 전체 공지 · 🗂️ 내 목록 · 🧩 기능 더하기 · 💬 의견 보내기 · 💾 내 일정 내려받기 · 📲 앱 설치 · 비밀번호 · 사용법 · 로그아웃"]]]]}]});
wkFeat("mtab",{mtPaint});
