/* 📖 사용법 (내정보 → 사용법 · 로그인 화면 · 공지의 [[사용법]] · 주소 #guide 로 열림). 열 때만 불러옴 */
(function(){
const V=()=>typeof APP_VERSION!=="undefined"?APP_VERSION:"";
const GUIDE_BASE="3.28.5";   // 이 사용법이 맞춰진 버전 (사용법 최신화할 때만 올림 — ideas/사용법_반영대기.md)
const IMG=n=>(window.WK_GIMG&&WK_GIMG[n])||`img/guide/${n}.webp?v=${V()}`;
const B=s=>esc(s).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");

/* 내용: [종류, ...]  p 문단 · img 캡처 · ol 번호(캡처의 빨간 번호와 같음) · ul 점 · h 소제목 · tbl 표 · chk 체크 목록 · tip 팁 상자 */
const RHYTHM=["tbl",["언제","팀원","팀장"],[
  ["매일 처음 10분 (출근 후)","🔔 알림 확인 · 점검 → 먼저 할 일 확인 · 오늘 할 일의 상태와 일정 확인 · 새로 생긴 일 추가","🔔 알림 확인 · 팀원 리듬 색으로 밀린 사람 확인 · 확인할 업무 살피기"],
  ["매일 마지막 10분 (퇴근 전)","끝낸 일 완료 체크 · 메모 남기기 · 못 지킬 일은 종료일 미루고 이유 고르기","오늘 미룬 일 · 오래 대기 살피기"],
  ["주 첫날 처음 10분","이번 주 할 일 쓰기 · 시작일 → 종료일 정하기","할 일을 아직 안 쓴 팀원 챙기기"],
  ["주 마지막 날 마지막 10분","다음 주 계획 · 내 보고서에서 보고용 체크","팀 보고서에서 최종 체크 · PPT 내보내기"]]];
const START=["start","한눈에 보기",[
  ["p","rhy:se의 기본은 **하루의 처음 10분, 마지막 10분**입니다. 출근해서 10분 동안 오늘 할 일을 정하고, 퇴근 전 10분 동안 오늘 한 일을 정리하면 리듬이 자동으로 쌓입니다. 주의 첫날과 마지막 날에는 그 10분에 한 주 계획과 보고가 더해집니다."],
  RHYTHM,
  ["h","이 앱의 약속"],
  ["ul",["**내 업무는 나만 고칩니다.** 팀장님도 대신 고치지 않습니다.","**미룬 이유는 나만 봅니다.** 미뤄도 괜찮습니다. 숨기지 않는 것이 더 중요합니다.","**숫자는 성적표가 아닙니다.** 리듬 · 지킴률은 박자를 맞추는 신호입니다.","**🤝 Co-work 요청은 부탁입니다.** 넣을지는 받은 사람이 정하고, 넣어도 내 목표로 세지 않습니다."]],
  ["p","접속 주소는 **conetsys.github.io/weekly** 입니다. PC와 휴대폰 모두 같은 주소를 씁니다."],
]];

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
  ["h","알림 · 공지와 내정보 메뉴"],
  ["img","g02b_menu","🔔 알림 · 📣 팀 공지와 내정보 ▾ 메뉴"],
  ["ol",["**🔔 알림**: 나에게 온 알림(🤝 Co-work · 안 읽은 공지 · 💬 의견 답변 · 📦 입고·회신 대기)이 한 목록으로 모입니다. 숫자가 붙어 있으면 새 알림입니다.","**📣 팀 공지**: 우리 팀 공지만 모아 봅니다.","**📢 전체 공지**: 회사 전체 공지는 내정보 ▾ 안에 있습니다. 새 글이 있으면 내정보에 빨간 점이 뜹니다.","**🧩 기능 더하기**: 필요한 기능을 골라 켭니다. (아래 '기능 더하기')","**💬 의견 보내기**: 불편한 점 · 바라는 점을 남기고 👍 공감합니다. 그 아래 **💾 내 일정 내려받기**로 내 업무를 엑셀로 받습니다."]],
  ["h","그 밖에 눈에 띄는 것들"],
  ["ul",["맨 위 **◀ 이번주 ▶**: 주를 옮깁니다. '이번주로'를 누르면 돌아옵니다.","**이름 단추 줄**(전체 · 내 이름 · 팀원들): 누른 사람의 업무만 보입니다. 사람이 많으면 끝의 **🔎 +n명**을 눌러 이름으로 찾습니다.","**내정보 ▾**: 📢 전체 공지 · 🧩 기능 더하기 · 💬 의견 보내기 · 💾 내 일정 내려받기 · 비밀번호 바꾸기 · 📖 사용법 · 로그아웃","위쪽 **📝 회의록**: 회의록을 쓰고 봅니다. (📝 회의록 사용법) **📐 사업 관리**는 사업관리를 쓰는 팀에만 보입니다.","휴대폰에서는 위쪽이 한 줄로 줄고, 단추는 **아래 메뉴**에 있습니다. (아래 '휴대폰에서는 아래 메뉴')","제목 옆 **버전**: 누르면 업데이트 기록이 나옵니다."]]]],
 ["m3","업무 하나 쓰기",[
  ["p","**+ 업무 추가**를 누르면 오른쪽에 업무 창이 열립니다. 위에서부터 차례로 채우고 저장하면 끝입니다."],
  ["img","g03a_form","업무 창 위쪽 — 고객사 · 대상사업 · 구분 (1~3)"],
  ["img","g03b_form","업무 창 아래쪽 — 할일 · 일정 · 상태 · 저장 (4~7)"],
  ["ol",["**고객사**를 고릅니다. 목록에 없으면 맨 아래 **+ 새 고객사…**를 고르고 이름을 씁니다. 팀 내부 일은 **내부**를 고릅니다.","**대상사업**을 누르면 목록이 나옵니다. 고르거나 새로 씁니다. 필요하면 아래 품목 · 관리번호 · 협력사도 채웁니다 (선택).","**구분**을 고릅니다. 처음엔 '선택하세요'로 비어 있으니 꼭 골라 주세요. 예: 수검, 시정조치","**할일**에 이번 주에 할 일을 한 줄로 씁니다. 예: 고객 수검 입회","**시작일 → 종료일** 칸을 누르면 달력이 열립니다. (아래 달력)","**상태**를 고릅니다. 보통은 진행입니다.","**저장**을 누릅니다."]],
  ["h","달력에서 기간 고르기"],
  ["img","g04_calendar","달력 — 시작일과 종료일을 차례로 클릭"],
  ["ol",["시작하는 날을 누릅니다.","끝내는 날을 누릅니다. 그 사이가 칠해지고 달력이 저절로 닫힙니다.","닫히지 않았다면 **완료**를 누릅니다."]],
  ["ul",["종료일만 빠르게 정하려면 칸 아래 **오늘 · 이번주 금 · 그다음 주 금** 단추를 누릅니다.","다음 주에 할 일을 미리 정해 두려면 같은 창의 **다음주 계획**에 씁니다. **↓ 이번주 내용 가져오기**를 누르면 그대로 복사됩니다. 다음 주가 되면 이번주 칸으로 자동으로 올라갑니다.","작성일은 처음 저장한 날이 자동으로 들어갑니다. 목록에 없던 값을 새로 쓰면 내 목록에도 자동으로 추가됩니다."]],
  ["tip","**회의**면 업무 창 맨 위 **📅 회의**를 켭니다. 제목 · 일시 · 참석 요청만 쓰면 초대가 가고 회의록이 만들어집니다."],
  ["go","meetuse","📝 회의록 사용법 보기 →"]]],
 ["m3d","한 주만 지우기 · 업무 삭제",[
  ["ol",["업무 창의 **이번주 할일** 또는 **다음주 계획** 칸 머리에서 **이 주 비우기**를 누릅니다.","칸이 접히고 안내가 뜹니다. 잘못 눌렀으면 **되돌리기**.","**저장**하면 그 주만 지워지고 다른 주는 그대로 남습니다."]],
  ["ul",["이번주를 **완료**로 저장할 때 미리 세운 다음주 계획이 있으면 **\"미리 세운 다음주 계획은 지울까요?\"**라고 한 번 묻습니다. **지우기** 또는 **그대로 두기**를 고릅니다.","아래 **업무 전체 삭제**는 모든 주를 지웁니다. 이번주 · 다음주가 다 있으면 **다음주만 지우기**도 고를 수 있습니다."]]]],
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
  ["tbl",["보기","이럴 때 좋아요"],[["▦ 캘린더로 보기","한 달 일정을 막대로 볼 때. 날짜를 누르면 그날 업무와 '+ 이날 업무 추가'"],["표로 보기","지난주 · 이번주 · 다음주를 한 줄에 볼 때"],["☰ 목록으로 보기","할 일을 체크할 때. ⠿를 끌어 내 순서를 정하고, 제목을 눌러 정렬"],["🤝 Co-work","받은 계획 · 보낸 계획과 코멘트를 볼 때"]]],
  ["ul",["**끝난 일**: 숨기기 · 최근만 · 전부 중 고릅니다.","**찾기**: 검색칸(사업 · 품목 · 관리번호 · 협력사)과 **필터**(구분 · 고객사)","위쪽 **상태 숫자**(진행 · 대기 · 완료 · 신규 · 이월 · 기한 지남 · 오래 대기)를 누르면 그 업무만 보입니다. 다시 누르거나 **전체 보기**로 돌아옵니다."]],
  ["h","표시의 뜻"],
  ["tbl",["표시","뜻"],[["이월","지난 주에 안 끝나 넘어온 일"],["기한 지남","종료일이 지났는데 완료 안 됨"],["오래 대기","2주 넘게 대기"],["↻2","일정을 2번 바꿈 (마우스를 올리면 처음 종료일)"],["11/3~11/6","시작일~종료일"],["11/2 작성","처음 쓴 날"],["🤝 ○○님 계획 (보라)","Co-work 로 내 계획에 넣은 다른 분의 계획 (보기 전용, 내 목표로 세지 않음)"],["🤝 Co-work · ○○ (초록)","내가 Co-work 요청을 보낸 업무"]]]]],
 ["m7","점검 — 내 리듬 보기",[
  ["p","매일 처음 10분에는 먼저 할 일을, 마지막 10분에는 오늘 무엇을 끝내고 무엇이 밀렸는지를 봅니다. 점검은 평가가 아니라 나를 비추는 거울입니다."],
  ["img","g07_rhythm","점검 — 내 리듬"],
  ["ol",["위쪽 **점검** 탭을 누릅니다.","**이번 주 상태**: 🟢 좋은 리듬 · 🟡 조금 서둘러야 해요 · 🔴 밀리고 있어요. 완료 건수와 기한 지난 일이 함께 나옵니다. 가운데 그래프는 최근 8주 완료율이고, 점선은 4주 평균입니다.","**먼저 할 일**: 종료일이 가까운 순서 다섯 개입니다. 누르면 그 업무가 열립니다.","**계획 대비**: 최근 8주 끝낸 일을 처음 정한 종료일 기준으로 나눕니다. 계획 지킴률, 이번 주에 미룬 일, 내가 자주 미루는 이유가 보입니다."]],
  ["tip","이번 주 할 일을 아직 안 썼다면 상태 칸에 **+ 이번 주 할 일 작성하기** 버튼이 나옵니다."]]],
 ["m8","내 보고서에서 보고할 업무 고르기",[
  ["p","**주 마지막 날 마지막 10분**에 보고할 업무에 체크만 하면 팀장님의 팀 보고서로 올라갑니다."],
  ["img","g08_myreport","내 보고서 — 보고용 체크"],
  ["ol",["위쪽 **📝 보고서**를 누르면 **내 보고서** 탭이 열립니다.","주를 확인합니다. '11/02~11/06 작성분 → 11/09 주 보고'는 이번 주에 쓴 내용을 다음 주 회의에서 보고한다는 뜻입니다. ◀ ▶로 바꿉니다.","보고할 줄 앞의 **보고용**을 체크합니다. 자동으로 저장되고, 위에 '보고용 2 / 5건'처럼 보입니다.","아래 **내 보고 미리보기**에서 팀 보고서에 들어갈 모양을 확인합니다."]],
  ["ul",["지난주에 보고한 업무에는 **지난주 보고** 표시가 붙습니다. 위쪽 **↺ 지난주 그대로 체크**를 누르면 한 번에 체크되고, 빠질 것만 풀면 됩니다.","내용을 고치려면 **← Weekly Plan**으로 돌아가 업무를 수정합니다. 보고서에 바로 반영됩니다.","고객사가 '내부'이거나 대상사업이 없는 업무는 보고서 아래쪽에 모입니다."]],
  ["h","팀 보고가 어떻게 나갔는지 보기"],
  ["img","g25_snapshot","📝 보고서 → 📌 확정 보고"],
  ["p","팀장이 이 주 보고를 **확정**하면, 보고서의 **📌 확정 보고** 탭에서 우리 팀 보고를 그대로 볼 수 있습니다. 확정본은 업무를 고쳐도 바뀌지 않고, **확정본 PPT**도 내려받을 수 있습니다. ◀ ▶로 지난 보고도 봅니다."]]]];

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
  ["h","확정해서 보관 · 공유하기"],
  ["ol",["최종을 다 골랐으면 **📌 이 주 보고 확정**을 누릅니다. 그 순간의 보고가 그대로 보관됩니다.","팀원 모두 보고서의 **📌 확정 보고** 탭에서 확정본을 봅니다. 본부장 · 대표이사도 봅니다.","확정 뒤에 팀원이 업무를 고쳐도 확정본은 그대로입니다. 바뀐 내용을 넣으려면 **📌 다시 확정**을 누릅니다."]],
  ["ul",["다음 주에는 지난주 최종이었던 업무에 **지난주 최종** 표시가 붙고, **↺ 지난주 최종 그대로**로 한 번에 체크합니다.","지난주 최종이었는데 팀원이 아직 보고용 체크를 안 한 업무가 있으면 이름으로 알려 줍니다."]],
  ["ul",["아무 업무도 없으면 팀원들이 아직 보고용 체크를 하지 않은 것입니다. 내 보고서에서 체크해 달라고 요청하세요.","같은 발주처 · 사업명은 보고서에서 한 줄로 합쳐집니다.","내용이 틀렸으면 팀원에게 업무 수정을 요청하세요. 고치면 바로 반영됩니다.","팀원이 보고용 체크를 풀면 그 업무는 빠지고, 빠진 건수가 안내됩니다. 체크는 자동 저장됩니다."]]]],
 ["l3b","우리 팀 공지 쓰기",[
  ["p","팀장은 우리 팀에게만 보이는 공지를 쓸 수 있습니다."],
  ["ol",["위쪽 **📣 팀 공지**를 누릅니다.","아래 **팀 공지 쓰기·고치기**를 누릅니다.","제목과 내용을 쓰고 **게시**를 누릅니다. '팝업'을 켜 두면 안 읽은 팀원에게 접속할 때 바로 뜹니다. 중요한 공지는 📌 고정합니다."]],
  ["tip","공지 내용에 **[[사용법]]**이라고 쓰면 '📖 사용법 바로 열기' 단추가 됩니다."]]],
 ["l4","팀장의 하루와 한 주",[
  ["p","팀장도 하루 처음 10분과 마지막 10분이면 충분합니다. 주의 마지막 날에는 보고가 더해집니다."],
  ["h","매일 처음 10분 (출근 후)"],
  ["chk",["점검 → 팀원 리듬에서 🔴 · 🟡 팀원 확인","점검 → **확인할 업무**(기한 지남 · 오래 대기 · 이월)에서 팀장이 도울 일 고르기","주 첫날이면: 이번 주 할 일을 아직 안 쓴 팀원 챙기기 (리듬 '할 일 없음')"]],
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
  ["팀 보고가 어떻게 나갔는지 보고 싶어요","📝 보고서 → 📌 확정 보고 탭에서 팀장이 확정한 보고를 그대로 봅니다. 확정 전이면 비어 있습니다."],
  ["휴대폰과 PC에서 같이 써도 되나요?","됩니다. 같은 아이디로 로그인하면 내용이 바로 맞춰집니다."],
  ["무엇이 바뀌었는지 알고 싶어요","화면 제목 옆 버전을 누르면 업데이트 기록이 나옵니다."],
  ["전체 공지는 어디서 보나요?","내정보 ▾ → 📢 전체 공지에서 봅니다. 위쪽 📣 팀 공지는 우리 팀 공지만, 🔔 알림은 나에게 온 알림을 모아 봅니다."],
  ["알림을 놓쳤어요","🔔 알림에 다시 모여 있습니다. 오른쪽 아래 안내 창을 닫아도 알림 목록에는 남습니다."],,
  ["본부장 · 대표이사는 아래 팀을 볼 수 있나요?","네. 조직도에서 조직장으로 지정되면 위쪽 팀 고르기에 아래 팀들이 나옵니다. 업무 · 리듬 · 팀 보고서를 볼 수 있고, 고치는 건 담당자 본인만 합니다."],
  ["회의록 쓰는 법은 어디서 보나요?","사용법 맨 위 **📝 회의록**을 누르거나, 회의록 화면의 **📖 사용법**을 누릅니다."],
  ["이 사용법은 어디서 다시 보나요?","내정보 ▾ → 📖 사용법, 또는 로그인 화면의 📖 사용법"]]]]]];

