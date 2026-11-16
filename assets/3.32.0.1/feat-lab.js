/* rhy:se Weekly Plan — 🧪 실험실 (feat-lab.js, v3.32.0)
   아직 다듬는 중인 기능을 '개인이' 골라 켬 (팀장 추천 · 팀 설정 없음). 켜고 끄기는 기능 더하기와 같은 my_lists.mods[k]
   · 🌿 이번 주의 글 (feat-quote, 기능 더하기에서 옮김 — 켜 둔 사람은 그대로 켜짐)
   · 📅 한 주 돌아보기: 금요일 16시 뒤(주말 포함) 처음 열 때 이번 주 카드 한 번, 못 봤으면 월요일에 '지난주 박자'로. 나만 보는 '이번 주 한 줄'
   · 👏 박수: 켠 사람끼리만. 남이 끝낸 일에 한 번(다시 누르면 취소), 누가 쳤는지만 보임(순위 없음), 받은 박수는 하루 한 번 🔔 알림. 서버 27-claps.sql
   관리자가 ⚙ 관리 › 회사 › 🧩 회사 기능에서 실험실을 끄면(CO.modules.lab===false) 메뉴 · 기능 모두 꺼짐
   core.js 다음에 읽힘. core는 F("labPaint") · FS("clapTag") · FS("clapSumHtml")로만 부르고, 이 파일이 고장 나면 이 기능만 꺼짐 */
const LABS=[
  {k:"quote",icon:"🌿",name:"이번 주의 글",desc:"업무 화면 위쪽에 한 주를 여는 글귀 한 줄을 보여 드려요 (휴대폰은 점검 화면 위). 매주 월요일에 새 글로 바뀌고, 옛 명언과 rhy:se 글귀가 섞여 나와요.",who:"한 주를 짧은 글로 시작하고 싶은 분"},
  {k:"review",icon:"📅",name:"한 주 돌아보기",desc:"금요일 오후에 이번 주 박자를 카드 한 장으로 보여 드려요. 요일별로 끝낸 일, 다음 주로 넘어갈 일, 가장 오래 붙들었던 일. 나만 보는 '이번 주 한 줄'도 남길 수 있어요. 금요일에 못 보면 월요일에 한 번 더 보여 드려요.",who:"한 주를 짧게 정리하고 마무리하고 싶은 분"},
  {k:"clap",icon:"👏",name:"박수",desc:"팀원이 끝낸 일에 박수를 칠 수 있어요. 박수를 켠 사람끼리만 주고받고, 누가 쳤는지만 보여요 (개수 순위는 없어요). 받은 박수는 하루 한 번 🔔 알림으로 묶어서 알려 드려요.",who:"동료가 끝낸 일을 가볍게 응원하고 싶은 분"}];
const labVisible=()=>!!st.me&&!(typeof CO!=="undefined"&&CO&&CO.modules&&CO.modules.lab===false);
const labOn=k=>labVisible()&&!!F("modOn",k);
const labFind=k=>LABS.find(x=>x.k===k)||null;
const LBK=n=>"wk-lab-"+n+"-"+(st.me?st.me.email:"");
const lbGet=(n,d)=>{try{const v=localStorage.getItem(LBK(n));return v==null?d:JSON.parse(v)}catch(_){return d}};
const lbSet=(n,v)=>{try{localStorage.setItem(LBK(n),JSON.stringify(v))}catch(_){}};
const lbCalm=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 🧪 메뉴 · 실험실 창 ---------- */
function labNew(){const S=lbGet("seen",[]);return LABS.filter(x=>!S.includes(x.k)).length}
function labPaint(){const m=$("miLab");if(!m)return true;m.hidden=!labVisible();const d=$("miLabDot");if(d)d.hidden=!labNew();
  if(!$("labModal").hidden)labRender();
  clapBoot();rvAuto();return true}
function labRender(){const fb=$("miBoard")&&!$("miBoard").hidden;
  $("labList").innerHTML=LABS.map(m=>{const on=labOn(m.k);return `<div class="modc lab${on?" on":""}">
    <div class="modi">${m.icon}</div><div class="modb"><b>${esc(m.name)}</b><p>${esc(m.desc)}</p><span class="hint" style="margin:0">이런 분께: ${esc(m.who)}</span>
    <div class="labbtns">${m.k==="review"&&on?`<button type="button" class="btn sm" data-labrv="1">📅 지금 보기</button>`:""}${fb?`<button type="button" class="btn sm ghost" data-labfb="${m.k}">💬 써 보니 어때요?</button>`:""}</div></div>
    <label class="modt"><span class="switch"><input type="checkbox" data-lab="${m.k}"${on?" checked":""}><i></i></span><span>${on?"켜짐":"꺼짐"}</span></label></div>`}).join("")}
