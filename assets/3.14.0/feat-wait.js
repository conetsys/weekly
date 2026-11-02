/* rhy:se Weekly Plan — 📦 입고·회신 대기 (feat-wait.js)
   업무에 '밖에서 와야 하는 것'(견적서·제품)을 붙여 예정일 관리 · 알림(📣 팀 공지) · 캘린더 ◆ · 점검 협력사 통계 · 기록 CSV. 켜기는 기능 더하기(개인), 팀장 알림·통계는 데이터가 있으면 자동
   core.js 다음에 읽힘. core는 F("함수 이름")로만 부르고, 이 파일이 고장 나면 이 기능만 꺼짐.
   맨 끝 wkFeat(...) 에 등록한 함수만 바깥(core)에서 씀 */
/* ---------- 📦 입고·회신 대기 (v3.13.0) ----------
   내 일이 끝나도 밖에서 와야 하는 것(견적서·제품 등)을 업무에 붙여 관리. 켜기는 개인(기능 더하기).
   it.waits=[{id,type,vendor,due,plan:{d,at},hist:[{at,d0,d1}],checks:[{at,memo,d0,d1}],ack:{"30":day,"15":day},got:day|null,at}]
   알림: D-30 · D-15 한 번(확인 누르면 끝) → D-7부터 매일 → 지나면 매일 '지연'. 📞 확인함은 그날만 조용히. 팀장은 D-7부터 팀 전체 */
const WAIT0=["견적 회신","발주 확인","입고"];
const waitOn=()=>!!F("modOn","wait");   // 내가 켰는지 (🧩 기능 더하기)
const teamHasWaits=()=>st.items.some(it=>allWaits(it).length);   // 팀장 알림 · 협력사 통계는 데이터가 있으면 자동
const waitTypes=()=>{const m=st.me&&st.me.my_lists;return m&&Array.isArray(m.waitTypes)&&m.waitTypes.length?m.waitTypes:WAIT0};
const allWaits=it=>it&&Array.isArray(it.waits)?it.waits:[];
const openWaits=it=>allWaits(it).filter(w=>!w.got);
const dTo=d=>Math.round((parseKey(d)-parseKey(todayKey))/864e5);
const firstDue=w=>(w.plan&&w.plan.d)||w.due;
const delayOf=w=>{const f=firstDue(w);if(!f)return 0;const end=w.got||(w.due<todayKey?todayKey:null);if(!end)return Math.max(0,Math.round((parseKey(w.due)-parseKey(f))/864e5));return Math.max(0,Math.round((parseKey(end)-parseKey(f))/864e5))};
const checkedToday=w=>(w.checks||[]).some(c=>isoDay(c.at)===todayKey);
function waitLevel(w){
  if(w.got||!w.due)return null;const d=dTo(w.due);
  if(d<0)return {k:"late",d,quiet:checkedToday(w)};
  if(d<=7)return {k:"soon",d,quiet:checkedToday(w)};
  if(d<=15)return w.ack&&w.ack["15"]?null:{k:"d15",d};
  if(d<=30)return w.ack&&w.ack["30"]?null:{k:"d30",d};
  return null}
const lvText=l=>l.k==="late"?`지연 ${-l.d}일`:l.d===0?"오늘":`D-${l.d}`;
function myWaitAlerts(){
  if(!st.me||!waitOn()||st.team!==st.me.team_id)return [];
  const out=[];st.items.filter(isMine).forEach(it=>allWaits(it).forEach(w=>{const l=waitLevel(w);if(l)out.push({it,w,l})}));
  return out.sort((a,b)=>a.w.due.localeCompare(b.w.due))}