/* ---------- 📐 사업관리 매뉴얼 (사업관리 화면의 📖 · v3.25.1) ---------- */
const PM_START=["start","한눈에 보기",[
  ["p","**📐 사업관리**는 개발사업의 일정을 팀이 함께 관리하는 곳입니다. 대공정 ▸ 하부 공정으로 일정을 세우고, 주마다 계획과 실적을 적고, 간트로 전체 흐름을 봅니다."],
  ["tbl",["","rhy:se 주간 업무","📐 사업관리"],[["무엇을","내 한 주 업무 정리 · 팀 보고","개발사업의 공정 · 일정"],["누가 고치나","내 업무는 나만","사업에 참여하는 팀 사람 누구나"],["주소","conetsys.github.io/weekly","conetsys.github.io/weekly/pm (같은 로그인)"]]],
  ["h","정보는 한 방향으로만"],
  ["p","사업관리의 일정 중 **내가 할 것만 골라 → rhy:se 이번 주 계획**으로 옮깁니다. 옮긴 뒤에는 서로 따라가지 않습니다. rhy:se에서 고쳐도 사업관리는 그대로이고, 그 반대도 같습니다. rhy:se 업무가 사업관리로 저절로 들어오는 일은 없습니다."],
  ["h","여는 방법"],
  ["ul",["rhy:se 위쪽의 **📐 사업 관리** 단추를 누릅니다. 사업관리 화면 왼쪽 위의 **rhy:se 주간 업무**를 누르면 돌아갑니다.","회사가 사업관리를 켜고, **우리 팀 팀장이 팀에서 켜야** 보입니다. 단추가 없으면 팀장님께 여쭤 보세요.","이 매뉴얼은 사업관리 화면 오른쪽 위 **📖**에서 다시 볼 수 있습니다."]]]];
