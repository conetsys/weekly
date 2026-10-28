// 바탕화면/앱 설치용 최소 서비스워커. 화면은 캐시하지 않고 항상 최신 파일을 받아옵니다.
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
  if(e.request.mode!=="navigate")return;
  e.respondWith(fetch(e.request).catch(()=>new Response("<meta charset=utf-8><p style='font:16px sans-serif;padding:24px'>인터넷에 연결되어 있지 않아요. 연결 후 다시 열어주세요.</p>",{headers:{"Content-Type":"text/html; charset=utf-8"}})));
});