function labOpen(){if(!labVisible())return;$("userMenu").hidden=true;F("closeMods");lbSet("seen",LABS.map(x=>x.k));labPaint();labRender();$("mscrim").hidden=false;$("labModal").hidden=false;setTimeout(()=>$("labClose").focus(),30)}
function labClose(){$("labModal").hidden=true;if($("noticeModal").hidden&&$("modsModal").hidden&&$("alertModal").hidden)$("mscrim").hidden=true}
$("miLab").onclick=labOpen;$("labClose").onclick=labClose;$("labOk").onclick=labClose;
$("mscrim").addEventListener("click",()=>{if(!$("labModal").hidden)labClose()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("labModal").hidden){e.stopPropagation();labClose()}},true);
$("labList").addEventListener("change",async e=>{const k=e.target.dataset.lab;if(!k)return;const on=e.target.checked,m=labFind(k);e.target.disabled=true;
  try{await F("setMod",k,on);toast(`${m.icon} ${m.name}을(를) ${on?"켰어요":"껐어요"}`);if(k==="clap"){CL.at=0;clapBoot(true)}labRender()}
  catch(x){e.target.checked=!on;toast(errText(x))}finally{e.target.disabled=false}});
$("labList").addEventListener("click",e=>{
  if(e.target.closest("[data-labrv]")){labClose();rvOpen(CUR);return}
  const b=e.target.closest("[data-labfb]");if(!b)return;const m=labFind(b.dataset.labfb);labClose();F("boardOpen");
  setTimeout(()=>{const t=$("fbBody");if(t&&!t.value.trim()){t.value=`[🧪 실험실 · ${m.icon} ${m.name}] `;t.focus();t.setSelectionRange(t.value.length,t.value.length)}},80)});
// 🧩 기능 더하기 안에서 실험실로 가는 한 줄
function labModLine(){return labVisible()?`<button type="button" class="modlab" data-labgo="1"><span>🧪</span><span><b>실험실</b><small>다듬는 중인 새 기능을 먼저 써 볼 수 있어요 · 나에게만</small></span><i aria-hidden="true">›</i></button>`:""}
document.addEventListener("click",e=>{if(e.target.closest("[data-labgo]"))labOpen()});

/* ---------- 📅 한 주 돌아보기 ---------- */
const RV_DAYS=["월","화","수","목","금","토","일"];
function rvData(W){const me=st.me.email,end=keyOf(addDays(parseKey(W),6));
  const mine=st.items.filter(it=>it._email===me&&!it.co&&it.weeks&&it.weeks[W]);
  const days=[0,0,0,0,0,0,0],done=[],left=[];
  mine.forEach(it=>{const e=it.weeks[W];
    if(e.status==="완료"){const at=e.done_at&&e.done_at>=W&&e.done_at<=end?e.done_at:e.due&&e.due>=W&&e.due<=end?e.due:keyOf(addDays(parseKey(W),4));
      const di=Math.round((parseKey(at)-parseKey(W))/864e5);days[Math.max(0,Math.min(6,di))]++;
      const n=Object.keys(it.weeks).filter(k=>k<=W).length;done.push({it,e,n})}
    else if(!e.planned)left.push({it,e})});
  done.sort((a,b)=>b.n-a.n);
  const claps=labOn("clap")?CL.list.filter(c=>c.to_email===me&&c.created_at.slice(0,10)>=W&&c.created_at.slice(0,10)<=end):[];
  return {days,done,left,claps}}
// 요일별 끝낸 일을 심박선으로: 끝낸 날마다 두근 (많을수록 높게), 없는 날은 잔잔하게
function rvPulse(days){const show=days[5]||days[6]?7:5,Wd=340,H=92,base=62,gap=Wd/show;let d=`M0 ${base}`;const lab=[];
  for(let i=0;i<show;i++){const x=Math.round(gap*(i+.5)),c=days[i],h=c?14+Math.min(c,6)*7:3;
    d+=` L${x-12} ${base} L${x-6} ${base+(c?6:1)} L${x} ${base-h} L${x+6} ${base+(c?8:1)} L${x+12} ${base}`;
    lab.push(`<text x="${x}" y="${H-4}" class="rvd">${RV_DAYS[i]}</text>${c?`<text x="${x}" y="${base-h-6}" class="rvn">${c}</text>`:""}`)}
  d+=` L${Wd} ${base}`;
  return `<svg class="rvpulse${lbCalm()?"":" draw"}" viewBox="0 0 ${Wd} ${H}" role="img" aria-label="요일별 끝낸 일 ${days.slice(0,show).map((c,i)=>RV_DAYS[i]+" "+c).join(", ")}"><line x1="0" y1="${base}" x2="${Wd}" y2="${base}" class="rvb"/><path d="${d}" pathLength="1"/>${lab.join("")}</svg>`}
