/* rhy:se Weekly Plan — 🌿 이번 주의 글 (feat-quote.js, v3.25.0)
   메인 화면 위쪽에 한 줄. 매주 월요일 저절로 바뀜 (그해 몇째 주인지로 고름, 52개 · 53째 주는 마지막 글)
   · 출처가 확실한 옛 명언 39개 + rhy:se 글귀 13개 (네 주에 한 번 rhy:se 글귀). 번역은 직접 다듬음 (출판 번역 문장을 쓰지 않음)
   · 🧩 기능 더하기에서 각자 켜고 끔 (처음엔 꺼짐, 내 설정이라 기기가 달라도 같음)
   · ✕ 를 누르면 이번 주만 숨김 → 다음 주 글이 나오면 다시 보임 (기기마다)
   · 휴대폰: 점검 화면 위 (달력 위 자리가 좁아서)
   서버 · SQL 없음. 이 파일이 고장 나도 업무 화면은 그대로 */
const QT_LIST=[
  ["날마다 새롭게, 또 새롭게.","대학 · 탕왕의 반명"],
  ["천 리 길도 한 걸음에서 시작된다.","노자 · 도덕경 64장"],
  ["할 줄 알아야 하는 일은, 해 보면서 배운다.","아리스토텔레스 · 니코마코스 윤리학 2권"],
  ["오늘의 한 걸음이 이번 주를 만듭니다.","rhy:se"],
  ["흙이 쌓여 산이 된다.","순자 · 권학편"],
  ["배우고 때때로 익히면 즐겁지 아니한가.","공자 · 논어 학이편"],
  ["아침에 일어나기 힘들 때, '나는 사람의 일을 하러 일어난다'고 생각하라.","마르쿠스 아우렐리우스 · 명상록 5권"],
  ["다 못 해도 괜찮습니다. 이어서 하면 됩니다.","rhy:se"],
  ["세상의 어려운 일은 반드시 쉬운 데서 시작된다.","노자 · 도덕경 63장"],
  ["어느 항구로 갈지 모르는 사람에게는 어떤 바람도 순풍이 아니다.","세네카 · 루킬리우스에게 보낸 편지 71"],
  ["일을 잘하려면 먼저 연장을 갈아야 한다.","공자 · 논어 위령공편"],
  ["빠르지 않아도 됩니다. 멈추지만 않으면 됩니다.","rhy:se"],
  ["반걸음이 쌓이지 않으면 천 리에 이를 수 없다.","순자 · 권학편"],
  ["우리는 실제보다 상상 속에서 더 자주 괴로워한다.","세네카 · 루킬리우스에게 보낸 편지 13"],
  ["아는 사람은 좋아하는 사람만 못하고, 좋아하는 사람은 즐기는 사람만 못하다.","공자 · 논어 옹야편"],
  ["막힌 곳은 혼자 풀지 않아도 됩니다.","rhy:se"],
  ["길을 막는 것이 곧 길이 된다.","마르쿠스 아우렐리우스 · 명상록 5권"],
  ["세 사람이 길을 가면, 그중에 반드시 내 스승이 있다.","공자 · 논어 술이편"],
  ["아는 것으로는 부족하다. 써 보아야 한다.","괴테 · 빌헬름 마이스터의 편력시대"],
  ["어제보다 조금 나으면, 그걸로 충분합니다.","rhy:se"],
  ["남이 한 번에 하면 나는 백 번 한다.","중용 20장"],
  ["어떤 것은 우리에게 달려 있고, 어떤 것은 그렇지 않다.","에픽테토스 · 엥케이리디온 1장"],
  ["산을 쌓다가 한 삼태기를 남기고 멈춘다면, 멈춘 것은 나다.","공자 · 논어 자한편"],
  ["계획은 바뀌어도, 방향은 그대로입니다.","rhy:se"],
  ["잘 말한 것보다 잘 해낸 것이 낫다.","벤저민 프랭클린 · 가난한 리처드의 달력"],
  ["가장 좋은 것은 물과 같다. 만물을 이롭게 하면서 다투지 않는다.","노자 · 도덕경 8장"],
  ["삶이 짧은 것이 아니라, 우리가 많이 흘려보내는 것이다.","세네카 · 인생의 짧음에 관하여"],
  ["지친 날엔 숨 고르기도 일입니다.","rhy:se"],
  ["싹을 빨리 키우려 뽑아 올리면, 싹은 말라 버린다.","맹자 · 공손추편"],
  ["제비 한 마리가 왔다고 봄이 되는 것은 아니다.","아리스토텔레스 · 니코마코스 윤리학 1권"],
  ["빨리 하려고 서두르면 오히려 이르지 못한다.","공자 · 논어 자로편"],
  ["혼자 바쁜 주라면, 옆자리에 한마디 건네 보세요.","rhy:se"],
  ["나를 죽이지 않는 것은 나를 더 강하게 만든다.","니체 · 우상의 황혼"],
  ["옛것을 익혀 새것을 안다.","공자 · 논어 위정편"],
  ["좋은 사람이 무엇인지 따지지 말고, 그런 사람이 되라.","마르쿠스 아우렐리우스 · 명상록 10권"],
  ["잘한 일 하나를 적고 하루를 닫아 보세요.","rhy:se"],
  ["자신을 이기는 사람이 강하다.","노자 · 도덕경 33장"],
  ["부지런함은 행운의 어머니다.","벤저민 프랭클린 · 가난한 리처드의 달력"],
  ["하늘이 큰일을 맡기려 할 때는, 먼저 마음을 괴롭히고 몸을 고단하게 한다.","맹자 · 고자편"],
  ["힘든 주일수록, 처음 10분을 나에게 주세요.","rhy:se"],
  ["세상은 고통으로 가득하지만, 그것을 이겨내는 일로도 가득하다.","헬렌 켈러 · 낙관주의"],
  ["준마도 한 번 뛰어 열 걸음을 못 가지만, 둔한 말도 열흘을 가면 닿는다.","순자 · 권학편"],
  ["열정 없이 이루어진 위대한 일은 없다.","에머슨 · 원"],
  ["월요일은 다시 시작하기 좋은 날입니다.","rhy:se"],
  ["잘못하고도 고치지 않는 것, 그것이 잘못이다.","공자 · 논어 위령공편"],
  ["다른 모든 것은 빌린 것이고, 시간만이 우리의 것이다.","세네카 · 루킬리우스에게 보낸 편지 1"],
  ["꿈의 방향으로 자신 있게 나아가면, 생각지 못한 성공을 만난다.","소로 · 월든"],
  ["오늘 끝낸 일 하나가 내일의 여유입니다.","rhy:se"],
  ["날이 추워진 뒤에야 소나무와 잣나무가 늦게 시드는 줄 안다.","공자 · 논어 자한편"],
  ["덕은 외롭지 않다. 반드시 이웃이 있다.","공자 · 논어 이인편"],
  ["잃어버린 시간은 다시 찾을 수 없다.","벤저민 프랭클린 · 가난한 리처드의 달력"],
  ["이번 해의 나에게, 수고했다고 말해 주세요.","rhy:se"]];