function teamWaitAlerts(){   // 팀장: D-7부터 팀원 것 (내 것 제외)
  if(!st.me||st.me.role!=="leader"||st.team!==st.me.team_id)return [];
  const out=[];st.items.filter(it=>!isMine(it)).forEach(it=>allWaits(it).forEach(w=>{const l=waitLevel(w);if(l&&(l.k==="late"||l.k==="soon"))out.push({it,w,l})}));
  return out.sort((a,b)=>a.w.due.localeCompare(b.w.due))}
const waitAlertCount=()=>myWaitAlerts().filter(a=>!a.l.quiet).length+teamWaitAlerts().length;
function waitRowHtml(a,opt){
  const {it,w,l}=a,mine=isMine(it),lv=l||waitLevel(w),cls=lv?lv.k:"none";
  const acts=!mine||(opt&&opt.ro)?"":w.got?"":lv&&(lv.k==="d30"||lv.k==="d15")?`<button type="button" class="btn sm" data-wa="ack" data-it="${esc(it._id)}" data-w="${esc(w.id)}">확인</button><button type="button" class="btn sm ghost" data-wa="got" data-it="${esc(it._id)}" data-w="${esc(w.id)}">✓ 받음</button>`
    :`<button type="button" class="btn sm primary" data-wa="got" data-it="${esc(it._id)}" data-w="${esc(w.id)}">✓ 받음</button><button type="button" class="btn sm" data-wa="chk" data-it="${esc(it._id)}" data-w="${esc(w.id)}">📞 확인함</button>`;
  const hc=(w.hist||[]).length,cc=(w.checks||[]).length,last=cc?w.checks[cc-1]:null;
  return `<div class="walr k-${cls}${lv&&lv.quiet?" quiet":""}" data-wrow="${esc(it._id)}|${esc(w.id)}">
    <span class="wlv">${w.got?"받음":lv?lvText(lv):`D-${dTo(w.due)}`}</span>
    <button type="button" class="wtx" data-wa="open" data-it="${esc(it._id)}"><b>${esc(w.type||"대기")}</b>${w.vendor?` · ${esc(w.vendor)}`:""} <span class="mono">${shortDate(w.due)}</span>${opt&&opt.owner?` <span class="wown">${esc(it.owner)}</span>`:""}
      <span class="wsub">${esc(it.project||"")}${it.part?` · ${esc(it.part)}`:""}${hc?` · 예정일 ${hc}번 바뀜`:""}${lv&&lv.quiet?" · 오늘 확인함":last&&!w.got?` · ${esc(shortDate(isoDay(last.at)))} 확인${last.memo?": "+esc(last.memo):""}`:""}${w.got?` · ${shortDate(w.got)} 받음`:""}</span></button>
    <span class="wact">${acts}</span>
    <div class="wchk" hidden><input type="text" class="wcm" placeholder="확인한 내용 (예: 협력사 통화, 다음 주 화요일 출고)" aria-label="확인 메모"><label>예정일 <input type="date" class="wcd" value="${esc(w.due)}"></label><button type="button" class="btn sm primary" data-wa="chksave" data-it="${esc(it._id)}" data-w="${esc(w.id)}">저장</button></div>
  </div>`}
function waitAlertsHtml(){
  const mine=myWaitAlerts(),team=teamWaitAlerts();
  if(!mine.length&&!team.length)return waitOn()?`<div class="wal"><div class="walh">📦 입고·회신 대기 <span>확인할 것 없음</span></div></div>`:"";
  const late=team.filter(a=>a.l.k==="late").length;
  return `<div class="wal"><div class="walh">📦 입고·회신 대기 <span>${mine.length?`${mine.length}건`:""}</span></div>
    ${mine.map(a=>waitRowHtml(a)).join("")}
    ${team.length?`<details class="walteam"${late?" open":""}><summary>👥 우리 팀 · 7일 안 ${team.length-late}건${late?` · <b>지연 ${late}건</b>`:""}</summary>${team.map(a=>waitRowHtml(a,{owner:true,ro:true})).join("")}</details>`:""}
  </div>`}