const rvLines=()=>(st.me.my_lists&&st.me.my_lists.wk_lines)||{};
function rvOpen(W){if(!st.me)return;const D=rvData(W),last=W!==CUR,fri=keyOf(addDays(parseKey(W),4));
  const L=rvLines(),prevLine=L[prevKey(W)],line=L[W]||"";
  const top=D.done[0],long=top&&top.n>=2?top:null;
  const names=[...new Set(D.claps.map(c=>c.from_name||c.from_email))];
  let m=$("rvModal");if(!m){m=document.createElement("div");m.id="rvModal";m.className="ex-modal rv-modal";document.body.appendChild(m);rvBind(m)}
  m.innerHTML=`<div class="ex-bg" data-rvclose="1"></div><section class="ex-box rvbox" role="dialog" aria-modal="true" aria-labelledby="rvT">
    <div class="ex-h"><b id="rvT">${last?"지난주 박자":"이번 주 박자"}</b><span class="dim">${shortDate(W)} – ${shortDate(fri)} · 나만 보는 카드</span><button type="button" class="ex-x" data-rvclose="1" aria-label="닫기">✕</button></div>
    ${rvPulse(D.days)}
    <div class="rvstats"><div><span>끝낸 일</span><b>${D.done.length}</b></div><div><span>${last?"넘어간 일":"다음 주로"}</span><b>${D.left.length}</b></div>${labOn("clap")?`<div><span>받은 👏</span><b>${D.claps.length}</b></div>`:""}</div>
    ${names.length?`<p class="rvclap">👏 ${esc(names.slice(0,4).join(", "))}${names.length>4?` 외 ${names.length-4}명`:""} 님이 박수를 보냈어요</p>`:""}
    ${long?`<div class="rvsec"><span>가장 오래 붙들었던 일</span><p><b>${esc(long.e.task)}</b> · ${long.n}주째 · ${last?"그 주에":"이번 주"} 완료</p></div>`:""}
    ${D.done.length?`<div class="rvsec"><span>${last?"그 주":"이번 주"}에 끝낸 일</span><ul>${D.done.slice(0,5).map(x=>`<li>${esc(x.e.task)}</li>`).join("")}${D.done.length>5?`<li class="dim">그 밖에 ${D.done.length-5}건</li>`:""}</ul></div>`:`<div class="rvsec"><p class="dim">${last?"그 주에":"이번 주에"} 끝낸 일이 아직 없어요. 그런 주도 있어요. 숨 고르기도 일이에요.</p></div>`}
    ${prevLine?`<div class="rvsec rvprev"><span>지난주의 나</span><p>“${esc(prevLine)}”</p></div>`:""}
    <div class="rvsec"><label for="rvLine">${last?"그 주":"이번 주"} 한 줄 <small>나만 봐요 · 다음 주 카드에 '지난주의 나'로 나와요</small></label><input id="rvLine" maxlength="80" value="${esc(line)}" placeholder="견적 세 건 마무리, 다음 주는 도면에 집중" data-rvw="${esc(W)}"></div>
    <div class="rvfoot"><span class="dim" id="rvState"></span><button type="button" class="btn primary" data-rvclose="1">닫기</button></div></section>`;
  m.hidden=false;lbSet("rv-"+W,1);setTimeout(()=>{const b=m.querySelector(".rvfoot .btn");if(b)b.focus({preventScroll:true})},40)}
async function rvSaveLine(){const i=$("rvLine");if(!i)return;const W=i.dataset.rvw,v=i.value.trim();const L=Object.assign({},rvLines());if((L[W]||"")===v)return;
  if(v)L[W]=v;else delete L[W];Object.keys(L).sort().slice(0,-12).forEach(k=>delete L[k]);   // 최근 12주만
  const l=Object.assign({},st.me.my_lists||{},{wk_lines:L});const s=$("rvState");
  try{await api.setPrefs(null,l);st.me.my_lists=l;if(s)s.textContent="✓ 남겼어요"}catch(x){if(s)s.textContent="";toast(errText(x))}}
