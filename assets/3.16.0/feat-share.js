/* rhy:se Weekly Plan — 📌 내 계획 알리기 (feat-share.js, v3.16.0)
   '시키는 것'이 아니라 '알려 두는 것'. 내 업무 계획을 다른 사람(다른 팀 포함, 업무 하나에 최대 3명)에게 참고로 알림
   · 받는 사람: 캘린더에 흐린 📌 참고 일정 + '📌 받은 계획' 보기. 그 사람 업무가 아님 (기한 지남 · 미룸 · 지킴률 · 보고서에 안 들어감)
     함께하려면 [내 업무로 가져오기] → 그때부터 자기 계획. [이 날이 더 좋아요] 한 줄 제안 · [목록에서 빼기]
   · 보낸 사람: '봤어요'와 받은 사람의 제안만 보임 (가져갔는지 · 했는지는 안 보임 — 따질 거리를 만들지 않음)
   · 알림은 처음 한 번 + 시작 3일 전 한 번
   서버: 12-peer-share.sql (wk_shares · wk_directory). core는 F("share…")로만 부르고, 이 파일이 고장 나면 이 기능만 꺼짐 */
const SH={list:[],dir:null,sel:[],note:"",open:false,take:null,tab:"in",sug:null};
const SH_MAX=3,SH_NOTE0="이 일정으로 진행하려 합니다. 함께해 주시면 좋겠습니다";
const shMe=()=>st.me?st.me.email:"";
const shHome=()=>!!st.me&&!!st.me.team_id&&st.team===st.me.team_id;
const shEnd=s=>(s.data&&(s.data.due||s.data.start))||"";
const shHide=()=>new Set((st.me&&st.me.my_lists&&Array.isArray(st.me.my_lists.shareHide))?st.me.my_lists.shareHide:[]);
const shTaken=()=>new Set(st.items.filter(isMine).map(i=>i.share_from).filter(Boolean));
const shIn=()=>SH.list.filter(s=>s.to_email===shMe());
const shOut=()=>SH.list.filter(s=>s.from_email===shMe());
const shNew=s=>!s.seen_at||(s.changed_at&&s.changed_at>s.seen_at);
// 지금 살아 있는 받은 계획: 빼지 않았고 날짜가 안 지난 것
const shActiveIn=()=>{const h=shHide();return shIn().filter(s=>!h.has(s.id)&&shEnd(s)>=todayKey)};
const shRange=d=>d.start&&d.start!==d.due?`${shortDate(d.start)}~${shortDate(d.due)}`:shortDate(d.due||d.start);
const shDay=t=>{try{return keyOf(new Date(t))}catch(_){return ""}};
async function shareLoad(){
  if(!st.me||!st.me.team_id){SH.list=[];shareBtnPaint();return}
  try{SH.list=(await api.shares())||[]}catch(_){SH.list=[]}
  shareBtnPaint();paintNoticeDot();
  if(st.layout==="share"&&st.view!=="review")renderShare();
  if(!$("noticeModal").hidden&&ntScope==="team"&&ntMode==="board")fillBoard()}
function shareBtnPaint(){const b=$("shareBtn");if(!b)return;
  const a=shActiveIn(),o=shOut().filter(s=>shEnd(s)>=todayKey),un=a.filter(shNew).length;
  b.hidden=!(shHome()&&(a.length||o.length||st.layout==="share"));
  b.firstChild.textContent=a.length||!o.length?"📌 받은 계획":"📌 보낸 계획";
  $("shareN").hidden=!(un||a.length);$("shareN").textContent=un?`새 ${un}`:a.length?a.length:"";$("shareN").classList.toggle("new",!!un);return true}
