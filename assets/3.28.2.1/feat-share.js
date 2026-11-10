/* rhy:se Weekly Plan — 🤝 Co-work (feat-share.js, v3.17.0)
   계획의 주인은 보낸 사람 한 명. 받은 사람은 '내 계획에 넣기'만 고르고, 고칠 일은 코멘트로.
   · 보낸 사람: 업무 창 '🤝 Co-work 요청'에서 최대 3명(다른 팀 · 같은 팀). 날짜 · 내용 · 완료는 보낸 사람만
   · 받은 사람: 안내 창(누가 요청했는지) → [내 계획에 넣기] → 보낸 사람 계획이 '연결'되어 그대로 보임(it.co, 보기 전용)
       보낸 사람이 바꾸면 같이 바뀌고, 지우거나 빼면 같이 사라짐. 내 목표가 아님(기한 지남 · 리듬 · 지킴률 · 미룸 제외), 보고서는 필요하면 체크
   · 코멘트: 그 계획에 공유된 사람 모두가 같이 봄(게시판 댓글 방식). 날짜 제안 · 완료 요청
   · 보낸 사람에게 보이는 것: 봤어요 · 함께해요(넣음)까지. 안 넣은 사람은 따로 표시 안 함
   서버: 12-peer-share.sql + 13-cowork.sql (wk_shares · wk_share_comments · wk_directory)
   core는 F("share…")로만 부르고, 이 파일이 고장 나면 이 기능만 꺼짐 */
const SH={list:[],com:[],dir:null,sel:[],note:"",open:false,tab:"in",tabSet:false,thr:new Set()};
const SH_MAX0=3,SH_NOTE0="이 일정으로 진행하려 합니다. 함께해 주시면 좋겠습니다",SH_DONE="제 쪽 일은 끝났습니다. 완료 처리 부탁드립니다.";
const shMe=()=>st.me?st.me.email:"";
const shMax=()=>F("meetFormOn")?20:SH_MAX0;   // 📅 회의 초대는 20명까지 (v3.28.0, 서버 23)
const shMeetOf=(it,id)=>it&&it.meet&&it.meet.on?{stime:it.meet.stime||"",etime:it.meet.etime||"",place:it.meet.place||"",agenda:String(it.meet.agenda||"").slice(0,300),mid:it.meet.mid||("mi_"+id)}:null;
const shMeetKey=x=>JSON.stringify(x&&x.meet?{s:x.meet.stime,e:x.meet.etime,p:x.meet.place}:null);
const shDiff=(o,nd)=>SH_F.some(f=>(o[f]||"")!==(nd[f]||""))||JSON.stringify(o.meet||null)!==JSON.stringify(nd.meet||null);
const shMoved=(o,nd)=>["task","start","due"].some(f=>(o[f]||"")!==(nd[f]||""))||shMeetKey(o)!==shMeetKey(nd);
const shHome=()=>!!st.me&&!!st.me.team_id&&isMyTeam(st.team);
const shEnd=s=>(s.data&&(s.data.due||s.data.start))||"";
const shKey=(from,item)=>from+"|"+item;
const shHide=()=>new Set((st.me&&st.me.my_lists&&Array.isArray(st.me.my_lists.shareHide))?st.me.my_lists.shareHide:[]);
const shIn=()=>SH.list.filter(s=>s.to_email===shMe()&&!s.canceled_at);
const shOut=()=>SH.list.filter(s=>s.from_email===shMe()&&!s.canceled_at);
const shNew=s=>!s.seen_at||(s.changed_at&&s.changed_at>s.seen_at);
const shCo=s=>st.items.find(i=>isMine(i)&&i.co&&i.co.share===s.id);
const shActiveIn=()=>{const h=shHide();return shIn().filter(s=>!h.has(s.id)&&shEnd(s)>=todayKey)};
const shRange=d=>d.start&&d.start!==d.due?`${shortDate(d.start)}~${shortDate(d.due)}`:shortDate(d.due||d.start);
const SHK=k=>`wk-sh-${k}-${shMe()}`;
const shGet=k=>{try{return new Set(JSON.parse(localStorage.getItem(SHK(k))||"[]"))}catch(_){return new Set()}};
const shPut=(k,set)=>{try{localStorage.setItem(SHK(k),JSON.stringify([...set].slice(-300)))}catch(_){}};
const shSeenMap=()=>{try{return JSON.parse(localStorage.getItem(SHK("cseen"))||"{}")}catch(_){return {}}};
const shSeenSet=(k,t)=>{const m=shSeenMap();m[k]=t;try{localStorage.setItem(SHK("cseen"),JSON.stringify(m))}catch(_){}};
// 코멘트: 계획(보낸 사람 + 업무)별, 내가 안 본 남의 코멘트
const shComOf=k=>SH.com.filter(c=>shKey(c.from_email,c.item_id)===k).sort((a,b)=>a.created_at.localeCompare(b.created_at));
const shUnread=k=>{const t=shSeenMap()[k]||"";return shComOf(k).filter(c=>c.author_email!==shMe()&&c.created_at>t)};
const shMyKeys=()=>{const ks=new Set();shIn().forEach(s=>ks.add(shKey(s.from_email,s.item_id)));shOut().forEach(s=>ks.add(shKey(s.from_email,s.item_id)));return [...ks]};
const shUnreadAll=()=>shMyKeys().reduce((n,k)=>n+shUnread(k).length,0);
// 보낸 사람 업무 → 알릴 내용
function shPayload(it,W){const w=it.weeks||{};const ks=Object.keys(w).sort();
  const e=(W&&w[W])||w[CUR]||w[nextKey(CUR)]||(W&&w[nextKey(W)])||(ks.length?w[ks[ks.length-1]]:null);if(!e||!e.due)return null;
  return {from_name:st.me.name,from_team:teamName(st.me.team_id),customer:it.customer||"",project:it.project||"",part:it.part||"",category:it.category||"",task:e.task||"",start:e.start||e.due||"",due:e.due||"",status:e.status||"진행"}}
