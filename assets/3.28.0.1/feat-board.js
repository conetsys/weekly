/* rhy:se Weekly Plan — 💬 의견 보내기 게시판 (feat-board.js, v3.18.0)
   내정보 ▾ → 💬 의견 보내기. 모두가 보고 👍 공감을 누르는 공개 게시판
   종류: 불편해요 · 제안 · 질문 / 관리자(admin): 상태(접수 → 확인함 → 반영 예정 → 반영됨 · 보류) + 답변
   내 글에 답변 · 상태가 바뀌면 🔔 알림에 한 번. 서버: 14-feedback.sql (wk_feedback · wk_feedback_likes) */
const FB={list:[],likes:[],kind:"제안",sort:"new",filter:"all",openId:null,loaded:false,imgs:[],priv:{},urls:{}};
const FB_KINDS=[["불편해요","😣"],["제안","💡"],["질문","❓"]],FB_ST=["접수","확인함","반영 예정","반영됨","보류"];
const fbIcon=k=>(FB_KINDS.find(x=>x[0]===k)||["","💬"])[1];
const fbLikeN=id=>FB.likes.filter(l=>l.fb_id===id).length;
const fbLiked=id=>FB.likes.some(l=>l.fb_id===id&&l.email===st.me.email);
const FBK=()=>"wk-fb-seen-"+(st.me?st.me.email:"");
const fbSeen=()=>{try{return JSON.parse(localStorage.getItem(FBK())||"{}")}catch(_){return {}}};
const fbSeenSet=(id,t)=>{const m=fbSeen();m[id]=t;try{localStorage.setItem(FBK(),JSON.stringify(m))}catch(_){}};
// 내 글 중 답변 · 상태가 새로 바뀐 것 (🔔 알림)
const fbNews=()=>!st.me?[]:FB.list.filter(f=>f.author_email===st.me.email&&(f.reply||f.status!=="접수")&&(f.updated_at||"")>(fbSeen()[f.id]||f.created_at));
async function fbLoad(){if(!st.me)return;try{const r=await api.fbList();FB.list=r.list||[];FB.likes=r.likes||[];FB.loaded=true}catch(_){}
  try{const ids=FB.list.filter(f=>st.me.is_admin||f.author_email===st.me.email).map(f=>f.id);const P=ids.length&&api.fbPriv?await api.fbPriv(ids):[];FB.priv={};(P||[]).forEach(x=>FB.priv[x.fb_id]=x)}catch(_){}
  paintNoticeDot();if(!$("boardModal").hidden)fbRender()}
function boardAlertCount(){return fbNews().length}
function boardAlertsHtml(){return fbNews().map(f=>`<div class="walr k-share"><span class="wlv">💬</span><button type="button" class="wtx" data-fbopen="${esc(f.id)}"><b>내 의견에 답변이 왔어요</b> · <span class="fbst s${FB_ST.indexOf(f.status)}">${esc(f.status)}</span>${f.reply?` · ${esc(f.reply.slice(0,60))}`:""}<span class="wsub">${esc(f.body.slice(0,50))}</span></button><span class="wact"><button type="button" class="btn sm" data-fbopen="${esc(f.id)}">보기</button></span></div>`).join("")}
function fbRow(f){const adm=st.me.is_admin,mine=f.author_email===st.me.email,open=FB.openId===f.id,n=fbLikeN(f.id),liked=fbLiked(f.id);
  return `<div class="fbr${open?" open":""}" data-fb="${esc(f.id)}">
    <div class="fbh"><span class="fbk">${fbIcon(f.kind)} ${esc(f.kind)}</span><span class="fbst s${FB_ST.indexOf(f.status)}">${esc(f.status)}</span><span class="dim">${esc(f.author_name)} · ${esc(f.team_name)} · ${esc(fmtDT(f.created_at).slice(2))}</span>
      <button type="button" class="fblike${liked?" on":""}" data-fblike="${esc(f.id)}" aria-pressed="${liked}" title="공감">👍 <b>${n}</b></button></div>
    <div class="fbb">${esc(f.body)}</div>${fbPrivHtml(f)}
    ${f.reply?`<div class="fbreply"><b>관리자 답변</b> <span class="dim">${esc(fmtDT(f.replied_at||f.updated_at).slice(2))}</span><div>${esc(f.reply)}</div></div>`:""}
    ${adm?`<div class="fbadm"><select class="sel fbsel" data-fbst="${esc(f.id)}" aria-label="상태">${FB_ST.map(s=>`<option${s===f.status?" selected":""}>${s}</option>`).join("")}</select><input type="text" class="fbrin" maxlength="500" value="${esc(f.reply||"")}" placeholder="답변 (예: v3.18.1 에서 반영할게요)" aria-label="답변"><button type="button" class="btn sm primary" data-fbsave="${esc(f.id)}">저장</button></div>`:""}
    ${mine||adm?`<div class="fbx"><button type="button" class="btn sm ghost" data-fbdel="${esc(f.id)}">지우기</button></div>`:""}
  </div>`}
