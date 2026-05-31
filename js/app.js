/* ============================================
   SAGA HERBALS - MAIN JAVASCRIPT
   ============================================ */

// ---- STATE ----
let currentLang = 'EN';
let cart = [];
let cartOpen = false;
let checkoutOpen = false;

// ---- DOM READY ----
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  setupEvents();
});

// ---- RENDER EVERYTHING ----
function renderAll() {
  renderNav();
  renderHero();
  renderTrust();
  renderProducts();
  renderFeatures();
  renderReviews();
  renderAbout();
  renderContact();
  renderFooter();
  renderCart();
}

// ---- LANGUAGE SWITCH ----
function switchLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  renderAll();
}

function t(key) {
  return SHOP_DATA.lang[currentLang][key] || SHOP_DATA.lang['EN'][key] || key;
}

function productName(p) { return currentLang === 'TM' ? p.nameTM : p.nameEN; }
function productDesc(p)  { return currentLang === 'TM' ? p.descTM : p.descEN; }
function reviewText(r)   { return currentLang === 'TM' ? r.textTM : r.textEN; }

// ---- NAV ----
function renderNav() {
  document.getElementById('nav-home').textContent    = t('navHome');
  document.getElementById('nav-products').textContent = t('navProducts');
  document.getElementById('nav-about').textContent   = t('navAbout');
  document.getElementById('nav-contact').textContent = t('navContact');
}

// ---- HERO ----
function renderHero() {
  document.getElementById('hero-badge').textContent  = t('heroBadge');
  document.getElementById('hero-sub').textContent    = t('heroSub');
  document.getElementById('hero-btn1').textContent   = t('heroBtn1');
  document.getElementById('hero-btn2').textContent   = t('heroBtn2');
  document.getElementById('stat1-num').textContent   = t('stat1Num');
  document.getElementById('stat1-lbl').textContent   = t('stat1Label');
  document.getElementById('stat2-num').textContent   = t('stat2Num');
  document.getElementById('stat2-lbl').textContent   = t('stat2Label');
  document.getElementById('stat3-num').textContent   = t('stat3Num');
  document.getElementById('stat3-lbl').textContent   = t('stat3Label');

  const title = document.getElementById('hero-title');
  const span  = document.getElementById('hero-title-span');
  const full  = t('heroTitle');
  const spanText = t('heroTitleSpan');
  const before = full.split(spanText)[0] || (currentLang === 'TM' ? 'இயற்கையின் கொடை,\n' : 'Pure Nature,\n');
  title.innerHTML = before.replace('\n','<br>') + `<span id="hero-title-span">${spanText}</span>`;
}

// ---- TRUST ----
function renderTrust() {
  document.getElementById('trust-free').textContent     = t('trustFree');
  document.getElementById('trust-organic').textContent  = t('trustOrganic');
  document.getElementById('trust-safe').textContent     = t('trustSafe');
  document.getElementById('trust-delivery').textContent = t('trustDelivery');
  document.getElementById('trust-auth').textContent     = t('trustAuth');
}