const SH_F=["task","start","due","status","customer","project","part","category","note"];
async function shareLoad(){
  if(!st.me||!st.me.team_id){SH.list=[];SH.com=[];shareBtnPaint();return}
  try{SH.list=(await api.shares())||[]}catch(_){SH.list=[]}
  try{SH.com=(await api.coComments())||[]}catch(_){SH.com=[]}
  await shSync();shPopup();
  shareBtnPaint();paintNoticeDot();
  if(st.layout==="share"&&st.view!=="review")renderShare();
  if(!$("noticeModal").hidden&&ntScope==="team"&&ntMode==="board")fillBoard()}
function shareBtnPaint(){const b=$("shareBtn");if(!b)return;
  const un=shActiveIn().filter(shNew).length+shUnreadAll();
  b.hidden=!shHome();$("shareN").hidden=!un;$("shareN").textContent=un?`새 ${un}`:"";$("shareN").classList.toggle("new",!!un);return true}
/* ---------- 맞추기: 보낸 사람 → 계획 내용 · 취소 / 받은 사람 → 넣은 계획(it.co) 따라가기 ---------- */
let shSyncing=false;
async function shSync(){
  if(shSyncing||!shHome()||!st.loaded)return;shSyncing=true;let touched=false;
  try{
    // 보낸 사람: 업무가 바뀌면(상태 · 날짜 포함) 알린 내용도 맞춤, 업무가 없어지면 취소
    const g={};shOut().forEach(s=>{(g[s.item_id]=g[s.item_id]||[]).push(s)});
    for(const [iid,ss] of Object.entries(g)){const it=st.items.find(i=>i._id===iid&&isMine(i)),now=new Date().toISOString();
      if(!it){if(st.items.some(isMine))for(const s of ss){try{await api.updShare(s.id,{canceled_at:now});s.canceled_at=now}catch(_){}}continue}
      const p=shPayload(it);if(!p)continue;
      const mt=shMeetOf(it,iid);
      for(const s of ss){const o=s.data||{},nd=Object.assign({},p,{note:o.note||"",to_name:o.to_name,to_team:o.to_team},mt?{meet:mt}:{});
        if(shDiff(o,nd)){const moved=shMoved(o,nd);
          try{await api.updShare(s.id,Object.assign({data:nd},moved?{changed_at:now}:{}));s.data=nd;if(moved)s.changed_at=now}catch(_){}}}}
    // 받은 사람: 넣은 계획을 보낸 사람 계획과 똑같이 (취소 · 뺀 것은 내 일정에서 빠짐)
    const ins=SH.list.filter(s=>s.to_email===shMe()),removed=[];
    for(const s of ins){const co=shCo(s);
      if(s.canceled_at){for(const it of [co].filter(Boolean)){try{await st.db.doc("items/"+it._id).delete();removed.push(s);touched=true}catch(_){}}continue}
      if(!s.joined_at){if(co){try{await st.db.doc("items/"+co._id).delete();touched=true}catch(_){}}continue}
      const body=shCoBody(s,co);if(!co||shCoDiff(co,body)){try{await st.db.doc("items/"+(co?co._id:newId())).set(body);touched=true}catch(_){}}}
    if(removed.length){const names=[...new Set(removed.map(s=>s.data.from_name||""))].join(", ");shToast(`🤝 ${names}님이 계획을 취소해서 내 일정에서도 빠졌어요. 필요하면 휴지통에서 되살릴 수 있어요`,true)}
  }finally{shSyncing=false}
  if(touched)setTimeout(()=>refresh(),300)}
function shCoBody(s,co){const d=s.data||{},wk=keyOf(mondayOf(parseKey(d.start||d.due))),at=(co&&co.createdAt)||new Date().toISOString();
  const b={customer:d.customer||"",project:d.project||"",part:d.part||"",po:"",vendor:"없음",category:d.category||"협업",
    co:{share:s.id,from_email:s.from_email,from_name:d.from_name||"",from_team:d.from_team||""},createdAt:at,updatedAt:new Date().toISOString(),
    weeks:{[wk]:{task:d.task||"",start:d.start||"",due:d.due||d.start,status:d.status||"진행",memo:d.note?`🤝 ${d.from_name||""}: ${d.note}`:"",writtenAt:at}}};
  if(co&&co.report)b.report=co.report;return b}
function shCoDiff(co,b){const k=Object.keys(b.weeks)[0],e=(co.weeks||{})[k],x=b.weeks[k];if(!e||Object.keys(co.weeks||{}).length!==1)return true;
  return ["task","start","due","status","memo"].some(f=>(e[f]||"")!==(x[f]||""))||["customer","project","part","category"].some(f=>(co[f]||"")!==(b[f]||""))}
/* ---------- 안내 창 (누가 요청했는지 · 새 코멘트) — 부드럽게 열고 닫기 ---------- */
function shPopEl(){let el=$("shPop");if(!el){el=document.createElement("div");el.id="shPop";el.className="shpop";el.setAttribute("role","status");el.hidden=true;document.body.appendChild(el)}return el}
function shPopShow(html,ms){const el=shPopEl();clearTimeout(el._t);clearTimeout(el._h);el.innerHTML=`<button type="button" class="shpx" data-shpx aria-label="닫기">✕</button>${html}`;
  el.hidden=false;requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add("in")));if(ms)el._t=setTimeout(shPopHide,ms)}
