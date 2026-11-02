/* rhy:se Weekly Plan — 관리 화면 (⚙ 관리를 누를 때 불러옴): 사람 · 조직도 · 팀 설정 · 회사 · 휴지통 */
/* ---------- 관리 화면 ---------- */
const adm={tab:"people",people:[],ov:{},fTeam:"",fState:"",q:"",bulk:false,grid:[],domain:"",imp:{}};
const isAdm=()=>!!(st.me&&st.me.is_admin);
async function openAdmin(){
  if(!st.me||!(st.me.is_admin||st.me.is_registrar))return;
  closeAll();$("adminPanel").hidden=false;
  // 열 때마다 처음 모양으로: 사람 탭, 필터·검색·등록 표 비우기
  Object.assign(adm,{org:null,org0:null,tab:"people",fTeam:"",fState:"",q:"",bulk:false,grid:[],imp:{},selTeam:null,newTeam:false,tdraft:null});
  $("adBody").innerHTML='<div class="adwrap"><p class="hint">불러오는 중…</p></div>';
  await loadAdmin();
}
async function loadAdmin(){
  try{
    const [pp,ov,tt]=await Promise.all([api.people(),api.overview(),api.teams()]);
    adm.people=pp;adm.ov=Object.fromEntries((ov||[]).map(o=>[o.email,o]));st.teams=tt;try{const us=await api.units();adm.units=us&&us.length?us:null}catch(_){adm.units=null}if(adm.tab==="org"&&isAdm())await loadOrg();
  }catch(e){$("adBody").innerHTML=`<div class="adwrap"><p class="err">관리 정보를 불러오지 못했어요. ${esc(errText(e))}</p></div>`;return}
  renderAdmin();
}
function pState(p){
  const o=adm.ov[p.email]||{};
  if(!p.active)return {k:"off",t:"퇴사"};
  if(o.lock_until&&new Date(o.lock_until)>new Date()){const m=Math.ceil((new Date(o.lock_until)-new Date())/60000);return {k:"lock",t:`잠김 (${m}분 남음)`}}
  if(p.must_change)return o.has_login?{k:"first",t:"처음 비밀번호 (초기화됨)"}:{k:"never",t:"처음 비밀번호 · 아직 로그인 안 함"};
  return {k:"ok",t:"사용 중"};
}
function renderAdmin(){$("adBody").classList.toggle("ogmode",adm.tab==="org");
  document.querySelectorAll("#adTabs [data-ad]").forEach(b=>b.setAttribute("aria-selected",b.dataset.ad===adm.tab));
  $("adTabTeams").hidden=!isAdm();$("adTabCo").hidden=!isAdm();$("adTabOrg").hidden=!isAdm();$("adTabTrash").hidden=!isAdm();
  $("adBody").innerHTML=`<div class="adwrap">${adm.tab==="org"&&isAdm()?orgHtml():adm.tab==="company"&&isAdm()?companyHtml():adm.tab==="teams"&&isAdm()?teamsHtml():adm.tab==="trash"&&isAdm()?trashHtml():peopleHtml()}</div>`;
  if(adm.bulk)gRefresh();
}
function peopleHtml(){
  const all=adm.people,cnt=k=>all.filter(p=>pState(p).k===k).length;
  const firstN=cnt("first")+cnt("never");
  let rows=all.filter(p=>(!adm.fTeam||p.team_id===adm.fTeam)&&(!adm.fState||(adm.fState==="first"?["first","never"].includes(pState(p).k):pState(p).k===adm.fState))&&(!adm.q||(p.name+" "+p.email).toLowerCase().includes(adm.q.toLowerCase())));
  const so=adm.pSort||{},rec=adm.recent||[],ri=p=>{const i=rec.indexOf(p.email);return i<0?1e9:i};
  const sv={name:p=>p.name,email:p=>p.email,unit:p=>pUnitLabel(p)||"",perm:p=>(p.is_admin?0:p.is_registrar?1:p.role==="leader"?2:3),state:p=>pState(p).t,login:p=>(adm.ov[p.email]||{}).last_login||""};
  if(so.key&&sv[so.key])rows.sort((a,b)=>{const x=sv[so.key](a),y=sv[so.key](b);return (typeof x==="number"?x-y:String(x).localeCompare(String(y),"ko"))*so.dir||personOrder(a,b)});
  else rows.sort((a,b)=>ri(a)-ri(b)||(a.active?0:1)-(b.active?0:1)||(st.teams.findIndex(t=>t.id===a.team_id)-st.teams.findIndex(t=>t.id===b.team_id))||personOrder(a,b));
  const sb_=(k,l,n)=>`<button type="button" data-fst="${k}" aria-pressed="${adm.fState===k}"><b>${n}</b>${l}</button>`;
  return `
  <div class="adstat">${sb_("","전체",all.length)}${sb_("first","처음 비밀번호 그대로",firstN)}${sb_("lock","잠김",cnt("lock"))}${sb_("off","퇴사",cnt("off"))}</div>
  <div class="adbar">
    <select class="sel" id="adTeamF" aria-label="소속으로 보기"><option value="">모든 소속</option>${st.teams.map(t=>`<option value="${esc(t.id)}"${adm.fTeam===t.id?" selected":""}>${esc(t.name)}</option>`).join("")}</select>
    <input class="search" type="search" id="adQ" placeholder="이름·메일 검색" value="${esc(adm.q)}" aria-label="이름이나 메일로 찾기">
    <span class="spacer"></span>
    <button class="btn primary" type="button" data-adact="bulk"${adm.bulk?" hidden":""}>＋ 인원 추가</button>
  </div>
  ${adm.bulk?gridCardHtml():""}
  ${firstN?`<p class="hint" style="margin:0">처음 비밀번호(0426) 그대로인 사람이 ${firstN}명 있어요. 0426은 모두가 아는 번호라, 빨리 로그인해서 바꾸도록 안내해 주세요.</p>`:""}
  ${peopleTable(rows)}`;
}
function peopleTable(rows,emptyMsg){
  return `<div class="adtbl"><table>
    <thead><tr>${[["name","이름"],["email","회사 메일"],["unit","소속"],["perm",'권한 <span class="hint" style="font-weight:400">(체크하면 바로 저장)</span>'],["state","상태"],["login","마지막 로그인"]].map(([k,l])=>{const so=adm.pSort||{},on=so.key===k;
      return `<th class="psort${on?" on":""}" data-psort="${k}" aria-sort="${on?(so.dir>0?"ascending":"descending"):"none"}" title="눌러서 정렬">${l}<i>${on?(so.dir>0?"▲":"▼"):"↕"}</i></th>`}).join("")}<th style="text-align:right">관리</th></tr></thead>
    <tbody>${rows.map(p=>{const s_=pState(p),o=adm.ov[p.email]||{},lockOk=!isAdm()&&p.is_admin,isNew=(adm.recent||[]).includes(p.email);
      return `<tr class="${p.active?"":"off"}${isNew?" pnew":""}">
        <td><b>${esc(p.name)}</b>${p.email===st.me.email?'<span class="rtag">나</span>':""}${isNew?'<span class="rtag new">새로 등록</span>':""}</td>
        <td class="em" title="${esc(p.email)}">${esc(p.email)}</td><td>${esc(pUnitLabel(p)||"-")}</td><td>${permBoxes(p,lockOk)}</td>
        <td><span class="sdot ${s_.k}">${esc(s_.t)}</span></td>
        <td class="mono" style="font-size:12px">${o.last_login?esc(fmtDT(o.last_login)):"-"}</td>
        <td><div class="acts">${s_.k==="lock"?`<button class="btn" type="button" data-unlock="${esc(p.email)}">잠금 풀기</button>`:""}${p.active&&!lockOk&&s_.k!=="never"?`<button class="btn" type="button" data-reset="${esc(p.email)}">0426 초기화</button>`:""}${lockOk?'<span class="hint" style="margin:0">관리자만 수정</span>':`<button class="btn" type="button" data-edit="${esc(p.email)}">수정</button>`}</div></td></tr>`}).join("")||`<tr><td colspan="7" class="hint">${esc(emptyMsg||"조건에 맞는 사람이 없어요.")}</td></tr>`}</tbody>
  </table></div>`;
}
/* ----- 권한 체크박스 (사람 목록) ----- */
function permBoxes(p,lockOk){
  const self=p.email===st.me.email,off=!p.active||lockOk;
  const box=(k,label,on,dis,tip)=>`<label class="pchk${dis?" dis":""}" title="${esc(tip||"")}"><input type="checkbox" data-perm="${k}" data-em="${esc(p.email)}"${on?" checked":""}${dis?" disabled":""}>${label}</label>`;
  return `<div class="pchks">${p.role==="leader"?'<span class="rtag" title="팀장은 조직도에서 정해요">팀장</span>':""}${box("reg","등록 담당자",p.is_registrar||p.is_admin,off||!isAdm()||p.is_admin,isAdm()?(p.is_admin?"관리자는 등록 권한을 함께 가져요":"사람 등록·초기화를 할 수 있어요"):"관리자만 바꿀 수 있어요")}${box("adm","관리자",p.is_admin,off||!isAdm()||self,self?"내 관리자 권한은 스스로 뺄 수 없어요":isAdm()?"모든 관리를 할 수 있어요":"관리자만 바꿀 수 있어요")}</div>`;
}
async function setPerm(email,k,on,el){
  const p=adm.people.find(x=>x.email===email);if(!p)return;
  const patch=k==="leader"?{role:on?"leader":"member"}:k==="reg"?{is_registrar:on}:{is_admin:on,...(on?{is_registrar:true}:{})};
  const what=k==="leader"?"팀장":k==="reg"?"등록 담당자":"관리자";
  el.disabled=true;
  try{await api.updatePerson(email,patch);Object.assign(p,patch);toast(`${p.name} 님 ${what} 권한을 ${on?"줬어요":"뺐어요"}`);renderAdmin();refreshSoon()}
  catch(x){el.checked=!on;el.disabled=false;toast(errText(x))}
}

/* ----- 여러 명 등록: 표에 직접 쓰거나 엑셀에서 붙여넣기 ----- */
const G_FIELDS=["email","name","team","reg","adm"];
const gBlank=()=>({email:"",name:"",team:adm.gPreset||"",reg:false,adm:false});   // 소속은 "선택"에서 시작 (조직도에서 왔으면 그 조직)
function gDomain(){return (adm.domain||"").replace(/^@+/,"").trim()}
function gEmail(v){v=String(v||"").trim().toLowerCase();if(v&&!v.includes("@")&&gDomain())v+="@"+gDomain();return v}
function gridCardHtml(){
  if(!adm.grid.length)adm.grid=Array.from({length:5},gBlank);
  if(!adm.domain){try{adm.domain=localStorage.getItem("wk-mail-domain")||""}catch(_){}if(!adm.domain)adm.domain=(st.me.email.split("@")[1]||"")}
  return `<div class="adcard" id="gCard">
    <h3>인원 추가${adm.gFrom&&pU(adm.gFrom)?` <span class="hint" style="font-weight:400;margin:0">· ${esc(pU(adm.gFrom).name)}에서 시작 — 등록하면 조직도로 돌아가요</span>`:""}</h3>
    <p class="hint">한 명이든 여러 명이든 여기서 등록해요. 표에 바로 쓰거나, 엑셀에서 <b>메일 · 이름 · 소속</b> 칸을 복사해 <b>첫 칸을 누르고 붙여넣기(Ctrl+V)</b> 하세요. 소속은 팀 이름이나 <b>생산본부 &gt; 생산관리팀</b>처럼 적어요. 팀장·직책은 조직도에서 정해요. 이미 등록된 메일이면 이름·소속·권한만 바뀌고 비밀번호는 그대로예요.</p>
    <div class="adbar"><label for="adDomain" style="font-size:13px;font-weight:600">회사 메일 뒷부분</label><span class="mono">@</span><input id="adDomain" class="gdom" value="${esc(gDomain())}" placeholder="company.com" autocomplete="off"><span class="hint" style="margin:0">메일 칸에 아이디만 쓰면 이 주소가 자동으로 붙어요.</span></div>
    <div class="adtbl"><table class="gtbl"><thead><tr><th style="width:36px">#</th><th>회사 메일</th><th>이름</th><th>소속</th>${isAdm()?'<th class="c">등록 담당자</th><th class="c">관리자</th>':""}<th>확인</th><th></th></tr></thead>
      <tbody id="gBody">${adm.grid.map(gRowHtml).join("")}</tbody></table></div>
    <div class="adbar"><button class="btn" type="button" data-adact="gadd">+ 5줄 더</button><button class="btn ghost" type="button" data-adact="gclear">표 비우기</button><span class="spacer"></span><span class="hint" id="gSum" style="margin:0"></span><button class="btn ghost" type="button" data-adact="bulkclose">${adm.gFrom?"← 조직도로":"닫기"}</button><button class="btn primary" type="button" data-adact="gcommit" id="gCommit" disabled>등록하기</button></div>
  </div>`;
}
function gRowHtml(r,i){
  const ck=(f)=>`<td class="c"><input type="checkbox" data-g="${i}:${f}"${r[f]?" checked":""} aria-label="${i+1}번째 줄 ${f==="leader"?"팀장":f==="reg"?"등록 담당자":"관리자"}"></td>`;
  return `<tr data-gi="${i}"><td class="mono hint">${i+1}</td>
    <td><input data-g="${i}:email" value="${esc(r.email)}" placeholder="아이디 또는 메일" autocomplete="off" spellcheck="false" aria-label="${i+1}번째 줄 메일"></td>
    <td><input data-g="${i}:name" value="${esc(r.name)}" autocomplete="off" aria-label="${i+1}번째 줄 이름"></td>
    <td><select data-g="${i}:team" aria-label="${i+1}번째 줄 소속">${r.team?"":'<option value="" selected>선택</option>'}${pUnitOpts(r.team)}</select></td>
    ${isAdm()?ck("reg")+ck("adm"):""}
    <td class="gst" data-gs="${i}"></td><td><button class="ib" type="button" data-gdel="${i}" aria-label="${i+1}번째 줄 지우기">✕</button></td></tr>`;
}
const gFilled=r=>!!(r.email.trim()||r.name.trim());
function gCheck(){
  const byEmail=Object.fromEntries(adm.people.map(p=>[p.email,p]));
  const cnt={};adm.grid.forEach(r=>{if(gFilled(r)){const e=gEmail(r.email);if(e)cnt[e]=(cnt[e]||0)+1}});
  return adm.grid.map(r=>{
    if(!gFilled(r))return {st:"empty",msg:""};
    const email=gEmail(r.email),pl=pPlace(r.team),team=st.teams.find(t=>t.id===pl.team_id);
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return {st:"err",msg:r.email.trim()?"메일 형식이 맞지 않아요":"메일이 비어 있어요",f:"email"};
    if(cnt[email]>1)return {st:"err",msg:"표 안에 같은 메일이 또 있어요",f:"email"};
    if(!r.name.trim())return {st:"err",msg:"이름이 비어 있어요",f:"name"};
    if(!team)return {st:"err",msg:"소속을 골라주세요",f:"team"};
    const ex=byEmail[email];
    const sameName=adm.people.find(p=>p.email!==email&&p.active&&p.team_id===team.id&&p.name===r.name.trim());
    const warn=sameName?` · 같은 팀에 같은 이름(${sameName.email})이 있어요`:"";
    if(!ex)return {st:"new",msg:"새로 등록"+warn,email};
    if(ex.is_admin&&!isAdm())return {st:"err",msg:"이미 등록된 관리자예요 (관리자만 수정)",f:"email"};
    const ch=[ex.name!==r.name.trim()?`이름 ${ex.name}→${r.name.trim()}`:"",(ex.team_id!==team.id||(adm.units&&(pUnitOf(ex)||"")!==(pl.unit_id||"")))?`소속 ${pUnitLabel(ex)||"-"}→${pUnitLabelId(pl.unit_id)||team.name}`:"",
      isAdm()&&!!ex.is_registrar!==!!(r.reg||r.adm)?(r.reg||r.adm?"등록 담당자 지정":"등록 담당자 해제"):"",isAdm()&&!!ex.is_admin!==!!r.adm?(r.adm?"관리자 지정":"관리자 해제"):""].filter(Boolean);
    if(!ch.length)return {st:"same",msg:"이미 같은 정보로 등록돼 있어요",email};
    if(ex.email===st.me.email&&ex.is_admin&&!r.adm)return {st:"err",msg:"내 관리자 권한은 스스로 뺄 수 없어요",f:"adm"};
    return {st:"upd",msg:"이미 등록됨 → 바뀌는 것: "+ch.join(", ")+warn,email};
  });
}
function gRefresh(){
  const res=gCheck();let n=0,u=0,e=0;
  res.forEach((x,i)=>{const td=document.querySelector(`[data-gs="${i}"]`);if(!td)return;
    td.className="gst pv-"+(x.st==="empty"?"same":x.st);td.textContent=x.msg;
    const tr=td.closest("tr");tr.classList.toggle("gerr",x.st==="err");
    tr.querySelectorAll("[data-g]").forEach(el=>el.classList.toggle("bad",x.st==="err"&&el.dataset.g.endsWith(":"+x.f)));
    if(x.st==="new")n++;if(x.st==="upd")u++;if(x.st==="err")e++});
  const b=$("gCommit");if(!b)return;
  b.disabled=!!e||!(n+u);b.textContent=n+u?`등록하기 (새로 ${n}명${u?`, 변경 ${u}명`:""})`:"등록하기";
  $("gSum").textContent=e?`확인이 필요한 줄이 ${e}개 있어요. 빨간 칸을 고쳐주세요.`:"";
  $("gSum").className=e?"pv-err":"hint";
}
function gRender(){const b=$("gBody");if(b){b.innerHTML=adm.grid.map(gRowHtml).join("");gRefresh()}}
const gYes=v=>/^(o|○|●|◯|y|yes|예|v|✓|✔|1|true|체크|팀장|등록|관리자)$/i.test(String(v||"").trim());
function gPaste(i0,f0,text){
  let lines=text.replace(/\r/g,"").split("\n");while(lines.length&&!lines[lines.length-1].trim())lines.pop();
  if(lines.length&&/메일|email/i.test(lines[0].split("\t")[0])&&f0==="email")lines.shift();
  const c0=G_FIELDS.indexOf(f0);
  lines.forEach((ln,k)=>{
    const i=i0+k;while(adm.grid.length<=i)adm.grid.push(gBlank());const r=adm.grid[i];
    ln.split("\t").forEach((v,c)=>{const f=G_FIELDS[c0+c];if(!f)return;v=v.trim();
      if(f==="email")r.email=gEmail(v);
      else if(f==="name")r.name=v;
      else if(f==="team"){const u=pFindUnit(v);if(u)r.team=u;else if(v)r.team="__bad:"+v}
      else if(isAdm())r[f]=gYes(v);});
  });
  gRender();
  const bad=adm.grid.filter(r=>String(r.team).startsWith("__bad:"));
  if(bad.length){toast(`없는 소속이 있어요: ${[...new Set(bad.map(r=>r.team.slice(6)))].join(", ")} — 그 줄의 소속을 골라주세요.`);bad.forEach(r=>r.team="");gRender()}
  else toast(`${lines.length}줄을 붙여넣었어요`);
}
// 조직도에서 '사람 추가'로 왔으면 끝난 뒤 그 조직 화면으로 돌아감
async function ogBack(uid,flash){adm.tab="org";adm.org=null;await loadAdmin();const o=adm.org;if(o&&o.units.some(u=>u.id===uid)){o.sel=uid;o.editing=true;o.flash=(flash||[])[0]||null}renderAdmin()}
function gOpen(fromUnit,firstName){adm.tab="people";adm.bulk=true;adm.gFrom=fromUnit||null;adm.gPreset=fromUnit||"";adm.grid=Array.from({length:5},gBlank);if(firstName)adm.grid[0].name=firstName;
  renderAdmin();gRefresh();setTimeout(()=>{const f=document.querySelector('[data-g="0:email"]');if(f){f.focus();f.scrollIntoView({block:"center"})}},30)}
