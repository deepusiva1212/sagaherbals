/* ============================================================
   SAGA HERBALS — SEO MODULE
   Call setSEO() on each page to set meta tags dynamically.
   ============================================================ */

const SEOModule = (() => {

  function set({ title, description, keywords, ogImage, canonical, type = 'website' }) {
    const site = 'Saga Herbals';

    // Title
    document.title = title ? `${title} | ${site}` : APP_CONFIG?.seo?.defaultTitle || site;

    // Helper to set/create meta
    const meta = (name, content, prop = false) => {
      if (!content) return;
      const attr = prop ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };

    const desc = description || APP_CONFIG?.seo?.defaultDescription || '';
    const kw   = keywords   || APP_CONFIG?.seo?.defaultKeywords   || '';
    const img  = ogImage    || APP_CONFIG?.seo?.ogImage           || '';

    meta('description', desc);
    meta('keywords', kw);
    meta('robots', 'index,follow');
    meta('og:type',        type,  true);
    meta('og:title',       document.title, true);
    meta('og:description', desc,  true);
    meta('og:image',       img,   true);
    meta('og:url',         canonical || window.location.href, true);
    meta('og:site_name',   site, true);
    meta('twitter:card',   'summary_large_image');
    meta('twitter:title',  document.title);
    meta('twitter:description', desc);
    if (img) meta('twitter:image', img);

    // Canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
      link.href = canonical;
    }
  }

  /* Apply SEO settings loaded from Firebase */
  function applyFromSettings(settings, pageOverrides = {}) {
    set({
      title:       pageOverrides.title       || settings.seo_title       || '',
      description: pageOverrides.description || settings.seo_description || '',
      keywords:    pageOverrides.keywords    || settings.seo_keywords    || '',
      ogImage:     pageOverrides.ogImage     || settings.seo_og_image    || '',
      canonical:   pageOverrides.canonical   || '',
    });
  }

  /* JSON-LD structured data for rich results */
  function injectStructuredData(settings, products = []) {
    const existing = document.getElementById('structured-data');
    if (existing) existing.remove();

    const data = {
      '@context': 'https://schema.org',
      '@type':    'Store',
      name:       settings.site_name || 'Saga Herbals',
      description: settings.seo_description || APP_CONFIG?.seo?.defaultDescription || '',
      url:        window.location.origin,
      telephone:  '+' + (settings.whatsapp || '919952427492'),
      address:    { '@type': 'PostalAddress', addressCountry: 'IN', addressRegion: 'Tamil Nadu' },
      sameAs:     [settings.instagram, settings.facebook].filter(Boolean),
    };

    if (products.length > 0) {
      data.hasOfferCatalog = {
        '@type': 'OfferCatalog',
        name: 'Herbal Products',
        itemListElement: products.slice(0, 10).map((p, i) => ({
          '@type':    'Offer',
          itemOffered: { '@type': 'Product', name: p.nameEN, description: p.descEN },
          price:      p.price,
          priceCurrency: 'INR',
          position:   i + 1,
        })),
      };
    }

    const script = document.createElement('script');
    script.id   = 'structured-data';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }

  return { set, applyFromSettings, injectStructuredData };
})();
