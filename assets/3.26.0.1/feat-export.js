/* rhy:se Weekly Plan — 💾 내 일정 내려받기 (feat-export.js, v3.18.0)
   내정보 ▾ → 💾 내 일정 내려받기 → 내가 쓴 업무 전체를 엑셀(CSV)로 보관. 서버 설정 없음, 되살리기(복원)는 일부러 없음
   한 줄 = 업무 하나의 한 주. 🤝 Co-work 로 넣은 다른 분 계획은 '구분'에 표시 */
function exportRows(){
  const me=st.items.filter(isMine),out=[];
  me.forEach(it=>{const w=it.weeks||{};Object.keys(w).sort().forEach(k=>{const e=w[k];if(!e||typeof e!=="object"||!e.task)return;
    const chg=(e.chg||[]).map(c=>`${c.d0||""}→${c.d1||""}${c.why?`(${c.why})`:""}`).join(" / ");
    out.push([rangeOf(k),it.co?`Co-work (${it.co.from_name||""})`:"내 업무",it.customer||"",it.project||"",it.part||"",it.vendor&&it.vendor!=="없음"?it.vendor:"",it.category||"",it.po||"",
      e.task||"",e.start||"",e.due||"",e.planned?"계획":(e.status||""),e.done_at||"",(e.memo||"").replace(/\r?\n/g," / "),chg,
      (it.waits||[]).map(x=>`${x.type||""} ${x.vendor||""} ${x.due||""}${x.got?" 받음":""}`.trim()).join(" / "),it.report&&it.report[k]?"보고":""])})});
  return out.sort((a,b)=>b[0].localeCompare(a[0]))}
function exportMine(){
  if(!isMyTeam(st.team)){toast("내 팀 화면에서 내려받을 수 있어요 (위쪽 팀 고르기에서 내 팀)");return}
  const rows=exportRows();if(!rows.length){toast("내려받을 업무가 아직 없어요");return}
  const head=["주","구분","고객사","대상사업","품목","협력사","업무 구분","관리번호","할일","시작일","종료일","상태","완료일","메모","일정 변경(처음→바뀐 날, 이유)","입고·회신 대기","보고용"];
  const q=v=>{v=String(v==null?"":v);return /[",\n]/.test(v)?`"${v.replace(/"/g,'""')}"`:v};
  const csv="﻿"+[head,...rows].map(r=>r.map(q).join(",")).join("\r\n");
  const a=document.createElement("a"),url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  a.href=url;a.download=`내일정_${st.me.name}_${todayKey}.csv`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},500);
  toast(`💾 ${rows.length}줄을 내려받았어요. 엑셀로 열 수 있어요`)}
$("miExport").onclick=()=>{$("userMenu").hidden=true;exportMine()};
$("miExport").hidden=false;
// 📖 사용법
wkGuideAdd("export",{
  member:[{after:"m8",sec:["x-export","💾 내 일정 내려받기",[
    ["p","내가 쓴 업무 전체를 엑셀 파일로 내려받아 보관할 수 있습니다. 한 줄이 업무 하나의 한 주입니다."],
    ["ol",["**내정보 ▾ → 💾 내 일정 내려받기**를 누릅니다.","'내일정_이름_날짜.csv' 파일이 내려받아집니다. 엑셀에서 바로 열립니다."]],
    ["ul",["칸: 주 · 고객사 · 대상사업 · 품목 · 할일 · 시작일 · 종료일 · 상태 · 완료일 · 메모 · 일정 변경 · 입고·회신 대기 · 보고용","내려받기만 됩니다. 파일을 다시 올려 되살리는 기능은 없습니다. (잘못 지운 업무는 관리자가 휴지통에서 되살립니다)"]]]]}],
  faq:[["내 업무를 따로 보관하고 싶어요","내정보 ▾ → 💾 내 일정 내려받기를 누르면 엑셀로 열 수 있는 파일로 받습니다."]]});
wkFeat("export",{exportMine,exportRows});
