/* ============================================================
   SAGA HERBALS ADMIN — INTEGRATIONS MODULE
   WhatsApp API, EmailJS, W3Forms, Razorpay key management.
   Keys are stored in Firebase — never in code files.
   ============================================================ */

const AdminIntegrations = (() => {

  function loadForm(settings) {
    // WhatsApp API
    _val('int-wa-key',      settings.whatsapp_api_key     || '');
    _chk('int-wa-enabled',  settings.whatsapp_api_enabled || false);
    // EmailJS
    _val('int-ejs-service', settings.emailjs_service_id   || '');
    _val('int-ejs-template',settings.emailjs_template_id  || '');
    _val('int-ejs-pubkey',  settings.emailjs_public_key   || '');
    _chk('int-ejs-enabled', settings.emailjs_enabled      || false);
    // W3Forms
    _val('int-w3-key',      settings.w3forms_key          || '');
    _chk('int-w3-enabled',  settings.w3forms_enabled      || false);
    // SEO
    _val('seo-title',       settings.seo_title            || '');
    _val('seo-desc',        settings.seo_description      || '');
    _val('seo-keywords',    settings.seo_keywords         || '');
    _val('seo-og-image',    settings.seo_og_image         || '');
  }

  function _val(id, v) { const el=document.getElementById(id); if(el) el.value=v; }
  function _chk(id, v) { const el=document.getElementById(id); if(el) el.checked=v; }
  function _get(id)     { const el=document.getElementById(id); return el ? el.value.trim() : ''; }
  function _gchk(id)    { const el=document.getElementById(id); return el ? el.checked : false; }

  async function saveIntegrations() {
    try {
      await fbSaveSettings({
        whatsapp_api_key:     _get('int-wa-key'),
        whatsapp_api_enabled: _gchk('int-wa-enabled'),
        emailjs_service_id:   _get('int-ejs-service'),
        emailjs_template_id:  _get('int-ejs-template'),
        emailjs_public_key:   _get('int-ejs-pubkey'),
        emailjs_enabled:      _gchk('int-ejs-enabled'),
        w3forms_key:          _get('int-w3-key'),
        w3forms_enabled:      _gchk('int-w3-enabled'),
      });
      adminToast('Integration settings saved!');
    } catch(e) { adminToast('Failed to save', true); }
  }

  async function saveSEO() {
    try {
      await fbSaveSettings({
        seo_title:       _get('seo-title'),
        seo_description: _get('seo-desc'),
        seo_keywords:    _get('seo-keywords'),
        seo_og_image:    _get('seo-og-image'),
      });
      adminToast('SEO settings saved!');
    } catch(e) { adminToast('Failed to save SEO', true); }
  }

  function renderIntegrationCards() {
    return `
    <div class="settings-card full">
      <h3>📱 WhatsApp Business API</h3>
      <p style="font-size:.82rem;color:#6B7280;margin-bottom:1rem;">
        When you purchase a WhatsApp Business API plan (WATI, AiSensy, Interakt etc.),
        paste your API key here. Orders and status updates will be sent automatically.
      </p>
      <div class="form-grid">
        <div class="form-group full">
          <label class="form-label">API Key / Bearer Token</label>
          <input class="form-control" type="password" id="int-wa-key" placeholder="Paste your WhatsApp API key here"/>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;">
        <label class="toggle-switch"><input type="checkbox" id="int-wa-enabled"/><span class="toggle-slider"></span></label>
        <span style="font-size:.88rem;">Enable WhatsApp API (orders + status updates)</span>
      </div>
      <div style="background:#EFF6FF;border-radius:8px;padding:.875rem;font-size:.8rem;color:#1E40AF;margin-bottom:1rem;">
        💡 Without API key, the website uses wa.me links (WhatsApp opens on customer's phone). The API allows automatic silent notifications.
      </div>
      <button class="btn btn-primary" onclick="AdminIntegrations.saveIntegrations()">Save WhatsApp Settings</button>
    </div>

    <div class="settings-card">
      <h3>✉️ EmailJS (Auto Email)</h3>
      <p style="font-size:.82rem;color:#6B7280;margin-bottom:1rem;">
        Sign up free at <a href="https://emailjs.com" target="_blank" style="color:var(--green);">emailjs.com</a>.
        Create a service + template, then paste the IDs below.
      </p>
      <div class="form-group"><label class="form-label">Service ID</label><input class="form-control" id="int-ejs-service" placeholder="service_xxxxxxx"/></div>
      <div class="form-group"><label class="form-label">Template ID</label><input class="form-control" id="int-ejs-template" placeholder="template_xxxxxxx"/></div>
      <div class="form-group"><label class="form-label">Public Key</label><input class="form-control" id="int-ejs-pubkey" placeholder="Your EmailJS public key"/></div>
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;">
        <label class="toggle-switch"><input type="checkbox" id="int-ejs-enabled"/><span class="toggle-slider"></span></label>
        <span style="font-size:.88rem;">Enable auto-email on order</span>
      </div>
      <button class="btn btn-primary" onclick="AdminIntegrations.saveIntegrations()">Save EmailJS Settings</button>
    </div>

    <div class="settings-card">
      <h3>📝 W3Forms (Complaint Emails)</h3>
      <p style="font-size:.82rem;color:#6B7280;margin-bottom:1rem;">
        Sign up free at <a href="https://web3forms.com" target="_blank" style="color:var(--green);">web3forms.com</a>.
        Get your access key to receive complaint form submissions by email.
      </p>
      <div class="form-group"><label class="form-label">W3Forms Access Key</label><input class="form-control" id="int-w3-key" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/></div>
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;">
        <label class="toggle-switch"><input type="checkbox" id="int-w3-enabled"/><span class="toggle-slider"></span></label>
        <span style="font-size:.88rem;">Enable W3Forms for complaints</span>
      </div>
      <button class="btn btn-primary" onclick="AdminIntegrations.saveIntegrations()">Save W3Forms Settings</button>
    </div>

    <div class="settings-card full">
      <h3>🔍 SEO Settings</h3>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Page Title</label><input class="form-control" id="seo-title" placeholder="Saga Herbals — Pure Organic Natural Products"/></div>
        <div class="form-group"><label class="form-label">OG Image URL</label><input class="form-control" id="seo-og-image" placeholder="https://yoursite.com/assets/og.jpg"/></div>
        <div class="form-group full"><label class="form-label">Meta Description (max 160 chars)</label><input class="form-control" id="seo-desc" placeholder="100% organic herbal products. Child safe, fast delivery across India."/></div>
        <div class="form-group full"><label class="form-label">Keywords (comma separated)</label><input class="form-control" id="seo-keywords" placeholder="herbal bathing powder, organic hair oil, saga herbals"/></div>
      </div>
      <button class="btn btn-primary" onclick="AdminIntegrations.saveSEO()">Save SEO Settings</button>
    </div>`;
  }

  return { loadForm, saveIntegrations, saveSEO, renderIntegrationCards };
})();
