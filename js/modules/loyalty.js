/* ============================================================
   SAGA HERBALS — LOYALTY POINTS MODULE
   Earn points per order. Redeem as discount at checkout.
   Stored in Firebase loyaltyPoints collection.
   ============================================================ */

const LoyaltyModule = (() => {
  let _settings       = {};
  let _redeemingPoints = 0;

  function init(settings) { _settings = settings; }
  function setSettings(s) { _settings = s; }

  function isEnabled()     { return _settings.loyalty_enabled === true; }
  function pointsPerHundred() { return _settings.loyalty_points_per_100 || 5; }
  function pointValue()    { return _settings.loyalty_points_value || 0.5; }
  function minRedeem()     { return _settings.loyalty_min_redeem  || 100; }

  function earnedFor(total)   { return Math.floor(total / 100) * pointsPerHundred(); }
  function valueOf(points)    { return Math.floor(points * pointValue()); }

  /* ---- Firebase: get customer points ---- */
  async function getPoints(phone) {
    if (!phone || !db) return 0;
    try {
      const doc = await db.collection('loyaltyPoints').doc(phone).get();
      return doc.exists ? (doc.data().points || 0) : 0;
    } catch(e) { return 0; }
  }

  /* ---- Firebase: add points after order ---- */
  async function addPoints(phone, name, orderTotal, orderId) {
    if (!isEnabled() || !phone || !db) return;
    const earned = earnedFor(orderTotal);
    if (earned <= 0) return;
    try {
      await db.collection('loyaltyPoints').doc(phone).set({
        phone, name: name || '',
        points:       firebase.firestore.FieldValue.increment(earned),
        totalEarned:  firebase.firestore.FieldValue.increment(earned),
        lastUpdated:  firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      await db.collection('loyaltyPoints').doc(phone).collection('history').add({
        type: 'earned', points: earned, orderId, orderTotal,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch(e) { console.warn('Loyalty add failed:', e); }
  }

  /* ---- Firebase: redeem points ---- */
  async function redeemPoints(phone, points) {
    if (!db) return false;
    try {
      const doc     = await db.collection('loyaltyPoints').doc(phone).get();
      const current = doc.exists ? (doc.data().points || 0) : 0;
      if (current < points) return false;
      await db.collection('loyaltyPoints').doc(phone).update({
        points:        firebase.firestore.FieldValue.increment(-points),
        totalRedeemed: firebase.firestore.FieldValue.increment(points),
        lastUpdated:   firebase.firestore.FieldValue.serverTimestamp(),
      });
      return true;
    } catch(e) { return false; }
  }

  /* ---- Show points row in checkout ---- */
  async function checkAndShowPoints(phone) {
    if (!isEnabled() || !phone) return;
    const points    = await getPoints(phone);
    const min       = minRedeem();
    const container = document.getElementById('loyalty-points-row');
    if (!container) return;

    if (points >= min) {
      const rupees = valueOf(points);
      container.style.display = 'block';
      container.innerHTML = `
        <div class="loyalty-box">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap;">
            <div>
              <strong style="font-size:.9rem;color:var(--color-primary-dark);">🌟 ${points} Loyalty Points</strong>
              <div style="font-size:.78rem;color:var(--color-text-light);">Worth ₹${rupees} discount</div>
            </div>
            <label style="display:flex;align-items:center;gap:.4rem;cursor:pointer;">
              <input type="checkbox" id="redeem-points-check"
                onchange="LoyaltyModule.toggleRedeem(${points})"
                style="accent-color:var(--color-primary);"/>
              <span style="font-size:.85rem;font-weight:600;color:var(--color-primary);">Redeem</span>
            </label>
          </div>
        </div>`;
    } else if (points > 0) {
      container.style.display = 'block';
      container.innerHTML = `<div class="loyalty-box" style="opacity:.7;">
        <span style="font-size:.82rem;color:var(--color-text-light);">
          🌟 ${points} points (need ${min} to redeem — earn more by shopping!)
        </span></div>`;
    } else {
      container.style.display = 'none';
    }
  }

  function toggleRedeem(points) {
    const checked    = document.getElementById('redeem-points-check')?.checked;
    _redeemingPoints = checked ? points : 0;
    if (typeof renderCheckoutModal === 'function') renderCheckoutModal();
  }

  function getRedeemingPoints()  { return _redeemingPoints; }
  function getRedeemDiscount()   { return valueOf(_redeemingPoints); }
  function resetRedeem()          { _redeemingPoints = 0; }

  return {
    init, setSettings, isEnabled, earnedFor, valueOf, minRedeem,
    getPoints, addPoints, redeemPoints,
    checkAndShowPoints, toggleRedeem,
    getRedeemingPoints, getRedeemDiscount, resetRedeem,
  };
})();