// 그해 몇째 주 (ISO: 목요일이 든 해 기준, 월요일 시작)
function qtWeekNo(d){const t=new Date(d.getFullYear(),d.getMonth(),d.getDate());t.setDate(t.getDate()+3-((t.getDay()+6)%7));const y0=new Date(t.getFullYear(),0,4);return 1+Math.round(((t-y0)/864e5-3+((y0.getDay()+6)%7))/7)}
function qtNow(){const n=qtWeekNo(new Date()),i=Math.min(n,QT_LIST.length)-1;return {n,q:QT_LIST[i][0],src:QT_LIST[i][1],key:String(new Date().getFullYear())+"-"+n}}
const QTK=()=>"wk-quote-hide-"+(st.me?st.me.email:"");
const qtOn=()=>!!F("modOn","quote");
const qtHidden=k=>!qtOn()||(()=>{try{return localStorage.getItem(QTK())===k}catch(_){return false}})();
const qtRhy=s=>s==="rhy:se";
function qtInner(Q){return `<span class="qt-tag">이번 주의 글</span><span class="qt-q">${esc(Q.q)}</span>${qtRhy(Q.src)?"":`<span class="qt-src">— ${esc(Q.src)}</span>`}<button type="button" class="qt-x" data-qthide="1" aria-label="이번 주 글 숨기기" title="이번 주만 숨기기 (다음 주에 새 글)">✕</button>`}
// PC · 아이패드: 위쪽 필터 줄 바로 위
function quotePaint(){if(!st.me)return;const Q=qtNow(),m=document.querySelector("main.wrap"),f=m&&m.querySelector(".filters");if(!f)return;
  let b=$("qtBar");if(qtHidden(Q.key)){if(b)b.remove();return}
  if(!b){b=document.createElement("div");b.id="qtBar";b.className="qtbar";b.setAttribute("role","note");f.insertAdjacentElement("beforebegin",b)}
  if(b.dataset.k!==Q.key){b.dataset.k=Q.key;b.innerHTML=qtInner(Q)}}
// 📱 점검 화면 위 (feat-mtab 이 부름)
function quoteHtml(){if(!st.me)return "";const Q=qtNow();if(qtHidden(Q.key))return "";return `<div class="qtbar mb" role="note">${qtInner(Q)}</div>`}
document.addEventListener("click",e=>{const x=e.target.closest&&e.target.closest("[data-qthide]");if(!x)return;const Q=qtNow();try{localStorage.setItem(QTK(),Q.key)}catch(_){}
  const bar=x.closest(".qtbar");const done=()=>{if(bar)bar.remove();F("mobRender")};
  if(bar&&bar.animate&&!matchMedia("(prefers-reduced-motion: reduce)").matches)bar.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards"}).onfinish=done;else done()});
wkGuideAdd("quote",{mod:"quote",
  member:[{after:"x-mods",sec:["x-quote","🌿 이번 주의 글",[
    ["p","켜 두면 업무 화면 위쪽(휴대폰은 점검 화면 위)에 한 주를 여는 글귀 한 줄이 보입니다. 매주 월요일에 새 글로 바뀌고, 출처가 분명한 옛 명언과 rhy:se 글귀가 섞여 나옵니다."],
    ["ul",["**✕**를 누르면 이번 주만 숨깁니다. 다음 주 새 글은 다시 보입니다.","아예 끄려면 🧩 기능 더하기에서 끕니다."]]]]}]});
wkFeat("quote",{quotePaint,quoteHtml,qtNow});