function fbRender(){
  let L=[...FB.list];
  if(FB.filter==="mine")L=L.filter(f=>f.author_email===st.me.email);else if(FB.filter!=="all")L=L.filter(f=>f.kind===FB.filter);
  L.sort(FB.sort==="like"?(a,b)=>fbLikeN(b.id)-fbLikeN(a.id)||b.created_at.localeCompare(a.created_at):(a,b)=>b.created_at.localeCompare(a.created_at));
  $("fbList").innerHTML=!FB.loaded?`<div class="nempty">불러오는 중…</div>`:L.length?L.map(fbRow).join(""):`<div class="nempty">${FB.filter==="all"?"아직 올라온 의견이 없어요. 첫 의견을 남겨 주세요.":"해당하는 의견이 없어요."}</div>`;
  document.querySelectorAll("#fbTools [data-fbf]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.fbf===FB.filter));
  document.querySelectorAll("#fbTools [data-fbs]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.fbs===FB.sort));
  document.querySelectorAll("#fbKinds [data-fbk]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.fbk===FB.kind));
  // 내 글의 새 답변은 본 것으로
  fbNews().forEach(f=>fbSeenSet(f.id,f.updated_at));setTimeout(paintNoticeDot,30);return true}
function boardOpen(id){$("userMenu").hidden=true;FB.openId=id||null;if(id)FB.filter="all";fbRender();$("mscrim").hidden=false;$("boardModal").hidden=false;fbLoad().then(()=>{if(id){const r=document.querySelector(`[data-fb="${CSS.escape(id)}"]`);if(r)r.scrollIntoView({block:"center"})}})}
function boardClose(){$("boardModal").hidden=true;if($("noticeModal").hidden&&$("acctModal").hidden&&$("alertModal").hidden)$("mscrim").hidden=true}
/* ---------- 📎 화면 캡처 · 화면 정보 (v3.28.0) : 파일 저장소 wk-fb, 작성자 · 관리자만 봄. 서버: 23-meet-plus.sql ---------- */
function fbInfo(){const v=$("meetPage")&&!$("meetPage").hidden?"회의록":document.documentElement.classList.contains("pm-on")||location.hash==="#pm"||/\/pm\//.test(location.pathname)?"사업관리":st.view==="review"?"점검":({month:"달력",table:"표",list:"목록",share:"Co-work"}[st.layout]||"업무");
  const ua=navigator.userAgent,br=/Edg\//.test(ua)?"Edge":/Whale\//.test(ua)?"Whale":/SamsungBrowser/.test(ua)?"삼성 인터넷":/Chrome\//.test(ua)?"Chrome":/Safari\//.test(ua)?"Safari":/Firefox\//.test(ua)?"Firefox":"기타",os=/Windows/.test(ua)?"Windows":/Android/.test(ua)?"Android":/iPhone|iPad/.test(ua)?"iOS":/Mac OS/.test(ua)?"Mac":"기타";
  return {ver:typeof APP_VERSION!=="undefined"?APP_VERSION:"",view:v,browser:br+" · "+os,screen:`${innerWidth}×${innerHeight} @${Math.round((devicePixelRatio||1)*100)/100}x`,ua:ua.slice(0,300)}}
async function fbPrivSend(id){let bad=0;const paths=[];
  for(let i=0;i<FB.imgs.length;i++){const p=`${id}/${i+1}.jpg`;try{await api.fbImgUpload(p,FB.imgs[i].blob);paths.push(p)}catch(_){bad++}}
  try{await api.fbPrivAdd({fb_id:id,author_email:st.me.email,images:paths,info:fbInfo()})}catch(_){if(paths.length)bad++}return bad}
// 긴 변 1600px · JPEG 로 줄여서 (3MB 아래)
function fbShrink(file){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const k=Math.min(1,1600/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement("canvas");c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);
  const g=c.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?ok(b):no(new Error("toBlob")),"image/jpeg",.85)};im.onerror=()=>{URL.revokeObjectURL(u);no(new Error("img"))};im.src=u})}
