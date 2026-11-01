/* rhy:se Weekly Plan — 주간 업무 보고서 (📝 보고서를 누를 때 불러옴) */
async function rpBgData(){const u=REPORT_BG;if(String(u).startsWith("data:"))return u;const b=await (await fetch(u)).blob();return await new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(b)})}

/* 보고서 글꼴: G마켓 산스 (PC에 설치된 이름과 같아야 해요) */
const RP_FONT="G마켓 산스 TTF Medium",RP_FONT_B="G마켓 산스 TTF Bold";
const PPTX_URL="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
const rpLead=()=>!!st.me&&(st.me.is_admin||(st.me.role==="leader"&&st.team===st.me.team_id));
const md=k=>{const d=parseKey(k);return `${pad(d.getMonth()+1)}/${pad(d.getDate())}`};
const rpPeriod=k=>`${md(k)}~${md(keyOf(addDays(parseKey(k),4)))}`;
const yymmdd=d=>`${String(d.getFullYear()).slice(2)}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`;
const rpBigo=it=>!it.project||it.customer==="내부";
function rpEntries(it,W){
  const w=it.weeks||{},N=nextKey(W),P=prevKey(W);
  let c=w[W]||null;
  if(!c&&w[P]&&w[P].status!=="완료")c=Object.assign({},w[P],{memo:"",carried:true});
  return {c,n:w[N]||null};
}
const memoLines=m=>String(m||"").split(/\n+/).map(s=>s.trim()).filter(Boolean).map(s=>"  - "+s.replace(/^[-·•]\s*/,""));
function rpLines(e,done){
  if(!e)return ["○ N/A"];
  const due=e.due?` (${shortDate(e.due)})`:"";
  return ["○ "+e.task+due+(done&&e.status==="완료"?" - 완료":""),...memoLines(e.memo)];
}
function rpRows(items,W){
  return items.map(it=>{const {c,n}=rpEntries(it,W);return {it,c,n,past:rpLines(c,true),plan:rpLines(n,false),bigo:rpBigo(it)}})
    .filter(r=>r.c||r.n)
    .sort((a,b)=>(a.bigo-b.bigo)||String(a.it.customer).localeCompare(String(b.it.customer),"ko")||String(a.it.project).localeCompare(String(b.it.project),"ko")||String(a.it.owner).localeCompare(String(b.it.owner),"ko"));
}
const rpLeaderName=()=>{const l=(st.people||[]).find(p=>p.active&&p.team_id===st.team&&p.role==="leader");return l?l.name:st.me.name};
const isRep=(it,W)=>!!(it.report&&it.report[W]);
/* 같은 발주처+사업명은 한 줄로 모으고, 사업이 없는 업무는 비고로 */
function rpGroup(rows){
  const g=new Map(),bigo=[];
  for(const r of rows){
    if(r.bigo){bigo.push(...(r.c?r.past:r.plan));continue}
    const k=r.it.customer+"\u0001"+r.it.project;
    if(!g.has(k))g.set(k,{customer:r.it.customer,project:r.it.project,past:[],plan:[]});
    const x=g.get(k);x.past.push(...r.past);x.plan.push(...r.plan);
  }
  const clean=a=>{const b=a.filter((l,i)=>!(l==="○ N/A"&&a.length>1));return b.length?b:["○ N/A"]};
  return {rows:[...g.values()].map((x,i)=>({no:i+1,customer:x.customer,project:x.project,past:clean(x.past),plan:clean(x.plan)})),bigo};
}
/* ---------- 열기·닫기 (주소 끝 #report) ---------- */
function openReport(){
  if(!st.me)return;
  rp.open=true;rp.week=rp.week||st.week;rp.tab=rp.tab==="team"&&rpLead()?"team":"mine";
  if(location.hash!=="#report"){try{history.pushState(null,"","#report")}catch(_){}}   // 미리보기 창처럼 주소를 못 바꾸는 곳에서도 열리게
  document.querySelector("header.top").hidden=true;document.querySelector("main.wrap").hidden=true;
  $("reportPage").hidden=false;window.scrollTo(0,0);
  renderReport();if(rp.tab==="team")loadFinal();
}
function closeReport(fromHash){
  rp.open=false;$("reportPage").hidden=true;
  document.querySelector("header.top").hidden=false;document.querySelector("main.wrap").hidden=false;
  if(!fromHash&&location.hash==="#report"){try{history.back()}catch(_){}}
  render();
}
window.addEventListener("popstate",()=>{if(rp.open&&location.hash!=="#report")closeReport(true);else if(!rp.open&&location.hash==="#report"&&st.me)openReport()});
async function loadFinal(){
  const key=st.team+"|"+rp.week;
  try{const r=await api.reportGet(st.team,rp.week);if(st.team+"|"+rp.week!==key)return;rp.final=new Set((r&&r.data&&r.data.final)||[]);rp.finalFor=key;rp.meta=r||null}
  catch(e){rp.final=new Set();rp.finalFor=key;toast(errText(e))}
  renderReport();
}
let rpSaveT=null;
function saveFinalSoon(){
  clearTimeout(rpSaveT);rp.saving++;paintRpSave();
  rpSaveT=setTimeout(async()=>{
    try{await api.reportSave(st.team,rp.week,{final:[...rp.final]});rp.meta={updated_by:st.me.email,updated_at:new Date().toISOString()}}
    catch(e){toast(errText(e))}
    finally{rp.saving=0;paintRpSave()}
  },500);
}
function paintRpSave(){const el=$("rpSaved");if(el)el.textContent=rp.saving?"저장 중…":"자동 저장됨"}
/* ---------- 그리기 ---------- */
function renderReport(){
  if(!rp.open)return;
  const W=rp.week,N=nextKey(W),lead=rpLead();
  if(rp.tab==="team"&&!lead)rp.tab="mine";
  $("rpWeekLbl").innerHTML=`<b>${rpPeriod(W)}</b> 작성분 <span>→ ${md(N)} 주 보고</span>`;
  document.querySelectorAll("#rpTabs [data-rt]").forEach(b=>{b.setAttribute("aria-selected",b.dataset.rt===rp.tab);if(b.dataset.rt==="team")b.hidden=!lead});
  $("rpTeamName").textContent=teamName(st.team);
  if(rp.tab==="mine")renderMine(W,N);else renderTeamRp(W,N);
}
const linesHtml=a=>a.map(l=>`<div class="${l.startsWith("  - ")?"rl sub":"rl"}">${esc(l.startsWith("  - ")?l.slice(2):l)}</div>`).join("");
const rpHead=(W,N)=>`<th>발주처</th><th>사업명</th><th>지난주 실적 사항<small>(${rpPeriod(W)})</small></th><th>이번주 계획 사항<small>(${rpPeriod(N)})</small></th>`;
function renderMine(W,N){
  if(st.team!==st.me.team_id){$("rpBody").innerHTML=`<div class="rp-empty">내 보고서는 내 팀 화면에서 볼 수 있어요.</div>`;return}
  const rows=rpRows(st.items.filter(isMine),W);
  const n=rows.filter(r=>isRep(r.it,W)).length;
  $("rpBody").innerHTML=`
    <div class="rp-guide"><span class="rp-step">1</span><div><b>보고할 업무를 체크하세요.</b> ${rpPeriod(W)}에 쓴 업무가 보고서 양식으로 정리돼 있어요. 체크한 줄만 팀장님의 팀 보고서로 올라가요.
      <div class="hint" style="margin:4px 0 0">내용을 고치려면 '← Weekly Plan'으로 돌아가서 업무를 수정하세요. 고친 내용은 여기 바로 반영돼요.</div></div></div>
    <div class="rp-tools"><span class="rp-count">보고용 <b>${n}</b> / ${rows.length}건</span>
      <button class="btn" type="button" data-rall="1" ${rows.length?"":"disabled"}>모두 체크</button><button class="btn ghost" type="button" data-rall="0" ${n?"":"disabled"}>모두 해제</button></div>
    ${rows.length?`<div class="rp-tblwrap"><table class="rp-tbl"><thead><tr><th class="rck">보고용</th>${rpHead(W,N)}</tr></thead><tbody>
      ${rows.map(r=>`<tr class="${isRep(r.it,W)?"on":""}"><td class="rck"><input type="checkbox" data-rep="${esc(r.it._id)}" ${isRep(r.it,W)?"checked":""} aria-label="${esc(r.it.project||r.it.customer)} 보고용"></td>
        <td>${r.bigo?'<span class="rp-tag">비고</span>':esc(r.it.customer)}</td><td>${r.bigo?`<span class="hint" style="margin:0">${esc(r.it.category||"")}</span>`:esc(r.it.project)}</td>
        <td>${linesHtml(r.past)}${r.c&&r.c.carried?'<div class="rp-carry">지난주에서 이어진 업무예요</div>':""}</td><td>${linesHtml(r.plan)}</td></tr>`).join("")}
    </tbody></table></div>
    <p class="hint">고객사가 '내부'이거나 대상사업이 없는 업무는 보고서 아래 <b>비고</b> 칸으로 들어가요.</p>
    <h3 class="rp-h">내 보고 미리보기 <span class="hint" style="margin:0">보고용으로 체크한 업무가 팀 보고서에 이렇게 들어가요</span></h3>
    ${slidePreview(rpGroup(rows.filter(r=>isRep(r.it,W))),W,N,rpLeaderName())}`
    :`<div class="rp-empty"><b>${rpPeriod(W)}에 쓴 업무가 없어요.</b><br>Weekly Plan 화면에서 이번주 할일·다음주 계획을 먼저 써주세요.</div>`}`;
}
function renderTeamRp(W,N){
  const key=st.team+"|"+W;
  if(rp.finalFor!==key){$("rpBody").innerHTML=`<div class="rp-empty">불러오는 중…</div>`;if(!rp.busy){rp.busy=true;loadFinal().finally(()=>rp.busy=false)}return}
  const all=rpRows(st.items,W),picked=all.filter(r=>isRep(r.it,W));
  const fin=picked.filter(r=>rp.final.has(r.it._id));
  const gone=[...rp.final].filter(id=>!picked.some(r=>r.it._id===id)).length;
  const mem=(st.people||[]).filter(p=>p.active&&p.team_id===st.team).sort(personOrder);
  const cnt=name=>picked.filter(r=>r.it.owner===name).length;
  const wrote=name=>all.some(r=>r.it.owner===name);
  const none=mem.filter(p=>wrote(p.name)&&!cnt(p.name));
  const g=rpGroup(fin);
  const rowsHtml=list=>list.map(r=>`<tr class="${rp.final.has(r.it._id)?"on":""}"><td class="rck"><input type="checkbox" data-fin="${esc(r.it._id)}" ${rp.final.has(r.it._id)?"checked":""} aria-label="${esc(r.it.project||r.it.customer)} 최종 보고"></td>
      <td class="own">${esc(r.it.owner)}</td><td>${r.bigo?'<span class="rp-tag">비고</span>':esc(r.it.customer)}</td><td>${r.bigo?"":esc(r.it.project)}</td><td>${linesHtml(r.past)}</td><td>${linesHtml(r.plan)}</td></tr>`).join("");
  $("rpBody").innerHTML=`
    <div class="rp-guide"><span class="rp-step">2</span><div><b>최종 보고할 업무를 체크하고 PPT로 내보내세요.</b> 팀원들이 보고용으로 고른 업무만 모여 있어요. 같은 발주처·사업명은 보고서에서 한 줄로 합쳐져요.</div></div>
    <div class="rp-mem">${mem.map(p=>{const c=cnt(p.name);return `<span class="rp-chip${c?"":" zero"}" title="${wrote(p.name)?"":"이번주에 쓴 업무 없음"}">${esc(p.name)} <b>${c}</b></span>`}).join("")}
      ${none.length?`<span class="rp-warn">보고용 미선택: ${none.map(p=>esc(p.name)).join(", ")}</span>`:""}</div>
    <div class="rp-tools"><span class="rp-count">최종 보고 <b>${fin.length}</b> / ${picked.length}건</span>
      <button class="btn" type="button" data-fall="1" ${picked.length?"":"disabled"}>모두 체크</button><button class="btn ghost" type="button" data-fall="0" ${fin.length?"":"disabled"}>모두 해제</button>
      <span class="rp-saved" id="rpSaved">${rp.saving?"저장 중…":"자동 저장됨"}</span>
      <button class="btn primary rp-export" type="button" id="rpExport" ${fin.length?"":"disabled"}>📥 PPT 내보내기</button></div>
    ${gone?`<div class="rp-note">팀원이 보고용 체크를 푼 업무 ${gone}건은 보고서에서 빠졌어요.</div>`:""}
    ${picked.length?`<div class="rp-tblwrap"><table class="rp-tbl team"><thead><tr><th class="rck">최종</th><th>담당</th>${rpHead(W,N)}</tr></thead><tbody>${rowsHtml(picked)}</tbody></table></div>`
      :`<div class="rp-empty"><b>아직 보고용으로 올라온 업무가 없어요.</b><br>팀원들이 '내 보고서'에서 보고할 업무를 체크하면 여기에 모여요.</div>`}
    <h3 class="rp-h">보고서 미리보기 <span class="hint" style="margin:0">PPT에 들어갈 모양이에요</span></h3>
    ${slidePreview(g,W,N)}`;
}
function slidePreview(g,W,N,author){
  const fri=addDays(parseKey(W),4),tn=teamName(st.team);
  return `<div class="rp-slide"><div class="sl-tabs">${rpDeptsNow().map(d=>`<span class="${tn.replace(/팀$/,"")===d?"on":""}">${d}</span>`).join("")}</div>
    <table class="sl-head"><tr><td colspan="6" class="t">${fri.getFullYear()}년도 주간 업무 실적 및 계획</td></tr>
      <tr><th>작성부서</th><td>${esc(tn)}</td><th>작성일자</th><td>${yymmdd(fri)}</td><th>작성자</th><td>${esc(author||st.me.name)}</td></tr></table>
    <table class="sl-body"><thead><tr><th></th><th>발주처</th><th>사업명</th><th>지난주 실적 사항 (기간 : ${rpPeriod(W)})</th><th>이번주 계획 사항 (기간 : ${rpPeriod(N)})</th></tr></thead>
      <tbody>${g.rows.length?g.rows.map(r=>`<tr><td class="c">${r.no}</td><td>${esc(r.customer)}</td><td>${esc(r.project)}</td><td>${linesHtml(r.past)}</td><td>${linesHtml(r.plan)}</td></tr>`).join(""):`<tr><td colspan="5" class="c sl-none">최종 보고로 체크한 업무가 여기에 들어가요</td></tr>`}</tbody></table>
    <table class="sl-bigo"><tr><th>비<br>고</th><td>${g.bigo.length?linesHtml(g.bigo):""}</td></tr></table></div>`;
}
/* ---------- 체크 저장 ---------- */
async function setRep(ids,on){
  const W=rp.week;let n=0;
  for(const id of ids){
    const it=st.items.find(i=>i._id===id);if(!it||!isMine(it)||isRep(it,W)===on)continue;
    const {_id,...rest}=it;const rep=Object.assign({},it.report||{});if(on)rep[W]=true;else delete rep[W];
    it.report=rep;n++;
    try{await st.db.doc("items/"+id).set(Object.assign({},rest,{report:rep}))}catch(e){handleWriteErr(e);break}
  }
  renderReport();
}
$("reportPage").addEventListener("change",e=>{
  const t=e.target;
  if(t.dataset.rep){setRep([t.dataset.rep],t.checked);return}
  if(t.dataset.fin){if(t.checked)rp.final.add(t.dataset.fin);else rp.final.delete(t.dataset.fin);saveFinalSoon();renderReport()}
});
$("reportPage").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  if(b.dataset.rall){const W=rp.week;setRep(rpRows(st.items.filter(isMine),W).map(r=>r.it._id),b.dataset.rall==="1");return}
  if(b.dataset.fall){const W=rp.week;const ids=rpRows(st.items,W).filter(r=>isRep(r.it,W)).map(r=>r.it._id);
    if(b.dataset.fall==="1")ids.forEach(i=>rp.final.add(i));else rp.final.clear();saveFinalSoon();renderReport();return}
  if(b.dataset.rt){rp.tab=b.dataset.rt;renderReport();return}
  if(b.id==="rpExport"){exportReportPptx();return}
});
$("reportBtn").onclick=openReport;
$("rpBack").onclick=()=>closeReport(false);
$("rpPrev").onclick=()=>{rp.week=prevKey(rp.week);renderReport()};
$("rpNext").onclick=()=>{rp.week=nextKey(rp.week);renderReport()};
$("rpThis").onclick=()=>{rp.week=CUR;renderReport()};
/* ---------- PPT 만들기 ---------- */
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=()=>no(new Error("load"));document.head.appendChild(s)})}
async function exportReportPptx(){
  const btn=$("rpExport");const W=rp.week,N=nextKey(W);
  const fin=rpRows(st.items,W).filter(r=>isRep(r.it,W)&&rp.final.has(r.it._id));
  if(!fin.length){toast("최종 보고로 체크한 업무가 없어요.");return}
  btn.disabled=true;btn.textContent="만드는 중…";
  try{
    if(!window.PptxGenJS)await loadScript(PPTX_URL);
    const fri=addDays(parseKey(W),4),mon=parseKey(N);
    const pptx=buildReportPptx(window.PptxGenJS,{team:teamName(st.team),author:st.me.name,date:yymmdd(fri),year:fri.getFullYear(),
      pastLabel:`지난주 실적 사항 ( 기간 : ${rpPeriod(W)})`,planLabel:`이번주 계획 사항 ( 기간 : ${rpPeriod(N)})`,depts:rpDeptsNow(),group:rpGroup(fin),bg:await rpBgData()});
    await pptx.writeFile({fileName:`주간업무보고_${teamName(st.team)}_${yymmdd(mon)}.pptx`});
    toast("PPT를 내려받았어요.");
  }catch(e){toast("PPT를 만들지 못했어요. 인터넷 연결을 확인하고 다시 눌러주세요.")}
  finally{btn.disabled=false;btn.textContent="📥 PPT 내보내기"}
}
/* 회사 양식(4:3, 표 위치·폭은 원본 그대로)으로 그리기. 줄이 넘치면 다음 장으로 */
function buildReportPptx(PptxGenJS,o){
  const pptx=new PptxGenJS();pptx.layout="LAYOUT_4x3";
  const F=RP_FONT,FB=RP_FONT_B,B={type:"solid",pt:0.75,color:"808080"},GR="D9D9D9";
  const COLW=[0.295,0.838,1.171,3.238,3.238],X=0.591,TW=8.781;
  const LH=0.175,PADH=0.09,HEADH=0.31,TOP=1.689;
  const units=s=>{let u=0;for(const ch of s)u+=ch===" "?0.32:/[\x21-\x7e]/.test(ch)?0.56:1;return u};
  const cap=w=>(w-0.14)*6.5;
  const hOf=(lines,w)=>lines.reduce((a,l)=>a+Math.max(1,Math.ceil(units(l)/cap(w))),0);
  const rowH=r=>Math.max(hOf(r.past,COLW[3]),hOf(r.plan,COLW[4]),hOf([r.project],COLW[2]),hOf([r.customer],COLW[1]))*LH+PADH;
  const bigoLines=o.group.bigo.length?hOf(o.group.bigo,8.3):1;
  const bigoH=Math.max(0.6,bigoLines*LH+0.12);
  // 쪽 나누기
  const pages=[];let cur=[],y=TOP+HEADH;
  const rows=o.group.rows.map(r=>({r,h:rowH(r)}));
  rows.forEach((x,i)=>{
    const last=i===rows.length-1;
    const limit=(last?7.25-bigoH-0.08:7.05);
    if(cur.length&&y+x.h>limit){pages.push(cur);cur=[];y=TOP+HEADH}
    cur.push(x);y+=x.h;
  });
  if(cur.length||!pages.length)pages.push(cur);
  // 마지막 장에 비고가 들어갈 자리가 없으면 비고만 다음 장으로
  const lastH=pages[pages.length-1].reduce((a,x)=>a+x.h,TOP+HEADH);
  const bigoOwn=o.group.bigo.length&&lastH>7.25-bigoH-0.08;
  if(bigoOwn)pages.push([]);
  const cell=(t,opt)=>{const o2=Object.assign({fontFace:F,fontSize:10,color:"000000",valign:"middle",border:[B,B,B,B],margin:[0.03,0.05,0.03,0.05]},opt||{});if(o2.bold){o2.fontFace=FB;o2.bold=false}return {text:t,options:o2}};
  pages.forEach((pg,pi)=>{
    const s=pptx.addSlide();
    s.background={data:o.bg};
    s.addTable([o.depts.map(d=>cell(d,{align:"center",bold:o.team.replace(/팀$/,"")===d,fill:{color:o.team.replace(/팀$/,"")===d?"FFFFFF":"EDEDED"}}))],{x:0.628,y:0.523,w:8.745,colW:Array(10).fill(0.8745),rowH:[0.355]});
    s.addTable([
      [cell(`${o.year}년도 주간 업무 실적 및 계획`,{colspan:6,fill:{color:"FFFFFF"}})],
      [cell("작성부서",{bold:true,align:"center",fill:{color:GR}}),cell(o.team,{bold:true,fill:{color:"FFFFFF"}}),cell("작성일자",{bold:true,align:"center",fill:{color:GR}}),cell(o.date,{bold:true,fill:{color:"FFFFFF"}}),cell("작성자",{bold:true,align:"center",fill:{color:GR}}),cell(o.author,{bold:true,fill:{color:"FFFFFF"}})]
    ],{x:X,y:1.063,w:TW,colW:[1.083,2.333,1.341,1.341,1.341,1.341],rowH:[0.266,0.266]});
    if(pg.length||!(bigoOwn&&pi===pages.length-1)){
      const head=[cell("",{fill:{color:GR}}),cell("발주처",{bold:true,align:"center",fill:{color:GR}}),cell("사업명",{bold:true,align:"center",fill:{color:GR}}),cell(o.pastLabel,{bold:true,align:"center",fill:{color:GR}}),cell(o.planLabel,{bold:true,align:"center",fill:{color:GR}})];
      const body=pg.map(({r})=>[cell(String(r.no),{align:"center",fill:{color:"FFFFFF"}}),cell(r.customer,{fill:{color:"FFFFFF"}}),cell(r.project,{fill:{color:"FFFFFF"}}),cell(r.past.join("\n"),{fill:{color:"FFFFFF"}}),cell(r.plan.join("\n"),{fill:{color:"FFFFFF"}})]);
      s.addTable([head,...body],{x:X,y:TOP,w:TW,colW:COLW,rowH:[HEADH,...pg.map(()=>0.26)]});
    }
    if(pi===pages.length-1){
      const by=7.29-bigoH;
      s.addTable([[cell("비\n고",{align:"center",fill:{color:"FFFFFF"}}),cell(o.group.bigo.join("\n"),{fill:{color:"FFFFFF"},valign:"top"})]],{x:X,y:by,w:TW,colW:[0.33,8.451],rowH:[bigoH]});
    }
    s.addText(String(pi+1),{x:9.498,y:6.775,w:0.543,h:0.258,fontFace:F,fontSize:10,color:"FFFFFF",align:"center",valign:"middle"});
  });
  return pptx;
}
