/* ============================================================
   SAGA HERBALS — MAIN APP v4
   Orchestrates all modules. Thin controller — logic lives
   in modules/. Edit individual modules for specific features.
   ============================================================ */

let currentLang  = 'EN';
let liveProducts = [];
let siteSettings = {};
let liveReviews  = [];

/* ---- Bootstrap ---- */
document.addEventListener('DOMContentLoaded', async () => {
  initFirebase();
  try {
    await fbSeedProducts();
    siteSettings = await fbGetSettings();
    fbListenProducts(p => {
      liveProducts = p.filter(x => x.active !== false);
      CartModule.setProducts(liveProducts);
      renderProducts();
    });
    fbListenApprovedReviews(r => { liveReviews = r; renderReviews(); });
  } catch(e) {
    console.warn('Firebase error, using static data:', e);
    liveProducts = SHOP_DATA.products;
    siteSettings = { freeShippingThreshold:500, shippingCharge:60, cod_charge:30, whatsapp:'919952427492' };
  }
  CartModule.init(siteSettings, liveProducts, currentLang);
  SEOModule.applyFromSettings(siteSettings);
  SEOModule.injectStructuredData(siteSettings, liveProducts);
  renderAll();
  setupEvents();
});

/* ---- Helpers ---- */
function t(key) { return SHOP_DATA.lang[currentLang]?.[key] || SHOP_DATA.lang['EN']?.[key] || key; }
function pName(p) { return currentLang === 'TM' ? (p.nameTM || p.nameEN) : p.nameEN; }
function pDesc(p)  { return currentLang === 'TM' ? (p.descTM || p.descEN) : p.descEN; }
function getWA()   { return siteSettings.whatsapp || '919952427492'; }

/* ---- Language ---- */
function switchLang(lang) {
  currentLang = lang;
  CartModule.setLang(lang);
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  renderAll();
}

/* ---- Render all ---- */
function renderAll() {
  renderAnnouncement();
  renderNav(); renderHero(); renderTrust();
  renderProducts(); renderFeatures(); renderReviews();
  renderAbout(); renderContact(); renderFooter();
}

/* ---- Announcement bar ---- */
function renderAnnouncement() {
  const bar  = document.getElementById('announcement-bar');
  const text = document.getElementById('announcement-text');
  if (!bar) return;
  if (siteSettings.announcement_active && siteSettings.announcement) {
    text.textContent = siteSettings.announcement;
    bar.style.display = 'flex';
  } else {
    bar.style.display = 'none';
  }
}

function renderNav() {
  document.getElementById('nav-home').textContent     = t('navHome');
  document.getElementById('nav-products').textContent = t('navProducts');
  document.getElementById('nav-about').textContent    = t('navAbout');
  document.getElementById('nav-contact').textContent  = t('navContact');
}

function renderHero() {
  document.getElementById('hero-badge').textContent = t('heroBadge');
  document.getElementById('hero-sub').textContent   = t('heroSub');
  document.getElementById('hero-btn1').textContent  = t('heroBtn1');
  document.getElementById('hero-btn2').innerHTML    = '💬 ' + t('heroBtn2');
  ['stat1','stat2','stat3'].forEach(s => {
    document.getElementById(s+'-num').textContent = t(s+'Num');
    document.getElementById(s+'-lbl').textContent = t(s+'Label');
  });
  const span = t('heroTitleSpan');
  const pre  = currentLang === 'TM' ? 'இயற்கையின் கொடை,<br>' : 'Pure Nature,<br>';
  document.getElementById('hero-title').innerHTML = pre + `<span id="hero-title-span">${span}</span>`;
}

function renderTrust() {
  const thr = siteSettings.freeShippingThreshold || 500;
  document.getElementById('trust-free').textContent     = currentLang==='TM' ? `₹${thr}+ இலவச டெலிவரி` : `Free Shipping ₹${thr}+`;
  document.getElementById('trust-organic').textContent  = t('trustOrganic');
  document.getElementById('trust-safe').textContent     = t('trustSafe');
  document.getElementById('trust-delivery').textContent = t('trustDelivery');
  document.getElementById('trust-auth').textContent     = t('trustAuth');
}

