// 치수·공차 해석 — 브라우저/Node 공용 (window.DIMX)
(function(root){
const N='\\d*\\.?\\d+';

// ---- 도면 용어·기호 사전 (인식 규칙의 근거) ----
const GLOSSARY=[
  ['Ø','지름','Ø8.5 → 지름 8.5'],['R','반지름','R6'],['SØ / SR','구의 지름 / 구의 반지름','SR10'],['□','정사각형 한 변','□20'],
  ['C','45° 모따기','C0.5 → 모따기 0.5'],['M','미터나사 (지름×피치)','M6x1.0-6H → 나사 지름 6, 피치 1.0, 등급 6H'],
  ['↧ ▽ DP DEEP 깊이','깊이 — 지름과 별도 특성','4x Ø4.2 ↧7.0 → 지름 4.2 와 깊이 7.0 (각 4개소)'],
  ['Øa x b (나사 아닌 구멍)','지름 a, 깊이 b','Ø4.2x7.0 → 지름 4.2 / 깊이 7.0'],
  ['⌴ C\'BORE CB','카운터보어(자리파기) — 지름·깊이 별도 특성','⌴Ø8 ↧4.5'],['⌵ CSK','카운터싱크(접시자리) — 지름·각도 별도 특성','⌵Ø8 x 90°'],
  ['SF S.F','스폿페이싱(자리면)','SF Ø12'],['THRU 관통','관통 구멍 (깊이 없음)','Ø6.6 THRU'],
  ['n x / n× / n- / n개소 / n PL','같은 형상 n개소 — 엑셀에 n줄','4x Ø4.2, 2-Ø6.6, 18개소'],['EQS','등간격','6x Ø5 EQS'],['TYP','대표 치수 (같은 형상 공통)','R2 TYP'],
  ['( )','참고치수 — 공차·판정 없음','(25)'],['[ ] 또는 테두리','이론적으로 정확한 치수(Basic)','[50]'],['MAX / MIN','최대·최소 허용값','R0.5 MAX'],
  ['±a','대칭 공차','120 ±0.2'],['+a / -b','상·하 편차 (2단 표기 포함)','25 +0.1/-0.05'],['H7 h6 …','끼워맞춤 공차 기호 — 편차값 확인 필요','Ø40 H7'],
  ['a/b (부호 없음)','한계치수 (최대/최소)','25.10/24.90'],['° \'','각도 (도·분)','30° ±0°30\''],['Ra Rz','표면거칠기 — 치수 아님, 제외','Ra 1.6'],
];
// ---- 글자 정리: OCR 오인식과 표기 변형을 한 형태로 ----
function norm(s){
  return String(s)
    .replace(/[⌀∅ø¢@Φφ]/g,'Ø').replace(/[£土‡]/g,'±').replace(/\+\s*\/\s*-|\+\s*-(?=\s*\d)|-\s*\/\s*\+/g,'±')
    .replace(/[−–—‒]/g,'-').replace(/[º˚]/g,'°').replace(/[’′]/g,"'").replace(/[×]/g,'x')
    .replace(/(\d),(\d)/g,'$1.$2')
    .replace(/(^|\s|x)[Oo0](?=\d+\.\d)/g,'$1Ø')                 // O8.5 → Ø8.5
    .replace(/^(\d+\s*x\s*)[20](?=\d)/i,'$1Ø')                   // 4x 28.5 → 4x Ø8.5 (OCR)
    .replace(/\s+/g,' ').trim();
}
const dec=s=>{const m=String(s).match(/\.(\d+)/);return m?m[1].length:0};
const sgn=(v,def)=>{v=String(v).trim();if(/^[+-]/.test(v))return v;if(/^0*\.?0*$/.test(v))return '0';return def+v};

// ---- 공차 부분 해석 ----
function parseTol(t,src){
  t=t.trim();if(!t)return {kind:'none'};
  let m;
  if(m=t.match(new RegExp(`^±\\s*(${N})\\s*(°)?$`)))return {kind:'sym',up:'+'+m[1],lo:'-'+m[1]};
  if(m=t.match(/^±\s*(\d+)°\s*(\d+)'$/))return {kind:'sym',up:'+'+(+m[1]+m[2]/60),lo:'-'+(+m[1]+m[2]/60),note:`±${m[1]}°${m[2]}'`};
  if(m=t.match(/^±\s*(\d+)'$/))return {kind:'sym',up:'+'+(m[1]/60).toFixed(4).replace(/0+$/,''),lo:'-'+(m[1]/60).toFixed(4).replace(/0+$/,''),note:`±${m[1]}'`};
  // 상·하 편차 쌍: +0.1/-0.05, +0.1 -0.05, +0.1/0, 0/-0.1, +0.2/+0.1, -0.05/-0.1
  if(m=t.match(new RegExp(`^([+-]?\\s*${N})\\s*(?:\\/|\\s)\\s*([+-]?\\s*${N})$`))){
    const a=m[1].replace(/\s/g,''),b=m[2].replace(/\s/g,'');
    if(/^[+-]/.test(a)||/^[+-]/.test(b)||/^0+(\.0+)?$/.test(a)||/^0+(\.0+)?$/.test(b)){
      let u=sgn(a,'+'),l=sgn(b,'-');if(parseFloat(u)<parseFloat(l))[u,l]=[l,u];
      return {kind:'dev',up:u,lo:l};
    }
  }
  if(m=t.match(new RegExp(`^\\+\\s*(${N})$`)))
    return src==='ocr'?{kind:'sym',up:'+'+m[1],lo:'-'+m[1],chk:'OCR이 ±를 +로 읽었을 수 있음'}:{kind:'dev',up:'+'+m[1],lo:'0',chk:'+공차만 표기 — 하한 0으로 처리'};
  if(m=t.match(new RegExp(`^-\\s*(${N})$`)))return {kind:'dev',up:'0',lo:'-'+m[1],chk:'−공차만 표기 — 상한 0으로 처리'};
  if(m=t.match(new RegExp(`^([A-Za-z]{1,2}\\d{1,2})\\s*\\(\\s*([+-]?${N})\\s*(?:\\/|\\s)\\s*([+-]?${N})\\s*\\)$`))){
    let u=sgn(m[2],'+'),l=sgn(m[3],'-');if(parseFloat(u)<parseFloat(l))[u,l]=[l,u];return {kind:'dev',up:u,lo:l,fit:m[1]};
  }
  if(m=t.match(/^([A-Za-z]{1,2}\d{1,2})$/))return {kind:'fit',fit:m[1],chk:'끼워맞춤 공차('+m[1]+') — 편차값 확인 필요'};
  if(/^MAX\.?$/i.test(t))return {kind:'max'};
  if(/^MIN\.?$/i.test(t))return {kind:'min'};
  return null;
}

const SUF=/\s*(THRU|TYP\.?|DEEP|EQS|EQ\.?SP\.?|PL\.?|PLACES|관통|깊이|등간격|양쪽|REF\.?)$/i;
const HEAD=new RegExp(`^(?:(\\d+)\\s*(?:x|X|-(?=\\s*(?:Ø|R|M|SØ)))\\s*)?(SØ|SR|Ø|R|M|C|□)?\\s*(${N})(?:\\s*x\\s*(${N}))?\\s*(?:(°)\\s*(?:(\\d+)')?)?\\s*(.*)$`);

// ---- 한 구절 해석 ----
function parseOne(s,src){
  if(!s||s.length>48)return null;
  let ref=false,basic=false,m;
  if(m=s.match(/^\((.+)\)$/)){ref=true;s=m[1].trim()}
  else if(m=s.match(/^[\[|](.+)[\]|]$/)){basic=true;s=m[1].trim()}
  // 한계치수: 25.1/24.9, 25.1~24.9
  if(m=s.match(new RegExp(`^(Ø|R)?\\s*(${N})\\s*[\\/~]\\s*(${N})$`))){
    const a=+m[2],b=+m[3],hi=Math.max(a,b),lo=Math.min(a,b);
    if(hi>0&&(hi-lo)/hi<0.2&&dec(m[2])>0&&dec(m[3])>0){const d=Math.max(dec(m[2]),dec(m[3]));
      return {nom:(m[1]||'')+hi.toFixed(d),up:'0',lo:'-'+(hi-lo).toFixed(d),kind:'limit',note:'한계치수 '+lo.toFixed(d)+'~'+hi.toFixed(d),cat:'치수'}}
  }
  // 깊이 기호 통일: ↧ ▽ ▼ ⇣ ⊽, 사용자 정의 글리프, DP/DEEP/깊이 + 숫자
  s=s.replace(/[↧⇣▽▼⊽\uE000-\uF8FF]/g,' ↧ ').replace(/(^|\s)(DP\.?|DEEP|깊이)\s*(?=\d)/gi,'$1↧ ').replace(/\s+/g,' ').trim();
  // 자리파기·접시자리
  let feat='';
  if(m=s.match(/^(⌴|C'?BORE|CBORE|CB|⌵|CSK|C'?SINK|SF|S\.F\.?|SFACE)\s*/i)){const k=m[1].toUpperCase();feat=/⌴|BORE|^CB/.test(k)?'카운터보어':/⌵|CSK|SINK/.test(k)?'카운터싱크':'스폿페이싱';s=s.slice(m[0].length)}
  let depth=null,cang=null;
  if(m=s.match(new RegExp(`\\s*↧\\s*(${N})\\s*(.*)$`))){depth={v:m[1],t:m[2]};s=s.slice(0,m.index).trim()}
  let suf='';while((m=s.match(SUF))){suf=(m[1].toUpperCase()+' '+suf).trim();s=s.slice(0,m.index).trim()}
  if(!depth&&feat==='카운터싱크'&&(m=s.match(new RegExp(`\\s*x\\s*(${N})\\s*°$`)))){cang=m[1];s=s.slice(0,m.index).trim()}
  // Øa x b (나사가 아닌 구멍) → 지름 a, 깊이 b
  if(!depth&&(m=s.match(new RegExp(`^((?:\\d+\\s*x\\s*)?S?Ø\\s*${N}(?:\\s*(?:±|[+-]\\s*\\d)[^x]*)?)\\s*x\\s*(${N})$`)))){depth={v:m[2],t:''};s=m[1].trim()}
  m=s.match(HEAD);if(!m)return null;
  const [,cnt,pre,nom,pitch,deg,min,rest]=m;
  if(pre==='M'&&!pitch&&/^\d+$/.test(nom)===false)return null;
  let tol=parseTol(rest||'',src);
  if(tol===null){ // 끝에 붙은 나사 등급(-6H) 등
    const t2=(rest||'').match(/^-(\d[gGhH])$/);if(pre==='M'&&t2)tol={kind:'none',note:'나사등급 '+t2[1]};else return null;
  }
  const bare=!pre&&!cnt&&!deg&&tol.kind==='none'&&!suf&&!ref&&!basic;
  if(bare&&(nom.length>6||/^\d{1,2}$/.test(nom)))return null;      // 도번·품번 풍선 숫자 제외
  if(/^\d{4}\.\d{2}\.\d{2}$/.test(s))return null;                    // 날짜
  let N0=(pre||'')+nom+(pitch?'x'+pitch:'')+(deg?'°':'')+(min?min+"'":'');
  const r={nom:N0,up:tol.up||'',lo:tol.lo||'',kind:ref?'ref':basic?'basic':tol.kind,cat:'치수',
    note:[cnt?cnt+'x':'',tol.fit||'',tol.note||'',suf,ref?'참고치수':'',basic?'이론적 정확 치수':''].filter(Boolean).join(' '),chk:tol.chk||''};
  if(tol.kind==='max'||tol.kind==='min')r.note=(r.note+' '+tol.kind.toUpperCase()).trim();
  if(pre==='C')r.note=(r.note+' 모따기').trim();
  if(feat)r.note=(r.note+' '+feat+' 지름').trim();
  const extra=[],cntN=cnt?cnt+'x':'';
  if(depth){const dt=parseTol(depth.t||'',src)||{kind:'none'};extra.push({nom:'깊이 '+depth.v,up:dt.up||'',lo:dt.lo||'',kind:dt.kind,cat:'치수',note:[cntN,feat?feat+' 깊이':'깊이'].filter(Boolean).join(' '),chk:dt.chk||'',feature:'depth'})}
  if(cang)extra.push({nom:cang+'°',up:'',lo:'',kind:'none',cat:'치수',note:[cntN,'카운터싱크 각도'].filter(Boolean).join(' '),chk:'',feature:'angle'});
  if(extra.length)r.extra=extra;
  if(deg&&min)r.angle=+nom+min/60;
  return r;
}
function parseDim(raw,src){
  const n0=norm(raw);if(/^(Ra|Rz|Ry|Rmax|Rq)\b/i.test(n0))return null; // 표면거칠기
  let w=n0.split(' ');
  while(w.length>1&&/^[A-Za-z가-힣]{1,2}$/.test(w[0])&&!/^(Ø|R|M|C|SR)$/.test(w[0]))w.shift(); // 앞에 붙은 단면·구역 기호
  while(w.length){const r=parseOne(w.join(' '),src);if(r)return r;w.pop()}
  return null;
}

// ---- 상·하 2단 공차 묶기 (기준 숫자 오른쪽에 작은 글자 2줄) ----
// tokens: {s,h,a0,a1,perp,cx,cy,bb,u}
function stackTol(toks){
  const used=new Set(),out=[];
  const isNum=t=>/^(Ø|R|SR|M)?\d*\.?\d+°?$/.test(norm(t.s));
  const isDev=t=>/^[+±-]?\s*\d*\.?\d+$|^0$/.test(norm(t.s).replace(/\s/g,''));
  toks.forEach((n,i)=>{
    if(used.has(i)||!isNum(n))return;
    const c=[];toks.forEach((t,j)=>{if(j===i||used.has(j)||!isDev(t))return;
      if(Math.abs(t.u[0]-n.u[0])>.2||Math.abs(t.u[1]-n.u[1])>.2)return;
      if(t.h>n.h*.92)return;
      const dx=t.a0-n.a1,dp=t.perp-n.perp;
      if(dx>-n.h*.3&&dx<n.h*1.2&&Math.abs(dp)<n.h*.95)c.push({t,j,dp})});
    if(!c.length)return;
    c.sort((a,b)=>b.dp-a.dp);
    let up=null,lo=null;
    if(c.length>=2){up=c[0];lo=c[c.length-1];if(up.dp-lo.dp<n.h*.35)return}
    else{const o=c[0];if(o.dp>n.h*.15)up=o;else if(o.dp<-n.h*.15)lo=o;else return}
    const fmt=(x,d)=>{const v=norm(x.t.s).replace(/\s/g,'');return /^[+-±]/.test(v)||/^0+(\.0+)?$/.test(v)?v:d+v};
    const U=up?fmt(up,'+'):'0',L=lo?fmt(lo,'-'):'0';
    const merged={...n,s:n.s+' '+(U.startsWith('±')?U:U+'/'+L),bb:[...n.bb],stacked:true};
    [up,lo].filter(Boolean).forEach(o=>{used.add(o.j);merged.bb=[Math.min(merged.bb[0],o.t.bb[0]),Math.min(merged.bb[1],o.t.bb[1]),Math.max(merged.bb[2],o.t.bb[2]),Math.max(merged.bb[3],o.t.bb[3])];merged.a1=Math.max(merged.a1,o.t.a1)});
    merged.cx=(merged.bb[0]+merged.bb[2])/2;merged.cy=(merged.bb[1]+merged.bb[3])/2;
    used.add(i);out.push(merged);
  });
  return [...out,...toks.filter((t,i)=>!used.has(i))];
}

// ---- 공통공차 ----
const ISO_L=[[0.5,3],[3,6],[6,30],[30,120],[120,400],[400,1000],[1000,2000],[2000,4000]];
const ISO_T={f:[.05,.05,.1,.15,.2,.3,.5,null],m:[.1,.1,.2,.3,.5,.8,1.2,2],c:[.2,.3,.5,.8,1.2,2,3,4],v:[null,.5,1,1.5,2.5,4,6,8]};
const ISO_RC={f:[.2,.5,1],m:[.2,.5,1],c:[.4,1,2],v:[.4,1,2]};
function parseGenTolText(txt){
  const t=norm(txt).replace(/\s+/g,' '),g={};let m;
  if(m=t.match(/2768\s*-?\s*([fmcv])\b/i)||t.match(/(정밀급|보통급|거친급|매우\s*거친급)/)){
    const k=m[1].toLowerCase();g.iso={'정밀급':'f','보통급':'m','거친급':'c'}[m[1]]||(/매우/.test(m[1])?'v':k);
  }
  const pick=(re,k)=>{const x=t.match(re);if(x)g[k]=x[1]};
  pick(new RegExp(`X?\\.XXX\\s*[:=]?\\s*±\\s*(${N})`,'i'),'d3');
  pick(new RegExp(`X?\\.XX(?!X)\\s*[:=]?\\s*±\\s*(${N})`,'i'),'d2');
  pick(new RegExp(`X?\\.X(?!X)\\s*[:=]?\\s*±\\s*(${N})`,'i'),'d1');
  pick(new RegExp(`(?:^|\\s)X(?![.X])\\s*[:=]?\\s*±\\s*(${N})`,'i'),'d0');
  if(m=t.match(/각\s*도[^±]{0,12}±\s*(\d*\.?\d+)\s*°(?:\s*(\d+)')?/)||t.match(/±\s*(\d*\.?\d+)\s*°(?:\s*(\d+)')?/))g.ang=String(+m[1]+(m[2]?m[2]/60:0));
  else if(m=t.match(/각\s*도[^±]{0,12}±\s*(\d+)'/))g.ang=String(m[1]/60);
  return g;
}
// m: {nom,up,lo,kind,cat}, gt: {mode:'digits'|'iso'|'none', d0..d3, ang, iso}
function effTol(m,gt){
  if(m.cat!=='치수')return {up:'',lo:'',src:''};
  if(String(m.up||'').trim()!==''||String(m.lo||'').trim()!=='')return {up:m.up,lo:m.lo,src:'개별'};
  if(['ref','basic','max','min','limit','fit'].includes(m.kind))return {up:'',lo:'',src:m.kind==='fit'?'끼워맞춤':''};
  gt=gt||{};if(gt.mode==='none')return {up:'',lo:'',src:'없음'};
  const s=String(m.nom||''),v=parseFloat(s.replace(/^[^\d.]+/,'')),ang=/°/.test(s);
  if(isNaN(v))return {up:'',lo:'',src:''};
  let t=null;
  if(gt.mode==='iso'&&gt.iso){
    if(ang)t=null;
    else if(/^(R|C)/.test(s)){const a=ISO_RC[gt.iso];t=v<=3?a[0]:v<=6?a[1]:a[2]}
    else{const i=ISO_L.findIndex(([a,b])=>v>a-1e-9&&v<=b);t=i>=0?ISO_T[gt.iso][i]:null}
  }else if(gt.mode==='digits'){
    if(ang)t=gt.ang;else{const d=Math.min(3,dec(s));t=gt['d'+d]}
  }
  t=parseFloat(String(t??'').replace(/[±+]/g,''));
  if(isNaN(t))return {up:'',lo:'',src:'공통공차 없음',miss:true};
  return {up:'+'+t,lo:'-'+t,src:'공통공차'};
}
function tolText(up,lo){
  up=String(up??'').trim();lo=String(lo??'').trim();if(!up&&!lo)return '';
  const u=up===''?'0':sgn(up,'+'),l=lo===''?'0':sgn(lo,'-');
  if(parseFloat(u)===-parseFloat(l)&&parseFloat(u)>0)return '±'+u.replace(/^\+/,'');
  return u+' / '+l;
}
function judge(m,gt,meas){
  const t=String(meas??m.meas??'').trim().toUpperCase();if(!t)return '';
  if(['OK','합격','PASS','G','확인','적합','이상없음'].includes(t))return 'OK';
  if(['NG','불합격','FAIL','부적합'].includes(t))return 'NG';
  if(m.cat!=='치수')return '';
  const n=parseFloat(String(m.nom).replace(/^[^\d.]+/,'')),v=parseFloat(t.replace(/^[^\d.-]+/,''));if(isNaN(n)||isNaN(v))return '';
  if(m.kind==='max')return v<=n+1e-9?'OK':'NG';if(m.kind==='min')return v>=n-1e-9?'OK':'NG';
  const e=effTol(m,gt);if(e.up===''&&e.lo==='')return '';
  const u=parseFloat(e.up===''?0:sgn(e.up,'+')),l=parseFloat(e.lo===''?0:sgn(e.lo,'-'));
  return (v<=n+u+1e-9&&v>=n+l-1e-9)?'OK':'NG';
}
root.DIMX={GLOSSARY,norm,parseDim,parseTol,stackTol,parseGenTolText,effTol,tolText,judge,dec};
})(typeof window!=='undefined'?window:globalThis);
