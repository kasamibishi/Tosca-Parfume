// ==========================================
// 1. DOM Elements & Application State
// ==========================================
const $ = (sel) => document.querySelector(sel);
const catalogEl = $('#catalog');
const searchBar = $('#search-bar');
const brandChips = $('#brand-chips');
const genderRow = $('#quick-filters-container');
const scrollTopBtn = $('#scroll-top-btn');
const loader = $('#page-loader');

const cartToggle = $('#cart-toggle');
const cartCount = $('#cart-count');
const cartDrawer = $('#cart-drawer');
const cartOverlay = $('#cart-overlay');
const cartClose = $('#cart-close');
const cartTitle = $('#cart-title');
const cartItemsEl = $('#cart-items');
const cartTotalLabel = $('#cart-total-label');
const cartTotalEl = $('#cart-total');
const checkoutBtn = $('#cart-checkout');

const WA_NUMBER = '38978204889';
const CART_KEY = 'tosca_cart';

let products = [];
let topBrands = [];
let currency = 'MKD';
const productById = new Map();
const skuIndex = new Map(); // sku -> { product, variant }

const state = { search: '', gender: 'all', brand: 'all', selected: {} }; // selected: productId -> sku
let cart = loadCart(); // [{ sku, qty }]

// ==========================================
// 2. Localization Engine
// ==========================================
const translations = {
  en: {
    addToCart: "Add to cart", added: "Added to cart", cartTitle: "Your cart",
    empty: "Your cart is empty. Add a fragrance to get started.",
    total: "Total", checkout: "Checkout via WhatsApp", remove: "Remove", all: "All",
    noResults: "No fragrances match your search.",
    waText: "Hello! I would like to order:", searchPlaceholder: "Search perfumes and brands..."
  },
  sq: {
    addToCart: "Shto në shportë", added: "U shtua në shportë", cartTitle: "Shporta juaj",
    empty: "Shporta është bosh. Shtoni një parfum për të filluar.",
    total: "Totali", checkout: "Përfundo porosinë në WhatsApp", remove: "Hiq", all: "Të gjitha",
    noResults: "Asnjë parfum nuk përputhet me kërkimin.",
    waText: "Përshëndetje! Dëshiroj të porosis:", searchPlaceholder: "Kërko parfume dhe brende..."
  },
  mk: {
    addToCart: "Додај во кошничка", added: "Додадено во кошничка", cartTitle: "Вашата кошничка",
    empty: "Кошничката е празна. Додадете парфем за да започнете.",
    total: "Вкупно", checkout: "Нарачај преку WhatsApp", remove: "Отстрани", all: "Сите",
    noResults: "Нема парфеми што одговараат на пребарувањето.",
    waText: "Здраво! Сакам да нарачам:", searchPlaceholder: "Пребарај парфеми и брендови..."
  }
};

let currentLang = localStorage.getItem('tosca_lang') || 'en';
if (!translations[currentLang]) currentLang = 'en';

function applyTranslation() {
  const t = translations[currentLang];
  document.documentElement.lang = currentLang;
  searchBar.placeholder = t.searchPlaceholder;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === currentLang));
  if (products.length) { renderChips(); renderCatalog(); }
  renderCart();
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentLang = btn.dataset.lang;
    localStorage.setItem('tosca_lang', currentLang);
    applyTranslation();
  });
});

// ==========================================
// 3. Utility Functions & UI Feedback
// ==========================================
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
const money = (n) => `${currency} ${n.toLocaleString('en-US')}`;

function hideLoader() {
  if (loader && !loader.classList.contains('hide-loader')) {
    loader.classList.add('hide-loader');
    setTimeout(() => { loader.style.display = 'none'; }, 400);
  }
}

function showToast(message) {
  const container = $('#toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  
  // Trigger reflow to ensure the transition plays
  void toast.offsetWidth;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 2500);
}

// ==========================================
// 4. Catalog UI (cards, variants, brand chips)
// ==========================================
const selectedVariant = (p) => (skuIndex.get(state.selected[p.id]) || {}).variant || p.variants[0];

function cardHTML(p) {
  const v = selectedVariant(p);
  const t = translations[currentLang];
  
  const notesHtml = p.notes && p.notes.length 
    ? `<div class="product-notes">${p.notes.map(n => `<span class="note-tag">${esc(n)}</span>`).join('')}</div>` 
    : '';

  const pills = p.variants.length > 1
    ? `<div class="variant-pills" role="group" aria-label="${esc(p.name)}">${p.variants.map(x =>
        `<button type="button" class="variant-pill${x.sku === v.sku ? ' is-active' : ''}" data-sku="${esc(x.sku)}" aria-pressed="${x.sku === v.sku}">${esc(x.label)}</button>`
      ).join('')}</div>`
    : '';
    
  return `
    <article class="product-card" data-id="${esc(p.id)}">
      <div class="product-media"><img class="product-img" src="${esc(v.image || p.image)}" alt="${esc(p.brand + ' ' + p.name)}" loading="lazy"></div>
      <div class="product-body">
        <p class="product-brand">${esc(p.brand)}</p>
        <h3 class="product-name">${esc(p.name)}</h3>
        ${notesHtml}
        ${pills}
        <p class="product-price">${money(v.price)}</p>
        <button type="button" class="btn-add" data-add>${t.addToCart}</button>
      </div>
    </article>`;
}

