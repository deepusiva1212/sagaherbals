/* ============================================================
   SAGA HERBALS ADMIN — ANALYTICS MODULE
   Sales charts using Chart.js. Call renderAll(orders).
   ============================================================ */

const AnalyticsModule = (() => {
  const _charts = {};

  function _destroy(id) {
    if (_charts[id]) { try { _charts[id].destroy(); } catch(e){} delete _charts[id]; }
  }

  function _setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

  /* ---- Process raw orders ---- */
  function processOrders(orders) {
    const now    = new Date();
    const active = orders.filter(o => o.status !== 'cancelled');

    // Last 14 days labels
    const revenueByDay = {};
    const ordersByDay  = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const k = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      revenueByDay[k] = 0;
      ordersByDay[k]  = 0;
    }
    active.forEach(o => {
      if (!o.createdAt?.toDate) return;
      const k = o.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (revenueByDay[k] !== undefined) { revenueByDay[k] += o.total || 0; ordersByDay[k]++; }
    });

    // Payment breakdown
    const byPayment = {};
    active.forEach(o => {
      const m = o.paymentMethod || 'Unknown';
      byPayment[m] = (byPayment[m] || 0) + (o.total || 0);
    });

    // Status count
    const statusCount = { pending:0, confirmed:0, packed:0, shipped:0, delivered:0, cancelled:0 };
    orders.forEach(o => { if (statusCount[o.status] !== undefined) statusCount[o.status]++; });

    // Best sellers
    const productSales = {};
    active.forEach(o => {
      (o.items || []).forEach(item => {
        if (!productSales[item.name]) productSales[item.name] = { qty:0, revenue:0, emoji: item.emoji||'🌿' };
        productSales[item.name].qty     += item.qty || 0;
        productSales[item.name].revenue += item.subtotal || 0;
      });
    });
    const bestSellers = Object.entries(productSales)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    // Summary
    const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s,o) => s+(o.total||0), 0);
    const avgOrder     = active.length ? Math.round(active.reduce((s,o) => s+(o.total||0),0) / active.length) : 0;
    const todayStr     = now.toDateString();
    const todayOrders  = orders.filter(o => o.createdAt?.toDate && o.createdAt.toDate().toDateString() === todayStr);
    const todayRevenue = todayOrders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+(o.total||0),0);
    const thisMonthRev = active.filter(o => {
      if (!o.createdAt?.toDate) return false;
      const d = o.createdAt.toDate();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s,o) => s+(o.total||0), 0);

    return { revenueByDay, ordersByDay, byPayment, statusCount, bestSellers, totalRevenue, avgOrder,
             todayCount: todayOrders.length, todayRevenue, thisMonthRev };
  }

  /* ---- Render all ---- */
  function renderAll(orders) {
    if (!window.Chart) { console.warn('Chart.js not loaded'); return; }
    const data = processOrders(orders);
    _renderSummary(data);
    _renderRevenue(data);
    _renderOrders(data);
    _renderPayment(data);
    _renderStatus(data);
    _renderBestSellers(data);
  }

  function _renderSummary(d) {
    _setEl('analytics-today-orders', d.todayCount);
    _setEl('analytics-today-rev',   `₹${d.todayRevenue.toLocaleString('en-IN')}`);
    _setEl('analytics-month-rev',   `₹${d.thisMonthRev.toLocaleString('en-IN')}`);
    _setEl('analytics-avg-order',   `₹${d.avgOrder.toLocaleString('en-IN')}`);
    _setEl('analytics-total-rev',   `₹${d.totalRevenue.toLocaleString('en-IN')}`);
  }

  function _renderRevenue(d) {
    _destroy('revenue-chart');
    const ctx = document.getElementById('revenue-chart');
    if (!ctx) return;
    _charts['revenue-chart'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Object.keys(d.revenueByDay),
        datasets: [{ label:'Revenue (₹)', data: Object.values(d.revenueByDay),
          borderColor:'#2D6A4F', backgroundColor:'rgba(45,106,79,.08)',
          borderWidth:2.5, pointBackgroundColor:'#2D6A4F', pointRadius:4, fill:true, tension:0.4 }],
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
        scales:{ x:{grid:{display:false},ticks:{font:{size:10}}},
                 y:{grid:{color:'#F3F4F6'},ticks:{callback:v=>`₹${v.toLocaleString('en-IN')}`,font:{size:10}}} } },
    });
  }

  function _renderOrders(d) {
    _destroy('orders-chart');
    const ctx = document.getElementById('orders-chart');
    if (!ctx) return;
    _charts['orders-chart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(d.ordersByDay),
        datasets: [{ label:'Orders', data: Object.values(d.ordersByDay),
          backgroundColor:'rgba(82,183,136,.6)', borderColor:'#52B788', borderWidth:1, borderRadius:4 }],
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
        scales:{ x:{grid:{display:false},ticks:{font:{size:10}}},
                 y:{grid:{color:'#F3F4F6'},ticks:{stepSize:1,font:{size:10}}} } },
    });
  }

  function _renderPayment(d) {
    _destroy('payment-chart');
    const ctx = document.getElementById('payment-chart');
    if (!ctx) return;
    const colors = ['#2D6A4F','#52B788','#D4A017','#F59E0B','#3B82F6','#8B5CF6'];
    _charts['payment-chart'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(d.byPayment),
        datasets: [{ data: Object.values(d.byPayment), backgroundColor: colors, borderWidth:0 }],
      },
      options: { responsive:true, maintainAspectRatio:false, cutout:'65%',
        plugins:{legend:{position:'bottom',labels:{font:{size:10},padding:10}}} },
    });
  }

  function _renderStatus(d) {
    _destroy('status-chart');
    const ctx = document.getElementById('status-chart');
    if (!ctx) return;
    const colors = {pending:'#F59E0B',confirmed:'#3B82F6',packed:'#8B5CF6',shipped:'#10B981',delivered:'#2D6A4F',cancelled:'#EF4444'};
    const labels = Object.keys(d.statusCount).filter(k => d.statusCount[k] > 0);
    _charts['status-chart'] = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{ data: labels.map(k => d.statusCount[k]), backgroundColor: labels.map(k=>colors[k]||'#9CA3AF'), borderWidth:0 }],
      },
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{legend:{position:'bottom',labels:{font:{size:10},padding:8}}} },
    });
  }

  function _renderBestSellers(d) {
    const container = document.getElementById('best-sellers-list');
    if (!container) return;
    if (!d.bestSellers.length) {
      container.innerHTML = `<div style="text-align:center;padding:2rem;color:#9CA3AF;">No sales data yet</div>`;
      return;
    }
    const max = d.bestSellers[0]?.qty || 1;
    const medalColors = ['#D4A017','#9CA3AF','#CD7F32'];
    container.innerHTML = d.bestSellers.map((p, i) => `
      <div style="display:flex;align-items:center;gap:.6rem;padding:.5rem 0;border-bottom:1px solid #F3F4F6;">
        <div style="width:22px;height:22px;background:${medalColors[i]||'#F3F4F6'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:${i<3?'white':'#6B7280'};flex-shrink:0;">${i+1}</div>
        <div style="font-size:1.1rem;flex-shrink:0;">${p.emoji}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.82rem;font-weight:600;color:#1F2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
          <div style="height:3px;background:#F3F4F6;border-radius:2px;margin-top:3px;">
            <div style="height:3px;background:var(--green);border-radius:2px;width:${Math.round(p.qty/max*100)}%;"></div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:.82rem;font-weight:700;color:var(--green);">${p.qty} sold</div>
          <div style="font-size:.72rem;color:#9CA3AF;">₹${p.revenue.toLocaleString('en-IN')}</div>
        </div>
      </div>`).join('');
  }

  return { renderAll, processOrders };
})();
