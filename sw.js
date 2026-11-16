const V="bms-v7",SHELL=["./","index.html","assets/css/style.css","assets/js/app.js","assets/brand/bms-logo.webp","assets/brand/emblem-96.webp"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
// stale-while-revalidate: instant from cache, refreshed in background
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);if(u.origin!==location.origin)return;
e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>{const n=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>m||c.match("index.html"));return m||n})))});
