/* ============================================
   SAGA HERBALS - MAIN APP v3
   Features: Coupons, Reviews, Order Tracking,
   Announcement Bar, Related Products
   ============================================ */

let currentLang  = 'EN';
let cart         = [];
let liveProducts = [];
let siteSettings = {};
let appliedCoupon = null;
let liveReviews  = [];

document.addEventListener('DOMContentLoaded', async () => {
  const ok = initFirebase();
  if (ok) {
    await loadAll();
  } else {
    liveProducts = SHOP_DATA.products;
    siteSettings = { freeShippingThreshold:500, shippingCharge:60, cod_charge:30, whatsapp:SHOP_DATA.whatsapp };
  }
  renderAll();
  setupEvents();
});

async function loadAll() {
  try {
    await fbSeedProducts();
    siteSettings = await fbGetSettings();
    fbListenProducts(p => { liveProducts = p.filter(x => x.active !== false); renderProducts(); renderRelated(); });
    fbListenApprovedReviews(r => { liveReviews = r; renderReviews(); });
  } catch(e) {
    console.warn("Firebase load error:", e);
    liveProducts = SHOP_DATA.products;
    siteSettings = { freeShippingThreshold:500, shippingCharge:60, cod_charge:30, whatsapp:SHOP_DATA.whatsapp };
  }
}

function getWhatsApp() { return siteSettings.whatsapp || SHOP_DATA.whatsapp || '919952427492'; }
function getShipping(sub) {
  const thr = siteSettings.freeShippingThreshold || 500;
  return sub >= thr ? 0 : (siteSettings.shippingCharge || 60);
}
function getCODCharge() { return siteSettings.cod_charge || 30; }

function renderAll() {
  renderAnnouncement();
  renderNav(); renderHero(); renderTrust(); renderProducts();
  renderFeatures(); renderReviews(); renderAbout(); renderContact(); renderFooter();
  renderCart();
}

function switchLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  renderAll();
}

function t(key) { return SHOP_DATA.lang[currentLang]?.[key] || SHOP_DATA.lang['EN']?.[key] || key; }
function productName(p) { return currentLang==='TM'?(p.nameTM||p.nameEN):p.nameEN; }
function productDesc(p)  { return currentLang==='TM'?(p.descTM||p.descEN):p.descEN; }
function reviewText(r)   { return currentLang==='TM'?(r.textTM||r.textEN):r.textEN; }

// ============================================================
// ANNOUNCEMENT BAR
// ============================================================
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

// ============================================================
// NAV / HERO / TRUST (same as before)
// ============================================================
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
  document.getElementById('hero-btn2').innerHTML    = '💬 '+t('heroBtn2');
  document.getElementById('stat1-num').textContent  = t('stat1Num');
  document.getElementById('stat1-lbl').textContent  = t('stat1Label');
  document.getElementById('stat2-num').textContent  = t('stat2Num');
  document.getElementById('stat2-lbl').textContent  = t('stat2Label');
  document.getElementById('stat3-num').textContent  = t('stat3Num');
  document.getElementById('stat3-lbl').textContent  = t('stat3Label');
  const spanText = t('heroTitleSpan');
  const before   = currentLang==='TM'?'இயற்கையின் கொடை,<br>':'Pure Nature,<br>';
  document.getElementById('hero-title').innerHTML   = before+`<span id="hero-title-span">${spanText}</span>`;
}
function renderTrust() {
  const threshold = siteSettings.freeShippingThreshold || 500;
  document.getElementById('trust-free').textContent     = currentLang==='TM'?`₹${threshold}+ இலவச டெலிவரி`:`Free Shipping ₹${threshold}+`;
  document.getElementById('trust-organic').textContent  = t('trustOrganic');
  document.getElementById('trust-safe').textContent     = t('trustSafe');
  document.getElementById('trust-delivery').textContent = t('trustDelivery');
  document.getElementById('trust-auth').textContent     = t('trustAuth');
}

// ============================================================
// PRODUCTS
// ============================================================
function renderProducts() {
  document.getElementById('products-title').textContent = t('productsTitle');
  document.getElementById('products-sub').textContent   = t('productsSub');
  const prods = liveProducts.length ? liveProducts : SHOP_DATA.products;
  document.getElementById('products-grid').innerHTML = prods.map(p => productCard(p)).join('');
}