/* ---------- 받은 계획 · 보낸 계획 보기 ---------- */
function inRow(s,taken){const d=s.data||{},nw=shNew(s),chg=s.changed_at&&s.seen_at&&s.changed_at>s.seen_at;
  return `<div class="shr${taken?" taken":""}" data-sh="${esc(s.id)}">
    <div class="shh"><b>${esc(d.from_name||s.from_email)}</b><span class="dim">${esc(d.from_team||"")}</span>${nw&&!chg?'<span class="shnew">새로</span>':""}${chg?'<span class="shchg">계획이 바뀌었어요</span>':""}</div>
    <div class="sht"><span class="mono shd">${esc(shRange(d))}</span><b>${esc(d.task||"")}</b></div>
    <div class="shs">${[d.customer,d.project,d.part].filter(Boolean).map(esc).join(" · ")}</div>
    ${d.note?`<div class="shnote">“${esc(d.note)}”</div>`:""}
    ${s.hint?`<div class="shhint">🗓 내가 남긴 제안: <b>${esc(shortDate(s.hint.d))}</b>${s.hint.note?` · ${esc(s.hint.note)}`:""}</div>`:""}
    <div class="sha">${taken?'<span class="shok">✓ 내 업무로 가져왔어요</span>':`<button type="button" class="btn sm primary" data-sha="take">내 업무로 가져오기</button><button type="button" class="btn sm" data-sha="sug">이 날이 더 좋아요</button><button type="button" class="btn sm ghost" data-sha="hide">목록에서 빼기</button>`}</div>
    <div class="shsug" hidden><label>좋은 날 <input type="date" class="shsd" value="${esc(d.start||d.due||"")}"></label><input type="text" class="shsn" maxlength="80" placeholder="한 줄 (예: 오전은 회의가 있어 오후가 좋습니다)" aria-label="한 줄 메모"><button type="button" class="btn sm primary" data-sha="sugsend">보내기</button></div>
  </div>`}
function renderShare(){
  const h=shHide(),tk=shTaken(),me=shMe();
  const ins=shIn().filter(s=>!h.has(s.id)).sort((a,b)=>(a.data.start||a.data.due||"").localeCompare(b.data.start||b.data.due||""));
  const upIn=ins.filter(s=>shEnd(s)>=todayKey),pastIn=ins.filter(s=>shEnd(s)<todayKey);
  const outs=shOut(),groups={};outs.forEach(s=>{(groups[s.item_id]=groups[s.item_id]||[]).push(s)});
  const gl=Object.values(groups).sort((a,b)=>(shEnd(b[0])||"").localeCompare(shEnd(a[0])||""));
  const hintN=outs.filter(s=>s.hint&&!s.hint_seen_at).length;
  const inHtml=`${upIn.length?upIn.map(s=>inRow(s,tk.has(s.id))).join(""):`<div class="nempty">알려 온 계획이 없어요.</div>`}
    ${pastIn.length?`<details class="shpast"><summary>지난 계획 ${pastIn.length}건</summary>${pastIn.map(s=>inRow(s,tk.has(s.id))).join("")}</details>`:""}`;
  const outHtml=gl.length?gl.map(g=>{const d=g[0].data||{},past=shEnd(g[0])<todayKey;return `<div class="shr out${past?" past":""}">
      <div class="sht"><span class="mono shd">${esc(shRange(d))}</span><b>${esc(d.task||"")}</b></div>
      <div class="shs">${[d.customer,d.project,d.part].filter(Boolean).map(esc).join(" · ")}</div>
      <div class="shto">${g.map(s=>`<div class="shtor"><span><b>${esc(s.data.to_name||s.to_email)}</b> <span class="dim">${esc(s.data.to_team||"")}</span></span><span class="${s.seen_at?"shseen":"dim"}">${s.seen_at?"✓ 봤어요":"아직 안 봤어요"}</span>${s.hint?`<span class="shhint">🗓 ${esc(shortDate(s.hint.d))}이 더 좋다고 했어요${s.hint.note?` · ${esc(s.hint.note)}`:""}${s.hint_seen_at?"":' <b class="shnew">새로</b>'}</span>`:""}</div>`).join("")}</div>
      <div class="sha"><button type="button" class="btn sm ghost" data-shedit="${esc(g[0].item_id)}">업무 열기</button></div></div>`}).join(""):`<div class="nempty">아직 알린 계획이 없어요. 업무 창의 <b>📌 내 계획 알리기</b>에서 알릴 수 있어요.</div>`;
  if(!upIn.length&&!pastIn.length&&gl.length&&SH.tab==="in"&&!SH.tabSet)SH.tab="out";
  $("shareView").innerHTML=`<div class="shwrap">
    <div class="shtop"><div class="tabs shtabs" role="tablist" aria-label="받은 계획 · 보낸 계획"><button type="button" class="tab" role="tab" data-shtab="in" aria-selected="${SH.tab==="in"}">받은 계획 <span class="cnt">${upIn.length}</span></button><button type="button" class="tab" role="tab" data-shtab="out" aria-selected="${SH.tab==="out"}">보낸 계획${hintN?` <b class="shnew">제안 ${hintN}</b>`:""}</button></div>
      <p class="hint">${SH.tab==="in"?"다른 사람이 <b>참고로</b> 알려 온 계획이에요. 내 업무가 아니니 부담 갖지 마세요. 함께하고 싶을 때만 가져오면 돼요.":"내가 알린 계획이에요. 받은 사람이 <b>봤는지</b>와 남긴 제안만 보여요."}</p></div>
    <div class="shlist">${SH.tab==="in"?inHtml:outHtml}</div></div>`;
  // 본 것으로 표시 (보낸 사람에게 '봤어요')
  const now=new Date().toISOString();
  if(SH.tab==="in")ins.filter(shNew).forEach(s=>{s.seen_at=now;api.updShare(s.id,{seen_at:now}).catch(()=>{})});
  else outs.filter(s=>s.hint&&!s.hint_seen_at).forEach(s=>{s.hint_seen_at=now;api.updShare(s.id,{hint_seen_at:now}).catch(()=>{})});
  setTimeout(()=>{shareBtnPaint();paintNoticeDot()},50);return true}
