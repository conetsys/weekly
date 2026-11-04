/* rhy:se Weekly Plan — 🧩 기능 더하기 (feat-mods.js)
   개인이 골라 켜는 기능 목록 · 켜고 끄기 · 팀장 '우리 팀에 추천' · 공지의 [[켜기:기능]] 단추
   core.js 다음에 읽힘. core는 F("함수 이름")로만 부르고, 이 파일이 고장 나면 이 기능만 꺼짐.
   맨 끝 wkFeat(...) 에 등록한 함수만 바깥(core)에서 씀 */
const MODS=[
  {k:"wait",icon:"📦",name:"입고·회신 대기",desc:"밖에서 와야 하는 것(견적서 · 제품)을 업무에 붙여 예정일을 챙겨요. 날짜가 다가오면 🔔 알림에서 알려 드려요.",who:"구매 · 발주 · 회신을 기다리는 일이 많은 분"},
  {k:"lite",icon:"📱",name:"휴대폰 간단 화면",desc:"휴대폰에서는 캘린더만 보여요. 일정 확인과 업무 추가만 가볍게. PC는 그대로예요.",who:"휴대폰으로 일정만 보는 분"}];
const modOn=k=>!!(st.me&&st.me.my_lists&&st.me.my_lists.mods&&st.me.my_lists.mods[k]);
async function setMod(k,on){
  const l=Object.assign({},st.me.my_lists||{});l.mods=Object.assign({},l.mods||{},{[k]:!!on});
  await api.setPrefs(null,l);st.me.my_lists=l;applyLists();render();paintNoticeDot();if(!$("modsModal").hidden)paintMods()}
function paintMods(){
  const lead=st.me&&st.me.role==="leader";
  const team=FS("peerModCard");
  $("modsList").innerHTML=(team?`<div class="modsec">👥 우리 팀 설정 <span>팀장만 · 팀 전체에 적용</span></div>${team}<div class="modsec">🙋 나에게만 <span>내 화면에만 적용</span></div>`:"")+MODS.map(m=>{const on=modOn(m.k);return `<div class="modc${on?" on":""}">
    <div class="modi">${m.icon}</div><div class="modb"><b>${esc(m.name)}</b><p>${esc(m.desc)}</p><span class="hint" style="margin:0">이런 분께: ${esc(m.who)}</span>
    ${lead?`<button type="button" class="btn sm ghost" data-modrec="${m.k}">👥 우리 팀에 추천</button>`:""}</div>
    <label class="modt"><span class="switch"><input type="checkbox" data-mod="${m.k}"${on?" checked":""}><i></i></span><span>${on?"켜짐":"꺼짐"}</span></label></div>`}).join("")}
function openMods(){paintMods();$("mscrim").hidden=false;$("modsModal").hidden=false;setTimeout(()=>$("modsClose").focus(),30)}
function closeMods(){$("modsModal").hidden=true;$("mscrim").hidden=true}
$("modsClose").onclick=closeMods;$("modsOk").onclick=closeMods;
$("modsList").addEventListener("change",async e=>{const k=e.target.dataset.mod;if(!k)return;   // 팀 설정 스위치(data-peer)는 feat-peer 가 처리const on=e.target.checked;e.target.disabled=true;
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
// 📖 사용법
wkGuideAdd("mods",{
  member:[{after:"m8",sec:["x-mods","기능 더하기",[
    ["p","모두에게 필요하지는 않은 기능은 필요한 사람만 골라 켭니다. 나에게만 적용되고, 꺼도 넣어 둔 기록은 지워지지 않습니다."],
    ["img","g12_mods","내정보 ▾ → 🧩 기능 더하기"],
    ["ol",["위쪽 **내정보 ▾**를 누르고 **🧩 기능 더하기**를 누릅니다.","쓰고 싶은 기능의 스위치를 켭니다. 바로 적용됩니다.","**닫기**를 누릅니다. 끄고 싶으면 같은 곳에서 스위치를 끕니다."]],
    ["ul",["팀장이 기능을 추천하면 📣 팀 공지로 안내가 오고, 공지 안의 **켜기** 단추 하나로 켤 수 있습니다.","지금 고를 수 있는 기능: 📦 입고·회신 대기, 📱 휴대폰 간단 화면 (팀장은 맨 위에 👥 우리 팀 설정도 보입니다)"]]]]}],
  leader:[{after:"l3b",sec:["x-mods-l","우리 팀에 기능 추천하기",[
    ["p","팀에 꼭 쓰면 좋을 기능이 있으면 팀원에게 추천합니다. 켜는 건 각자 합니다."],
    ["ol",["**내정보 ▾ → 🧩 기능 더하기**를 누릅니다.","추천할 기능 카드의 **👥 우리 팀에 추천**을 누르고, 한 번 더 누릅니다.","우리 팀 공지로 올라가고, 팀원이 접속하면 팝업으로 뜹니다. 팀원은 공지 안의 **켜기** 단추로 바로 켭니다."]]]]}],
  faq:[["기능 더하기에서 켠 기능은 팀원에게도 켜지나요?","아니요. 나에게만 켜집니다. 팀 전체가 쓰면 좋겠다면 팀장이 '우리 팀에 추천'을 하면 됩니다."]]});
wkFeat("mods",{modOn,setMod,openMods,modOnButton});
