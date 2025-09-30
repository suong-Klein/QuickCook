document.addEventListener('DOMContentLoaded', () => {
  // Init UI
  M.Sidenav.init(document.querySelectorAll('.sidenav'));
  M.Modal.init(document.querySelectorAll('.modal'));
  // Init core UI
  M.Sidenav.init(document.querySelectorAll('.sidenav'));
  M.Modal.init(document.querySelectorAll('.modal'));

  // Init FAB instance
  const fabEl = document.querySelector('.fixed-action-btn');
  let fab = M.FloatingActionButton.getInstance(fabEl) ||
            M.FloatingActionButton.init(fabEl, { hoverEnabled: false });

  const mainBtn  = fabEl.querySelector('a.btn-floating');     // main blue button
  const mainIcon = mainBtn.querySelector('i');

  const setIcon = (open) => { mainIcon.textContent = open ? 'remove' : 'add'; };

  // Intercept the main-button click in the CAPTURE PHASE so Materialize doesn't get it.
  mainBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();  // block other click handlers
    const isOpen = fabEl.classList.contains('active');
    if (isOpen) { fab.close(); setIcon(false); }
    else       { fab.open();  setIcon(true);  }
  }, true);

  // When any mini-action is clicked, close and reset to plus
  fabEl.querySelectorAll('ul a.btn-floating').forEach(action => {
    action.addEventListener('click', () => { fab.close(); setIcon(false); }, true);
  });

  document.addEventListener('click', (evt) => {
    if (!fabEl.contains(evt.target)) {
      setTimeout(() => setIcon(fabEl.classList.contains('active')), 0);
    }
  });

  // Set initial icon
  setIcon(fabEl.classList.contains('active'));

  // Refresh floating labels for Materialize text fields
  if (M.updateTextFields) M.updateTextFields();

  // Router
  const pages = document.querySelectorAll('.page');
  function showPage(id) {
    pages.forEach(p => p.classList.add('hidden'));
    document.getElementById(id)?.classList.remove('hidden');
    window.scrollTo(0,0);
  }
  function handleHash() {
    let hash = location.hash.replace('#', '');
    if (!hash || !document.getElementById(hash)) hash = 'home';
    showPage(hash);
    // Refresh page-specific lists when navigating
    try { if (hash==='pantry') renderPantry(); if (hash==='list') renderShop(); } catch(e) {}
    if (M.updateTextFields) M.updateTextFields();
  }
  window.addEventListener('hashchange', handleHash);
  handleHash();

  // Pantry
  const pantryKey = 'qc_pantry';
  const pantryList = document.getElementById('pantry-list');

  function parseLegacyPantryItem(s){
    // supports "name xN" legacy format
    if (typeof s !== 'string') return null;
    const m = s.match(/^(.*)\s+x(\d+)$/i);
    if (m) return { name: m[1].trim(), qty: Math.max(1, parseInt(m[2], 10) || 1) };
    return { name: s.trim(), qty: 1 };
  }

  function getPantry(){
    try{
      const arr = JSON.parse(localStorage.getItem(pantryKey) || '[]');
      return arr.map(it => (typeof it === 'string' ? parseLegacyPantryItem(it) : { name: it.name, qty: Math.max(1, it.qty||1) }));
    } catch(e){ return []; }
  }

  function setPantry(arr){
    localStorage.setItem(pantryKey, JSON.stringify(arr.map(it => ({ name: it.name, qty: Math.max(1, it.qty||1) }))));
  }

  function mergePantryItem(name, qty){
    const items = getPantry();
    const idx = items.findIndex(x => x.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) items[idx].qty += qty;
    else items.push({ name, qty });
    setPantry(items);
    return items;
  }

  function renderPantry(){
    pantryList.innerHTML = '';
    const items = getPantry();
    items.forEach((it, idx) => {
      const li = document.createElement('li');
      li.className = 'collection-item';
      li.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;justify-content:space-between;">
          <div style="flex:1 1 auto;">
            <span><strong>${it.name}</strong></span>
            <span class="grey-text"> × <span class="qty">${it.qty}</span></span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <button type="button" class="btn-flat tiny p-dec" title="Decrease"><i class="material-icons">remove</i></button>
            <button type="button" class="btn-flat tiny p-inc" title="Increase"><i class="material-icons">add</i></button>
            <button type="button" class="btn-flat tiny p-del" title="Delete"><i class="material-icons red-text">delete</i></button>
          </div>
        </div>`;

      // Controls
      li.querySelector('.p-dec').addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const arr = getPantry();
        arr[idx].qty = Math.max(1, (arr[idx].qty||1) - 1);
        setPantry(arr); renderPantry();
      }, true);

      li.querySelector('.p-inc').addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const arr = getPantry();
        arr[idx].qty = (arr[idx].qty||1) + 1;
        setPantry(arr); renderPantry();
      }, true);

      li.querySelector('.p-del').addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const arr = getPantry();
        arr.splice(idx, 1);
        setPantry(arr);
        try { history.replaceState(null, '', '#pantry'); } catch(_) {}
        renderPantry();
      }, true);

      pantryList.appendChild(li);
    });
  }

  pantryList.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a && a.getAttribute('href') && a.getAttribute('href').startsWith('#')) {
      e.preventDefault(); e.stopPropagation();
    }
  }, true);

  document.getElementById('add-pantry').addEventListener('click', (e) => {
    const input = document.getElementById('pantry-input');
    const val = input.value.trim();
    if (!val) return;
    const items = getPantry();
    items.push({ name: val, qty: 1 });
    setPantry(items);
    input.value = '';
    renderPantry();
    M.toast({html: 'Added to pantry'});
  });

  renderPantry();

  // Timers (with Pause/Resume)
  const timerList = document.getElementById('timer-list');
  let timerSeq = 0;
  const timers = new Map(); // id -> {id,name,remaining,interval,running,el}

  function format(sec){
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s/60);
    const r = s % 60;
    return m + 'm ' + r + 's';
  }

  function renderTimer(t){
    // Build row only once
    if(!t.el){
      const li = document.createElement('li');
      li.className = 'collection-item';
      li.innerHTML = `
        <span class="title"><strong>${t.name}</strong> — <span class="time"></span></span>
        <div class="secondary-content" style="display:flex;gap:8px;align-items:center;">
          <a href="#!" class="btn-flat tiny pause"><i class="material-icons">pause</i></a>
          <a href="#!" class="btn-flat tiny resume" style="display:none;"><i class="material-icons">play_arrow</i></a>
          <a href="#!" class="btn-flat tiny remove"><i class="material-icons">close</i></a>
        </div>`;
      t.el = li;
      t.timeEl = li.querySelector('.time');
      li.querySelector('.pause').addEventListener('click', e => {
        e.preventDefault();
        pauseTimer(t.id);
      });
      li.querySelector('.resume').addEventListener('click', e => {
        e.preventDefault();
        resumeTimer(t.id);
      });
      li.querySelector('.remove').addEventListener('click', e => {
        e.preventDefault();
        removeTimer(t.id);
      });
      timerList.appendChild(li);
    }
    t.timeEl.textContent = format(t.remaining);
    const pauseBtn = t.el.querySelector('.pause');
    const resumeBtn = t.el.querySelector('.resume');
    pauseBtn.style.display = t.running ? '' : 'none';
    resumeBtn.style.display = t.running ? 'none' : '';
  }

  function tick(id){
    const t = timers.get(id);
    if(!t) return;
    t.remaining -= 1;
    renderTimer(t);
    if(t.remaining <= 0){
      clearInterval(t.interval);
      t.running = false;
      t.remaining = 0;
      renderTimer(t);
      M.toast({html: t.name + ' done!'});
    }
  }

  function startTimer(name, total){
    const id = ++timerSeq;
    const t = { id, name, remaining: total, running: true, el: null, interval: null, timeEl: null };
    timers.set(id, t);
    renderTimer(t);
    t.interval = setInterval(() => tick(id), 1000);
  }

  function pauseTimer(id){
    const t = timers.get(id);
    if(!t || !t.running) return;
    clearInterval(t.interval);
    t.running = false;
    renderTimer(t);
  }

  function resumeTimer(id){
    const t = timers.get(id);
    if(!t || t.running || t.remaining <= 0) return;
    t.running = true;
    renderTimer(t);
    t.interval = setInterval(() => tick(id), 1000);
  }

  function removeTimer(id){
    const t = timers.get(id);
    if(!t) return;
    clearInterval(t.interval);
    if(t.el && t.el.parentNode) t.el.parentNode.removeChild(t.el);
    timers.delete(id);
  }

  document.getElementById('start-timer').addEventListener('click', () => {
    const min = parseInt(document.getElementById('timer-min').value || '0', 10);
    const sec = parseInt(document.getElementById('timer-sec').value || '0', 10);
    const name = document.getElementById('timer-name').value || 'Timer';
    const total = min * 60 + sec;
    if (total <= 0) return;
    startTimer(name, total);
  });

// Shopping
  const shopKey='qc_shop'; const shopList=document.getElementById('shop-list');
  function getShop(){ try { const arr=JSON.parse(localStorage.getItem(shopKey)||'[]'); return Array.isArray(arr)?arr:[]; } catch(e){ return []; } }
  function setShop(arr){ localStorage.setItem(shopKey, JSON.stringify(arr)); }

  function renderShop(){
    shopList.innerHTML='';
    const items = getShop();
    items.forEach((it, idx) => {
      if(typeof it === 'string'){ it = {name: it, qty: 1}; items[idx]=it; setShop(items); } // migrate old entries
      const li=document.createElement('li'); li.className='collection-item';
      li.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;justify-content:space-between;">
          <div style="flex:1 1 auto;">
            <span><strong>${it.name}</strong></span>
            <span class="grey-text"> × <span class="qty">${it.qty}</span></span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <a href="#!" class="btn-flat tiny dec" title="Decrease"><i class="material-icons">remove</i></a>
            <a href="#!" class="btn-flat tiny inc" title="Increase"><i class="material-icons">add</i></a>
            <a href="#!" class="btn-flat tiny to-pantry" title="Add to Pantry"><i class="material-icons">kitchen</i></a>
            <a href="#!" class="btn-flat tiny delete" title="Delete"><i class="material-icons red-text">delete</i></a>
          </div>
        </div>`;
      // Attach handlers
      li.querySelector('.dec').addEventListener('click', e => {
        e.preventDefault();
        const arr = getShop();
        arr[idx].qty = Math.max(1, (arr[idx].qty||1) - 1);
        setShop(arr); renderShop();
      });
      li.querySelector('.inc').addEventListener('click', e => {
        e.preventDefault();
        const arr = getShop();
        arr[idx].qty = (arr[idx].qty||1) + 1;
        setShop(arr); renderShop();
      });
      li.querySelector('.delete').addEventListener('click', e => {
        e.preventDefault();
        const arr = getShop();
        arr.splice(idx, 1);
        setShop(arr); renderShop();
      });
      li.querySelector('.to-pantry').addEventListener('click', e => {
        e.preventDefault();
        const arr = getShop();
        const item = arr[idx];
        // Push to pantry as "name xqty"
        const pantryItems = JSON.parse(localStorage.getItem(pantryKey) || '[]');
        pantryItems.push(item.qty > 1 ? `${item.name} x${item.qty}` : item.name);
        localStorage.setItem(pantryKey, JSON.stringify(pantryItems));
        M.toast({html: `Added to pantry: ${item.name} × ${item.qty}`});
        // If user is on pantry page, refresh list now
        try { renderPantry(); } catch(e) {}
      });
      shopList.appendChild(li);
    });
  }

  document.getElementById('add-shop').addEventListener('click',()=>{
    const input=document.getElementById('shop-input'); const qtyEl=document.getElementById('shop-qty');
    const name=input.value.trim(); let qty=parseInt(qtyEl.value||'1',10);
    if(!name) return; if(!Number.isFinite(qty)||qty<1) qty=1;
    const items = getShop(); items.push({name, qty});
    setShop(items); input.value=''; qtyEl.value='1'; renderShop(); M.toast({html:'Added to shopping list'});
  });

  renderShop();
