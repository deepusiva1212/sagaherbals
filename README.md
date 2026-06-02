# 🌿 Saga Herbals — Complete Website + Admin Panel

## 📁 File Structure

```
saga-herbals/
├── index.html              ← Customer website (shop)
├── admin.html              ← Admin panel (Google login)
├── track.html              ← Order tracking page
├── firebase-config.js      ← 🔑 Firebase keys + authorized admin emails
├── css/
│   ├── theme.css           ← 🎨 Colors & fonts (only file to edit for theme)
│   ├── style.css           ← Website styles
│   └── admin.css           ← Admin panel styles
└── js/
    ├── data.js             ← Static fallback data & Tamil/English strings
    ├── firebase-service.js ← All Firebase DB + Auth operations
    └── app.js              ← Website logic
```

---

## 🔥 STEP 1: Enable Google Sign-In in Firebase

1. Go to https://console.firebase.google.com → your project
2. Click **Authentication** → **Sign-in method**
3. Enable **Google** as a provider
4. Add your domain to **Authorized domains** (add `localhost` for testing)

---

## 🔐 STEP 2: Set Authorized Admin Emails

Open `firebase-config.js` and add the Gmail accounts allowed to log into admin:

```js
const AUTHORIZED_ADMIN_EMAILS = [
  "yourauntygmail@gmail.com",
  "yourgmail@gmail.com"
];
```

---

## 🌐 STEP 3: Set Firestore Rules (Important!)

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{doc} { allow read: if true; allow write: if request.auth != null; }
    match /settings/{doc} { allow read: if true; allow write: if request.auth != null; }
    match /orders/{doc}   { allow read, write: if true; }
    match /reviews/{doc}  { allow read: if true; allow write: if true; }
    match /coupons/{doc}  { allow read: if true; allow write: if request.auth != null; }
  }
}
```

---

## 🚀 STEP 4: Deploy (Free on Netlify)

1. Go to https://netlify.com → Sign up free
2. Drag and drop the `saga-herbals` folder
3. Your site is live instantly!
4. Add your live domain to Firebase Authorized Domains

---

## ✨ Features

### Customer Website
- 🌐 English + Tamil language toggle
- 📣 Announcement bar (controlled from admin)
- 🛒 Cart with quantity controls
- 🎟 Coupon/discount code input
- 💬 Checkout → WhatsApp order with order ID
- 📦 Order tracking page (share link with customers)
- ⭐ Submit review form
- 🔗 Related products section
- 🚚 Free shipping threshold (live from admin settings)
- 📱 Fully mobile responsive

### Admin Panel
- 🔐 Google Gmail login (only authorized emails)
- 📊 Live dashboard (orders, revenue, pending count)
- 📦 Orders — view details, update status, WhatsApp customer, CSV export
- 🌿 Products — add/edit/delete, stock tracking, low stock warning
- ⭐ Reviews — approve/reject customer reviews
- 🎟 Coupons — create % or flat discounts, set expiry & limits
- 🚚 Shipping — free threshold, charges, COD fee
- 💳 Payment — UPI, Razorpay, bank details
- ⚙️ Settings — announcement bar, site info, social links

---

## ✏️ Fix Instagram Spelling Later
Search `saga_herbels` → replace with `saga_herbals` in `firebase-config.js` and `js/data.js`