const PM_USE=[PM_START,
 ["p1","화면 구성",[
  ["p","위쪽 탭 줄에서 보고 싶은 것을 고릅니다."],
  ["img","p01_list","사업관리 첫 화면 — 사업 목록"],
  ["ol",["**탭**: 사업 목록 · 내 공정 · 살펴볼 곳(팀장 · 책임자) · 받은 요청(상급자 · 대표). 사업을 열면 그 사업 이름 탭이 하나 더 생깁니다.","**+ 새 사업**(팀장) 또는 **+ 사업 추가 요청**(팀원)","**✋ 사업 추가 요청**: 팀원이 보낸 요청이 있으면 팀장 화면 맨 위에 보입니다.","**진행 중 · 끝난 사업 · 전체**로 거르고, 오른쪽 칸에서 사업명 · 번호 · 고객사 · 책임자로 찾습니다. 표 제목을 누르면 정렬됩니다."]],
  ["ul",["표에서 사업을 누르면 그 사업이 열립니다.","**📣**: 사업 공지. 안 본 공지가 있으면 숫자가 붙고, 들어올 때 한 번 뜹니다.","**🔔**: 담당 지정 · 메모 · 검토 의견 · 요청 결과 같은 알림이 rhy:se 알림과 함께 모입니다."]]]],
 ["p2","사업 화면 읽기",[
  ["img","p02_head","사업 화면 위쪽"],
  ["ol",["**진행 숫자**: 하부 공정 기준입니다. 완료(끝낸 수/전체) · 지남(완료일이 지났는데 안 끝남) · 준수(완료일 안에 끝냄) · 미준수(늦게 끝냄) · 7일↑(7일 넘게 늦게 끝냄) · 달성율(끝낸 것 중 제때 끝낸 비율). 📥로 엑셀을 받습니다.","**공정 흐름**: 대공정이 차례로 놓입니다. 초록은 다 끝남, 빨강은 늦음, 굵은 테두리는 지금 하는 공정입니다. 누르면 그 대공정으로 갑니다.","**보기 셋**: 공정 · 일정 / 주차별 계획 · 실적 / 간트","**☑ 골라서 rhy:se로** · **+ 대공정** · **🕘 바뀐 기록**"]],
  ["tip","목록을 내려도 이 위쪽과 표의 제목 줄은 붙어 있습니다. 사업 공지가 있으면 보기 셋 아래 한 줄로 보이고, 누르면 열립니다."]]],
 ["p3","공정 · 일정 고치기",[
  ["p","사업에 참여하는 팀 사람이면 누구나 바로 고칩니다. 칸을 고치면 **저절로 저장**되고, 여러 명이 함께 고쳐도 서로 덮어쓰지 않습니다."],
  ["img","p03_tree","공정 · 일정 — 대공정 ▸ 하부 공정"],
  ["ol",["**완료 체크**: 하부 공정을 끝내면 앞의 칸을 누릅니다. 끝낸 날이 남고, 상태에 '완료 · 제때 / n일 먼저 / n일 늦음'이 붙습니다.","**담당**: 눌러서 고릅니다. 이름 한두 글자로 찾을 수 있습니다. 담당이 된 사람에게 🔔 알림이 갑니다.","**시작 · 완료**: 날짜를 고칩니다. 대공정 줄은 아래 하부 공정 일정을 묶어 보여 줍니다.","**산출물**: 이 공정에서 나올 자료를 적습니다.","**상태**: D-9(9일 남음) · 3일 지남 · 완료처럼 저절로 붙습니다.","**💬**: 메모를 남깁니다. 숫자는 메모 수입니다.","**→ rhy:se**: 이 공정을 내 rhy:se 계획으로 옮깁니다. (아래 'rhy:se로 옮기기')"]],
  ["ul",["**+ 하부 공정**: 대공정 아래 맨 끝에 한 줄을 더합니다. **+ 대공정**은 위쪽 보기 줄에 있습니다.","**⋮⋮**를 끌면 줄이 손을 따라 움직이고 다른 줄이 비킵니다. 다른 대공정 아래로도 옮길 수 있습니다.","대공정 앞 **▾**를 누르면 접고 펼칩니다.","**🕘 바뀐 기록**: 누가 언제 무엇을 바꿨는지 봅니다. 사람 · 종류로 거르고, 줄을 누르면 그 공정으로 갑니다."]]]],
 ["p4","주차별 계획 · 실적",[
  ["p","하부 공정마다 주 단위로 **이번 주 할 것 · 한 것 · 특이사항**을 적습니다. 팀장은 이 표 하나로 이번 주 흐름을 봅니다."],
  ["img","p04_week","주차별 계획 · 실적"],
  ["ol",["**이번 주 기록**: 사람마다 '진행 중인 하부 공정 중 이번 주에 적은 수'가 보입니다.","**사람 고르기**: 전체 · 나 · 사람별로 거릅니다.","**칸**을 누르면 그 주의 할 것 · 한 것 · 특이사항을 적는 칸이 열립니다. 적으면 저절로 저장됩니다.","**◀ 이번 주 ▶**로 앞뒤 주를 봅니다. 한 번에 6주가 보입니다."]],
  ["ul",["칸에는 할 것이 그대로, 한 것은 **✓**, 특이사항은 **⚠**로 보입니다.","칸 색의 뜻은 표 아래 범례에 있습니다: 한 것 있음 · 계획 · 지난 주 계획만 있고 실적 없음 · 진행 중인데 기록 없음."]],
  ["tip","칸의 **→ rhy:se**를 누르면 그 주에 적은 계획이 rhy:se 할일로, 특이사항이 메모로 채워집니다."]]],
 ["p5","간트로 전체 보기",[
  ["img","p05_gantt","간트"],
  ["p","대공정 · 하부 공정 일정을 막대로 봅니다. 연한 막대는 대공정, 진한 파랑은 진행 · 예정, 초록은 완료, 빨강은 지남입니다. 빨간 세로선이 오늘입니다. 이름을 누르면 공정 · 일정에서 그 줄이 열립니다."]]],
 ["p6","rhy:se 이번 주 계획으로 옮기기",[
  ["p","사업관리의 일정 중 **이번 주에 내가 할 것만** rhy:se로 옮깁니다. 옮기면 rhy:se 업무에 **📐** 표시가 붙습니다."],
  ["img","p06_send","→ rhy:se — 옮기기 전에 한 번 고치기"],
  ["ol",["**이번 주 · 다음 주** 중 어느 주 계획으로 넣을지 고릅니다.","**할일 · 기한 · 구분 · 상태**를 필요한 것만 고칩니다. 사업 · 고객사 · 품목(대공정)은 저절로 채워집니다.","**작성**을 누르면 rhy:se로 넘어가지 않고 그 자리에서 내 계획에 들어갑니다. 안 들어간 줄만 남아 다시 고칠 수 있습니다."]],
  ["ul",["옮기는 곳은 셋입니다: 하부 공정 줄의 **→ rhy:se**, 주차별 칸의 **→ rhy:se**, 여러 개를 한 번에 옮기는 **☑ 골라서 rhy:se로**(골라서 아래 막대의 → rhy:se).","옮긴 뒤에는 서로 따라가지 않습니다. 사업관리의 완료 체크는 사업관리에서, rhy:se 완료는 rhy:se에서 합니다."]]]],
 ["p7","내 공정 · 알림",[
  ["p","**내 공정** 탭에는 여러 사업에서 내가 담당인 하부 공정이 모입니다. 늦어진 것 → 곧 할 것 → 그다음 순서입니다."],
  ["ul",["줄마다 **이번 주 적기 · 완료 · → rhy:se**를 바로 누릅니다.","줄을 누르면 그 사업의 그 공정으로 갑니다.","담당이 되거나, 내 공정에 메모 · 검토 의견이 달리면 🔔 알림에 뜹니다."]]]],
 ["p8","사업 추가 요청하기 (팀원)",[
  ["p","사업은 팀장이 만듭니다. 팀원은 위쪽 **+ 사업 추가 요청**으로 사업명 · 번호 · 고객사 · 기간 · 책임자 · 사유를 적어 보냅니다."],
  ["ul",["팀장이 **수락**하면 그 순간 사업이 만들어지고, 🔔 알림이 옵니다. 팀장이 고쳐서 수락할 수도 있습니다.","**반려**되면 사유가 🔔 알림으로 옵니다."]]]]];
