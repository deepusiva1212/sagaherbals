/* ============================================================
   SAGA HERBALS — MASTER CONFIG
   All feature flags and global constants live here.
   Turn features on/off by setting true/false below.
   ============================================================ */

const APP_CONFIG = {
  version: '3.0.0',
  siteName: 'Saga Herbals',

  /* ---- PAYMENT METHODS (also controlled live from admin) ---- */
  payments: {
    upi:         { enabled: true,  extraCharge: 0 },
    razorpay:    { enabled: true,  extraCharge: 0,  cardSurcharge: 2 },  // % surcharge for card
    cod:         { enabled: true,  extraCharge: 30 },                    // toggled from admin
    bankTransfer:{ enabled: true,  extraCharge: 0 },
  },

  /* ---- FUTURE API INTEGRATIONS (paste keys in admin → saved to Firebase) ---- */
  integrations: {
    whatsappApi:  false,   // enable when WhatsApp Business API key added
    emailJs:      false,   // enable when EmailJS keys added
    w3forms:      false,   // enable when W3Forms key added
    razorpay:     false,   // enable when Razorpay key added
  },

  /* ---- SEO DEFAULTS ---- */
  seo: {
    defaultTitle:       'Saga Herbals — Pure Organic Herbal Products',
    defaultDescription: '100% organic herbal bathing powder, hair oil & more. Child safe, pure herbs, fast delivery across India. Shop Saga Herbals.',
    defaultKeywords:    'herbal bathing powder, organic hair oil, child safe herbal, ayurvedic products, Tamil Nadu, saga herbals',
    ogImage:            '/assets/og-image.png',
    twitterHandle:      '',
  },

  /* ---- ROLES ---- */
  roles: {
    ULTRA_SUPER_ADMIN: 'ultra_super_admin',
    SUPER_ADMIN:       'super_admin',
    ADMIN:             'admin',
    VIEWER:            'viewer',
  },
};
