/* ============================================================
   SAGA HERBALS — SEARCH & FILTER MODULE
   Product search bar, category tabs, sort.
   ============================================================ */

const SearchModule = (() => {
  let _all       = [];
  let _lang      = 'EN';
  let _onResults = null;
  let _activeCategory = 'all';

  function init(products, lang, onResults) {
    _all       = products;
    _lang      = lang;
    _onResults = onResults;
  }

  function setProducts(p) { _all = p; filter(); }
  function setLang(l)     { _lang = l; }

  function filter() {
    const q    = (document.getElementById('product-search-bar')?.value || '').trim().toLowerCase();
    const sort = document.getElementById('product-sort-select')?.value || 'default';
    const minP = parseFloat(document.getElementById('price-min')?.value) || 0;
    const maxP = parseFloat(document.getElementById('price-max')?.value) || Infinity;

    // Show/hide clear button
    const clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

    let results = [..._all];

    if (q) {
      results = results.filter(p => {
        const en   = (p.nameEN || '').toLowerCase();
        const tm   = (p.nameTM || '').toLowerCase();
        const desc = (p.descEN || '').toLowerCase();
        const tags = (p.tags || []).join(' ').toLowerCase();
        return en.includes(q) || tm.includes(q) || desc.includes(q) || tags.includes(q);
      });
    }

    if (_activeCategory && _activeCategory !== 'all') {
      results = results.filter(p => p.category === _activeCategory);
    }

    results = results.filter(p => p.price >= minP && p.price <= maxP);

    if (sort === 'price_asc')  results.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') results.sort((a, b) => b.price - a.price);
    if (sort === 'name_asc')   results.sort((a, b) => a.nameEN.localeCompare(b.nameEN));
    if (sort === 'newest')     results.sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));
    if (sort === 'popular')    results.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));

    const countEl = document.getElementById('search-result-count');
    if (countEl) {
      if (q || _activeCategory !== 'all') {
        countEl.textContent = `${results.length} product${results.length !== 1 ? 's' : ''} found`;
        countEl.style.display = 'block';
      } else {
        countEl.style.display = 'none';
      }
    }

    if (_onResults) _onResults(results);
  }

  function clearSearch() {
    const el = document.getElementById('product-search-bar');
    if (el) el.value = '';
    filter();
  }

  function setCategory(cat) {
    _activeCategory = cat;
    document.querySelectorAll('.cat-tab').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.cat === cat));
    const container = document.getElementById('product-cat-tabs');
    if (container) container.dataset.active = cat;
    filter();
  }

  function renderCategoryTabs(categories) {
    const container = document.getElementById('product-cat-tabs');
    if (!container) return;
    const cats = [
      { value: 'all', label: 'All', emoji: '🌿' },
      ...categories,
    ];
    container.innerHTML = cats.map(c => `
      <button class="cat-tab ${c.value === 'all' ? 'active' : ''}"
        data-cat="${c.value}"
        onclick="SearchModule.setCategory('${c.value}')">
        ${c.emoji || ''} ${c.label}
      </button>`).join('');
    container.dataset.active = 'all';
  }

  function getFiltered() { return _all; }

  return { init, setProducts, setLang, filter, clearSearch, setCategory, renderCategoryTabs, getFiltered };
})();