async function commitGrid(){
  const res=gCheck();if(res.some(x=>x.st==="err"))return;
  const rows=adm.grid.map((r,i)=>({r,x:res[i]})).filter(o=>o.x.st==="new"||o.x.st==="upd");if(!rows.length)return;
  const val=({r},email)=>{const pl=pPlace(r.team);return Object.assign({email,name:r.name.trim(),team_id:pl.team_id},adm.units?{unit_id:pl.unit_id}:{},isAdm()?{is_registrar:!!(r.reg||r.adm),is_admin:!!r.adm}:{})};
  $("gCommit").disabled=true;
  try{
    const add=rows.filter(o=>o.x.st==="new").map(o=>val(o,o.x.email));
    if(add.length){await api.addPeople(add);adm.recent=[...add.map(x=>x.email),...(adm.recent||[]).filter(x=>!add.some(y=>y.email===x))];adm.pSort=null}
    for(const o of rows.filter(o=>o.x.st==="upd")){const {email,...patch}=val(o,o.x.email);await api.updatePerson(email,patch)}
    toast(`${add.length}명 등록${rows.length-add.length?`, ${rows.length-add.length}명 변경`:""}했어요. 처음 비밀번호는 0426이에요.`);
    adm.bulk=false;adm.grid=[];adm.gPreset="";const from=adm.gFrom;adm.gFrom=null;
    if(from)await ogBack(from,add.map(x=>x.email));else await loadAdmin();refreshSoon();
  }catch(e){toast(errText(e));gRefresh()}
}
function personDlg(email,presetTeam,presetUnit,presetName){
  const p=email?adm.people.find(x=>x.email===email):null,o=p?adm.ov[p.email]||{}:{};
  const self=p&&p.email===st.me.email;
  $("adDlg").innerHTML=`<div class="mtop"><span class="mtag" id="adDlgTitle">${p?"사람 정보 수정":"한 명 등록"}</span><button class="btn ghost icon" type="button" data-dlg="close" aria-label="닫기">✕</button></div>
  <form id="pForm" novalidate class="adf" style="margin-top:12px">
    <div class="f full"><label for="pf-email">회사 메일 (아이디)</label><input id="pf-email" type="email" value="${p?esc(p.email):""}" ${p?"readonly":""} placeholder="name@company.com">${p?'<span class="hint" style="margin:0">메일은 바꿀 수 없어요. 바뀌었으면 새로 등록하고 이 사람은 퇴사 처리해 주세요.</span>':""}</div>
    <div class="f"><label for="pf-name">이름</label><input id="pf-name" value="${p?esc(p.name):esc(presetName||"")}" autocomplete="off"></div>
    <div class="f"><label for="pf-team">소속</label><select id="pf-team">${(()=>{const cur=p?pUnitOf(p):(presetUnit||pUnitOfTeam(presetTeam)||"");return (cur?"":'<option value="" selected disabled>소속을 골라주세요</option>')+pUnitOpts(cur)})()}</select></div>
    <div class="f"><span style="font-size:12.5px;font-weight:600">역할</span><span class="hint" style="margin:0">${p&&p.role==="leader"?"<b>팀장</b> · ":""}팀장·직책은 조직도에서 정해요</span></div>
    ${isAdm()?`<div class="f"><span style="font-size:12.5px;font-weight:600">추가 권한 (관리자만 지정)</span>
      <label class="chk"><input type="checkbox" id="pf-reg"${p&&p.is_registrar?" checked":""}> 등록 담당자 (사람 등록·초기화)</label>
      <label class="chk"><input type="checkbox" id="pf-adm"${p&&p.is_admin?" checked":""}${self?" disabled":""}> 관리자 (전체 관리)</label></div>`:""}
    ${p?`<div class="f full"><span style="font-size:12.5px;font-weight:600">상태</span><div class="adbar">
      <span class="sdot ${pState(p).k}">${esc(pState(p).t)}</span><span class="spacer"></span>
      ${self?"":p.active?`<button class="btn" type="button" data-dlg="off">퇴사 처리</button>`:`<button class="btn" type="button" data-dlg="on">다시 사용</button>`}
      ${!self&&!o.has_login?`<button class="btn danger" type="button" data-dlg="del">등록 취소(삭제)</button>`:""}</div>
      <p class="hint" style="margin:0">퇴사 처리하면 로그인만 막히고 그 사람이 쓴 업무 기록은 남아요.</p></div>`:'<p class="hint full" style="margin:0">등록하면 처음 비밀번호는 0426이에요. 처음 로그인할 때 본인이 숫자 6자리로 바꿔요.</p>'}
    <p class="err full" id="pfErr2" hidden></p>
    <div class="mfoot full" id="pfFoot"><span class="spacer"></span><button class="btn" type="button" data-dlg="close">취소</button><button class="btn primary" type="submit">${p?"저장":"등록"}</button></div>
  </form>`;
  $("adScrim").hidden=false;$("adDlg").hidden=false;$("adDlg").dataset.email=email||"";
  setTimeout(()=>(p?$("pf-name"):$("pf-email")).focus(),30);
}
function closeDlg(){$("adDlg").hidden=true;$("adScrim").hidden=true;$("adDlg").innerHTML=""}
function confirmDlg(title,text,okLabel,danger,fn){
  $("adDlg").innerHTML=`<div class="mtop"><span class="mtag" id="adDlgTitle">${esc(title)}</span></div><p style="margin:14px 0 0;line-height:1.6">${text}</p>
    <div class="mfoot"><span class="spacer"></span><button class="btn" type="button" data-dlg="close">취소</button><button class="btn ${danger?"danger":"primary"}" type="button" id="cfOk">${esc(okLabel)}</button></div>`;
  $("adScrim").hidden=false;$("adDlg").hidden=false;
  $("cfOk").onclick=async()=>{$("cfOk").disabled=true;try{await fn();closeDlg()}catch(e){toast(errText(e));$("cfOk").disabled=false}};
  setTimeout(()=>$("cfOk").focus(),30);
}
$("adDlg").addEventListener("click",async e=>{
  const b=e.target.closest("[data-dlg]");if(!b)return;const k=b.dataset.dlg,email=$("adDlg").dataset.email;
  if(k==="close"){closeDlg();return}
  const p=adm.people.find(x=>x.email===email);if(!p)return;
  if(k==="off")confirmDlg("퇴사 처리",`<b>${esc(p.name)}</b> 님을 퇴사 처리할까요? 로그인만 막히고 업무 기록은 남아요.`,"퇴사 처리",true,async()=>{await api.updatePerson(email,{active:false});toast(`${p.name} 님을 퇴사 처리했어요`);await loadAdmin();refreshSoon()});
  if(k==="on"){try{await api.updatePerson(email,{active:true});toast(`${p.name} 님을 다시 사용하게 했어요`);closeDlg();await loadAdmin();refreshSoon()}catch(x){toast(errText(x))}}
  if(k==="del")confirmDlg("등록 취소",`<b>${esc(p.name)}</b> (${esc(p.email)}) 등록을 취소할까요? 아직 한 번도 로그인하지 않은 사람만 지울 수 있어요.`,"삭제",true,async()=>{await api.deletePerson(email);toast("등록을 취소했어요");await loadAdmin()});
});
$("adDlg").addEventListener("submit",async e=>{
  if(e.target.id!=="pForm")return;e.preventDefault();
  const email=$("adDlg").dataset.email,isNew=!email;
  const pl=pPlace($("pf-team").value),v={email:$("pf-email").value.trim().toLowerCase(),name:$("pf-name").value.trim(),team_id:pl.team_id};if(adm.units)v.unit_id=pl.unit_id;
  if(!v.team_id){$("pfErr2").textContent="소속을 골라주세요.";$("pfErr2").hidden=false;return}
  if(isAdm()){v.is_registrar=$("pf-reg").checked;v.is_admin=$("pf-adm").checked}
  const err=m=>{$("pfErr2").textContent=m;$("pfErr2").hidden=false};
  if(isNew&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)){err("회사 메일 주소를 정확히 넣어주세요.");return}
  if(!v.name){err("이름을 넣어주세요.");return}
  if(isNew&&adm.people.some(p=>p.email===v.email)){err("이미 등록된 메일이에요. 목록에서 찾아 수정해 주세요.");return}
  try{
    if(isNew){await api.addPeople([v]);adm.recent=[v.email,...(adm.recent||[]).filter(x=>x!==v.email)];adm.pSort=null;toast(`${v.name} 님을 등록했어요. 처음 비밀번호는 0426이에요.`)}
    else{const {email:_e,...patch}=v;await api.updatePerson(email,patch);toast("저장했어요")}
    closeDlg();await loadAdmin();refreshSoon();
  }catch(x){err(errText(x))}
});
$("adScrim").onclick=closeDlg;
/* ----- 휴지통 (관리자만): 지운 업무·사람 되살리기 ----- */
async function loadTrash(){try{adm.trash=await api.trashList();adm.trashErr=""}catch(e){adm.trash=[];adm.trashErr=errText(e)}}
function trashHtml(){
  const L=adm.trash||[];
  const what=t=>{const d=t.data||{};if(t.tbl==="wk_people")return `<b>${esc(d.name||"")}</b> <span class="em">${esc(t.row_id)}</span>`;
    const it=d.data||{},w=it.weeks||{},k=Object.keys(w).sort().pop(),task=k&&w[k]?w[k].task:"";
    return `<b>${esc(it.project||"업무")}</b>${it.part?" · "+esc(it.part):""}<br><span class="hint" style="margin:0">${esc(task||"")}${it.owner?" · 담당 "+esc(it.owner):""}</span>`};
  return `<p class="hint" style="margin:0">지운 업무와 등록 취소한 사람이 여기에 남아요. 팀원에게는 보이지 않고 관리자만 볼 수 있어요. '되살리기'를 누르면 지우기 전 모습으로 돌아가요. 되살린 사람은 처음 로그인 때 비밀번호를 다시 정해요.</p>
  ${adm.trashErr?`<p class="err">${esc(adm.trashErr)}</p>`:""}
  <div class="adtbl"><table><thead><tr><th>지운 때</th><th>종류</th><th>내용</th><th>팀</th><th>지운 사람</th><th style="text-align:right">되살리기</th></tr></thead>
  <tbody>${L.map(t=>`<tr class="${t.restored_at?"off":""}"><td class="mono" style="font-size:12px;white-space:nowrap">${esc(fmtDT(t.deleted_at))}</td><td>${t.tbl==="wk_people"?"사람":"업무"}</td><td>${what(t)}</td><td>${esc(teamName(t.team_id)||"-")}</td><td class="em">${esc(t.deleted_by||"-")}</td>
    <td><div class="acts">${t.restored_at?`<span class="hint" style="margin:0">${esc(fmtDT(t.restored_at).slice(5))} 되살림</span>`:`<button class="btn" type="button" data-trestore="${esc(t.id)}">되살리기</button>`}</div></td></tr>`).join("")||'<tr><td colspan="6" class="hint">휴지통이 비어 있어요.</td></tr>'}</tbody></table></div>`;
}
/* ----- 팀 이름에 맞는 '구분' 예시 ----- */
const CAT_PRESETS=[  /* 위에서부터 먼저 맞는 것을 씀 ('관리'처럼 흔한 말은 맨 아래) */
  [/품질|QA|QC|검사/i,["수검","출장검사","성적서","고객사 대응","불량·클레임","시정조치","품보","심사·감사","기타"]],
  [/생산|제조|공정|조립/i,["생산 계획","생산 일정","공정 관리","자재 소요·수급","자재 입출고","재고 관리","외주 관리","출하","기타"]],
  [/구매|조달|외주|자재/i,["발주","납기 관리","견적·단가","협력사 관리","입고·검수","계약","기타"]],
  [/물류|출하|창고/i,["입고","출고","재고 관리","운송","포장","기타"]],
  [/설계|개발|연구|기술|R&D/i,["설계","시험·검증","도면","기술 문서","회의","고객 대응","기타"]],
  [/원가|영업|마케팅|사업/i,["견적","원가 분석","수주","계약","고객 미팅","출장","입찰","기타"]],
  [/경영|지원|총무|인사|재무|회계|관리/i,["인사","총무","회계·결산","교육","행사","예산","문서·보고","기타"]]];