/* ---- Products ---- */
function renderProducts() {
  document.getElementById('products-title').textContent = t('productsTitle');
  document.getElementById('products-sub').textContent   = t('productsSub');
  const prods = liveProducts.length ? liveProducts : SHOP_DATA.products;
  document.getElementById('products-grid').innerHTML = prods.map(p => productCard(p)).join('');
  setupScrollReveal();
}

function productCard(p) {
  const lowStock = p.stock !== undefined && p.stock > 0 && p.stock <= (siteSettings.low_stock_threshold || 5);
  const outStock = p.stock === 0;
  const hasMedia = p.imageUrl || p.videoUrl || p.reelUrl;
  return `
  <div class="product-card" onclick="openProductPage('${p.id}')" style="cursor:pointer;">
    <div class="product-img">
      ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.nameEN}" style="width:100%;height:100%;object-fit:cover;"/>` : `<div style="font-size:5rem;">${p.emoji||'🌿'}</div>`}
      ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
      ${lowStock ? `<div class="product-badge" style="top:auto;bottom:.75rem;background:#F59E0B;">Only ${p.stock} left!</div>` : ''}
      ${outStock ? `<div class="product-badge" style="top:auto;bottom:.75rem;background:#EF4444;">Out of Stock</div>` : ''}
      ${hasMedia ? `<div class="media-indicator">▶</div>` : ''}
    </div>
    <div class="product-info">
      <div class="product-tags">${(p.tags||[]).map(tag=>`<span class="tag">${tag}</span>`).join('')}</div>
      <div class="product-name">${pName(p)}</div>
      <div class="product-desc">${pDesc(p).substring(0,80)}${pDesc(p).length>80?'...':''}</div>
      <div class="product-footer">
        <div class="product-price">${p.originalPrice?`<span class="orig">₹${p.originalPrice}</span>`:''} ₹${p.price}</div>
        <button class="add-cart-btn" onclick="event.stopPropagation();CartModule.add('${p.id}')" ${outStock?'disabled style="opacity:.4;cursor:not-allowed;"':''}>+</button>
      </div>
    </div>
  </div>`;
}

/* ---- Product detail page (full page modal) ---- */
function openProductPage(id) {
  const p = (liveProducts.length ? liveProducts : SHOP_DATA.products).find(x => String(x.id) === String(id));
  if (!p) return;
  const modal = document.getElementById('product-detail-modal');
  const body  = document.getElementById('product-detail-body');

  const related = (liveProducts.length ? liveProducts : SHOP_DATA.products)
    .filter(x => x.id !== p.id && x.category === p.category).slice(0, 4);

  const videoHtml = p.videoUrl
    ? `<div class="product-video-wrap"><iframe src="${p.videoUrl.includes('youtube') ? p.videoUrl.replace('watch?v=','embed/') : p.videoUrl}" frameborder="0" allowfullscreen></iframe></div>` : '';
  const reelHtml  = p.reelUrl
    ? `<a href="${p.reelUrl}" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:.5rem;">📱 Watch on Instagram</a>` : '';

  body.innerHTML = `
    <div class="product-detail-layout">
      <div class="product-detail-media">
        ${p.imageUrl
          ? `<img src="${p.imageUrl}" alt="${p.nameEN}" style="width:100%;border-radius:14px;object-fit:cover;max-height:380px;"/>`
          : `<div style="width:100%;height:280px;background:var(--color-bg-alt);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:7rem;">${p.emoji||'🌿'}</div>`}
        ${videoHtml}
        ${reelHtml}
      </div>
      <div class="product-detail-info">
        <div class="product-tags">${(p.tags||[]).map(tag=>`<span class="tag">${tag}</span>`).join('')}</div>
        <h1 style="font-family:var(--font-display);font-size:1.7rem;color:var(--color-primary-dark);margin:.5rem 0;">${pName(p)}</h1>
        ${currentLang!=='TM' && p.nameTM ? `<p style="color:var(--color-text-light);font-size:.9rem;margin-bottom:.5rem;">${p.nameTM}</p>` : ''}
        <div style="display:flex;align-items:baseline;gap:.75rem;margin:.75rem 0;">
          <span style="font-family:var(--font-display);font-size:2rem;font-weight:700;color:var(--color-primary);">₹${p.price}</span>
          ${p.originalPrice ? `<span style="font-size:1rem;text-decoration:line-through;color:var(--color-text-light);">₹${p.originalPrice}</span><span style="font-size:.88rem;color:var(--color-success);font-weight:600;">Save ₹${p.originalPrice-p.price}</span>` : ''}
        </div>
        ${p.stock !== undefined ? `<p style="font-size:.85rem;color:${p.stock===0?'#EF4444':p.stock<=5?'#F59E0B':'var(--color-success)'};">● ${p.stock===0?'Out of Stock':p.stock<=5?`Only ${p.stock} left in stock`:`In Stock (${p.stock} available)`}</p>` : ''}
        <div style="margin:1.25rem 0;padding:1rem;background:var(--color-bg-alt);border-radius:var(--radius-md);">
          <p style="line-height:1.8;color:var(--color-text);">${pDesc(p)}</p>
        </div>
        ${p.benefits ? `<div style="margin-bottom:1rem;"><strong style="font-size:.88rem;color:var(--color-primary-dark);">✨ Benefits:</strong><p style="font-size:.88rem;color:var(--color-text-light);margin-top:.25rem;">${p.benefits}</p></div>` : ''}
        ${p.howToUse ? `<div style="margin-bottom:1rem;"><strong style="font-size:.88rem;color:var(--color-primary-dark);">📋 How to Use:</strong><p style="font-size:.88rem;color:var(--color-text-light);margin-top:.25rem;">${p.howToUse}</p></div>` : ''}
        <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1.5rem;">
          <button class="btn btn-primary" onclick="CartModule.add('${p.id}');closeProductDetail();" ${p.stock===0?'disabled':''} style="flex:1;justify-content:center;">
            ${p.stock===0 ? 'Out of Stock' : '🛒 Add to Cart'}
          </button>
          <a href="https://wa.me/${getWA()}?text=${encodeURIComponent(`Hi! I want to order: ${p.nameEN} (₹${p.price})`)}" target="_blank" class="btn btn-whatsapp" style="flex:1;justify-content:center;">💬 Order via WhatsApp</a>
        </div>
      </div>
    </div>
    ${related.length > 0 ? `
    <div style="margin-top:2.5rem;border-top:1px solid var(--color-border);padding-top:2rem;">
      <h3 style="font-family:var(--font-display);font-size:1.3rem;color:var(--color-primary-dark);margin-bottom:1rem;">You Might Also Like</h3>
      <div class="products-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));">
        ${related.map(r => productCard(r)).join('')}
      </div>
    </div>` : ''}`;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductDetail() {
  document.getElementById('product-detail-modal').classList.remove('open');
  document.body.style.overflow = '';
}