function shPopHide(){const el=$("shPop");if(!el||el.hidden)return;clearTimeout(el._t);el.classList.remove("in");el._h=setTimeout(()=>{el.hidden=true},matchMedia("(prefers-reduced-motion: reduce)").matches?0:260)}
const shToast=(msg,long)=>shPopShow(`<div class="shpi">${esc(msg)}</div>`,long?12000:8000);
function shPopup(){
  if(!shHome())return;const shown=shGet("pop");
  const fresh=shActiveIn().filter(s=>!s.joined_at&&!(s.data&&s.data.meet&&F("meetOn"))&&shNew(s)&&!shown.has(s.id+"|"+(s.changed_at||"")));
  const coms=shMyKeys().flatMap(k=>shUnread(k)).filter(c=>!shown.has("c|"+c.id));
  if(!fresh.length&&!coms.length)return;
  fresh.forEach(s=>shown.add(s.id+"|"+(s.changed_at||"")));coms.forEach(c=>shown.add("c|"+c.id));shPut("pop",shown);
  if(fresh.length){const s=fresh[0],d=s.data||{},chg=s.changed_at&&s.seen_at&&s.changed_at>s.seen_at,more=fresh.length-1+coms.length;
    shPopShow(`<div class="shpi"><span class="shpt">🤝 Co-work ${chg?"계획이 바뀌었어요":"요청"}</span>
      <span class="shpl"><b>${esc(d.from_name||"")}</b>님<span class="dim">(${esc(d.from_team||"")})</span>이 ${chg?"계획을 바꿨어요":"계획을 함께 보자고 요청했어요"}${more?` · 외 ${more}건`:""}</span>
      <span class="shps"><span class="mono">${esc(shRange(d))}</span> ${esc(d.task||"")}</span>
      <span class="shpn">'내 계획에 넣기'를 누르면 내 일정에 참고로 보여요. 안 넣어도 괜찮아요.</span></div>
      <div class="shpb"><button type="button" class="btn sm primary" data-shopen="${esc(s.id)}">보기</button><button type="button" class="btn sm ghost" data-shpx>나중에</button></div>`)}
  else{const c=coms[coms.length-1],more=coms.length-1;
    shPopShow(`<div class="shpi"><span class="shpt">💬 Co-work 코멘트</span><span class="shpl"><b>${esc(c.author_name||"")}</b>님이 코멘트를 남겼어요${more?` · 외 ${more}건`:""}</span>
      <span class="shps">${esc(c.body)}${c.date_hint?` <span class="mono">🗓 ${esc(shortDate(c.date_hint))}</span>`:""}</span></div>
      <div class="shpb"><button type="button" class="btn sm primary" data-shthr="${esc(shKey(c.from_email,c.item_id))}">보기</button><button type="button" class="btn sm ghost" data-shpx>나중에</button></div>`)}}
document.addEventListener("click",e=>{if(e.target.closest("[data-shpx]"))shPopHide()});
/* ---------- 🤝 Co-work 창: 받은 계획 · 보낸 계획 ---------- */
const stPill=s=>`<span class="pill ${esc(s||"진행")}">${esc(s||"진행")}</span>`;
function thrHtml(k){const cs=shComOf(k),open=SH.thr.has(k),un=shUnread(k).length,isIn=!k.startsWith(shMe()+"|");
  return `<div class="shthr">
    <button type="button" class="btn sm ghost" data-shtog="${esc(k)}" aria-expanded="${open}">💬 코멘트 ${cs.length}${un?` <b class="shnew">새 ${un}</b>`:""}</button>
    ${open?`<div class="shcl">${cs.length?cs.map(c=>`<div class="shc${c.author_email===shMe()?" me":""}"><span class="shcm mono">${esc(fmtDT(c.created_at).slice(5))}</span><b>${esc(c.author_name||"")}</b><span class="shcb">${esc(c.body)}${c.date_hint?` <span class="shcd">🗓 ${esc(shortDate(c.date_hint))} 제안</span>`:""}</span>${c.author_email===shMe()?`<button type="button" class="shcx" data-shcdel="${esc(c.id)}" aria-label="내 코멘트 지우기">✕</button>`:""}</div>`).join(""):`<div class="hint" style="margin:0">아직 코멘트가 없어요. 일정 협의나 요청을 남겨 보세요.</div>`}
      <div class="shcf"><input type="text" class="shci" maxlength="300" placeholder="코멘트 (예: 11/7 오후가 좋겠습니다)" aria-label="코멘트"><label class="shcdl">날짜 제안 <input type="date" class="shcdd"></label><button type="button" class="btn sm primary" data-shcsend="${esc(k)}">남기기</button>${isIn?`<button type="button" class="btn sm" data-shcdone="${esc(k)}" title="내 쪽 일이 끝났으면 보낸 분에게 완료 처리를 부탁해요">✅ 완료 요청</button>`:""}</div></div>`:""}
  </div>`}
function inRow(s){const d=s.data||{},nw=shNew(s),chg=s.changed_at&&s.seen_at&&s.changed_at>s.seen_at,joined=!!s.joined_at,k=shKey(s.from_email,s.item_id);
  return `<div class="shr${joined?" joined":""}" data-sh="${esc(s.id)}">
    <div class="shh"><b>${esc(d.from_name||s.from_email)}</b><span class="dim">${esc(d.from_team||"")}</span>${stPill(d.status)}${nw&&!chg?'<span class="shnew">새로</span>':""}${chg?'<span class="shchg">계획이 바뀌었어요</span>':""}</div>
    <div class="sht"><span class="mono shd">${esc(shRange(d))}</span><b>${esc(d.task||"")}</b></div>
    <div class="shs">${[d.customer,d.project,d.part].filter(Boolean).map(esc).join(" · ")}</div>
    ${d.note?`<div class="shnote">“${esc(d.note)}”</div>`:""}
    <div class="sha">${joined?`<span class="shok">✓ 내 계획에 넣었어요</span><button type="button" class="btn sm ghost" data-sha="leave">내 계획에서 빼기</button>`:`<button type="button" class="btn sm primary" data-sha="join">내 계획에 넣기</button><button type="button" class="btn sm ghost" data-sha="hide">목록에서 빼기</button>`}</div>
    ${thrHtml(k)}
  </div>`}
