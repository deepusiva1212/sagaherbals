/* ============================================================
   SAGA HERBALS — FIREBASE SERVICE v3
   All Firestore + Auth + Storage operations.
   Each section is clearly separated — edit only what you need.
   ============================================================ */

let db   = null;
let auth = null;
let storage = null;
let firebaseReady = false;

function initFirebase() {
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db   = firebase.firestore();
    auth = firebase.auth();
    if (firebase.storage) storage = firebase.storage();
    firebaseReady = true;
    console.log('✅ Firebase ready');
    return true;
  } catch (e) {
    console.error('❌ Firebase init failed:', e);
    return false;
  }
}

/* ---- COLLECTIONS ---- */
const COL = {
  orders:      'orders',
  products:    'products',
  settings:    'settings',
  reviews:     'reviews',
  coupons:     'coupons',
  users:       'adminUsers',
  activityLog: 'activityLog',
  complaints:  'complaints',
};

/* ============================================================
   AUTH
   ============================================================ */
function fbGoogleSignIn()       { return auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }
function fbSignOut()            { return auth.signOut(); }
function fbOnAuthChange(cb)     { return auth.onAuthStateChanged(cb); }
function fbCurrentUser()        { return auth.currentUser; }

/* ============================================================
   ACTIVITY LOG  (who did what, when)
   ============================================================ */