function rvClose(){const m=$("rvModal");if(!m||m.hidden)return;rvSaveLine();m.hidden=true}
function rvBind(m){m.addEventListener("click",e=>{if(e.target.closest("[data-rvclose]"))rvClose()});
  m.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();rvClose()}if(e.key==="Enter"&&e.target.id==="rvLine"&&!e.isComposing){e.preventDefault();rvSaveLine()}});
  m.addEventListener("focusout",e=>{if(e.target.id==="rvLine")rvSaveLine()})}
// 저절로 한 번: 금 16시 뒤 · 주말 → 이번 주 / 월요일 → 못 본 지난주. 다른 창이 떠 있으면 다음 기회에
let rvWait=false;
function rvAuto(){if(!labOn("review")||!st.loaded||rvWait)return;const n=new Date(),dw=n.getDay();
  const W=(dw===5&&n.getHours()>=16)||dw===6||dw===0?CUR:dw===1?prevKey(CUR):null;if(!W||lbGet("rv-"+W,0)||!isMyTeam(st.team))return;
  const busy=()=>!$("mscrim").hidden||document.querySelector(".modal:not([hidden]),.drawer:not([hidden])")||($("wkBoot")&&!$("wkBoot").hidden)||($("rvModal")&&!$("rvModal").hidden);
  rvWait=true;setTimeout(()=>{rvWait=false;if(!busy()&&!lbGet("rv-"+W,0)&&labOn("review"))rvOpen(W)},1800)}   // 바쁘면 다음 그리기 때 다시

/* ---------- 👏 박수 (켠 사람끼리) ---------- */
const CL={users:new Set(),list:[],at:0,busy:false,sending:{}};
const clLow=e=>String(e||"").toLowerCase();
async function clapBoot(force){if(!labOn("clap")||CL.busy)return;if(!force&&Date.now()-CL.at<90e3)return;CL.busy=true;
  try{const since=keyOf(addDays(new Date(),-60));const [u,l]=await Promise.all([api.clapUsers(),api.clapList(since)]);
    const sig=JSON.stringify([u,l]);CL.users=new Set((u||[]).map(clLow));CL.list=l||[];CL.at=Date.now();
    if(CL.sig!==sig){CL.sig=sig;render();if(st.sumFor&&!$("sumDrawer").hidden)renderSummary()}F("alertPaint")}
  catch(_){CL.at=Date.now()}finally{CL.busy=false}}
const clOf=id=>CL.list.filter(c=>c.item_id===id);
const clDone=it=>{const w=it.weeks||{};return [CUR,prevKey(CUR)].some(k=>w[k]&&w[k].status==="완료")};   // 이번 주 · 지난주에 끝낸 일 (서버는 완료한 적 있는 업무면 허용)
const clCan=it=>labOn("clap")&&!!it&&!it.co&&!!it._email&&clLow(it._email)!==clLow(st.me.email)&&clDone(it)&&CL.users.has(clLow(it._email))&&CL.users.has(clLow(st.me.email));
function clapTag(it){if(!labOn("clap")||!it)return "";const L=clOf(it._id);if(!L.length)return "";
  const nm=L.map(c=>c.from_name||c.from_email).join(", "),mine=L.some(c=>clLow(c.from_email)===clLow(st.me.email));
  return `<span class="cltag${mine?" me":""}" title="👏 ${esc(nm)}">👏${L.length>1?" "+L.length:""}</span>`}
function clapSumHtml(it){if(!labOn("clap")||!it)return "";const L=clOf(it._id),mine=L.some(c=>clLow(c.from_email)===clLow(st.me.email));
  const nm=L.map(c=>clLow(c.from_email)===clLow(st.me.email)?"나":(c.from_name||c.from_email));
  const can=clCan(it);if(!can&&!L.length)return "";
  return `<div class="clrow">${can?`<button type="button" class="clbtn${mine?" on":""}" data-clap="${esc(it._id)}" aria-pressed="${mine}"><span class="clic" aria-hidden="true">👏</span>${mine?"박수 보냄":"박수"}</button>`:`<span class="clic" aria-hidden="true">👏</span>`}
    <span class="clwho">${nm.length?`${esc(nm.join(", "))} 님이 박수`:`끝낸 일에 박수를 보내 보세요`}</span></div>`}
