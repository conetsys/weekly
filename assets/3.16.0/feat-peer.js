/* rhy:se Weekly Plan — 👥 팀원끼리 일정 보기 (feat-peer.js, v3.16.0)
   팀장이 팀 단위로 켜고 끔 (기본 켜짐). 꺼지면 팀원은 내 업무만 봄. 본인 · 팀장 · 상위 조직장 · 관리자는 그대로
   바꾸면 팀 공지가 자동으로 올라감 (서버 wk_set_peer_view). 진짜 가리기는 서버 규칙(12-peer-share.sql)이 함
   core.js 다음에 읽힘. core는 F("peerLimit"), F("peerPaint")로만 부르고, 이 파일이 고장 나면 이 기능만 꺼짐 */
const peerTeam=()=>st.teams.find(t=>t.id===(st.me&&st.me.team_id))||null;
const peerOff=t=>!!(t&&t.features&&t.features.peer_off);
// 지금 화면에서 '내 업무만' 보여야 하는지 (팀원 · 내 팀 · 그 팀이 꺼짐)
function peerLimit(){const m=st.me;if(!m||m.is_admin||m.role==="leader")return false;if(st.team!==m.team_id||(st.vteams||[]).includes(st.team))return false;return peerOff(peerTeam())}
function peerPaint(){const m=st.me,b=$("miPeer");if(!m||!b)return;const on=m.role==="leader"&&!m.is_admin&&!!m.team_id;b.hidden=!on;if(on)$("miPeerS").textContent=peerOff(peerTeam())?"꺼짐":"켜짐";
  return true}
function openPeer(){
  const off=peerOff(peerTeam());
  $("acTag").textContent="👥 팀원끼리 일정 보기";$("acTitle").textContent=`${teamName(st.me.team_id)} 팀원끼리 일정 보기`;$("acErr").hidden=true;
  $("acBody").innerHTML=`<p class="hint" style="margin:0 0 10px">팀원끼리 서로의 업무를 볼 수 있게 할지 정합니다. <b>본인 · 팀장 · 상위 조직장은 언제나 봅니다.</b> 고치는 것은 지금처럼 담당자 본인만 합니다.</p>
    <div class="peeropts" role="radiogroup" aria-label="팀원끼리 일정 보기">
      <label class="peeropt"><input type="radio" name="peerv" value="on"${off?"":" checked"}><span><b>켜기</b><small>팀원끼리 서로의 업무가 보입니다 (기본)</small></span></label>
      <label class="peeropt"><input type="radio" name="peerv" value="off"${off?" checked":""}><span><b>끄기</b><small>팀원은 자기 업무만 봅니다</small></span></label>
    </div>
    <p class="hint" style="margin:10px 0 0">바꾸면 <b>📣 팀 공지</b>로 팀원에게 자동으로 알려집니다.</p>`;
  $("acOk").hidden=false;$("acOk").textContent="저장";$("acOk").dataset.peer="1";
  $("mscrim").hidden=false;$("acctModal").hidden=false}
$("miPeer").onclick=()=>{$("userMenu").hidden=true;openPeer()};
// 공통 창(acctModal)의 저장 단추: 팀원 추가(feat-account)와 같이 쓰므로 붙잡아서 먼저 처리
$("acOk").addEventListener("click",async e=>{
  if($("acOk").dataset.peer!=="1")return;e.stopImmediatePropagation();
  const v=($("acBody").querySelector('[name="peerv"]:checked')||{}).value;const on=v!=="off";
  if(on===!peerOff(peerTeam())){$("acCancel").click();return}
  $("acOk").disabled=true;
  try{await api.setPeerView(on);try{st.teams=await api.teams()}catch(_){}$("acCancel").click();toast(on?"팀원끼리 일정 보기를 켰어요. 팀 공지로 알렸어요":"팀원끼리 일정 보기를 껐어요. 팀 공지로 알렸어요");peerPaint();refresh();loadNotice()}
  catch(x){$("acErr").textContent=(x&&x.hint)||errText(x);$("acErr").hidden=false}
  finally{$("acOk").disabled=false}},true);
["acCancel","acClose"].forEach(id=>$(id).addEventListener("click",()=>{delete $("acOk").dataset.peer}));
// 📖 사용법
wkGuideAdd("peer",{
  leader:[{after:"l1",sec:["x-peer","팀원끼리 일정 보기",[
    ["p","팀원끼리 서로의 업무를 볼 수 있게 할지 팀장이 정합니다. 처음에는 켜져 있습니다. 끄더라도 팀장 · 상위 조직장은 그대로 보고, 팀원은 자기 업무만 봅니다."],
    ["img","g19_peer","내정보 ▾ → 👥 팀원끼리 일정 보기"],
    ["ol",["**내정보 ▾ → 👥 팀원끼리 일정 보기**를 누릅니다. 오른쪽에 지금 상태(켜짐 · 꺼짐)가 보입니다.","**켜기** 또는 **끄기**를 고르고 **저장**을 누릅니다.","팀원에게 **📣 팀 공지**로 자동으로 알려집니다."]],
    ["tip","우리 팀 분위기에 맞게 정하세요. 바꿀 때마다 팀원에게 공지가 가니, 몰래 바뀌는 일은 없습니다."]]]}],
  faq:[["다른 팀원의 일정이 안 보여요","팀장이 '팀원끼리 일정 보기'를 꺼 둔 팀입니다. 내 업무는 그대로 보이고, 고치는 데는 영향이 없습니다. 📣 팀 공지에서 안내를 확인하세요."]]});
wkFeat("peer",{peerLimit,peerPaint});