async function fbAddFiles(fs){fs=fs.filter(f=>f&&/^image\//.test(f.type));if(!fs.length)return;
  const room=3-FB.imgs.length;if(room<=0){toast("캡처는 3장까지 넣을 수 있어요");return}if(fs.length>room)toast("캡처는 3장까지라 앞의 "+room+"장만 넣었어요");
  for(const f of fs.slice(0,room))try{const b=await fbShrink(f);FB.imgs.push({blob:b,url:URL.createObjectURL(b)})}catch(_){toast("그림을 읽지 못했어요")}fbCapPaint()}
function fbCapPaint(){const c=$("fbCap");if(!c)return;c.hidden=!FB.imgs.length;c.innerHTML=FB.imgs.map((x,i)=>`<span class="fbth"><img src="${x.url}" alt="캡처 ${i+1}"><button type="button" class="fbthx" data-fbcrm="${i}" aria-label="캡처 ${i+1} 빼기">✕</button></span>`).join("")+(FB.imgs.length?`<span class="dim fbcapn">🔒 작성자와 관리자만 봐요 · 화면 정보(버전 · 화면 · 브라우저)가 같이 붙어요</span>`:"")}
function fbCapInit(){const fm=document.querySelector("#boardModal .fbform"),sd=fm&&fm.querySelector(".fbsend");if(!sd||$("fbCap"))return;
  sd.insertAdjacentHTML("afterbegin",`<button type="button" class="btn sm ghost" id="fbPick" title="Ctrl+V 로 붙여 넣거나 끌어다 놓아도 돼요">📎 캡처 넣기</button><input type="file" id="fbFile" accept="image/png,image/jpeg,image/webp" multiple hidden><span class="dim fbcaph">Ctrl+V 로 붙여 넣기도 돼요 · 3장까지</span>`);
  sd.insertAdjacentHTML("beforebegin",`<div class="fbcap" id="fbCap" hidden></div>`);
  $("fbPick").onclick=()=>$("fbFile").click();$("fbFile").onchange=e=>{fbAddFiles([...e.target.files]);e.target.value=""};
  $("fbCap").onclick=e=>{const b=e.target.closest("[data-fbcrm]");if(!b)return;const x=FB.imgs.splice(+b.dataset.fbcrm,1)[0];if(x)URL.revokeObjectURL(x.url);fbCapPaint()};
  $("boardModal").addEventListener("paste",e=>{const fs=[...((e.clipboardData&&e.clipboardData.items)||[])].filter(i=>i.kind==="file"&&/^image\//.test(i.type)).map(i=>i.getAsFile()).filter(Boolean);if(fs.length){e.preventDefault();fbAddFiles(fs)}});
  fm.addEventListener("dragover",e=>{if([...(e.dataTransfer&&e.dataTransfer.types||[])].includes("Files")){e.preventDefault();fm.classList.add("drop")}});
  fm.addEventListener("dragleave",()=>fm.classList.remove("drop"));
  fm.addEventListener("drop",e=>{fm.classList.remove("drop");const fs=[...((e.dataTransfer&&e.dataTransfer.files)||[])];if(fs.length){e.preventDefault();fbAddFiles(fs)}})}
fbCapInit();
// 글 안: 캡처 썸네일 + (관리자) 화면 정보
function fbPrivHtml(f){const p=FB.priv[f.id];if(!p||!(st.me.is_admin||f.author_email===st.me.email))return "";const I=p.images||[],inf=p.info||{};
  I.forEach(x=>{if(!(x in FB.urls)){FB.urls[x]=null;api.fbImgUrl(x).then(u=>{FB.urls[x]=u;const im=document.querySelector(`img[data-fbimg="${CSS.escape(x)}"]`);if(im)im.src=u}).catch(()=>{})}});
  return `${I.length?`<div class="fbimgs">${I.map((x,i)=>`<button type="button" class="fbth" data-fbzoom="${esc(x)}" aria-label="캡처 ${i+1} 크게 보기"><img data-fbimg="${esc(x)}" src="${FB.urls[x]||""}" alt="캡처 ${i+1}"></button>`).join("")}<span class="dim fbcapn">🔒 작성자 · 관리자만</span></div>`:""}
    ${st.me.is_admin&&inf.ver?`<div class="fbinfo dim">🖥 v${esc(inf.ver)} · ${esc(inf.view||"")} · ${esc(inf.browser||"")} · ${esc(inf.screen||"")}</div>`:""}`}
document.addEventListener("click",e=>{const z=e.target.closest&&e.target.closest("[data-fbzoom]");if(z){const u=FB.urls[z.dataset.fbzoom];if(!u)return;const lb=document.createElement("div");lb.className="fblb";lb.setAttribute("role","dialog");lb.setAttribute("aria-label","캡처 크게 보기");lb.innerHTML=`<img src="${u}" alt="캡처"><span>누르면 닫혀요</span>`;lb.onclick=()=>lb.remove();document.body.appendChild(lb);return}});
$("miBoard").hidden=false;$("miBoard").onclick=()=>boardOpen();
$("fbClose").onclick=boardClose;$("fbOk").onclick=boardClose;
$("fbKinds").onclick=e=>{const b=e.target.closest("[data-fbk]");if(!b)return;FB.kind=b.dataset.fbk;fbRender();$("fbBody").focus()};
$("fbTools").onclick=e=>{const f=e.target.closest("[data-fbf]");if(f){FB.filter=f.dataset.fbf;fbRender();return}const s=e.target.closest("[data-fbs]");if(s){FB.sort=s.dataset.fbs;fbRender()}};
$("fbSend").onclick=async()=>{const body=$("fbBody").value.trim();if(!body){$("fbBody").focus();return}
  $("fbSend").disabled=true;
  try{const id="f"+newId();await api.fbAdd({id,author_email:st.me.email,author_name:st.me.name,team_name:st.me.team_id?teamName(st.me.team_id):"관리",kind:FB.kind,body});$("fbBody").value="";
    const bad=await fbPrivSend(id);FB.imgs=[];fbCapPaint();
    toast(bad?"의견은 올렸지만 캡처 일부를 올리지 못했어요":"의견을 올렸어요. 고마워요!");FB.filter="all";FB.sort="new";await fbLoad()}
  catch(x){toast((x&&x.hint)||errText(x))}finally{$("fbSend").disabled=false}};
$("fbList").addEventListener("click",async e=>{
  const lk=e.target.closest("[data-fblike]");if(lk){const id=lk.dataset.fblike,on=!fbLiked(id);lk.disabled=true;
    try{await api.fbLike(id,on);if(on)FB.likes.push({fb_id:id,email:st.me.email});else FB.likes=FB.likes.filter(l=>!(l.fb_id===id&&l.email===st.me.email));fbRender()}catch(x){toast(errText(x))}finally{lk.disabled=false}return}
  const sv=e.target.closest("[data-fbsave]");if(sv){const id=sv.dataset.fbsave,row=sv.closest(".fbr");sv.disabled=true;
    try{await api.fbUpdate(id,{status:row.querySelector(".fbsel").value,reply:row.querySelector(".fbrin").value.trim()||null});toast("저장했어요. 쓴 분의 🔔 알림에 보여요");await fbLoad()}catch(x){sv.disabled=false;toast(errText(x))}return}
  const dl=e.target.closest("[data-fbdel]");if(dl){if(dl.dataset.arm!=="1"){dl.dataset.arm="1";dl.textContent="한 번 더 누르면 지워져요";setTimeout(()=>{dl.dataset.arm="";dl.textContent="지우기"},3000);return}
    try{await api.fbDel(dl.dataset.fbdel);await fbLoad();toast("지웠어요")}catch(x){toast(errText(x))}}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-fbopen]");if(!b||e.target.closest("#boardModal"))return;e.stopPropagation();F("alertClose");boardOpen(b.dataset.fbopen)},true);
// 처음에 한 번, 이후 2분마다 (내 글에 답변이 왔는지)
setTimeout(fbLoad,4000);setInterval(()=>{if(st.me&&document.visibilityState==="visible")fbLoad()},120000);
// 📖 사용법
wkGuideAdd("board",{
  member:[{after:"x-export",sec:["x-board","💬 의견 보내기",[
    ["p","불편한 점 · 바라는 점 · 궁금한 점을 남기는 게시판입니다. **모두가 볼 수 있고**, 같은 생각이면 **👍 공감**을 누릅니다. 공감이 많은 의견부터 먼저 살펴봅니다."],
    ["img","g23_board","내정보 ▾ → 💬 의견 보내기"],
    ["ol",["**내정보 ▾ → 💬 의견 보내기**를 누릅니다.","종류(😣 불편해요 · 💡 제안 · ❓ 질문)를 고르고 내용을 써서 **올리기**를 누릅니다.","관리자가 상태(확인함 · 반영 예정 · 반영됨)와 답변을 남기면 **🔔 알림**에 뜹니다."]],
    ["tip","작은 불편도 괜찮습니다. 어떤 화면에서 무엇을 하다가 불편했는지 적어 주시면 더 빨리 고칠 수 있습니다."]]]}],
  faq:[["의견은 누가 보나요?","모두가 봅니다. 공감(👍)을 눌러 같은 생각을 표시할 수 있고, 내가 쓴 글은 지울 수 있습니다."]]});
wkFeat("board",{boardAlertCount,boardAlertsHtml,boardOpen,fbLoad});