async function saveWaits(it,waits,msg){
  const {_id,...rest}=it;const body=Object.assign({},rest,{waits,updatedAt:new Date().toISOString()});delete body.sample;
  const old=it.waits;it.waits=waits;
  try{await st.db.doc("items/"+it._id).set(body);if(msg)toast(msg)}catch(e){it.waits=old;handleWriteErr(e)}
  paintNoticeDot();if(!$("noticeModal").hidden&&ntScope==="team"&&ntMode==="board")fillBoard();if(!$("sumDrawer").hidden&&st.sumFor===it._id)renderSummary();render()}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-wa]");if(!b)return;
  const it=st.items.find(i=>i._id===b.dataset.it);if(!it)return;
  const k=b.dataset.wa;
  if(k==="open"){if(!$("noticeModal").hidden)closeNotice();openSummary(it._id);return}
  if(!isMine(it))return;
  const ws=allWaits(it).map(x=>Object.assign({},x)),w=ws.find(x=>x.id===b.dataset.w);if(!w)return;
  const row=b.closest(".walr");
  if(k==="got"){w.got=todayKey;saveWaits(it,ws,`✓ ${w.type||"대기"} 받음으로 기록했어요`);return}
  if(k==="ack"){const l=waitLevel(w);w.ack=Object.assign({},w.ack||{},{[l&&l.k==="d15"?"15":"30"]:todayKey});saveWaits(it,ws,"확인했어요. 다음 알림 때 다시 알려 드려요");return}
  if(k==="chk"){const f=row&&row.querySelector(".wchk");if(f){f.hidden=!f.hidden;if(!f.hidden)f.querySelector(".wcm").focus()}return}
  if(k==="chksave"){const m=row.querySelector(".wcm").value.trim(),d1=row.querySelector(".wcd").value||w.due,now=new Date().toISOString();
    w.checks=[...(w.checks||[]),Object.assign({at:now,memo:m},d1!==w.due?{d0:w.due,d1}:{})];
    if(d1!==w.due){w.hist=[...(w.hist||[]),{at:now,d0:w.due,d1}];w.due=d1}
    saveWaits(it,ws,"확인 기록을 남겼어요. 오늘은 알림이 조용해져요");return}
});
/* 업무 창 편집 */
function waitEditPaint(){
  const ro=$("waitSec").dataset.ro==="1",types=waitTypes();
  const opt=(cur)=>[...new Set([...types,cur].filter(Boolean))].map(t=>`<option value="${esc(t)}"${t===cur?" selected":""}>${esc(t)}</option>`).join("");
  $("waitList").innerHTML=st.dWaits.length?st.dWaits.map((w,i)=>w.got?`<div class="wed got"><span class="wlv">받음</span><span class="wgt"><b>${esc(w.type)}</b>${w.vendor?` · ${esc(w.vendor)}`:""} · 예정 ${shortDate(firstDue(w))} → <b>${shortDate(w.got)} 받음</b>${delayOf(w)?` <span class="wlate">+${delayOf(w)}일</span>`:""}</span>${ro?"":`<button type="button" class="ib" data-we="ungot" data-i="${i}" title="받음 취소">↺</button>`}</div>`
    :`<div class="wed" data-i="${i}">
      ${w._typing?`<input class="wtyn" data-wnew="${i}" placeholder="새 종류 이름" aria-label="새 종류 이름 (예: 샘플 입고)" autocomplete="off">`
        :`<select class="sel wty" data-wf="type" data-i="${i}" aria-label="종류"${ro?" disabled":""}><option value="">종류</option>${opt(w.type)}<option value="__new">+ 새 종류…</option></select>`}
      <input class="wvd" data-wf="vendor" data-i="${i}" list="dl-vendor" value="${esc(w.vendor||"")}" placeholder="협력사" aria-label="협력사"${ro?" disabled":""}>
      <input class="wdu" type="date" data-wf="due" data-i="${i}" value="${esc(w.due||"")}" aria-label="예정일"${ro?" disabled":""}>
      ${ro?"":`<button type="button" class="btn sm" data-we="got" data-i="${i}">✓ 받음</button><button type="button" class="ib" data-we="del" data-i="${i}" aria-label="빼기">✕</button>`}
      ${(w.hist||[]).length||(w.checks||[]).length?`<div class="whis">처음 ${shortDate(firstDue(w))}${(w.hist||[]).map(h=>` → ${shortDate(h.d1)}`).join("")}${(w.checks||[]).length?` · 📞 확인 ${w.checks.length}번`:""}</div>`:""}
    </div>`).join(""):`<div class="wnone">${ro?"없어요":"견적서 · 제품처럼 밖에서 와야 하는 게 있으면 '+ 추가'를 누르세요. 예정일이 다가오면 팀 공지에서 알려 드려요."}</div>`;
}
$("waitAdd").onclick=()=>{const v=$("f-vendor").value;st.dWaits.push({id:"w"+Date.now().toString(36),type:waitTypes()[0]||"",vendor:v&&v!=="__new"&&v!=="없음"?v:"",due:"",at:new Date().toISOString()});waitEditPaint();setTimeout(()=>{const l=[...$("waitList").querySelectorAll(".wdu")].pop();if(l)l.focus()},30)};
$("waitList").addEventListener("input",e=>{const f=e.target.dataset.wf;if(!f)return;const w=st.dWaits[+e.target.dataset.i];if(w)w[f]=e.target.value.trim?e.target.value.trim():e.target.value});
$("waitList").addEventListener("change",e=>{const f=e.target.dataset.wf;if(!f)return;const i=+e.target.dataset.i,w=st.dWaits[i];if(!w)return;
  if(f==="type"&&e.target.value==="__new"){w._typing=true;waitEditPaint();const n=$("waitList").querySelector(`[data-wnew="${i}"]`);if(n)n.focus();return}
  w[f]=e.target.value});