function renderCatalog() {
  catalogEl.innerHTML = products.map(cardHTML).join('') +
    `<p id="no-results" class="no-results" hidden>${translations[currentLang].noResults}</p>`;
  applyFilters();
}

function updateCard(card, p) {
  const v = selectedVariant(p);
  card.querySelectorAll('.variant-pill').forEach(b => {
    const on = b.dataset.sku === v.sku;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', on);
  });
  card.querySelector('.product-price').textContent = money(v.price);
  card.querySelector('.product-img').src = v.image || p.image;
}

function flashAdded(btn) {
  btn.classList.add('is-added');
  clearTimeout(btn._t);
  btn._t = setTimeout(() => {
    btn.classList.remove('is-added');
  }, 1200);
}

function renderChips() {
  const chip = (value, label) =>
    `<button type="button" class="filter-pill${state.brand === value ? ' active' : ''}" data-brand="${esc(value)}" aria-pressed="${state.brand === value}">${esc(label)}</button>`;
  brandChips.innerHTML = chip('all', translations[currentLang].all) + topBrands.map(b => chip(b, b)).join('');
}

function syncChips() {
  brandChips.querySelectorAll('[data-brand]').forEach(c => {
    const on = c.dataset.brand === state.brand;
    c.classList.toggle('active', on);
    c.setAttribute('aria-pressed', on);
  });
}

// ==========================================
// 5. Filtering Engine (instant, DOM-only)
// ==========================================
function applyFilters() {
  let shown = 0;
  catalogEl.querySelectorAll('.product-card').forEach(card => {
    const p = productById.get(card.dataset.id);
    const ok = (state.gender === 'all' || p.gender === state.gender)
            && (state.brand === 'all' || p.brand === state.brand)
            && (!state.search || p._s.includes(state.search));
    card.hidden = !ok;
    if (ok) shown++;
  });
  const empty = $('#no-results');
  if (empty) empty.hidden = shown > 0;
}

// ==========================================
// 6. Cart (state, persistence, drawer, WhatsApp checkout)
// ==========================================
function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(raw) ? raw.filter(i => i && typeof i.sku === 'string' && i.qty > 0) : [];
  } catch { return []; }
}

function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* storage unavailable */ }
}

function addToCart(sku) {
  const line = cart.find(i => i.sku === sku);
  if (line) line.qty = Math.min(line.qty + 1, 99); else cart.push({ sku, qty: 1 });
  saveCart();
  renderCart();
  cartCount.classList.remove('bump');
  void cartCount.offsetWidth; // restart the animation
  cartCount.classList.add('bump');
}

function changeQty(sku, delta) {
  const line = cart.find(i => i.sku === sku);
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) cart = cart.filter(i => i.sku !== sku);
  else line.qty = Math.min(line.qty, 99);
  saveCart();
  renderCart();
}

function removeLine(sku) {
  cart = cart.filter(i => i.sku !== sku);
  saveCart();
  renderCart();
}

const cartLines = () => cart.map(i => ({ ...i, ...skuIndex.get(i.sku) })).filter(l => l.product);

function waLink(lines, total) {
  const t = translations[currentLang];
  const rows = lines.map((l, i) => {
    const size = l.product.variants.length > 1 ? ` (${l.variant.label})` : '';
    return `${i + 1}. ${l.product.brand} ${l.product.name}${size} × ${l.qty} - ${money(l.qty * l.variant.price)}`;
  });
  const text = [t.waText, '', ...rows, '', `${t.total}: ${money(total)}`].join('\n');
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

function renderCart() {
  const t = translations[currentLang];
  const lines = cartLines();
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.qty * l.variant.price, 0);

  cartCount.textContent = count;
  cartCount.hidden = !count;
  cartTitle.textContent = t.cartTitle + (count ? ` (${count})` : '');
  cartTotalLabel.textContent = t.total;
  cartTotalEl.textContent = money(total);
  checkoutBtn.textContent = t.checkout;
  checkoutBtn.classList.toggle('disabled', !lines.length);
  checkoutBtn.setAttribute('aria-disabled', String(!lines.length));
  checkoutBtn.href = lines.length ? waLink(lines, total) : '#';

  const emptyHtml = `
    <div class="cart-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <path d="M16 10a4 4 0 0 1-8 0"></path>
      </svg>
      <p>${t.empty}</p>
    </div>`;

  cartItemsEl.innerHTML = lines.length ? lines.map(l => `
    <div class="cart-item" data-sku="${esc(l.sku)}">
      <img class="cart-thumb" src="${esc(l.variant.image || l.product.image)}" alt="">
      <div class="cart-info">
        <p class="cart-brand">${esc(l.product.brand)}</p>
        <p class="cart-name">${esc(l.product.name)}</p>
        ${l.product.variants.length > 1 ? `<p class="cart-variant">${esc(l.variant.label)}</p>` : ''}
        <div class="qty">
          <button type="button" data-qty="-1" aria-label="Decrease quantity">−</button>
          <span>${l.qty}</span>
          <button type="button" data-qty="1" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="cart-line">
        <span class="cart-line-price">${money(l.qty * l.variant.price)}</span>
        <button type="button" class="cart-remove" data-remove>${t.remove}</button>
      </div>
    </div>`).join('') : emptyHtml;
}

