/* ============================================================
   SAGA HERBALS — FIREBASE CONFIG
   Replace AUTHORIZED_ADMIN_EMAILS with real Gmail accounts.
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCHWe_tUEoEitHd2vXNEzV-0J4oANSkoGw",
  authDomain:        "saga-herbals.firebaseapp.com",
  projectId:         "saga-herbals",
  storageBucket:     "saga-herbals.firebasestorage.app",
  messagingSenderId: "482388350015",
  appId:             "1:482388350015:web:210f59f8f21441dcd0948a",
  measurementId:     "G-3S8THCBKC2"
};

/* ============================================================
   ROLE-BASED ACCESS
   ultra_super_admin  → full control including user management
   super_admin        → all except user roles
   admin              → orders, products, reviews, coupons
   viewer             → read-only dashboard
   ============================================================ */
const ADMIN_ROLES = {
  "deepusiva2017@gmail.com": "ultra_super_admin",   // ← YOU (owner)
  // "staffgmail@gmail.com":   "admin",
  // "viewergmail@gmail.com":  "viewer",
};

function isAuthorizedAdmin(email) {
  return !!ADMIN_ROLES[email];
}
function getAdminRole(email) {
  return ADMIN_ROLES[email] || null;
}