async function fbLogActivity(action, details = {}) {
  const user = fbCurrentUser();
  if (!user) return;
  try {
    await db.collection(COL.activityLog).add({
      uid:         user.uid,
      email:       user.email,
      displayName: user.displayName || '',
      action,
      details,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch(e) { console.warn('Activity log failed:', e); }
}

function fbListenActivityLog(cb) {
  return db.collection(COL.activityLog)
    .orderBy('timestamp', 'desc').limit(100)
    .onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

/* ============================================================
   ADMIN USERS  (role management)
   ============================================================ */
async function fbGetAdminUsers() {
  const snap = await db.collection(COL.users).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fbSetAdminUser(email, role) {
  await db.collection(COL.users).doc(email).set({ email, role, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  await fbLogActivity('SET_ADMIN_ROLE', { targetEmail: email, role });
}

async function fbRemoveAdminUser(email) {
  await db.collection(COL.users).doc(email).delete();
  await fbLogActivity('REMOVE_ADMIN_USER', { targetEmail: email });
}

function fbListenAdminUsers(cb) {
  return db.collection(COL.users).onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

/* ---- Online presence ---- */
async function fbSetOnline(email, displayName) {
  await db.collection(COL.users).doc(email).set({
    online: true, lastSeen: firebase.firestore.FieldValue.serverTimestamp(), displayName,
  }, { merge: true });
}

async function fbSetOffline(email) {
  await db.collection(COL.users).doc(email).set({
    online: false, lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

/* ============================================================
   ORDERS
   ============================================================ */
async function fbCreateOrder(data) {
  const ref = await db.collection(COL.orders).add({
    ...data, status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

async function fbGetOrder(id) {
  const doc = await db.collection(COL.orders).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function fbUpdateOrderStatus(id, status, note = '') {
  await db.collection(COL.orders).doc(id).update({
    status, statusNote: note,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  await fbLogActivity('UPDATE_ORDER_STATUS', { orderId: id, status, note });
}

async function fbDeleteOrder(id) {
  await db.collection(COL.orders).doc(id).delete();
  await fbLogActivity('DELETE_ORDER', { orderId: id });
}

function fbListenOrders(cb) {
  return db.collection(COL.orders).orderBy('createdAt', 'desc')
    .onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

/* ============================================================
   PRODUCTS
   ============================================================ */
async function fbGetProducts() {
  const snap = await db.collection(COL.products).orderBy('sortOrder', 'asc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fbAddProduct(data) {
  const snap = await db.collection(COL.products).get();
  const ref  = await db.collection(COL.products).add({
    ...data, sortOrder: snap.size, active: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  await fbLogActivity('ADD_PRODUCT', { name: data.nameEN });
  return ref.id;
}

async function fbUpdateProduct(id, data) {
  await db.collection(COL.products).doc(id).update({ ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  await fbLogActivity('UPDATE_PRODUCT', { id, name: data.nameEN });
}

async function fbDeleteProduct(id) {
  await db.collection(COL.products).doc(id).delete();
  await fbLogActivity('DELETE_PRODUCT', { id });
}

async function fbToggleProduct(id, active) {
  await db.collection(COL.products).doc(id).update({ active });
  await fbLogActivity('TOGGLE_PRODUCT', { id, active });
}

function fbListenProducts(cb) {
  return db.collection(COL.products)
    .onSnapshot(snap => {
      const products = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      cb(products);
    });
}

async function fbSeedProducts() {
  const snap = await db.collection(COL.products).get();
  if (!snap.empty) return;
  const defaults = [
    { emoji:'🌿', nameEN:'Herbal Bathing Powder', nameTM:'மூலிகை குளியல் பொடி', descEN:'100% organic herbal bath powder. Safe for children and adults. Cleanses, nourishes and leaves skin glowing.', descTM:'100% ஆர்கானிக் மூலிகை குளியல் பொடி. குழந்தைகளுக்கும் பெரியவர்களுக்கும் பாதுகாப்பானது.', price:199, originalPrice:299, badge:'Best Seller', tags:['100% Organic','Child Safe','No Chemicals'], category:'bath', sortOrder:0, active:true, stock:50 },
    { emoji:'☀️', nameEN:'Sunlight-Infused Hair Growth Oil', nameTM:'சூரிய ஒளி முடி வளர்ச்சி எண்ணெய்', descEN:'Specially crafted hair oil that promotes hair growth and reduces hair fall dramatically.', descTM:'முடி வளர்ச்சியை அதிகரிக்கும் சிறப்பு எண்ணெய்.', price:349, originalPrice:499, badge:'New', tags:['Hair Growth','Herbal','Natural'], category:'hair', sortOrder:1, active:true, stock:30 },
    { emoji:'🌺', nameEN:'Herbal Baby Bath Powder', nameTM:'மூலிகை குழந்தை குளியல் பொடி', descEN:'Extra gentle herbal bath powder specially formulated for babies. Zero chemicals.', descTM:'குழந்தைகளுக்காக தயாரிக்கப்பட்ட மென்மையான பொடி.', price:249, originalPrice:349, badge:'Child Safe', tags:['Baby Safe','Gentle','Pure Herbs'], category:'bath', sortOrder:2, active:true, stock:40 },
    { emoji:'🍃', nameEN:'Anti Hair Fall Herbal Pack', nameTM:'முடி உதிர்வு தடுப்பு பேக்', descEN:'Controls hair fall caused by stress, nutrition deficiency and pollution. Ayurvedic formula.', descTM:'முடி உதிர்வை கட்டுப்படுத்த சக்திவாய்ந்த மூலிகை பேக்.', price:299, originalPrice:449, badge:'Popular', tags:['Anti Hair Fall','Ayurvedic','Herbal'], category:'hair', sortOrder:3, active:true, stock:25 },
    { emoji:'✨', nameEN:'Skin Brightening Herbal Powder', nameTM:'சருமம் பளபளக்க பொடி', descEN:'Brightens skin tone, removes tan and gives a healthy glow. Suitable for all skin types.', descTM:'சருமத்தை பொலிவாக்கும் மூலிகை பொடி.', price:229, originalPrice:329, badge:'Trending', tags:['Skin Brightening','All Skin Types','Natural'], category:'skin', sortOrder:4, active:true, stock:35 },
    { emoji:'🌱', nameEN:'Combo Pack (Bath + Hair Oil)', nameTM:'காம்போ பேக்', descEN:'Bestselling Herbal Bathing Powder and Hair Growth Oil together at special combo price.', descTM:'சிறந்த குளியல் பொடி மற்றும் எண்ணெய் காம்போ.', price:499, originalPrice:648, badge:'Save ₹149', tags:['Combo Offer','Best Value','Complete Care'], category:'combo', sortOrder:5, active:true, stock:20 },
  ];
  const batch = db.batch();
  defaults.forEach(p => batch.set(db.collection(COL.products).doc(), { ...p, createdAt: firebase.firestore.FieldValue.serverTimestamp() }));
  await batch.commit();
}

/* ============================================================
   SETTINGS
   ============================================================ */
const DEFAULT_SETTINGS = {
  freeShippingThreshold: 500, shippingCharge: 60, cod_charge: 30,
  cod_enabled: true, low_stock_threshold: 5,
  razorpay_key: '', razorpay_card_surcharge: 2,
  upi_id: '', upi_qr_url: '',
  bank_name: '', bank_account: '', bank_ifsc: '', bank_holder: '',
  whatsapp: '919952427492',
  instagram: 'https://www.instagram.com/saga_herbels_organic_protect',
  facebook: 'https://www.facebook.com/sagaherbals',
  site_name: 'Saga Herbals', tagline: 'Pure • Organic • Natural',
  announcement: '', announcement_active: false,
  payment_confirmation_hours: 1,
  invoice_prefix: 'SH', invoice_next: 1001,
  whatsapp_api_key: '', whatsapp_api_enabled: false,
  emailjs_service_id: '', emailjs_template_id: '', emailjs_public_key: '', emailjs_enabled: false,
  w3forms_key: '', w3forms_enabled: false,
  footer_whatsapp: '919952427492', footer_email: '',
  seo_title: '', seo_description: '', seo_keywords: '',
  // Flash sale
  flash_sale_active: false, flash_sale_title: '', flash_sale_discount: '',
  flash_sale_coupon: '', flash_sale_end: null,
  // Loyalty
  loyalty_enabled: false, loyalty_points_per_100: 5,
  loyalty_points_value: 0.5, loyalty_min_redeem: 100,
};

async function fbGetSettings() {
  const doc = await db.collection(COL.settings).doc('global').get();
  return doc.exists ? { ...DEFAULT_SETTINGS, ...doc.data() } : DEFAULT_SETTINGS;
}

async function fbSaveSettings(data) {
  await db.collection(COL.settings).doc('global').set(data, { merge: true });
  await fbLogActivity('UPDATE_SETTINGS', { keys: Object.keys(data) });
}

/* ============================================================
   COUPONS
   ============================================================ */
function fbListenCoupons(cb) {
  return db.collection(COL.coupons).onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

async function fbAddCoupon(data) {
  await db.collection(COL.coupons).add({ ...data, usedCount: 0, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  await fbLogActivity('ADD_COUPON', { code: data.code });
}

async function fbUpdateCoupon(id, data) { await db.collection(COL.coupons).doc(id).update(data); }
async function fbDeleteCoupon(id)       { await db.collection(COL.coupons).doc(id).delete(); await fbLogActivity('DELETE_COUPON', { id }); }

async function fbValidateCoupon(code, orderTotal) {
  const snap = await db.collection(COL.coupons).where('code','==',code.toUpperCase()).where('active','==',true).get();
  if (snap.empty) return { valid: false, message: 'Invalid coupon code' };
  const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() };
  if (coupon.minOrder && orderTotal < coupon.minOrder) return { valid: false, message: `Minimum order ₹${coupon.minOrder} required` };
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { valid: false, message: 'Coupon usage limit reached' };
  const expiry = coupon.expiry?.toDate ? coupon.expiry.toDate() : coupon.expiry ? new Date(coupon.expiry) : null;
  if (expiry && expiry < new Date()) return { valid: false, message: 'Coupon has expired' };
  return { valid: true, coupon };
}

async function fbIncrementCouponUse(id) {
  await db.collection(COL.coupons).doc(id).update({ usedCount: firebase.firestore.FieldValue.increment(1) });
}

/* ============================================================
   REVIEWS
   ============================================================ */
function fbListenReviews(cb) {
  return db.collection(COL.reviews).orderBy('createdAt','desc').onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

function fbListenApprovedReviews(cb) {
  return db.collection(COL.reviews).where('approved','==',true).orderBy('createdAt','desc')
    .onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

async function fbSubmitReview(data) {
  await db.collection(COL.reviews).add({ ...data, approved: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
}

async function fbApproveReview(id) { await db.collection(COL.reviews).doc(id).update({ approved: true }); await fbLogActivity('APPROVE_REVIEW', { id }); }
async function fbDeleteReview(id)  { await db.collection(COL.reviews).doc(id).delete(); await fbLogActivity('DELETE_REVIEW', { id }); }

/* ============================================================
   COMPLAINTS
   ============================================================ */
async function fbSubmitComplaint(data) {
  const ref = await db.collection(COL.complaints).add({ ...data, status: 'open', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  return ref.id;
}

function fbListenComplaints(cb) {
  return db.collection(COL.complaints).orderBy('createdAt','desc').onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

async function fbUpdateComplaintStatus(id, status, reply = '') {
  await db.collection(COL.complaints).doc(id).update({ status, adminReply: reply, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  await fbLogActivity('UPDATE_COMPLAINT', { id, status });
}

/* ============================================================
   INVOICE NUMBER GENERATOR
   ============================================================ */
async function fbGetNextInvoiceNumber() {
  const ref = db.collection(COL.settings).doc('global');
  let invoiceNum = '';
  await db.runTransaction(async tx => {
    const doc = await tx.get(ref);
    const prefix = doc.data()?.invoice_prefix || 'SH';
    const next   = doc.data()?.invoice_next   || 1001;
    invoiceNum   = `${prefix}-${next}`;
    tx.update(ref, { invoice_next: next + 1 });
  });
  return invoiceNum;
}

/* ============================================================
   LOYALTY POINTS — Firebase operations
   ============================================================ */
function fbListenLoyaltyLeaderboard(cb) {
  return db.collection('loyaltyPoints').orderBy('points','desc').limit(50)
    .onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

async function fbAdjustLoyaltyPoints(phone, delta, reason) {
  await db.collection('loyaltyPoints').doc(phone).set({
    points: firebase.firestore.FieldValue.increment(delta),
    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  await db.collection('loyaltyPoints').doc(phone)
    .collection('history').add({
      type: delta > 0 ? 'admin_add' : 'admin_remove', points: delta, reason,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  await fbLogActivity('ADJUST_LOYALTY_POINTS', { phone, delta, reason });
}

/* Recently viewed — localStorage helper */
const RecentlyViewed = {
  KEY: 'saga_recently_viewed',
  add(id) {
    let ids = this.get();
    ids = [String(id), ...ids.filter(x => x !== String(id))].slice(0, 8);
    try { localStorage.setItem(this.KEY, JSON.stringify(ids)); } catch(e) {}
  },
  get() { try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch(e) { return []; } },
};

/* Flash sale + loyalty in DEFAULT_SETTINGS (already added via merge:true in fbSaveSettings) */
