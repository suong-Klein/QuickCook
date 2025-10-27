// sw.js
const CACHE_NAME='quickcook-v12';
const PRECACHE=[
  './','./index.html','./app.js','./manifest.json',
  './assets/icon-192.png','./assets/icon-512.png',
  './assets/recipe1.jpg','./assets/recipe2.jpg','./assets/recipe3.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(PRECACHE))); self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch',e=>{
  const req=e.request; const wantsHTML=req.headers.get('accept')?.includes('text/html');
  if(wantsHTML){
    e.respondWith(fetch(req).then(res=>{ const copy=res.clone(); caches.open(CACHE_NAME).then(c=>c.put(req,copy)); return res; }).catch(()=>caches.match(req)));
  } else {
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req)));
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    let client = allClients.find(c => c.visibilityState === 'visible');
    if (client) { client.focus(); }
    else if (allClients.length > 0) { allClients[0].focus(); }
    else { self.clients.openWindow('./'); }
  })());
});