let lastFocus = null;
function setCartOpen(open) {
  cartDrawer.classList.toggle('open', open);
  cartOverlay.classList.toggle('open', open);
  cartDrawer.setAttribute('aria-hidden', String(!open));
  cartToggle.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('no-scroll', open);
  if (open) {
    lastFocus = document.activeElement;
    requestAnimationFrame(() => cartClose.focus());
  } else if (lastFocus && lastFocus.focus) {
    lastFocus.focus();
  }
}

// ==========================================
// 7. Data Initialization
// ==========================================
async function loadCatalog() {
  try {
    // Explicitly fetching the updated catalog file
    const response = await fetch('catalog.json');
    if (!response.ok) throw new Error('Failed to load catalog data');
    const data = await response.json();

    currency = data.currency || 'MKD';
    products = data.products;
    const counts = new Map();
    products.forEach(p => {
      productById.set(p.id, p);
      p._s = norm([p.brand, p.name, ...(p.notes || []), ...p.variants.map(v => v.label).filter(l => l !== 'Original')].join(' '));
      p.variants.forEach(v => skuIndex.set(v.sku, { product: p, variant: v }));
      counts.set(p.brand, (counts.get(p.brand) || 0) + 1);
    });
    // Top 8 brands by number of products
    topBrands = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([brand]) => brand);

    cart = cart.filter(i => skuIndex.has(i.sku)); 
    saveCart();
    applyTranslation();
  } catch (error) {
    console.error('Data load error:', error);
    catalogEl.innerHTML = '<p class="no-results">Failed to load the catalog. Please refresh.</p>';
  }
}

// ==========================================
// 8. Event Listeners
// ==========================================
searchBar.addEventListener('input', () => {
  state.search = norm(searchBar.value);
  applyFilters();
});
searchBar.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchBar.blur(); });

brandChips.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-brand]');
  if (!chip) return;
  state.brand = chip.dataset.brand === state.brand ? 'all' : chip.dataset.brand;
  syncChips();
  applyFilters();
  chip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
});

genderRow.addEventListener('click', (e) => {
  const pill = e.target.closest('[data-value]');
  if (!pill) return;
  state.gender = pill.dataset.value;
  genderRow.querySelectorAll('[data-value]').forEach(p => p.classList.toggle('active', p === pill));
  applyFilters();
});

catalogEl.addEventListener('click', (e) => {
  const card = e.target.closest('.product-card');
  if (!card) return;
  const p = productById.get(card.dataset.id);
  
  const pill = e.target.closest('.variant-pill');
  if (pill) {
    state.selected[p.id] = pill.dataset.sku;
    updateCard(card, p);
    return;
  }
  
  const add = e.target.closest('[data-add]');
  if (add) {
    const v = selectedVariant(p);
    addToCart(v.sku);
    flashAdded(add);
    
    // Trigger toast notification
    const t = translations[currentLang];
    const variantStr = p.variants.length > 1 ? ` (${v.label})` : '';
    showToast(`${p.name}${variantStr} ${t.added.toLowerCase()}`);
  }
});

// Cart drawer UI events
cartToggle.addEventListener('click', () => setCartOpen(true));
cartClose.addEventListener('click', () => setCartOpen(false));
cartOverlay.addEventListener('click', () => setCartOpen(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && cartDrawer.classList.contains('open')) setCartOpen(false);
});
cartItemsEl.addEventListener('click', (e) => {
  const item = e.target.closest('.cart-item');
  if (!item) return;
  const qtyBtn = e.target.closest('[data-qty]');
  if (qtyBtn) changeQty(item.dataset.sku, Number(qtyBtn.dataset.qty));
  else if (e.target.closest('[data-remove]')) removeLine(item.dataset.sku);
});
checkoutBtn.addEventListener('click', (e) => { if (!cart.length) e.preventDefault(); });

if (scrollTopBtn) {
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('show-btn', window.scrollY > 300);
  });
  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ==========================================
// 9. Bootstrap Application
// ==========================================
window.addEventListener('load', hideLoader);
setTimeout(hideLoader, 3000);

loadCatalog();
