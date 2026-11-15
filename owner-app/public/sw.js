const CACHE='zariah-owner-shell-v2';
const OWNER_CACHE_PREFIX='zariah-owner-shell-';
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(['/owner/','/owner/manifest.webmanifest','/owner/icon.svg']);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(OWNER_CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/rest/')||url.pathname.startsWith('/auth/')||url.pathname.includes('/functions/'))return;
  if(request.mode==='navigate'&&url.pathname.startsWith('/owner/')){
    event.respondWith(fetch(request).catch(()=>caches.match('/owner/')));
    return;
  }
  if(url.pathname.startsWith('/owner/')){
    event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
      return response;
    })));
  }
});