function renderShare(){
  const h=shHide();
  const ins=shIn().filter(s=>!h.has(s.id)).sort((a,b)=>(a.data.start||a.data.due||"").localeCompare(b.data.start||b.data.due||""));
  const upIn=ins.filter(s=>shEnd(s)>=todayKey),pastIn=ins.filter(s=>shEnd(s)<todayKey);
  const outs=shOut(),groups={};outs.forEach(s=>{(groups[s.item_id]=groups[s.item_id]||[]).push(s)});
  const gl=Object.values(groups).sort((a,b)=>(shEnd(b[0])||"").localeCompare(shEnd(a[0])||""));
  const unIn=ins.reduce((n,s)=>n+shUnread(shKey(s.from_email,s.item_id)).length,0)+upIn.filter(shNew).length,unOut=gl.reduce((n,g)=>n+shUnread(shKey(shMe(),g[0].item_id)).length,0);
  if(!SH.tabSet&&!upIn.length&&gl.length)SH.tab="out";
  const inHtml=`${upIn.length?upIn.map(inRow).join(""):`<div class="nempty">받은 Co-work 요청이 없어요.</div>`}
    ${pastIn.length?`<details class="shpast"><summary>지난 계획 ${pastIn.length}건</summary>${pastIn.map(inRow).join("")}</details>`:""}`;
  const outHtml=gl.length?gl.map(g=>{const d=g[0].data||{},past=shEnd(g[0])<todayKey;return `<div class="shr out${past?" past":""}">
      <div class="shh">${stPill(d.status)}<span class="dim">내 계획</span></div>
      <div class="sht"><span class="mono shd">${esc(shRange(d))}</span><b>${esc(d.task||"")}</b></div>
      <div class="shs">${[d.customer,d.project,d.part].filter(Boolean).map(esc).join(" · ")}</div>
      <div class="shto">${g.map(s=>`<div class="shtor"><span><b>${esc(s.data.to_name||s.to_email)}</b> <span class="dim">${esc(s.data.to_team||"")}</span></span><span class="${s.joined_at?"shjoin":s.seen_at?"shseen":"dim"}">${s.joined_at?"🤝 함께해요":s.seen_at?"✓ 봤어요":"확인 전"}</span></div>`).join("")}</div>
      <div class="sha"><button type="button" class="btn sm ghost" data-shedit="${esc(g[0].item_id)}">업무 열기 · 날짜 · 완료</button></div>
      ${thrHtml(shKey(shMe(),g[0].item_id))}</div>`}).join(""):`<div class="nempty">아직 보낸 Co-work 요청이 없어요. 업무 창 아래쪽 <b>🤝 Co-work 요청</b>에서 보낼 수 있어요.</div>`;
  $("shareView").innerHTML=`<div class="shwrap">
    <div class="shtop"><div class="tabs shtabs" role="tablist" aria-label="받은 계획 · 보낸 계획"><button type="button" class="tab" role="tab" data-shtab="in" aria-selected="${SH.tab==="in"}">받은 계획 <span class="cnt">${upIn.length}</span>${unIn?` <b class="shnew">새 ${unIn}</b>`:""}</button><button type="button" class="tab" role="tab" data-shtab="out" aria-selected="${SH.tab==="out"}">보낸 계획 <span class="cnt">${gl.length}</span>${unOut?` <b class="shnew">새 ${unOut}</b>`:""}</button></div>
      <p class="hint">${SH.tab==="in"?"다른 분이 함께 보자고 요청한 계획이에요. <b>내 계획에 넣기</b>를 누르면 내 일정에 참고로 보여요 (내 목표로 세지 않아요). 고칠 일은 코멘트로 남겨 주세요.":"내가 요청한 계획이에요. 날짜 · 내용 · 완료는 내 업무에서 바꾸면 받은 분들에게도 그대로 반영돼요."}</p></div>
    <div class="shlist">${SH.tab==="in"?inHtml:outHtml}</div></div>`;
  // 본 것으로 표시: 받은 계획은 '봤어요', 펼친 코멘트는 읽음
  const now=new Date().toISOString();
  if(SH.tab==="in")ins.filter(shNew).forEach(s=>{s.seen_at=now;api.updShare(s.id,{seen_at:now}).catch(()=>{})});
  SH.thr.forEach(k=>{if(shComOf(k).length)shSeenSet(k,now)});
  setTimeout(()=>{shareBtnPaint();paintNoticeDot()},50);return true}
