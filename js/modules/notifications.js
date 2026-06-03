/* ============================================================
   SAGA HERBALS — NOTIFICATIONS MODULE
   WhatsApp API, EmailJS, W3Forms integrations.
   All keys stored in Firebase — never hardcoded here.
   Enable/disable each from admin panel → Settings → Integrations
   ============================================================ */

const NotificationsModule = (() => {

  /* ============================================================
     WHATSAPP API
     When you purchase a WhatsApp Business API, paste the key
     in Admin → Settings → Integrations → WhatsApp API Key.
     It gets saved to Firebase and loaded here automatically.
     ============================================================ */
  async function sendWhatsAppAPI(to, message, settings) {
    if (!settings.whatsapp_api_enabled || !settings.whatsapp_api_key) {
      console.log('WhatsApp API not enabled. Falling back to wa.me link.');
      return false;
    }
    try {
      // Placeholder — replace with your provider's API call
      // Common providers: Twilio, WATI, AiSensy, Interakt
      const response = await fetch('https://api.yourwhatsappprovider.com/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.whatsapp_api_key}`,
        },
        body: JSON.stringify({ to, message }),
      });
      return response.ok;
    } catch (e) {
      console.warn('WhatsApp API send failed:', e);
      return false;
    }
  }

  /* ---- Order placed notification ---- */
  async function notifyNewOrder(order, settings) {
    const msg = buildOrderMessage(order, settings);
    // Try API first, fallback to wa.me
    const sent = await sendWhatsAppAPI(settings.whatsapp, msg, settings);
    if (!sent) {
      // wa.me fallback (opens WhatsApp — used when API not active)
      console.log('WhatsApp API inactive — order sent via wa.me link');
    }
    // Email notification
    await sendEmailNotification({
      to:      settings.footer_email || '',
      subject: `New Order #${order.invoiceNumber || order.id?.slice(0,8)}`,
      body:    msg,
    }, settings);
  }

  /* ---- Order status update to customer ---- */
  async function notifyStatusUpdate(order, newStatus, settings) {
    if (!settings.whatsapp_api_enabled) return;
    const statusMessages = {
      confirmed: `✅ Your Saga Herbals order #${order.invoiceNumber || order.id?.slice(0,8)} has been confirmed! We're preparing it for you. 🌿`,
      packed:    `📦 Your order #${order.invoiceNumber || order.id?.slice(0,8)} is packed and ready to ship!`,
      shipped:   `🚚 Your order #${order.invoiceNumber || order.id?.slice(0,8)} is on its way! Expected delivery in 2-5 days.`,
      delivered: `🎉 Your order #${order.invoiceNumber || order.id?.slice(0,8)} has been delivered! Thank you for shopping with Saga Herbals. 🌿`,
    };
    const msg = statusMessages[newStatus];
    if (msg && order.customerPhone) {
      await sendWhatsAppAPI(order.customerPhone, msg, settings);
    }
  }

  /* ============================================================
     EMAILJS
     1. Sign up at emailjs.com (free tier available)
     2. Create a service + email template
     3. Paste Service ID, Template ID, Public Key in
        Admin → Settings → Integrations → EmailJS
     ============================================================ */
  async function sendEmailNotification({ to, subject, body }, settings) {
    if (!settings.emailjs_enabled || !settings.emailjs_public_key || !to) return false;
    try {
      if (!window.emailjs) { console.warn('EmailJS SDK not loaded'); return false; }
      emailjs.init(settings.emailjs_public_key);
      await emailjs.send(settings.emailjs_service_id, settings.emailjs_template_id, {
        to_email: to, subject, message: body,
      });
      return true;
    } catch (e) {
      console.warn('EmailJS send failed:', e);
      return false;
    }
  }

  /* ---- Auto-send order confirmation to customer ---- */
  async function sendOrderConfirmationEmail(order, settings) {
    if (!order.customerEmail) return;
    await sendEmailNotification({
      to:      order.customerEmail,
      subject: `Order Confirmed #${order.invoiceNumber || order.id?.slice(0,8)} — Saga Herbals`,
      body:    `Hi ${order.customerName},\n\nThank you for your order!\n\n${buildOrderMessage(order, settings)}\n\nTrack your order at: ${window.location.origin}/track.html?id=${order.id}`,
    }, settings);
  }

  /* ============================================================
     W3FORMS  (customer complaint / contact form)
     1. Sign up at web3forms.com (free)
     2. Get your Access Key
     3. Paste in Admin → Settings → Integrations → W3Forms Key
     ============================================================ */
  async function submitW3Form({ name, email, subject, message }, settings) {
    if (!settings.w3forms_enabled || !settings.w3forms_key) return false;
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: settings.w3forms_key,
          name, email, subject, message,
          from_name: 'Saga Herbals Website',
        }),
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      console.warn('W3Forms submit failed:', e);
      return false;
    }
  }

  /* ---- Build order WhatsApp message ---- */
  function buildOrderMessage(order, settings) {
    const lines = (order.items || []).map(i => `• ${i.emoji||'🌿'} ${i.name} × ${i.qty} = ₹${i.subtotal||i.price*i.qty}`).join('\n');
    return `🌿 *New Order — Saga Herbals*\n` +
      `🔖 Order: ${order.invoiceNumber || order.id}\n\n` +
      `👤 *${order.customerName}*\n📱 ${order.customerPhone}\n📍 ${order.deliveryAddress}, ${order.city} — ${order.pincode}\n\n` +
      `*Items:*\n${lines}\n\n` +
      `Subtotal: ₹${order.subtotal}${order.discount ? `\nDiscount: -₹${order.discount}` : ''}\nShipping: ₹${order.shippingCharge}\n*Total: ₹${order.total}*\nPayment: ${order.paymentMethod}` +
      (order.notes ? `\nNote: ${order.notes}` : '') +
      `\n\n📦 Track: ${window.location.origin}/track.html?id=${order.id}`;
  }

  return { notifyNewOrder, notifyStatusUpdate, sendOrderConfirmationEmail, submitW3Form, buildOrderMessage };
})();