const PM_LEAD=[PM_START,
 ["q1","팀에서 사업관리 켜기",[
  ["ol",["rhy:se에서 **내정보 ▾ → 🧩 기능 더하기**를 누릅니다.","맨 위 **👥 우리 팀 설정**에서 **📐 사업 관리**를 켭니다.","팀 공지로 팀원에게 알려지고, 팀원 화면에 📐 사업 관리 단추가 생깁니다."]],
  ["tip","회사에서 사업관리를 켜 두어야 팀 설정에 보입니다 (관리자: ⚙ 관리 → 회사 설정 → 옵션 기능)."]]],
 ["q2","새 사업 만들기",[
  ["ol",["**+ 새 사업**을 누릅니다.","사업명(제품 · 체계 이름) · 사업 번호 · 고객사 · 시작일 · 완료 예정일 · 책임자를 적습니다.","**만들기**를 누르면 표준 공정이 들어갑니다: Kick-off/SRR·SFR → HDD → PDR → CDR → 시제 생산 · 조립 → TRR → 환경시험 → 납품. 기간에 맞춰 목표일이 나뉩니다."]],
  ["ul",["공정을 처음부터 짜려면 **기본 공정 없이 빈 사업으로 만들기**를 켜고 만듭니다.","만든 뒤 대공정 · 하부 공정은 사업에 참여하는 사람 누구나 고칩니다.","사업 정보(이름 · 번호 · 고객사 · 기간 · 책임자)는 사업 화면의 **⚙ 사업 정보**에서 책임자 · 팀장이 고칩니다."]]]],
 ["q3","사업 추가 요청 처리",[
  ["p","팀원이 요청하면 사업 목록 맨 위에 **✋ 사업 추가 요청**이 보이고 🔔 알림이 옵니다."],
  ["ul",["**수락**: 요청 그대로 사업을 만듭니다.","**고쳐서 수락**: 새 사업 칸에 요청 내용이 채워진 채 열립니다. 고쳐서 만듭니다.","**반려**: 사유를 적으면 요청한 사람에게 🔔 알림으로 갑니다.","한 번 처리한 요청은 다시 처리되지 않습니다."]]]],
 ["q4","살펴볼 곳",[
  ["p","팀장 · 책임자에게만 보이는 탭입니다. 도움이 필요한 공정을 사업마다 한 표로 모읍니다."],
  ["img","p07_block","살펴볼 곳"],
  ["ul",["**지남**: 완료일이 지났는데 안 끝난 공정","**지난주 계획만**: 지난주에 할 것을 적었는데 한 것이 없는 공정","**이번 주 기록 없음**: 진행 중인데 이번 주 칸이 빈 공정","위 숫자를 누르면 그것만 거릅니다. **열기**를 누르면 그 공정으로 갑니다.","'누가 잘못했나'가 아니라 **팀장이 풀어 줄 곳**이라는 표시입니다. 담당자와 이야기를 시작하는 데 쓰세요."]]]],
 ["q5","사업 공지 · 검토 의견",[
  ["ul",["**📣 → + 공지 쓰기**: 사업을 골라 공지를 씁니다(팀장). 그 사업 화면 위에 한 줄로 보이고, 안 본 사람에게는 들어올 때 한 번 뜹니다.","**💬**에서 **검토 의견**으로 남기면 담당자 🔔 알림에 '검토 의견'으로 뜹니다 (팀장 · 책임자). 메모는 누구나 남깁니다."]]]],
 ["q6","사업 삭제 요청",[
  ["p","팀장 · 책임자는 사업을 바로 지우지 않고 **삭제 요청**을 보냅니다. 삭제는 팀 위 상급자(조직도의 바로 위 조직장) 또는 대표가 합니다."],
  ["ol",["사업 화면의 **⚙ 사업 정보**를 엽니다.","**삭제 요청**을 누르고 사유를 적어 보냅니다.","결과(삭제 · 반려)는 🔔 알림으로 옵니다."]],
  ["tip","rhy:se의 👤 내 메뉴 → 🏢 조직도에서 '내 결재 라인'을 보면 누구에게 요청이 가는지 알 수 있습니다."]]]];
const PM_BOSS=[PM_START,
 ["r1","여러 팀 사업 보기",[
  ["p","상급자 · 대표는 위쪽 팀 이름 칸에서 **볼 팀을 고릅니다**. 고른 팀은 다음에도 기억됩니다."],
  ["ul",["상급자: 조직도에서 내 아래에 있는 팀","대표(조직도 맨 위 대표이사): 모든 팀","대표는 사업 정보 · 공정을 함께 고칠 수 있습니다. 대표가 남긴 메모와 바뀐 기록에는 '대표' 표시가 붙습니다."]]]],
 ["r2","받은 요청 — 사업 삭제 결재",[
  ["ol",["**받은 요청** 탭을 누릅니다. 처리할 요청 수가 탭에 붙습니다.","사업 이름 · 팀 · 기간 · 진행(하부 공정 완료 수) · 요청한 사람 · 사유를 봅니다.","**삭제**를 누르면 사업이 휴지통으로 갑니다. **반려**는 사유를 적어 보냅니다. 결과는 요청한 사람에게 🔔 알림으로 갑니다."]],
  ["ul",["상급자 · 대표는 사업 화면의 **⚙ 사업 정보**에서 요청 없이 바로 지울 수도 있습니다. 이때도 휴지통으로 갑니다.","지운 사업은 **90일 동안 휴지통**에 남습니다. 받은 요청 탭 아래 휴지통에서 **되살리기**를 누르면 공정 · 주차 기록 · 메모까지 그대로 돌아옵니다.","관리자도 ⚙ 관리 → 휴지통에서 되살릴 수 있습니다 (안전장치). 관리자는 지우지는 않습니다."]]]],
 ["r3","대표 의견",[
  ["p","대표는 사업관리에서 메모를 **대표 의견**으로 남깁니다. rhy:se 업무와 팀 보고서에는 💬 의견만 남기고, 내용은 담당자가 고칩니다."]]]];