/* ---- Features ---- */
const FEATURES = [
  {icon:'🌿',titleEN:'100% Organic',   titleTM:'100% ஆர்கானிக்',           descEN:'Certified organic herbs. No synthetic ingredients.',descTM:'சான்றளிக்கப்பட்ட ஆர்கானிக் மூலிகைகள்.'},
  {icon:'👶',titleEN:'Child Safe',      titleTM:'குழந்தைகளுக்கு பாதுகாப்பு', descEN:'Gentle for babies, effective for adults.',descTM:'குழந்தைகளுக்கு மென்மையானது.'},
  {icon:'🚫',titleEN:'No Chemicals',    titleTM:'ரசாயனம் இல்லை',             descEN:'Zero parabens, sulfates or artificial fragrances.',descTM:'தீங்கு விளைவிக்கும் ரசாயனங்கள் இல்லை.'},
  {icon:'🏷️',titleEN:'Coupon Discounts',titleTM:'தள்ளுபடி கூப்பன்',          descEN:'Use coupon codes at checkout for special discounts.',descTM:'சிறப்பு தள்ளுபடிக்கு கூப்பன் குறியீடுகளை பயன்படுத்தவும்.'},
  {icon:'🚚',titleEN:'Fast Delivery',   titleTM:'வேகமான டெலிவரி',            descEN:'Pan India delivery. Free shipping above ₹500.',descTM:'இந்தியா முழுவதும் விரைவான டெலிவரி.'},
  {icon:'💬',titleEN:'Personal Support',titleTM:'தனிப்பட்ட ஆதரவு',           descEN:'Direct WhatsApp support from the founder.',descTM:'நிறுவனரிடமிருந்து நேரடி வாட்ஸ்ஆப் ஆதரவு.'},
];
function renderFeatures() {
  document.getElementById('features-title').textContent = t('featuresTitle');
  document.getElementById('features-sub').textContent   = t('featuresSub');
  document.getElementById('features-grid').innerHTML = FEATURES.map(f=>`
    <div class="feature-card">
      <div class="feature-icon">${f.icon}</div>
      <div class="feature-title">${currentLang==='TM'?f.titleTM:f.titleEN}</div>
      <div class="feature-desc">${currentLang==='TM'?f.descTM:f.descEN}</div>
    </div>`).join('');
}

