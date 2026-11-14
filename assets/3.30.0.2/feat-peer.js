/* rhy:se Weekly Plan — 👥 팀원끼리 일정 보기 (feat-peer.js, v3.16.0)
   팀장이 팀 단위로 켜고 끔 (기본 켜짐). 꺼지면 팀원은 내 업무만 봄. 본인 · 팀장 · 상위 조직장 · 관리자는 그대로
   켜고 끄기는 🧩 기능 더하기 맨 위 '우리 팀 설정'(팀장만). 바꾸면 팀 공지가 자동으로 올라감 (서버 wk_set_peer_view). 진짜 가리기는 서버 규칙(12-peer-share.sql)이 함
   core.js 다음에 읽힘. core는 F("peerLimit"), F("peerPaint")로만 부르고, 이 파일이 고장 나면 이 기능만 꺼짐 */
const peerTeam=()=>st.teams.find(t=>t.id===(st.me&&st.me.team_id))||null;
const peerOff=t=>!!(t&&t.features&&t.features.peer_off);
// 지금 화면에서 '내 업무만' 보여야 하는지 (팀원 · 내 팀 · 그 팀이 꺼짐)
function peerLimit(){const m=st.me;if(!m||m.is_admin||m.role==="leader")return false;if(st.team!==m.team_id||(st.vteams||[]).includes(st.team))return false;return peerOff(peerTeam())}
function peerPaint(){return true}   // v3.16.0: 켜고 끄기는 🧩 기능 더하기 맨 위 '우리 팀 설정'(팀장)으로 옮김
const peerCan=()=>!!st.me&&st.me.role==="leader"&&!st.me.is_admin&&!!st.me.team_id;
// 🧩 기능 더하기 맨 위 카드 (팀장에게만)
function peerModCard(){if(!peerCan())return "";const on=!peerOff(peerTeam());
  return `<div class="modc team${on?" on":""}"><div class="modi">👥</div><div class="modb"><b>팀원끼리 일정 보기</b><p>팀원끼리 서로의 업무를 볼지 정해요. 팀장 · 상위 조직장은 언제나 봐요.</p><span class="hint" style="margin:0">바꾸면 📣 팀 공지로 팀원에게 알려져요</span></div>
    <label class="modt"><span class="switch"><input type="checkbox" data-peer="1"${on?" checked":""}><i></i></span><span>${on?"켜짐":"꺼짐"}</span></label></div>`}
document.addEventListener("change",async e=>{const x=e.target;if(!x.matches||!x.matches('[data-peer]'))return;const on=x.checked;x.disabled=true;
  try{await api.setPeerView(on);try{st.teams=await api.teams()}catch(_){}toast(on?"👥 팀원끼리 일정 보기를 켰어요. 팀 공지로 알렸어요":"👥 팀원끼리 일정 보기를 껐어요. 팀 공지로 알렸어요");F("openMods");refresh();loadNotice()}
  catch(err){x.checked=!on;toast((err&&err.hint)||errText(err))}finally{x.disabled=false}});
// 📖 사용법
wkGuideAdd("peer",{
  leader:[{after:"l1",sec:["x-peer","팀원끼리 일정 보기",[
    ["p","팀원끼리 서로의 업무를 볼 수 있게 할지 팀장이 정합니다. 처음에는 켜져 있습니다. 끄더라도 팀장 · 상위 조직장은 그대로 보고, 팀원은 자기 업무만 봅니다."],
    ["img","g19_peer","내정보 ▾ → 🧩 기능 더하기 → 👥 우리 팀 설정"],
    ["ol",["**내정보 ▾ → 🧩 기능 더하기**를 누릅니다. 팀장에게는 맨 위에 **👥 우리 팀 설정**이 보입니다.","**팀원끼리 일정 보기** 스위치를 켜거나 끕니다. 바로 적용됩니다.","팀원에게 **📣 팀 공지**로 자동으로 알려집니다."]],
    ["tip","우리 팀 분위기에 맞게 정하세요. 바꿀 때마다 팀원에게 공지가 가니, 몰래 바뀌는 일은 없습니다."]]]}],
  faq:[["다른 팀원의 일정이 안 보여요","팀장이 '팀원끼리 일정 보기'를 꺼 둔 팀입니다. 내 업무는 그대로 보이고, 고치는 데는 영향이 없습니다. 📣 팀 공지에서 안내를 확인하세요."]]});
wkFeat("peer",{peerLimit,peerPaint,peerModCard});
