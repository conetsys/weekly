/* rhy:se Weekly Plan — ↺ 지난 업무 가져오기 (feat-pull.js)
   업무 창 '지난 업무에서 가져오기' · '이 정보로 새 업무' · 요약 창 단추. 고객사·대상사업·품목만 채우고 협력사·구분은 직접 고르게 (저장 확인은 core의 st.pulled)
   core.js 다음에 읽힘. core는 F("함수 이름")로만 부르고, 이 파일이 고장 나면 이 기능만 꺼짐.
   맨 끝 wkFeat(...) 에 등록한 함수만 바깥(core)에서 씀 */
/* ---------- 지난 업무에서 가져오기 (v3.12.0, 내 업무만)
   고객사 · 대상사업 · 품목으로 묶고, 그 세 가지만 채움. 협력사·구분은 이번 일에 맞게 직접 고르게 (필수) */
const PULL_STEP=8;let pullShow=PULL_STEP;
function pullCands(q){
  const m=new Map();
  st.items.filter(isMine).forEach(it=>{
    const ks=Object.keys(it.weeks||{}).sort(),lk=ks[ks.length-1]||"",le=lk?it.weeks[lk]:null;
    const key=[it.customer,it.project,it.part].map(x=>String(x||"").trim().toLowerCase()).join("|");
    const c=m.get(key)||{it,lk:"",n:0,tasks:[],open:false};c.n++;
    (Object.values(it.weeks||{})).forEach(e=>{if(e&&e.task)c.tasks.push(e.task)});
    if(le&&le.status!=="완료")c.open=true;
    if(lk>c.lk){c.it=it;c.lk=lk;c.task=le&&le.task||""}
    m.set(key,c);
  });
  const words=String(q||"").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const all=[...m.values()];
  const hit=all.filter(c=>{if(!words.length)return true;const h=[c.it.customer,c.it.project,c.it.part,c.it.po,c.it.vendor,...c.tasks].join(" ").toLowerCase();return words.every(w=>h.includes(w))})
    .sort((a,b)=>(b.open-a.open)||b.lk.localeCompare(a.lk));
  hit.total=all.length;return hit;
}
function paintPull(more){
  if(!more)pullShow=PULL_STEP;
  const L=pullCands($("pullQ").value),q=$("pullQ").value.trim(),show=L.slice(0,pullShow);
  $("pullCnt").textContent=q?`${L.total}개 중 ${L.length}개`:`${L.total}개`;
  const md=k=>{const d=parseKey(k);return (d.getMonth()+1)+"/"+d.getDate()};
  $("pullList").innerHTML=(show.length?show.map(c=>{const it=c.it;return `<button type="button" class="pullit" role="option" data-pull="${esc(it._id)}" title="${esc(c.task||"")}">
    <span class="pl1"><span class="pc">${esc(it.customer||"—")}</span><span class="ps">·</span><b>${esc(it.project||"(대상사업 없음)")}</b>${it.part?`<span class="ps">·</span><span class="pp">${esc(it.part)}</span>`:""}</span>
    <span class="pr">${c.open?'<i class="pon">진행 중</i>':""}${c.lk?`<span class="pwk">${md(c.lk)}</span>`:""}</span></button>`}).join("")
    :`<div class="pullnone">찾는 업무가 없어요. 다른 말로 찾아보세요.</div>`)
    +(L.length>show.length?`<button type="button" class="pullmore" id="pullMore">더 보기 (${L.length-show.length}개 더)</button>`:"");
}
function pullMark(on){
  $("vReq").hidden=!on;$("pullNote").hidden=!on;
  ["f-vendor","f-cat"].forEach(i=>$(i).classList.toggle("needpick",!!on&&!$(i).value));
}
function applyCommon(src){
  const sel=$("f-customer"),cu=src.customer||"";
  if(cu&&![...sel.options].some(o=>o.value===cu)){const o=document.createElement("option");o.value=cu;o.textContent=cu;sel.insertBefore(o,sel.querySelector('option[value="__new"]'))}
  if(cu)sel.value=cu;$("f-customer-new").hidden=true;
  $("f-project").value=src.project||"";$("f-part").value=src.part||"";$("f-po").value="";
  fillVendor("");fillCat("");st.pulled=true;pullMark(true);
  ["f-customer","f-project","f-part"].forEach(i=>{const el=$(i);if(el&&el.animate)el.animate([{boxShadow:"0 0 0 3px color-mix(in srgb,var(--accent) 45%,transparent)",backgroundColor:"var(--accent-soft)"},{boxShadow:"0 0 0 0 transparent"}],{duration:900,easing:"ease-out"})});
}
const PULL_MSG="고객사 · 대상사업 · 품목을 가져왔어요. 협력사와 구분을 골라 주세요";
$("pullBtn").onclick=()=>{const b=$("pullBox"),open=b.hidden;b.hidden=!open;$("pullBtn").setAttribute("aria-expanded",open);if(open){$("pullQ").value="";paintPull();setTimeout(()=>$("pullQ").focus(),30)}};
$("pullQ").oninput=()=>paintPull();
$("pullQ").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();const f=$("pullList").querySelector("[data-pull]");if(f)f.click()}if(e.key==="Escape"){e.stopPropagation();$("pullBox").hidden=true;$("pullBtn").setAttribute("aria-expanded","false");$("pullBtn").focus()}};
$("pullList").onclick=e=>{
  if(e.target.closest("#pullMore")){pullShow+=PULL_STEP*2;paintPull(true);return}
  const b=e.target.closest("[data-pull]");if(!b)return;const it=st.items.find(i=>i._id===b.dataset.pull);if(!it)return;
  applyCommon(it);$("pullBox").hidden=true;$("pullBtn").setAttribute("aria-expanded","false");
  toast(PULL_MSG);setTimeout(()=>$("f-vendor").focus(),60)};