$("shareView").addEventListener("click",async e=>{
  const t=e.target.closest("[data-shtab]");if(t){SH.tab=t.dataset.shtab;SH.tabSet=true;renderShare();return}
  const tg=e.target.closest("[data-shtog]");if(tg){const k=tg.dataset.shtog;SH.thr.has(k)?SH.thr.delete(k):SH.thr.add(k);renderShare();const i=document.querySelector(`[data-shcsend="${CSS.escape(k)}"]`);if(i)i.parentNode.querySelector(".shci").focus();return}
  const ed=e.target.closest("[data-shedit]");if(ed){const it=st.items.find(i=>i._id===ed.dataset.shedit);if(it)openDrawer(it._id);else toast("이 업무는 이번 화면에 없어요");return}
  const sd=e.target.closest("[data-shcsend],[data-shcdone]");if(sd){const k=sd.dataset.shcsend||sd.dataset.shcdone,f=sd.closest(".shcf"),done=!!sd.dataset.shcdone;
    const body=done?SH_DONE:f.querySelector(".shci").value.trim(),dh=done?"":f.querySelector(".shcdd").value;if(!body){f.querySelector(".shci").focus();return}
    const [from,item]=[k.slice(0,k.indexOf("|")),k.slice(k.indexOf("|")+1)];sd.disabled=true;
    try{const row={id:"c"+newId(),from_email:from,item_id:item,author_email:shMe(),author_name:st.me.name,body,date_hint:dh||null};await api.addCoComment(row);SH.com.push(Object.assign({created_at:new Date().toISOString()},row));
      toast(done?"완료 요청을 남겼어요. 완료는 보낸 분이 해요":"코멘트를 남겼어요. 공유된 분들이 모두 봐요");renderShare()}catch(x){sd.disabled=false;toast((x&&x.hint)||errText(x))}return}
  const cd=e.target.closest("[data-shcdel]");if(cd){try{await api.delCoComment(cd.dataset.shcdel);SH.com=SH.com.filter(c=>c.id!==cd.dataset.shcdel);renderShare()}catch(x){toast(errText(x))}return}
  const b=e.target.closest("[data-sha]");if(!b)return;const row=b.closest("[data-sh]"),s=SH.list.find(x=>x.id===row.dataset.sh);if(!s)return;const k=b.dataset.sha;
  if(k==="join"||k==="leave"){const v=k==="join"?new Date().toISOString():null;b.disabled=true;
    try{await api.updShare(s.id,{joined_at:v});s.joined_at=v;await shSync();toast(v?`🤝 ${s.data.from_name||""}님 계획을 내 일정에 넣었어요 (보기 전용)`:"내 일정에서 뺐어요");renderShare();render()}catch(x){b.disabled=false;toast((x&&x.hint)||errText(x))}return}
  if(k==="hide"){const h=[...shHide(),s.id].slice(-200);const l=Object.assign({},st.me.my_lists||{},{shareHide:h});
    try{await api.setPrefs(null,l);st.me.my_lists=l;toast("목록에서 뺐어요. 보낸 분에게는 알리지 않아요");renderShare();if(st.layout==="month")render()}catch(x){toast(errText(x))}}});
function shareBodyExtra(){return null}
// 🤝 어느 화면에서 보든 Co-work 인 걸 알 수 있게: 넣은 계획(it.co) · 내가 요청을 보낸 업무 둘 다
function coInfo(it){if(!it)return null;if(it.co)return {k:"in",t:`🤝 ${it.co.from_name||""}님 계획`,tip:"Co-work 로 내 계획에 넣은 다른 분의 계획이에요 (보기 전용, 내 목표로 세지 않음)"};
  if(isMine(it)){const ss=shOut().filter(s=>s.item_id===it._id);if(ss.length){const n=ss.map(s=>s.data.to_name||"");return {k:"out",t:`🤝 Co-work · ${n[0]}${n.length>1?` 외 ${n.length-1}`:""}`,tip:`Co-work 요청을 보낸 내 계획이에요: ${n.join(", ")}`}}}
  return null}
function coTag(it){const c=coInfo(it);return c?`<span class="cotag ${c.k}" title="${esc(c.tip)}">${esc(c.t)}</span>`:""}
function coMark(it){return coInfo(it)?"🤝 ":""}
function shareChip(it){const c=coInfo(it);if(c&&c.k==="out")return `<div class="shchip out" title="${esc(c.tip)}">${esc(c.t)}</div>`;if(it&&it.co)return `<div class="shchip" title="Co-work 로 내 계획에 넣은 다른 분의 계획 (보기 전용, 내 목표로 세지 않음)">🤝 ${esc(it.co.from_name||"")}님 계획 · 보기 전용</div>`;
  return ""}
/* ---------- 업무 창: 🤝 Co-work 요청 ---------- */
async function shDir(){if(SH.dir)return SH.dir;try{SH.dir=((await api.directory())||[]).filter(p=>p.email!==shMe())}catch(_){SH.dir=[]}return SH.dir}
function shareEditOpen(it,ro){
  if(ro||!shHome()||!st.me.team_id){$("shareSec").hidden=true;SH.open=false;return true}
  SH.open=true;SH.item=it?it._id:null;
  const ex=it?shOut().filter(s=>s.item_id===it._id):[];
  SH.sel=ex.map(s=>({email:s.to_email,name:s.data.to_name||s.to_email,team:s.data.to_team||""}));SH.note=ex.length?(ex[0].data.note||""):"";
  $("shareSec").hidden=false;paintShareEdit();return true}
function paintShareEdit(){
  const full=SH.sel.length>=shMax();$("shareSec").classList.remove("dd-open");
  $("shareEdit").innerHTML=`<div class="shsel">${SH.sel.map((p,i)=>`<span class="shpick"><b>${esc(p.name)}</b><span class="dim">${esc(p.team)}</span><button type="button" data-shrm="${i}" aria-label="${esc(p.name)} 빼기">✕</button></span>`).join("")}
      ${full?`<span class="hint" style="margin:0">최대 ${shMax()}명이에요</span>`:`<span class="shfind"><input type="text" id="shQ" placeholder="이름을 쓰고 Enter (다른 팀도)" autocomplete="off" aria-label="요청할 사람 찾기" aria-controls="shDD"><button type="button" class="btn sm primary" id="shAddBtn">추가</button><span class="shdd" id="shDD" role="listbox" hidden></span></span>`}</div>
    ${full?"":`<p class="hint" style="margin:2px 0 0">이름을 쓰면 아래에 사람이 나와요. 맞으면 <b>Enter</b> 또는 <b>추가</b>, 다른 사람이면 목록에서 고르세요.</p>`}
    ${SH.sel.length?`<input type="text" id="shNote" maxlength="80" value="${esc(SH.note)}" placeholder="${esc(SH_NOTE0)}" aria-label="한 줄 메모 (선택)"><p class="hint" style="margin:4px 0 0">받는 분은 <b>내 계획에 넣기</b>만 골라요. 날짜 · 내용 · 완료는 내가 바꾸면 그대로 반영돼요.</p>`:""}`}