$("shareView").addEventListener("click",async e=>{
  const t=e.target.closest("[data-shtab]");if(t){SH.tab=t.dataset.shtab;SH.tabSet=true;renderShare();return}
  const ed=e.target.closest("[data-shedit]");if(ed){const it=st.items.find(i=>i._id===ed.dataset.shedit);if(it)openDrawer(it._id);else toast("이 업무는 이번 화면에 없어요 (지웠거나 다른 주)");return}
  const b=e.target.closest("[data-sha]");if(!b)return;const row=b.closest("[data-sh]"),s=SH.list.find(x=>x.id===row.dataset.sh);if(!s)return;const k=b.dataset.sha;
  if(k==="take"){takeShare(s);return}
  if(k==="sug"){const f=row.querySelector(".shsug");f.hidden=!f.hidden;if(!f.hidden)f.querySelector(".shsn").focus();return}
  if(k==="sugsend"){const dd=row.querySelector(".shsd").value,nt=row.querySelector(".shsn").value.trim();if(!dd){row.querySelector(".shsd").focus();return}
    const hint={d:dd,note:nt,at:new Date().toISOString()};b.disabled=true;
    try{await api.updShare(s.id,{hint});s.hint=hint;toast(`${s.data.from_name||"보낸 사람"}님에게 알렸어요. 일정은 그분이 정해요`);renderShare()}catch(x){b.disabled=false;toast(errText(x))}return}
  if(k==="hide"){const h=[...shHide(),s.id].slice(-200);const l=Object.assign({},st.me.my_lists||{},{shareHide:h});
    try{await api.setPrefs(null,l);st.me.my_lists=l;toast("목록에서 뺐어요. 보낸 분에게는 알리지 않아요");renderShare();if(st.layout==="month")render()}catch(x){toast(errText(x))}}});
/* ---------- 내 업무로 가져오기 ---------- */
function takeShare(s){
  if(!shHome()){toast("내 팀 화면에서 가져올 수 있어요");return}
  const d=s.data||{};openDrawer(null,st.me.name);
  setTimeout(()=>{
    const sel=$("f-customer"),cu=d.customer||"";
    if(cu&&![...sel.options].some(o=>o.value===cu)){const o=document.createElement("option");o.value=cu;o.textContent=cu;sel.insertBefore(o,sel.querySelector('option[value="__new"]'))}
    if(cu)sel.value=cu;$("f-customer-new").hidden=true;
    $("f-project").value=d.project||"";$("f-part").value=d.part||"";$("w-task").value=d.task||"";
    if(d.due){$("w-start").value=d.start||"";$("w-due").value=d.due;try{d3Hint("w")}catch(_){}}
    SH.take={id:s.id,by:d.from_name||""};
    const n=$("shareTakeNote");if(n)n.remove();
    $("form").insertAdjacentHTML("afterbegin",`<p class="shtake" id="shareTakeNote">📌 <b>${esc(d.from_name||"")}</b>님 계획에서 가져왔어요. 이제 내 계획이니 날짜 · 내용은 편하게 고치세요. 협력사와 구분을 골라 주세요.</p>`);
  },60)}
