/* ============================================================
   SAGA HERBALS — WISHLIST MODULE
   Save/remove products. Persists in localStorage.
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
    _renderBadge();
  }

  function setProducts(p) { _products = p; }
  function setLang(l)     { _lang = l; }

  function _load() {
    try { _items = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e) { _items = []; }
  }

  function _save() {
    try { localStorage.setItem(KEY, JSON.stringify(_items)); } catch(e) {}
    _renderBadge();
  }

  function has(id)    { return _items.includes(String(id)); }
  function getIds()   { return [..._items]; }
  function getCount() { return _items.length; }

  function toggle(id) {
    id = String(id);
    if (has(id)) {
      _items = _items.filter(x => x !== id);
      if (typeof showToast === 'function') showToast('Removed from wishlist');
    } else {
      _items.push(id);
      if (typeof showToast === 'function') showToast('Added to wishlist ❤️');
    }
    _save();
    document.querySelectorAll(`.wishlist-btn[data-id="${id}"]`).forEach(btn => {
      btn.textContent = has(id) ? '❤️' : '🤍';
      btn.classList.toggle('active', has(id));
    });
    if (document.getElementById('wishlist-panel')?.classList.contains('open')) renderPanel();
  }

  function _renderBadge() {
    const badge = document.getElementById('wishlist-count');
    if (!badge) return;
    badge.textContent   = _items.length;
    badge.style.display = _items.length > 0 ? 'flex' : 'none';
  }

  function renderPanel() {
    const list = document.getElementById('wishlist-items');
    if (!list) return;
    const products = _products.filter(p => _items.includes(String(p.id)));
    if (!products.length) {
      list.innerHTML = `<div style="text-align:center;padding:3rem 1rem;color:var(--color-text-light);">
        <div style="font-size:2.5rem;margin-bottom:.75rem;">🤍</div>
        <strong>Your wishlist is empty</strong>
        <p style="margin-top:.5rem;font-size:.85rem;">Tap ❤️ on any product to save it here.</p>
      </div>`;
      return;
    }
    const pName = p => _lang === 'TM' ? (p.nameTM || p.nameEN) : p.nameEN;
    list.innerHTML = products.map(p => `
      <div class="wishlist-item">
        <div class="wishlist-item-img">
          ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.nameEN}" style="width:100%;height:100%;object-fit:cover;"/>` : (p.emoji || '🌿')}
        </div>
        <div class="wishlist-item-info">
          <div class="wishlist-item-name">${pName(p)}</div>
          <div class="wishlist-item-price">₹${p.price}
            ${p.originalPrice ? `<span style="text-decoration:line-through;color:#9CA3AF;font-size:.8rem;margin-left:.3rem;">₹${p.originalPrice}</span>` : ''}
          </div>
        </div>
        <div class="wishlist-item-actions">
          <button onclick="CartModule.add('${p.id}');WishlistModule.toggle('${p.id}')" class="btn btn-primary btn-sm" style="font-size:.75rem;padding:.3rem .7rem;">Add to Cart</button>
          <button onclick="WishlistModule.toggle('${p.id}')" style="background:none;border:none;cursor:pointer;font-size:1rem;color:#EF4444;margin-top:.25rem;">🗑</button>
        </div>
      </div>`).join('');
  }

  function open() {
    renderPanel();
    document.getElementById('wishlist-panel')?.classList.add('open');
    document.getElementById('wishlist-overlay')?.classList.add('open');
  }
  function close() {
    document.getElementById('wishlist-panel')?.classList.remove('open');
    document.getElementById('wishlist-overlay')?.classList.remove('open');
  }

  return { init, setProducts, setLang, has, toggle, getIds, getCount, renderPanel, open, close };
})();