// ---- PRODUCTS ----
function renderProducts() {
  document.getElementById('products-title').textContent = t('productsTitle');
  document.getElementById('products-sub').textContent   = t('productsSub');

  const grid = document.getElementById('products-grid');
  grid.innerHTML = SHOP_DATA.products.map(p => `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img">
        <div style="font-size:5rem;">${p.emoji}</div>
        ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
      </div>
      <div class="product-info">
        <div class="product-tags">
          ${p.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="product-name">${productName(p)}</div>
        <div class="product-desc">${productDesc(p)}</div>
        <div class="product-footer">
          <div class="product-price">
            <span class="orig">₹${p.originalPrice}</span>₹${p.price}
          </div>
          <button class="add-cart-btn" onclick="addToCart(${p.id})" title="${t('addToCart')}">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ---- FEATURES ----
const features = [
  { icon: '🌿', titleEN: '100% Organic', titleTM: '100% ஆர்கானிக்', descEN: 'All our products are made with certified organic herbs. No synthetic ingredients, ever.', descTM: 'எல்லா பொருட்களும் சான்றளிக்கப்பட்ட ஆர்கானிக் மூலிகைகளால் தயாரிக்கப்படுகின்றன.' },
  { icon: '👶', titleEN: 'Child Safe', titleTM: 'குழந்தைகளுக்கு பாதுகாப்பு', descEN: 'Gentle enough for babies, effective for adults. Our formulas are dermatologist reviewed.', descTM: 'குழந்தைகளுக்கு போதுமான மென்மையானது, பெரியவர்களுக்கு பயனுள்ளது.' },
  { icon: '🚫', titleEN: 'No Chemicals', titleTM: 'ரசாயனம் இல்லை', descEN: 'Zero harmful parabens, sulfates or artificial fragrances. Just pure nature.', descTM: 'தீங்கு விளைவிக்கும் ரசாயனங்கள் இல்லை. தூய இயற்கை மட்டுமே.' },
  { icon: '🤝', titleEN: 'Trusted Quality', titleTM: 'நம்பகமான தரம்', descEN: 'Trusted by 200+ happy families across Tamil Nadu. Real results, real people.', descTM: 'தமிழ்நாடு முழுவதும் 200+ குடும்பங்களால் நம்பப்படுகிறது.' },
  { icon: '🚚', titleEN: 'Fast Delivery', titleTM: 'வேகமான டெலிவரி', descEN: 'Quick delivery across India. Free shipping on orders above ₹500.', descTM: 'இந்தியா முழுவதும் விரைவான டெலிவரி. ₹500க்கு மேல் இலவச ஷிப்பிங்.' },
  { icon: '💬', titleEN: 'Personal Support', titleTM: 'தனிப்பட்ட ஆதரவு', descEN: 'Direct WhatsApp support from the founder. Get personalized product advice anytime.', descTM: 'நிறுவனரிடமிருந்து நேரடி வாட்ஸ்ஆப் ஆதரவு. எந்த நேரத்திலும் ஆலோசனை பெறுங்கள்.' },
];

function renderFeatures() {
  document.getElementById('features-title').textContent = t('featuresTitle');
  document.getElementById('features-sub').textContent   = t('featuresSub');
  document.getElementById('features-grid').innerHTML = features.map(f => `
    <div class="feature-card">
      <div class="feature-icon">${f.icon}</div>
      <div class="feature-title">${currentLang === 'TM' ? f.titleTM : f.titleEN}</div>
      <div class="feature-desc">${currentLang === 'TM' ? f.descTM : f.descEN}</div>
    </div>
  `).join('');
}

// ---- REVIEWS ----
function renderReviews() {
  document.getElementById('reviews-title').textContent = t('reviewsTitle');
  document.getElementById('reviews-sub').textContent   = t('reviewsSub');
  document.getElementById('reviews-grid').innerHTML = SHOP_DATA.reviews.map(r => `
    <div class="review-card">
      <div class="review-stars">${'★'.repeat(r.stars)}</div>
      <div class="review-text">"${reviewText(r)}"</div>
      <div class="review-author">${r.author}</div>
      <div class="review-location">📍 ${r.location}</div>
    </div>
  `).join('');
}

// ---- ABOUT ----
function renderAbout() {
  document.getElementById('about-title').textContent = t('aboutTitle');
  document.getElementById('about-sub').textContent   = t('aboutSub');
  document.getElementById('about-p1').textContent    = t('aboutP1');
  document.getElementById('about-p2').textContent    = t('aboutP2');
}

// ---- CONTACT ----
function renderContact() {
  document.getElementById('contact-title').textContent  = t('contactTitle');
  document.getElementById('contact-sub').textContent    = t('contactSub');
  document.getElementById('wa-title').textContent       = t('whatsappTitle');
  document.getElementById('wa-sub').textContent         = t('whatsappSub');
}

// ---- FOOTER ----
function renderFooter() {
  document.getElementById('footer-tagline').textContent = t('footerTagline');
  document.getElementById('footer-desc').textContent    = t('footerDesc');
  document.getElementById('footer-shop').textContent    = t('footerShop');
  document.getElementById('footer-help').textContent    = t('footerHelp');
  document.getElementById('footer-follow').textContent  = t('footerFollow');
  document.getElementById('footer-copy').textContent    = t('footerCopy');
}

// ---- CART ----
function addToCart(id) {
  const product = SHOP_DATA.products.find(p => p.id === id);
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  updateCartCount();
  renderCart();
  showToast(currentLang === 'TM' ? 'கார்ட்டில் சேர்க்கப்பட்டது! 🌿' : 'Added to cart! 🌿');
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  updateCartCount();
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty < 1) removeFromCart(id);
  else {
    updateCartCount();
    renderCart();
  }
}

function cartTotal() { return cart.reduce((sum, c) => sum + c.price * c.qty, 0); }

function updateCartCount() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  const badge = document.getElementById('cart-count');
  badge.textContent = total;
  badge.classList.toggle('show', total > 0);
}

function renderCart() {
  const items = document.getElementById('cart-items');
  const footer = document.getElementById('cart-footer');
  const subtotalEl = document.getElementById('cart-subtotal-num');
  const lang = SHOP_DATA.lang[currentLang];

  document.getElementById('cart-title').textContent = t('cartTitle');
  document.getElementById('checkout-btn').textContent = t('checkout');
  document.getElementById('order-whatsapp-btn').textContent = t('orderWhatsapp');

  if (cart.length === 0) {
    items.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <strong>${t('cartEmpty')}</strong>
        <p>${t('cartEmptySub')}</p>
      </div>`;
    footer.style.display = 'none';
  } else {
    items.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-emoji">${item.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${productName(item)}</div>
          <div class="cart-item-price">₹${item.price} each</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
          </div>
        </div>
        <button class="remove-btn" onclick="removeFromCart(${item.id})">✕</button>
      </div>
    `).join('');
    subtotalEl.textContent = `₹${cartTotal()}`;
    footer.style.display = 'block';
  }
}

function openCart() {
  document.getElementById('cart-sidebar').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
}

function closeCart() {
  document.getElementById('cart-sidebar').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
}

// ---- CHECKOUT ----
function openCheckout() {
  closeCart();
  renderCheckoutModal();
  document.getElementById('checkout-modal').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('open');
}

function renderCheckoutModal() {
  document.getElementById('checkout-title').textContent   = t('checkoutTitle');
  document.getElementById('lbl-name').textContent         = t('fullName');
  document.getElementById('lbl-phone').textContent        = t('phone');
  document.getElementById('lbl-address').textContent      = t('address');
  document.getElementById('lbl-city').textContent         = t('city');
  document.getElementById('lbl-pincode').textContent      = t('pincode');
  document.getElementById('lbl-notes').textContent        = t('notes');
  document.getElementById('lbl-payment').textContent      = t('paymentMethod');
  document.getElementById('place-order-btn').textContent  = t('placeOrder');
  document.getElementById('order-summary-title').textContent = t('orderSummary');

  const summaryLines = document.getElementById('summary-lines');
  summaryLines.innerHTML = cart.map(c => `
    <div class="order-line">
      <span>${productName(c)} × ${c.qty}</span>
      <span>₹${c.price * c.qty}</span>
    </div>
  `).join('');
  document.getElementById('summary-total-num').textContent = `₹${cartTotal()}`;
}

function placeOrder() {
  const name    = document.getElementById('inp-name').value.trim();
  const phone   = document.getElementById('inp-phone').value.trim();
  const address = document.getElementById('inp-address').value.trim();
  const city    = document.getElementById('inp-city').value.trim();
  const pincode = document.getElementById('inp-pincode').value.trim();
  const notes   = document.getElementById('inp-notes').value.trim();
  const payment = document.querySelector('input[name="payment"]:checked')?.value || 'UPI';

  if (!name || !phone || !address || !city || !pincode) {
    showToast(currentLang === 'TM' ? 'தயவுசெய்து அனைத்து விவரங்களையும் நிரப்பவும்' : 'Please fill all required fields');
    return;
  }

  const orderLines = cart.map(c => `• ${productName(c)} × ${c.qty} = ₹${c.price * c.qty}`).join('\n');
  const msg = `🌿 *New Order - Saga Herbals*\n\n` +
    `*Name:* ${name}\n*Phone:* ${phone}\n*Address:* ${address}, ${city} - ${pincode}\n\n` +
    `*Order:*\n${orderLines}\n\n*Total: ₹${cartTotal()}*\n*Payment: ${payment}*` +
    (notes ? `\n*Notes:* ${notes}` : '');

  const url = `https://wa.me/${SHOP_DATA.whatsapp}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  cart = [];
  updateCartCount();
  renderCart();
  closeCheckout();
  showToast(currentLang === 'TM' ? 'ஆர்டர் வாட்ஸ்ஆப்பில் அனுப்பப்பட்டது! 🎉' : 'Order sent via WhatsApp! 🎉');
}

// ---- WHATSAPP DIRECT ----
function orderViaWhatsApp() {
  if (cart.length === 0) {
    const msg = currentLang === 'TM'
      ? 'வணக்கம்! சேகா ஹெர்பல்ஸ் பொருட்களைப் பற்றி கேட்க விரும்புகிறேன்.'
      : 'Hello! I would like to know more about Saga Herbals products.';
    window.open(`https://wa.me/${SHOP_DATA.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  } else {
    const lines = cart.map(c => `${productName(c)} × ${c.qty}`).join(', ');
    const msg = (currentLang === 'TM'
      ? `வணக்கம்! நான் ஆர்டர் செய்ய விரும்புகிறேன்: ${lines}. மொத்தம் ₹${cartTotal()}`
      : `Hello! I want to order: ${lines}. Total ₹${cartTotal()}`);
    window.open(`https://wa.me/${SHOP_DATA.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  }
}

// ---- TOAST ----
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ---- EVENTS ----
function setupEvents() {
  // cart toggle
  document.getElementById('cart-btn').addEventListener('click', openCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('checkout-btn').addEventListener('click', openCheckout);
  document.getElementById('order-whatsapp-btn').addEventListener('click', orderViaWhatsApp);

  // checkout modal
  document.getElementById('checkout-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('checkout-modal')) closeCheckout();
  });
  document.getElementById('checkout-close').addEventListener('click', closeCheckout);
  document.getElementById('place-order-btn').addEventListener('click', placeOrder);

  // lang
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => switchLang(btn.dataset.lang));
  });

  // hamburger
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links-list');
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('mobile-open');
  });

  // scroll animation
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.style.opacity = '1';
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.product-card, .feature-card, .review-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.5s ease';
    observer.observe(el);
  });
}
