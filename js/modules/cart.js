/* ============================================================
   SAGA HERBALS — CART MODULE
   All cart state, rendering and coupon logic.
   ============================================================ */

const CartModule = (() => {

  let _cart         = [];
  let _settings     = {};
  let _appliedCoupon = null;
  let _products     = [];
  let _lang         = 'EN';
  let _onUpdate     = null; // callback

  function init(settings, products, lang, onUpdate) {
    _settings = settings;
    _products = products;
    _lang     = lang;
    _onUpdate = onUpdate;
  }

  function setLang(lang) { _lang = lang; }
  function setSettings(s) { _settings = s; }
  function setProducts(p) { _products = p; }

  function productName(p) { return _lang === 'TM' ? (p.nameTM || p.nameEN) : p.nameEN; }

  /* ---- Add to cart ---- */
  function add(productId) {
    const p = _products.find(x => String(x.id) === String(productId));
    if (!p) return;
    if (p.stock === 0) { showToast('Product out of stock'); return; }
    const existing = _cart.find(c => String(c.id) === String(productId));
    if (existing) existing.qty++;
    else _cart.push({ ...p, qty: 1 });
    _sync();
    showToast(_lang === 'TM' ? 'கார்ட்டில் சேர்க்கப்பட்டது! 🌿' : 'Added to cart! 🌿');
  }

  function remove(id) {
    _cart = _cart.filter(c => String(c.id) !== String(id));
    _appliedCoupon = null;
    _sync();
  }

  function changeQty(id, delta) {
    const item = _cart.find(c => String(c.id) === String(id));
    if (!item) return;
    item.qty += delta;
    if (item.qty < 1) remove(id);
    else _sync();
  }

  function clear() { _cart = []; _appliedCoupon = null; _sync(); }

  /* ---- Calculations ---- */
  function subtotal() { return _cart.reduce((s, c) => s + c.price * c.qty, 0); }
  function itemCount() { return _cart.reduce((s, c) => s + c.qty, 0); }
  function getDiscount(sub) {
    if (!_appliedCoupon) return 0;
    if (_appliedCoupon.type === 'percent') return Math.round(sub * _appliedCoupon.value / 100);
    return Math.min(_appliedCoupon.value, sub);
  }
  function getShipping(afterDiscount) {
    const thr = _settings.freeShippingThreshold || 500;
    return afterDiscount >= thr ? 0 : (_settings.shippingCharge || 60);
  }
  function getTotal(paymentMethod) {
    const sub      = subtotal();
    const discount = getDiscount(sub);
    const shipping = getShipping(sub - discount);
    return PaymentModule.calculateTotal({ subtotal: sub, discount, shippingCharge: shipping, paymentMethod: paymentMethod || 'UPI', settings: _settings });
  }

  function getSummary(paymentMethod) {
    const sub      = subtotal();
    const discount = getDiscount(sub);
    const shipping = getShipping(sub - discount);
    const total    = PaymentModule.calculateTotal({ subtotal: sub, discount, shippingCharge: shipping, paymentMethod: paymentMethod || 'UPI', settings: _settings });
    return { sub, discount, shipping, total, coupon: _appliedCoupon };
  }

  function getItems() { return [..._cart]; }
  function getCoupon() { return _appliedCoupon; }

  /* ---- Coupon ---- */
  async function applyCoupon(code) {
    if (!code) return { ok: false, message: 'Enter a coupon code' };
    const sub    = subtotal();
    const result = await fbValidateCoupon(code, sub);
    if (result.valid) {
      _appliedCoupon = result.coupon;
      _sync();
      return { ok: true, message: `Coupon "${code.toUpperCase()}" applied! 🎉` };
    }
    return { ok: false, message: result.message };
  }

  function removeCoupon() { _appliedCoupon = null; _sync(); }

  /* ---- Render sidebar cart ---- */
  function render(container, settings) {
    _settings = settings || _settings;
    const footer   = document.getElementById('cart-footer');
    const sub      = subtotal();
    const discount = getDiscount(sub);
    const shipping = getShipping(sub - discount);
    const total    = sub - discount + shipping;

    if (_cart.length === 0) {
      container.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛒</div><strong>Your cart is empty</strong><p>Add some herbal goodness!</p></div>`;
      if (footer) footer.style.display = 'none';
      return;
    }

    container.innerHTML = _cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-emoji">${item.emoji || '🌿'}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${productName(item)}</div>
          <div class="cart-item-price">₹${item.price} each</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="CartModule.changeQty('${item.id}',-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="CartModule.changeQty('${item.id}',1)">+</button>
          </div>
        </div>
        <button class="remove-btn" onclick="CartModule.remove('${item.id}')">✕</button>
      </div>`).join('') + `
      <div class="cart-breakdown">
        <div class="breakdown-row"><span>Subtotal</span><span>₹${sub}</span></div>
        ${discount > 0 ? `<div class="breakdown-row green"><span>🎟 Coupon (${_appliedCoupon.code}) <button onclick="CartModule.removeCoupon()" class="inline-remove">✕</button></span><span>-₹${discount}</span></div>` : ''}
        <div class="breakdown-row ${shipping===0?'green':''}"><span>${shipping===0?'🎉 Free Shipping':'Shipping'}</span><span>₹${shipping}</span></div>
      </div>`;

    if (footer) {
      document.getElementById('cart-subtotal-num').textContent = `₹${total}`;
      footer.style.display = 'block';
    }
  }

  /* ---- Internal sync ---- */
  function _sync() {
    // Update badge
    const badge = document.getElementById('cart-count');
    if (badge) {
      const count = itemCount();
      badge.textContent = count;
      badge.classList.toggle('show', count > 0);
    }
    // Re-render if sidebar open
    const items = document.getElementById('cart-items');
    if (items) render(items, _settings);
    // Callback
    if (_onUpdate) _onUpdate(_cart);
  }

  return {
    init, setLang, setSettings, setProducts,
    add, remove, changeQty, clear,
    subtotal, itemCount, getDiscount, getShipping, getTotal, getSummary,
    getItems, getCoupon,
    applyCoupon, removeCoupon,
    render,
  };
})();
