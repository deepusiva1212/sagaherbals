/* ============================================================
   SAGA HERBALS ADMIN — ORDERS MODULE
   Order list, filtering, detail view, status update,
   bulk print, CSV export, date/time sorting.
   ============================================================ */

const AdminOrders = (() => {
  let _all      = [];
  let _selected = new Set(); // for bulk actions
  let _settings = {};

  function init(settings) { _settings = settings; }
  function setOrders(orders) { _all = orders; }

  /* ---- Render table ---- */
  function render(filter = {}) {
    const tbody = document.getElementById('orders-tbody');
    let orders = [..._all];

    // Search
    if (filter.q) {
      const q = filter.q.toLowerCase();
      orders = orders.filter(o =>
        (o.customerName||'').toLowerCase().includes(q) ||
        (o.customerPhone||'').includes(q) ||
        (o.id||'').toLowerCase().includes(q) ||
        (o.invoiceNumber||'').toLowerCase().includes(q) ||
        (o.items||[]).some(i => i.name?.toLowerCase().includes(q))
      );
    }
    // Status filter
    if (filter.status) orders = orders.filter(o => o.status === filter.status);
    // Payment filter
    if (filter.payment) orders = orders.filter(o => o.paymentMethod === filter.payment);
    // Date range
    if (filter.dateFrom) {
      const from = new Date(filter.dateFrom);
      orders = orders.filter(o => o.createdAt?.toDate ? o.createdAt.toDate() >= from : true);
    }
    if (filter.dateTo) {
      const to = new Date(filter.dateTo);
      to.setHours(23,59,59);
      orders = orders.filter(o => o.createdAt?.toDate ? o.createdAt.toDate() <= to : true);
    }
    // Sort
    if (filter.sort === 'oldest') orders.reverse();
    else if (filter.sort === 'highest') orders.sort((a,b) => (b.total||0) - (a.total||0));
    else if (filter.sort === 'lowest')  orders.sort((a,b) => (a.total||0) - (b.total||0));

    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="10"><div style="text-align:center;padding:2.5rem;color:#9CA3AF;">📭 No orders found</div></td></tr>`;
      document.getElementById('orders-count').textContent = '0 orders';
      return;
    }

    document.getElementById('orders-count').textContent = `${orders.length} order${orders.length!==1?'s':''}`;
    tbody.innerHTML = orders.map(o => {
      const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
      const time = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '';
      const checked = _selected.has(o.id) ? 'checked' : '';
      return `<tr class="${_selected.has(o.id)?'selected-row':''}">
        <td><input type="checkbox" ${checked} onchange="AdminOrders.toggleSelect('${o.id}',this.checked)" style="accent-color:var(--green);"/></td>
        <td><div style="font-family:monospace;font-size:.75rem;background:#F3F4F6;padding:2px 6px;border-radius:4px;">${o.invoiceNumber||o.id?.slice(0,8)}</div></td>
        <td><strong style="font-size:.88rem;">${o.customerName||'—'}</strong><div style="font-size:.75rem;color:#9CA3AF;">${o.customerPhone||''}</div></td>
        <td style="font-size:.82rem;">${(o.items||[]).length} item(s)</td>
        <td><strong>₹${(o.total||0).toLocaleString('en-IN')}</strong>${o.discount?`<div style="font-size:.72rem;color:var(--green);">-₹${o.discount} off</div>`:''}</td>
        <td><span style="font-size:.75rem;background:#F3F4F6;padding:2px 7px;border-radius:99px;">${o.paymentMethod||'—'}</span></td>
        <td><span class="status-badge status-${o.status||'pending'}">${statusLabel(o.status)}</span></td>
        <td style="font-size:.78rem;color:#6B7280;">${date}<br/>${time}</td>
        <td>
          <div style="display:flex;gap:.3rem;">
            <button class="btn btn-secondary btn-sm" onclick="AdminOrders.openDetail('${o.id}')">👁</button>
            <button class="btn btn-secondary btn-sm" onclick="AdminOrders.printLabel('${o.id}')" title="Print Label">🖨</button>
          </div>
        </td>
      </tr>`;
    }).join('');

    updateBulkBar();
  }

  /* ---- Select / bulk ---- */
  function toggleSelect(id, checked) {
    if (checked) _selected.add(id);
    else _selected.delete(id);
    updateBulkBar();
  }

  function selectAll(checked) {
    _all.forEach(o => { if(checked) _selected.add(o.id); else _selected.delete(o.id); });
    document.querySelectorAll('#orders-tbody input[type=checkbox]').forEach(cb => cb.checked = checked);
    updateBulkBar();
  }

  function updateBulkBar() {
    const bar = document.getElementById('bulk-action-bar');
    if (!bar) return;
    const count = _selected.size;
    document.getElementById('bulk-count').textContent = count;
    bar.style.display = count > 0 ? 'flex' : 'none';
  }

  /* ---- Print multiple labels ---- */
  function printSelectedLabels() {
    const orders = _all.filter(o => _selected.has(o.id));
    if (!orders.length) return;
    const labels = orders.map(o => InvoiceModule.generateShippingLabel(o, _settings)).join('<div style="page-break-after:always;height:20px;"></div>');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Shipping Labels</title><style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:Arial,sans-serif;padding:20px;}
      .shipping-label{border:2px dashed #1B4332;border-radius:12px;padding:16px;max-width:380px;margin-bottom:20px;font-size:13px;}
      .label-top{display:flex;justify-content:space-between;font-weight:700;color:#1B4332;border-bottom:1px solid #E5E7EB;padding-bottom:8px;margin-bottom:12px;font-size:15px;}
      .label-to{margin-bottom:10px;line-height:1.6;}
      .label-section-title{font-size:10px;text-transform:uppercase;color:#6B7280;letter-spacing:.05em;margin-bottom:4px;}
      .label-items{font-size:11px;color:#6B7280;margin-bottom:8px;}
      .label-pay{font-size:11px;background:#F9FAFB;padding:4px 8px;border-radius:6px;font-weight:600;}
      @media print{.shipping-label{break-inside:avoid;}}
    </style></head><body>${labels}</body></html>`);
    win.document.close();
    win.onload = () => win.print();
  }

  /* ---- Print single label ---- */
  function printLabel(id) {
    const o = _all.find(x => x.id === id);
    if (!o) return;
    const label = InvoiceModule.generateShippingLabel(o, _settings);
    const win = window.open('','_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Label ${o.invoiceNumber||o.id}</title><style>
      body{font-family:Arial,sans-serif;padding:20px;}
      .shipping-label{border:2px dashed #1B4332;border-radius:12px;padding:20px;max-width:400px;font-size:13px;}
      .label-top{display:flex;justify-content:space-between;font-weight:700;color:#1B4332;border-bottom:1px solid #E5E7EB;padding-bottom:10px;margin-bottom:14px;font-size:16px;}
      .label-to{margin-bottom:12px;line-height:1.7;}
      .label-section-title{font-size:10px;text-transform:uppercase;color:#6B7280;letter-spacing:.05em;margin-bottom:4px;}
      .label-items{font-size:12px;color:#6B7280;margin-bottom:10px;}
      .label-pay{font-size:12px;background:#F9FAFB;padding:5px 10px;border-radius:6px;font-weight:600;}
    </style></head><body>${label}</body></html>`);
    win.document.close();
    win.onload = () => win.print();
  }

  /* ---- Order detail modal ---- */
  function openDetail(id) {
    const o = _all.find(x => x.id === id);
    if (!o) return;
    window._currentOrderId = id;
    const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString('en-IN') : '—';
    document.getElementById('order-modal-title').textContent = `Order ${o.invoiceNumber || '#'+o.id.slice(0,8)}`;
    document.getElementById('order-modal-body').innerHTML = `
      <div class="order-detail-grid">
        <div class="detail-box"><h4>Customer</h4>
          <div class="detail-row"><span>Name</span><span>${o.customerName||'—'}</span></div>
          <div class="detail-row"><span>Phone</span><span>${o.customerPhone||'—'}</span></div>
          ${o.customerEmail?`<div class="detail-row"><span>Email</span><span>${o.customerEmail}</span></div>`:''}
          <div class="detail-row"><span>City</span><span>${o.city||'—'}, ${o.pincode||''}</span></div>
          <div class="detail-row"><span>Address</span><span style="text-align:right;max-width:180px;font-size:.82rem;">${o.deliveryAddress||'—'}</span></div>
          ${o.notes?`<div class="detail-row"><span>Notes</span><span>${o.notes}</span></div>`:''}
        </div>
        <div class="detail-box"><h4>Payment</h4>
          <div class="detail-row"><span>Invoice</span><span style="font-family:monospace;">${o.invoiceNumber||o.id}</span></div>
          <div class="detail-row"><span>Method</span><span>${o.paymentMethod||'—'}</span></div>
          <div class="detail-row"><span>Subtotal</span><span>₹${o.subtotal||0}</span></div>
          ${o.discount?`<div class="detail-row"><span>Discount (${o.couponCode||''})</span><span style="color:var(--green);">-₹${o.discount}</span></div>`:''}
          <div class="detail-row"><span>Shipping</span><span>${o.shippingCharge===0?'Free':'₹'+(o.shippingCharge||0)}</span></div>
          <div class="detail-row"><span><strong>Total</strong></span><span><strong style="color:var(--green);">₹${o.total||0}</strong></span></div>
          <div class="detail-row"><span>Placed</span><span style="font-size:.78rem;">${date}</span></div>
        </div>
      </div>
      <div class="order-items-list">${(o.items||[]).map(i=>`
        <div class="order-item-row">
          <div class="order-item-emoji">${i.emoji||'🌿'}</div>
          <div class="order-item-info"><strong>${i.name||'Product'}</strong><span style="color:#6B7280;"> × ${i.qty}</span></div>
          <div class="order-item-price">₹${i.subtotal||i.price*i.qty}</div>
        </div>`).join('')}</div>
      <h4 style="font-size:.78rem;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;margin:.75rem 0;">Update Status</h4>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.75rem;">
        ${['pending','confirmed','packed','shipped','delivered','cancelled'].map(s=>`
          <button class="btn btn-sm ${o.status===s?'btn-primary':'btn-secondary'}" onclick="AdminOrders._setStatus('${s}')" id="sbtn-${s}">${statusLabel(s)}</button>`).join('')}
      </div>
      <div class="form-group">
        <label class="form-label">Status Note (tracking ID, courier name, etc.)</label>
        <input class="form-control" id="status-note" placeholder="e.g. Dispatched via DTDC, tracking: 123456" value="${o.statusNote||''}"/>
      </div>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:.75rem;">
        <a class="btn btn-secondary btn-sm" href="https://wa.me/${(o.customerPhone||'').replace(/\D/g,'')}" target="_blank">💬 WhatsApp Customer</a>
        <button class="btn btn-secondary btn-sm" onclick="AdminOrders.printInvoice('${o.id}')">🧾 Print Invoice</button>
        <button class="btn btn-secondary btn-sm" onclick="AdminOrders.printLabel('${o.id}')">🖨 Print Label</button>
      </div>`;
    document.getElementById('order-modal').classList.add('open');
    window._selectedStatus = o.status;
  }

  function _setStatus(s) {
    document.querySelectorAll('[id^="sbtn-"]').forEach(b => b.className = b.className.replace('btn-primary','btn-secondary'));
    document.getElementById(`sbtn-${s}`)?.classList.replace('btn-secondary','btn-primary');
    window._selectedStatus = s;
  }

  async function updateStatus() {
    const s    = window._selectedStatus;
    const id   = window._currentOrderId;
    const note = document.getElementById('status-note')?.value || '';
    if (!s || !id) return;
    try {
      await fbUpdateOrderStatus(id, s, note);
      const settings = window._adminSettings || {};
      const order    = _all.find(o => o.id === id);
      if (order) await NotificationsModule.notifyStatusUpdate({ ...order, id }, s, settings);
      adminToast(`Status updated to "${statusLabel(s)}"`);
      closeOrderModal();
    } catch(e) { adminToast('Failed to update status', true); }
  }

  async function cancelOrder() {
    const id = window._currentOrderId;
    if (!id || !confirm('Cancel this order?')) return;
    try { await fbUpdateOrderStatus(id, 'cancelled', 'Cancelled by admin'); adminToast('Order cancelled'); closeOrderModal(); }
    catch(e) { adminToast('Failed', true); }
  }

  function printInvoice(id) {
    const o = _all.find(x => x.id === id);
    if (!o) return;
    InvoiceModule.printOrder(o, _settings);
  }

  /* ---- Export CSV ---- */
  function exportCSV() {
    const headers = ['Invoice','Order ID','Customer','Phone','Email','City','Pincode','Address','Subtotal','Discount','Coupon','Shipping','Total','Payment','Status','Date','Items'];
    const rows = _all.map(o => {
      const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : '';
      const items = (o.items||[]).map(i=>`${i.name} x${i.qty}`).join(' | ');
      return [o.invoiceNumber||'',o.id,o.customerName,o.customerPhone,o.customerEmail||'',o.city,o.pincode,o.deliveryAddress,o.subtotal,o.discount||0,o.couponCode||'',o.shippingCharge,o.total,o.paymentMethod,o.status,date,items];
    });
    const csv = [headers, ...rows].map(r => r.map(c=>`"${(c||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const a   = document.createElement('a');
    a.href    = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    a.download= `saga-herbals-orders-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  return { init, setOrders, render, toggleSelect, selectAll, updateBulkBar, printSelectedLabels, printLabel, printInvoice, openDetail, _setStatus, updateStatus, cancelOrder, exportCSV };
})();

function closeOrderModal() {
  document.getElementById('order-modal').classList.remove('open');
  window._currentOrderId = null; window._selectedStatus = null;
}
