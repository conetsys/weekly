/* rhy:se Weekly Plan — 📐🤝 사업관리 팀 함께 쓰기 (feat-pmco.js, v3.33.0 · 11/19 결정)
   · 사업 = 주관 팀 하나 + 참여 팀 여럿. 참여는 팀 단위 '제안'(요청 내용 필수: 맡을 대공정 · 범위 · 기간) → 참여 팀장이 수락해야 들어감
   · 참여 팀장: 수락 / 범위 조정 요청(사유) / 거절(사유) · 수락 뒤 빠지기(사유). 주관 쪽(책임자 · 주관 팀장 · 상급자): 다시 제안 · 거두기
   · 협의 기록은 지우지 않고 시간순으로 — 두 팀 사람 + 상급자 + 대표가 봄. 건수 · 순위 같은 집계는 만들지 않음 (핑퐁은 나쁜 게 아님, 다만 보이게)
   · 참여 팀원: 사업 보기 + 하부 공정 넣기(담당 = 나) + 본인 담당 줄 고치기 (권한 판단은 feat-proj 의 pjPt · pjRowEd, 서버는 28-proj-cowork.sql)
   · feat-proj 다음에 읽힘 (PJ · pjProj 와, 사업관리를 연 뒤엔 pm.js 의 pjModal … 을 그대로 씀). feat-proj 는 F("pmco…")로만 부르고, 이 파일이 고장 나면 협의 화면만 꺼짐 */
const PC_ST={pending:["답 기다리는 중","warn"],adjust:["범위 조정 요청","warn"],accepted:["함께함","ok"],rejected:["거절","bad"],left:["빠짐",""],cancelled:["거둠",""]};
const PC_K={propose:"📨 제안",repropose:"📨 다시 제안",comment:"💬 의견",adjust:"↩ 범위 조정 요청",accept:"✅ 수락",reject:"✋ 거절",leave:"🚪 빠지기",cancel:"↩ 제안 거둠"};
const pcAll=()=>PJ.links||[];
const pcLink=(pid,team)=>pcAll().find(l=>l.project_id===pid&&l.team_id===team);
const pcTalk=(pid,team)=>(PJ.talk||[]).filter(t=>t.project_id===pid&&t.team_id===team).sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));
const pcLead=l=>!!(st.me&&st.me.role==="leader"&&st.me.team_id===l.team_id);
const pcHost=l=>{const p=pjProj(l.project_id);return !!p&&p.team_id===l.host_team&&!isMyTeam(l.team_id)&&pjCanInfo(p)};
const pcDays=l=>Math.floor((Date.now()-new Date(l.updated_at||l.created_at).getTime())/864e5);
const pcName=l=>{const p=pjProj(l.project_id);return (p&&p.data.name)||l.proj_name||"(사업)"};
const pcTag=l=>{const s=PC_ST[l.status]||[l.status,""];return `<span class="pj-tag ${s[1]}">${esc(s[0])}</span>`};
const pcWhoTeam=e=>{const x=PJ.dir.find(d=>d.email===e);return x?x.team_name||teamName(x.team_id):""};
function pmcoPartner(p){return !!p&&pcAll().some(l=>l.project_id===p.id&&l.status==="accepted"&&isMyTeam(l.team_id))}

/* ---------- 목록 · 사업 화면에 붙는 것 ---------- */
function pmcoTag(p){if(!p)return "";if(p.team_id!==PJ.team)return ` <span class="pj-tag co">🤝 ${esc(teamName(p.team_id))} 주관</span>`;
  const L=pcAll().filter(l=>l.project_id===p.id),a=L.filter(l=>l.status==="accepted").length,w=L.filter(l=>l.status==="pending"||l.status==="adjust").length;
  return (a?` <span class="pj-tag co2">🤝 ${a}팀 참여</span>`:"")+(w?` <span class="pj-tag warn">협의 중 ${w}</span>`:"")}
function pmcoBand(p){if(!p)return "";const host=p.team_id===PJ.team||!pmcoPartner(p),L=pcAll().filter(l=>l.project_id===p.id&&(host||isMyTeam(l.team_id))),can=host&&pjCanInfo(p);
  if(!L.length&&!can)return "";
  const chip=l=>`<button type="button" class="co-chip" data-cotalk="${esc(l.project_id)}|${esc(l.team_id)}"><b>${esc(teamName(l.team_id))}</b>${pcTag(l)}${(l.status==="pending"||l.status==="adjust")&&pcDays(l)>=3?`<span class="co-age">${pcDays(l)}일째</span>`:""}</button>`;
  return `<div class="co-band"><span class="co-bt">🤝 ${host?"참여 협의":`${esc(teamName(p.team_id))} 주관 · 우리 팀 참여`}</span>${L.map(chip).join("")}${can?`<button type="button" class="btn sm" data-copropose="${esc(p.id)}">+ 참여 팀 제안</button>`:""}${!L.length?`<span class="dim">다른 팀과 함께하는 사업이면 참여 팀을 제안해요</span>`:""}</div>`}
