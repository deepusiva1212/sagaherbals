/* ============================================
   SAGA HERBALS - FIREBASE SERVICE LAYER
   All Firestore read/write operations live here
   ============================================ */

// Firebase SDK imports (loaded via CDN in HTML)
let db = null;
let firebaseReady = false;

function initFirebase() {
  try {
    const app = firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    firebaseReady = true;
    console.log("✅ Firebase connected");
    return true;
  } catch (err) {
    console.error("❌ Firebase init failed:", err);
    firebaseReady = false;
    return false;
  }
}

// ---- COLLECTIONS ----
const COL = {
  orders:   'orders',
  products: 'products',
  settings: 'settings',
};

// ============================================================
// ORDERS
// ============================================================

async function fbGetOrders() {
  const snap = await db.collection(COL.orders)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fbGetOrder(id) {
  const doc = await db.collection(COL.orders).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function fbCreateOrder(orderData) {
  const ref = await db.collection(COL.orders).add({
    ...orderData,
    status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

async function fbUpdateOrderStatus(id, status, note = '') {
  await db.collection(COL.orders).doc(id).update({
    status,
    statusNote: note,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

async function fbDeleteOrder(id) {
  await db.collection(COL.orders).doc(id).delete();
}

// Listen to orders in real-time
function fbListenOrders(callback) {
  return db.collection(COL.orders)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(orders);
    });
}

// ============================================================
// PRODUCTS
// ============================================================

async function fbGetProducts() {
  const snap = await db.collection(COL.products)
    .orderBy('sortOrder', 'asc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fbAddProduct(data) {
  const snap = await db.collection(COL.products).get();
  const ref = await db.collection(COL.products).add({
    ...data,
    sortOrder: snap.size,
    active: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

async function fbUpdateProduct(id, data) {
  await db.collection(COL.products).doc(id).update({
    ...data,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

async function fbDeleteProduct(id) {
  await db.collection(COL.products).doc(id).delete();
}

async function fbToggleProduct(id, active) {
  await db.collection(COL.products).doc(id).update({ active });
}

// Listen to products in real-time
function fbListenProducts(callback) {
  return db.collection(COL.products)
    .orderBy('sortOrder', 'asc')
    .onSnapshot(snap => {
      const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(products);
    });
}

// ============================================================
// SETTINGS (shipping, site config)
// ============================================================

async function fbGetSettings() {
  const doc = await db.collection(COL.settings).doc('global').get();
  if (doc.exists) return doc.data();
  // Return defaults if not set yet
  return {
    freeShippingThreshold: 500,
    shippingCharge: 60,
    cod_charge: 30,
    razorpay_key: '',
    upi_id: '',
    bank_name: '',
    bank_account: '',
    bank_ifsc: '',
    site_name: 'Saga Herbals',
    tagline: 'Pure • Organic • Natural',
    whatsapp: '919952427492',
    instagram: 'https://www.instagram.com/saga_herbels_organic_protect',
    facebook: 'https://www.facebook.com/sagaherbals',
  };
}

async function fbSaveSettings(data) {
  await db.collection(COL.settings).doc('global').set(data, { merge: true });
}

// ============================================================
// SEED default products to Firebase (run once)
// ============================================================
async function fbSeedProducts() {
  const snap = await db.collection(COL.products).get();
  if (!snap.empty) return; // Already seeded

  const defaults = [
    { emoji:"🌿", nameEN:"Herbal Bathing Powder", nameTM:"மூலிகை குளியல் பொடி", descEN:"100% organic herbal bath powder. Safe for children and adults.", descTM:"100% ஆர்கானிக் மூலிகை குளியல் பொடி.", price:199, originalPrice:299, badge:"Best Seller", tags:["100% Organic","Child Safe","No Chemicals"], category:"bath", sortOrder:0, active:true },
    { emoji:"☀️", nameEN:"Sunlight-Infused Hair Growth Oil", nameTM:"சூரிய ஒளி முடி வளர்ச்சி எண்ணெய்", descEN:"Promotes hair growth and reduces hair fall.", descTM:"முடி வளர்ச்சியை அதிகரிக்கும் சிறப்பு எண்ணெய்.", price:349, originalPrice:499, badge:"New", tags:["Hair Growth","Herbal","Natural"], category:"hair", sortOrder:1, active:true },
    { emoji:"🌺", nameEN:"Herbal Baby Bath Powder", nameTM:"மூலிகை குழந்தை குளியல் பொடி", descEN:"Extra gentle herbal bath powder for babies.", descTM:"குழந்தைகளுக்காக தயாரிக்கப்பட்ட மென்மையான பொடி.", price:249, originalPrice:349, badge:"Child Safe", tags:["Baby Safe","Gentle","Pure Herbs"], category:"bath", sortOrder:2, active:true },
    { emoji:"🍃", nameEN:"Anti Hair Fall Herbal Pack", nameTM:"முடி உதிர்வு தடுப்பு பேக்", descEN:"Controls hair fall caused by stress and pollution.", descTM:"முடி உதிர்வை கட்டுப்படுத்த சக்திவாய்ந்த மூலிகை பேக்.", price:299, originalPrice:449, badge:"Popular", tags:["Anti Hair Fall","Ayurvedic","Herbal"], category:"hair", sortOrder:3, active:true },
    { emoji:"✨", nameEN:"Skin Brightening Herbal Powder", nameTM:"சருமம் பளபளக்க பொடி", descEN:"Brightens skin tone and removes tan naturally.", descTM:"சருமத்தை பொலிவாக்கும் மூலிகை பொடி.", price:229, originalPrice:329, badge:"Trending", tags:["Skin Brightening","All Skin Types","Natural"], category:"skin", sortOrder:4, active:true },
    { emoji:"🌱", nameEN:"Combo Pack (Bath + Hair Oil)", nameTM:"காம்போ பேக்", descEN:"Bestselling bath powder and hair oil together.", descTM:"சிறந்த குளியல் பொடி மற்றும் எண்ணெய் காம்போ.", price:499, originalPrice:648, badge:"Save ₹149", tags:["Combo Offer","Best Value","Complete Care"], category:"combo", sortOrder:5, active:true },
  ];

  const batch = db.batch();
  defaults.forEach(p => {
    const ref = db.collection(COL.products).doc();
    batch.set(ref, { ...p, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  });
  await batch.commit();
  console.log("✅ Products seeded to Firebase");
}