function renderReviews() {
  document.getElementById('reviews-title').textContent = t('reviewsTitle');
  document.getElementById('reviews-sub').textContent   = t('reviewsSub');
  const reviews = liveReviews.length ? liveReviews : SHOP_DATA.reviews;
  document.getElementById('reviews-grid').innerHTML = reviews.map(r=>`
    <div class="review-card">
      <div class="review-stars">${'★'.repeat(r.stars||5)}</div>
      <div class="review-text">"${currentLang==='TM'?(r.textTM||r.textEN):r.textEN}"</div>
      <div class="review-author">${r.author||r.name||'Customer'}</div>
      <div class="review-location">📍 ${r.location||''}</div>
    </div>`).join('');
}

function renderAbout() {
  document.getElementById('about-title').textContent = t('aboutTitle');
  document.getElementById('about-sub').textContent   = t('aboutSub');
  document.getElementById('about-p1').textContent    = t('aboutP1');
  document.getElementById('about-p2').textContent    = t('aboutP2');
}

function renderContact() {
  document.getElementById('contact-title').textContent = t('contactTitle');
  document.getElementById('contact-sub').textContent   = t('contactSub');
  document.getElementById('wa-title').textContent      = t('whatsappTitle');
  document.getElementById('wa-sub').textContent        = t('whatsappSub');
  const wa = siteSettings.footer_whatsapp || getWA();
  document.querySelectorAll('.wa-link').forEach(el => el.href = `https://wa.me/${wa}`);
  document.querySelectorAll('.wa-number').forEach(el => el.textContent = `+${wa.slice(0,2)} ${wa.slice(2,7)} ${wa.slice(7)}`);
}

function renderFooter() {
  document.getElementById('footer-tagline').textContent = t('footerTagline');
  document.getElementById('footer-desc').textContent    = t('footerDesc');
  document.getElementById('footer-shop').textContent    = t('footerShop');
  document.getElementById('footer-help').textContent    = t('footerHelp');
  document.getElementById('footer-follow').textContent  = t('footerFollow');
  document.getElementById('footer-copy').textContent    = t('footerCopy');
  if (siteSettings.footer_email) {
    const el = document.getElementById('footer-email');
    if (el) el.textContent = siteSettings.footer_email;
  }
}

/* ============================================================
   CHECKOUT
   ============================================================ */
function openCheckout() {
  closeCart();
  renderCheckoutModal();
  document.getElementById('checkout-modal').classList.add('open');
}
function closeCheckout() { document.getElementById('checkout-modal').classList.remove('open'); }