const catPreset=name=>{const f=CAT_PRESETS.find(([re])=>re.test(name||""));return f?[...f[1]]:["회의","보고","문서 작성","협업","교육","기타"]};
/* ----- 팀: 위에 팀 목록 표, 고르면 아래에 그 팀 정보 ----- */
const T_LISTS=[["projects","대상사업","예: PKMR"],["customers","고객사","예: 한화시스템"],["vendors","협력사","예: 대호정밀"],["cats","구분","예: 수검"]];
function tDraftOf(id){const t=st.teams.find(x=>x.id===id);if(!t)return null;const L=t.lists||{};
  return {id:t.id,name:t.name,sort:t.sort,lists:Object.fromEntries(T_LISTS.map(([k])=>[k,[...(Array.isArray(L[k])?L[k]:[])]])),dirty:false}}
function teamsHtml(){
  if(!adm.selTeam||!st.teams.some(t=>t.id===adm.selTeam))adm.selTeam=st.teams[0]?st.teams[0].id:null;
  if(adm.selTeam&&(!adm.tdraft||adm.tdraft.id!==adm.selTeam))adm.tdraft=tDraftOf(adm.selTeam);
  const mem=id=>adm.people.filter(p=>p.team_id===id&&p.active);
  const lead=id=>mem(id).filter(p=>p.role==="leader").map(p=>p.name).join(", ")||"-";
  // 위: 상위 조직별로 묶은 팀 단추 → 누르면 아래에 그 팀의 기본 목록 (긴 표 없이 스크롤 적게)
  const groups=[];st.teams.forEach(t=>{const g=pUnitPathOfTeam(t.id);let x=groups.find(y=>y.g===g);if(!x)groups.push(x={g,ts:[]});x.ts.push(t)});
  const pick=`<div class="tpick">${groups.map(x=>`<div class="tgrp"><span class="tgl">${esc(x.g)}</span><div class="tchips">${x.ts.map(t=>`<button type="button" class="tchip${t.id===adm.selTeam?" on":""}" data-tsel="${esc(t.id)}" aria-pressed="${t.id===adm.selTeam}">${esc(t.name)}<small>${mem(t.id).length}명</small></button>`).join("")}</div></div>`).join("")||'<p class="hint" style="margin:0">아직 팀이 없어요. 조직도에서 만들어요.</p>'}</div>`;
  const d=adm.tdraft,cur=st.teams.find(t=>t.id===adm.selTeam);
  const detail=d&&cur?`<div class="adcard tdet" data-team="${esc(d.id)}">
    <div class="tdhead"><h3><span class="tpath">${esc(pUnitPathOfTeam(cur.id))}</span>${esc(cur.name)} · 팀 기본 목록 <span class="hint" style="font-weight:400;margin:0">팀원 ${mem(cur.id).length}명 · 팀장 ${esc(lead(cur.id))}</span></h3><span class="spacer"></span>
      ${d.dirty?'<span class="pv-upd" style="font-size:13px">저장 안 된 변경이 있어요</span>':""}
      <button class="btn primary" type="button" data-adact="tsave"${d.dirty?"":" disabled"}>변경 저장</button></div>
    <div class="tsec"><div class="tsech"><span class="hint" style="font-weight:400;margin:0">새로 들어온 사람이 처음 받는 목록이에요. 각자 '내 목록'에서 자기에게 맞게 바꿔 써요.</span></div>
      <div class="tlists">${T_LISTS.map(([k,l,ph])=>`<div class="tl">
        <div class="tlh"><b>${l}</b><span class="hint" style="margin:0">${d.lists[k].length}개</span></div>
        <div class="chips2">${d.lists[k].map((v,ix)=>`<span class="chip2">${esc(v)}<button type="button" data-tdel="${k}:${ix}" aria-label="${esc(v)} 빼기">✕</button></span>`).join("")||'<span class="hint" style="margin:0">아직 없어요</span>'}</div>
        <div class="tladd"><input data-tadd="${k}" placeholder="${ph}" autocomplete="off" aria-label="${l} 추가"><button class="btn" type="button" data-taddb="${k}">추가</button></div>
        ${k==="cats"?`<button class="btn ghost tpre" type="button" data-tpreset>✨ '${esc(d.name)}'에 맞는 예시 넣기</button>`:""}
      </div>`).join("")}</div>
      <p class="hint" style="margin:0">한 칸에 여러 줄을 붙여넣으면 한꺼번에 추가돼요. Enter로도 추가할 수 있어요.</p></div>
  </div>`:"";
  return `<div class="adbar"><p class="hint" style="margin:0">팀을 고르면 아래에서 그 팀의 기본 목록을 고쳐요. 팀 만들기·이름·순서·팀장은 <b>조직도</b>에서 정해요.</p></div>
  ${pick}
  ${detail}`;
}
function tAdd(k,raw){
  const d=adm.tdraft;if(!d)return;const vals=String(raw||"").split(/\r?\n|\t/).map(x=>x.trim()).filter(Boolean);let n=0;
  vals.forEach(v=>{if(!d.lists[k].includes(v)){d.lists[k].push(v);n++}});
  if(n){d.dirty=true;renderAdmin();const inp=document.querySelector(`[data-tadd="${k}"]`);if(inp)inp.focus()}
  else if(vals.length)toast("이미 목록에 있어요.");
}
// 조직도에 저장 안 한 변경이 있으면 떠나기 전에 물어봄
function ogLeaveGuard(go){if(!(adm.tab==="org"&&adm.org&&ogDiff().n)){go();return}
  const n=ogDiff().n;
  $("adDlg").innerHTML=`<div class="mtop"><span class="mtag" id="adDlgTitle">조직도 저장</span></div><p style="margin:14px 0 0;line-height:1.6">조직도에 <b>저장하지 않은 변경 ${n}건</b>이 있어요.<br>저장하지 않으면 사람·팀 설정에 반영되지 않아요.</p>
    <div class="mfoot"><button class="btn ghost" type="button" data-dlg="close">취소</button><span class="spacer"></span><button class="btn" type="button" id="lgDrop">저장 안 하고 이동</button><button class="btn primary" type="button" id="lgSave">저장하고 이동</button></div>`;
  $("adScrim").hidden=false;$("adDlg").hidden=false;$("adDlg").dataset.email="";
  $("lgSave").onclick=async()=>{$("lgSave").disabled=true;closeDlg();await ogSave();go()};
  $("lgDrop").onclick=()=>{closeDlg();adm.org=null;go()};
  setTimeout(()=>$("lgSave").focus(),30)}
$("adTabs").onclick=e=>{const b=e.target.closest("[data-ad]");if(!b)return;if(b.dataset.ad!=="org")ogLeaveGuard(()=>adTabGo(b));else adTabGo(b)};
async function adTabGo(b){const T=[...document.querySelectorAll("#adTabs [data-ad]")].map(x=>x.dataset.ad),dir=Math.sign(T.indexOf(b.dataset.ad)-T.indexOf(adm.tab));if(adm.tab!==b.dataset.ad){adm.bulk=false;adm.grid=[]}adm.tab=b.dataset.ad;if(adm.tab==="trash")await loadTrash();if(adm.tab==="company")await loadCo();if(adm.tab==="org"&&(!adm.org||!ogDiff().n))await loadOrg();renderAdmin();if(dir)wkIn(document.querySelector("#adBody .adwrap"),dir)};
$("adClose").onclick=()=>ogLeaveGuard(()=>{$("adminPanel").hidden=true;closeDlg();paintUser();refresh()});
$("adBody").addEventListener("input",e=>{
  if(e.target.id==="adQ"){adm.q=e.target.value;const pos=e.target.selectionStart;renderAdmin();const q=$("adQ");q.focus();q.setSelectionRange(pos,pos)}
  if(e.target.id==="td-name"||e.target.id==="td-sort"){const d=adm.tdraft;if(d){d[e.target.id==="td-name"?"name":"sort"]=e.target.value;if(!d.dirty){d.dirty=true;const b=document.querySelector('[data-adact="tsave"]');if(b)b.disabled=false}}}
  if(e.target.id==="adDomain"){adm.domain=e.target.value.replace(/^@+/,"").trim();try{localStorage.setItem("wk-mail-domain",adm.domain)}catch(_){}gRefresh()}
  const g=e.target.dataset&&e.target.dataset.g;if(g){const [i,f]=g.split(":");const r=adm.grid[+i];if(r){r[f]=e.target.type==="checkbox"?e.target.checked:e.target.value;if(f==="adm"&&r.adm){r.reg=true;const rb=document.querySelector(`[data-g="${i}:reg"]`);if(rb)rb.checked=true}gRefresh()}}
});
$("adBody").addEventListener("change",e=>{if(e.target.id==="adTeamF"){adm.fTeam=e.target.value;renderAdmin();return}
  const pm=e.target.dataset&&e.target.dataset.perm;if(pm){setPerm(e.target.dataset.em,pm,e.target.checked,e.target);return}
  const g=e.target.dataset&&e.target.dataset.g;if(g&&g.endsWith(":email")){const [i]=g.split(":");const r=adm.grid[+i];if(r){r.email=gEmail(r.email);e.target.value=r.email;gRefresh()}}});
$("adBody").addEventListener("paste",e=>{
  const g=e.target.dataset&&e.target.dataset.g;if(!g)return;
  const t=(e.clipboardData||window.clipboardData).getData("text");if(!t||!/[\t\n]/.test(t.replace(/\n$/,"")))return;
  e.preventDefault();const [i,f]=g.split(":");gPaste(+i,f,t);
});
$("adBody").addEventListener("click",async e=>{
  const fs=e.target.closest("[data-fst]");if(fs){adm.fState=fs.dataset.fst;renderAdmin();return}
  const ps=e.target.closest("[data-psort]");if(ps){const k=ps.dataset.psort,so=adm.pSort||{};   // 누를 때마다 오름차순 → 내림차순 → 기본 순서
    adm.pSort=so.key!==k?{key:k,dir:1}:so.dir>0?{key:k,dir:-1}:null;renderAdmin();return}
  const a=e.target.closest("[data-adact]");
  if(a){const k=a.dataset.adact;
    if(k==="add"||k==="bulk")gOpen(null);
    if(k==="addteam")gOpen(pUnitOfTeam(a.dataset.t)||null);
    if(k==="bulkclose"){adm.bulk=false;adm.grid=[];adm.gPreset="";const from=adm.gFrom;adm.gFrom=null;if(from)await ogBack(from);else renderAdmin()}
    if(k==="gadd"){for(let n=0;n<5;n++)adm.grid.push(gBlank());gRender()}
    if(k==="gclear"){adm.grid=Array.from({length:5},gBlank);gRender()}
    if(k==="gcommit")await commitGrid();
    if(k==="ntopen"){adm.newTeam=true;renderAdmin();setTimeout(()=>$("nt-name").focus(),30)}
    if(k==="ntcancel"){adm.newTeam=false;renderAdmin()}
    if(k==="newteam"){const name=$("nt-name").value.trim(),id=$("nt-id").value.trim().toLowerCase(),sort=+$("nt-sort").value||10;
      if(!name){toast("팀 이름을 넣어주세요.");$("nt-name").focus();return}
      if(!/^[a-z][a-z0-9_-]{1,29}$/.test(id)){toast("팀 코드는 영문 소문자로 시작하는 2~30자로 넣어주세요. 예: purchase");$("nt-id").focus();return}
      try{await api.saveTeam({id,name,sort,lists:{projects:[],customers:["내부"],vendors:[],cats:catPreset(name)}},true);toast(`${name}을(를) 만들었어요. 아래에서 기본 목록을 채워주세요.`);
        adm.newTeam=false;adm.selTeam=id;adm.tdraft=null;await loadAdmin();paintUser()}catch(x){toast(x.code==="23505"?"이미 있는 팀 코드예요.":errText(x))}}
    if(k==="tsave"){const d=adm.tdraft;if(!d)return;if(!d.name.trim()){toast("팀 이름을 넣어주세요.");return}
      try{await api.saveTeam({id:d.id,name:d.name.trim(),sort:+d.sort||0,lists:d.lists},false);toast(`${d.name.trim()} 정보를 저장했어요`);adm.tdraft=null;await loadAdmin();paintUser()}catch(x){toast(errText(x))}}
    return}
  const gd=e.target.closest("[data-gdel]");if(gd){adm.grid.splice(+gd.dataset.gdel,1);if(!adm.grid.length)adm.grid.push(gBlank());gRender();return}
  const ed=e.target.closest("[data-edit]");if(ed){personDlg(ed.dataset.edit);return}
  const rs=e.target.closest("[data-reset]");if(rs){const p=adm.people.find(x=>x.email===rs.dataset.reset);
    confirmDlg("비밀번호 초기화",`<b>${esc(p.name)}</b> 님의 비밀번호를 <b>0426</b>으로 초기화할까요? 다음 로그인 때 본인이 새 6자리를 정해요.`,"초기화",false,async()=>{await api.resetPin(p.email);toast(`${p.name} 님 비밀번호를 0426으로 초기화했어요`);await loadAdmin()});return}
  const ul=e.target.closest("[data-unlock]");if(ul){try{await api.unlock(ul.dataset.unlock);toast("잠금을 풀었어요");await loadAdmin()}catch(x){toast(errText(x))}return}
  const tr=e.target.closest("[data-tsel]");if(tr){const id=tr.dataset.tsel;if(id!==adm.selTeam){if(adm.tdraft&&adm.tdraft.dirty){confirmDlg("저장 안 된 변경","지금 팀에서 고친 내용이 아직 저장되지 않았어요. 저장하지 않고 다른 팀으로 갈까요?","저장 안 하고 이동",true,async()=>{adm.selTeam=id;adm.tdraft=null;renderAdmin()});return}adm.selTeam=id;adm.tdraft=null;adm.bulk=false;adm.grid=[];renderAdmin();wkIn(document.querySelector(".tdet"),0);const dt=document.querySelector(".tdet");if(dt)dt.scrollIntoView({block:"nearest"})}return}
  const td=e.target.closest("[data-tdel]");if(td){const [k,ix]=td.dataset.tdel.split(":");adm.tdraft.lists[k].splice(+ix,1);adm.tdraft.dirty=true;renderAdmin();return}
  const tp=e.target.closest("[data-tpreset]");if(tp){tAdd("cats",catPreset(adm.tdraft.name).join("\n"));return}
  const tr2=e.target.closest("[data-trestore]");if(tr2){try{await api.trashRestore(+tr2.dataset.trestore);toast("되살렸어요");await loadTrash();await loadAdmin();refreshSoon()}catch(x){toast(errText(x))}return}
  const tb=e.target.closest("[data-taddb]");if(tb){const k=tb.dataset.taddb;tAdd(k,document.querySelector(`[data-tadd="${k}"]`).value);return}
  const ig=e.target.closest("[data-impgo]");if(ig){const id=ig.dataset.t,c=ig.closest("[data-team]");const src=c.querySelector('[data-imp="src"]').value.trim(),reset=c.querySelector('[data-imp="reset"]').checked,dry=ig.dataset.impgo==="dry";
    const run=async()=>{const r=await api.importLegacy(src,id,dry,reset);
      adm.imp[id]=r.demo?"체험 화면에서는 가져오기를 할 수 없어요.":`${dry?"<b>미리 확인 결과</b> (아직 저장 안 함)":"<b>가져왔어요</b>"}<br>업무 ${r.items}건 · 예시 제외 ${r.samples_skipped}건 · 공지 ${r.notices}건 · 목록 ${r.lists?"있음":"없음"}<br>${r.unmatched&&r.unmatched.length?`<span class="pv-err">팀원 명단에 없는 담당자: ${r.unmatched.map(esc).join(", ")}</span> — 이 업무는 담당자 없이 옮겨져 아무도 고칠 수 없어요. 이름을 맞춰 등록한 뒤 다시 가져오세요.`:'<span class="pv-new">모든 담당자가 팀원과 연결돼요.</span>'}`;
      renderAdmin();const d=document.querySelector(`[data-team="${id}"] details`);if(d)d.open=true;if(!dry)refreshSoon()};
    if(dry){try{await run()}catch(x){toast(errText(x))}}
    else confirmDlg("업무 가져오기",`'${esc(src)}'의 업무를 <b>${esc(teamName(id))}</b>(으)로 가져올까요?${reset?" <b>이 팀에 있던 새 구조 업무는 모두 지워져요.</b>":" 같은 업무는 최신 내용으로 덮어써요."}`,"가져오기",reset,run);
    return}
});
$("adBody").addEventListener("keydown",e=>{
  const k=e.target.dataset&&e.target.dataset.tadd;if(k&&e.key==="Enter"){e.preventDefault();tAdd(k,e.target.value);return}
  if(e.key==="Enter"&&e.target.matches&&e.target.matches("[data-tsel]")){e.preventDefault();e.target.click();return}
  if(e.key==="Enter"&&e.target.closest&&e.target.closest(".tnew")){e.preventDefault();document.querySelector('[data-adact="newteam"]').click()}
});
$("adBody").addEventListener("paste",e=>{const k=e.target.dataset&&e.target.dataset.tadd;if(!k)return;const t=(e.clipboardData||window.clipboardData).getData("text");if(/[\n\t]/.test(t)){e.preventDefault();tAdd(k,t)}});
document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(!$("adDlg").hidden){e.stopImmediatePropagation();closeDlg();return}if(!$("userMenu").hidden){$("userMenu").hidden=true;return}},true);
/* 관리 → 회사 */
async function loadCo(){let c=null;try{c=await api.company()}catch(_){}c=c||{};
  adm.co={name:c.name||"",mail_domain:c.mail_domain||"",logo:c.logo||null,report_depts:Array.isArray(c.report_depts)&&c.report_depts.length?[...c.report_depts]:[...CO0.depts],report_bg:c.report_bg||null,dirty:false,missing:!c.id}}