function pmcoNewHint(){return `<p class="co-hint">🤝 다른 팀과 함께하는 사업이면, 만든 뒤 사업 화면의 <b>+ 참여 팀 제안</b>으로 팀을 골라요. 그 전에 <b>참여 팀이 맡을 대공정 · 범위 · 기간</b>을 공정에 먼저 적어 주세요. 참여 팀원은 그 대공정 아래에 자기 업무만 넣을 수 있어요.</p>`}
const pcInbox=()=>pcAll().filter(l=>l.team_id===PJ.team&&(l.status==="pending"||l.status==="adjust"));
function pmcoListBar(){const n=pcInbox().filter(l=>l.status==="pending").length;return n?`<button type="button" class="co-bar" data-pjv="co"><b>🤝 받은 참여 제안 ${n}건</b><span>다른 팀이 우리 팀과 함께하자고 했어요 · ${pcLead({team_id:PJ.team})?"수락 · 조정 · 거절을 골라 주세요":"팀장이 답해요. 협의 내용은 누구나 볼 수 있어요"}</span><i aria-hidden="true">›</i></button>`:""}
function pmcoTab(){if(!PJ.team)return [];const n=pcInbox().filter(l=>l.status==="pending").length;return [["co","🤝 Co-work"+(n?` ${n}`:"")]]}

/* ---------- 🤝 Co-work 탭 ---------- */
function pcCard(l,mode){const p=pjProj(l.project_id),T=pcTalk(l.project_id,l.team_id),last=T[T.length-1],wait=(l.status==="pending"||l.status==="adjust")&&pcDays(l)>=3;
  return `<div class="co-card${wait?" wait":""}"><div class="co-ch"><b>${esc(pcName(l))}</b>${pcTag(l)}${wait?`<span class="co-age">${pcDays(l)}일째 ${l.status==="pending"?"답을 기다려요":"다시 제안을 기다려요"}</span>`:""}</div>
    <div class="co-cm dim">${mode==="out"?`→ ${esc(teamName(l.team_id))}`:`${esc(teamName(l.host_team))} 주관`} · ${esc(fmtDT(l.updated_at||l.created_at).slice(5,10))}${last?` · 마지막: ${esc(PC_K[last.kind]||"")} ${esc(last.author_name||"")}`:""}</div>
    ${l.scope?`<div class="co-cs"><span>요청 내용</span>${esc(l.scope)}</div>`:""}
    <div class="co-ca"><button type="button" class="btn sm${mode==="in"&&l.status==="pending"&&pcLead(l)?" primary":""}" data-cotalk="${esc(l.project_id)}|${esc(l.team_id)}">💬 협의 보기${T.length?` <span class="dim">${T.length}</span>`:""}</button>${p&&(l.status==="accepted"||mode==="out")?`<button type="button" class="btn sm ghost" data-pjopen="${esc(l.project_id)}">사업 열기</button>`:""}</div></div>`}
