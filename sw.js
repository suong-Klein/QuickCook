const CACHE_NAME='quickcook-v6';
const ASSETS=[
  './','./index.html','./manifest.webmanifest','./app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  './assets/icon-192.png','./assets/icon-512.png',
  './assets/recipe1.jpg','./assets/recipe2.jpg','./assets/recipe3.jpg'
];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.headers.get('accept')?.includes('text/html')){
    e.respondWith(fetch(req).then(res=>{ const copy=res.clone(); caches.open(CACHE_NAME).then(c=>c.put(req,copy)); return res; }).catch(()=>caches.match(req)));
  } else {
    e.respondWith(caches.match(req).then(r=>r||fetch(req)));
  }
});