function companyHtml(){const c=adm.co;if(!c)return `<p class="hint">불러오는 중…</p>`;
  const logo=c.logo||CO0.logo,bg=c.report_bg||CO0.bg;
  return `<div class="cofrm">
  ${c.missing&&CONFIGURED?'<div class="banner" style="margin:0"><p>회사 설정 표가 아직 없어요. Supabase에서 <b>5-company.sql</b>을 먼저 실행해 주세요.</p></div>':""}
  <section class="cosec"><h3>기본 정보</h3>
    <div class="cogrid"><div class="f"><label for="co-name">회사 이름</label><input id="co-name" value="${esc(c.name)}" placeholder="예: CONET SYS"></div>
    <div class="f"><label for="co-dom">회사 메일 주소 뒷부분</label><div class="codom"><span>@</span><input id="co-dom" value="${esc(c.mail_domain)}" placeholder="company.com" autocapitalize="off" spellcheck="false"></div>
      <p class="hint">로그인할 때 아이디 뒤에 자동으로 붙어요.</p></div></div></section>
  <section class="cosec"><h3>로그인 화면 로고</h3>
    <div class="corow"><div class="cologo"><img src="${esc(logo)}" alt="로고 미리보기"></div>
    <div class="cobtns"><label class="btn"><input type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" data-coup="logo" hidden>그림 올리기</label>${c.logo?'<button class="btn ghost" type="button" data-codef="logo">기본으로</button>':""}
      <p class="hint">어두운 바탕 위에 올라가요. 흰색 글자에 투명 배경인 PNG가 가장 잘 어울려요.</p></div></div></section>
  <section class="cosec"><h3>보고서 (PPT)</h3>
    <p class="hint" style="margin:0">PPT 위쪽 팀 탭은 <b>조직도의 팀 순서</b>대로 자동으로 들어가요.</p>
    <div class="corow" style="margin-top:14px"><div class="cobg"><img src="${esc(bg)}" alt="보고서 배경 미리보기"></div>
    <div class="cobtns"><b style="font-size:13px">배경 그림</b><label class="btn"><input type="file" accept="image/png,image/jpeg,image/webp" data-coup="bg" hidden>그림 올리기</label>${c.report_bg?'<button class="btn ghost" type="button" data-codef="bg">기본으로</button>':""}
      <p class="hint">PPT 한 장 전체에 깔려요. 가로:세로 4:3 그림(회사 로고·무늬가 들어간 바탕)을 넣어주세요.</p></div></div></section>
  <div class="cofoot"><span class="hint" style="margin:0" id="coState">${c.dirty?"저장하지 않은 변경이 있어요":"저장된 상태예요"}</span><button class="btn ghost" type="button" data-coreset="1" ${c.dirty?"":"disabled"}>되돌리기</button><button class="btn primary" type="button" data-cosave="1" ${c.dirty?"":"disabled"}>저장</button></div>
  </div>`}