$("shareEdit").addEventListener("input",async e=>{
  if(e.target.id==="shNote"){SH.note=e.target.value;return}
  if(e.target.id!=="shQ")return;await shFind(e.target.value)});
let shAct=0;
// 업무 창 맨 아래라 찾기 목록이 잘리지 않게: 목록이 열리면 아래 공간을 만들고 칸을 위로 올려 보여 줌
function shRoom(on){const sec=$("shareSec");if(!sec)return;sec.classList.toggle("dd-open",!!on);
  if(on){const b=sec.closest(".dbody")||document.querySelector("#drawer .dbody");if(b){const top=sec.getBoundingClientRect().top-b.getBoundingClientRect().top+b.scrollTop-12;b.scrollTo({top,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}}}
async function shFind(v){const q=String(v||"").trim(),dd=$("shDD");if(!dd)return;if(!q){dd.hidden=true;shRoom(false);return}
  if(dd.hidden)shRoom(true);
  const dir=await shDir(),have=new Set(SH.sel.map(p=>p.email));
  const hit=dir.filter(p=>!have.has(p.email)&&(p.name.includes(q)||p.email.startsWith(q.toLowerCase())||(p.team_name||"").includes(q)))
    .sort((a,b)=>(b.name===q)-(a.name===q)||(b.name.startsWith(q))-(a.name.startsWith(q))||a.name.localeCompare(b.name,"ko")).slice(0,8);
  shAct=0;
  dd.innerHTML=hit.length?hit.map((p,i)=>`<button type="button" role="option" data-shadd="${esc(p.email)}" class="${i===0?"on":""}" aria-selected="${i===0}"><b>${esc(p.name)}</b><span class="dim">${esc(p.team_name||"")}</span><span class="shmail">${esc(p.email.split("@")[0])}</span>${i===0?'<kbd>Enter</kbd>':""}</button>`).join(""):`<span class="dim" style="padding:8px 10px;display:block">'${esc(q)}' 이름의 사람이 없어요</span>`;dd.hidden=false}
function shMove(d){const bs=[...$("shDD").querySelectorAll("[data-shadd]")];if(!bs.length)return;shAct=(shAct+d+bs.length)%bs.length;
  bs.forEach((b,i)=>{b.classList.toggle("on",i===shAct);b.setAttribute("aria-selected",i===shAct);const k=b.querySelector("kbd");if(k)k.remove();if(i===shAct){b.insertAdjacentHTML("beforeend","<kbd>Enter</kbd>");b.scrollIntoView({block:"nearest"})}})}
function shPickActive(){const dd=$("shDD"),q=$("shQ");if(!dd||!q)return;
  if(dd.hidden&&q.value.trim()){shFind(q.value).then(()=>{const b=$("shDD").querySelector("[data-shadd].on");if(b)b.click();else toast("찾는 사람이 없어요. 이름을 확인해 주세요")});return}
  const b=dd.querySelector("[data-shadd].on")||dd.querySelector("[data-shadd]");if(b)b.click();else if(q.value.trim())toast("찾는 사람이 없어요. 이름을 확인해 주세요");else q.focus()}
$("shareEdit").addEventListener("keydown",e=>{if(e.target.id!=="shQ")return;
  if(e.key==="Enter"){e.preventDefault();shPickActive()}else if(e.key==="ArrowDown"){e.preventDefault();shMove(1)}else if(e.key==="ArrowUp"){e.preventDefault();shMove(-1)}else if(e.key==="Escape"){const d=$("shDD");if(d&&!d.hidden){e.stopPropagation();d.hidden=true;shRoom(false)}}});
$("shareEdit").addEventListener("focusin",e=>{if(e.target.id==="shQ")shRoom(true)});
$("shareEdit").addEventListener("focusout",e=>{if(e.target.id==="shQ")setTimeout(()=>{const d=$("shDD"),a=document.activeElement;if((!d||d.hidden)&&!(a&&a.closest&&a.closest("#shareSec")))shRoom(false)},200)});
$("shareEdit").addEventListener("click",async e=>{
  if(e.target.closest("#shAddBtn")){shPickActive();return}
  const a=e.target.closest("[data-shadd]");if(a){const p=(await shDir()).find(x=>x.email===a.dataset.shadd);if(p&&SH.sel.length<shMax()){SH.sel.push({email:p.email,name:p.name,team:p.team_name||""});toast(`${p.name}님을 추가했어요. 저장하면 요청이 가요`)}paintShareEdit();const q=$("shQ");if(q)q.focus();return}
  const r=e.target.closest("[data-shrm]");if(r){SH.sel.splice(+r.dataset.shrm,1);paintShareEdit()}});
async function shareAfterSave(id,body){
  try{await shareAfterSave0(id,body)}catch(x){setTimeout(()=>toast("🤝 Co-work 요청을 보내지 못했어요: "+((x&&x.hint)||errText(x))),500)}}
async function shareAfterSave0(id,body){
  if(!SH.open)return;SH.open=false;
  const ex=shOut().filter(s=>s.item_id===id),want=SH.sel.slice(0,shMax());
  if(!ex.length&&!want.length)return;
  const p=shPayload(body,st.week);
  if(!p){if(want.length>ex.length)setTimeout(()=>toast("할일과 종료일이 있는 업무만 요청할 수 있어요"),400);return}
  const mt=shMeetOf(body,id);
  const base=Object.assign({},p,{note:(SH.note||"").trim()},mt?{meet:mt}:{}),keep=new Set(want.map(x=>x.email)),now=new Date().toISOString();
  for(const s of ex){if(!keep.has(s.to_email)){await api.updShare(s.id,{canceled_at:now});continue}   // 뺀 사람: 취소 → 그분 일정에서도 빠짐
    const o=s.data||{},nd=Object.assign({},base,{to_name:o.to_name,to_team:o.to_team});
    if(shDiff(o,nd)){const moved=shMoved(o,nd);await api.updShare(s.id,Object.assign({data:nd},moved?{changed_at:now}:{}))}}
  const have=new Set(ex.map(s=>s.to_email)),rows=want.filter(x=>!have.has(x.email)).map(x=>({id:"s"+newId(),from_email:shMe(),to_email:x.email,item_id:id,data:Object.assign({},base,{to_name:x.name,to_team:x.team})}));
  if(rows.length)await api.addShares(rows);
  await shareLoad();
  if(rows.length)setTimeout(()=>toast(mt?`📅 ${rows.length}명에게 회의 초대를 보냈어요`:`🤝 ${rows.map(r=>r.data.to_name).join(", ")}님에게 Co-work 요청을 보냈어요`),400)}
async function shareItemDeleted(id){const now=new Date().toISOString();for(const s of shOut().filter(x=>x.item_id===id)){try{await api.updShare(s.id,{canceled_at:now})}catch(_){}}await shareLoad()}
/* ---------- 캘린더: 아직 안 넣은 요청은 흐린 📌 참고 (넣은 계획은 🤝 로 일정에 보임) ---------- */
const shOnDay=d=>shActiveIn().filter(s=>!s.joined_at&&(s.data.start||s.data.due)<=d&&d<=(s.data.due||s.data.start));
function shareDayMark(d){if(!shHome())return "";const n=shOnDay(d).length;return n?`<span class="shmark" title="받은 Co-work 요청 ${n}건 (아직 안 넣음)">📌${n>1?n:""}</span>`:""}
function shareDayList(d){if(!shHome())return "";return shOnDay(d).map(s=>`<button type="button" class="mitem shref" data-shopen="${esc(s.id)}"><span class="shrt">🤝 요청</span><b>${esc(s.data.from_name||"")}님 계획</b> · ${esc(s.data.task||"")}<span class="dim"> ${esc(shRange(s.data))}</span></button>`).join("")}
function shGo(tab){shPopHide();if(!$("noticeModal").hidden)closeNotice();F("alertClose");SH.tab=tab;SH.tabSet=true;st.layout="share";render();window.scrollTo({top:0,behavior:"smooth"})}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-shopen]");if(b){e.stopPropagation();shGo("in");return}
  const t=e.target.closest("[data-shthr]");if(t){e.stopPropagation();const k=t.dataset.shthr;SH.thr.add(k);shGo(k.startsWith(shMe()+"|")?"out":"in")}},true);