const PM_FAQ=[["pmfaq","자주 묻는 질문",[["tbl",["질문","답"],[
  ["사업관리에서 고치면 rhy:se 업무도 바뀌나요?","아니요. 옮긴 뒤에는 서로 따라가지 않습니다. 필요한 것만 다시 옮기세요."],
  ["rhy:se 업무가 사업관리에 들어오나요?","아니요. 정보는 사업관리 → rhy:se 한 방향뿐입니다."],
  ["📐 사업 관리 단추가 안 보여요","회사와 우리 팀 모두 켜야 보입니다. 팀장님께 🧩 기능 더하기 → 우리 팀 설정에서 켜 달라고 요청하세요."],
  ["다른 팀 사업을 고칠 수 있나요?","아니요. 사업은 그 팀 사람(겸직 포함)만 고칩니다. 상급자 · 대표는 볼 수 있고, 대표는 함께 고칠 수 있습니다."],
  ["여러 명이 동시에 고쳐도 되나요?","됩니다. 바꾼 칸만 저장해서 서로 덮어쓰지 않고, 열어 두면 1분마다 새 내용을 불러옵니다."],
  ["잘못 고쳤어요","🕘 바뀐 기록에서 전에 무엇이었는지 보고 다시 고치세요."],
  ["사업을 지우고 싶어요","팀장 · 책임자가 ⚙ 사업 정보에서 삭제 요청을 보내면 상급자 · 대표가 처리합니다. 지운 사업은 90일 동안 되살릴 수 있습니다."],
  ["rhy:se 사용법은 어디서 보나요?","이 매뉴얼 맨 위 **📖 rhy:se** 를 누르세요. 회의록 사용법은 **📝 회의록** 입니다."]]]]]];

/* ---------- 📝 회의록 사용법 (회의록 화면의 📖 · v3.28.1) ---------- */
const MEET_START=["start","한눈에 보기",[
  ["p","**📝 회의록**은 회의를 잡고, 내용을 남기고, 나온 할 일(To-do)을 각자 rhy:se로 가져가는 곳입니다. 모든 직원이 씁니다."],
  ["tbl",["순서","누가","무엇을"],[["① 회의 잡기","작성자","업무 창 **📅 회의** → 저장"],["② 답하기","참석자","🔔 알림에서 **참석** 또는 **불참**"],["③ 회의록 쓰기","작성자","회의 뒤 내용 · To-do를 채워 저장"],["④ To-do 가져가기","Action by","**→ rhy:se 가져오기**"]]],
  ["ul",["회의록은 **작성자만** 고칩니다. 다른 분은 💬 코멘트로 알립니다.","**참석자 · Action by** 는 따로 넣지 않아도 봅니다."]]]];
const MEET_USE=[MEET_START,
 ["mt1","회의 잡기",[
  ["img","m01_form","업무 창 → 📅 회의"],
  ["ol",["**+ 업무 추가** → 맨 위 **📅 회의**를 켭니다.","회의 제목을 씁니다.","**📅 날짜 · 🕐 시간**을 고릅니다.","**참석 요청**에 이름을 넣습니다. (20명까지)","안건을 쓰고 **저장**합니다. 참석자에게 초대가 가고 회의록(예정)이 생깁니다."]],
  ["img","m02_time","🕐 시간: 시 → 분 → 길이"],
  ["tip","오전 · 오후는 시를 누르면 알아서 맞춥니다. 회사 밖 분은 **+ 외부 참석자**에 이름 · 소속 · 직책만 적습니다."]]],
 ["mt2","초대에 답하기",[
  ["img","m03_invite","🔔 알림 → 회의 초대"],
  ["ol",["🔔 알림의 **회의 초대**를 봅니다.","가면 **내 계획에 넣기**.","못 가면 **불참** → 사유를 적고 보내기. 사유는 작성자만 봅니다."]]]],
 ["mt3","회의록 화면",[
  ["img","m04_list","📝 회의록"],
  ["ol",["**전체 · 내가 쓴 · 내 To-do · 휴지통**으로 나눠 봅니다.","제목 · 사람으로 찾습니다.","**+ 새 회의록**: 일정 없이 바로 씁니다."]]]],
 ["mt4","회의록 쓰기",[
  ["img","m05_edit","회의록 쓰기"],
  ["ol",["제목 · 일시를 확인합니다.","장소 · 고객사를 적습니다.","참석자(사내 · 외부)를 넣습니다.","안건 · 논의 내용 · 결정 사항을 씁니다."]],
  ["ul",["**To-do**는 To-do · Action by · Due date 를 적습니다. 회의에 안 온 사람도 Action by 로 넣을 수 있습니다.","예정 회의록은 내용을 채워 저장하면 **작성됨**이 되고, 참석자에게 알림이 갑니다.","**🔒 내부 메모**는 워드로 내보낼 때 빠집니다."]]]],
 ["mt5","To-do 가져가기",[
  ["img","m06_todo","내 To-do"],
  ["ol",["**내 To-do** 탭을 엽니다.","**→ rhy:se 가져오기** → 업무 창에서 저장하면 내 계획이 됩니다.","안 할 것은 **안 가져옴**."]]]],
 ["mt6","공유 범위",[
  ["img","m07_share","공유 범위"],
  ["ol",["**본부 전체**: 그 본부의 모든 팀이 봅니다.","**팀**: 그 팀만 봅니다.","**참조**: 이름으로 넣습니다. 알림이 한 번 갑니다."]],
  ["tip","본부장 · 대표는 아래 조직의 회의록을 따로 넣지 않아도 봅니다."]]],
 ["mt7","보기 · 워드로 · 기록",[
  ["img","m08_view","회의록 보기"],
  ["ol",["일시 · 장소 · 고객사","참석자 답 (✓ 참석 · 불참 · 답 전)","**📄 워드로**: 결재란이 있는 워드 파일 (회의록_부서_날짜.docx, 내부 메모 빠짐)","**🕘 바뀐 기록**: 저장한 판마다 남습니다.","**💬 코멘트**: 참석자 · Action by 가 남깁니다."]],
  ["tip","지운 회의록은 **휴지통**에 90일 남고, 되살릴 수 있습니다."]]]];
const MEET_FAQ=[["meetfaq","자주 묻는 질문",[["tbl",["질문","답"],[
  ["회의록 단추가 안 보여요","회사에서 회의록을 꺼 두었을 수 있습니다. 관리자에게 문의하세요."],
  ["참석자도 고칠 수 있나요?","아니요. 작성자만 고칩니다. 💬 코멘트로 알려 주세요."],
  ["불참 사유는 누가 보나요?","작성자와 나만 봅니다."],
  ["회의 시간을 바꾸면요?","업무 창에서 바꿔 저장하면 회의록과 참석자 일정에 함께 반영됩니다."],
  ["가져간 To-do가 회의록에서 바뀌면요?","내 계획은 그대로이고, 🔔 알림으로 알려 줍니다."],
  ["워드에 내부 메모가 들어가나요?","아니요. 빠집니다."]]]]]];

/* 기능 파일이 등록한 사용법(WK_GUIDE)을 기본 사용법에 끼워 넣음: {feat, mod?, member:[{after,sec}], leader:[{after,sec}], faq:[[질문,답]]}
   after = 이 사용법 칸 다음에 (기능 칸끼리도 가능 'x-wait'), 없으면 맨 뒤. 번호는 보여 줄 때 자동으로 매김 */
function merge(base,key){
  const out=base.slice(),pend=[];
  (typeof WK_GUIDE!=="undefined"?WK_GUIDE:[]).forEach(g=>(g[key]||[]).forEach(x=>pend.push(Object.assign({mod:g.mod},x))));
  let moved=true;while(pend.length&&moved){moved=false;for(let i=0;i<pend.length;i++){const x=pend[i],at=out.findIndex(s=>s[0]===x.after);
    if(at>=0){const sec=x.mod?[x.sec[0],x.sec[1],[["mod",x.mod],...x.sec[2]]]:x.sec;if(x.ch)sec.ch=x.ch;out.splice(at+1,0,sec);pend.splice(i,1);i--;moved=true}}}
  pend.forEach(x=>{const sec=x.mod?[x.sec[0],x.sec[1],[["mod",x.mod],...x.sec[2]]]:x.sec;if(x.ch)sec.ch=x.ch;out.push(sec)});
  return out}
