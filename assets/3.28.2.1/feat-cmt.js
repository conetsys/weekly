/* rhy:se Weekly Plan — 💬 대표 의견 (feat-cmt.js, v3.23.0)
   대표(⚙ 관리 → 조직도 맨 위 대표이사 메일)가 rhy:se 업무 · 팀 보고서에 의견을 남김. 고치기는 없음 (rhy:se 는 "내가 정리하는 내 한 주")
   · 업무: 업무 창 위에 의견 목록 + (대표) 남기기 · 캘린더 · 표 · 목록 · 휴대폰 카드에 💬 표시 · 담당자 🔔 알림
   · 팀 보고서: 보고서 위에 그 주 의견 + (대표) 남기기 · 그 팀 팀장 🔔 알림
   서버: 20-pm-approve.sql 의 wk_cmts (읽기 = 그 팀 · 상급자 · 관리자, 쓰기 = 대표만, 지우기 = 쓴 사람). 이 파일이 고장 나도 주간 업무는 그대로 */
const CM={list:[],loaded:false,busy:false,t:0};
const cmK=()=>"wk-cmt-seen-"+(st.me?st.me.email:"");
const cmSeen=()=>{try{return JSON.parse(localStorage.getItem(cmK())||"{}")}catch(_){return {}}};
const cmSeenSet=k=>{const m=cmSeen();m[k]=new Date().toISOString();try{localStorage.setItem(cmK(),JSON.stringify(m))}catch(_){}};
const cmTeams=()=>[...new Set([...(typeof myTeams==="function"?myTeams():[]),...(st.vteams||[]),st.team].filter(Boolean))];
async function cmLoad(){if(!st.me||CM.busy)return;CM.busy=true;try{CM.list=await api.cmtList(cmTeams());CM.loaded=true}catch(_){}finally{CM.busy=false}
  try{paintNoticeDot()}catch(_){}}
const cmFor=(target,id)=>CM.list.filter(c=>c.target===target&&c.target_id===id).sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));
function cmtTag(it){if(!it)return "";const L=cmFor("item",it._id);if(!L.length)return "";const S=cmSeen(),nw=L.some(c=>c.created_at>(S["i|"+it._id]||""))&&it._email===(st.me&&st.me.email);
  return `<span class="cmttag${nw?" new":""}" title="대표 의견 ${L.length}개">💬${L.length>1?L.length:""}</span>`}
const cmBox=(L,target,id,team)=>{const ceo=typeof isCeo==="function"&&isCeo();if(!L.length&&!ceo)return "";
  return `<div class="cmbox" data-cmtarget="${esc(target)}" data-cmid="${esc(id)}" data-cmteam="${esc(team)}"><div class="cmh"><b>💬 대표 의견</b>${L.length?`<span class="dim">${L.length}개</span>`:""}</div>
    ${L.map(c=>`<div class="cmi"><div class="cmm"><b>${esc(c.author_name||"대표")}</b><span class="dim mono">${esc(fmtDT(c.created_at).slice(2))}</span>${c.author_email===st.me.email?`<button type="button" class="lnk" data-cmdel="${esc(c.id)}">지우기</button>`:""}</div><div class="cmb">${esc(c.body)}</div></div>`).join("")}
    ${ceo?`<div class="cmin"><textarea maxlength="2000" rows="2" placeholder="대표 의견을 남겨요 (${target==="item"?"담당자":"팀장"}에게 🔔 알림 · 내용은 본인이 고쳐요)"></textarea><button type="button" class="btn sm primary" data-cmsend="1">남기기</button></div>`:""}</div>`};
// 업무 창: 기존 업무를 열면 위쪽에 대표 의견
function cmtEditOpen(it){let n=$("cmFromBox");if(!it){if(n)n.hidden=true;return}
  const html=cmBox(cmFor("item",it._id),"item",it._id,it._team||st.team);
  if(!html){if(n)n.hidden=true;return}
  if(!n){n=document.createElement("div");n.id="cmFromBox";const fm=$("form"),pm=$("pmFromNote");fm.insertBefore(n,pm&&pm.parentNode===fm?pm.nextSibling:fm.firstChild)}
  n.hidden=false;n.innerHTML=html;if(it._email===st.me.email)cmSeenSet("i|"+it._id)}
// 팀 보고서 · 확정 보고: 위쪽에 그 주 대표 의견
function rpAfter(tab,W){if(tab==="mine")return;const b=$("rpBody");if(!b)return;const id=st.team+"|"+W,html=cmBox(cmFor("report",id),"report",id,st.team);if(!html)return;
  const d=document.createElement("div");d.className="cmrp";d.innerHTML=html;b.insertBefore(d,b.firstChild);if(isMyTeam(st.team))cmSeenSet("r|"+id)}