/* ---------- 📣 알림: 새 요청 · 바뀐 계획 · 시작 3일 전 한 번 · 새 코멘트 ---------- */
const SOONK=()=>"wk-shsoon-"+shMe();
const soonAck=()=>{try{return new Set(JSON.parse(localStorage.getItem(SOONK())||"[]"))}catch(_){return new Set()}};
function shAlerts(){if(!shHome())return {nw:[],soon:[],com:[],join:[]};const ack=soonAck(),jk=shGet("joinack");
  const act=shActiveIn().filter(s=>!s.joined_at);
  const nw=act.filter(s=>shNew(s)&&!(s.data&&s.data.meet&&F("meetOn")));   // 회의 초대는 📝 회의록 쪽 알림 하나로
  const soon=act.filter(s=>!shNew(s)&&!ack.has(s.id)&&(()=>{const st0=s.data.start||s.data.due,dd=Math.round((parseKey(st0)-parseKey(todayKey))/864e5);return dd>=0&&dd<=3})());
  const com=shMyKeys().map(k=>({k,n:shUnread(k)})).filter(x=>x.n.length);
  const join=shOut().filter(s=>s.joined_at&&!jk.has(s.id));   // 보낸 사람: 누가 내 계획에 함께해요 (한 번)
  return {nw,soon,com,join}}