// + 새 종류: 그 자리에서 쓰면 이 업무에 들어가고, 내 목록(대기 종류)에도 저절로 저장 → 목록에 따로 가지 않아도 됨
async function waitAddType(i,v){
  const w=st.dWaits[i];if(!w)return;delete w._typing;v=String(v||"").trim();
  if(!v){waitEditPaint();return}
  w.type=v;waitEditPaint();
  if(waitTypes().includes(v))return;
  const l=Object.assign({},st.me.my_lists||{});l.waitTypes=[...waitTypes(),v];
  try{await api.setPrefs(null,l);st.me.my_lists=l;applyLists();toast(`대기 종류에 '${v}'을(를) 넣었어요. 다음부터 목록에서 고를 수 있어요`)}catch(x){toast(errText(x))}}
$("waitList").addEventListener("keydown",e=>{const n=e.target.closest("[data-wnew]");if(!n)return;
  if(e.key==="Enter"){e.preventDefault();n.dataset.done="1";waitAddType(+n.dataset.wnew,n.value)}
  if(e.key==="Escape"){e.preventDefault();e.stopPropagation();n.dataset.done="1";waitAddType(+n.dataset.wnew,"")}});
$("waitList").addEventListener("focusout",e=>{const n=e.target.closest&&e.target.closest("[data-wnew]");if(!n||n.dataset.done)return;n.dataset.done="1";waitAddType(+n.dataset.wnew,n.value)});
$("waitList").addEventListener("click",e=>{const b=e.target.closest("[data-we]");if(!b)return;const i=+b.dataset.i,w=st.dWaits[i];if(!w)return;
  if(b.dataset.we==="del")st.dWaits.splice(i,1);else if(b.dataset.we==="got")w.got=todayKey;else if(b.dataset.we==="ungot")w.got=null;waitEditPaint()});
