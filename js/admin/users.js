/* ============================================================
   SAGA HERBALS ADMIN — USER ROLES MODULE
   Manage admin users, roles, online presence, activity log.
   Only ultra_super_admin can access this page.
   ============================================================ */

const AdminUsers = (() => {
  let _users    = [];
  let _activity = [];

  function setUsers(users)       { _users    = users; renderUsers(); }
  function setActivity(activity) { _activity = activity; renderActivity(); }

  /* ---- Render users table ---- */
  function renderUsers() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    if (!_users.length) {
      tbody.innerHTML = `<tr><td colspan="5"><div style="text-align:center;padding:2rem;color:#9CA3AF;">No admin users yet.</div></td></tr>`;
      return;
    }
    tbody.innerHTML = _users.map(u => {
      const lastSeen = u.lastSeen?.toDate ? u.lastSeen.toDate().toLocaleString('en-IN') : '—';
      const roleBg   = { ultra_super_admin:'#7C3AED', super_admin:'#1D4ED8', admin:'#047857', viewer:'#6B7280' }[u.role] || '#6B7280';
      return `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:.6rem;">
            <div style="width:8px;height:8px;border-radius:50%;background:${u.online?'#10B981':'#D1D5DB'};flex-shrink:0;" title="${u.online?'Online':'Offline'}"></div>
            <strong style="font-size:.88rem;">${u.displayName||u.email}</strong>
          </div>
          <div style="font-size:.75rem;color:#9CA3AF;margin-left:1.1rem;">${u.id}</div>
        </td>
        <td><span style="background:${roleBg};color:white;font-size:.72rem;font-weight:700;padding:3px 10px;border-radius:99px;letter-spacing:.03em;">${(u.role||'').replace(/_/g,' ').toUpperCase()}</span></td>
        <td><span style="font-size:.8rem;color:${u.online?'#10B981':'#9CA3AF'};">${u.online?'🟢 Online':'⚫ Offline'}</span></td>
        <td style="font-size:.78rem;color:#6B7280;">${lastSeen}</td>
        <td>
          <select class="filter-select" style="font-size:.78rem;padding:.3rem .5rem;" onchange="AdminUsers.changeRole('${u.id}',this.value)">
            <option value="viewer"             ${u.role==='viewer'            ?'selected':''}>Viewer</option>
            <option value="admin"              ${u.role==='admin'             ?'selected':''}>Admin</option>
            <option value="super_admin"        ${u.role==='super_admin'       ?'selected':''}>Super Admin</option>
            <option value="ultra_super_admin"  ${u.role==='ultra_super_admin' ?'selected':''}>Ultra Super Admin</option>
          </select>
          <button class="btn btn-danger btn-sm" style="margin-left:.4rem;" onclick="AdminUsers.removeUser('${u.id}')">🗑</button>
        </td>
      </tr>`;
    }).join('');
  }

  /* ---- Add user ---- */
  async function addUser() {
    const email = document.getElementById('new-user-email')?.value?.trim();
    const role  = document.getElementById('new-user-role')?.value;
    if (!email || !role) { adminToast('Email and role are required', true); return; }
    try {
      await fbSetAdminUser(email, role);
      document.getElementById('new-user-email').value = '';
      adminToast(`Admin user ${email} added with role: ${role}`);
    } catch(e) { adminToast('Failed to add user', true); }
  }

  /* ---- Change role ---- */
  async function changeRole(email, role) {
    try { await fbSetAdminUser(email, role); adminToast(`Role updated for ${email}`); }
    catch(e) { adminToast('Failed to update role', true); }
  }

  /* ---- Remove user ---- */
  async function removeUser(email) {
    if (!confirm(`Remove admin access for ${email}?`)) return;
    try { await fbRemoveAdminUser(email); adminToast(`${email} removed`); }
    catch(e) { adminToast('Failed to remove user', true); }
  }

  /* ---- Activity log ---- */
  function renderActivity() {
    const container = document.getElementById('activity-log');
    if (!container) return;
    if (!_activity.length) {
      container.innerHTML = `<div style="text-align:center;padding:2rem;color:#9CA3AF;">No activity yet.</div>`;
      return;
    }
    container.innerHTML = _activity.slice(0, 50).map(a => {
      const time = a.timestamp?.toDate ? a.timestamp.toDate().toLocaleString('en-IN') : '—';
      const actionColors = {
        UPDATE_ORDER_STATUS: '#3B82F6', ADD_PRODUCT: '#10B981', DELETE_PRODUCT: '#EF4444',
        UPDATE_SETTINGS: '#F59E0B', ADD_COUPON: '#8B5CF6', APPROVE_REVIEW: '#10B981',
        SET_ADMIN_ROLE: '#7C3AED', REMOVE_ADMIN_USER: '#EF4444',
      };
      const color = actionColors[a.action] || '#6B7280';
      return `<div style="display:flex;gap:.75rem;padding:.75rem;border-bottom:1px solid #F3F4F6;align-items:flex-start;">
        <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;margin-top:5px;"></div>
        <div style="flex:1;">
          <div style="font-size:.85rem;font-weight:500;color:#1F2937;">${a.action?.replace(/_/g,' ')}</div>
          <div style="font-size:.75rem;color:#9CA3AF;margin-top:2px;">by ${a.displayName||a.email} · ${time}</div>
          ${Object.keys(a.details||{}).length ? `<div style="font-size:.75rem;color:#6B7280;margin-top:2px;font-family:monospace;">${JSON.stringify(a.details)}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  return { setUsers, setActivity, renderUsers, renderActivity, addUser, changeRole, removeUser };
})();
