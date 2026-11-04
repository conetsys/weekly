/* rhy:se Weekly Plan — 📱 휴대폰 간단 화면 (feat-lite.js)
   기능 더하기에서 켠 사람만, 640px 이하에서 캘린더 하나로 가볍게 (검색·필터·보기 바꾸기·상태 숫자 숨김). 모양은 app.css 'wk-lite' 부분
   core.js 다음에 읽힘. core는 F("함수 이름")로만 부르고, 이 파일이 고장 나면 이 기능만 꺼짐.
   맨 끝 wkFeat(...) 에 등록한 함수만 바깥(core)에서 씀 */
const LITE_MQ=matchMedia("(max-width:640px)");
const isLite=()=>LITE_MQ.matches&&!!F("modOn","lite");
function liteApply(){
  const on=isLite();document.documentElement.classList.toggle("wk-lite",on);
  if(st.me&&$("userName"))$("userName").textContent=on?st.me.name:`내정보 - ${st.me.name}`;
  if(on){if(!st.liteOn){st.deskLayout=st.layout;st.liteOn=true}st.layout="month";if(st.q||st.cat!=="전체"||st.cust!=="전체"||st.status){st.q="";st.cat="전체";st.cust="전체";st.status=null;const q=$("q");if(q)q.value=""}st.moreOpen=false}
  else if(st.liteOn){st.liteOn=false;st.layout=st.deskLayout||store.get("wk-layout")||st.layout}
}
(LITE_MQ.addEventListener?LITE_MQ.addEventListener.bind(LITE_MQ,"change"):LITE_MQ.addListener.bind(LITE_MQ))(()=>{if(st.me)render()});
// 📖 사용법
wkGuideAdd("lite",{mod:"lite",
  member:[{after:"x-wait",sec:["x-lite","휴대폰 간단 화면",[
    ["p","휴대폰에서 일정만 빠르게 보고 넣는 분을 위한 화면입니다. 켜면 휴대폰에서는 캘린더 하나만 보입니다. PC는 그대로입니다."],
    ["img","g16_lite","휴대폰 간단 화면"],
    ["ul",["검색 · 필터 · 보기 바꾸기 · 상태 숫자를 숨기고, 위쪽도 세 줄로 줄였습니다.","날짜를 누르면 그날 업무가 아래에 나오고, **+ 이날 업무 추가**로 바로 씁니다.","📲 앱 설치는 내정보 ▾ 메뉴 안에 있습니다.","PC나 넓은 화면으로 열면 원래 쓰던 보기로 돌아갑니다."]]]]}]});
wkFeat("lite",{isLite,liteApply});
