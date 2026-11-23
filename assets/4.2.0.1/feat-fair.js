/* =====================================================================
   📐 FAIR 성적서 (v4.2.0 · 고객품질팀 전용)
   - 관리자가 회사 기능에서 켜고 팀을 고르면(기본 고객품질팀) 그 팀원(🔀 겸직 포함)과 관리자에게만 내정보 메뉴에 보임
   - 누르면 FAIR/index.html 을 화면 가득 띄우고, 로그인한 사람 정보(이름 · 팀)를 건네줌
   - 도면은 브라우저 안에서만 처리 (서버에 저장 · 업로드 없음). 이 파일은 작게
   ===================================================================== */
// 관리자가 ⚙ 관리 › 🏢 회사 › 🧩 회사 기능에서 켜고, 열어 줄 팀을 고름 (wk_company.modules.fair · fair_teams, 바꾸기는 관리자만)
const FAIR_DEFAULT="고객품질팀";
const fairMods=()=>(typeof CO!=="undefined"&&CO&&CO.modules)||{};
const fairTeamIds=()=>{const l=fairMods().fair_teams;if(Array.isArray(l)&&l.length)return l;
  return (st.teams||[]).filter(t=>String(t.name||"").replace(/\s/g,"")===FAIR_DEFAULT).map(t=>t.id)};
const fairTeam=()=>{if(!st.me)return "";const ok=new Set(fairTeamIds());const id=[st.me.team_id,st.me.extra_team].find(x=>x&&ok.has(x));return id?teamName(id):""};
const fairOn=()=>!!(st.me&&fairMods().fair&&(fairTeam()||st.me.is_admin));   // 꺼져 있으면 아무도(관리자도) 안 보임
function fairPaint(){const m=$("miFair");if(m)m.hidden=!fairOn()}
function fairClose(){const o=$("fairOv");if(o)o.remove();document.documentElement.classList.remove("fair-open")}
function fairOpen(){
  if(!fairOn()){toast(fairMods().fair?"📐 FAIR 성적서는 관리자가 열어 준 팀만 쓸 수 있어요":"📐 FAIR 성적서가 꺼져 있어요. 관리자에게 요청하세요");return}
  F("useMark","fair");fairClose();
  if(!$("fairCss")){const s=document.createElement("style");s.id="fairCss";
    s.textContent=".fair-ov{position:fixed;inset:0;z-index:90;background:#fff;display:flex;flex-direction:column}.fair-bar{display:flex;align-items:center;gap:10px;padding:8px 14px;background:#10201D;color:#F4F7F6;font:600 14px 'IBM Plex Sans KR',sans-serif}.fair-bar b{flex:1}.fair-bar button{min-height:36px;padding:0 14px;border-radius:8px;border:1px solid rgba(244,247,246,.3);background:transparent;color:inherit;font:inherit;cursor:pointer}.fair-ov iframe{flex:1;border:0;width:100%}html.fair-open,html.fair-open body{overflow:hidden}";
    document.head.append(s)}
  const o=document.createElement("div");o.id="fairOv";o.className="fair-ov";o.setAttribute("role","dialog");o.setAttribute("aria-label","FAIR 성적서");
  o.innerHTML='<div class="fair-bar"><b>📐 FAIR 성적서</b><button type="button" id="fairX">닫기</button></div><iframe id="fairFrame" title="FAIR 성적서" src="FAIR/index.html?v='+APP_VERSION+'"></iframe>';
  document.body.append(o);document.documentElement.classList.add("fair-open");
  $("fairX").onclick=fairClose;
}
// FAIR 화면 ↔ rhy:se: 준비되면 로그인한 사람 정보를 보내고, 성적서를 내보내면 알려 줌
window.addEventListener("message",e=>{
  const fr=$("fairFrame");if(!fr||e.source!==fr.contentWindow||e.origin!==location.origin)return;
  const d=e.data||{};if(d.source!=="fair")return;
  if(d.type==="rhyse:module-ready"){
    const team=fairTeam();
    fr.contentWindow.postMessage({type:"rhyse:user",user:{id:st.me.email,name:st.me.name,dept:team||teamName(st.me.team_id)||"",role:st.me.is_admin?"admin":"",modules:fairOn()?["fair"]:[]}},location.origin)}
  else if(d.type==="rhyse:event"&&d.kind==="fair-exported")fairLog(d);
});
// 📖 성적서를 내보내면 내 주간 업무 '오늘 한 일'에 완료로 기록 (같은 날 같은 품번을 다시 내보내면 그 줄을 고침)
async function fairLog(d){
  const sum=`${d.pn||""} 특성 ${d.chars||0}개${d.ng?` · 불합격 ${d.ng}`:""}`;
  if(!st.me||!st.me.team_id||!st.db){toast(`📐 성적서를 저장했어요 · ${sum}`);return}   // 팀이 없는 관리자는 업무를 쓰지 않음
  const pn=String(d.pn||"").trim(),name=String(d.name||"").trim(),now=new Date().toISOString();
  const task=`FAIR 성적서 작성 — ${[pn,name].filter(Boolean).join(" ")||"도면"} (특성 ${d.chars||0}개${d.parts?` · 부품 ${d.parts}개`:""}${d.ng?` · 불합격 ${d.ng}개`:""})`;
  const memo=[d.fairId?`FAIR ID ${d.fairId}`:"",d.review?`확인 필요 ${d.review}건 남기고 저장`:""].filter(Boolean).join(" · ");
  const old=(st.items||[]).find(i=>i.fair&&i.fair.day===todayKey&&i.fair.pn===pn&&i.owner===st.me.name);
  const entry={task,due:todayKey,start:todayKey,status:"완료",memo,writtenAt:now};
  const cats=st.lists&&st.lists.cats||[],cat=cats.find(c=>/검사|품질|FAI/i.test(c))||"";
  let body;
  if(old){const {_id,...rest}=old;body=Object.assign({},rest,{weeks:Object.assign({},old.weeks||{},{[CUR]:Object.assign({},(old.weeks||{})[CUR]||{},entry)}),fair:Object.assign({},old.fair,{at:now}),updatedAt:now})}
  else body={owner:st.me.name,customer:"",project:"FAIR 성적서",part:pn,po:"",vendor:"",category:cat,weeks:{[CUR]:entry},fair:{pn,day:todayKey,at:now},createdAt:now,updatedAt:now};
  try{await st.db.doc("items/"+(old?old._id:newId())).set(body);toast(`📐 성적서를 저장하고 '오늘 한 일'에 ${old?"고쳐 ":""}기록했어요 · ${sum}`)}
  catch(e){toast(`📐 성적서는 저장했지만 업무 기록은 못 했어요 · ${errText(e)}`)}
}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("fairOv")&&document.activeElement===document.body)fairClose()});
$("miFair").onclick=()=>{$("userMenu").hidden=true;fairOpen()};
wkFeat("fair",{fairPaint,fairOpen,fairClose});