function pmcoHtml(){if(!PJ.team)return "";if(PJ.coAfter&&PJ.loaded){const k=PJ.coAfter;PJ.coAfter=null;setTimeout(()=>pcOpen(...k.split("|")),60)}
  const A=pcAll(),inb=A.filter(l=>l.team_id===PJ.team&&(l.status==="pending"||l.status==="adjust")),tog=A.filter(l=>l.team_id===PJ.team&&l.status==="accepted"),
    out=A.filter(l=>l.host_team===PJ.team&&l.team_id!==PJ.team&&!["cancelled"].includes(l.status)),old=A.filter(l=>l.team_id===PJ.team&&["rejected","left","cancelled"].includes(l.status));
  const sec=(t,sub,L,mode,empty)=>`<section class="co-sec"><h3>${t} <span class="dim">${L.length}</span></h3>${sub?`<p class="hint" style="margin:-2px 0 8px">${sub}</p>`:""}${L.length?`<div class="co-grid">${L.map(l=>pcCard(l,mode)).join("")}</div>`:`<p class="dim co-empty">${empty}</p>`}</section>`;
  return `<div class="co-page"><p class="co-lead">🤝 <b>${esc(teamName(PJ.team))}</b>이(가) 다른 팀과 함께하는 사업이에요. 참여는 팀 단위로 제안하고, 참여 팀장이 수락해야 들어가요. 오간 협의는 두 팀과 그 위 상급자 · 대표가 함께 봐요.</p>
    ${sec("📥 받은 제안",pcLead({team_id:PJ.team})?"수락 · 범위 조정 요청 · 거절은 팀장이 해요. 팀원도 협의에 의견을 남길 수 있어요.":"팀장이 답해요. 협의 내용은 누구나 보고 의견을 남길 수 있어요.",inb,"in","받은 제안이 없어요")}
    ${sec("🤝 함께하는 사업",tog.length?"사업 목록에도 '주관' 꼬리표와 함께 보여요. 맡은 대공정 아래에 + 하부 공정으로 내 업무를 넣어요.":"",tog,"in","아직 함께하는 다른 팀 사업이 없어요")}
    ${sec("📤 보낸 제안","우리 팀 사업에 다른 팀을 제안한 것이에요. 사업 화면 위 '🤝 참여 협의'에서 새로 제안할 수 있어요.",out,"out","보낸 제안이 없어요")}
    ${old.length?`<details class="co-old"><summary>지난 협의 ${old.length}건 (거절 · 빠짐 · 거둠)</summary><div class="co-grid">${old.map(l=>pcCard(l,"in")).join("")}</div></details>`:""}</div>`}

/* ---------- 협의 창 ---------- */
function pcOpen(pid,team){const l=pcLink(pid,team);if(!l){toast("협의를 찾지 못했어요. 새로 고침 해 주세요");return}pjSeenSet("co|"+pid+"|"+team);PJ.pcCur=pid+"|"+team;
  const T=pcTalk(pid,team),lead=pcLead(l),host=pcHost(l),stt=l.status,re=host&&stt!=="accepted";
  const li=t=>`<li class="co-li k-${esc(t.kind)}"><div class="co-lh"><span class="co-k">${esc(PC_K[t.kind]||t.kind)}</span><b>${esc(t.author_name||t.author_email)}</b><span class="dim">${esc(pcWhoTeam(t.author_email))} · ${esc(fmtDT(t.created_at).slice(2))}</span></div>${t.scope?`<div class="co-sc"><span>요청 내용</span>${esc(t.scope)}</div>`:""}${t.body?`<div class="co-bd">${esc(t.body)}</div>`:""}</li>`;
  const btn=(k,l2,cls)=>`<button type="button" class="btn sm ${cls||""}" data-coact="${k}">${l2}</button>`;
  pjModal(`<div class="pj-mh"><b>🤝 참여 협의</b><span class="dim">${esc(pcName(l))} · ${esc(teamName(l.host_team))} → ${esc(teamName(team))}</span><span class="spacer"></span>${pcTag(l)}<button type="button" class="pj-x on" data-pjmclose="1" aria-label="닫기">✕</button></div>
    <div class="pj-mb co-mb"><ol class="co-tl">${T.map(li).join("")||'<li class="dim">아직 기록이 없어요</li>'}</ol>
      <p class="hint co-pub">🔎 이 협의는 두 팀 사람과 그 위 상급자 · 대표가 함께 봐요. 지우지 않고 남아요.</p></div>
    <div class="pj-mft co-ft">${re?`<label class="co-lab">요청 내용 (맡을 대공정 · 범위 · 기간) — 고쳐서 다시 제안할 수 있어요<textarea id="pcScope" rows="2" maxlength="2000">${esc(l.scope||"")}</textarea></label>`:""}
      <label class="co-lab">${lead&&(stt==="pending"||stt==="accepted")?"의견 · 사유 (범위 조정 요청 · 거절 · 빠지기는 사유가 필요해요)":"의견"}<textarea id="pcBody" rows="2" maxlength="2000" placeholder="${lead&&stt==="pending"?"예: 배선 설계는 맡을게요. 하네스 제작은 구매팀과 먼저 이야기해 주세요":"생각을 남겨요. 모두에게 보여요"}"></textarea></label>
      <div class="co-btns">${btn("comment","💬 의견 남기기")}<span class="spacer"></span>
        ${lead&&stt==="pending"?btn("reject","✋ 거절","ghost")+btn("adjust","↩ 범위 조정 요청")+btn("accept","✅ 수락","primary"):""}
        ${lead&&stt==="accepted"?btn("leave","🚪 빠지기","ghost"):""}
        ${host&&(stt==="pending"||stt==="adjust")?btn("cancel","제안 거두기","ghost"):""}
        ${re?btn("repropose",stt==="pending"?"요청 내용 고쳐 보내기":"📨 다시 제안","primary"):""}</div>
      <p class="err" id="pcErr" hidden></p></div>`,"co");
  setTimeout(()=>{const b=document.querySelector("#pjMbox .co-mb");if(b)b.scrollTop=b.scrollHeight},20)}
