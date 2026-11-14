/* =====================================================================
   📇 명함 (기능 더하기 · v3.30.0 · SQL 25 · 서버 함수 wk-card-read)
   - 전 직원이 기능 더하기에서 각자 켜고 끔. 켜면 내정보 메뉴(휴대폰은 '나' 화면)에 📇 명함
   - 명함 화면(card.js · card.css)은 누를 때만 불러옴 (wkPart). 이 파일은 작게
   - 팀 명함첩: 같은 팀(주 소속)끼리. 관리 계정(팀 없음)은 쓰지 않음
   ===================================================================== */
const cardOn=()=>!!(st.me&&st.me.team_id&&F("modOn","card"));
function cardPaint(){const m=$("miCard");if(m)m.hidden=!cardOn()}
function cardOpen(){if(!cardOn()){toast("🧩 기능 더하기에서 📇 명함을 먼저 켜 주세요");return Promise.resolve()}return wkPart("card").then(()=>openCardPage()).catch(()=>{})}
$("miCard").onclick=()=>{$("userMenu").hidden=true;cardOpen()};
wkFeat("card",{cardPaint,cardOpen});