function productCard(p) {
  const lowStock = (p.stock !== undefined && p.stock <= (siteSettings.low_stock_threshold || 5) && p.stock > 0);
  const outStock = p.stock === 0;
  return `<div class="product-card" data-id="${p.id}">
    <div class="product-img">
      <div style="font-size:5rem;">${p.emoji||'🌿'}</div>
      ${p.badge?`<div class="product-badge">${p.badge}</div>`:''}
      ${lowStock?`<div class="product-badge" style="top:auto;bottom:.75rem;background:#F59E0B;">Only ${p.stock} left!</div>`:''}
      ${outStock?`<div class="product-badge" style="top:auto;bottom:.75rem;background:#EF4444;">Out of Stock</div>`:''}
    </div>
    <div class="product-info">
      <div class="product-tags">${(p.tags||[]).map(tag=>`<span class="tag">${tag}</span>`).join('')}</div>
      <div class="product-name">${productName(p)}</div>
      <div class="product-desc">${productDesc(p)}</div>
      <div class="product-footer">
        <div class="product-price">${p.originalPrice?`<span class="orig">₹${p.originalPrice}</span>`:''} ₹${p.price}</div>
        <button class="add-cart-btn" onclick="addToCart('${p.id}')" ${outStock?'disabled style="opacity:.4;cursor:not-allowed;"':''}>+</button>
      </div>
    </div>
  </div>`;
}

function renderRelated() {
  const wrap = document.getElementById('related-section');
  if (!wrap) return;
  const prods = liveProducts.length ? liveProducts : SHOP_DATA.products;
  if (prods.length <= 1) { wrap.style.display='none'; return; }
  const shuffled = [...prods].sort(() => 0.5 - Math.random()).slice(0, 4);
  document.getElementById('related-grid').innerHTML = shuffled.map(p => productCard(p)).join('');
  wrap.style.display = 'block';
}