function renderCheckoutModal() {
  const summary = CartModule.getSummary('UPI');
  document.getElementById('checkout-title').textContent      = t('checkoutTitle');
  document.getElementById('order-summary-title').textContent = t('orderSummary');
  document.getElementById('place-order-btn').textContent     = t('placeOrder');

  // Order summary lines
  document.getElementById('summary-lines').innerHTML =
    CartModule.getItems().map(c=>`<div class="order-line"><span>${pName(c)} × ${c.qty}</span><span>₹${c.price*c.qty}</span></div>`).join('') +
    (summary.discount > 0 ? `<div class="order-line" style="color:var(--color-success)"><span>🎟 Coupon (${CartModule.getCoupon()?.code})</span><span>-₹${summary.discount}</span></div>` : '') +
    `<div class="order-line" style="color:${summary.shipping===0?'var(--color-success)':'inherit'}"><span>${summary.shipping===0?'🎉 Free Shipping':'Shipping'}</span><span>₹${summary.shipping}</span></div>`;

  document.getElementById('summary-total-num').textContent = `₹${summary.total}`;

  // Payment options
  const payContainer = document.getElementById('checkout-payment-options');
  if (payContainer) PaymentModule.renderPaymentOptions(payContainer, siteSettings);
}

async function placeOrder() {
  const g = id => document.getElementById(id)?.value?.trim();
  const name=g('inp-name'), phone=g('inp-phone'), address=g('inp-address'),
        city=g('inp-city'), pincode=g('inp-pincode'), notes=g('inp-notes'),
        email=g('inp-email');
  const payment = PaymentModule.getSelected();

  if (!name||!phone||!address||!city||!pincode) {
    showToast('Please fill all required fields', true); return;
  }

  const summary   = CartModule.getSummary(payment);
  const totalFinal = PaymentModule.calculateTotal({ subtotal:summary.sub, discount:summary.discount, shippingCharge:summary.shipping, paymentMethod:payment, settings:siteSettings });

  const btn = document.getElementById('place-order-btn');
  btn.textContent = 'Placing...'; btn.disabled = true;

  let invoiceNumber = '';
  try { invoiceNumber = await fbGetNextInvoiceNumber(); } catch(e) { invoiceNumber = 'SH-' + Date.now().toString(36).toUpperCase(); }

  const orderData = {
    invoiceNumber, customerName:name, customerPhone:phone, customerEmail:email||'',
    deliveryAddress:address, city, pincode, notes, paymentMethod:payment,
    couponCode: CartModule.getCoupon()?.code || null,
    couponDiscount: summary.discount,
    items: CartModule.getItems().map(c=>({id:String(c.id),name:c.nameEN,nameTM:c.nameTM||'',emoji:c.emoji||'🌿',price:c.price,qty:c.qty,subtotal:c.price*c.qty})),
    subtotal:summary.sub, discount:summary.discount, shippingCharge:summary.shipping, total:totalFinal,
  };

  let orderId = null;
  try {
    orderId = await fbCreateOrder(orderData);
    if (CartModule.getCoupon()?.id) await fbIncrementCouponUse(CartModule.getCoupon().id);
    await NotificationsModule.notifyNewOrder({ ...orderData, id: orderId }, siteSettings);
    await NotificationsModule.sendOrderConfirmationEmail({ ...orderData, id: orderId }, siteSettings);
  } catch(e) { console.warn('Order save error:', e); }

  // WhatsApp message
  const msg = NotificationsModule.buildOrderMessage({ ...orderData, id: orderId || 'N/A' }, siteSettings);
  window.open(`https://wa.me/${getWA()}?text=${encodeURIComponent(msg)}`, '_blank');

  CartModule.clear();
  closeCheckout();
  btn.textContent = t('placeOrder'); btn.disabled = false;

  if (orderId) {
    showOrderConfirmation(orderId, invoiceNumber, totalFinal);
  } else {
    showToast('Order placed via WhatsApp! 🎉');
  }
}

function showOrderConfirmation(orderId, invoiceNumber, total) {
  const modal = document.getElementById('order-confirm-modal');
  if (!modal) return;
  document.getElementById('confirm-order-id').textContent    = invoiceNumber;
  document.getElementById('confirm-order-total').textContent = `₹${total}`;
  document.getElementById('confirm-track-btn').href = `track.html?id=${orderId}`;
  modal.classList.add('open');
}