document.addEventListener("click",async e=>{const b=e.target.closest("[data-clap]");if(!b)return;const id=b.dataset.clap,it=st.items.find(i=>i._id===id);if(!it||CL.sending[id])return;
  const mine=clOf(id).some(c=>clLow(c.from_email)===clLow(st.me.email));CL.sending[id]=1;
  if(!mine){b.classList.add("on");if(!lbCalm()&&b.animate){b.animate([{transform:"scale(1)"},{transform:"scale(1.18)"},{transform:"scale(.96)"},{transform:"scale(1)"}],{duration:380,easing:"ease-out"});
      const ic=b.querySelector(".clic");if(ic)ic.animate([{transform:"rotate(0)"},{transform:"rotate(-14deg)"},{transform:"rotate(10deg)"},{transform:"rotate(0)"}],{duration:420,easing:"ease-out"});clBurst(b)}
    try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}}
  try{if(mine){await api.clapDel(id);CL.list=CL.list.filter(c=>!(c.item_id===id&&clLow(c.from_email)===clLow(st.me.email)))}
    else{await api.clapAdd(id);CL.list.push({item_id:id,from_email:st.me.email,from_name:st.me.name,to_email:clLow(it._email),created_at:new Date().toISOString()})}
    CL.sig="";render();if(st.sumFor)renderSummary();const cb=$("clapBox");if(cb&&!$("drawer").hidden)cb.innerHTML=clapSumHtml(it)}
  catch(x){b.classList.toggle("on",mine);toast(x&&x.code==="42501"?"박수를 보낼 수 없어요. 상대가 박수를 껐을 수 있어요":errText(x));CL.at=0;clapBoot(true)}
  finally{delete CL.sending[id]}});
// 업무 창(휴대폰은 남의 업무도 이 창으로 열림): 읽기 전용 안내 아래에 박수 줄
function clapEditOpen(it){let b=$("clapBox");const h=it?clapSumHtml(it):"";
  if(!h){if(b)b.hidden=true;return true}
  if(!b){const ro=$("roNote");if(!ro)return true;b=document.createElement("div");b.id="clapBox";ro.insertAdjacentElement("afterend",b)}
  b.hidden=false;b.innerHTML=h;return true}
// 작은 펄스 고리 하나 (rhy:se 심박)
function clBurst(b){const r=document.createElement("i");r.className="clring";b.appendChild(r);r.animate([{transform:"scale(.4)",opacity:.7},{transform:"scale(1.9)",opacity:0}],{duration:520,easing:"ease-out"}).onfinish=()=>r.remove()}
// 🔔 하루 한 번 묶어서: 오늘 아직 안 봤고, 마지막으로 본 뒤 새 박수가 있으면 알림 하나
function clNew(){if(!labOn("clap"))return [];const S=lbGet("clseen",{d:"",t:""});if(S.d===todayKey)return [];
  return CL.list.filter(c=>c.to_email===clLow(st.me.email)&&c.created_at>(S.t||""))}
function clapAlertCount(){return clNew().length?1:0}
function clapAlertsHtml(){const L=clNew();if(!L.length)return "";const byItem={};L.forEach(c=>{(byItem[c.item_id]=byItem[c.item_id]||[]).push(c)});
  const ids=Object.keys(byItem),first=st.items.find(i=>i._id===ids[0]),task=first?((Object.entries(first.weeks||{}).sort().reverse().find(([,e])=>e.status==="완료")||[,{}])[1].task||first.project):"";
  const who=[...new Set(L.map(c=>c.from_name||c.from_email))];
  return `<div class="walr k-share"><span class="wlv">👏</span><button type="button" class="wtx" data-clalr="${esc(ids[0])}"><b>박수 ${L.length}개</b> · ${esc(who.slice(0,3).join(", "))}${who.length>3?` 외 ${who.length-3}명`:""}<span class="wsub">${task?`「${esc(task)}」`:""}${ids.length>1?` 외 ${ids.length-1}건`:""}</span></button><span class="wact"><button type="button" class="btn sm" data-clalr="${esc(ids[0])}">확인</button></span></div>`}
document.addEventListener("click",e=>{const b=e.target.closest("[data-clalr]");if(!b)return;const last=CL.list.filter(c=>c.to_email===clLow(st.me.email)).map(c=>c.created_at).sort().pop()||"";
  lbSet("clseen",{d:todayKey,t:last});F("alertClose");F("alertPaint");if(st.items.some(i=>i._id===b.dataset.clalr))openSummary(b.dataset.clalr)});

wkFeat("lab",{clapEditOpen,labPaint,labFind,labOn,labModLine,clapTag,clapSumHtml,clapAlertCount,clapAlertsHtml,rvOpen});