function waitEditOpen(it,ro){
  const on=(waitOn()&&canAddHere())||allWaits(it).length>0;
  $("waitSec").hidden=!on;$("waitSec").dataset.ro=ro?"1":"";$("waitAdd").hidden=!!ro||!waitOn()||!canAddHere();
  st.dWaits=allWaits(it).map(w=>JSON.parse(JSON.stringify(w)));if(on)waitEditPaint()}
function waitEditCollect(existing){   // 저장할 때: 빈 줄 빼고, 바뀐 예정일 기록 (만든 날 고친 건 처음 계획으로)
  if($("waitSec").hidden)return {waits:existing?allWaits(existing):undefined};
  const old=new Map(allWaits(existing).map(w=>[w.id,w])),now=new Date().toISOString(),out=[];let bad=null;
  st.dWaits.forEach(w=>{if(!w.type&&!w.due&&!w.vendor&&!old.has(w.id))return;
    if(!w.got&&(!w.type||!w.due)){bad=bad||w;return}
    const o=old.get(w.id),x=Object.assign({},w);delete x._typing;
    if(!o){x.at=x.at||now;x.plan={d:x.due,at:now}}
    else if(o.due!==x.due){if(isoDay(o.at||now)===todayKey&&!(o.hist||[]).length)x.plan={d:x.due,at:(o.plan&&o.plan.at)||now};else x.hist=[...(o.hist||[]),{at:now,d0:o.due,d1:x.due}]}
    out.push(x)});
  return {waits:out,bad}}
/* 표 · 캘린더 · 요약 */
function waitChipsHtml(it){
  const ow=openWaits(it).sort((a,b)=>(a.due||"").localeCompare(b.due||""));if(!ow.length)return "";
  return `<div class="wchips">${ow.slice(0,2).map(w=>{const l=waitLevel(w),d=dTo(w.due);return `<span class="wchip k-${l?l.k:"none"}">◆ ${esc(w.type)} ${shortDate(w.due)} <b>${d<0?`지연 ${-d}일`:d===0?"오늘":`D-${d}`}</b>${w.vendor?` · ${esc(w.vendor)}`:""}</span>`}).join("")}${ow.length>2?`<span class="wchip more">+${ow.length-2}</span>`:""}</div>`}
function waitsOnDay(day){const out=[];st.items.forEach(it=>{if(st.owner!=="전체"&&it.owner!==st.owner)return;allWaits(it).forEach(w=>{if((w.got?w.got:w.due)===day)out.push({it,w})})});return out}
/* 점검: 대기 목록 + 협력사 지연 통계 + 기록 내려받기 */
function waitReviewHtml(){
  if(!waitOn()&&!teamHasWaits())return "";
  const items=st.items.filter(it=>st.owner==="전체"||it.owner===st.owner);
  const open=[];items.forEach(it=>openWaits(it).forEach(w=>open.push({it,w,l:waitLevel(w)})));open.sort((a,b)=>a.w.due.localeCompare(b.w.due));
  const V=new Map();st.items.forEach(it=>allWaits(it).forEach(w=>{const v=w.vendor||"(협력사 없음)",r=V.get(v)||{v,n:0,late:0,sum:0,got:0,chk:0,open:0};r.n++;const dl=delayOf(w);if(dl>0){r.late++;r.sum+=dl}if(w.got)r.got++;else r.open++;r.chk+=(w.checks||[]).length;V.set(v,r)}));
  const vs=[...V.values()].sort((a,b)=>b.late-a.late||b.sum-a.sum||b.n-a.n);
  const often=vs.filter(r=>r.n>=2&&r.late/r.n>=0.5);
  return `<div class="panel wpanel"><h2>📦 입고·회신 대기 <span class="n">${open.length}</span><span>밖에서 와야 하는 것 · 예정일 순</span></h2>
    <div class="wplist">${open.length?open.map(a=>waitRowHtml(a,{owner:st.owner==="전체"})).join(""):`<div class="hint" style="padding:10px 2px;margin:0">기다리는 게 없어요.</div>`}</div>
    <h3 class="wph3">협력사별 지연 <span class="hint" style="margin:0">처음 예정일보다 늦은 날 기준 · 우리 팀 전체</span><button type="button" class="btn sm ghost" data-wcsv="1">⬇ 기록 내려받기 (엑셀)</button></h3>
    ${often.length?`<div class="woften">⚠ 자주 늦는 협력사: ${often.map(r=>`<b>${esc(r.v)}</b> (${r.late}/${r.n}건)`).join(", ")}</div>`:""}
    ${vs.length?`<div class="scroll"><table class="otable wtbl"><thead><tr><th>협력사</th><th>전체</th><th>늦음</th><th>평균 늦은 날</th><th>받음</th><th>기다리는 중</th><th>📞 확인</th></tr></thead><tbody>${vs.map(r=>`<tr><td><b>${esc(r.v)}</b></td><td class="mono">${r.n}</td><td class="mono ${r.late?"hot":"z"}">${r.late}</td><td class="mono">${r.late?(r.sum/r.late).toFixed(1)+"일":"-"}</td><td class="mono">${r.got}</td><td class="mono">${r.open}</td><td class="mono">${r.chk}</td></tr>`).join("")}</tbody></table></div>`:`<div class="hint wpnone">아직 기록이 없어요.</div>`}
  </div>`}