function coDirty(){if(!adm.co)return;adm.co.dirty=true;const s=$("coState");if(s){s.textContent="저장하지 않은 변경이 있어요";document.querySelectorAll("[data-cosave],[data-coreset]").forEach(b=>b.disabled=false)}}
function readImg(file,maxW,maxH,type,q){return new Promise((ok,no)=>{const r=new FileReader();r.onerror=()=>no(new Error("read"));r.onload=()=>{
  if(file.type==="image/svg+xml"){ok(r.result);return}
  const im=new Image();im.onerror=()=>no(new Error("img"));im.onload=()=>{const k=Math.min(1,maxW/im.width,maxH/im.height);const c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
    const g=c.getContext("2d");g.drawImage(im,0,0,c.width,c.height);
    if(type==="image/png"){try{const D=g.getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=-1,y1=-1;
      for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(D[(y*c.width+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
      if(x1>=x0&&(x0>0||y0>0||x1<c.width-1||y1<c.height-1)){const t=document.createElement("canvas");t.width=x1-x0+1;t.height=y1-y0+1;t.getContext("2d").drawImage(c,x0,y0,t.width,t.height,0,0,t.width,t.height);ok(t.toDataURL(type));return}}catch(_){}}
    ok(c.toDataURL(type,q))};im.src=r.result};r.readAsDataURL(file)})}
$("adBody").addEventListener("input",e=>{if(!adm.co)return;
  if(e.target.id==="co-name"){adm.co.name=e.target.value;coDirty()}
  if(e.target.id==="co-dom"){adm.co.mail_domain=e.target.value.replace(/^@+/,"").trim().toLowerCase();coDirty()}});
$("adBody").addEventListener("change",async e=>{const up=e.target.closest("[data-coup]");if(!up||!adm.co||!up.files||!up.files[0])return;
  const f=up.files[0],k=up.dataset.coup;
  try{const url=k==="logo"?await readImg(f,900,300,"image/png"):await readImg(f,1600,1200,"image/jpeg",.82);
    if(url.length>1500000){toast("그림이 너무 커요. 더 작은 그림으로 올려주세요.");return}
    adm.co[k==="logo"?"logo":"report_bg"]=url;adm.co.dirty=true;renderAdmin()}catch(_){toast("그림을 읽지 못했어요. PNG나 JPG로 올려주세요.")}});
$("adBody").addEventListener("keydown",e=>{if(e.target.id==="co-dept"&&e.key==="Enter"){e.preventDefault();document.querySelector("[data-coadd]")?.click()}});
$("adBody").addEventListener("click",async e=>{if(!adm.co)return;const b=e.target.closest("button");if(!b)return;
  if(b.dataset.codel){adm.co.report_depts.splice(+b.dataset.codel,1);adm.co.dirty=true;renderAdmin();return}
  if(b.dataset.coadd){const i=$("co-dept"),v=i.value.trim();if(!v)return;if(adm.co.report_depts.includes(v)){toast("이미 있는 이름이에요.");return}adm.co.report_depts.push(v);adm.co.dirty=true;renderAdmin();setTimeout(()=>$("co-dept")&&$("co-dept").focus(),30);return}
  if(b.dataset.codef){adm.co[b.dataset.codef==="logo"?"logo":"report_bg"]=null;adm.co.dirty=true;renderAdmin();return}
  if(b.dataset.coreset){await loadCo();renderAdmin();return}
  if(b.dataset.cosave){const c=adm.co;if(!c.name.trim()){toast("회사 이름을 적어주세요.");return}
    b.disabled=true;const data={name:c.name.trim(),mail_domain:c.mail_domain,logo:c.logo,report_depts:c.report_depts,report_bg:c.report_bg};
    try{await api.saveCompany(data);applyCompany(Object.assign({id:1},data));c.dirty=false;renderAdmin();toast("회사 설정을 저장했어요.")}
    catch(x){toast(errText(x));b.disabled=false}}
});

/* ---------- 관리 → 조직도 (v3.1.0) : 회사마다 다른 구조(사업부>실>팀>파트…)를 자유롭게 ---------- */
const OG_LEVELS0=[{name:"본부",head:"본부장"},{name:"팀",head:"팀장",work:true},{name:"파트",head:"파트장"}];
const OG_TITLES0=["대표이사","부사장","전무","상무","이사","본부장","실장","팀장","파트장","부장","차장","과장","대리","주임","사원"];
const ogBySort=(a,b)=>((+a.sort||0)-(+b.sort||0))||String(a.name).localeCompare(String(b.name),"ko");
const ogRid=p=>p+Math.random().toString(36).slice(2,8).replace(/[^a-z0-9]/g,"x");
const ogJ=x=>JSON.parse(JSON.stringify(x));
let ogLastDrag=0,OGD=null;
async function loadOrg(){
  let us=null,co=null;try{us=await api.units()}catch(_){us=null}try{co=await api.company()}catch(_){}
  const prev=adm.org||{};
  const levels=(co&&Array.isArray(co.org_levels)&&co.org_levels.length)?co.org_levels:ogJ(OG_LEVELS0);
  const o={view:prev.view||"chart",sel:prev.sel||"root",missing:us===null,editing:false,
    units:(us||[]).map(u=>({id:u.id,name:u.name,level:u.level||"",parent_id:u.parent_id||null,sort:+u.sort||0,head:u.head||null,team_id:u.team_id||null})),
    people:adm.people.filter(p=>p.active).map(p=>({email:p.email,name:p.name,team_id:p.team_id||null,unit_id:p.unit_id||null,role:p.role||"member",title:p.title||""})),
    teamName:Object.fromEntries(st.teams.map(t=>[t.id,t.name])),teamSort:Object.fromEntries(st.teams.map(t=>[t.id,+t.sort||0])),
    ceo:(co&&co.ceo)||null,execs:(co&&Array.isArray(co.execs))?co.execs:[],levels,
    titles:(co&&Array.isArray(co.titles)&&co.titles.length)?co.titles:[...OG_TITLES0],paste:prev.paste||"",plan:null,flash:null,adding:false};
  // 조직도에 아직 없는 팀은 대표이사 바로 아래에 자동으로 올려둠
  const wl=(levels.find(l=>l.work)||levels[0]||{name:"팀"}).name;
  const miss=st.teams.filter(t=>!o.units.some(u=>u.team_id===t.id)).sort(ogBySort);
  const lead=t=>{const L=o.people.filter(p=>p.team_id===t.id&&p.role==="leader");return L.length?{email:L[0].email,name:L[0].name,title:L[0].title||""}:null};
  if(miss.length&&us!==null){let s=Math.max(0,...o.units.filter(u=>!u.parent_id).map(u=>u.sort))+10;
    const add=miss.map(t=>({id:ogRid("u"),name:t.name,level:wl,parent_id:null,sort:s+=10,head:lead(t),team_id:t.id}));
    try{for(const u of add)await api.saveUnit(u,true);o.units.push(...add)}catch(_){}}
  // 이름만 적힌 조직장 → 같은 이름으로 등록된 사람이 딱 한 명이면 자동으로 이어 줌
  if(us!==null)for(const u of o.units){const h=u.head;if(!h||h.email||!(h.name||"").trim())continue;
    const m=o.people.filter(p=>p.name===h.name.trim());if(m.length!==1)continue;const p=m[0];
    u.head={email:p.email,name:p.name,title:h.title||p.title||""};const lead=u.team_id&&p.team_id===u.team_id,setT=!p.title&&u.head.title;
    if(lead)p.role="leader";if(setT)p.title=u.head.title;
    try{await api.saveUnit({id:u.id,name:u.name,level:u.level,parent_id:u.parent_id,sort:u.sort,head:u.head,team_id:u.team_id},false);
      if(lead||setT)await api.updatePerson(p.email,Object.assign(lead?{role:"leader"}:{},setT?{title:p.title}:{}))}catch(_){}}
  if(us===null)o.units=st.teams.map((t,i)=>({id:"u_"+t.id,name:t.name,level:wl,parent_id:null,sort:(i+1)*10,head:lead(t),team_id:t.id}));
  adm.org=o;adm.org0=ogJ(o);
}
/* ----- 트리 도우미 ----- */
const ogU=id=>adm.org.units.find(u=>u.id===id);
const ogKids=pid=>adm.org.units.filter(u=>(u.parent_id||null)===(pid||null)).sort(ogBySort);
function ogAnc(id){const out=[];let u=ogU(id),n=0;while(u&&u.parent_id&&n++<50){u=ogU(u.parent_id);if(u)out.push(u)}return out}
function ogSubIds(id){const s=new Set([id]);let add=true;while(add){add=false;adm.org.units.forEach(u=>{if(u.parent_id&&s.has(u.parent_id)&&!s.has(u.id)){s.add(u.id);add=true}})}return s}
function ogWorkOf(id){let u=ogU(id),n=0;while(u&&n++<50){if(u.team_id)return u;u=u.parent_id?ogU(u.parent_id):null}return null}
function ogPUnit(p){if(p.unit_id&&ogU(p.unit_id))return p.unit_id;const t=adm.org.units.find(u=>u.team_id&&u.team_id===p.team_id);return t?t.id:null}
function ogPeopleIn(id,deep){const ids=deep?ogSubIds(id):new Set([id]);return adm.org.people.filter(p=>ids.has(ogPUnit(p)))}
function ogLv(name){return adm.org.levels.find(l=>l.name===name)||{name,head:"조직장"}}
function ogNextLevel(pid){const L=adm.org.levels;if(!pid)return (L[0]||{name:"팀"}).name;const i=L.findIndex(l=>l.name===(ogU(pid)||{}).level);return (L[Math.min(i+1,L.length-1)]||L[L.length-1]||{name:"팀"}).name}
function ogHeadName(u){const h=u.head;if(!h)return "";if(h.email){const p=adm.org.people.find(x=>x.email===h.email);if(p)return p.name}return h.name||""}
function ogHeadTitle(u){return (u.head&&u.head.title)||ogLv(u.level).head||"조직장"}
function ogRenum(pid){ogKids(pid).forEach((u,i)=>u.sort=(i+1)*10)}
function ogTeamFor(id){const w=ogWorkOf(id);if(w)return w;let f=null;const walk=pid=>ogKids(pid).forEach(u=>{if(f)return;if(u.team_id)f=u;else walk(u.id)});walk(id);return f}
function ogSyncPeople(){const o=adm.org;o.people.forEach(p=>{const uid=ogPUnit(p);const w=uid&&ogTeamFor(uid);if(w&&w.team_id!==p.team_id)p.team_id=w.team_id})}
function ogUnitOpts(cur,onlyWork){const out=[];const walk=(pid,d)=>ogKids(pid).forEach(u=>{const ok=!onlyWork||ogTeamFor(u.id);out.push(`<option value="${esc(u.id)}"${u.id===cur?" selected":""}${ok?"":" disabled"}>${"　".repeat(d)}${esc(u.name)}${u.level?` (${esc(u.level)})`:""}</option>`);walk(u.id,d+1)});walk(null,0);return out.join("")}
function ogDfsTeams(){const out=[];const walk=pid=>ogKids(pid).forEach(u=>{if(u.team_id)out.push(u.team_id);walk(u.id)});walk(null);return out}
function ogDiff(){
  const o=adm.org,z=adm.org0,J=JSON.stringify,r={tAdd:[],tUpd:[],uAdd:[],uUpd:[],uDel:[],pAdd:[],pUpd:[],co:false};
  if(!o||!z)return Object.assign(r,{n:0,any:0});
  const zu=Object.fromEntries(z.units.map(u=>[u.id,u])),zp=Object.fromEntries(z.people.map(p=>[p.email,p]));
  o.units.forEach(u=>{const a=zu[u.id];if(!a)r.uAdd.push(u);else if(a.name!==u.name||a.level!==u.level||(a.parent_id||null)!==(u.parent_id||null)||a.sort!==u.sort||J(a.head||null)!==J(u.head||null)||(a.team_id||null)!==(u.team_id||null))r.uUpd.push(u)});
  z.units.forEach(u=>{if(!o.units.some(x=>x.id===u.id))r.uDel.push(u)});
  const order=ogDfsTeams();
  o.units.filter(u=>u.team_id).forEach(u=>{const known=u.team_id in o.teamName,srt=(order.indexOf(u.team_id)+1)*10;
    if(!known)r.tAdd.push({id:u.team_id,name:u.name,sort:srt});else if(o.teamName[u.team_id]!==u.name||o.teamSort[u.team_id]!==srt)r.tUpd.push({id:u.team_id,name:u.name,sort:srt})});
  o.people.forEach(p=>{const a=zp[p.email];if(!a)r.pAdd.push(p);else if(a.team_id!==p.team_id||(a.unit_id||null)!==(p.unit_id||null)||a.role!==p.role||(a.title||"")!==(p.title||"")||a.name!==p.name)r.pUpd.push(p)});
  r.co=J(z.ceo||null)!==J(o.ceo||null)||J(z.execs||[])!==J(o.execs||[])||J(z.levels)!==J(o.levels)||J(z.titles)!==J(o.titles);
  r.n=r.uAdd.length+r.uUpd.length+r.uDel.length+r.tUpd.filter(t=>o.teamName[t.id]!==t.name).length+r.pAdd.length+r.pUpd.length+(r.co?1:0);
  r.any=r.n||r.tUpd.length;return r;
}
function ogState(){const s=$("ogState");if(!s)return;const n=ogDiff().n;s.innerHTML=n?`<b>저장 안 된 변경 ${n}건</b>`:"저장된 상태예요";
  document.querySelectorAll('[data-ogact="reset"],[data-ogact="save"]').forEach(b=>b.disabled=!n||(b.dataset.ogact==="save"&&adm.org.missing))}
function ogRender(){requestAnimationFrame(()=>{if(typeof ogPopPlace==="function")ogPopPlace()});const pn=document.querySelector(".ogpanel"),ps=pn?pn.scrollTop:0,sc=document.querySelector(".ogpanel .ogscroll.ppl"),ss=sc?sc.scrollTop:0;renderAdmin();
  const p2=document.querySelector(".ogpanel");if(p2)p2.scrollTop=ps;const s2=document.querySelector(".ogpanel .ogscroll.ppl");if(s2){s2.scrollTop=ss;const f=s2.querySelector(".ogflash");if(f){const a=f.offsetTop,b=a+f.offsetHeight;if(a<s2.scrollTop+30||b>s2.scrollTop+s2.clientHeight)s2.scrollTop=b-s2.clientHeight+4}}
  if(adm.org)adm.org.flash=null}
function ogSelect(k){const ch=adm.org.sel!==k;adm.org.sel=k;adm.org.editing=false;ogRender();const p=document.querySelector(".ogpanel");if(p){p.scrollTop=0;if(ch)wkIn(p,0)}}
/* ----- 화면 ----- */
function orgHtml(){
  const o=adm.org;if(!o)return `<p class="hint">불러오는 중…</p>`;
  const df=ogDiff(),chart=true;
  return `${o.missing&&CONFIGURED?'<div class="banner" style="margin:0"><p>조직도 표가 아직 없어요. Supabase에서 <b>6-org.sql</b>을 먼저 실행해 주세요.</p></div>':""}
  <div class="ogbar">

    <span class="hint ogtip">상자를 누르면 오른쪽에 명단이 나와요 · 끌어서 다른 조직 위에 놓으면 그 아래로, 사이에 놓으면 순서가 바뀌어요 · ✎ 로 이름·종류를 고쳐요</span>
    <span class="ogsave"><span class="hint" id="ogState">${df.n?`<b>저장 안 된 변경 ${df.n}건</b>`:"저장된 상태예요"}</span>
    <button class="btn ghost" type="button" data-ogact="reset"${df.n?"":" disabled"}>되돌리기</button><button class="btn primary" type="button" data-ogact="save"${df.n&&!o.missing?"":" disabled"}>저장</button></span>
  </div>
  ${chart?`<div class="oglay withp">${orgChartHtml()}<aside class="ogpanel" aria-label="선택한 조직">${ogPanelHtml()}</aside></div>`:orgTableHtml()}`;
}
function ogLvIdx(u){const i=adm.org.levels.findIndex(l=>l.name===u.level);return i<0?Math.min(ogAnc(u.id).length,4):Math.min(i,4)}
function ogCard(u,cls){const o=adm.org,n=ogPeopleIn(u.id,true).length,hn=ogHeadName(u),on=o.sel===u.id?" on":"";
  return `<button type="button" class="ogt lv${ogLvIdx(u)}${cls||""}${u.team_id?" work":""}${on}${o.flash===u.id?" ogflash":""}" data-node="${esc(u.id)}" data-unit="${esc(u.id)}">
    <span class="ogeb" data-ogact="uopen" data-id="${esc(u.id)}" role="button" aria-label="${esc(u.name)} 조직 고치기" title="조직 고치기">✎</span><span class="ogh" aria-hidden="true">⠿</span><span class="ogtx"><span class="ogtl">${u.level?`<span class="oglv">${esc(u.level)}</span>`:""}<b class="ogtn">${esc(u.name)}</b></span><span class="ogsub">${hn?`<span class="oght">${esc(ogHeadTitle(u))} </span>${esc(hn)}`:`<em>${esc(ogHeadTitle(u))} 미정</em>`}<span class="ogn"> · ${n}명</span></span></span></button>`}
function ogNode(u){const k=ogKids(u.id);return `<div class="ognode" data-wrap="${esc(u.id)}">${ogCard(u)}${k.length?`<div class="ogkids" data-kids="${esc(u.id)}">${k.map(ogNode).join("")}</div>`:""}</div>`}
function orgChartHtml(){
  const o=adm.org,cols=ogKids(null);
  const col=u=>`<div class="ogcol" data-col="${esc(u.id)}" data-wrap="${esc(u.id)}">${ogCard(u," ogdiv")}${ogKids(u.id).length?`<div class="ogkids top" data-kids="${esc(u.id)}">${ogKids(u.id).map(ogNode).join("")}</div>`:""}</div>`;
  const ceo=o.ceo||{},ex=(o.execs||[]).filter(x=>x.name).length;
  return `<div class="ogwrap" id="ogWrap">
    <div class="oglegend">${o.levels.filter(l=>l.name).map((l,i)=>`<span class="lv${Math.min(i,4)}"><i></i>${esc(l.name)}</span>`).join("")}<span class="lgw"><i></i>주간업무 팀</span></div><div class="ogtools">${o.adding?ogAddForm():`<button class="ogadd" type="button" data-ogact="addopen">+ 추가</button>`}<button class="ogadd" type="button" data-node="settings" title="조직 종류·직책 정하기">⚙ 조직 종류·직책</button><button class="ogadd" type="button" data-ogact="export" title="엑셀(CSV)로 내려받기">⬇ 엑셀</button></div>
    <div class="org"><div class="ogtop"><button type="button" class="ogcard ogceo${o.sel==="root"?" on":""}" data-node="root"><span class="ogdn"><b>${esc(ceo.title||"대표이사")}</b><span class="ogsub">${esc(ceo.name||"이름을 넣어주세요")}${ex?` · 임원 ${ex}명`:""}</span></span></button></div>
    <div class="ogcols">${cols.map(col).join("")||`<p class="hint" style="margin:20px auto">+ 추가를 눌러 첫 조직을 넣어주세요</p>`}</div></div>${o.pop&&ogU(o.pop)?ogPopHtml(ogU(o.pop)):""}</div>`;
}
function ogAddForm(){const o=adm.org,pid=o.addPar!==undefined?o.addPar:((o.sel&&ogU(o.sel))?o.sel:"");
  return `<div class="ogaddf ognewrow">
    <label class="ogaf"><span>상위 조직</span><select class="ogi" id="og-apar"><option value="">${esc((o.ceo&&o.ceo.title)||"대표이사")}</option>${ogUnitOpts(pid)}</select></label>
    <label class="ogaf"><span>종류</span><select class="ogi" id="og-alv">${o.levels.filter(l=>l.name).map(l=>`<option${l.name===ogNextLevel(pid||null)?" selected":""}>${esc(l.name)}</option>`).join("")}</select></label>
    <label class="ogaf grow"><span>이름</span><input class="ogi" id="og-aname" placeholder="예: 품질보증팀" autocomplete="off"></label>
    <button class="btn primary" type="button" data-ogact="addgo">추가</button><button class="btn ghost" type="button" data-ogact="addclose">닫기</button></div>`}
function ogPopHtml(u){const o=adm.org,savedTeam=u.team_id&&(u.team_id in o.teamName),wAnc=ogAnc(u.id).find(x=>x.team_id),wDesc=[...ogSubIds(u.id)].some(id=>id!==u.id&&(ogU(id)||{}).team_id),h=u.head||{};
  if(!o._popPos)requestAnimationFrame(ogPopPlace);
  return `<div class="ogpop" id="ogPop" role="dialog" aria-label="${esc(u.name)} 고치기">
    <div class="ogpoph"><b>조직 고치기</b><button class="ib" type="button" data-ogact="uclose" aria-label="닫기">✕</button></div>
    <label>이름${ogIn(`u:${u.id}:name`,u.name,"조직 이름")}</label>
    <label>종류<select class="ogi" data-ogf="u:${esc(u.id)}:level">${[...new Set([...o.levels.map(l=>l.name),u.level].filter(Boolean))].map(n=>`<option${n===u.level?" selected":""}>${esc(n)}</option>`).join("")}</select></label>
    ${h.email?`<p class="hint" style="margin:0">${esc(ogHeadTitle(u))}: <b>${esc(ogHeadName(u))}</b> · 오른쪽 구성원 표에서 바꿔요</p>`
      :`<div class="ogrow2"><label>${esc(ogLv(u.level).head||"조직장")} (명단 밖)${ogIn(`u:${u.id}:hname`,h.name,"이름 (예: 본부장)")}</label><label style="max-width:100px">직책${ogIn(`u:${u.id}:htitle`,h.title||"",ogLv(u.level).head||"조직장","ogTitles")}</label></div>`}
    <label class="ogchk"><input type="checkbox" data-ogf="u:${esc(u.id)}:work"${u.team_id?" checked":""}${savedTeam||wAnc||wDesc?" disabled":""}> 주간업무 팀</label>
    ${savedTeam?'<p class="hint" style="margin:0">업무 기록이 있는 팀이라 지우거나 주간업무를 끌 수 없어요.</p>':wAnc?`<p class="hint" style="margin:0">'${esc(wAnc.name)}'의 업무를 함께 써요.</p>`:""}
    <div class="ogrow">${savedTeam?"":`<button class="btn ghost danger" type="button" data-ogact="udel" data-id="${esc(u.id)}">조직 지우기</button>`}<span class="spacer"></span><button class="btn primary" type="button" data-ogact="uclose">확인</button></div></div>`}
function ogPopPlace(){const o=adm.org,p=$("ogPop"),w=$("ogWrap");if(!o||!p||!w||!o.pop)return;const c=w.querySelector(`.ogt[data-unit="${CSS.escape(o.pop)}"]`);if(!c)return;
  const wr=w.getBoundingClientRect(),cr=c.getBoundingClientRect();let x=cr.left-wr.left,y=cr.bottom-wr.top+6;
  x=Math.max(8,Math.min(x,wr.width-p.offsetWidth-8));if(y+p.offsetHeight>w.scrollHeight-4)y=Math.max(8,cr.top-wr.top-p.offsetHeight-6);p.style.left=x+"px";p.style.top=y+"px";p.classList.add("in")}
/* ----- 오른쪽 틀 ----- */
const ogIn=(f,v,ph,list)=>`<input class="ogi" data-ogf="${esc(f)}" value="${esc(v||"")}" placeholder="${esc(ph||"")}" autocomplete="off"${list?` list="${list}"`:""}>`;
function ogCrumb(id){const o=adm.org,ceoT=(o.ceo&&o.ceo.title)||"대표이사";const parts=[["root",ceoT]];if(id&&ogU(id))[...ogAnc(id).reverse(),ogU(id)].forEach(u=>parts.push([u.id,u.name]));
  return `<div class="ogcrumb">${parts.map(([k,l],i)=>i<parts.length-1?`<button type="button" data-node="${esc(k)}">${esc(l)}</button><span>›</span>`:`<b>${esc(l)}</b>`).join("")}</div>`}
function ogPanelHtml(){
  const o=adm.org;if(!o.sel||(o.sel!=="root"&&o.sel!=="settings"&&!ogU(o.sel)))o.sel="root";
  const dl=`<datalist id="ogTitles">${o.titles.map(t=>`<option value="${esc(t)}">`).join("")}</datalist>`;
  if(o.sel==="settings")return dl+ogSettingsHtml();
  const btns=`<div class="ogpbtn">${o.editing?'<button class="btn primary" type="button" data-ogact="editdone">완료</button>':'<button class="btn" type="button" data-ogact="edit">✎ 수정</button>'}</div>`;
  return dl+btns+(o.sel==="root"?(o.editing?ogRootEdit():ogRootView()):(o.editing?ogUnitEdit(ogU(o.sel)):ogUnitView(ogU(o.sel))));
}
const ogDash='<span class="hint" style="margin:0">-</span>';
function ogKidsTable(pid,edit){const ks=ogKids(pid);
  return `<div class="ogfix kids"><div class="ogscroll"><table class="ogtb fx"><colgroup><col style="width:64px"><col><col style="width:30%"><col style="width:52px"></colgroup><thead><tr><th>종류</th><th>이름</th><th>조직장</th><th class="r">인원</th></tr></thead><tbody>
    ${ks.map(u=>`<tr class="oglink" data-node="${esc(u.id)}"><td><span class="oglv lv${ogLvIdx(u)}">${esc(u.level||"-")}</span></td><td><b>${esc(u.name)}</b>${u.team_id?' <span class="ogwork" title="주간업무 팀">업무</span>':""}</td><td>${ogHeadName(u)?esc(ogHeadName(u)):'<span class="hint" style="margin:0">미정</span>'}</td><td class="r mono">${ogPeopleIn(u.id,true).length}</td></tr>`).join("")||'<tr><td colspan="4" class="hint">아래 조직이 없어요</td></tr>'}
  </tbody></table></div>${edit?`<table class="ogtb fx ognewtb"><colgroup><col style="width:96px"><col><col style="width:76px"></colgroup><tbody><tr class="ognewrow"><td><select class="ogi" id="og-klv">${adm.org.levels.map(l=>`<option${l.name===ogNextLevel(pid)?" selected":""}>${esc(l.name)}</option>`).join("")}</select></td><td><input class="ogi" id="og-kname" placeholder="아래 조직 이름" autocomplete="off"></td><td><button class="btn" type="button" data-ogact="kidadd" data-pid="${esc(pid||"")}">+ 추가</button></td></tr></tbody></table>`:""}</div>`}
function ogRootView(){const o=adm.org,c=o.ceo||{},ceoT=c.title||"대표이사",ex=(o.execs||[]).filter(x=>x.name);
  return `${ogCrumb(null)}<div class="ogvh"><h3 class="ogph3">${esc(ceoT)} · 임원</h3><span class="hint" style="margin:0">${1+ex.length}명</span></div>
  <table class="ogtb fx"><colgroup><col><col style="width:100px"><col style="width:40%"></colgroup><thead><tr><th>이름</th><th>직책</th><th>메일</th></tr></thead><tbody>
    <tr class="lead"><td><b>${c.name?esc(c.name):'<span class="hint" style="margin:0">이름 미정</span>'}</b></td><td>${esc(ceoT)}</td><td class="mono ogmail">${c.email?esc(c.email):ogDash}</td></tr>
    ${ex.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.title||"임원")}</td><td class="mono ogmail">${x.email?esc(x.email):ogDash}</td></tr>`).join("")}</tbody></table>
  <h4 class="ogph4">바로 아래 조직</h4>${ogKidsTable(null,false)}`}
function ogRootEdit(){const o=adm.org,c=o.ceo||{};
  return `${ogCrumb(null)}<h3 class="ogph3">${esc(c.title||"대표이사")} · 임원</h3>
  <table class="ogtb fx"><colgroup><col><col style="width:100px"><col style="width:38%"><col style="width:30px"></colgroup><thead><tr><th>이름</th><th>직책</th><th>메일</th><th></th></tr></thead><tbody>
    <tr class="lead"><td>${ogIn("ceo:x:name",c.name,"대표 이름")}</td><td>${ogIn("ceo:x:title",c.title,"대표이사","ogTitles")}</td><td>${ogIn("ceo:x:email",c.email,"메일 (선택)")}</td><td></td></tr>
    ${(o.execs||[]).map((x,i)=>`<tr><td>${ogIn(`ex:${i}:name`,x.name,"이름")}</td><td>${ogIn(`ex:${i}:title`,x.title,"예: 전무","ogTitles")}</td><td>${ogIn(`ex:${i}:email`,x.email,"메일 (선택)")}</td><td><button class="ib" type="button" data-ogact="exdel" data-i="${i}" aria-label="빼기">✕</button></td></tr>`).join("")}
    <tr class="ognewrow"><td colspan="4"><button class="btn ghost" type="button" data-ogact="exadd">+ 임원 추가 (부사장·전무·상무 등)</button></td></tr></tbody></table>
`}
function ogUnitView(u){const o=adm.org,pp=ogPeopleIn(u.id,true),deep=pp.some(p=>ogPUnit(p)!==u.id),hn=ogHeadName(u),ks=ogKids(u.id);
  const heads=new Set(o.units.filter(x=>x.head&&x.head.email).map(x=>x.head.email)),he=u.head&&u.head.email;
  const rank=p=>{const i=o.titles.indexOf(p.title);return i<0?999:i};
  pp.sort((a,b)=>(b.email===he)-(a.email===he)||heads.has(b.email)-heads.has(a.email)||rank(a)-rank(b)||a.name.localeCompare(b.name,"ko"));
  return `${ogCrumb(u.id)}<div class="ogvh"><h3 class="ogph3">${esc(u.name)}</h3>${u.level?`<span class="oglv lv${ogLvIdx(u)}">${esc(u.level)}</span>`:""}${u.team_id?'<span class="ogwork" title="이 조직 사람들이 주간업무를 함께 써요">주간업무 팀</span>':""}
    <span class="hint" style="margin:0">${hn?`${esc(ogHeadTitle(u))} <b>${esc(hn)}</b>`:`${esc(ogHeadTitle(u))} 미정`} · ${pp.length}명</span></div>
  ${ks.length?`<h4 class="ogph4">아래 조직 ${ks.length}개</h4>${ogKidsTable(u.id,false)}`:""}
  <h4 class="ogph4">구성원</h4>
  <div class="ogfix"><div class="ogscroll ppl"><table class="ogtb fx"><colgroup><col style="width:76px"><col><col style="width:${deep?"26%":"1px"}"><col style="width:34%"></colgroup><thead><tr><th>직책</th><th>이름</th><th>${deep?"소속":""}</th><th>메일</th></tr></thead><tbody>
    ${u.head&&u.head.name&&!u.head.email?`<tr class="lead"><td><span class="ogrole">${esc(ogHeadTitle(u))}</span></td><td><b>${esc(u.head.name)}</b></td><td class="ogmail">${deep?esc(u.name):""}</td><td class="mono ogmail">${u.head.email?esc(u.head.email):ogDash}</td></tr>`:""}
    ${pp.map(p=>{const pu=ogPUnit(p),isH=heads.has(p.email);if(!p.title&&p.email===he)p={...p,title:ogHeadTitle(u)};return `<tr class="${isH?"lead":""}"><td>${p.title?(isH?`<span class="ogrole">${esc(p.title)}</span>`:esc(p.title)):ogDash}</td><td><b>${esc(p.name)}</b></td><td class="ogmail">${deep&&pu!==u.id?esc((ogU(pu)||{}).name||""):""}</td><td class="mono ogmail" title="${esc(p.email)}">${esc(p.email)}</td></tr>`}).join("")||`<tr><td colspan="4" class="hint">${ogTeamFor(u.id)?"아직 사람이 없어요. '사람' 탭에서 등록하고 소속을 이 조직으로 골라주세요.":"아래에 주간업무 팀을 먼저 만들면 사람을 넣을 수 있어요."}</td></tr>`}
  </tbody></table></div></div>`}
function ogUnitEdit(u){const o=adm.org,z=Object.fromEntries(adm.org0.people.map(p=>[p.email,1])),he=u.head&&u.head.email,ht=ogHeadTitle(u),rl=ogLv(u.level).head||"조직장",w=ogWorkOf(u.id);
  const rank=p=>{const i=o.titles.indexOf(p.title);return i<0?999:i};
  const pp=ogPeopleIn(u.id,false).sort((a,b)=>(b.email===he)-(a.email===he)||rank(a)-rank(b)||a.name.localeCompare(b.name,"ko"));
  const tOpts=cur=>`<option value="">-</option>${[...new Set([...o.titles,cur].filter(Boolean))].map((t,i)=>`<option value="${esc(t)}"${t===cur?" selected":""}>${o.titles.includes(t)?(o.titles.indexOf(t)+1)+". ":""}${esc(t)}</option>`).join("")}`;
  const mem=u.team_id||w?"팀원":"구성원";
  return `${ogCrumb(u.id)}<div class="ogvh"><h3 class="ogph3">${esc(u.name)}</h3>${u.level?`<span class="oglv lv${ogLvIdx(u)}">${esc(u.level)}</span>`:""}<span class="hint" style="margin:0">${w?`구성원 ${pp.length}명 · 역할과 직책을 고쳐요`:`${esc(rl)}을(를) 고쳐요 · 팀원은 아래 팀을 눌러 고쳐요`}</span></div>
  <div class="ogfix"><div class="ogscroll ppl"><table class="ogtb fx ogppl"><colgroup><col><col style="width:104px"><col style="width:120px"><col style="width:30%"><col style="width:30px"></colgroup>
    <thead><tr><th>이름</th><th>역할</th><th>직책</th><th>메일</th><th></th></tr></thead><tbody>
    ${!he&&(u.head&&u.head.name||!w)?`<tr class="lead"><td>${ogIn(`u:${u.id}:hname`,u.head&&u.head.name,rl+" 이름")}</td><td><span class="ogrole">${esc(rl)}</span></td>
      <td><select class="ogi" data-ogf="u:${esc(u.id)}:htitle">${tOpts((u.head&&u.head.title)||ht)}</select></td><td class="ogout">${u.head&&u.head.name&&ogTeamFor(u.id)?`<button class="btn ogreg" type="button" data-ogact="headreg" data-id="${esc(u.id)}" title="명단에 없는 사람이에요. 등록하면 조직도와 이어져요">＋ 사람으로 등록</button>`:'<span class="hint" style="margin:0">명단 밖</span>'}</td><td></td></tr>`:""}
    ${pp.map(p=>`<tr class="${p.email===he?"lead":""}${o.flash===p.email?" ogflash":""}"><td><b>${esc(p.name)}</b></td>
      <td><select class="ogi" data-ogf="p:${esc(p.email)}:rolex"><option value="head"${p.email===he?" selected":""}>${esc(rl)}</option><option value="member"${p.email!==he?" selected":""}>${mem}</option></select></td>
      <td><select class="ogi" data-ogf="p:${esc(p.email)}:title">${tOpts(p.title)}</select></td>
      <td class="mono ogmail" title="${esc(p.email)}">${esc(p.email)}</td><td></td></tr>`).join("")
      ||(w?`<tr><td colspan="5" class="hint">아직 바로 속한 사람이 없어요.</td></tr>`:"")}
    ${ogTeamFor(u.id)?`<tr class="ogaddrow"><td colspan="5"><button class="btn" type="button" data-ogact="padd" data-id="${esc(u.id)}">＋ 사람 추가</button></td></tr>`:""}
  </tbody></table></div>
</div>
  <p class="hint" style="margin:0">소속 옮기기·퇴사는 '사람' 탭에서 해요.</p>`}
function ogSettingsHtml(){const o=adm.org;
  return `<div class="ogpbtn"><button class="btn" type="button" data-node="root">← 조직도로</button></div>
  <div class="ogcrumb"><b>조직 종류 · 직책</b></div>
  <h3 class="ogph3">조직 종류</h3><p class="hint" style="margin:-6px 0 0">위에서 아래 순서예요. 새 조직을 넣을 때 다음 종류가 먼저 골라져요.</p>
  <table class="ogtb fx"><colgroup><col style="width:58px"><col><col style="width:110px"><col style="width:76px"><col style="width:30px"></colgroup><thead><tr><th>순서</th><th>종류 이름</th><th>조직장 직책</th><th>주간업무</th><th></th></tr></thead><tbody>
    ${o.levels.map((l,i)=>`<tr><td style="white-space:nowrap"><button class="ib" type="button" data-ogact="lvup" data-i="${i}"${i?"":" disabled"} aria-label="위로">↑</button><button class="ib" type="button" data-ogact="lvdn" data-i="${i}"${i<o.levels.length-1?"":" disabled"} aria-label="아래로">↓</button></td>
      <td>${ogIn(`lv:${i}:name`,l.name,"예: 사업부")}</td><td>${ogIn(`lv:${i}:head`,l.head,"예: 사업부장","ogTitles")}</td>
      <td><label class="ogchk"><input type="radio" name="ogwork" data-ogf="lv:${i}:work"${l.work?" checked":""}> 기본</label></td><td><button class="ib" type="button" data-ogact="lvdel" data-i="${i}" aria-label="빼기">✕</button></td></tr>`).join("")}
    <tr class="ognewrow"><td colspan="5"><button class="btn ghost" type="button" data-ogact="lvadd">+ 종류 추가</button></td></tr></tbody></table>
  <p class="hint" style="margin:0">예: 사업부 → 실 → 팀 → 파트. '주간업무 기본'은 한 종류만 고를 수 있고, 그 종류로 새로 만드는 조직이 주간업무 팀이 돼요.</p>
  <h3 class="ogph3" style="margin-top:8px">직책</h3><p class="hint" style="margin:-6px 0 0">1번이 가장 높은 직책이에요. 명단은 이 번호 순서로 정렬돼요. ↑↓로 순서를 바꿔요.</p>
  <ol class="ogtitles">${o.titles.map((t,i)=>`<li><span class="ogtno">${i+1}</span><span class="ogtnm">${esc(t)}</span><span class="ogtact"><button type="button" class="ib" data-ogact="tup" data-i="${i}"${i?"":" disabled"} aria-label="${esc(t)} 위로">↑</button><button type="button" class="ib" data-ogact="tdn" data-i="${i}"${i<o.titles.length-1?"":" disabled"} aria-label="${esc(t)} 아래로">↓</button><button type="button" class="ib" data-ogact="tdel" data-i="${i}" aria-label="${esc(t)} 빼기">✕</button></span></li>`).join("")}</ol>
  <div class="ogrow"><input class="ogi ognewin" id="og-tadd" placeholder="직책 추가 (예: 그룹장)" autocomplete="off"><button class="btn" type="button" data-ogact="tadd">추가</button></div>`}
function ogExport(){const o=adm.org,rows=[["조직","이름","메일","직책","구분"]];
  if(o.ceo&&o.ceo.name)rows.push(["",o.ceo.name,o.ceo.email||"",o.ceo.title||"대표이사","대표이사"]);
  (o.execs||[]).filter(x=>x.name).forEach(x=>rows.push(["",x.name,x.email||"",x.title||"","임원"]));
  const walk=pid=>ogKids(pid).forEach(u=>{const path=[...ogAnc(u.id).reverse(),u].map(x=>x.name).join(" > "),here=ogPeopleIn(u.id,false);
    if(u.head&&u.head.name&&!u.head.email)rows.push([path,u.head.name,"",ogHeadTitle(u),"조직장"]);
    here.forEach(p=>rows.push([path,p.name,p.email,p.title||"",u.head&&u.head.email===p.email?"조직장":""]));
    if(!here.length&&!(u.head&&u.head.name))rows.push([path,"","","",""]);walk(u.id)});
  walk(null);
  const csv="﻿"+rows.map(r=>r.map(v=>/[",\n]/.test(v)?`"${String(v).replace(/"/g,'""')}"`:v).join(",")).join("\r\n");
  try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download=`조직_${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
  catch(_){toast("내려받지 못했어요.")}
}
/* ----- 저장 ----- */
async function ogSave(){
  const o=adm.org,r=ogDiff();if(!r.any)return;const b=document.querySelector('[data-ogact="save"]');if(b)b.disabled=true;
  const lists=name=>({projects:[],customers:["내부"],vendors:[],cats:catPreset(name)});
  const clean=h=>h&&((h.name||"").trim()||h.email)?{name:(h.name||"").trim(),title:(h.title||"").trim(),email:h.email||null}:null;
  const depth=u=>ogAnc(u.id).length,row=u=>({id:u.id,name:u.name.trim()||"이름 없음",level:u.level||"",parent_id:u.parent_id||null,sort:u.sort,head:clean(u.head),team_id:u.team_id||null});
  try{
    for(const t of r.tAdd)await api.saveTeam({id:t.id,name:t.name.trim(),sort:t.sort,lists:lists(t.name)},true);
    for(const u of [...r.uAdd].sort((a,b)=>depth(a)-depth(b)))await api.saveUnit(row(u),true);
    for(const u of r.uUpd)await api.saveUnit(row(u),false);
    for(const t of r.tUpd)await api.saveTeam({id:t.id,name:t.name.trim(),sort:t.sort},false);
    if(r.pAdd.length)await api.addPeople(r.pAdd.map(p=>({email:p.email,name:p.name.trim(),team_id:p.team_id,unit_id:p.unit_id||null,role:p.role,title:(p.title||"").trim()||null})));
    for(const p of r.pUpd)await api.updatePerson(p.email,{name:p.name.trim()||p.email,team_id:p.team_id,unit_id:p.unit_id||null,role:p.role,title:(p.title||"").trim()||null});
    for(const u of [...r.uDel].reverse())await api.delUnit(u.id);
    if(r.co)await api.saveCompany({ceo:clean(o.ceo),execs:(o.execs||[]).map(clean).filter(Boolean),org_levels:o.levels.filter(l=>(l.name||"").trim()),titles:o.titles});
    toast(r.n?`조직을 저장했어요 (${r.n}건)`:"순서를 맞췄어요");
  }catch(x){toast("저장하다 멈췄어요. 일부만 저장됐을 수 있어요. "+errText(x))}
  const view=o.view,sel=o.sel;adm.org=null;await loadAdmin();if(adm.org){adm.org.view=view;adm.org.sel=sel}ogRender();paintUser();
}
/* ----- 입력 ----- */
function ogSet(el,commit){
  const o=adm.org,f=el.dataset.ogf,i1=f.indexOf(":"),i2=f.lastIndexOf(":"),k=f.slice(0,i1),key=f.slice(i1+1,i2),fld=f.slice(i2+1),v=el.type==="checkbox"?el.checked:el.value;
  let re=false;
  if(k==="ceo")o.ceo=Object.assign({},o.ceo||{},{[fld]:String(v).trim()});
  else if(k==="ex"){const x=o.execs[+key];if(x)x[fld]=String(v).trim()}
  else if(k==="lv"){const l=o.levels[+key];if(l){if(fld==="work"){o.levels.forEach(x=>x.work=false);l.work=true;re=true}else{const old=l.name;l[fld]=String(v).trim();if(fld==="name"&&old&&old!==l.name)o.units.forEach(u=>{if(u.level===old)u.level=l.name})}}}
  else if(k==="u"){const u=ogU(key);if(!u)return;
    if(fld==="name")u.name=String(v).trim();
    else if(fld==="level"){u.level=v;re=true}
    else if(fld==="hname"){u.head=Object.assign({title:""},u.head||{},{name:String(v).trim(),email:null})}
    else if(fld==="htitle"){u.head=Object.assign({name:"",email:null},u.head||{},{title:String(v).trim()});if(el.tagName==="SELECT")re=true}
    else if(fld==="headsel"){const prev=u.head&&u.head.email;
      if(!v)u.head=null;else if(v==="__custom")u.head={name:"",title:(u.head&&u.head.title)||"",email:null};
      else{const p=o.people.find(x=>x.email===v);u.head={email:v,name:p?p.name:"",title:(u.head&&u.head.title)||""};if(u.team_id&&p&&p.team_id===u.team_id)p.role="leader"}
      if(prev&&prev!==v&&u.team_id){const q=o.people.find(x=>x.email===prev);if(q&&q.team_id===u.team_id)q.role="member"}
      re=true}
    else if(fld==="work"){if(v)u.team_id=ogRid("t");else if(!(u.team_id in o.teamName))u.team_id=null;ogSyncPeople();re=true}}
  else if(k==="p"&&fld==="rolex"){const p=o.people.find(x=>x.email===key),u=p&&ogU(ogPUnit(p));if(p&&u){
      if(v==="head"){const prev=u.head&&u.head.email;if(prev&&prev!==p.email){const q=o.people.find(x=>x.email===prev);if(q&&u.team_id)q.role="member"}
        const rl=ogLv(u.level).head||"조직장";if(!p.title&&o.titles.includes(rl))p.title=rl;u.head={email:p.email,name:p.name,title:p.title||rl};if(u.team_id)p.role="leader"}
      else{if(u.head&&u.head.email===p.email)u.head=null;if(u.team_id)p.role="member"}
      o.flash=p.email;re=true}}
  else if(k==="p"){const p=o.people.find(x=>x.email===key);if(p){if(fld==="unit"){const w=ogTeamFor(v);if(!w){toast("아래에 주간업무 팀이 없는 조직이에요. 먼저 팀을 만들어 주세요.");re=true}else{p.unit_id=v;p.team_id=w.team_id;if(p.role==="leader"&&!o.units.some(u=>u.team_id===p.team_id&&u.head&&u.head.email===p.email))p.role="member";o.flash=p.email;re=true}}else p[fld]=String(v).trim()}}
  if(re){ogRender();return}
  ogState();if(commit){const w=$("ogWrap");if(w)w.outerHTML=orgChartHtml()}
}
$("adBody").addEventListener("input",e=>{if(adm.tab!=="org"||!adm.org)return;
  if(e.target.id==="ogPaste"){adm.org.paste=e.target.value;return}
  if(e.target.dataset.ogf&&e.target.tagName==="INPUT"&&e.target.type!=="checkbox")ogSet(e.target,false)});
$("adBody").addEventListener("change",e=>{if(adm.tab!=="org"||!adm.org)return;if(e.target.id==="og-apar"){const l=$("og-alv");if(l)l.value=ogNextLevel(e.target.value||null);return}if(!e.target.dataset.ogf)return;ogSet(e.target,e.target.tagName==="INPUT"&&e.target.type!=="checkbox")});
$("adBody").addEventListener("keydown",e=>{if(adm.tab!=="org"||!adm.org||e.key!=="Enter"||e.target.tagName!=="INPUT")return;
  const row=e.target.closest(".ognewrow,.ogrow");if(row){const b=row.querySelector("[data-ogact]");if(b){e.preventDefault();b.click();return}}
  if(e.target.dataset.ogf){e.preventDefault();e.target.blur()}});
$("adBody").addEventListener("click",async e=>{
  if(adm.tab!=="org"||!adm.org)return;const o=adm.org;
  if(Date.now()-ogLastDrag<350){e.preventDefault();return}
  const v=e.target.closest("[data-ogview]");if(v){o.view=v.dataset.ogview;ogRender();return}
  const a=e.target.closest("[data-ogact]");
  if(o.pop&&!e.target.closest("#ogPop")&&!a){o.pop=null}
  const nd=!a&&e.target.closest("[data-node]");if(nd&&!e.target.closest("input,select,label")){ogSelect(nd.dataset.node);return}
  if(!a&&!o.pop&&document.getElementById("ogPop")){ogRender();return}
  if(!a)return;const k=a.dataset.ogact,val=id=>($(id)?$(id).value.trim():"");
  if(k==="uopen"){o.pop=o.pop===a.dataset.id?null:a.dataset.id;o._popPos=0;ogRender();return}
  if(k==="uclose"){o.pop=null;ogRender();return}
  if(k==="edit"){o.editing=true;ogRender();return}
  if(k==="editdone"){o.editing=false;ogRender();return}
  if(k==="addopen"){o.adding=true;o.addPar=undefined;ogRender();setTimeout(()=>$("og-apar")&&$("og-apar").focus(),40);return}
  if(k==="addclose"){o.adding=false;ogRender();return}
  if(k==="padd"){const uid=a.dataset.id;ogLeaveGuard(()=>gOpen(uid));return}
  if(k==="headreg"){const u=ogU(a.dataset.id);if(!u)return;if(ogDiff().n){toast("먼저 조직도를 저장한 뒤에 등록해 주세요.");return}
    gOpen(u.id,(u.head&&u.head.name)||"");return}
  const mk=(name,level,pid)=>{if(!name){toast("이름을 넣어주세요.");return null}
    if(ogKids(pid).some(u=>u.name===name)){toast("같은 곳에 같은 이름의 조직이 있어요.");return null}
    const lv=o.levels.find(l=>l.name===level)||{},inWork=pid&&ogWorkOf(pid);
    const u={id:ogRid("u"),name,level,parent_id:pid||null,sort:99999,head:null,team_id:lv.work&&!inWork?ogRid("t"):null};
    o.units.push(u);ogRenum(pid||null);o.flash=u.id;return u};
  if(k==="addgo"){const par=$("og-apar").value||"",u=mk(val("og-aname"),$("og-alv").value,par||null);if(!u)return;o.addPar=par;o.sel=u.id;o.editing=false;ogRender();
    setTimeout(()=>{const i=$("og-aname");if(i)i.focus()},40);toast(`'${u.name}'을(를) 넣었어요${u.team_id?" (주간업무 팀)":""}. 저장을 눌러야 반영돼요.`);return}
  if(k==="kidadd"){const pid=a.dataset.pid||null,u=mk(val("og-kname"),$("og-klv").value,pid);if(!u)return;ogRender();setTimeout(()=>$("og-kname")&&$("og-kname").focus(),40);return}
  if(k==="udel"){const u=ogU(a.dataset.id);if(!u)return;const pid=u.parent_id||null;
    if(u.team_id&&ogPeopleIn(u.id,true).length&&!ogWorkOf(pid)){toast("사람이 있는 주간업무 팀은 먼저 사람을 다른 팀으로 옮겨주세요.");return}
    ogKids(u.id).forEach(c=>{c.parent_id=pid;c.sort=u.sort+0.5});o.people.forEach(p=>{if(p.unit_id===u.id)p.unit_id=pid});
    o.units=o.units.filter(x=>x!==u);ogRenum(pid);ogSyncPeople();o.sel=pid||"root";o.editing=false;o.pop=null;ogRender();toast("조직을 지웠어요. 저장을 눌러야 실제로 지워져요.");return}
  if(k==="exadd"){o.execs=o.execs||[];o.execs.push({name:"",title:"",email:""});ogRender();setTimeout(()=>{const i=document.querySelector(`[data-ogf="ex:${o.execs.length-1}:name"]`);if(i)i.focus()},40);return}
  if(k==="exdel"){o.execs.splice(+a.dataset.i,1);ogRender();return}
  if(k==="lvadd"){o.levels.push({name:"",head:""});ogRender();setTimeout(()=>{const i=document.querySelector(`[data-ogf="lv:${o.levels.length-1}:name"]`);if(i)i.focus()},40);return}
  if(k==="lvdel"){const l=o.levels[+a.dataset.i];if(l&&l.name&&o.units.some(u=>u.level===l.name)){toast(`'${l.name}' 종류의 조직이 있어서 뺄 수 없어요.`);return}o.levels.splice(+a.dataset.i,1);ogRender();return}
  if(k==="lvup"||k==="lvdn"){const i=+a.dataset.i,j=k==="lvup"?i-1:i+1;if(j<0||j>=o.levels.length)return;[o.levels[i],o.levels[j]]=[o.levels[j],o.levels[i]];ogRender();return}
  if(k==="tadd"){const t=val("og-tadd");if(!t)return;if(o.titles.includes(t)){toast("이미 있어요.");return}o.titles.push(t);ogRender();setTimeout(()=>$("og-tadd")&&$("og-tadd").focus(),40);return}
  if(k==="tdel"){o.titles.splice(+a.dataset.i,1);ogRender();return}
  if(k==="tup"||k==="tdn"){const i=+a.dataset.i,j=k==="tup"?i-1:i+1;if(j<0||j>=o.titles.length)return;[o.titles[i],o.titles[j]]=[o.titles[j],o.titles[i]];ogRender();return}
  if(k==="pdel"){o.people=o.people.filter(p=>p.email!==a.dataset.em);ogRender();return}
  if(k==="padd"){const uid=a.dataset.unit,w=ogWorkOf(uid),name=val("og-nname"),id=val("og-nid").toLowerCase().replace(/\s/g,"");
    if(!w){toast("사람은 주간업무 팀(또는 그 아래 조직)에 넣어요.");return}
    if(!name){toast("이름을 넣어주세요.");$("og-nname").focus();return}if(!id){toast("메일 아이디를 넣어주세요.");$("og-nid").focus();return}
    let em=id;if(!em.includes("@")&&MAIL_DOMAIN)em+="@"+MAIL_DOMAIN;if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){toast("메일 주소를 확인해 주세요.");$("og-nid").focus();return}
    const ex=adm.people.find(p=>p.email===em)||o.people.find(p=>p.email===em);
    if(ex){toast(ex.active===false?`${ex.name} 님은 퇴사 처리된 메일이에요. '사람' 탭에서 다시 살려주세요.`:`이미 등록된 메일이에요 (${ex.name}). 그 사람의 소속을 바꿔서 옮겨주세요.`);return}
    o.people.push({email:em,name,team_id:w.team_id,unit_id:uid,role:"member",title:$("og-ntitle").value||""});o.flash=em;ogRender();
    setTimeout(()=>$("og-nname")&&$("og-nname").focus(),40);return}
  if(k==="reset"){const view=o.view,sel=o.sel;adm.org=ogJ(adm.org0);Object.assign(adm.org,{view,sel});ogRender();return}
  if(k==="save"){await ogSave();return}
  if(k==="sample"){o.paste=OG_SAMPLE;o.plan=null;ogRender();return}
  if(k==="export"){ogExport();return}
  if(k==="parse"){o.paste=$("ogPaste").value;if(!o.paste.trim()){toast("먼저 엑셀에서 복사해 붙여넣어 주세요.");return}o.plan=ogParse(o.paste);ogRender();
    setTimeout(()=>{const s=document.querySelector(".ogplans");if(s)s.scrollIntoView({behavior:"smooth",block:"start"})},40);return}
  if(k==="apply"){const P=o.plan;if(!P)return;Object.assign(o,{units:P.D.units,people:P.D.people,ceo:P.D.ceo,execs:P.D.execs,plan:null,paste:"",view:"chart",sel:"root",editing:false});
    const seen=new Set();o.units.forEach(u=>{const pid=u.parent_id||null;if(!seen.has(pid)){seen.add(pid);ogRenum(pid)}});ogRender();toast("조직도에 반영했어요. 확인하고 저장을 눌러주세요.");return}
});
/* ----- 끌어서 옮기기 : 아이폰 홈 화면처럼 (마우스는 바로, 손가락은 꾹 눌러서) ----- */
const OG_EASE="cubic-bezier(.22,1,.36,1)";
const ogNow=()=>performance.now();
function ogKey(n){return n.dataset.unit?"u:"+n.dataset.unit:n.classList.contains("ogcol")?"c:"+(n.dataset.col||""):null}
function ogRects(){const m=new Map();document.querySelectorAll(".ogcols .ogt[data-unit],.ogcols>.ogcol").forEach(n=>{const k=ogKey(n);if(k){const r=n.getBoundingClientRect();if(r.width)m.set(k,r)}});return m}
function ogFlipFrom(before,skip,dur){document.querySelectorAll(".ogcols .ogt[data-unit],.ogcols>.ogcol").forEach(n=>{const k=ogKey(n);if(!k||k===skip)return;const a=before.get(k),b=n.getBoundingClientRect();
  if(n._fa)n._fa.cancel();
  if(!a){if(b.width)n._fa=n.animate([{opacity:0,transform:"scale(.96)"},{opacity:1,transform:"none"}],{duration:dur,easing:OG_EASE});return}
  const dx=a.left-b.left,dy=a.top-b.top;if(Math.abs(dx)<.5&&Math.abs(dy)<.5)return;
  n._fa=n.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:"none"}],{duration:dur,easing:OG_EASE})})}
function ogFlip(fn){const before=ogRects();fn();ogFlipFrom(before,null,300)}
$("adBody").addEventListener("pointerdown",e=>{
  if(adm.tab!=="org"||!adm.org||adm.org.view!=="chart"||(e.button||0)>0||OGD)return;
  const card=e.target.closest(".ogt[data-unit]");if(!card||!card.dataset.unit)return;
  const id=card.dataset.unit,col=card.classList.contains("ogdiv")?card.closest(".ogcol"):null;
  const el=col||card.closest(".ognode")||card;
  OGD={id,el,card,horiz:!!col,x:e.clientX,y:e.clientY,cx:e.clientX,cy:e.clientY,on:false,touch:e.pointerType!=="mouse"};
  if(OGD.touch)OGD.timer=setTimeout(()=>{if(OGD&&!OGD.on)ogStart()},300);
});
function ogStart(){const d=OGD;d.on=true;const r=d.card.getBoundingClientRect();d.dx=d.x-r.left;d.dy=d.y-r.top;
  const g=d.card.cloneNode(true);g.classList.add("oggh");g.classList.remove("on","ogover");g.style.width=r.width+"px";g.style.height=r.height+"px";
  const nk=d.el.querySelectorAll(".ogt").length-1;if(nk>0){const b=document.createElement("span");b.className="ogghn";b.textContent=`+${nk}`;g.appendChild(b)}
  Object.assign(d,{gx:r.left,gy:r.top,sc:1,tilt:0,px:d.cx,cand:null,last:0,ch:r.height});
  g.style.transform=`translate(${r.left}px,${r.top}px)`;document.body.appendChild(g);d.g=g;requestAnimationFrame(()=>g.classList.add("up"));
  const ph=document.createElement("div");ph.className=d.horiz?"ogcol ogslotcol":"ogslot";if(!d.horiz)ph.style.height=r.height+"px";d.ph=ph;
  ogFlip(()=>{d.el.after(ph);d.el.style.display="none"});d.to=null;
  document.body.classList.add("ogdragging");if(navigator.vibrate)try{navigator.vibrate(8)}catch(_){}
  d.raf=requestAnimationFrame(ogLoop);
}
function ogLoop(){const d=OGD;if(!d||!d.on)return;
  const tx=d.cx-d.dx,ty=d.cy-d.dy;d.gx+=(tx-d.gx)*.42;d.gy+=(ty-d.gy)*.42;d.sc+=(1.045-d.sc)*.22;
  const vx=d.cx-d.px;d.px=d.cx;d.tilt+=(Math.max(-5,Math.min(5,vx*.35))-d.tilt)*.18;
  d.g.style.transform=`translate(${d.gx.toFixed(2)}px,${d.gy.toFixed(2)}px) rotate(${d.tilt.toFixed(2)}deg) scale(${d.sc.toFixed(4)})`;
  const t=ogNow();if(t-d.last>45){d.last=t;ogPlace()}
  d.raf=requestAnimationFrame(ogLoop);
}
function ogSlot(d,kind){const want=kind==="col"?"ogcol ogslotcol":"ogslot";if(d.ph.className!==want){d.ph.className=want;d.ph.style.height=kind==="col"?"":d.ch+"px"}}
function ogPlace(){
  const d=OGD;if(!d||!d.on)return;const hit=document.elementFromPoint(d.cx,d.cy);if(!hit||(d.ph&&d.ph.contains(hit)))return;
  let want=null;
  const ceo=hit.closest(".ogceo");
  if(ceo)want={mode:"into",target:null,el:ceo};
  else{const card=hit.closest(".ogt[data-unit]");
    if(card&&card.dataset.unit&&!d.el.contains(card)){
      const tgt=card.dataset.unit,colHead=card.classList.contains("ogdiv"),r=card.getBoundingClientRect(),cols=card.closest(".ogcols"),vert=cols&&getComputedStyle(cols).flexDirection==="column";
      const horiz=colHead&&!vert,f=horiz?(d.cx-r.left)/r.width:(d.cy-r.top)/r.height;
      let mode=f<0.3?"before":f>0.7?"after":"into";
      if(d.to&&d.to.target===tgt&&d.to.mode!==mode){const b=d.to.mode==="before"?0.3:d.to.mode==="after"?0.7:null;  // 경계에서 떨리지 않게
        if(d.to.mode==="into"?(f>0.22&&f<0.78):Math.abs(f-b)<0.08)mode=d.to.mode}
      want={mode,target:tgt,el:card,anchor:colHead?card.closest(".ogcol"):card.closest(".ognode"),kind:colHead&&!vert?"col":"row"}}
    else{const box=hit.closest(".ogkids[data-kids]");if(box)want={mode:"into",target:box.dataset.kids||null,box}}}
  if(!want)return;
  const key=want.mode+"|"+want.target+"|"+(want.box?"box":"");
  const t=ogNow();if(!d.cand||d.cand.key!==key){d.cand={key,t};if(d.to)return}else if(t-d.cand.t<70&&d.to)return;
  if(d.to&&d.to.key===key)return;
  document.querySelectorAll(".ogover").forEach(x=>x.classList.remove("ogover"));
  d.to={mode:want.mode,target:want.target,key};
  if(want.mode==="into"&&!want.box){want.el.classList.add("ogover");
    const holder=want.el.classList.contains("ogdiv")?want.el.closest(".ogcol"):want.el.closest(".ognode"),kb=holder&&holder.querySelector(":scope>.ogkids");
    if(kb){ogSlot(d,"row");if(d.ph.parentNode!==kb||d.ph.nextElementSibling)ogFlip(()=>kb.appendChild(d.ph))}else if(d.ph.isConnected)ogFlip(()=>d.ph.remove());
    return}
  if(want.box){ogSlot(d,"row");if(d.ph.parentNode!==want.box||d.ph.nextElementSibling)ogFlip(()=>want.box.appendChild(d.ph));return}
  ogSlot(d,want.kind);ogFlip(()=>{if(want.mode==="before")want.anchor.before(d.ph);else want.anchor.after(d.ph)});
}
document.addEventListener("pointermove",e=>{const d=OGD;if(!d)return;d.cx=e.clientX;d.cy=e.clientY;
  if(!d.on){if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<6)return;if(d.touch){clearTimeout(d.timer);OGD=null;return}ogStart()}
  e.preventDefault();
},{passive:false});
document.addEventListener("touchmove",e=>{if(OGD&&OGD.on)e.preventDefault()},{passive:false});
document.addEventListener("contextmenu",e=>{if(OGD&&OGD.touch)e.preventDefault()});
function ogApplyMove(id,to){const o=adm.org,u=ogU(id);if(!u||!to)return false;
  let pid,srt;
  if(to.mode==="into"){pid=to.target||null;srt=99999}else{const t=ogU(to.target);if(!t)return false;pid=t.parent_id||null;srt=(+t.sort||0)+(to.mode==="before"?-0.5:0.5)}
  if(pid&&ogSubIds(id).has(pid)){toast("자기 아래 조직 안으로는 옮길 수 없어요.");return false}
  const inWork=pid&&ogWorkOf(pid),hasWork=[...ogSubIds(id)].some(x=>(ogU(x)||{}).team_id);
  if(inWork&&hasWork){toast(`주간업무 팀('${inWork.name}') 안에는 다른 주간업무 팀을 넣을 수 없어요.`);return false}
  const old=u.parent_id||null;u.parent_id=pid;u.sort=srt;ogRenum(old);ogRenum(pid);ogSyncPeople();return true}
function ogDrop(){const d=OGD;if(!d)return;clearTimeout(d.timer);if(!d.on){OGD=null;return}ogLastDrag=Date.now();
  cancelAnimationFrame(d.raf);OGD=null;document.querySelectorAll(".ogover").forEach(x=>x.classList.remove("ogover"));
  const before=ogRects();   // 지금 보이는 자리 (빈칸 포함)
  ogApplyMove(d.id,d.to);ogRender();document.body.classList.remove("ogdragging");
  ogFlipFrom(before,"u:"+d.id,340);
  const tgt=document.querySelector(`.ogt[data-unit="${CSS.escape(d.id)}"]`),g=d.g;
  if(!g)return;
  if(!tgt){g.remove();return}
  const tr=tgt.getBoundingClientRect();tgt.style.visibility="hidden";
  const sub=d.horiz?tgt.closest(".ogcol"):tgt.closest(".ognode");if(sub)sub.querySelectorAll(".ogkids").forEach(k=>k.animate([{opacity:0},{opacity:1}],{duration:260,delay:120,easing:OG_EASE,fill:"backwards"}));
  g.classList.remove("up");g.classList.add("land");
  g.animate([{transform:g.style.transform},{transform:`translate(${tr.left}px,${tr.top}px) rotate(0deg) scale(1)`,width:tr.width+"px",height:tr.height+"px"}],{duration:320,easing:OG_EASE,fill:"forwards"}).finished
    .then(()=>{tgt.style.visibility="";g.remove()},()=>{tgt.style.visibility="";g.remove()});
}
document.addEventListener("pointerup",ogDrop);
document.addEventListener("pointercancel",()=>{const d=OGD;if(d&&!d.on){clearTimeout(d.timer);OGD=null}else if(d)ogDrop()});


/* ----- 사람 탭에서 쓰는 조직 도우미 (조직도가 있으면 조직, 없으면 팀) ----- */
function pU(id){return (adm.units||[]).find(u=>u.id===id)}
function pKids(pid){return (adm.units||[]).filter(u=>(u.parent_id||null)===(pid||null)).sort((a,b)=>(a.sort-b.sort)||String(a.name).localeCompare(b.name,"ko"))}
function pWork(id){let u=pU(id),n=0;while(u&&n++<50){if(u.team_id)return u;u=u.parent_id?pU(u.parent_id):null}return null}
function pUnitOfTeam(tid){if(!adm.units)return tid||"";const u=adm.units.find(x=>x.team_id===tid);return u?u.id:""}
function pUnitOf(p){if(!adm.units)return p.team_id;if(p.unit_id&&pU(p.unit_id))return p.unit_id;return pUnitOfTeam(p.team_id)}
function pPath(id){const out=[];let u=pU(id),n=0;while(u&&n++<50){out.unshift(u.name);u=u.parent_id?pU(u.parent_id):null}return out}
function pUnitLabelId(id){if(!adm.units)return teamName(id)||"";const ps=pPath(id);return ps.slice(-2).join(" › ")}
function pUnitLabel(p){return adm.units?pUnitLabelId(pUnitOf(p)):teamName(p.team_id)}
function pUnitPathOfTeam(tid){if(!adm.units)return "";const u=adm.units.find(x=>x.team_id===tid);return u?pPath(u.parent_id).join(" › ")||"대표이사 바로 아래":"조직도에 아직 없어요"}
// 업무를 쓸 팀: 자기·위쪽 주간업무 팀, 없으면(본부 등) 바로 아래 첫 주간업무 팀
function pTeamFor(id){const w=pWork(id);if(w)return w;let f=null;const walk=pid=>pKids(pid).forEach(u=>{if(f)return;if(u.team_id)f=u;else walk(u.id)});walk(id);return f}
function pPlace(v){if(!adm.units)return {team_id:v||"",unit_id:null};const w=pTeamFor(v);return {team_id:w?w.team_id:"",unit_id:v||null}}
function pUnitOpts(cur){if(!adm.units)return st.teams.map(t=>`<option value="${esc(t.id)}"${cur===t.id?" selected":""}>${esc(t.name)}</option>`).join("");
  const out=[];const walk=(pid,d)=>pKids(pid).forEach(u=>{const ok=pTeamFor(u.id),own=pWork(u.id);out.push(`<option value="${esc(u.id)}"${u.id===cur?" selected":""}${ok?"":" disabled"}>${"　".repeat(d)}${esc(u.name)}${ok&&!own?` · 업무는 ${esc(ok.name)}`:""}</option>`);walk(u.id,d+1)});walk(null,0);return out.join("")}
function pFindUnit(v){v=String(v||"").trim();if(!v)return null;
  if(!adm.units){const t=st.teams.find(t=>t.name===v||t.id===v||t.name.replace(/\s/g,"")===v.replace(/\s/g,""));return t?t.id:null}
  const segs=v.split(/\s*(?:>|›|\/)\s*/).filter(Boolean),nm=x=>x.replace(/\s/g,"");
  let cand=adm.units.filter(u=>nm(u.name)===nm(segs[segs.length-1]));
  if(segs.length>1)cand=cand.filter(u=>{const ps=pPath(u.id).map(nm);return segs.map(nm).every((x,i,a)=>ps[ps.length-a.length+i]===x)});
  cand=cand.filter(u=>pTeamFor(u.id));return cand.length===1?cand[0].id:null}
