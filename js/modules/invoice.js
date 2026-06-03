/* ============================================================
   SAGA HERBALS — INVOICE / BILL MODULE
   Generates printable invoice HTML for orders.
   ============================================================ */

const InvoiceModule = (() => {

  function generate(order, settings = {}) {
    const date = order.createdAt?.toDate
      ? order.createdAt.toDate().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })
      : new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });

    const items = (order.items || []).map(item => `
      <tr>
        <td>${item.emoji || '🌿'} ${item.name || 'Product'}</td>
        <td style="text-align:center;">${item.qty}</td>
        <td style="text-align:right;">₹${item.price}</td>
        <td style="text-align:right;">₹${item.subtotal || item.price * item.qty}</td>
      </tr>`).join('');

    const invoiceNum = order.invoiceNumber || order.id?.slice(0, 8).toUpperCase() || '—';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Invoice ${invoiceNum} — ${settings.site_name || 'Saga Herbals'}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1A1A2E;font-size:14px;padding:20px;}
  .invoice{max-width:700px;margin:0 auto;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;}
  .inv-header{background:linear-gradient(135deg,#1B4332,#2D6A4F);color:white;padding:24px 28px;display:flex;justify-content:space-between;align-items:center;}
  .inv-logo{font-size:1.4rem;font-weight:700;}
  .inv-logo span{font-size:.85rem;opacity:.7;display:block;font-weight:400;}
  .inv-num{text-align:right;}
  .inv-num strong{font-size:1.1rem;}
  .inv-num span{font-size:.8rem;opacity:.7;display:block;}
  .inv-body{padding:24px 28px;}
  .inv-row{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;}
  .inv-section h4{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:#6B7280;margin-bottom:8px;}
  .inv-section p{font-size:.88rem;line-height:1.6;}
  table{width:100%;border-collapse:collapse;margin:16px 0;}
  thead tr{background:#F9FAFB;}
  th{padding:10px 12px;text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:#6B7280;border-bottom:2px solid #E5E7EB;}
  td{padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:.88rem;}
  .totals{margin-left:auto;width:240px;}
  .total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:.88rem;color:#374151;}
  .total-row.grand{border-top:2px solid #1B4332;margin-top:8px;padding-top:8px;font-size:1rem;font-weight:700;color:#1B4332;}
  .inv-footer{background:#F9FAFB;padding:16px 28px;border-top:1px solid #E5E7EB;text-align:center;font-size:.78rem;color:#9CA3AF;}
  .badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:.75rem;font-weight:600;}
  .badge-pending{background:rgba(245,158,11,.12);color:#B45309;}
  .badge-delivered{background:rgba(45,106,79,.12);color:#1B4332;}
  @media print{body{padding:0;}.invoice{border:none;border-radius:0;}}
</style>
</head>
<body>
<div class="invoice">
  <div class="inv-header">
    <div class="inv-logo">🌿 ${settings.site_name || 'Saga Herbals'}<span>${settings.tagline || 'Pure • Organic • Natural'}</span></div>
    <div class="inv-num"><strong>Invoice #${invoiceNum}</strong><span>${date}</span></div>
  </div>
  <div class="inv-body">
    <div class="inv-row">
      <div class="inv-section">
        <h4>Bill To</h4>
        <p><strong>${order.customerName || '—'}</strong><br/>
        ${order.customerPhone || ''}<br/>
        ${order.deliveryAddress || ''}<br/>
        ${order.city || ''} — ${order.pincode || ''}</p>
      </div>
      <div class="inv-section">
        <h4>Order Details</h4>
        <p>Order ID: <strong>${order.id}</strong><br/>
        Payment: <strong>${order.paymentMethod || '—'}</strong><br/>
        Status: <span class="badge badge-${order.status||'pending'}">${(order.status||'pending').charAt(0).toUpperCase()+(order.status||'pending').slice(1)}</span></p>
      </div>
    </div>
    <table>
      <thead><tr><th>Product</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead>
      <tbody>${items}</tbody>
    </table>
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>₹${order.subtotal || 0}</span></div>
      ${order.discount ? `<div class="total-row" style="color:#059669;"><span>Discount (${order.couponCode||''})</span><span>-₹${order.discount}</span></div>` : ''}
      <div class="total-row"><span>Shipping</span><span>${order.shippingCharge === 0 ? 'Free' : '₹' + order.shippingCharge}</span></div>
      <div class="total-row grand"><span>Total</span><span>₹${order.total || 0}</span></div>
    </div>
    ${order.notes ? `<p style="margin-top:16px;font-size:.82rem;color:#6B7280;">📝 Note: ${order.notes}</p>` : ''}
  </div>
  <div class="inv-footer">
    Thank you for shopping with ${settings.site_name || 'Saga Herbals'}! 🌿 For support: WhatsApp +${(settings.whatsapp||'919952427492').slice(0,2)} ${(settings.whatsapp||'919952427492').slice(2,7)} ${(settings.whatsapp||'919952427492').slice(7)}
  </div>
</div>
</body>
</html>`;
  }

  function printOrder(order, settings) {
    const html = generate(order, settings);
    const win  = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.print(); };
  }

  function generateShippingLabel(order, settings) {
    return `
      <div class="shipping-label" data-id="${order.id}">
        <div class="label-top">
          <strong>🌿 ${settings.site_name || 'Saga Herbals'}</strong>
          <span>Order: ${order.invoiceNumber || order.id?.slice(0,8).toUpperCase()}</span>
        </div>
        <div class="label-to">
          <div class="label-section-title">DELIVER TO:</div>
          <strong>${order.customerName || '—'}</strong><br/>
          ${order.deliveryAddress || ''}<br/>
          ${order.city || ''} — ${order.pincode || ''}<br/>
          📱 ${order.customerPhone || ''}
        </div>
        <div class="label-items">
          Items: ${(order.items||[]).map(i=>`${i.emoji||'🌿'}${i.name} ×${i.qty}`).join(', ')}
        </div>
        <div class="label-pay">Payment: ${order.paymentMethod || '—'} | Total: ₹${order.total || 0}</div>
      </div>`;
  }

  return { generate, printOrder, generateShippingLabel };
})();