function shareBodyExtra(){if(!SH.take)return null;const x={share_from:SH.take.id,share_by:SH.take.by};SH.take=null;return x}
function shareChip(it){return it&&it.share_from?`<div class="shchip" title="다른 사람 계획에서 가져와 내 계획으로 쓴 업무">📌 ${esc(it.share_by||"")}님 계획과 함께</div>`:""}
/* ---------- 업무 창: 📌 내 계획 알리기 ---------- */
async function shDir(){if(SH.dir)return SH.dir;try{SH.dir=((await api.directory())||[]).filter(p=>p.email!==shMe())}catch(_){SH.dir=[]}return SH.dir}
function shareEditOpen(it,ro){
  const n=$("shareTakeNote");if(n)n.remove();SH.take=null;   // 가져오기는 takeShare 가 창을 연 뒤에 다시 정함
  if(ro||!shHome()||!st.me.team_id){$("shareSec").hidden=true;SH.open=false;return true}
  SH.open=true;SH.item=it?it._id:null;
  const ex=it?shOut().filter(s=>s.item_id===it._id):[];
  SH.sel=ex.map(s=>({email:s.to_email,name:s.data.to_name||s.to_email,team:s.data.to_team||""}));SH.note=ex.length?(ex[0].data.note||""):"";
  $("shareSec").hidden=false;paintShareEdit();return true}
function paintShareEdit(){
  const full=SH.sel.length>=SH_MAX;
  $("shareEdit").innerHTML=`<div class="shsel">${SH.sel.map((p,i)=>`<span class="shpick"><b>${esc(p.name)}</b><span class="dim">${esc(p.team)}</span><button type="button" data-shrm="${i}" aria-label="${esc(p.name)} 빼기">✕</button></span>`).join("")}
      ${full?`<span class="hint" style="margin:0">최대 ${SH_MAX}명이에요</span>`:`<span class="shfind"><input type="text" id="shQ" placeholder="이름으로 찾기 (다른 팀도)" autocomplete="off" aria-label="알릴 사람 찾기"><span class="shdd" id="shDD" hidden></span></span>`}</div>
    ${SH.sel.length?`<input type="text" id="shNote" maxlength="80" value="${esc(SH.note)}" placeholder="${esc(SH_NOTE0)}" aria-label="한 줄 메모 (선택)"><p class="hint" style="margin:4px 0 0">받는 분 일정에 <b>참고로만</b>보여요. 그분 업무가 되지 않고, 함께할지는 그분이 정해요.</p>`:""}`}
$("shareEdit").addEventListener("input",async e=>{
  if(e.target.id==="shNote"){SH.note=e.target.value;return}
  if(e.target.id!=="shQ")return;const q=e.target.value.trim(),dd=$("shDD");if(!q){dd.hidden=true;return}
  const dir=await shDir(),have=new Set(SH.sel.map(p=>p.email));
  const hit=dir.filter(p=>!have.has(p.email)&&(p.name.includes(q)||p.email.startsWith(q.toLowerCase())||(p.team_name||"").includes(q))).slice(0,8);
  dd.innerHTML=hit.length?hit.map(p=>`<button type="button" data-shadd="${esc(p.email)}"><b>${esc(p.name)}</b><span class="dim">${esc(p.team_name||"")}</span></button>`).join(""):`<span class="dim" style="padding:6px 10px;display:block">찾는 사람이 없어요</span>`;dd.hidden=false});
$("shareEdit").addEventListener("keydown",e=>{if(e.target.id==="shQ"&&e.key==="Enter"){e.preventDefault();const f=$("shDD").querySelector("[data-shadd]");if(f)f.click()}});
$("shareEdit").addEventListener("click",async e=>{
  const a=e.target.closest("[data-shadd]");if(a){const p=(await shDir()).find(x=>x.email===a.dataset.shadd);if(p&&SH.sel.length<SH_MAX)SH.sel.push({email:p.email,name:p.name,team:p.team_name||""});paintShareEdit();const q=$("shQ");if(q)q.focus();return}
  const r=e.target.closest("[data-shrm]");if(r){SH.sel.splice(+r.dataset.shrm,1);paintShareEdit()}});