// 🔔 알림: 내 업무에 달린 새 대표 의견 · (팀장) 우리 팀 보고서에 달린 새 대표 의견
function cmNews(){if(!st.me)return [];const S=cmSeen(),me=st.me.email;if(!S.c0){cmSeenSet("c0");S.c0=new Date().toISOString()}
  const mine=new Set(st.items.filter(i=>i._email===me).map(i=>i._id)),lead=st.me.role==="leader";
  return CM.list.filter(c=>c.author_email!==me&&c.created_at>S.c0&&(c.target==="item"?mine.has(c.target_id)&&c.created_at>(S["i|"+c.target_id]||""):lead&&c.team_id===st.me.team_id&&c.created_at>(S["r|"+c.target_id]||"")))}
function cmtAlertCount(){return cmNews().length}
function cmtAlertsHtml(){return cmNews().map(c=>{const it=c.target==="item"&&st.items.find(i=>i._id===c.target_id),wk=c.target==="report"?c.target_id.split("|")[1]:"";
  const sub=it?`${esc(it.project||"")} · ${esc(((it.weeks||{})[st.week]||{}).task||"")}`:`${esc(teamName(c.team_id))} 팀 보고서 · ${wk?esc(md(wk)):""} 주`;
  return `<div class="walr k-share"><span class="wlv">💬</span><button type="button" class="wtx" data-cmgo="${esc(c.target)}|${esc(c.target_id)}"><b>대표 의견 · ${esc(c.author_name||"")}</b> · ${esc(c.body.slice(0,60))}<span class="wsub">${sub}</span></button><span class="wact"><button type="button" class="btn sm" data-cmgo="${esc(c.target)}|${esc(c.target_id)}">보기</button></span></div>`}).join("")}
document.addEventListener("click",async e=>{
  const g=e.target.closest("[data-cmgo]");if(g){F("alertClose");const [t,...r]=g.dataset.cmgo.split("|"),id=r.join("|");
    if(t==="item"){cmSeenSet("i|"+id);if(st.items.some(i=>i._id===id))setTimeout(()=>openDrawer(id),0)}else{cmSeenSet("r|"+id);const b=$("reportBtn");if(b)b.click()}paintNoticeDot();return}
  const sd=e.target.closest("[data-cmsend]");if(sd){const box=sd.closest(".cmbox"),ta=box.querySelector("textarea"),body=ta.value.trim();if(!body){ta.focus();return}sd.disabled=true;
    const row={id:"cm"+newId(),team_id:box.dataset.cmteam,target:box.dataset.cmtarget,target_id:box.dataset.cmid,body,author_email:st.me.email,author_name:st.me.name};
    try{await api.cmtAdd(row);CM.list.unshift(Object.assign({created_at:new Date().toISOString()},row));ta.value="";box.outerHTML=cmBox(cmFor(row.target,row.target_id),row.target,row.target_id,row.team_id);toast("💬 대표 의견을 남겼어요");try{render()}catch(_){}}
    catch(x){sd.disabled=false;toast((x&&x.hint)||errText(x))}return}
  const dl=e.target.closest("[data-cmdel]");if(dl){const box=dl.closest(".cmbox");try{await api.cmtDel(dl.dataset.cmdel);CM.list=CM.list.filter(c=>c.id!==dl.dataset.cmdel);box.outerHTML=cmBox(cmFor(box.dataset.cmtarget,box.dataset.cmid),box.dataset.cmtarget,box.dataset.cmid,box.dataset.cmteam);try{render()}catch(_){}}catch(x){toast((x&&x.hint)||errText(x))}return}});
// 처음 한 번 + 2분마다
setTimeout(()=>{if(st.me)cmLoad()},2500);
setInterval(()=>{if(st.me&&document.visibilityState==="visible")cmLoad()},120000);
wkGuideAdd("cmt",{
  faq:[["업무에 💬 대표 의견이 달렸어요","대표(조직도 맨 위 대표이사)가 남긴 의견입니다. 업무를 열면 맨 위에 보이고 🔔 알림으로도 옵니다. 대표는 의견만 남기고, 업무 내용은 담당자 본인이 고칩니다."]]});
wkFeat("cmt",{cmtTag,cmtEditOpen,rpAfter,cmtAlertCount,cmtAlertsHtml});
