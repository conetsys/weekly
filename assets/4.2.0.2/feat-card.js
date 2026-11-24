/* =====================================================================
   📇 명함 (기능 더하기 · v3.30.0 · SQL 25 · 서버 함수 wk-card-read)
   - 전 직원이 기능 더하기에서 각자 켜고 끔. 켜면 내정보 메뉴(휴대폰은 '나' 화면)에 📇 명함
   - 명함 화면(card.js · card.css)은 누를 때만 불러옴 (wkPart). 이 파일은 작게
   - 보는 범위: 내 것은 나 · 팀장은 팀원 것 · 본부장은 아래 팀 · 대표 · 관리자는 전체 (SQL 25). 찍기는 팀이 있는 사람만, 관리자는 보기만
   ===================================================================== */
const cardOn=()=>!!(st.me&&(st.me.team_id||st.me.is_admin||(st.vteams||[]).length)&&F("modOn","card"));   // 팀이 없어도 본부장 · 대표(보는 팀이 있음) · 관리자는 보기
function cardPaint(){const m=$("miCard");if(m)m.hidden=!cardOn()}
function cardOpen(){if(!cardOn()){toast("🧩 기능 더하기에서 📇 명함을 먼저 켜 주세요");return Promise.resolve()}F("useMark","card");return wkPart("card").then(()=>openCardPage()).catch(()=>{})}
$("miCard").onclick=()=>{$("userMenu").hidden=true;cardOpen()};
wkFeat("card",{cardPaint,cardOpen});