async function shareAfterSave(id,body){
  if(!SH.open)return;SH.open=false;
  const ex=shOut().filter(s=>s.item_id===id),want=SH.sel.slice(0,SH_MAX);
  if(!ex.length&&!want.length)return;
  const W=st.week,e=(body.weeks||{})[W]||(body.weeks||{})[nextKey(W)];
  if(!e||!e.due){if(want.length>ex.length)setTimeout(()=>toast("이번주 · 다음주 할일이 있는 업무만 알릴 수 있어요"),400);return}
  const base={from_name:st.me.name,from_team:teamName(st.me.team_id),customer:body.customer||"",project:body.project||"",part:body.part||"",task:e.task||"",start:e.start||e.due||"",due:e.due||"",note:(SH.note||"").trim()};
  const keep=new Set(want.map(p=>p.email));let added=0;
  for(const s of ex){if(!keep.has(s.to_email)){await api.delShare(s.id);continue}
    const o=s.data||{},nd=Object.assign({},base,{to_name:o.to_name,to_team:o.to_team});
    const moved=o.task!==nd.task||o.start!==nd.start||o.due!==nd.due;
    if(moved||o.note!==nd.note||o.project!==nd.project||o.customer!==nd.customer||o.part!==nd.part)await api.updShare(s.id,Object.assign({data:nd},moved?{changed_at:new Date().toISOString()}:{}))}
  const have=new Set(ex.map(s=>s.to_email)),rows=want.filter(p=>!have.has(p.email)).map(p=>({id:"s"+newId(),from_email:shMe(),to_email:p.email,item_id:id,data:Object.assign({},base,{to_name:p.name,to_team:p.team})}));
  if(rows.length){await api.addShares(rows);added=rows.length}
  await shareLoad();
  if(added)setTimeout(()=>toast(`📌 ${rows.map(r=>r.data.to_name).join(", ")}님에게 계획을 알렸어요 (참고로만 보여요)`),400)}
async function shareItemDeleted(id){for(const s of shOut().filter(x=>x.item_id===id)){try{await api.delShare(s.id)}catch(_){}}await shareLoad()}
/* ---------- 캘린더: 흐린 참고 일정 ---------- */
const shOnDay=d=>{const tk=shTaken();return shActiveIn().filter(s=>!tk.has(s.id)&&(s.data.start||s.data.due)<=d&&d<=(s.data.due||s.data.start))};
function shareDayMark(d){if(!shHome())return "";const n=shOnDay(d).length;return n?`<span class="shmark" title="참고로 알려 온 계획 ${n}건">📌${n>1?n:""}</span>`:""}
function shareDayList(d){if(!shHome())return "";return shOnDay(d).map(s=>`<button type="button" class="mitem shref" data-shopen="${esc(s.id)}"><span class="shrt">📌 참고</span><b>${esc(s.data.from_name||"")}님 계획</b> · ${esc(s.data.task||"")}<span class="dim"> ${esc(shRange(s.data))}</span></button>`).join("")}
document.addEventListener("click",e=>{const b=e.target.closest("[data-shopen]");if(!b)return;e.stopPropagation();if(!$("noticeModal").hidden)closeNotice();SH.tab="in";SH.tabSet=true;st.layout="share";render();window.scrollTo({top:0,behavior:"smooth"})},true);
/* ---------- 📣 알림: 새로 알려 온 계획 · 바뀐 계획 · 시작 3일 전 한 번 · 내 계획에 남긴 제안 ---------- */
const SOONK=()=>"wk-shsoon-"+shMe();
const soonAck=()=>{try{return new Set(JSON.parse(localStorage.getItem(SOONK())||"[]"))}catch(_){return new Set()}};
function shAlerts(){if(!shHome())return {nw:[],soon:[],hint:[]};const tk=shTaken(),ack=soonAck();
  const act=shActiveIn().filter(s=>!tk.has(s.id));
  const nw=act.filter(shNew);
  const soon=act.filter(s=>!shNew(s)&&!ack.has(s.id)&&(()=>{const st0=s.data.start||s.data.due,dd=Math.round((parseKey(st0)-parseKey(todayKey))/864e5);return dd>=0&&dd<=3})());
  const hint=shOut().filter(s=>s.hint&&!s.hint_seen_at);
  return {nw,soon,hint}}
function shareAlertCount(){const a=shAlerts();return a.nw.length+a.soon.length+a.hint.length}
function shareAlertsHtml(){const a=shAlerts();if(!a.nw.length&&!a.soon.length&&!a.hint.length)return "";
  const row=(s,txt,act)=>`<div class="walr k-share"><span class="wlv">📌</span><button type="button" class="wtx" data-shopen="${esc(s.id)}">${txt}<span class="wsub">${esc([s.data.customer,s.data.project].filter(Boolean).join(" · "))}</span></button><span class="wact">${act||""}</span></div>`;
  return `<div class="wal"><div class="walh">📌 알려 온 계획 <span>참고로만</span></div>
    ${a.nw.map(s=>row(s,`<b>${esc(s.data.from_name||"")}</b>님이 계획을 알려 왔어요 · ${esc(s.data.task||"")} <span class="mono">${esc(shRange(s.data))}</span>`,`<button type="button" class="btn sm" data-shopen="${esc(s.id)}">보기</button>`)).join("")}
    ${a.soon.map(s=>row(s,`곧 시작하는 <b>${esc(s.data.from_name||"")}</b>님 계획 · ${esc(s.data.task||"")} <span class="mono">${esc(shRange(s.data))}</span>`,`<button type="button" class="btn sm ghost" data-shack="${esc(s.id)}">확인</button>`)).join("")}
    ${a.hint.map(s=>`<div class="walr k-share"><span class="wlv">🗓</span><button type="button" class="wtx" data-shout="1"><b>${esc(s.data.to_name||"")}</b>님이 <b>${esc(shortDate(s.hint.d))}</b>이 더 좋다고 했어요${s.hint.note?` · ${esc(s.hint.note)}`:""}<span class="wsub">내 계획: ${esc(s.data.task||"")} ${esc(shRange(s.data))}</span></button><span class="wact"><button type="button" class="btn sm" data-shout="1">보기</button></span></div>`).join("")}
  </div>`}
