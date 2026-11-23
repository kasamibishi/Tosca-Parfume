# Tosca Parfume

Mobile-first perfume catalog for Tosca Parfume, built to be opened from a QR code. Customers browse the range, filter it and order through WhatsApp with the product name and price already filled into the message.

## Features

- Catalog of 150+ fragrances, loaded from a single `catalog.json`
- Search by perfume name or brand
- Quick filters for Men, Women and Unisex
- Advanced filters: brand, maximum price, and sorting by price
- One-tap WhatsApp ordering with a pre-written message
- Three languages: English, Albanian (AL) and Macedonian (MK), remembered between visits
- Responsive layout from phones to wide desktops (2 to 5 product columns)
- Keyboard accessible, with visible focus states and reduced-motion support
- No build step and no dependencies

## Tech

Plain HTML, CSS and JavaScript. Fonts (Cinzel and Cormorant Garamond) load from Google Fonts.

## Project structure

```
public/
├── index.html      Page markup
├── style.css       Styles and breakpoints
├── script.js       Rendering, filters, search, translations
├── catalog.json    Product data
└── images/
    ├── banner.webp
    ├── h-logo.png
    └── catalog/    Product photos (.webp)
```

## Run locally

The catalog is loaded with `fetch`, so open the site through a local server rather than double-clicking `index.html`.

```bash
cd public
python -m http.server 8000
```

Then open http://localhost:8000.

## Managing the catalog

Each product in `public/catalog.json` looks like this:

```json
{
  "id": 5,
  "name": "Tom Ford - Oud Wood",
  "brand": "Tom Ford",
  "gender": "unisex",
  "price": "MKD1,800",
  "image": "images/catalog/tom-ford_oud-wood.webp"
}
```

| Field    | Notes                                                                  |
| -------- | ---------------------------------------------------------------------- |
| `id`     | Unique number                                                          |
| `name`   | Full name. The brand part is hidden on the card but kept in the WhatsApp message |
| `brand`  | Used for the brand line, brand filter and search                       |
| `gender` | `burra` (men), `gra` (women) or `unisex`                               |
| `price`  | Text in the form `MKD1,800`                                            |
| `image`  | Path to a `.webp` file in `images/catalog/`                            |

To add a product, put the photo in `images/catalog/` and add an entry to `catalog.json`.

If prices go above 4,500 or below 1,600, update the price slider's `min` and `max` in `index.html` and `maxPrice` in `filterState` at the top of `script.js`.

## Configuration

- **WhatsApp number:** `waNumber` at the top of `script.js`, and the floating button link in `index.html`
- **Translations:** the `translations` object in `script.js`
- **Colors and fonts:** the CSS variables at the top of `style.css`

## Deployment

The site is static. Upload the contents of `public/` to any static host (Firebase Hosting, Netlify, GitHub Pages, Cloudflare Pages) and point the QR code at the resulting URL.

## Credits

Website built by [Kasio IT](https://www.instagram.com/kasio_it/).

&copy; 2026 Tosca Parfume. All rights reserved.
