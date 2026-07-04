/* ============================================================
   SAGA HERBALS — FLASH SALE MODULE
   Countdown timer. Config loaded from Firebase settings.
   ============================================================ */

const FlashSaleModule = (() => {
  let _timer = null;

  function init(settings) {
    if (settings.flash_sale_active && settings.flash_sale_end) {
      _render(settings);
      _startCountdown(new Date(settings.flash_sale_end));
    } else {
      _hide();
    }
  }

  function _render(s) {
    const bar = document.getElementById('flash-sale-bar');
    if (!bar) return;
    const titleEl    = document.getElementById('flash-sale-title');
    const discountEl = document.getElementById('flash-sale-discount');
    const couponEl   = document.getElementById('flash-sale-coupon');
    const couponWrap = document.getElementById('flash-coupon-wrap');
    if (titleEl)    titleEl.textContent    = s.flash_sale_title    || '⚡ Flash Sale!';
    if (discountEl) discountEl.textContent = s.flash_sale_discount  || '';
    if (couponEl && s.flash_sale_coupon) {
      couponEl.textContent = s.flash_sale_coupon;
      if (couponWrap) couponWrap.style.display = 'flex';
    }
    bar.style.display = 'flex';
  }

  function _hide() {
    const bar = document.getElementById('flash-sale-bar');
    if (bar) bar.style.display = 'none';
  }

  function _startCountdown(endDate) {
    if (_timer) clearInterval(_timer);
    _tick(endDate);
    _timer = setInterval(() => _tick(endDate), 1000);
  }

  function _tick(endDate) {
    const diff = endDate - new Date();
    if (diff <= 0) { clearInterval(_timer); _hide(); return; }
    const h   = Math.floor(diff / 3600000);
    const m   = Math.floor((diff % 3600000) / 60000);
    const s   = Math.floor((diff % 60000) / 1000);
    const pad = n => String(n).padStart(2, '0');
    const el  = document.getElementById('flash-countdown');
    if (el) el.innerHTML =
      `<span class="countdown-unit">${pad(h)}<small>h</small></span>` +
      ` : <span class="countdown-unit">${pad(m)}<small>m</small></span>` +
      ` : <span class="countdown-unit">${pad(s)}<small>s</small></span>`;
  }

  return { init };
})();