document.addEventListener("click",e=>{
  const k=e.target.closest("[data-shack]");if(k){const s_=soonAck();s_.add(k.dataset.shack);try{localStorage.setItem(SOONK(),JSON.stringify([...s_].slice(-200)))}catch(_){}paintNoticeDot();fillBoard();return}
  const o=e.target.closest("[data-shout]");if(o){if(!$("noticeModal").hidden)closeNotice();SH.tab="out";SH.tabSet=true;st.layout="share";render()}});
// 📖 사용법
wkGuideAdd("share",{
  member:[{after:"x-pull",sec:["x-share","내 계획 알리기",[
    ["p","다른 사람(다른 팀도)과 같이 해야 하는 일이 있으면, 내 계획을 **참고로 알려** 둘 수 있습니다. 부탁이지 지시가 아닙니다. 받는 분의 업무가 되지 않고, 함께할지는 그분이 정합니다."],
    ["img","g20_share_form","업무 창 → 📌 내 계획 알리기"],
    ["ol",["업무 창 아래쪽 **📌 내 계획 알리기**에서 이름으로 찾아 고릅니다. 업무 하나에 **최대 3명**입니다.","필요하면 한 줄을 남깁니다. (예: 이 일정으로 진행하려 합니다. 함께해 주시면 좋겠습니다)","**저장**하면 받는 분의 캘린더에 흐린 📌 참고 일정으로 보입니다."]],
    ["ul",["내 날짜를 바꾸면 받는 분에게 '계획이 바뀌었어요'로 보입니다.","나에게는 받은 분이 **봤는지**와 남긴 **제안**만 보입니다. 가져갔는지 · 했는지는 보이지 않습니다."]]]]},
   {after:"x-share",sec:["x-share-in","받은 계획 보기",[
    ["p","누가 계획을 알려 오면 📣 알림에 한 번 뜨고, 캘린더에 흐린 **📌**로 보입니다. **내 업무가 아니니** 기한 지남 · 미룸 · 지킴률 · 보고서에 들어가지 않습니다."],
    ["img","g21_share_list","📌 받은 계획"],
    ["ol",["보기 단추 옆 **📌 받은 계획**을 누릅니다. 받은 것이 있을 때만 보입니다.","함께하려면 **내 업무로 가져오기**를 누릅니다. 고객사 · 사업 · 할일 · 날짜가 채워지고, 그때부터 **내 계획**입니다.","날짜가 안 맞으면 **이 날이 더 좋아요**로 좋은 날과 한 줄을 남깁니다. 일정은 보낸 분이 정합니다.","필요 없으면 **목록에서 빼기**. 보낸 분에게 알리지 않습니다."]],
    ["tip","가져오지 않아도 아무도 따지지 않습니다. 알려 온 계획은 날짜가 지나면 저절로 접힙니다."]]]}],
  faq:[["다른 사람이 알려 온 계획을 꼭 해야 하나요?","아니요. 참고로 알려 온 것이고 내 업무가 아닙니다. 함께할 때만 '내 업무로 가져오기'를 누르세요."],
       ["내 계획을 알리면 상대가 했는지 볼 수 있나요?","아니요. '봤어요'와 상대가 남긴 제안만 보입니다. 알리기는 부탁이지 확인하는 도구가 아닙니다."]]});
wkFeat("share",{shareLoad,shareBtnPaint,renderShare,shareEditOpen,shareAfterSave,shareItemDeleted,shareBodyExtra,shareChip,shareDayMark,shareDayList,shareAlertCount,shareAlertsHtml});