const faqRows=()=>{const rows=FAQ[0][2][0][2].slice(),last=rows.pop();(typeof WK_GUIDE!=="undefined"?WK_GUIDE:[]).forEach(g=>(g.faq||[]).forEach(r=>rows.push(r)));rows.push(last);return [["faq","자주 묻는 질문",[["tbl",["질문","답"],rows]]]]};
const PARTS={member:["팀원편","업무를 직접 쓰고 끝내는 모든 사람이 봅니다. 팀장도 내 업무는 이대로 씁니다.",()=>merge(MEMBER,"member")],
  leader:["팀장편","팀원의 업무를 보고 모아 보고서를 만드는 팀장이 봅니다.",()=>merge(LEADER,"leader")],
  faq:["자주 묻는 질문","",faqRows],
  pmuse:["쓰는 법","사업에 참여하는 모든 사람이 봅니다. 팀장 · 책임자도 공정은 이대로 고칩니다.",()=>PM_USE],
  pmlead:["팀장 · 책임자","사업을 만들고 챙기는 팀장 · 책임자가 봅니다.",()=>PM_LEAD],
  pmboss:["상급자 · 대표","여러 팀 사업을 보고 삭제 요청을 처리하는 상급자 · 대표가 봅니다.",()=>PM_BOSS],
  pmfaq:["자주 묻는 질문","",()=>PM_FAQ],
  meetuse:["회의록","",()=>MEET_USE],
  meetfaq:["자주 묻는 질문","",()=>MEET_FAQ],
  map:["전체 지도","",()=>[]]};
// 책 3권: 위쪽 칩으로 오감 (사업관리는 쓰는 사람에게만, 회의록은 회사가 켰을 때)
const BOOKS={map:{chip:"🗺 전체 지도",title:"🗺 rhy:se 전체 지도",tabs:["map"]},rhy:{chip:"📖 rhy:se",title:"📖 rhy:se 사용법",tabs:["member","leader","faq"]},meet:{chip:"📝 회의록",title:"📝 회의록 사용법",tabs:["meetuse","meetfaq"]},pm:{chip:"📐 사업관리",title:"📐 사업관리 매뉴얼",tabs:["pmuse","pmlead","pmboss","pmfaq"]}};
const bookOf=t=>t==="map"?"map":/^pm/.test(t||"")?"pm":/^meet/.test(t||"")?"meet":"rhy";
const canMeet=()=>!(typeof CO!=="undefined"&&CO&&CO.modules&&CO.modules.meet===false);   // 회사가 켜 두었으면 관리자 포함 모두 읽기
const bookFirst=(k,lead,boss)=>k==="map"?"map":k==="pm"?(boss?"pmboss":lead?"pmlead":"pmuse"):k==="meet"?"meetuse":(lead?"leader":"member");
const canPm=()=>typeof F==="function"&&(typeof PM_MODE!=="undefined"&&PM_MODE||!!document.getElementById("projBtn")||!!document.getElementById("miProj"));
window.wkGuideSections=k=>PARTS[k][2]();
/* 장(章): 탭마다 큰 장 → 그 안의 칸(id). 기능 파일이 새 칸을 넣으면 ch:"장 이름"으로 자리를 정하고, 없으면 별표(*) 장으로 감 (v3.28.3) */
const CH={
  member:[["시작하기",["m1","x-forgot","m2","x-mtab","x-lite"]],["업무 쓰기",["m3","x-pull","m4","m5","m3d","x-dual"]],["보기 · 점검",["m6","m7","x-org"]],
    ["함께 일하기",["x-share","x-share-in","x-alerts"]],["보고",["m8","x-export"]],["*더 켜서 쓰기",["x-mods","x-wait","x-quote","x-proj"]],["도움",["x-board"]]],
  leader:[["팀 꾸리기",["l1","x-addmember","x-peer","x-dual-l"]],["매일 보기",["l2","x-wait-l","l4"]],["보고",["l3"]],["*팀 설정",["l3b","x-mods-l","x-proj-l"]]],
  meetuse:[["회의 잡기",["mt1","mt2"]],["회의록",["mt3","mt4","mt6"]],["*그다음",["mt5","mt7"]]],
  pmuse:[["둘러보기",["p1","p2"]],["일정 관리",["p3","p4","p5"]],["*내 일",["p6","p7","p8"]]]};
// [{n:장 이름, secs:[...]}] (한눈에 보기는 장 밖 맨 앞). 장이 없는 탭은 null
function chapters(tab,secs){const C=CH[tab];if(!C)return null;const head=secs.filter(x=>x[0]==="start"),rest=secs.filter(x=>x[0]!=="start"),used=new Set();
  const out=C.map(([n,ids])=>({n:n.replace(/^\*/,""),def:n[0]==="*",secs:ids.map(id=>rest.find(x=>x[0]===id)).filter(x=>x&&!used.has(x)&&used.add(x))}));
  rest.filter(x=>!used.has(x)).forEach(x=>{const c=(x.ch&&out.find(o=>o.n===x.ch))||out.find(o=>o.def)||out[out.length-1];c.secs.push(x)});
  return {head,chs:out.filter(c=>c.secs.length)}}
/* 🗺 전체 지도 (v3.28.5, 펄스): rhy:se 심박선 가운데, 사업관리 · 회의록 · Co-work 가 박동으로 흘러들고 Report 로 나감. 회사가 끈 모듈 · 없는 기능 칸은 빠짐. 칸을 누르면 그 책 · 칸으로 */
const MAP_ADD=[["x-wait","📦 입고·회신 대기"],["x-quote","🌿 이번 주의 글"],["x-peer","👀 팀원끼리 보기"],["x-proj","📐 사업관리"]];
function tabOfSec(id){if(PARTS[id])return id;const me=typeof st!=="undefined"&&st.me,lead=me&&(me.role==="leader"||me.is_admin);
  for(const t of ["member","leader","meetuse","pmuse","pmlead","pmboss"]){if(t==="leader"&&!lead)continue;if(PARTS[t][2]().some(x=>x[0]===id))return t}return null}
