/* ============================================================
   SAGA HERBALS — WISHLIST MODULE (FIXED v2)
   - Fixed: toggle works even before init
   - Fixed: re-renders all wishlist buttons on toggle
   ============================================================ */

const WishlistModule = (() => {
  const KEY = 'saga_wishlist';
  let _items    = [];
  let _products = [];
  let _lang     = 'EN';

  function init(products, lang) {
    _products = products;
    _lang     = lang;
    _load();
    _syncAllButtons();
    _renderBadge();
  }

  function setProducts(p) { _products = p; }
  function setLang(l)     { _lang = l; }

  function _load() {
    try { _items = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e) { _items = []; }
  }

  function _save() {
    try { localStorage.setItem(KEY, JSON.stringify(_items)); } catch(e) {}
  }

  function has(id) { return _items.includes(String(id)); }
  function getCount() { return _items.length; }

  /* ---- Toggle (works even if init not called yet) ---- */
  function toggle(id) {
    id = String(id);
    _load(); // always load fresh from storage
    if (has(id)) {
      _items = _items.filter(x => x !== id);
      showToastSafe('Removed from wishlist');
    } else {
      _items.push(id);
      showToastSafe('Saved to wishlist ❤️');
    }
    _save();
    _syncAllButtons();
    _renderBadge();
    // If panel open, refresh it
    if (document.getElementById('wishlist-panel')?.classList.contains('open')) renderPanel();
  }

  function showToastSafe(msg) {
    if (typeof showToast === 'function') showToast(msg);
  }

  /* ---- Sync all heart buttons on page ---- */
  function _syncAllButtons() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
      const id = btn.dataset.id;
      if (!id) return;
      btn.textContent = has(id) ? '❤️' : '🤍';
      btn.classList.toggle('active', has(id));
    });
  }

  function _renderBadge() {
    const badge = document.getElementById('wishlist-count');
    if (!badge) return;
    badge.textContent  = _items.length;
    badge.style.display = _items.length > 0 ? 'flex' : 'none';
  }

  /* ---- Render wishlist panel ---- */
  function renderPanel() {
    const list = document.getElementById('wishlist-items');
    if (!list) return;
    _load();
    const products = _products.filter(p => _items.includes(String(p.id)));
    if (!products.length) {
      list.innerHTML = `<div class="wishlist-empty"><div style="font-size:2.5rem;margin-bottom:.75rem;">🤍</div><strong>Your wishlist is empty</strong><p>Tap ❤️ on any product to save it.</p></div>`;
      return;
    }
    const pName = p => _lang === 'TM' ? (p.nameTM || p.nameEN) : p.nameEN;
    list.innerHTML = products.map(p => `
      <div class="wishlist-item">
        <div class="wishlist-item-img">${p.imageUrl
          ? `<img src="${p.imageUrl}" alt="${p.nameEN}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;"/>`
          : `<span style="font-size:2rem;">${p.emoji || '🌿'}</span>`}</div>
        <div class="wishlist-item-info">
          <div class="wishlist-item-name">${pName(p)}</div>
          <div class="wishlist-item-price">₹${p.price}
            ${p.originalPrice ? `<span style="text-decoration:line-through;color:#9CA3AF;font-size:.8rem;margin-left:.3rem;">₹${p.originalPrice}</span>` : ''}
          </div>
        </div>
        <div class="wishlist-item-actions">
          <button onclick="CartModule.add('${p.id}');WishlistModule.toggle('${p.id}')" class="btn btn-primary btn-sm" style="font-size:.75rem;white-space:nowrap;">Add to Cart</button>
          <button onclick="WishlistModule.toggle('${p.id}')" style="background:none;border:none;cursor:pointer;font-size:1.1rem;color:#EF4444;padding:.25rem;">🗑</button>
        </div>
      </div>`).join('');
  }

  function open()  {
    renderPanel();
    document.getElementById('wishlist-panel')?.classList.add('open');
    document.getElementById('wishlist-overlay')?.classList.add('open');
  }
  function close() {
    document.getElementById('wishlist-panel')?.classList.remove('open');
    document.getElementById('wishlist-overlay')?.classList.remove('open');
  }

  return { init, setProducts, setLang, has, toggle, getCount, renderPanel, open, close };
})();
