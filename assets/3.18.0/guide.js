/* 📖 사용법 (내정보 → 사용법 · 로그인 화면 · 공지의 [[사용법]] · 주소 #guide 로 열림). 열 때만 불러옴 */
(function(){
const V=()=>typeof APP_VERSION!=="undefined"?APP_VERSION:"";
const IMG=n=>(window.WK_GIMG&&WK_GIMG[n])||`img/guide/${n}.webp?v=${V()}`;
const B=s=>esc(s).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");

/* 내용: [종류, ...]  p 문단 · img 캡처 · ol 번호(캡처의 빨간 번호와 같음) · ul 점 · h 소제목 · tbl 표 · chk 체크 목록 · tip 팁 상자 */
const RHYTHM=["tbl",["언제","팀원","팀장"],[
  ["매일 처음 10분 (출근 후)","점검 → 먼저 할 일 확인 · 오늘 할 일의 상태와 일정 확인 · 새로 생긴 일 추가","팀원 리듬 색으로 밀린 사람 확인 · 기한 지난 일 살피기"],
  ["매일 마지막 10분 (퇴근 전)","끝낸 일 완료 체크 · 메모 남기기 · 못 지킬 일은 종료일 미루고 이유 고르기","오늘 미룬 일 · 오래 대기 살피기"],
  ["주 첫날 처음 10분","이번 주 할 일 쓰기 · 시작일 → 종료일 정하기","할 일을 아직 안 쓴 팀원 챙기기"],
  ["주 마지막 날 마지막 10분","다음 주 계획 · 내 보고서에서 보고용 체크","팀 보고서에서 최종 체크 · PPT 내보내기"]]];
const START=["start","한눈에 보기",[
  ["p","rhy:se의 기본은 **하루의 처음 10분, 마지막 10분**입니다. 출근해서 10분 동안 오늘 할 일을 정하고, 퇴근 전 10분 동안 오늘 한 일을 정리하면 리듬이 자동으로 쌓입니다. 주의 첫날과 마지막 날에는 그 10분에 한 주 계획과 보고가 더해집니다."],
  RHYTHM,
  ["p","접속 주소는 **conetsys.github.io/weekly** 입니다. PC와 휴대폰 모두 같은 주소를 씁니다."]]];

const MEMBER=[START,
 ["m1","로그인하고 시작하기",[
  ["p","처음 접속한 날 5분이면 끝납니다. 캡처의 빨간 번호 순서대로 따라 하세요."],
  ["img","g01_login","로그인 화면"],
  ["ol",["**회사 메일 칸**에 아이디만 씁니다. 뒤의 @회사주소는 자동으로 붙습니다. 예: hong","**비밀번호 칸**에 숫자를 입력합니다. 처음에는 **0426**입니다.","**로그인** 버튼을 누릅니다."]],
  ["h","처음 로그인하면 이어서"],
  ["ul",["**새 비밀번호 정하기** 화면이 나오면 숫자 6자리를 두 번 넣고 저장합니다. 0426은 모두가 아는 번호라 꼭 바꿔 주세요.","위쪽 **📲 앱 설치**를 누르고 내 기기(아이폰 · 안드로이드 · PC)를 고르면 설치 방법이 나옵니다. 홈 화면에 rhy:se 아이콘이 생깁니다.","다음부터는 앱 아이콘을 누르면 바로 업무 화면이 열립니다."]],
  ["tip","비밀번호를 여러 번 틀리면 10분 동안 잠깁니다. 잊었으면 로그인 화면의 **비밀번호를 잊었어요**로 관리자에게 초기화를 요청하세요. 비밀번호 변경은 **내정보 ▾ → 비밀번호 바꾸기**에서도 할 수 있습니다."]]],
 ["m2","화면 구성",[
  ["p","로그인하면 보이는 첫 화면입니다. 자주 누르는 버튼 다섯 개만 기억하면 됩니다."],
  ["img","g02_main","첫 화면의 주요 버튼"],
  ["ol",["**+ 업무 추가**: 새 업무를 씁니다. 내 이름 줄 옆과 표 맨 아래에 있습니다.","**작성**: 업무를 쓰고 보는 화면입니다. 평소에는 여기서 일합니다.","**점검**: 내 리듬과 계획 대비를 봅니다.","**📝 보고서**: 보고할 업무를 고릅니다.","**🗂️ 내 목록**: 대상사업 · 고객사 · 협력사 · 구분 · 미룬 이유 목록을 내 것으로 고칩니다. 다른 팀원에게는 영향이 없습니다."]],
  ["h","공지와 내정보 메뉴"],
  ["img","g02b_menu","📣 팀 공지와 내정보 ▾ 메뉴"],
  ["ol",["**📣 팀 공지**: 우리 팀 공지와 알림(입고·회신 대기 등)이 모입니다. 빨간 점이 있으면 확인할 것이 있다는 뜻입니다.","**📢 전체 공지**: 회사 전체 공지는 내정보 ▾ 안에 있습니다. 새 글이 있으면 내정보에 빨간 점이 뜹니다.","**🧩 기능 더하기**: 필요한 기능을 골라 켭니다. (아래 '기능 더하기')"]],
  ["h","그 밖에 눈에 띄는 것들"],
  ["ul",["맨 위 **◀ 이번주 ▶**: 주를 옮깁니다. '이번주로'를 누르면 돌아옵니다.","**이름 단추 줄**(전체 · 내 이름 · 팀원들): 누른 사람의 업무만 보입니다.","**내정보 ▾**: 📢 전체 공지 · 🧩 기능 더하기 · 비밀번호 바꾸기 · 📖 사용법 · 로그아웃","제목 옆 **버전**: 누르면 업데이트 기록이 나옵니다."]]]],
 ["m3","업무 하나 쓰기",[
  ["p","**+ 업무 추가**를 누르면 오른쪽에 업무 창이 열립니다. 위에서부터 차례로 채우고 저장하면 끝입니다."],
  ["img","g03a_form","업무 창 위쪽 — 고객사 · 대상사업 · 구분 (1~3)"],
  ["img","g03b_form","업무 창 아래쪽 — 할일 · 일정 · 상태 · 저장 (4~7)"],
  ["ol",["**고객사**를 고릅니다. 목록에 없으면 맨 아래 **+ 새 고객사…**를 고르고 이름을 씁니다. 팀 내부 일은 **내부**를 고릅니다.","**대상사업**을 누르면 목록이 나옵니다. 고르거나 새로 씁니다. 필요하면 아래 품목 · 관리번호 · 협력사도 채웁니다 (선택).","**구분**을 고릅니다. 처음엔 '선택하세요'로 비어 있으니 꼭 골라 주세요. 예: 수검, 시정조치","**할일**에 이번 주에 할 일을 한 줄로 씁니다. 예: 고객 수검 입회","**시작일 → 종료일** 칸을 누르면 달력이 열립니다. (아래 달력)","**상태**를 고릅니다. 보통은 진행입니다.","**저장**을 누릅니다."]],
  ["h","달력에서 기간 고르기"],
  ["img","g04_calendar","달력 — 시작일과 종료일을 차례로 클릭"],
  ["ol",["시작하는 날을 누릅니다.","끝내는 날을 누릅니다. 그 사이가 칠해지고 달력이 저절로 닫힙니다.","닫히지 않았다면 **완료**를 누릅니다."]],
  ["ul",["종료일만 빠르게 정하려면 칸 아래 **오늘 · 이번주 금 · 그다음 주 금** 단추를 누릅니다.","다음 주에 할 일을 미리 정해 두려면 같은 창의 **다음주 계획**에 씁니다. **↓ 이번주 내용 가져오기**를 누르면 그대로 복사됩니다. 다음 주가 되면 이번주 칸으로 자동으로 올라갑니다.","작성일은 처음 저장한 날이 자동으로 들어갑니다. 목록에 없던 값을 새로 쓰면 내 목록에도 자동으로 추가됩니다."]]]],
 ["m4","상태 바꾸고 완료하기",[
  ["p","업무 창을 열지 않고 표에서 바로 바꿉니다."],
  ["img","g05_status","표에서 상태 바꾸기"],
  ["ol",["이번주 칸의 **상태**(진행 · 대기 · 완료)를 누릅니다.","나오는 메뉴에서 바꿀 상태를 누릅니다. 끝났으면 **완료**입니다."]],
  ["ul",["**☰ 목록으로 보기**에서는 줄 앞의 체크만 누르면 완료입니다.","완료한 날은 자동으로 기록돼 '기한 안에 끝낸 비율'에 쓰입니다.","**대기**는 고객 회신처럼 남을 기다리는 일에 씁니다. 2주 넘게 대기면 '오래 대기'로 표시됩니다.","이번 주에 끝내지 못한 일은 다음 주로 **이월**됩니다. 열어서 이번 주 기준으로 고치고 저장하면 이번 주 기록이 됩니다."]]]],
 ["m5","일정을 미룰 때",[
  ["p","못 지킬 것 같으면 숨기지 말고 종료일을 미루고 이유를 남기세요. 내가 무엇 때문에 자주 밀리는지 보이기 시작합니다."],
  ["img","g06_postpone","종료일 미루기 — 이유 고르기와 변경 기록"],
  ["ol",["표에서 업무를 눌러 열고, 일정 칸의 **종료** 쪽을 누릅니다. 달력에서 새 종료일을 누릅니다.","노란 상자 **일정을 미루는 이유**에서 하나를 누릅니다. 선택이라 안 골라도 저장됩니다.","전에 바꾼 적이 있으면 **↻ 일정 변경**이 보입니다. 누르면 날짜별 기록이 펼쳐집니다.","**저장**을 누릅니다. 표의 종료일 옆에 ↻1 같은 표시가 붙습니다."]],
  ["ul",["작성한 날에 고친 건 계획을 다듬는 것으로 보고 세지 않습니다. 다음 날부터 바꾼 것만 기록됩니다.","이유 목록은 **🗂️ 내 목록 → 미룬 이유** 탭에서 내 마음대로 바꿀 수 있습니다.","미룬 이유는 본인만 봅니다. 팀장은 횟수와 지킴률까지만 봅니다."]]]],
 ["m6","보기 방식과 표시의 뜻",[
  ["p","같은 업무를 세 가지 모양으로 볼 수 있습니다. 화면 오른쪽의 보기 단추를 누르면 바뀝니다."],
  ["tbl",["보기","이럴 때 좋아요"],[["▦ 캘린더로 보기","한 달 일정을 막대로 볼 때. 날짜를 누르면 그날 업무와 '+ 이날 업무 추가'"],["표로 보기","지난주 · 이번주 · 다음주를 한 줄에 볼 때"],["☰ 목록으로 보기","할 일을 체크할 때. ⠿를 끌어 내 순서를 정하고, 제목을 눌러 정렬"]]],
  ["ul",["**끝난 일**: 숨기기 · 최근만 · 전부 중 고릅니다.","**찾기**: 검색칸(사업 · 품목 · 관리번호 · 협력사)과 **필터**(상태 · 구분 · 고객사)","위쪽에는 챙길 것 두 가지(**기한 지남 · 이월**) 숫자만 보입니다. 진행 · 대기 · 완료 · 신규 · 오래 대기는 **필터** 안에서 고릅니다."]],
  ["h","표시의 뜻"],
  ["tbl",["표시","뜻"],[["이월","지난 주에 안 끝나 넘어온 일"],["기한 지남","종료일이 지났는데 완료 안 됨"],["오래 대기","2주 넘게 대기"],["↻2","일정을 2번 바꿈 (마우스를 올리면 처음 종료일)"],["11/3~11/6","시작일~종료일"],["11/2 작성","처음 쓴 날"]]]]],
 ["m7","점검 — 내 리듬 보기",[
  ["p","매일 처음 10분에는 먼저 할 일을, 마지막 10분에는 오늘 무엇을 끝내고 무엇이 밀렸는지를 봅니다. 점검은 평가가 아니라 나를 비추는 거울입니다."],
  ["img","g07_rhythm","점검 — 내 리듬"],
  ["ol",["위쪽 **점검** 탭을 누릅니다.","**이번 주 상태**: 🟢 좋은 리듬 · 🟡 조금 서둘러야 해요 · 🔴 밀리고 있어요. 완료 건수와 기한 지난 일이 함께 나옵니다. 가운데 그래프는 최근 8주 완료율이고, 점선은 4주 평균입니다.","**먼저 할 일**: 종료일이 가까운 순서 다섯 개입니다. 누르면 그 업무가 열립니다.","**계획 대비**: 최근 8주 끝낸 일을 처음 정한 종료일 기준으로 나눕니다. 계획 지킴률, 이번 주에 미룬 일, 내가 자주 미루는 이유가 보입니다."]],
  ["tip","이번 주 할 일을 아직 안 썼다면 상태 칸에 **+ 이번 주 할 일 작성하기** 버튼이 나옵니다."]]],
 ["m8","내 보고서에서 보고할 업무 고르기",[
  ["p","**주 마지막 날 마지막 10분**에 보고할 업무에 체크만 하면 팀장님의 팀 보고서로 올라갑니다."],
  ["img","g08_myreport","내 보고서 — 보고용 체크"],
  ["ol",["위쪽 **📝 보고서**를 누르면 **내 보고서** 탭이 열립니다.","주를 확인합니다. '11/02~11/06 작성분 → 11/09 주 보고'는 이번 주에 쓴 내용을 다음 주 회의에서 보고한다는 뜻입니다. ◀ ▶로 바꿉니다.","보고할 줄 앞의 **보고용**을 체크합니다. 자동으로 저장되고, 위에 '보고용 2 / 5건'처럼 보입니다.","아래 **내 보고 미리보기**에서 팀 보고서에 들어갈 모양을 확인합니다."]],
  ["ul",["내용을 고치려면 **← Weekly Plan**으로 돌아가 업무를 수정합니다. 보고서에 바로 반영됩니다.","고객사가 '내부'이거나 대상사업이 없는 업무는 보고서 아래쪽에 모입니다."]]]]];

const LEADER=[START,
 ["l1","팀장이 할 수 있는 것",[
  ["p","팀장은 팀원의 업무를 **보고 모으는** 역할이고, 고치는 건 담당자 본인입니다. 팀장은 관리자가 조직도에서 정합니다. 내 업무 쓰는 법은 팀원편과 같습니다."],
  ["tbl",["할 수 있는 것","하지 않는 것"],[["팀원 업무 모두 보기","팀원 업무 고치기 (담당자 본인만)"],["팀원 리듬 · 계획 지킴률 · 미룬 횟수 보기","팀원이 미룬 **이유** 보기 (본인만)"],["팀 보고서에서 최종 보고 고르기 · PPT 내보내기","팀원 대신 보고용 체크하기"],["우리 팀 공지 쓰기 · 기능 추천","조직 변경 · 전체 공지 (관리자)"],["우리 팀에 팀원 추가","이름 · 소속 고치기 · 퇴사 · 비밀번호 초기화 (관리자)"],["내 업무 쓰기 (팀원편과 같음)",""]]],
  ["p","팀원에게 업무를 고쳐 달라고 할 때는 메모나 대화로 요청하세요. 팀원이 고치면 팀장 화면에도 바로 반영됩니다."]]],
 ["l2","팀원 현황 보기",[
  ["p","매일 처음 10분에 점검 탭 하나로 팀 전체 → 한 사람 순서로 봅니다."],
  ["img","g09_team","점검 — 팀원 리듬과 담당자별 현황"],
  ["ol",["**점검** 탭에서 이름 단추 줄의 **전체**를 누릅니다.","**팀원 리듬** 줄에서 색을 봅니다. 🔴 기한 지난 일 2건 이상 · 🟡 1건 또는 이틀 안 마감 2건 이상 · 🟢 좋음. 빨간 사람이 맨 앞에 오고, 이름 옆에 '완료/전체' 건수가 있습니다.","팀원 **이름**을 누르면 그 사람의 리듬이 열립니다. 8주 완료율, 먼저 할 일, 계획 대비(지킴률 · 미룬 횟수 · 이번 주에 미룬 일)까지 보입니다. **← 전체로**를 누르면 돌아옵니다.","아래 **담당자별 현황** 표에서 진행 · 대기 · 완료 · 이월 · 기한 지남 · 오래 대기를 사람별로 봅니다. 그 아래 **확인할 업무**에 기한 지남 · 오래 대기 · 이월 업무가 한 목록으로 급한 순서대로 모입니다. 제목을 누르면 접고 펼 수 있습니다."]],
  ["h","눈여겨 볼 신호"],
  ["ul",["같은 사람의 미룬 횟수가 계속 늘면: 일이 너무 많거나 처음 일정을 빠듯하게 잡는 습관일 수 있습니다.","'오래 대기'가 쌓이면: 팀장이 풀어 줄 막힘(고객 · 협력사 회신)일 때가 많습니다.","숫자는 평가가 아니라 **박자를 맞추는 대화의 시작**으로 쓰세요."]]]],
 ["l3","팀 보고서 만들고 PPT 내보내기",[
  ["p","팀원들이 보고용으로 고른 업무 중 최종 보고할 것만 체크하면 PPT가 나옵니다."],
  ["img","g10_teamreport","팀 보고서 — 최종 체크와 PPT 내보내기"],
  ["ol",["위쪽 **📝 보고서**를 누른 뒤 **팀 보고서** 탭을 누릅니다. 팀장에게만 보이는 탭입니다.","보고할 주를 확인합니다. ◀ ▶로 바꿉니다.","최종 보고할 줄 앞의 **최종**을 체크합니다. 모두 체크 · 모두 해제도 있고, 위에 '최종 보고 2 / 5건'처럼 보입니다. 아래 **보고서 미리보기**가 PPT에 들어갈 모양입니다.","**📥 PPT 내보내기**를 누르면 '주간업무보고_팀이름_날짜.pptx'가 내려받아집니다."]],
  ["ul",["아무 업무도 없으면 팀원들이 아직 보고용 체크를 하지 않은 것입니다. 내 보고서에서 체크해 달라고 요청하세요.","같은 발주처 · 사업명은 보고서에서 한 줄로 합쳐집니다.","내용이 틀렸으면 팀원에게 업무 수정을 요청하세요. 고치면 바로 반영됩니다.","팀원이 보고용 체크를 풀면 그 업무는 빠지고, 빠진 건수가 안내됩니다. 체크는 자동 저장됩니다."]]]],
 ["l3b","우리 팀 공지 쓰기",[
  ["p","팀장은 우리 팀에게만 보이는 공지를 쓸 수 있습니다."],
  ["ol",["위쪽 **📣 팀 공지**를 누릅니다.","아래 **팀 공지 쓰기·고치기**를 누릅니다.","제목과 내용을 쓰고 **게시**를 누릅니다. '팝업'을 켜 두면 안 읽은 팀원에게 접속할 때 바로 뜹니다. 중요한 공지는 📌 고정합니다."]],
  ["tip","공지 내용에 **[[사용법]]**이라고 쓰면 '📖 사용법 바로 열기' 단추가 됩니다."]]],
 ["l4","팀장의 하루와 한 주",[
  ["p","팀장도 하루 처음 10분과 마지막 10분이면 충분합니다. 주의 마지막 날에는 보고가 더해집니다."],
  ["h","매일 처음 10분 (출근 후)"],
  ["chk",["점검 → 팀원 리듬에서 🔴 · 🟡 팀원 확인","기한 지남 · 오래 대기 업무에서 팀장이 도울 일 고르기","주 첫날이면: 이번 주 할 일을 아직 안 쓴 팀원 챙기기 (리듬 '할 일 없음')"]],
  ["h","매일 마지막 10분 (퇴근 전)"],
  ["chk",["팀원을 눌러 계획 대비에서 '이번 주에 미룬 일' 보기","오늘 완료 체크가 없는 팀원이 있으면 한마디 체크하기"]],
  ["h","주 마지막 날 — 마지막 10분 (보고 전)"],
  ["chk",["팀원들에게 내 보고서에서 보고용 체크 요청","팀 보고서에서 최종 보고 체크","📥 PPT 내보내기 → 보고 자료로 사용"]]]]];

const FAQ=[["faq","자주 묻는 질문",[["tbl",["질문","답"],[
  ["비밀번호를 잊었어요","로그인 화면의 '비밀번호를 잊었어요'로 관리자에게 요청하세요. 관리자가 0426으로 초기화하면 로그인해서 바로 새 비밀번호를 정합니다."],
  ["다른 사람 업무를 고칠 수 있나요?","아니요. 업무는 담당자 본인만 고칩니다. 팀장도 볼 수만 있습니다."],
  ["내 목록을 고치면 팀원도 바뀌나요?","아니요. 내 목록은 개인별입니다. 팀 기본 목록은 관리자가 정합니다."],
  ["끝내지 못한 일은 어떻게 되나요?","다음 주로 자동 이월됩니다. 처음 계획과 변경 기록도 같이 따라갑니다."],
  ["종료일을 바꾸면 다 기록되나요?","작성한 날에 고친 건 기록하지 않고, 다음 날부터 바꾼 것만 기록합니다."],
  ["미룬 이유를 팀장도 보나요?","아니요. 팀장은 횟수와 지킴률까지만, 이유는 본인만 봅니다."],
  ["보고서에 내 업무가 안 보여요","내 보고서에서 보고용 체크를 했는지, 보고서 주가 맞는지 확인하세요."],
  ["휴대폰과 PC에서 같이 써도 되나요?","됩니다. 같은 아이디로 로그인하면 내용이 바로 맞춰집니다."],
  ["무엇이 바뀌었는지 알고 싶어요","화면 제목 옆 버전을 누르면 업데이트 기록이 나옵니다."],
  ["전체 공지는 어디서 보나요?","내정보 ▾ → 📢 전체 공지에서 봅니다. 위쪽 📣 팀 공지는 우리 팀 공지와 알림입니다."],
  ["본부장 · 대표이사는 아래 팀을 볼 수 있나요?","네. 조직도에서 조직장으로 지정되면 위쪽 팀 고르기에 아래 팀들이 나옵니다. 업무 · 리듬 · 팀 보고서를 볼 수 있고, 고치는 건 담당자 본인만 합니다."],
  ["이 사용법은 어디서 다시 보나요?","내정보 ▾ → 📖 사용법, 또는 로그인 화면의 📖 사용법"]]]]]];

/* 기능 파일이 등록한 사용법(WK_GUIDE)을 기본 사용법에 끼워 넣음: {feat, mod?, member:[{after,sec}], leader:[{after,sec}], faq:[[질문,답]]}
   after = 이 사용법 칸 다음에 (기능 칸끼리도 가능 'x-wait'), 없으면 맨 뒤. 번호는 보여 줄 때 자동으로 매김 */
function merge(base,key){
  const out=base.slice(),pend=[];
  (typeof WK_GUIDE!=="undefined"?WK_GUIDE:[]).forEach(g=>(g[key]||[]).forEach(x=>pend.push(Object.assign({mod:g.mod},x))));
  let moved=true;while(pend.length&&moved){moved=false;for(let i=0;i<pend.length;i++){const x=pend[i],at=out.findIndex(s=>s[0]===x.after);
    if(at>=0){const sec=x.mod?[x.sec[0],x.sec[1],[["mod",x.mod],...x.sec[2]]]:x.sec;out.splice(at+1,0,sec);pend.splice(i,1);i--;moved=true}}}
  pend.forEach(x=>out.push(x.mod?[x.sec[0],x.sec[1],[["mod",x.mod],...x.sec[2]]]:x.sec));
  return out}
const faqRows=()=>{const rows=FAQ[0][2][0][2].slice(),last=rows.pop();(typeof WK_GUIDE!=="undefined"?WK_GUIDE:[]).forEach(g=>(g.faq||[]).forEach(r=>rows.push(r)));rows.push(last);return [["faq","자주 묻는 질문",[["tbl",["질문","답"],rows]]]]};
const PARTS={member:["팀원편","업무를 직접 쓰고 끝내는 모든 사람이 봅니다. 팀장도 내 업무는 이대로 씁니다.",()=>merge(MEMBER,"member")],
  leader:["팀장편","팀원의 업무를 보고 모아 보고서를 만드는 팀장이 봅니다.",()=>merge(LEADER,"leader")],
  faq:["자주 묻는 질문","",faqRows]};
window.wkGuideSections=k=>PARTS[k][2]();   // 점검 도구가 사용법 내용을 확인할 때 씀

function block(b){
  const [k,a,c]=b;
  if(k==="mod"){const on=typeof F==="function"&&F("modOn",a);return `<div class="gd-mod${on?" on":""}">🧩 <b>기능 더하기</b>에서 켜는 기능이에요. ${on?"<b>✓ 지금 켜져 있어요</b>":`<button type="button" class="nguide" data-modon="${esc(a)}">지금 켜기</button>`}</div>`}
  if(k==="p")return `<p>${B(a)}</p>`;
  if(k==="h")return `<h4>${B(a)}</h4>`;
  if(k==="tip")return `<div class="gd-tip">${B(a)}</div>`;
  if(k==="img")return `<figure class="gd-fig"><button type="button" class="gd-zoom" data-gz="${a}" aria-label="${esc(c)} 크게 보기"><img src="${IMG(a)}" alt="${esc(c)}" loading="lazy" width="1280" height="800"></button><figcaption>${esc(c)}<span>눌러서 크게</span></figcaption></figure>`;
  if(k==="ol")return `<ol class="gd-ol"${c>1?` style="counter-reset:gd ${c-1}"`:""}>${a.map(x=>`<li>${B(x)}</li>`).join("")}</ol>`;   // ["ol",[...],3] → 3번부터
  if(k==="ul")return `<ul class="gd-ul">${a.map(x=>`<li>${B(x)}</li>`).join("")}</ul>`;
  if(k==="chk")return `<ul class="gd-chk">${a.map(x=>`<li><label><input type="checkbox"><span>${B(x)}</span></label></li>`).join("")}</ul>`;
  if(k==="tbl")return `<div class="gd-tw"><table class="gd-tbl"><thead><tr>${a.map(x=>`<th>${B(x)}</th>`).join("")}</tr></thead><tbody>${c.map(r=>`<tr>${r.map(x=>`<td>${B(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  return "";
}

const G={tab:"",el:null,spy:null,prevFocus:null};
function build(){
  const el=document.createElement("section");el.id="guidePage";el.className="gd";el.hidden=true;
  el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-label","rhy:se 사용법");
  el.innerHTML=`<div class="gd-top"><div class="gd-bar">
      <button type="button" class="btn" id="gdBack">← 돌아가기</button>
      <h2>📖 사용법<small id="gdVer"></small></h2>
      <div class="tabs gd-tabs" role="tablist">${Object.entries(PARTS).map(([k,v])=>`<button type="button" class="tab" role="tab" data-gt="${k}">${v[0]}</button>`).join("")}</div>
    </div></div>
    <div class="gd-main"><nav class="gd-toc" id="gdToc" aria-label="목차"></nav><article class="gd-body" id="gdBody"></article></div>
    <div class="gd-lb" id="gdLb" hidden><img alt=""><button type="button" class="gd-lbx" aria-label="닫기">✕</button></div>`;
  document.body.appendChild(el);G.el=el;
  el.querySelector("#gdBack").onclick=()=>closeGuide();
  el.querySelectorAll("[data-gt]").forEach(b=>b.onclick=()=>show(b.dataset.gt,true));
  el.querySelector("#gdToc").addEventListener("click",e=>{const a=e.target.closest("[data-go]");if(!a)return;e.preventDefault();go(a.dataset.go)});
  el.querySelector("#gdBody").addEventListener("click",e=>{
    const z=e.target.closest("[data-gz]");if(z){const lb=$("gdLb");lb.querySelector("img").src=IMG(z.dataset.gz);lb.querySelector("img").alt=z.getAttribute("aria-label");lb.hidden=false;return}
    const t=e.target.closest("[data-gt-go]");if(t)show(t.dataset.gtGo,true);
  });
  $("gdLb").onclick=()=>{$("gdLb").hidden=true};
  el.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();if(!$("gdLb").hidden)$("gdLb").hidden=true;else closeGuide()}});
}
function show(tab,anim){
  G.tab=tab;const [name,lead,mk]=PARTS[tab];let n=0;
  const secs=mk().map(s=>s[0]==="start"||s[0]==="faq"?s:[s[0],`${++n}. ${s[1]}`,s[2]]);
  G.el.querySelectorAll("[data-gt]").forEach(b=>{const on=b.dataset.gt===tab;b.classList.toggle("active",on);b.setAttribute("aria-selected",on)});
  $("gdToc").innerHTML=`<div class="gd-toch">${esc(name)} 목차</div>`+secs.map(([id,t])=>`<a href="#" data-go="${id}">${esc(t)}</a>`).join("");
  const other=tab==="member"?"leader":"member";
  $("gdBody").innerHTML=`<header class="gd-head"><h1>${esc(name)}</h1>${lead?`<p>${esc(lead)}</p>`:""}</header>`+
    secs.map(([id,t,bs])=>`<section class="gd-sec" id="gd-${id}"><h3>${esc(t)}</h3>${bs.map(block).join("")}</section>`).join("")+
    (tab==="faq"?"":`<div class="gd-next"><button type="button" class="btn" data-gt-go="${other}">${PARTS[other][0]} 보기 →</button><button type="button" class="btn ghost" data-gt-go="faq">자주 묻는 질문</button></div>`);
  G.el.scrollTop=0;G.el.style.setProperty("--gd-top",G.el.querySelector(".gd-top").offsetHeight+"px");
  if(anim&&typeof wkIn==="function")wkIn($("gdBody"));
  spy();
}
function go(id){const s=$("gd-"+id);if(!s)return;const top=G.el.querySelector(".gd-top").offsetHeight+(innerWidth<=760?G.el.querySelector(".gd-toc").offsetHeight:0)+8;
  G.el.scrollTo({top:s.offsetTop-top,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}
function spy(){
  if(G.spy)G.spy.disconnect();
  if(!("IntersectionObserver" in window))return;
  const links=[...$("gdToc").querySelectorAll("[data-go]")];
  G.spy=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){const id=e.target.id.slice(3);links.forEach(a=>{const on=a.dataset.go===id;a.classList.toggle("on",on);if(on&&innerWidth<=760){const t=$("gdToc");t.scrollTo({left:a.offsetLeft-(t.clientWidth-a.offsetWidth)/2,behavior:"smooth"})}})}})},{root:G.el,rootMargin:"-30% 0px -60% 0px"});
  G.el.querySelectorAll(".gd-sec").forEach(s=>G.spy.observe(s));
}
window.openGuide=function(tab){
  if(!G.el)build();
  const me=typeof st!=="undefined"&&st.me;const lead=me&&(me.role==="leader"||me.is_admin);
  $("gdVer").textContent=" v"+V();
  G.prevFocus=document.activeElement;
  G.el.hidden=false;document.documentElement.classList.add("gd-open");
  show(tab||G.tab||(lead?"leader":"member"),false);
  try{store.set("wk-guide-seen","1")}catch(_){}
  setTimeout(()=>{const b=$("gdBack");b&&b.focus({preventScroll:true})},30);
  if(location.hash!=="#guide")try{history.pushState(null,"","#guide")}catch(_){}
};
window.closeGuide=function(fromHash){
  if(!G.el||G.el.hidden)return;
  G.el.hidden=true;document.documentElement.classList.remove("gd-open");$("gdLb").hidden=true;
  if(!fromHash&&location.hash==="#guide")try{history.back()}catch(_){}
  if(G.prevFocus&&G.prevFocus.focus)try{G.prevFocus.focus({preventScroll:true})}catch(_){}
};
window.addEventListener("popstate",()=>{if(G.el&&!G.el.hidden&&location.hash!=="#guide")closeGuide(true)});
})();