function mapGo(id){let t=tabOfSec(id);if(!t){id="x-mods";t=tabOfSec(id)||"member"}show(t,true);if(t!==id)setTimeout(()=>{go(id);const s=$("gd-"+id);if(s){s.classList.remove("gd-flash");void s.offsetWidth;s.classList.add("gd-flash")}},40)}
// 모듈 점: 박동 사이에 출발해 다음 박동이 시작될 때 닿음 (3.2초 한 박, 시작 화면과 같은 박자)
const gmPkt=(id,k,r)=>`<circle r="${r||5}" class="gm-j gm-c-${k}"><animateMotion dur="3.2s" repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;.45;.97;1" calcMode="linear"><mpath href="#${id}"/></animateMotion><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.45;.52;.95;1" dur="3.2s" repeatCount="indefinite"/></circle>`;
function mapHtml(){const pm=canPm(),mt=canMeet(),PULSE="M370,320 H440 L470,250 L500,370 L530,275 L545,320 H630";
  const node=(k,go,ic,t,sub,more)=>`<button type="button" class="gm-node gm-${k}" data-gmgo="${go}"><span class="gm-ic" aria-hidden="true">${ic}</span><span class="gm-nt"><b>${t}</b><span class="gm-s">${sub}</span><span class="gm-k">${more} →</span></span></button>`;
  return `<div class="gm"><div class="gm-head"><h1>한 주의 리듬, <em>rhy:se</em></h1><p>처음 10분에 정하고, 마지막 10분에 정리합니다. ${[pm&&"사업관리",mt&&"회의록","Co-work"].filter(Boolean).join(" · ")}에서 생긴 일은 이 박동 안으로 흘러들고, PC와 휴대폰 어디서나 같은 리듬으로 이어집니다. 칸을 누르면 그 사용법으로 갑니다.</p></div>
  <div class="gm-board" role="group" aria-label="rhy:se 전체 지도">
    <svg class="gm-ecg" viewBox="0 0 1000 540" aria-hidden="true">
      ${pm?`<path id="gmw-pm" class="gm-thread gm-c-pm" d="M170,92 C170,210 360,250 440,318"/>`:""}${mt?`<path id="gmw-mt" class="gm-thread gm-c-mt" d="M500,92 C500,170 480,200 471,246"/>`:""}<path id="gmw-cw" class="gm-thread gm-c-cw" d="M830,92 C830,210 670,250 590,318"/>
      <path class="gm-track" d="${PULSE}"/><circle class="gm-ripple" cx="500" cy="315" r="30"/><path class="gm-beat" pathLength="1" d="${PULSE}"/>
      <circle class="gm-dot gm-d1" cx="370" cy="320" r="9"/><path class="gm-torep" d="M642,320 H688"/><circle class="gm-dot gm-d2" cx="630" cy="320" r="9"/>
      <g class="gm-pkts">${pm?gmPkt("gmw-pm","pm"):""}${mt?gmPkt("gmw-mt","mt"):""}${gmPkt("gmw-cw","cw")}</g>
    </svg>
    ${pm?node("pm","pmuse","📐","사업관리","공정 · 간트","내 일만 골라서"):""}
    ${mt?node("mt","meetuse","📝","회의록","회의 · To-do","To-do 가져오기"):""}
    ${node("cw","x-share","🤝","Co-work","동료의 부탁","내 계획에 넣기")}
    <button type="button" class="gm-report" data-gmgo="m8"><b>Report</b><small>Weekly report</small></button>
    <button type="button" class="gm-hub" data-gmgo="member"><span class="gm-hn">rhy:se</span><span class="gm-hs">내 주간 업무</span><span class="gm-hr"><i>처음 10분</i><i>마지막 10분</i></span></button>
    <button type="button" class="gm-dev" data-gmgo="m1"><svg viewBox="0 0 120 70" aria-hidden="true"><rect x="10" y="6" width="76" height="48" rx="5" class="gm-dv"/><path d="M2,60 H94" class="gm-dvb"/><path class="gm-dvp" d="M22 30 H38 L43 20 L49 40 L54 25 L57 30 H74"/><rect x="92" y="18" width="24" height="44" rx="5" class="gm-dv"/><path class="gm-dvp" d="M96 41 H100 L102 36 L105 46 L107 38 L108 41 H112"/></svg><span><b>PC · 휴대폰 앱 어디서나</b>같은 주소 · 같은 로그인, 고친 내용은 바로 같이 보여요</span></button>
  </div>
  <div class="gm-v" role="group" aria-label="rhy:se 전체 흐름"><span class="gm-drop" aria-hidden="true"></span>
    ${pm?`<div class="gm-row gm-pm">${node("pm","pmuse","📐","사업관리","공정 · 간트","내 일만 골라서")}</div>`:""}${mt?`<div class="gm-row gm-mt">${node("mt","meetuse","📝","회의록","회의 · To-do","To-do 가져오기")}</div>`:""}<div class="gm-row gm-cw">${node("cw","x-share","🤝","Co-work","동료의 부탁","내 계획에 넣기")}</div>
    <button type="button" class="gm-vhub" data-gmgo="member"><svg viewBox="0 0 44 36" aria-hidden="true"><path d="M2 18 H12 L17 4 L24 32 L30 11 L33 18 H42"/></svg><span><span class="gm-hn">rhy:se</span><span class="gm-hs">처음 10분 · 마지막 10분</span></span></button>
    <div class="gm-vend">주 마지막 10분 · 보고용 체크</div>
    <button type="button" class="gm-report" data-gmgo="m8"><b>Report</b><small>Weekly report</small></button>
    <button type="button" class="gm-vdev" data-gmgo="m1"><b>💻 📱 PC · 휴대폰 앱 어디서나</b>같은 주소 · 같은 로그인, 고친 내용은 바로 같이 보여요</button>
  </div>
  <div class="gm-adds"><h2><svg viewBox="0 0 30 14" aria-hidden="true"><path d="M1 7 H9 L12 2 L16 12 L19 5 L21 7 H29"/></svg>기능 더하기</h2>${MAP_ADD.map(([id,t])=>`<button type="button" class="gm-chip" data-gmgo="${id}">${t}</button>`).join("")}</div></div>`}
/* 🔍 사용법 찾기: 볼 수 있는 책 전부에서 칸 제목 · 본문으로 찾음 (낱말 여러 개면 모두 들어간 칸) */
const plain=t=>String(t==null?"":t).replace(/\*\*/g,"");
function secText(bs){return bs.map(([k,a,c])=>k==="tbl"?[...a,...c.flat()].join(" "):Array.isArray(a)?a.join(" "):k==="img"?c:k==="mod"||k==="go"?"":a).map(plain).join(" ")}
function findIndex(){const me=typeof st!=="undefined"&&st.me,out=[];
  Object.keys(BOOKS).filter(k=>k==="rhy"||(k==="pm"&&canPm())||(k==="meet"&&canMeet())).forEach(bk=>BOOKS[bk].tabs.forEach(tab=>{
    if(tab==="leader"&&me&&!(me.role==="leader"||me.is_admin))return;
    PARTS[tab][2]().forEach(([id,t,bs])=>{if(id==="start"&&tab!==BOOKS[bk].tabs[0])return;   // 한눈에 보기는 책마다 한 번만
      if(id==="faq"||/faq$/.test(id)){const tb=bs.find(b=>b[0]==="tbl");(tb?tb[2]:[]).forEach((r,i)=>out.push({bk,tab,id,title:plain(r[0]),text:plain(r[1]),faq:1}));return}
      out.push({bk,tab,id,title:plain(t),text:secText(bs)})})}));return out}