/* ---- Cart open/close ---- */
function openCart()  { document.getElementById('cart-sidebar').classList.add('open'); document.getElementById('cart-overlay').classList.add('open'); CartModule.render(document.getElementById('cart-items'), siteSettings); }
function closeCart() { document.getElementById('cart-sidebar').classList.remove('open'); document.getElementById('cart-overlay').classList.remove('open'); }

/* ---- Coupon ---- */
async function applyCoupon() {
  const code = document.getElementById('coupon-input')?.value?.trim();
  const btn  = document.getElementById('apply-coupon-btn');
  btn.textContent = '...'; btn.disabled = true;
  const result = await CartModule.applyCoupon(code);
  showToast(result.message, !result.ok);
  btn.textContent = 'Apply'; btn.disabled = false;
}

/* ---- Review form ---- */
async function submitReview() {
  const name   = document.getElementById('review-name')?.value?.trim();
  const loc    = document.getElementById('review-location')?.value?.trim();
  const stars  = parseInt(document.querySelector('input[name="review-stars"]:checked')?.value || '5');
  const textEN = document.getElementById('review-text-en')?.value?.trim();
  const textTM = document.getElementById('review-text-tm')?.value?.trim();
  if (!name || !textEN) { showToast('Please fill your name and review', true); return; }
  const btn = document.getElementById('submit-review-btn');
  btn.textContent = 'Submitting...'; btn.disabled = true;
  try {
    await fbSubmitReview({ author:name, location:loc||'India', stars, textEN, textTM, approved:false });
    showToast('Thank you! Your review is pending approval 🙏');
    document.getElementById('review-form-fields').reset();
    closeReviewForm();
  } catch(e) { showToast('Failed to submit review', true); }
  finally { btn.textContent = 'Submit Review'; btn.disabled = false; }
}

function openReviewForm()  { document.getElementById('review-modal').classList.add('open'); }
function closeReviewForm() { document.getElementById('review-modal').classList.remove('open'); }

/* ---- Toast ---- */
function showToast(msg, isError=false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = isError ? '#EF4444' : 'var(--color-primary-dark)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ---- Scroll reveal ---- */
function setupScrollReveal() {
  const obs = new IntersectionObserver(entries => entries.forEach(e => {
    if(e.isIntersecting){e.target.style.opacity='1';e.target.style.transform='translateY(0)';}
  }), {threshold:0.08});
  document.querySelectorAll('.product-card,.feature-card,.review-card').forEach(el => {
    el.style.opacity='0';el.style.transform='translateY(16px)';
    el.style.transition='opacity 0.5s ease,transform 0.5s ease';obs.observe(el);
  });
}

/* ---- Events ---- */
function setupEvents() {
  document.getElementById('cart-btn').addEventListener('click', openCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('checkout-btn').addEventListener('click', openCheckout);
  document.getElementById('order-whatsapp-btn').addEventListener('click', () => {
    const msg = CartModule.getItems().length === 0
      ? 'Hello! I would like to know more about Saga Herbals products.'
      : `Hello! I want to order: ${CartModule.getItems().map(c=>`${pName(c)} × ${c.qty}`).join(', ')}. Total ₹${CartModule.getTotal('UPI')}`;
    window.open(`https://wa.me/${getWA()}?text=${encodeURIComponent(msg)}`, '_blank');
  });
  document.getElementById('checkout-modal').addEventListener('click', e => { if(e.target===document.getElementById('checkout-modal')) closeCheckout(); });
  document.getElementById('checkout-close').addEventListener('click', closeCheckout);
  document.getElementById('place-order-btn').addEventListener('click', placeOrder);
  document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => switchLang(btn.dataset.lang)));
  document.getElementById('hamburger').addEventListener('click', () => document.getElementById('nav-links-list').classList.toggle('mobile-open'));
  document.getElementById('product-detail-modal')?.addEventListener('click', e => { if(e.target===document.getElementById('product-detail-modal')) closeProductDetail(); });
  document.getElementById('order-confirm-modal')?.addEventListener('click', e => { if(e.target===document.getElementById('order-confirm-modal')) e.target.classList.remove('open'); });
}
