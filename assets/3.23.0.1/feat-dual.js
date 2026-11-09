/* rhy:se Weekly Plan — 🔀 겸직 (feat-dual.js, v3.20.0)
   한 사람 = 주 소속 팀 + 겸직 팀 하나 (관리자가 지정). 계정 하나 · 주간 계획 하나
   · 겸직자: 업무 창에서 '어느 팀 일'을 고름 (고객사 · 대상사업으로 자동 추정) → 그 팀 팀장 화면에 잡힘
            내 화면에는 두 팀 업무가 함께, 다른 팀 업무엔 🔀 꼬리표
   · 팀장 · 조직장: 우리 팀 겸직자 줄 + '다른 팀 업무 n건' (내용은 안 보임)
   서버: 16-dual-team.sql. 이 파일이 고장 나면 새 업무는 지금 보는 팀(내 팀)으로 저장 */
const DU={pick:null,auto:true,counts:{},cKey:"",busy:false};
const duOn=()=>!!(st.me&&st.me.extra_team&&st.me.extra_team!==st.me.team_id);
const duShort=t=>String(teamName(t)||"").replace(/팀$/,"");
const duOther=()=>myTeams().find(t=>t!==(isMyTeam(st.team)?st.team:st.me.team_id));
// 🔀 꼬리표: 지금 보는 팀이 아닌 팀의 업무
function dualTag(it){if(!it||!it._team||it._team===st.team||!st.me)return "";
  return `<span class="dutag" title="${esc(teamName(it._team))} 업무예요. 그 팀 팀장 화면에 보여요">🔀 ${esc(duShort(it._team))}</span>`}
function dualChip(it){if(!it||!it._team||it._team===st.team||!st.me)return "";
  return `<div class="shchip du" title="${esc(teamName(it._team))} 팀장 화면에 보이는 업무예요">🔀 ${esc(teamName(it._team))} 업무</div>`}
// 이 팀의 겸직자 (이 팀이 겸직 팀이거나, 이 팀 사람이 다른 팀을 겸직)
const duPeople=()=>(st.people||[]).filter(p=>p.active&&(p._dual||(p.extra_team&&p.extra_team!==p.team_id)));
async function duCounts(){if(!api.dualCounts||!isBoss())return;const k=st.team+"|"+st.week;if(DU.cKey===k||DU.busy)return;
  DU.busy=true;try{const r=await api.dualCounts(st.team,st.week);DU.counts={};(r||[]).forEach(x=>{DU.counts[x.email]=(DU.counts[x.email]||0)+(+x.n||0)});DU.cKey=k}catch(_){DU.counts={};DU.cKey=k}
  finally{DU.busy=false}dualPaint()}
function dualPaint(){
  let box=$("dualNote");
  if(!box){const oc=$("ownerChips");if(!oc)return;box=document.createElement("div");box.id="dualNote";box.className="dunote";box.hidden=true;oc.insertAdjacentElement("afterend",box)}
  const L=[];
  if(duOn()&&isMyTeam(st.team)){const o=duOther();
    L.push(`<span class="dul"><b>🔀 겸직</b> ${esc(teamName(st.me.team_id))} + ${esc(teamName(st.me.extra_team))} · 내 업무는 두 팀 것이 함께 보이고, <b>${esc(duShort(o))}</b> 일엔 🔀 꼬리표가 붙어요</span>`)}
  if(isBoss()){const ps=duPeople().filter(p=>p.email!==st.me.email);
    if(ps.length){duCounts();
      L.push(`<span class="dul"><b>🔀 겸직</b> ${ps.map(p=>{const other=p._dual||p.extra_team,n=DU.counts[p.email];
        return `${esc(p.name)} <span class="dim">(${p._dual?"주 소속 ":"겸직 "}${esc(teamName(other))}${DU.cKey===st.team+"|"+st.week?` · 그 팀 업무 ${n||0}건`:""})</span>`}).join(" · ")}</span>`)}}
  box.innerHTML=L.join("");box.hidden=!L.length||st.view!=="write"&&st.view!=="review";return true}
// 업무 창: 어느 팀 일
function duGuess(){const pj=$("f-project").value.trim(),cu=$("f-customer").value;
  const vote=f=>{const m={};st.items.filter(i=>isMine(i)&&!i.co&&i._team&&f(i)).forEach(i=>{m[i._team]=(m[i._team]||0)+1});const b=Object.entries(m).sort((a,b)=>b[1]-a[1])[0];return b?b[0]:null};
  let t=(pj&&vote(i=>i.project===pj))||(cu&&cu!=="__new"&&cu!=="내부"&&vote(i=>i.customer===cu));
  if(!t){const inL=(id,k,v)=>{const tm=st.teams.find(x=>x.id===id);return !!(v&&tm&&tm.lists&&Array.isArray(tm.lists[k])&&tm.lists[k].includes(v))};
    const hit=myTeams().filter(id=>inL(id,"projects",pj)||inL(id,"customers",cu));if(hit.length===1)t=hit[0]}
  return t&&isMyTeam(t)?t:null}
function duRowPaint(){const r=$("duRow");if(!r)return;
  r.querySelector(".duchips").innerHTML=myTeams().map(t=>`<button type="button" class="chip" data-duteam="${esc(t)}" aria-pressed="${t===DU.pick}">${esc(teamName(t))}${t===st.me.team_id?' <span class="hint" style="margin:0;font-size:11px">주 소속</span>':""}</button>`).join("");
  r.querySelector(".duhint").textContent=`${teamName(DU.pick)} 팀장 화면 · 보고서에 보여요${DU.auto&&st.editing==="__new"?" (고객사 · 대상사업으로 골랐어요)":""}`}
function dualEditOpen(it,ro){let r=$("duRow");
  if(!duOn()||ro||(it&&it.co)){if(r)r.hidden=true;DU.pick=null;return true}
  if(!r){const fs=$("f-owner")&&$("f-owner").closest("fieldset");if(!fs)return;
    r=document.createElement("div");r.className="f full durow";r.id="duRow";
    r.innerHTML=`<span class="dulb">어느 팀 일 <i>*</i></span><div class="chips duchips" role="group" aria-label="어느 팀 일"></div><span class="hint duhint" style="margin:0"></span>`;
    fs.insertAdjacentElement("afterbegin",r)}
  r.hidden=false;DU.auto=!it;DU.pick=it&&it._team&&isMyTeam(it._team)?it._team:(isMyTeam(st.team)?st.team:st.me.team_id);
  duRowPaint();return true}
function dualPick(id){if(!duOn()||!DU.pick||$("drawer").hidden)return null;return st.editing==="__new"||st.editing===id?DU.pick:null}
document.addEventListener("click",e=>{const b=e.target.closest("#duRow [data-duteam]");if(!b)return;DU.pick=b.dataset.duteam;DU.auto=false;duRowPaint()});
["f-project","f-customer"].forEach(id=>{const el=$(id);if(el)el.addEventListener("change",()=>{if(!duOn()||!DU.auto||st.editing!=="__new"||$("duRow")&&$("duRow").hidden)return;const g=duGuess();if(g&&g!==DU.pick){DU.pick=g;duRowPaint()}})});
wkFeat("dual",{dualTag,dualChip,dualPaint,dualEditOpen,dualPick});