// FAB
  document.getElementById('fab-add-pantry').addEventListener('click',()=>{ location.hash='#pantry'; setTimeout(()=>document.getElementById('pantry-input').focus(),50); });
  document.getElementById('fab-add-shop').addEventListener('click',()=>{ location.hash='#list'; setTimeout(()=>document.getElementById('shop-input').focus(),50); });
  document.getElementById('fab-start-timer').addEventListener('click',()=>{ location.hash='#timers'; });

  // Recipes (prevent hash change)
  const recipeSteps = {
    'Seared Steak': ['Pat dry and salt steak', 'Preheat skillet until hot', 'Sear 90 seconds per side', 'Rest and slice'],
    'Garlic Shrimp': ['Toss shrimp with garlic', 'Cook 2–3 minutes', 'Finish with butter'],
    'Crispy Wings': ['Pat wings dry', 'Air fry until crisp', 'Toss in sauce']
  };
  document.querySelectorAll('.recipe-btn').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      e.preventDefault();
      const name=btn.dataset.name;
      document.getElementById('recipe-title').textContent=name;
      const ol=document.getElementById('recipe-steps'); ol.innerHTML='';
      (recipeSteps[name]||[]).forEach(step=>{ const li=document.createElement('li'); li.textContent=step; ol.appendChild(li); });
      M.Modal.getInstance(document.getElementById('recipe-modal')).open();
    });
  });

  // Settings
  document.getElementById('clear-data').addEventListener('click',()=>{
    localStorage.removeItem(pantryKey); localStorage.removeItem(shopKey);
    renderPantry(); renderShop(); M.toast({html:'Local data cleared'});
  });

  // Install banner
  let deferredPrompt; const banner=document.getElementById('install-banner');
  document.getElementById('dismiss-btn').addEventListener('click',()=>banner.classList.add('hidden'));
  document.getElementById('install-btn').addEventListener('click', async ()=>{
    if(!deferredPrompt) return; deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice; M.toast({html: outcome==='accepted'?'Installing…':'Install dismissed'});
    banner.classList.add('hidden'); deferredPrompt=null;
  });
  window.addEventListener('beforeinstallprompt',(e)=>{ e.preventDefault(); deferredPrompt=e; banner.classList.remove('hidden'); });

  // SW
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(console.error);
  }
});