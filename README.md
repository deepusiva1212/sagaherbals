# Saga Herbals Website

## 📁 File Structure

```
saga-herbals/
├── index.html          ← Main website page
├── css/
│   ├── theme.css       ← 🎨 COLORS & FONTS (edit this to change theme)
│   └── style.css       ← Layout & component styles
└── js/
    ├── data.js         ← 📦 Products, prices & translations
    └── app.js          ← Website logic (cart, checkout, language)
```

---

## 🎨 To Change Colors

Open `css/theme.css` and edit the values under `:root { }`.

Key variables:
- `--color-primary` → Main green color
- `--color-accent` → Gold/highlight color
- `--color-bg` → Background color

---

## 📦 To Add/Edit Products

Open `js/data.js` and find the `products: [ ... ]` array.

Each product looks like:
```js
{
  id: 1,
  emoji: "🌿",
  nameEN: "English Name",
  nameTM: "தமிழ் பெயர்",
  descEN: "English description",
  descTM: "தமிழ் விளக்கம்",
  price: 199,
  originalPrice: 299,   // crossed-out price
  badge: "Best Seller",
  tags: ["Organic", "Child Safe"],
}
```

---

## 💬 To Change WhatsApp Number

Open `js/data.js` and change:
```js
whatsapp: "919952427492",
```
(country code + number, no spaces or +)

---

## 🌐 To Host the Website

Upload the entire `saga-herbals/` folder to:
- **Free**: Netlify, Vercel, GitHub Pages
- **Paid**: Any web hosting (Hostinger, GoDaddy, etc.)

No server needed — it's a pure HTML/CSS/JS website!

---

## ✏️ To Fix the Instagram Username Spelling

In `js/data.js` and `index.html`, search for `saga_herbels` and replace with `saga_herbals` once the Instagram account is updated.
