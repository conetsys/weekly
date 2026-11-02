/* rhy:se Weekly Plan — 🧩 기능 더하기 (feat-mods.js)
   개인이 골라 켜는 기능 목록 · 켜고 끄기 · 팀장 '우리 팀에 추천' · 공지의 [[켜기:기능]] 단추
   core.js 다음에 읽힘. core는 F("함수 이름")로만 부르고, 이 파일이 고장 나면 이 기능만 꺼짐.
   맨 끝 wkFeat(...) 에 등록한 함수만 바깥(core)에서 씀 */
const MODS=[
  {k:"wait",icon:"📦",name:"입고·회신 대기",desc:"견적서 · 제품처럼 밖에서 와야 하는 것을 업무에 붙여 예정일을 관리해요. 예정일 한 달 전 · 보름 전에 한 번, 일주일 전부터는 매일 📣 팀 공지에서 알려 드려요.",who:"구매 · 발주 · 협력사 회신을 기다리는 일이 많은 분"},
  {k:"lite",icon:"📱",name:"휴대폰 간단 화면",desc:"휴대폰에서는 캘린더 하나만 보여요. 검색 · 필터 · 보기 바꾸기 · 상태 숫자를 숨기고 일정 확인과 업무 추가만 가볍게 해요. PC는 그대로예요.",who:"휴대폰으로 일정만 빠르게 보는 분"}];
const modOn=k=>!!(st.me&&st.me.my_lists&&st.me.my_lists.mods&&st.me.my_lists.mods[k]);
async function setMod(k,on){
  const l=Object.assign({},st.me.my_lists||{});l.mods=Object.assign({},l.mods||{},{[k]:!!on});
  await api.setPrefs(null,l);st.me.my_lists=l;applyLists();render();paintNoticeDot();if(!$("modsModal").hidden)paintMods()}
function paintMods(){
  const lead=st.me&&st.me.role==="leader";
  $("modsList").innerHTML=MODS.map(m=>{const on=modOn(m.k);return `<div class="modc${on?" on":""}">
    <div class="modi">${m.icon}</div><div class="modb"><b>${esc(m.name)}</b><p>${esc(m.desc)}</p><span class="hint" style="margin:0">이런 분께: ${esc(m.who)}</span>
    ${lead?`<button type="button" class="btn sm ghost" data-modrec="${m.k}">👥 우리 팀에 추천</button>`:""}</div>
    <label class="modt"><span class="switch"><input type="checkbox" data-mod="${m.k}"${on?" checked":""}><i></i></span><span>${on?"켜짐":"꺼짐"}</span></label></div>`}).join("")}
function openMods(){paintMods();$("mscrim").hidden=false;$("modsModal").hidden=false;setTimeout(()=>$("modsClose").focus(),30)}
function closeMods(){$("modsModal").hidden=true;$("mscrim").hidden=true}
$("modsClose").onclick=closeMods;$("modsOk").onclick=closeMods;
$("modsList").addEventListener("change",async e=>{const k=e.target.dataset.mod;if(!k)return;const on=e.target.checked;e.target.disabled=true;
  try{await setMod(k,on);const m=MODS.find(x=>x.k===k);toast(`${m.icon} ${m.name}을(를) ${on?"켰어요":"껐어요"}`)}catch(x){e.target.checked=!on;toast(errText(x))}finally{e.target.disabled=false}});
// 👥 우리 팀에 추천: 팀 공지로 올리고, 공지 안의 [[켜기:기능]] 단추로 팀원이 바로 켬
$("modsList").addEventListener("click",async e=>{const b=e.target.closest("[data-modrec]");if(!b)return;const m=MODS.find(x=>x.k===b.dataset.modrec);if(!m)return;
  if(!confirmTwice(b,"한 번 더 누르면 팀 공지로 올라가요"))return;
  b.disabled=true;
  try{await api.saveNotice({id:"rec-"+m.k+"-"+Date.now().toString(36),scope:myTeamScope(),title:`${m.icon} ${m.name}, 써 보세요`,body:`${st.me.name} 팀장님이 추천한 기능입니다.\n\n${m.desc}\n\n[[켜기:${m.k}]]\n\n나중에 끄려면 내정보 ▾ → 🧩 기능 더하기에서 끌 수 있습니다.`,popup:true,pinned:false,active:true,author_email:st.me.email},true);
    await loadNotice();toast("팀 공지로 추천했어요. 팀원이 접속하면 보여요");b.textContent="✓ 추천함"}
  catch(x){b.disabled=false;toast(errText(x))}});
function confirmTwice(b,msg){if(b.dataset.arm==="1"){b.dataset.arm="";return true}b.dataset.arm="1";const t=b.textContent;b.textContent=msg;setTimeout(()=>{if(b.dataset.arm==="1"){b.dataset.arm="";b.textContent=t}},3500);return false}
document.addEventListener("click",async e=>{const b=e.target.closest("[data-modon]");if(!b)return;e.preventDefault();const k=b.dataset.modon,m=MODS.find(x=>x.k===k);if(!m||!st.me)return;
  if(modOn(k)){toast(`${m.icon} ${m.name}은(는) 이미 켜져 있어요`);return}
  b.disabled=true;try{await setMod(k,true);b.textContent=`✓ ${m.name} 켜짐`;toast(`${m.icon} ${m.name}을(를) 켰어요`)}catch(x){b.disabled=false;toast(errText(x))}});

function modOnButton(k){const x=MODS.find(y=>y.k===k);return x?`<button type="button" class="nguide" data-modon="${k}">${x.icon} ${x.name} 켜기</button>`:""}
wkFeat("mods",{modOn,setMod,openMods,modOnButton});
