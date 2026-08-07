const CACHE='conexao-paulista-v1';
const CORE=['/login','/offline','/icon-192.png','/icon-512.png','/logo-conexao-paulista.png','/apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin||url.pathname.startsWith('/api/'))return;
  const cacheable=CORE.includes(url.pathname)||url.pathname.startsWith('/_next/static/')||/\.(png|svg|ico|webp|jpg|jpeg|css|js|woff2?)$/.test(url.pathname);
  if(!cacheable)return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy))}return res}).catch(()=>caches.match('/offline'))));
});