function waitCsv(){
  const q=v=>{const s=String(v==null?"":v);return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s};
  const rows=[["팀","담당","고객사","대상사업","품목","종류","협력사","처음 예정일","지금 예정일","받은 날","늦은 날","예정일 변경","확인 횟수","마지막 확인","마지막 확인 메모","만든 날"]];
  st.items.forEach(it=>allWaits(it).forEach(w=>{const c=(w.checks||[]),lc=c[c.length-1];rows.push([teamName(st.team),it.owner,it.customer,it.project,it.part,w.type,w.vendor,firstDue(w),w.due,w.got||"",delayOf(w),(w.hist||[]).length,c.length,lc?isoDay(lc.at):"",lc?lc.memo:"",w.at?isoDay(w.at):""])}));
  const blob=new Blob(["﻿"+rows.map(r=>r.map(q).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`입고회신기록_${teamName(st.team)}_${todayKey}.csv`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
document.addEventListener("click",e=>{if(e.target.closest("[data-wcsv]"))waitCsv()});
// core 화면에 끼워 넣는 조각들
function waitDayMark(d){const ws=waitsOnDay(d);if(!ws.length)return "";const lt=ws.some(x=>!x.w.got&&x.w.due<todayKey);
  return `<span class="mwait${lt?" late":""}${ws.every(x=>x.w.got)?" got":""}" title="${esc(ws.map(x=>`${x.w.type} · ${x.w.vendor||""} (${x.it.owner})`).join("\n"))}">◆${ws.length>1?ws.length:""}</span>`}
function waitDayList(wl,one){return wl&&wl.length?`<div class="mwlist">${wl.map(x=>waitRowHtml({it:x.it,w:x.w,l:waitLevel(x.w)},{owner:!one})).join("")}</div>`:""}
function waitSummaryHtml(it){return allWaits(it).length?`<div class="swaits"><div class="swh">📦 입고·회신 대기</div>${allWaits(it).map(w=>waitRowHtml({it,w,l:waitLevel(w)})).join("")}</div>`:""}
const waitDefaults=()=>WAIT0;
wkFeat("wait",{openWaits,allWaits,waitChipsHtml,waitsOnDay,waitDayMark,waitDayList,waitSummaryHtml,waitReviewHtml,waitEditOpen:(it,ro)=>{waitEditOpen(it,ro);return true},waitEditCollect,waitAlertCount,waitAlertsHtml,waitTypes,waitOn,waitDefaults});
