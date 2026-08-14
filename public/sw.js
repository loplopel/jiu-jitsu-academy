const CACHE='conexao-paulista-v6';
const STATIC_FILES=['/offline','/icon-192.png','/icon-512.png','/logo-conexao-paulista.png','/apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC_FILES)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.match('/offline')));return;}
  const isStatic=url.pathname.startsWith('/_next/static/')||/\.(png|svg|ico|webp|jpg|jpeg|css|js|woff2?)$/i.test(url.pathname);if(!isStatic)return;
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response})));
});
