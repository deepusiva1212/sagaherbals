/* ============================================
   SAGA HERBALS - FIREBASE SERVICE LAYER
   ============================================ */

let db = null;
let auth = null;
let provider = null;
let firebaseReady = false;

function initFirebase() {
  try {
    const app = firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    auth = firebase.auth();
    provider = new firebase.auth.GoogleAuthProvider();
    firebaseReady = true;
    console.log("✅ Firebase connected");
    return true;
  } catch (err) {
    console.error("❌ Firebase init failed:", err);
    firebaseReady = false;
    return false;
  }
}

// ---- AUTHENTICATION ----
async function fbLoginWithGoogle() {
  try {
    const result = await auth.signInWithPopup(provider);
    return result.user;
  } catch (error) {
    console.error("Google Login Error:", error);
    throw error;
  }
}

async function fbLogout() {
  await auth.signOut();
}

function fbOnAuthStateChanged(callback) {
  if (auth) auth.onAuthStateChanged(callback);
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
  const snap = await db.collection(COL.orders).orderBy('createdAt', 'desc').get();
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
    status, statusNote: note, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

async function fbDeleteOrder(id) {
  await db.collection(COL.orders).doc(id).delete();
}

function fbListenOrders(callback) {
  return db.collection(COL.orders).orderBy('createdAt', 'desc').onSnapshot(snap => {
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(orders);
    });
}

// ============================================================
// PRODUCTS
// ============================================================
async function fbGetProducts() {
  const snap = await db.collection(COL.products).orderBy('sortOrder', 'asc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fbAddProduct(data) {
  const snap = await db.collection(COL.products).get();
  const ref = await db.collection(COL.products).add({
    ...data, sortOrder: snap.size, active: true, createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

async function fbUpdateProduct(id, data) {
  await db.collection(COL.products).doc(id).update({
    ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

async function fbDeleteProduct(id) {
  await db.collection(COL.products).doc(id).delete();
}

async function fbToggleProduct(id, active) {
  await db.collection(COL.products).doc(id).update({ active });
}

function fbListenProducts(callback) {
  return db.collection(COL.products).orderBy('sortOrder', 'asc').onSnapshot(snap => {
      const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(products);
    });
}

// ============================================================
// SETTINGS
// ============================================================
async function fbGetSettings() {
  const doc = await db.collection(COL.settings).doc('global').get();
  if (doc.exists) return doc.data();
  return {
    freeShippingThreshold: 500, shippingCharge: 60, cod_charge: 30, razorpay_key: '',
    upi_id: '', bank_name: '', bank_account: '', bank_ifsc: '', site_name: 'Saga Herbals',
    tagline: 'Pure • Organic • Natural', whatsapp: '919042063582',
    instagram: 'https://www.instagram.com/saga_herbels_organic_protect', facebook: 'https://www.facebook.com/sagaherbals',
  };
}

async function fbSaveSettings(data) {
  await db.collection(COL.settings).doc('global').set(data, { merge: true });
}

async function fbSeedProducts() {
  const snap = await db.collection(COL.products).get();
  if (!snap.empty) return; 
  // (Seed data logic remains the same behind the scenes)
}