function pcPropose(pid){const p=pjProj(pid);if(!p||!pjCanInfo(p))return;PJ.pcCur=null;
  const busy=new Set(pcAll().filter(l=>l.project_id===pid&&["pending","adjust","accepted"].includes(l.status)).map(l=>l.team_id));
  const T=(st.teams||[]).filter(t=>t.id!==p.team_id&&!busy.has(t.id)).sort((a,b)=>(+a.sort||0)-(+b.sort||0));
  const ph=(p.data.phases||[]).map(x=>x.name).filter(Boolean);
  pjModal(`<div class="pj-mh"><b>🤝 참여 팀 제안</b><span class="dim">${esc(p.data.name)} · 주관 ${esc(teamName(p.team_id))}</span><span class="spacer"></span><button type="button" class="pj-x on" data-pjmclose="1" aria-label="닫기">✕</button></div>
    <div class="pj-mb co-new"><div class="co-inf"><b>📝 보내기 전에</b><ul><li>참여 팀이 <b>맡을 대공정 · 범위 · 기간</b>을 구체적으로 적어 주세요. 참여 팀원은 그 아래에 자기 업무만 넣을 수 있어요.</li><li>필요하면 먼저 공정에 그 팀 몫의 대공정을 만들어 두세요.</li><li>참여 팀장이 <b>수락</b>해야 들어가요. 범위 조정을 요청받으면 고쳐서 다시 보낼 수 있어요.</li></ul></div>
      <label class="co-lab">참여 팀<select id="pcTeam"><option value="">팀 고르기</option>${T.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("")}</select></label>
      <label class="co-lab">요청 내용 * <small class="dim">맡을 대공정 · 범위 · 기간</small><textarea id="pcScope" rows="3" maxlength="2000" placeholder="${esc(ph[2]?`예: '${ph[2]}' 대공정 중 전장 설계 · 배선도 작성, 12월 말까지`:"예: 전장 대공정 · 배선 설계와 배선도 작성, 12월 말까지")}"></textarea></label>
      <label class="co-lab">덧붙이는 말 <small class="dim">선택</small><textarea id="pcBody" rows="2" maxlength="2000" placeholder="예: 지난 회의에서 이야기한 대로 부탁드립니다"></textarea></label>
      <p class="err" id="pcErr" hidden></p></div>
    <div class="pj-mft"><span class="spacer"></span><button type="button" class="btn" data-pjmclose="1">취소</button><button type="button" class="btn primary" data-cosend="${esc(pid)}">제안 보내기</button></div>`,"co");
  setTimeout(()=>{const s=$("pcTeam");if(s)s.focus()},30)}
const pcErr=m=>{const e=$("pcErr");if(e){e.textContent=m;e.hidden=!m}else if(m)toast(m)};
async function pcDo(pid,team,kind,body,scope,btn){if(btn)btn.disabled=true;pcErr("");
  try{await api.projCo(pid,team,kind,body,scope);
    const msg={propose:`📨 ${teamName(team)}에 참여를 제안했어요. 팀장에게 🔔 알림이 가요`,repropose:"📨 다시 제안했어요",comment:"의견을 남겼어요",accept:"✅ 수락했어요. 우리 팀 사업 목록에 들어왔어요",adjust:"↩ 범위 조정을 요청했어요",reject:"✋ 거절했어요. 사유가 주관 팀에 보여요",leave:"🚪 빠졌어요. 써 둔 기록은 남아요",cancel:"제안을 거뒀어요"}[kind];
    pjSeenSet("co|"+pid+"|"+team);await pjLoad();if(kind==="propose"||PJ.pcCur)pcOpen(pid,team);toast(msg||"저장했어요")}
  catch(x){if(btn)btn.disabled=false;pcErr((x&&x.hint)||errText(x))}}