function shareAlertCount(){const a=shAlerts();return a.nw.length+a.soon.length+a.com.length+a.join.length}
function shareAlertsHtml(){const a=shAlerts();if(!a.nw.length&&!a.soon.length&&!a.com.length&&!a.join.length)return "";
  const row=(s,txt,act)=>`<div class="walr k-share"><span class="wlv">🤝</span><button type="button" class="wtx" data-shopen="${esc(s.id)}">${txt}<span class="wsub">${esc([s.data.customer,s.data.project].filter(Boolean).join(" · "))}</span></button><span class="wact">${act||""}</span></div>`;
  const tOf=k=>{const s=SH.list.find(x=>shKey(x.from_email,x.item_id)===k);return s?s.data.task||"":""};
  return `<div class="wal"><div class="walh">🤝 Co-work <span>참고로만</span></div>
    ${a.nw.map(s=>row(s,`<b>${esc(s.data.from_name||"")}</b>님이 Co-work 요청을 보냈어요 · ${esc(s.data.task||"")} <span class="mono">${esc(shRange(s.data))}</span>`,`<button type="button" class="btn sm" data-shopen="${esc(s.id)}">보기</button>`)).join("")}
    ${a.soon.map(s=>row(s,`곧 시작하는 <b>${esc(s.data.from_name||"")}</b>님 계획 · ${esc(s.data.task||"")} <span class="mono">${esc(shRange(s.data))}</span>`,`<button type="button" class="btn sm ghost" data-shack="${esc(s.id)}">확인</button>`)).join("")}
    ${a.join.map(s=>`<div class="walr k-share"><span class="wlv">🤝</span><button type="button" class="wtx" data-shout="1"><b>${esc(s.data.to_name||"")}</b>님이 내 계획에 함께해요 · ${esc(s.data.task||"")} <span class="mono">${esc(shRange(s.data))}</span></button><span class="wact"><button type="button" class="btn sm ghost" data-shjack="${esc(s.id)}">확인</button></span></div>`).join("")}
    ${a.com.map(x=>{const c=x.n[x.n.length-1];return `<div class="walr k-share"><span class="wlv">💬</span><button type="button" class="wtx" data-shthr="${esc(x.k)}"><b>${esc(c.author_name||"")}</b>님 코멘트${x.n.length>1?` 외 ${x.n.length-1}건`:""} · ${esc(c.body)}<span class="wsub">${esc(tOf(x.k))}</span></button><span class="wact"><button type="button" class="btn sm" data-shthr="${esc(x.k)}">보기</button></span></div>`}).join("")}
  </div>`}
document.addEventListener("click",e=>{
  const jb=e.target.closest("[data-shjack]");if(jb){const s_=shGet("joinack");s_.add(jb.dataset.shjack);shPut("joinack",s_);paintNoticeDot();F("alertRender");return}
  const o=e.target.closest("[data-shout]");if(o){shGo("out");return}
  const k=e.target.closest("[data-shack]");if(k){const s_=soonAck();s_.add(k.dataset.shack);try{localStorage.setItem(SOONK(),JSON.stringify([...s_].slice(-200)))}catch(_){}paintNoticeDot();F("alertRender")}});
// 📖 사용법
wkGuideAdd("share",{
  member:[{after:"x-pull",sec:["x-share","🤝 Co-work 요청하기",[
    ["p","다른 분(다른 팀도)과 같이 해야 하는 일이 있으면, 내 계획을 **Co-work 요청**으로 보냅니다. 계획의 주인은 나이고, 받는 분은 **내 계획에 넣기**만 고릅니다. 부탁이지 지시가 아닙니다."],
    ["img","g20_share_form","업무 창 → 🤝 Co-work 요청"],
    ["ol",["업무 창 아래쪽 **🤝 Co-work 요청**에 이름을 씁니다. 아래에 사람이 나오면 **Enter** 또는 **추가**를 누릅니다. (다른 사람이면 목록에서 고르기) 업무 하나에 **최대 3명**입니다.","필요하면 한 줄을 남깁니다. (예: 이 일정으로 진행하려 합니다. 함께해 주시면 좋겠습니다)","**저장**하면 받는 분에게 안내가 갑니다."]],
    ["ul",["날짜 · 내용 · 상태 · **완료**는 내 업무에서 바꿉니다. 넣은 분들의 일정에도 그대로 반영됩니다.","업무를 지우거나 받는 분을 빼면 그분 일정에서도 사라집니다.","나에게는 받은 분별로 **봤어요 · 함께해요(넣음)**까지만 보입니다.","**회의 일정**이면 이 칸 대신 업무 창 맨 위 **📅 회의**의 **참석 요청**을 씁니다 (20명까지). 회의를 켜면 Co-work 칸은 숨겨집니다."]]]]},
   {after:"x-share",sec:["x-share-in","🤝 Co-work 창 (받은 계획 · 보낸 계획 · 코멘트)",[
    ["p","Co-work 요청이 오면 **누가 요청했는지 안내 창**이 뜹니다. 보기 단추 옆 **🤝 Co-work**에서 받은 계획과 보낸 계획을 나눠 봅니다."],
    ["img","g21_share_list","🤝 Co-work → 받은 계획"],
    ["ol",["함께하려면 **내 계획에 넣기**를 누릅니다. 내 일정에 🤝 표시로 보이고, **보기 전용**입니다.","날짜나 내용을 바꾸고 싶으면 **💬 코멘트**에 남깁니다. 날짜 제안도 붙일 수 있고, 공유된 분들이 모두 봅니다.","내 쪽 일이 끝났으면 **✅ 완료 요청**을 누릅니다. 완료는 보낸 분이 합니다."]],
    ["ul",["넣은 계획은 **내 목표로 세지 않습니다.** 기한 지남 · 리듬 · 지킴률 · 미룸에 들어가지 않습니다.","보고서에는 필요할 때만 체크해서 넣을 수 있습니다.","안 넣어도 괜찮습니다. 아무도 따지지 않습니다. 필요 없으면 **목록에서 빼기**."]]]]}],
  faq:[["Co-work 요청을 받으면 꼭 해야 하나요?","아니요. 넣을지는 내가 정하고, 넣어도 내 목표로 세지 않습니다. 고칠 일은 코멘트로 남기면 됩니다."],
       ["넣은 계획의 날짜를 왜 못 고치나요?","계획의 주인은 보낸 분이기 때문입니다. 코멘트에 날짜 제안을 남기면 보낸 분이 바꾸고, 바꾸면 내 일정에도 그대로 반영됩니다."]]});
wkFeat("share",{coTag,coMark,shareLoad,shareBtnPaint,renderShare,shareEditOpen,shareAfterSave,shareItemDeleted,shareBodyExtra,shareChip,shareDayMark,shareDayList,shareAlertCount,shareAlertsHtml});
