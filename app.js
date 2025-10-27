document.addEventListener('DOMContentLoaded', () => {
  // Materialize init (guarded)
  if (window.M) {
    M.Sidenav.init(document.querySelectorAll('.sidenav'));
    M.Modal.init(document.querySelectorAll('.modal'));
    if (M.updateTextFields) M.updateTextFields();
  }

  // ===== FAB (+/−) robust =====
  const fabEl = document.querySelector('.fixed-action-btn');
  let fab = M && M.FloatingActionButton && (M.FloatingActionButton.getInstance(fabEl) || M.FloatingActionButton.init(fabEl, { hoverEnabled:false }));
  const mainBtn  = fabEl?.querySelector('a.btn-floating');
  const mainIcon = mainBtn?.querySelector('i');
  const setFabIcon = (open) => { if (mainIcon) mainIcon.textContent = open ? 'remove' : 'add'; };
  const resetFab = () => { try { fab && fab.close(); } catch(e){} setFabIcon(false); };

  if (mainBtn) {
    mainBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      const isOpen = fabEl.classList.contains('active');
      if (isOpen) { fab && fab.close(); setFabIcon(false); }
      else { fab && fab.open(); setFabIcon(true); }
    }, { capture:true });
  }
  fabEl?.querySelectorAll('ul a.btn-floating').forEach(a => {
    a.addEventListener('click', () => { fab && fab.close(); setFabIcon(false); }, { capture:true });
  });
  if (fabEl) {
    new MutationObserver(() => setFabIcon(fabEl.classList.contains('active')))
      .observe(fabEl, { attributes:true, attributeFilter:['class'] });
  }

  // ===== Simple hash router =====
  const pages = document.querySelectorAll('.page');
  function showPage(id){
    pages.forEach(p=>p.classList.add('hidden'));
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
    window.scrollTo(0,0);
  }
  function handleHash(){
    let hash = location.hash.replace('#','');
    if (!hash || !document.getElementById(hash)) hash = 'home';
    showPage(hash);
    // Per-page refresh
    try {
      if (hash === 'pantry') renderPantry();
      if (hash === 'list') renderShop();
      if (hash === 'planner') suggestRecipes();
    } catch(e){ console.warn(e); }
    resetFab();
    if (M && M.updateTextFields) M.updateTextFields();
  }
  window.addEventListener('hashchange', handleHash);

  // ===== Data helpers =====
  // Recipes
  const recipesKey='qc_recipes';
  const getRecipesArr=()=>{ try{ const a=JSON.parse(localStorage.getItem(recipesKey)||'[]'); return Array.isArray(a)?a:[]; }catch{return [];} };
  const setRecipesArr=(a)=> localStorage.setItem(recipesKey, JSON.stringify(a));
  const getRecipesObj=()=>{ const o={}; getRecipesArr().forEach(r=>o[r.name]=r); return o; };
  function seedDefaults(){
    if (getRecipesArr().length) return;
    setRecipesArr([
      {name:'Seared Steak', image:'assets/recipe1.jpg', ingredients:['steak','salt','pepper','oil'], steps:['Pat dry and salt steak','Preheat skillet','Sear 90s per side','Rest and slice']},
      {name:'Garlic Shrimp', image:'assets/recipe2.jpg', ingredients:['shrimp','garlic','butter','lemon'], steps:['Toss shrimp with garlic','Cook 2–3 min','Finish with butter']},
      {name:'Crispy Wings', image:'assets/recipe3.jpg', ingredients:['chicken wings','salt','baking powder'], steps:['Pat dry wings','Air fry until crisp','Toss in sauce']}
    ]);
  }
  seedDefaults();

  // Favorites
  const favKey='qc_favorites';
  const getFavs=()=> new Set(JSON.parse(localStorage.getItem(favKey)||'[]'));
  const setFavs=(set)=> localStorage.setItem(favKey, JSON.stringify([...set]));

  // Render recipe cards
  const cardsWrap=document.getElementById('recipe-cards');
  function renderRecipeCards(){
    if (!cardsWrap) return;
    let arr=getRecipesArr();
    if (!arr || !arr.length) { seedDefaults(); arr=getRecipesArr(); }
    const favs=getFavs();
    cardsWrap.innerHTML='';
    arr.forEach(r=>{
      const col=document.createElement('div'); col.className='col s12 m6';
      col.innerHTML=`<div class="card section-card" data-name="${r.name}">
        ${r.image?`<div class="card-image"><img src="${r.image}" alt="${r.name}"></div>`:''}
        <div class="card-content">
          <span class="card-title">${r.name}</span>
          ${(r.ingredients&&r.ingredients.length)?`<p class="grey-text">${r.ingredients.slice(0,4).join(', ')}${r.ingredients.length>4?'…':''}</p>`:''}
        </div>
        <div class="card-action">
          <a href="#!" class="btn-flat recipe-btn" data-name="${r.name}">Open</a>
          <a href="#!" class="btn-flat fav-btn" data-name="${r.name}"><i class="material-icons">${favs.has(r.name)?'star':'star_border'}</i></a>
          <a href="#!" class="btn-flat red-text del-recipe-btn" data-name="${r.name}"><i class="material-icons">delete</i></a>
        </div>`;
      cardsWrap.appendChild(col);
    });
  }
  renderRecipeCards();

  // Recipe modal
  let lastOpenedRecipe=null;
  document.getElementById('recipe-cards')?.addEventListener('click',(e)=>{
    const openBtn=e.target.closest('.recipe-btn');
    const favBtn=e.target.closest('.fav-btn');
    const delBtn=e.target.closest('.del-recipe-btn');
    if(openBtn){
      e.preventDefault();
      const r=getRecipesObj()[openBtn.dataset.name]; if(!r) return;
      lastOpenedRecipe=r.name;
      document.getElementById('recipe-title').textContent=r.name;
      const ol=document.getElementById('recipe-steps'); ol.innerHTML='';
      (r.steps||[]).forEach(s=>{ const li=document.createElement('li'); li.textContent=s; ol.appendChild(li); });
      M.Modal.getInstance(document.getElementById('recipe-modal')).open();
      return;
    }
    if(favBtn){
      e.preventDefault();
      const favs=getFavs();
      const name=favBtn.dataset.name;
      if (favs.has(name)) favs.delete(name); else favs.add(name);
      setFavs(favs);
      M.toast({html: favs.has(name)?'Added to favorites':'Removed from favorites'});
      renderRecipeCards();
      return;
    }
    if(delBtn){
      e.preventDefault();
      const name=delBtn.dataset.name;
      const arr=getRecipesArr().filter(r=>r.name!==name);
      setRecipesArr(arr);
      M.toast({html:`Deleted: ${name}`});
      renderRecipeCards();
      try{ suggestRecipes(); }catch{}
      return;
    }
  });

  // Add/Edit recipe
  document.getElementById('edit-recipe-btn')?.addEventListener('click',()=>{
    if(!lastOpenedRecipe) return;
    const r=getRecipesObj()[lastOpenedRecipe]; if(!r) return;
    document.getElementById('ur-title').textContent='Edit Recipe';
    document.getElementById('ur-name').value=r.name;
    document.getElementById('ur-image').value=r.image||'';
    document.getElementById('ur-ingredients').value=(r.ingredients||[]).join(', ');
    document.getElementById('ur-steps').value=(r.steps||[]).join('\n');
    document.getElementById('ur-original-name').value=r.name;
    if (M.updateTextFields) M.updateTextFields();
    M.Modal.getInstance(document.getElementById('user-recipe-modal')).open();
  });
  document.getElementById('add-recipe-btn')?.addEventListener('click',()=>{
    document.getElementById('ur-title').textContent='Add Recipe';
    document.getElementById('ur-name').value='';
    document.getElementById('ur-image').value='';
    document.getElementById('ur-ingredients').value='';
    document.getElementById('ur-steps').value='';
    document.getElementById('ur-original-name').value='';
    if (M.updateTextFields) M.updateTextFields();
    M.Modal.getInstance(document.getElementById('user-recipe-modal')).open();
  });
  document.getElementById('ur-save')?.addEventListener('click',()=>{
    const name=(document.getElementById('ur-name').value||'').trim();
    if(!name){ M.toast({html:'Title is required'}); return; }
    const image=(document.getElementById('ur-image').value||'').trim();
    const ingredients=(document.getElementById('ur-ingredients').value||'').split(',').map(s=>s.trim()).filter(Boolean);
    const steps=(document.getElementById('ur-steps').value||'').split('\n').map(s=>s.trim()).filter(Boolean);
    const original=document.getElementById('ur-original-name').value;
    let arr=getRecipesArr();
    if(original && original!==name) arr=arr.filter(r=>r.name!==original); else arr=arr.filter(r=>r.name!==name);
    arr.push({name,image,ingredients,steps});
    setRecipesArr(arr);
    M.toast({html:'Recipe saved'});
    M.Modal.getInstance(document.getElementById('user-recipe-modal')).close();
    renderRecipeCards();
    try{ suggestRecipes(); }catch{}
  });

  // Pantry
  const pantryKey='qc_pantry'; const pantryList=document.getElementById('pantry-list');
  const getPantry=()=>{ try{ const arr=JSON.parse(localStorage.getItem(pantryKey)||'[]'); return arr.map(it=> (typeof it==='string')?({name:it, qty:1}):({name:it.name, qty:Math.max(1,it.qty||1)})); }catch{return [];} };
  const setPantry=(arr)=> localStorage.setItem(pantryKey, JSON.stringify(arr.map(it=>({name:it.name, qty:Math.max(1,it.qty||1)}))));
  function renderPantry(){
    if(!pantryList) return;
    pantryList.innerHTML='';
    const items=getPantry();
    items.forEach((it,idx)=>{
      const li=document.createElement('li'); li.className='collection-item';
      li.innerHTML=`<div style="display:flex;align-items:center;gap:10px;justify-content:space-between;">
        <div style="flex:1 1 auto;"><strong>${it.name}</strong> <span class="grey-text">× ${it.qty}</span></div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button type="button" class="btn-flat tiny p-dec"><i class="material-icons">remove</i></button>
          <button type="button" class="btn-flat tiny p-inc"><i class="material-icons">add</i></button>
          <button type="button" class="btn-flat tiny p-del"><i class="material-icons red-text">delete</i></button>
        </div></div>`;
      li.querySelector('.p-dec').addEventListener('click',e=>{ e.preventDefault(); const arr=getPantry(); arr[idx].qty=Math.max(1,(arr[idx].qty||1)-1); setPantry(arr); renderPantry(); try{ suggestRecipes(); }catch{} });
      li.querySelector('.p-inc').addEventListener('click',e=>{ e.preventDefault(); const arr=getPantry(); arr[idx].qty=(arr[idx].qty||1)+1; setPantry(arr); renderPantry(); try{ suggestRecipes(); }catch{} });
      li.querySelector('.p-del').addEventListener('click',e=>{ e.preventDefault(); const arr=getPantry(); arr.splice(idx,1); setPantry(arr); renderPantry(); try{ suggestRecipes(); }catch{} });
      pantryList.appendChild(li);
    });
  }
  document.getElementById('add-pantry')?.addEventListener('click',()=>{
    const input=document.getElementById('pantry-input'); const val=input.value.trim(); if(!val) return;
    const items=getPantry(); items.push({name:val, qty:1}); setPantry(items); input.value='';
    renderPantry(); try{ suggestRecipes(); }catch{}; if (M && M.toast) M.toast({html:'Added to pantry'});
  });

  // Timers + SW notifications
  const timerList=document.getElementById('timer-list'); let timerSeq=0; const timers=new Map();
  const format=(sec)=>{ const s=Math.max(0,Math.round(sec)); const m=Math.floor(s/60); const r=s%60; return m+'m '+r+'s'; };
  function notifyTimerDone(title){
    if ('Notification' in window && Notification.permission === 'granted') {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg && reg.showNotification) {
            reg.showNotification('Timer done', {
              body: title,
              icon: 'assets/icon-192.png',
              badge: 'assets/icon-192.png',
              vibrate: [200,100,200],
              tag: 'quickcook-timer-' + title
            });
          } else { new Notification('Timer done', { body:title, icon:'assets/icon-192.png' }); }
        });
      } else { new Notification('Timer done', { body:title, icon:'assets/icon-192.png' }); }
    } else { if (M && M.toast) M.toast({html:`${title} done!`}); }
  }
  function renderTimer(t){
    if(!t.el){
      const li=document.createElement('li'); li.className='collection-item';
      li.innerHTML=`<span class="title"><strong>${t.name}</strong> — <span class="time"></span></span>
      <div class="secondary-content" style="display:flex;gap:8px;align-items:center;">
        <a href="#!" class="btn-flat tiny pause"><i class="material-icons">pause</i></a>
        <a href="#!" class="btn-flat tiny resume" style="display:none;"><i class="material-icons">play_arrow</i></a>
        <a href="#!" class="btn-flat tiny remove"><i class="material-icons">close</i></a>
      </div>`;
      t.el=li; t.timeEl=li.querySelector('.time');
      li.querySelector('.pause').addEventListener('click',e=>{ e.preventDefault(); pauseTimer(t.id); });
      li.querySelector('.resume').addEventListener('click',e=>{ e.preventDefault(); resumeTimer(t.id); });
      li.querySelector('.remove').addEventListener('click',e=>{ e.preventDefault(); removeTimer(t.id); });
      timerList?.appendChild(li);
    }
    t.timeEl.textContent=format(t.remaining);
    const pauseBtn=t.el.querySelector('.pause'), resumeBtn=t.el.querySelector('.resume');
    pauseBtn.style.display=t.running?'':'none'; resumeBtn.style.display=t.running?'none':'';
  }
  function tick(id){ const t=timers.get(id); if(!t) return; t.remaining-=1; renderTimer(t); if(t.remaining<=0){ clearInterval(t.interval); t.running=false; t.remaining=0; renderTimer(t); notifyTimerDone(t.name); } }
  function startTimer(name,total){ const id=++timerSeq; const t={id,name,remaining:total,running:true,el:null,interval:null,timeEl:null}; timers.set(id,t); renderTimer(t); t.interval=setInterval(()=>tick(id),1000); }
  function pauseTimer(id){ const t=timers.get(id); if(!t||!t.running) return; clearInterval(t.interval); t.running=false; renderTimer(t); }
  function resumeTimer(id){ const t=timers.get(id); if(!t||t.running||t.remaining<=0) return; t.running=true; renderTimer(t); t.interval=setInterval(()=>tick(id),1000); }
  function removeTimer(id){ const t=timers.get(id); if(!t) return; clearInterval(t.interval); if(t.el&&t.el.parentNode) t.el.parentNode.removeChild(t.el); timers.delete(id); }
  document.getElementById('start-timer')?.addEventListener('click',()=>{
    const min=parseInt(document.getElementById('timer-min').value||'0',10);
    const sec=parseInt(document.getElementById('timer-sec').value||'0',10);
    const name=document.getElementById('timer-name').value||'Timer';
    const total=min*60+sec; if(total<=0) return; startTimer(name,total);
  });

  // Shopping List
  const shopKey='qc_shop'; const shopList=document.getElementById('shop-list');
  const getShop=()=>{ try{ const a=JSON.parse(localStorage.getItem(shopKey)||'[]'); return Array.isArray(a)?a:[]; }catch{return [];} };
  const setShop=(a)=> localStorage.setItem(shopKey, JSON.stringify(a));
  function renderShop(){
    if(!shopList) return;
    shopList.innerHTML='';
    const items=getShop();
    items.forEach((it,idx)=>{
      if(typeof it==='string'){ it={name:it,qty:1}; items[idx]=it; setShop(items); }
      const li=document.createElement('li'); li.className='collection-item';
      li.innerHTML=`<div style="display:flex;align-items:center;gap:10px;justify-content:space-between;">
        <div style="flex:1 1 auto;"><strong>${it.name}</strong> <span class="grey-text">× ${it.qty}</span></div>
        <div style="display:flex;align-items:center;gap:6px;">
          <a href="#!" class="btn-flat tiny dec"><i class="material-icons">remove</i></a>
          <a href="#!" class="btn-flat tiny inc"><i class="material-icons">add</i></a>
          <a href="#!" class="btn-flat tiny to-pantry"><i class="material-icons">kitchen</i></a>
          <a href="#!" class="btn-flat tiny delete"><i class="material-icons red-text">delete</i></a>
        </div></div>`;
      li.querySelector('.dec').addEventListener('click',e=>{ e.preventDefault(); const arr=getShop(); arr[idx].qty=Math.max(1,(arr[idx].qty||1)-1); setShop(arr); renderShop(); });
      li.querySelector('.inc').addEventListener('click',e=>{ e.preventDefault(); const arr=getShop(); arr[idx].qty=(arr[idx].qty||1)+1; setShop(arr); renderShop(); });
      li.querySelector('.delete').addEventListener('click',e=>{ e.preventDefault(); const arr=getShop(); arr.splice(idx,1); setShop(arr); renderShop(); });
      li.querySelector('.to-pantry').addEventListener('click',e=>{ e.preventDefault(); const arr=getShop(); const item=arr[idx]; const p=getPantry(); const i=p.findIndex(x=>x.name.toLowerCase()===item.name.toLowerCase()); if(i>=0) p[i].qty += item.qty; else p.push({name:item.name, qty:item.qty}); setPantry(p); renderPantry(); try{ suggestRecipes(); }catch{}; if (M && M.toast) M.toast({html:`Added to pantry: ${item.name} × ${item.qty}`}); });
      shopList.appendChild(li);
    });
  }
  document.getElementById('add-shop')?.addEventListener('click',()=>{
    const input=document.getElementById('shop-input'); const qtyEl=document.getElementById('shop-qty');
    const name=input.value.trim(); let qty=parseInt(qtyEl.value||'1',10);
    if(!name) return; if(!Number.isFinite(qty)||qty<1) qty=1;
    const items=getShop(); items.push({name,qty}); setShop(items);
    input.value=''; qtyEl.value='1'; renderShop(); if (M && M.toast) M.toast({html:'Added to shopping list'});
  });

  // FAB quick nav
  document.getElementById('fab-add-pantry')?.addEventListener('click',()=>{ location.hash='#pantry'; setTimeout(()=>document.getElementById('pantry-input')?.focus(),50); });
  document.getElementById('fab-add-shop')?.addEventListener('click',()=>{ location.hash='#list'; setTimeout(()=>document.getElementById('shop-input')?.focus(),50); });
  document.getElementById('fab-start-timer')?.addEventListener('click',()=>{ location.hash='#timers'; });

  // Dark mode toggle (html + body)
  const darkKey='qc_dark'; const darkToggle=document.getElementById('dark-toggle');
  function applyDark(on){ document.body.classList.toggle('dark', !!on); document.documentElement.classList.toggle('dark', !!on); }
  applyDark(localStorage.getItem(darkKey)==='1');
  if (darkToggle) {
    darkToggle.checked = localStorage.getItem(darkKey)==='1';
    darkToggle.addEventListener('change',()=>{ localStorage.setItem(darkKey, darkToggle.checked?'1':'0'); applyDark(darkToggle.checked); });
  }

  // Notifications enable button
  document.getElementById('ask-notify')?.addEventListener('click', async ()=>{
    try{ await Notification.requestPermission(); }catch(e){} 
    if (M && M.toast) M.toast({html:`Notifications: ${Notification.permission}`});
  });

  // Planner
  const normalize=(s)=> (s||'').toLowerCase().trim();
  const getPantrySet=()=> new Set(getPantry().map(it=>normalize(it.name)));
  function suggestRecipes(){
    const list=document.getElementById('planner-suggestions'); if(!list) return;
    const pantry=getPantrySet();
    const recipes=Object.values(getRecipesObj());
    const scored=recipes.map(r=>{
      const need=(r.ingredients||[]).map(normalize);
      const have=need.filter(x=>pantry.has(x));
      return {name:r.name, have:have.length, needN:need.length, missing:need.filter(x=>!pantry.has(x))};
    }).sort((a,b)=> b.have-a.have || a.needN-b.needN);
    list.innerHTML='';
    scored.forEach(s=>{
      const li=document.createElement('li'); li.className='collection-item';
      const missingText=s.missing.length?`Missing: ${s.missing.join(', ')}`:'You have all ingredients!';
      li.innerHTML=`<span><strong>${s.name}</strong> — ${s.have}/${s.needN}</span><br><span class="grey-text">${missingText}</span>`;
      list.appendChild(li);
    });
  }

  // Initial route after everything set up
  handleHash(); // initial
  // Ensure home has cards on first load
  if ((location.hash||'#home') === '#home') { renderRecipeCards(); }
  // ===== Install prompt & iOS tip with cooldown =====
  let deferredPrompt = null;
  const banner = document.getElementById('install-banner');
  const iosTip = document.getElementById('ios-tip');

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const seenKey = 'qc_install_seen_v2'; // bump to re-show to everyone
  const coolOffDays = 14;

  function shouldShowAgain() {
    const last = Number(localStorage.getItem(seenKey) || 0);
    return Date.now() - last > coolOffDays * 864e5;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!isStandalone && shouldShowAgain() && banner) {
      banner.style.display = 'block';
    }
  });

  document.getElementById('install-btn')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (banner) banner.style.display = 'none';
    localStorage.setItem(seenKey, Date.now().toString());
  });

  document.getElementById('dismiss-btn')?.addEventListener('click', () => {
    if (banner) banner.style.display = 'none';
    localStorage.setItem(seenKey, Date.now().toString());
  });

  window.addEventListener('load', () => {
    if (!isStandalone && isiOS && shouldShowAgain() && iosTip) {
      iosTip.style.display = 'block';
    }
  });
  document.getElementById('ios-tip-dismiss')?.addEventListener('click', () => {
    if (iosTip) iosTip.style.display = 'none';
    localStorage.setItem(seenKey, Date.now().toString());
  });

});