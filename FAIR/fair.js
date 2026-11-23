// FAIR 양식(FORM1/FORM3) 채우기 — 브라우저와 Node 공용
(function(root){
function partType(p){
  const d=String(p.dwg||'').trim(),n=String(p.pn||'').trim(),all=(n+' '+d).toUpperCase();
  if(/\b(KS|KSB|ISO|MIL|MS|NAS|AN|DIN|JIS)\s?[A-Z]?\s?\d/.test(all)||/^KS\s?[A-Z]/.test(d))return 'standard catalogue item';
  if(d&&n&&d===n&&/^\d{6,}$/.test(n))return 'a detail part';
  if(/\([A-Z]{2}\)\s*$/.test(d)||/(MISUMI|HENKEL|LOCTITE)/.test(all))return 'COTS';
  if(d&&!/^\d{6,}$/.test(d))return 'COTS';
  return p.type||'';
}
const YEL={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFA040'}};  // 양식에 없는 주황색
function flag(cell,msg){cell.style=JSON.parse(JSON.stringify(cell.style||{}));cell.fill=YEL;cell.font={...(cell.font||{}),bold:true,color:{argb:'FF9C0006'}};if(msg)cell.note={texts:[{text:msg}]}}
async function fillFair(ExcelJS,tplBuf,D){
  const wb=new ExcelJS.Workbook();await wb.xlsx.load(tplBuf);
  const m=D.meta||{},v=x=>(x==null||String(x).trim()==='')?null:x;
  const f1=wb.getWorksheet('FORM 1'),f3=wb.getWorksheet('FORM3');
  // 양식의 노란 배경 지우기
  wb.worksheets.filter(w=>/^FORM\s?\d$/i.test(w.name)).forEach(w=>w.eachRow({includeEmpty:true},row=>row.eachCell({includeEmpty:true},c=>{
    const f=c.fill;if(f&&f.type==='pattern'&&f.fgColor&&/^(FF)?FFFF00$/i.test(f.fgColor.argb||'')){c.style=JSON.parse(JSON.stringify(c.style||{}));c.fill={type:'pattern',pattern:'none'}}})));
  const head=ws=>{
    ws.getCell('A5').value=v(m.pn);ws.getCell('B5').value=v(m.name);
    ws.getCell('C5').value=v(m.serial)||'-';ws.getCell('D5').value=v(m.fairId);
    ws.getCell('A7').value=v(m.partRev)||'N/C';ws.getCell('C7').value=v(m.dwgRev)||'N/C';ws.getCell('D7').value=v(m.addChg)||'N/A';
    ws.getCell('B7').value=v(m.dwgNo)?m.dwgNo:{formula:'LEFT(A5,10)',result:String(m.pn||'').slice(0,10)};
    ws.getCell('A10').value=v(m.mfgRef);ws.getCell('B10').value=v(m.org)||'코넷시스㈜';ws.getCell('C10').value=v(m.supCode);ws.getCell('D10').value=v(m.po);
    const asm=m.assy!==false;
    ws.getCell('A11').value=`13. Detail Part  ${asm?'□':'■'}\n\n     Assembly FAI ${asm?'■':'□'}`;
    ws.getCell('B11').value=`14. Full FAI   ${m.partial?'□':'■'}`;ws.getCell('C11').value=`Partial FAI   ${m.partial?'■':'□'}`;
    ws.getCell('A34').value='20. FAIR Verified By: '+(m.by||'');ws.getCell('D34').value='21. Date: '+(m.date||'');
  };
  // FORM 1: 15행씩, 넘치면 같은 양식을 이어 붙임
  const parts=(D.parts||[]).slice(),per=15,pages=Math.max(1,Math.ceil(parts.length/per));
  const sheets=[f1];
  for(let k=2;k<=pages;k++){const ws=wb.addWorksheet('FORM 1 ('+k+')');const md=JSON.parse(JSON.stringify(f1.model));md.name=ws.name;md.id=ws.id;md.mergeCells=md.merges;ws.model=md;sheets.push(ws)}
  sheets.forEach((ws,k)=>{head(ws);
    for(let i=0;i<per;i++){const p=parts[k*per+i],r=18+i;
      ws.getCell('A'+r).value=p?v(p.pn):null;ws.getCell('B'+r).value=p?v(p.name):null;ws.getCell('C'+r).value=p?v(p.type||partType(p)):null;ws.getCell('D'+r).value=p?(v(p.fairId)||'N/A'):null;
      if(p&&p.chk){const msg='OCR로 읽은 값 — 도면과 대조 확인 필요';if(p.chk.pn)flag(ws.getCell('A'+r),msg);if(p.chk.name)flag(ws.getCell('B'+r),msg);if(p.chk.dwg||p.chk.pn)flag(ws.getCell('C'+r),p.chk.dwg?'도면번호/규격 칸을 OCR로 읽음 — Part Type 확인':'')}}
    if(pages>1)ws.getCell('A37').value='26. Comments. '+(k+1)+' / '+pages+(m.comment?'  '+m.comment:'');
    else if(m.comment)ws.getCell('A37').value='26. Comments. '+m.comment;
  });
  // 시트 순서: FORM 1 바로 뒤에 이어붙인 시트
  if(pages>1){const i0=wb.worksheets.indexOf(f1);const others=wb.worksheets.filter(w=>!sheets.includes(w));const order=[...others.slice(0,i0),...sheets,...others.slice(i0)];order.forEach((w,i)=>w.orderNo=i)}
  // FORM 3
  f3.getCell('A5').value=v(m.pn);f3.getCell('J5').value=v(m.name);
  const ch=(D.chars||[]);let r=8;
  ch.forEach(c=>{
    f3.getCell('A'+r).value=c.n;f3.getCell('B'+r).value=v(c.loc);f3.getCell('C'+r).value=v(c.cat);
    f3.getCell('D'+r).value=v(c.req);f3.getCell('H'+r).value=v(c.tol);
    f3.getCell('J'+r).value=v(c.result);f3.getCell('K'+r).value=v(c.tool);f3.getCell('L'+r).value=v(c.nc);f3.getCell('M'+r).value=v(c.note);
    if(c.flag){flag(f3.getCell('D'+r),'확인 필요: '+(c.reason||''));flag(f3.getCell('H'+r));flag(f3.getCell('M'+r))}
    if(c.cat==='주기'||String(c.req||'').length>18){const cl=f3.getCell('D'+r);cl.alignment={...(cl.alignment||{}),wrapText:true,vertical:'middle',horizontal:'left'};const len=String(c.req||'').length;if(len>22)f3.getRow(r).height=Math.min(90,28.5*Math.ceil(len/24))}
    r++;});
  if(r-1>211)f3.pageSetup.printArea='A1:N'+(r+5);
  return await wb.xlsx.writeBuffer();
}
root.FAIR={fillFair,partType};
})(typeof window!=='undefined'?window:globalThis);