// ============================================================
// FEATURES / ABOUT / FOOTER
// ============================================================
const features = [
  {icon:'🌿',titleEN:'100% Organic',   titleTM:'100% ஆர்கானிக்',           descEN:'All products made with certified organic herbs.',descTM:'சான்றளிக்கப்பட்ட ஆர்கானிக் மூலிகைகளால் தயாரிக்கப்படுகின்றன.'},
  {icon:'👶',titleEN:'Child Safe',      titleTM:'குழந்தைகளுக்கு பாதுகாப்பு', descEN:'Gentle enough for babies, effective for adults.',descTM:'குழந்தைகளுக்கு மென்மையானது, பெரியவர்களுக்கு பயனுள்ளது.'},
  {icon:'🚫',titleEN:'No Chemicals',    titleTM:'ரசாயனம் இல்லை',             descEN:'Zero parabens, sulfates or artificial fragrances.',descTM:'தீங்கு விளைவிக்கும் ரசாயனங்கள் இல்லை.'},
  {icon:'🏷️',titleEN:'Coupon Discounts',titleTM:'தள்ளுபடி கூப்பன்',          descEN:'Use coupon codes at checkout for special discounts.',descTM:'சிறப்பு தள்ளுபடிக்கு கூப்பன் குறியீடுகளை பயன்படுத்தவும்.'},
  {icon:'🚚',titleEN:'Fast Delivery',   titleTM:'வேகமான டெலிவரி',            descEN:'Quick delivery across India. Free shipping on orders above ₹500.',descTM:'இந்தியா முழுவதும் விரைவான டெலிவரி.'},
  {icon:'💬',titleEN:'Personal Support',titleTM:'தனிப்பட்ட ஆதரவு',           descEN:'Direct WhatsApp support from the founder anytime.',descTM:'நிறுவனரிடமிருந்து நேரடி வாட்ஸ்ஆப் ஆதரவு.'},
];
function renderFeatures() {
  document.getElementById('features-title').textContent = t('featuresTitle');
  document.getElementById('features-sub').textContent   = t('featuresSub');
  document.getElementById('features-grid').innerHTML = features.map(f=>`
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
      <div class="review-text">"${reviewText(r)}"</div>
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
  const wa = getWhatsApp();
  document.querySelectorAll('.wa-link').forEach(el => el.href=`https://wa.me/${wa}`);
  document.querySelectorAll('.wa-number').forEach(el => el.textContent=`+${wa.slice(0,2)} ${wa.slice(2,7)} ${wa.slice(7)}`);
}

function renderFooter() {
  document.getElementById('footer-tagline').textContent = t('footerTagline');
  document.getElementById('footer-desc').textContent    = t('footerDesc');
  document.getElementById('footer-shop').textContent    = t('footerShop');
  document.getElementById('footer-help').textContent    = t('footerHelp');
  document.getElementById('footer-follow').textContent  = t('footerFollow');
  document.getElementById('footer-copy').textContent    = t('footerCopy');
}

// ============================================================
// CART
// ============================================================
function addToCart(productId) {
  const prods   = liveProducts.length ? liveProducts : SHOP_DATA.products;
  const product = prods.find(p => String(p.id)===String(productId));
  if (!product) return;
  const existing = cart.find(c => String(c.id)===String(productId));
  if (existing) existing.qty++;
  else cart.push({ ...product, qty: 1 });
  updateCartCount(); renderCart();
  showToast(currentLang==='TM'?'கார்ட்டில் சேர்க்கப்பட்டது! 🌿':'Added to cart! 🌿');
}

function removeFromCart(id) {
  cart = cart.filter(c => String(c.id)!==String(id));
  appliedCoupon = null;
  updateCartCount(); renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(c => String(c.id)===String(id));
  if (!item) return;
  item.qty += delta;
  if (item.qty < 1) removeFromCart(id);
  else { updateCartCount(); renderCart(); }
}

function cartSubtotal() { return cart.reduce((s,c) => s+c.price*c.qty, 0); }

function getCouponDiscount(sub) {
  if (!appliedCoupon) return 0;
  if (appliedCoupon.type === 'percent') return Math.round(sub * appliedCoupon.value / 100);
  return Math.min(appliedCoupon.value, sub);
}

function updateCartCount() {
  const total = cart.reduce((s,c) => s+c.qty, 0);
  const badge = document.getElementById('cart-count');
  badge.textContent = total;
  badge.classList.toggle('show', total > 0);
}

function renderCart() {
  document.getElementById('cart-title').textContent         = t('cartTitle');
  document.getElementById('checkout-btn').textContent       = t('checkout');
  document.getElementById('order-whatsapp-btn').textContent = t('orderWhatsapp');
  const items  = document.getElementById('cart-items');
  const footer = document.getElementById('cart-footer');

  if (cart.length === 0) {
    items.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛒</div><strong>${t('cartEmpty')}</strong><p>${t('cartEmptySub')}</p></div>`;
    footer.style.display = 'none'; return;
  }

  const sub      = cartSubtotal();
  const discount = getCouponDiscount(sub);
  const shipping = getShipping(sub - discount);
  const total    = sub - discount + shipping;

  items.innerHTML = cart.map(item=>`
    <div class="cart-item">
      <div class="cart-item-emoji">${item.emoji||'🌿'}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${productName(item)}</div>
        <div class="cart-item-price">₹${item.price} each</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty('${item.id}',-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}',1)">+</button>
        </div>
      </div>
      <button class="remove-btn" onclick="removeFromCart('${item.id}')">✕</button>
    </div>`).join('');

  // Coupon row
  const couponHtml = appliedCoupon
    ? `<div style="display:flex;justify-content:space-between;font-size:.82rem;color:var(--color-success);padding:.35rem 0;">
         <span>🎟 Coupon (${appliedCoupon.code})<button onclick="removeCoupon()" style="background:none;border:none;color:#EF4444;cursor:pointer;margin-left:.4rem;font-size:.8rem;">✕</button></span>
         <span>-₹${discount}</span></div>` : '';

  document.getElementById('cart-shipping-line').innerHTML = `
    <div style="padding:.75rem 0;border-top:1px solid var(--color-border);font-size:.85rem;">
      <div style="display:flex;justify-content:space-between;color:var(--color-text-light);margin-bottom:.3rem;"><span>Subtotal</span><span>₹${sub}</span></div>
      ${couponHtml}
      <div style="display:flex;justify-content:space-between;color:${shipping===0?'var(--color-success)':'var(--color-text-light)'};">
        <span>${shipping===0?'🎉 Free Shipping':'Shipping'}</span><span>₹${shipping}</span></div>
    </div>`;
  document.getElementById('cart-subtotal-num').textContent = `₹${total}`;
  footer.style.display = 'block';
}

function openCart()  { document.getElementById('cart-sidebar').classList.add('open'); document.getElementById('cart-overlay').classList.add('open'); }
function closeCart() { document.getElementById('cart-sidebar').classList.remove('open'); document.getElementById('cart-overlay').classList.remove('open'); }

// ============================================================
// COUPON (in cart / checkout)
// ============================================================
async function applyCoupon() {
  const code = document.getElementById('coupon-input')?.value?.trim();
  if (!code) return;
  const sub = cartSubtotal();
  const btn = document.getElementById('apply-coupon-btn');
  btn.textContent = '...'; btn.disabled = true;
  try {
    const result = await fbValidateCoupon(code, sub);
    if (result.valid) {
      appliedCoupon = result.coupon;
      renderCart();
      showToast(`Coupon "${code.toUpperCase()}" applied! 🎉`);
      document.getElementById('coupon-input').value = '';
    } else {
      showToast(result.message, true);
    }
  } catch(e) { showToast('Could not validate coupon', true); }
  finally { btn.textContent = 'Apply'; btn.disabled = false; }
}

function removeCoupon() { appliedCoupon = null; renderCart(); showToast('Coupon removed'); }

// ============================================================
// CHECKOUT
// ============================================================
function openCheckout() { closeCart(); renderCheckoutModal(); document.getElementById('checkout-modal').classList.add('open'); }
function closeCheckout() { document.getElementById('checkout-modal').classList.remove('open'); }

function renderCheckoutModal() {
  const sub      = cartSubtotal();
  const discount = getCouponDiscount(sub);
  const shipping = getShipping(sub - discount);
  const total    = sub - discount + shipping;

  document.getElementById('checkout-title').textContent      = t('checkoutTitle');
  document.getElementById('order-summary-title').textContent = t('orderSummary');
  document.getElementById('place-order-btn').textContent     = t('placeOrder');

  document.getElementById('summary-lines').innerHTML = cart.map(c=>`
    <div class="order-line"><span>${productName(c)} × ${c.qty}</span><span>₹${c.price*c.qty}</span></div>`).join('') +
    (discount>0?`<div class="order-line" style="color:var(--color-success);"><span>🎟 Coupon (${appliedCoupon.code})</span><span>-₹${discount}</span></div>`:'') +
    `<div class="order-line" style="color:${shipping===0?'var(--color-success)':'inherit'}"><span>${shipping===0?'🎉 Free Shipping':'Shipping'}</span><span>₹${shipping}</span></div>`;
  document.getElementById('summary-total-num').textContent = `₹${total}`;
}

async function placeOrder() {
  const g = id => document.getElementById(id)?.value?.trim();
  const name=g('inp-name'), phone=g('inp-phone'), address=g('inp-address'), city=g('inp-city'), pincode=g('inp-pincode'), notes=g('inp-notes');
  const payment = document.querySelector('input[name="payment"]:checked')?.value || 'UPI';
  if (!name||!phone||!address||!city||!pincode) { showToast(currentLang==='TM'?'அனைத்து விவரங்களையும் நிரப்பவும்':'Please fill all required fields'); return; }

  const sub=cartSubtotal(), discount=getCouponDiscount(sub), shipping=getShipping(sub-discount);
  const total=sub-discount+shipping+(payment==='COD'?getCODCharge():0);

  const orderData = {
    customerName:name, customerPhone:phone, deliveryAddress:address, city, pincode, notes, paymentMethod:payment,
    couponCode: appliedCoupon?.code||null, couponDiscount: discount,
    items: cart.map(c=>({id:String(c.id),name:c.nameEN,nameTM:c.nameTM||'',emoji:c.emoji||'🌿',price:c.price,qty:c.qty,subtotal:c.price*c.qty})),
    subtotal:sub, discount, shippingCharge:shipping, total, status:'pending',
  };

  let orderId = null;
  try {
    orderId = await fbCreateOrder(orderData);
    if (appliedCoupon?.id) await fbIncrementCouponUse(appliedCoupon.id);
  } catch(e) { console.warn("Firebase order save failed:", e); }

  const orderLines = cart.map(c=>`• ${productName(c)} × ${c.qty} = ₹${c.price*c.qty}`).join('\n');
  const msg = `🌿 *New Order - Saga Herbals*\n`+(orderId?`🔖 Order ID: ${orderId}\n\n`:'\n')+
    `*Name:* ${name}\n*Phone:* ${phone}\n*Address:* ${address}, ${city} - ${pincode}\n\n*Items:*\n${orderLines}\n\n`+
    `*Subtotal:* ₹${sub}${discount>0?`\n*Discount:* -₹${discount}`:''}\n*Shipping:* ₹${shipping}\n*Total: ₹${total}*\n*Payment: ${payment}*`+
    (notes?`\n*Notes:* ${notes}`:'')+
    (orderId?`\n\n📦 Track your order at: ${window.location.origin}/track.html?id=${orderId}`:'');

  window.open(`https://wa.me/${getWhatsApp()}?text=${encodeURIComponent(msg)}`,'_blank');
  cart=[]; appliedCoupon=null; updateCartCount(); renderCart(); closeCheckout();
  showToast(currentLang==='TM'?'ஆர்டர் வாட்ஸ்ஆப்பில் அனுப்பப்பட்டது! 🎉':'Order placed via WhatsApp! 🎉');
}

function orderViaWhatsApp() {
  const msg = cart.length===0?'Hello! I would like to know more about Saga Herbals products.'
    :`Hello! I want to order: ${cart.map(c=>`${productName(c)} × ${c.qty}`).join(', ')}. Total ₹${cartSubtotal()+getShipping(cartSubtotal())}`;
  window.open(`https://wa.me/${getWhatsApp()}?text=${encodeURIComponent(msg)}`,'_blank');
}

// ============================================================
// REVIEW FORM (customer submit)
// ============================================================
async function submitReview() {
  const name    = document.getElementById('review-name')?.value?.trim();
  const location= document.getElementById('review-location')?.value?.trim();
  const stars   = parseInt(document.querySelector('input[name="review-stars"]:checked')?.value||'5');
  const textEN  = document.getElementById('review-text-en')?.value?.trim();
  const textTM  = document.getElementById('review-text-tm')?.value?.trim();
  if (!name||!textEN) { showToast('Please fill your name and review'); return; }
  const btn = document.getElementById('submit-review-btn');
  btn.textContent='Submitting...'; btn.disabled=true;
  try {
    await fbSubmitReview({ author:name, location:location||'India', stars, textEN, textTM, approved:false });
    showToast('Thank you! Your review is pending approval 🙏');
    document.getElementById('review-form-fields').reset();
    closeReviewForm();
  } catch(e) { showToast('Failed to submit review', true); }
  finally { btn.textContent='Submit Review'; btn.disabled=false; }
}

function openReviewForm()  { document.getElementById('review-modal').classList.add('open'); }
function closeReviewForm() { document.getElementById('review-modal').classList.remove('open'); }

// ============================================================
// TOAST
// ============================================================
function showToast(msg, isError=false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = isError?'#EF4444':'var(--color-primary-dark)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ============================================================
// EVENTS
// ============================================================
function setupEvents() {
  document.getElementById('cart-btn').addEventListener('click', openCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('checkout-btn').addEventListener('click', openCheckout);
  document.getElementById('order-whatsapp-btn').addEventListener('click', orderViaWhatsApp);
  document.getElementById('checkout-modal').addEventListener('click', e => { if(e.target===document.getElementById('checkout-modal')) closeCheckout(); });
  document.getElementById('checkout-close').addEventListener('click', closeCheckout);
  document.getElementById('place-order-btn').addEventListener('click', placeOrder);
  document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => switchLang(btn.dataset.lang)));
  document.getElementById('hamburger').addEventListener('click', () => document.getElementById('nav-links-list').classList.toggle('mobile-open'));
  document.querySelectorAll('.payment-option').forEach(opt => opt.addEventListener('click', () => {
    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected')); opt.classList.add('selected');
  }));
  const obs = new IntersectionObserver(entries => entries.forEach(e => {
    if(e.isIntersecting){e.target.style.opacity='1';e.target.style.transform='translateY(0)';}
  }), {threshold:0.1});
  document.querySelectorAll('.product-card,.feature-card,.review-card').forEach(el => {
    el.style.opacity='0';el.style.transform='translateY(16px)';el.style.transition='opacity 0.5s ease,transform 0.5s ease';obs.observe(el);
  });
}