document.addEventListener("click",e=>{
  const g=e.target.closest("[data-cogo]");if(g){if(!e.target.closest("#projPage"))F("alertClose");const k=g.dataset.cogo;if(!PM_MODE){pmGo("pm",{k:"wk-pm-goto",v:{view:"co",co:k}});return}PJ.view="co";if(typeof pjModalClose==="function")pjModalClose();Promise.resolve(pjOpen()).then(()=>pcOpen(...k.split("|")));return}
  if(!e.target.closest("#projPage"))return;
  const t=e.target.closest("[data-cotalk]");if(t){pcOpen(...t.dataset.cotalk.split("|"));return}
  const pr=e.target.closest("[data-copropose]");if(pr){pcPropose(pr.dataset.copropose);return}
  const sd=e.target.closest("[data-cosend]");if(sd){const team=$("pcTeam").value,sc=$("pcScope").value.trim();if(!team){pcErr("참여 팀을 골라 주세요");$("pcTeam").focus();return}
    if(sc.length<5){pcErr("요청 내용(맡을 대공정 · 범위 · 기간)을 5자 이상 적어 주세요");$("pcScope").focus();return}pcDo(sd.dataset.cosend,team,"propose",$("pcBody").value,sc,sd);return}
  const a=e.target.closest("[data-coact]");if(a&&PJ.pcCur){const [pid,team]=PJ.pcCur.split("|"),k=a.dataset.coact,b=($("pcBody")||{}).value||"",scEl=$("pcScope");
    if(k==="comment"&&!b.trim()){pcErr("의견을 적어 주세요");$("pcBody").focus();return}
    if(["adjust","reject","leave"].includes(k)&&b.trim().length<2){pcErr("사유를 적어 주세요. 주관 팀과 상급자에게 함께 보여요");$("pcBody").focus();return}
    if(k==="repropose"&&(!scEl||scEl.value.trim().length<5)){pcErr("요청 내용을 5자 이상 적어 주세요");if(scEl)scEl.focus();return}
    if((k==="reject"||k==="leave"||k==="cancel")&&a.dataset.arm!=="1"){a.dataset.arm="1";const t0=a.textContent;a.textContent="한 번 더 누르면 "+t0.replace(/^[^ ]+ /,"");setTimeout(()=>{a.dataset.arm="";a.textContent=t0},3000);return}
    pcDo(pid,team,k,b,k==="repropose"?scEl.value.trim():null,a);return}});

/* ---------- 🔔 알림: 나와 관계있는 협의에 남이 새로 남긴 것 (참여 팀장 · 주관 쪽) · 3일째 답 없는 제안은 한 번 더 ---------- */
function pcNews(){if(!st.me||!pmLicensed())return [];const S=pjSeen(),me=st.me.email,out=[];
  pcAll().forEach(l=>{const lead=pcLead(l),host=pcHost(l);if(!lead&&!host)return;const T=pcTalk(l.project_id,l.team_id),last=T[T.length-1];if(!last)return;const k="co|"+l.project_id+"|"+l.team_id,seen=S[k]||"";
    if(last.author_email!==me&&last.created_at>seen){out.push({l,last,r3:false});return}
    if(lead&&l.status==="pending"&&pcDays(l)>=3&&!S[k+"|r3|"+String(l.updated_at||"").slice(0,10)])out.push({l,last,r3:true})});
  return out}
function pmcoAlertCount(){return pcNews().length}
function pmcoAlertsHtml(){return pcNews().map(({l,last,r3})=>`<div class="walr k-share"><span class="wlv">🤝</span><button type="button" class="wtx" data-cogo="${esc(l.project_id)}|${esc(l.team_id)}"${r3?` data-cor3="${esc(String(l.updated_at||"").slice(0,10))}"`:""}><b>${r3?`참여 제안 · ${pcDays(l)}일째 답을 기다려요`:`참여 협의 · ${esc(PC_K[last.kind]||"")} ${esc(last.author_name||"")}`}</b> · ${esc(pcName(l))}<span class="wsub">${esc(teamName(l.host_team))} → ${esc(teamName(l.team_id))}${last.body&&!r3?" · "+esc(last.body.slice(0,50)):""}</span></button><span class="wact"><button type="button" class="btn sm" data-cogo="${esc(l.project_id)}|${esc(l.team_id)}">보기</button></span></div>`).join("")}
document.addEventListener("click",e=>{const b=e.target.closest("[data-cor3]");if(b)pjSeenSet("co|"+b.dataset.cogo+"|r3|"+b.dataset.cor3)},true);

wkFeat("pmco",{pmcoPartner,pmcoTag,pmcoBand,pmcoNewHint,pmcoListBar,pmcoTab,pmcoHtml,pmcoAlertCount,pmcoAlertsHtml});
