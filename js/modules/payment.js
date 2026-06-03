/* ============================================================
   SAGA HERBALS — PAYMENT MODULE
   Handles UPI, Razorpay, COD, Bank Transfer display logic.
   ============================================================ */

const PaymentModule = (() => {

  function renderPaymentOptions(container, settings) {
    const codEnabled = settings.cod_enabled !== false;
    const rpKey      = settings.razorpay_key || '';
    const upiId      = settings.upi_id || '';
    const bankName   = settings.bank_name || '';
    const cardSurch  = settings.razorpay_card_surcharge || 2;

    const options = [];
    options.push({ value:'UPI',  icon:'📱', label:'UPI / GPay / PhonePe', desc: upiId ? `Pay to UPI ID: <strong>${upiId}</strong>` : 'Pay via any UPI app' });
    if (rpKey) options.push({ value:'Razorpay', icon:'💳', label:'Card / Net Banking (Razorpay)', desc:`Debit/Credit card: <span style="color:#F59E0B;">+${cardSurch}% Razorpay gateway charge</span> — collected by Razorpay, not us` });
    if (codEnabled) options.push({ value:'COD', icon:'💵', label:'Cash on Delivery', desc: settings.cod_charge > 0 ? `Extra COD charge: ₹${settings.cod_charge}` : 'Pay when order arrives' });
    if (bankName) options.push({ value:'Bank', icon:'🏦', label:'Bank Transfer (NEFT/IMPS)', desc:`Transfer to ${bankName}` });

    container.innerHTML = options.map((opt, i) => `
      <label class="payment-option ${i===0?'selected':''}" data-value="${opt.value}">
        <input type="radio" name="payment" value="${opt.value}" ${i===0?'checked':''}/>
        <span class="payment-icon">${opt.icon}</span>
        <div class="payment-text">
          <span class="payment-label">${opt.label}</span>
          <span class="payment-desc">${opt.desc}</span>
        </div>
      </label>`).join('');

    container.querySelectorAll('.payment-option').forEach(opt => {
      opt.addEventListener('click', () => {
        container.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        opt.querySelector('input').checked = true;
        showPaymentDetails(opt.dataset.value, settings);
      });
    });
    if (options.length > 0) showPaymentDetails(options[0].value, settings);
  }

  function showPaymentDetails(method, settings) {
    const detailBox = document.getElementById('payment-detail-box');
    if (!detailBox) return;
    const wa = settings.whatsapp || '919952427492';
    const hrs = settings.payment_confirmation_hours || 1;

    if (method === 'UPI') {
      const upiId = settings.upi_id || '';
      const qrUrl = settings.upi_qr_url || '';
      detailBox.innerHTML = `
        <div class="payment-info-box">
          <div class="payment-info-title">📱 UPI Payment Instructions</div>
          ${qrUrl ? `<img src="${qrUrl}" alt="UPI QR Code" style="width:160px;height:160px;object-fit:contain;border-radius:10px;border:1px solid #E5E7EB;margin:.75rem auto;display:block;"/>` : ''}
          ${upiId ? `<div class="upi-id-box">UPI ID: <strong>${upiId}</strong> <button onclick="copyText('${upiId}')" class="copy-btn">📋 Copy</button></div>` : ''}
          <div class="payment-notice">
            ✅ After payment, send your <strong>payment screenshot</strong> to WhatsApp
            <strong>+${wa.slice(0,2)} ${wa.slice(2,7)} ${wa.slice(7)}</strong> with your Order Number.<br/><br/>
            ⏱ We confirm within <strong>${hrs} working hour</strong> (most within 1 hour!).
          </div>
        </div>`;
    } else if (method === 'Razorpay') {
      detailBox.innerHTML = `
        <div class="payment-info-box">
          <div class="payment-info-title">💳 Online Payment via Razorpay</div>
          <p style="font-size:.88rem;color:#6B7280;margin-bottom:.75rem;">Pay securely with debit card, credit card, or net banking.</p>
          <div class="payment-notice warning">
            ⚠️ Razorpay charges a <strong>${settings.razorpay_card_surcharge||2}% gateway fee</strong> for card payments.
            This is collected by Razorpay — <strong>we do not collect it.</strong>
          </div>
        </div>`;
    } else if (method === 'COD') {
      detailBox.innerHTML = `
        <div class="payment-info-box">
          <div class="payment-info-title">💵 Cash on Delivery</div>
          <p style="font-size:.88rem;color:#6B7280;">Pay in cash when your order is delivered.</p>
          ${settings.cod_charge > 0 ? `<div class="payment-notice">COD handling charge: <strong>₹${settings.cod_charge}</strong></div>` : ''}
        </div>`;
    } else if (method === 'Bank') {
      detailBox.innerHTML = `
        <div class="payment-info-box">
          <div class="payment-info-title">🏦 Bank Transfer Details</div>
          <div class="bank-detail-grid">
            <div class="bank-row"><span>Bank</span><strong>${settings.bank_name||'—'}</strong></div>
            <div class="bank-row"><span>Account Name</span><strong>${settings.bank_holder||'—'}</strong></div>
            <div class="bank-row"><span>Account No.</span><strong>${settings.bank_account||'—'} <button onclick="copyText('${settings.bank_account||''}')" class="copy-btn">📋</button></strong></div>
            <div class="bank-row"><span>IFSC</span><strong>${settings.bank_ifsc||'—'} <button onclick="copyText('${settings.bank_ifsc||''}')" class="copy-btn">📋</button></strong></div>
          </div>
          <div class="payment-notice">
            ✅ After transfer, send your <strong>payment screenshot</strong> to WhatsApp
            <strong>+${wa.slice(0,2)} ${wa.slice(2,7)} ${wa.slice(7)}</strong> with your Order Number.<br/><br/>
            ⏱ Confirmation within <strong>${hrs} working hour</strong>.
          </div>
        </div>`;
    } else { detailBox.innerHTML = ''; }
  }

  function calculateTotal({ subtotal, discount, shippingCharge, paymentMethod, settings }) {
    let extra = 0;
    if (paymentMethod === 'COD' && settings.cod_enabled !== false) extra = settings.cod_charge || 0;
    if (paymentMethod === 'Razorpay') extra = Math.round((subtotal - discount) * (settings.razorpay_card_surcharge || 2) / 100);
    return subtotal - discount + shippingCharge + extra;
  }

  function getSelected() { return document.querySelector('input[name="payment"]:checked')?.value || 'UPI'; }

  return { renderPaymentOptions, showPaymentDetails, calculateTotal, getSelected };
})();

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => { if(typeof showToast==='function') showToast('Copied! 📋'); }).catch(()=>{});
}