function cloneFrom(it){
  openDrawer(null,st.me.name);applyCommon(it);$("dTitle").textContent=`${st.me.name} · 새 업무 (${it.project||"업무"}에서 가져옴)`;
  wkIn($("form"),1);toast(PULL_MSG);setTimeout(()=>$("f-vendor").focus(),80)}
$("cloneBtn").onclick=()=>{const it=st.items.find(i=>i._id===st.editing);if(it)cloneFrom(it)};
document.addEventListener("click",e=>{const b=e.target.closest("[data-sumclone]");if(!b)return;const it=st.items.find(i=>i._id===st.sumFor);if(!it)return;$("sumDrawer").hidden=true;st.sumFor=null;cloneFrom(it)});
["f-vendor","f-cat"].forEach(i=>$(i).addEventListener("change",()=>{if(st.pulled)pullMark(true)}));
// 업무 창을 열 때 (core openDrawer 에서 부름)
function pullDrawerOpen(it,ro){
  $("pullBtn").hidden=!!it||!canAddHere()||!pullCands("").length;$("pullBox").hidden=true;$("pullBtn").setAttribute("aria-expanded","false");$("pullQ").value="";
  $("cloneBtn").hidden=!it||ro||!canAddHere();st.pulled=false;pullMark(false);return true}
// 📖 사용법 (이 기능을 고치면 여기도 같이 고치기)
wkGuideAdd("pull",{
  member:[{after:"m3",sec:["x-pull","지난 업무에서 가져오기",[
    ["p","같은 사업의 다음 일을 쓸 때 고객사 · 대상사업 · 품목을 다시 칠 필요가 없습니다."],
    ["img","g11_pull","업무 추가 창 — 지난 업무에서 가져오기"],
    ["ol",["**+ 업무 추가**를 누르고, 공통 정보 오른쪽 위 **↺ 지난 업무에서 가져오기**를 누릅니다.","목록에서 사업을 고릅니다. 고객사 · 대상사업 · 품목으로 묶여 있고, 진행 중인 사업이 먼저 나옵니다. 검색칸에 사업 · 품목 · 지난 할일을 써서 찾을 수도 있습니다."]],
    ["img","g11b_pull","가져온 뒤 — 협력사 · 구분 고르고 저장"],
    ["ol",["노랗게 표시된 **협력사**와 **구분**을 이번 일에 맞게 고릅니다. 외주가 없으면 '협력사 없음'을 고릅니다. 고르지 않으면 저장되지 않습니다.","할일과 일정을 쓰고 **저장**합니다."],3],
    ["ul",["보던 업무에서 바로 이어 쓰려면 업무 요약 창의 회색 상자 오른쪽 위, 또는 업무 수정 창의 공통 정보 오른쪽 위 **↺ 이 정보로 새 업무**를 누릅니다.","관리번호는 발주마다 달라질 수 있어 비워 둡니다. 필요하면 새로 씁니다.","목록에는 내 업무만 나옵니다."]]]]}],
  faq:[["지난 업무에서 가져오면 협력사는 왜 비어 있나요?","같은 사업이라도 이번엔 외주처가 다를 수 있어서, 매번 직접 고르게 했습니다. 외주가 없으면 '협력사 없음'을 고르세요."]]});
wkFeat("pull",{pullDrawerOpen,pullCands});
