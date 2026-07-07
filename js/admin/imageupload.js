/* ============================================================
   SAGA HERBALS — IMAGE UPLOAD MODULE
   Uses Cloudinary unsigned upload (free tier = 25GB storage).
   Setup:
   1. Sign up free at cloudinary.com
   2. Go to Settings → Upload → Add upload preset
   3. Set preset to "Unsigned" mode
   4. Save preset name and cloud name in Admin → Settings → Images
   These are stored in Firebase so no code changes needed.
   ============================================================ */

const ImageUploadModule = (() => {

  /* ---- Upload a file to Cloudinary ---- */
  async function upload(file, settings, onProgress) {
    const cloudName  = settings.cloudinary_cloud_name || '';
    const uploadPreset = settings.cloudinary_upload_preset || '';

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary not configured. Go to Admin → Site Settings → Images to set up.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'saga-herbals/products');

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      if (onProgress) {
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
        });
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } else {
          reject(new Error('Upload failed: ' + xhr.responseText));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  }

  /* ---- Render upload button with preview ---- */
  function renderUploadButton(containerId, inputId, previewId, settings) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
      <div class="image-upload-wrap">
        <div class="image-preview" id="${previewId}" style="display:none;">
          <img id="${previewId}-img" src="" alt="Preview" style="max-width:120px;max-height:120px;object-fit:cover;border-radius:8px;"/>
          <button onclick="ImageUploadModule.clearImage('${previewId}','${inputId}')" style="position:absolute;top:-6px;right:-6px;background:#EF4444;color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:.7rem;">✕</button>
        </div>
        <label class="image-upload-label" for="${inputId}">
          <span id="${inputId}-status">📷 Upload Image</span>
          <input type="file" id="${inputId}" accept="image/*" style="display:none;" onchange="ImageUploadModule.handleFileSelect(this,'${previewId}','${containerId}')"/>
        </label>
        <div class="form-hint">Or paste a direct image URL in the field above. Max 10MB. JPG/PNG/WebP.</div>
        <div id="${inputId}-progress" style="display:none;margin-top:.5rem;">
          <div style="height:4px;background:#F3F4F6;border-radius:2px;overflow:hidden;">
            <div id="${inputId}-bar" style="height:4px;background:var(--green);border-radius:2px;width:0%;transition:width .3s;"></div>
          </div>
          <div style="font-size:.75rem;color:#6B7280;margin-top:.25rem;" id="${inputId}-pct">Uploading...</div>
        </div>
      </div>`;
  }

  async function handleFileSelect(input, previewId, containerId) {
    const file = input.files[0];
    if (!file) return;
    const statusEl   = document.getElementById(input.id + '-status');
    const progressEl = document.getElementById(input.id + '-progress');
    const barEl      = document.getElementById(input.id + '-bar');
    const pctEl      = document.getElementById(input.id + '-pct');

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = e => {
      const preview = document.getElementById(previewId);
      const img     = document.getElementById(previewId + '-img');
      if (preview && img) { img.src = e.target.result; preview.style.display = 'block'; preview.style.position = 'relative'; }
    };
    reader.readAsDataURL(file);

    // Get settings from Firebase
    let settings = {};
    try { settings = await fbGetSettings(); } catch(e) {}

    // If Cloudinary not configured, just use local blob URL
    if (!settings.cloudinary_cloud_name || !settings.cloudinary_upload_preset) {
      if (statusEl) statusEl.textContent = '⚠️ Cloudinary not set up — URL not saved';
      return;
    }

    // Upload
    if (statusEl) statusEl.textContent = 'Uploading...';
    if (progressEl) progressEl.style.display = 'block';

    try {
      const url = await upload(file, settings, pct => {
        if (barEl) barEl.style.width = pct + '%';
        if (pctEl) pctEl.textContent = pct + '%';
      });

      // Put URL into the image URL input field
      const urlInput = document.getElementById('p-image-url');
      if (urlInput) urlInput.value = url;
      if (statusEl) statusEl.textContent = '✅ Uploaded!';
      if (progressEl) setTimeout(() => progressEl.style.display = 'none', 2000);
    } catch(e) {
      if (statusEl) statusEl.textContent = '❌ Upload failed';
      if (typeof adminToast === 'function') adminToast(e.message, true);
    }
  }

  function clearImage(previewId, inputId) {
    const preview = document.getElementById(previewId);
    if (preview) preview.style.display = 'none';
    const input = document.getElementById(inputId);
    if (input) input.value = '';
    const urlInput = document.getElementById('p-image-url');
    if (urlInput) urlInput.value = '';
  }

  return { upload, renderUploadButton, handleFileSelect, clearImage };
})();