function findRun(q){const box=$("gdRes"),toc=$("gdToc");q=String(q||"").trim();if(!q){box.hidden=true;box.innerHTML="";toc.hidden=false;return}
  const W=q.toLowerCase().split(/\s+/).filter(Boolean),I=G.idx||(G.idx=findIndex());
  const hit=I.map(x=>{const T=x.title.toLowerCase(),B=x.text.toLowerCase();if(!W.every(w=>T.includes(w)||B.includes(w)))return null;return {x,sc:W.reduce((a,w)=>a+(T.includes(w)?3:0)+(B.includes(w)?1:0),0)}}).filter(Boolean).sort((a,b)=>b.sc-a.sc).slice(0,20);
  const mk=t=>{let h=esc(t);W.forEach(w=>{const e=w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");h=h.replace(new RegExp(e,"gi"),m=>`<mark>${m}</mark>`)});return h};
  const snip=x=>{const B=x.text,lb=B.toLowerCase(),i=Math.max(0,Math.min(...W.map(w=>{const j=lb.indexOf(w);return j<0?1e9:j}))),a=i>1e8?0:Math.max(0,i-24);return (a?"…":"")+B.slice(a,a+90)+(B.length>a+90?"…":"")};
  box.innerHTML=`<div class="gd-resh">찾은 칸 ${hit.length}개</div>`+(hit.length?hit.map(({x})=>`<button type="button" class="gd-hit" data-fdtab="${x.tab}" data-fdid="${esc(x.id)}"><span class="gd-hk">${BOOKS[x.bk].chip} · ${esc(PARTS[x.tab][0])}</span><b>${mk(x.faq?"Q. "+x.title:x.title)}</b><span class="gd-hs">${mk(snip(x))}</span></button>`).join(""):`<p class="gd-none">'${esc(q)}'(이)가 들어간 칸이 없어요. 다른 낱말로 찾아보세요.</p>`);
  box.hidden=false;toc.hidden=true}
function findGo(tab,id){if(G.tab!==tab)show(tab,false);setTimeout(()=>{go(id);const s=$("gd-"+id);if(s){s.classList.remove("gd-flash");void s.offsetWidth;s.classList.add("gd-flash")}},30);
  if(innerWidth<=760){$("gdFind").value="";findRun("")}}   // 점검 도구가 사용법 내용을 확인할 때 씀

function block(b){
  const [k,a,c]=b;
  if(k==="mod"){const on=typeof F==="function"&&F("modOn",a);return `<div class="gd-mod${on?" on":""}">🧩 <b>기능 더하기</b>에서 켜는 기능이에요. ${on?"<b>✓ 지금 켜져 있어요</b>":`<button type="button" class="nguide" data-modon="${esc(a)}">지금 켜기</button>`}</div>`}
  if(k==="go")return `<p><button type="button" class="btn gd-go" data-gt-go="${esc(a)}">${esc(c)}</button></p>`;
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
      <h2><span id="gdTitle">📖 사용법</span><small id="gdVer"></small></h2>
      <div class="gd-books" id="gdBooks" role="tablist" aria-label="사용법 고르기"></div><div class="tabs gd-tabs" role="tablist" id="gdTabs"></div>
    </div></div>
    <div class="gd-main"><aside class="gd-side"><div class="gd-find"><span aria-hidden="true">🔍</span><input type="search" id="gdFind" placeholder="사용법 찾기 (예: 비우기)" autocomplete="off" aria-label="사용법 찾기"></div><div class="gd-res" id="gdRes" hidden></div><nav class="gd-toc" id="gdToc" aria-label="목차"></nav></aside><article class="gd-body" id="gdBody"></article></div>
    <div class="gd-lb" id="gdLb" hidden><img alt=""><button type="button" class="gd-lbx" aria-label="닫기">✕</button></div>`;
  document.body.appendChild(el);G.el=el;
  el.querySelector("#gdBack").onclick=()=>closeGuide();
  el.querySelector("#gdTabs").addEventListener("click",e=>{const b=e.target.closest("[data-gt]");if(b)show(b.dataset.gt,true)});
  el.querySelector("#gdBooks").addEventListener("click",e=>{const b=e.target.closest("[data-gbk]");if(!b||b.classList.contains("on"))return;const me=typeof st!=="undefined"&&st.me,lead=me&&(me.role==="leader"||me.is_admin),boss=typeof pjBossAny==="function"&&pjBossAny();show(bookFirst(b.dataset.gbk,lead,boss),true)});
  el.querySelector("#gdToc").addEventListener("click",e=>{const a=e.target.closest("[data-go]");if(!a)return;e.preventDefault();go(a.dataset.go)});
  const fd=el.querySelector("#gdFind");   // 한글 조합 중에는 결과를 다시 그리지 않음
  fd.addEventListener("input",e=>{if(!e.isComposing)findRun(fd.value)});fd.addEventListener("compositionend",()=>setTimeout(()=>findRun(fd.value),0));
  fd.addEventListener("keydown",e=>{if(e.isComposing||e.keyCode===229)return;if(e.key==="Enter"){e.preventDefault();const h=$("gdRes").querySelector("[data-fdtab]");if(h)h.click()}if(e.key==="Escape"&&fd.value){e.stopPropagation();fd.value="";findRun("")}});
  el.querySelector("#gdRes").addEventListener("click",e=>{const h=e.target.closest("[data-fdtab]");if(h)findGo(h.dataset.fdtab,h.dataset.fdid)});
  el.querySelector("#gdBody").addEventListener("click",e=>{
    const z=e.target.closest("[data-gz]");if(z){const lb=$("gdLb");lb.querySelector("img").src=IMG(z.dataset.gz);lb.querySelector("img").alt=z.getAttribute("aria-label");lb.hidden=false;return}
    const t=e.target.closest("[data-gt-go]");if(t)show(t.dataset.gtGo,true);
    const m=e.target.closest("[data-gmgo]");if(m)mapGo(m.dataset.gmgo);
  });
  $("gdLb").onclick=()=>{$("gdLb").hidden=true};
  el.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();if(!$("gdLb").hidden)$("gdLb").hidden=true;else closeGuide()}});
}
function show(tab,anim){
  if(!PARTS[tab])tab="member";G.tab=tab;G.el.querySelector(".gd-main").classList.toggle("is-map",tab==="map");const [name,lead,mk]=PARTS[tab],bk=BOOKS[bookOf(tab)];let n=0;
  const secs=mk().map(s=>s[0]==="start"||s[0]==="faq"||s[0]==="pmfaq"||s[0]==="meetfaq"?s:[s[0],`${++n}. ${s[1]}`,s[2]]);
  $("gdTitle").textContent=bk.title;G.el.setAttribute("aria-label",bk.title.replace(/^\S+ /,""));
  $("gdTabs").innerHTML=bk.tabs.map(k=>`<button type="button" class="tab${k===tab?" active":""}" role="tab" data-gt="${k}" aria-selected="${k===tab}">${PARTS[k][0]}</button>`).join("");
  {const cur=bookOf(tab),ks=Object.keys(BOOKS).filter(k=>k===cur||k==="rhy"||k==="map"||(k==="pm"&&canPm())||(k==="meet"&&canMeet()));
   $("gdBooks").innerHTML=ks.length>1?ks.map(k=>`<button type="button" class="gd-bk${k===cur?" on":""}" role="tab" aria-selected="${k===cur}" data-gbk="${k}">${BOOKS[k].chip}</button>`).join(""):"";}
  if(tab==="map"){$("gdTabs").innerHTML="";$("gdBody").innerHTML=mapHtml();G.el.scrollTop=0;G.el.style.setProperty("--gd-top",G.el.querySelector(".gd-top").offsetHeight+"px");if(anim&&typeof wkIn==="function")wkIn($("gdBody"));return}
  const CHS=chapters(tab,mk()),SEC=([id,t,bs])=>`<section class="gd-sec" id="gd-${id}"><h3>${esc(t)}</h3>${bs.map(block).join("")}</section>`,NUM="①②③④⑤⑥⑦⑧⑨";
  $("gdToc").innerHTML=`<div class="gd-toch">${esc(name)} 목차</div>`+(CHS?CHS.head.map(([id,t])=>`<a href="#" data-go="${id}">${esc(t)}</a>`).join("")+CHS.chs.map((c,i)=>`<div class="gd-ch">${NUM[i]||i+1} ${esc(c.n)}</div>`+c.secs.map(([id,t])=>`<a href="#" class="gd-cs" data-go="${id}">${esc(t)}</a>`).join("")).join("")
    :secs.map(([id,t])=>`<a href="#" data-go="${id}">${esc(t)}</a>`).join(""));
  const T=bk.tabs.filter(k=>k!==tab&&!/faq$/.test(k)),other=T[0],fq=bk.tabs.find(k=>/faq$/.test(k));
  $("gdBody").innerHTML=`<header class="gd-head"><h1>${esc(name)}</h1>${lead?`<p>${esc(lead)}</p>`:""}</header>`+
    (CHS?CHS.head.map(SEC).join("")+CHS.chs.map((c,i)=>`<div class="gd-chh"><span>${NUM[i]||i+1}</span>${esc(c.n)}</div>`+c.secs.map(SEC).join("")).join(""):secs.map(SEC).join(""))+
    (tab===fq?"":`<div class="gd-next">${T.map(k=>`<button type="button" class="btn" data-gt-go="${k}">${PARTS[k][0]} 보기 →</button>`).join("")}<button type="button" class="btn ghost" data-gt-go="${fq}">자주 묻는 질문</button></div>`);
  G.el.scrollTop=0;G.el.style.setProperty("--gd-top",G.el.querySelector(".gd-top").offsetHeight+"px");
  if(anim&&typeof wkIn==="function")wkIn($("gdBody"));
  spy();
}
function go(id){const s=$("gd-"+id);if(!s)return;const top=G.el.querySelector(".gd-top").offsetHeight+(innerWidth<=760?G.el.querySelector(".gd-side").offsetHeight:0)+8;
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
  $("gdVer").textContent=" v"+V();G.idx=null;{const f=$("gdFind");if(f&&f.value){f.value="";findRun("")}}
  G.prevFocus=document.activeElement;
  G.el.hidden=false;document.documentElement.classList.add("gd-open");
  const bk=tab==="pm"||tab==="meet"||tab==="rhy"?tab:tab?bookOf(tab):(typeof PM_MODE!=="undefined"&&PM_MODE?"pm":"rhy"),boss=typeof pjBossAny==="function"&&pjBossAny();
  if(tab==="pm"||tab==="rhy"||tab==="meet")tab="";
  let first=false;try{first=!store.get("wk-guide-map")}catch(_){}
  show(tab||(G.tab&&bookOf(G.tab)===bk?G.tab:"")||(first&&bk==="rhy"?"map":"")||bookFirst(bk,lead,boss),false);
  try{store.set("wk-guide-map","1")}catch(_){}
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
