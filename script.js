// ==========================================
// 1. DOM Elements & Application State
// ==========================================
const catalogContainer = document.getElementById('catalog');
const searchBar = document.getElementById('search-bar');
const scrollTopBtn = document.getElementById('scroll-top-btn');
const loader = document.getElementById('page-loader');
const resultCount = document.getElementById('result-count');
const waNumber = "38978204889";

const btnOpenFilters = document.getElementById('btn-open-filters');
const btnCloseFilters = document.getElementById('btn-close-filters');
const filterOverlay = document.getElementById('filter-overlay');
const advancedFiltersSheet = document.getElementById('advanced-filters');
const priceSlider = document.getElementById('price-slider');
const priceDisplay = document.getElementById('price-display');
const brandSelect = document.getElementById('brand-select');
const sortSelect = document.getElementById('sort-select');
const btnApplyFilters = document.getElementById('btn-apply-filters');
const filterPills = document.querySelectorAll('#quick-filters-container .filter-pill[data-key="gender"]');

let catalogData = [];

const filterState = {
  search: '',
  gender: 'all',
  brand: 'all',
  maxPrice: 4500,
  sortBy: 'default'
};

// ==========================================
// 2. Localization Engine
// ==========================================
const translations = {
  sq: {
    orderBtn: "Porosit tani", waText: "Përshëndetje! Dëshiroj të porosis:",
    searchPlaceholder: "Kërko parfume dhe marka", searchLabel: "Kërko parfume dhe marka",
    all: "Të gjitha", men: "Meshkuj", women: "Femra", unisex: "Unisex", filters: "Filtra",
    advTitle: "Filtra të avancuar", brand: "Marka", allBrands: "Të gjitha markat",
    maxPrice: "Çmimi maksimal", sortBy: "Rendit sipas",
    sortDefault: "Parazgjedhur (më të rejat)", sortAsc: "Çmimi: nga më i ulëti", sortDesc: "Çmimi: nga më i larti",
    apply: "Apliko filtrat", noResults: "Nuk u gjet asnjë parfum.",
    count: n => n === 1 ? "1 parfum" : `${n} parfume`
  },
  mk: {
    orderBtn: "Нарачај", waText: "Здраво! Сакам да нарачам:",
    searchPlaceholder: "Пребарај парфеми и брендови", searchLabel: "Пребарај парфеми и брендови",
    all: "Сите", men: "Мажи", women: "Жени", unisex: "Унисекс", filters: "Филтри",
    advTitle: "Напредни филтри", brand: "Бренд", allBrands: "Сите брендови",
    maxPrice: "Максимална цена", sortBy: "Подреди по",
    sortDefault: "Стандардно (најнови)", sortAsc: "Цена: од пониска кон повисока", sortDesc: "Цена: од повисока кон пониска",
    apply: "Примени филтри", noResults: "Не е пронајден парфем.",
    count: n => n === 1 ? "1 парфем" : `${n} парфеми`
  },
  en: {
    orderBtn: "Order now", waText: "Hello! I would like to order:",
    searchPlaceholder: "Search perfumes and brands", searchLabel: "Search perfumes and brands",
    all: "All", men: "Men", women: "Women", unisex: "Unisex", filters: "Filters",
    advTitle: "Advanced filters", brand: "Brand", allBrands: "All brands",
    maxPrice: "Max price", sortBy: "Sort by",
    sortDefault: "Default (newest)", sortAsc: "Price: low to high", sortDesc: "Price: high to low",
    apply: "Apply filters", noResults: "No perfumes found.",
    count: n => n === 1 ? "1 fragrance" : `${n} fragrances`
  }
};

const validLangs = Object.keys(translations);
let storedLang = null;
try { storedLang = localStorage.getItem('tosca_lang'); } catch (e) {}
let currentLang = validLangs.includes(storedLang) ? storedLang : 'en';

function applyTranslation() {
  const t = translations[currentLang];

  document.documentElement.lang = currentLang === 'sq' ? 'sq' : currentLang === 'mk' ? 'mk' : 'en';
  if (searchBar) searchBar.placeholder = t.searchPlaceholder;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const value = t[el.dataset.i18n];
    if (typeof value === 'string') el.textContent = value;
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    const isActive = btn.dataset.lang === currentLang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });

  if (catalogData.length > 0) {
    populateBrandDropdown();
    applyAllFilters();
  }
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    currentLang = e.currentTarget.dataset.lang;
    try { localStorage.setItem('tosca_lang', currentLang); } catch (err) {}
    applyTranslation();
  });
});

// ==========================================
// 3. Utility Functions
// ==========================================
function normalizeString(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function hideLoader() {
  if (loader && !loader.classList.contains('hide-loader')) {
    loader.classList.add('hide-loader');
    setTimeout(() => { loader.style.display = 'none'; }, 400); 
  }
}

// ==========================================
// 4. UI Builders
// ==========================================
function populateBrandDropdown() {
  if (!brandSelect) return;
  const uniqueBrands = new Set();
  
  catalogData.forEach(item => {
    const brandName = item.brand ? item.brand.trim() : 'Unknown';
    uniqueBrands.add(brandName);
  });
  
  uniqueBrands.delete('Unknown');
  const sortedBrands = Array.from(uniqueBrands).sort();
  
  const previous = brandSelect.value || 'all';
  brandSelect.innerHTML = '';
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = translations[currentLang].allBrands;
  brandSelect.appendChild(allOption);
  sortedBrands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand.toLowerCase();
    option.textContent = brand;
    brandSelect.appendChild(option);
  });
  brandSelect.value = previous;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Catalog names are entered as "Name - Brand" or "Brand - Name". For display,
// drop the brand part (it is shown on its own line) and keep the WhatsApp text untouched.
const brandAliases = ['yessaintlaurent', 'boss', 'xejroff', 'mansionfranciskurkdjianparis', 'myburberry'];

function displayTitle(item) {
  const brandKey = normalizeString(item.brand || '');
  const parts = item.name.split(/\s*-\s*/).filter(Boolean);
  const kept = parts.filter(p => {
    const key = normalizeString(p);
    return key !== brandKey && !brandAliases.includes(key);
  });
  return kept.length ? kept.join(' – ') : item.name;
}

function formatPrice(price) {
  return price.replace(/^MKD\s*/i, 'MKD ');
}

function renderCatalog(items) {
  if (!catalogContainer) return;
  const t = translations[currentLang]; 

  if (resultCount) resultCount.textContent = t.count(items.length);

  if (items.length === 0) {
    catalogContainer.innerHTML = `<p class="empty-state">${t.noResults}</p>`;
    return;
  }

  const htmlString = items.map(item => {
    const text = `${t.waText} ${item.name} (${item.price}).`;
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
    const title = escapeHtml(displayTitle(item));
    const brand = item.brand ? `<p class="product-brand">${escapeHtml(item.brand)}</p>` : '';

    return `
      <article class="product-card">
        <div class="product-img-wrap">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" class="product-img">
        </div>
        <div class="product-info">
          <h3 class="product-name">${title}</h3>
          ${brand}
          <p class="product-price">${escapeHtml(formatPrice(item.price))}</p>
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-order">${t.orderBtn}</a>
        </div>
      </article>
    `;
  }).join('');

  catalogContainer.innerHTML = htmlString;
}

// ==========================================
// 5. Filtering & Sorting Engine
// ==========================================
function applyAllFilters() {
  // 1. Filter out items
  let filtered = catalogData.filter(item => {
    const rawPriceStr = item.price.replace(/[^\d]/g, ''); 
    const priceNum = parseInt(rawPriceStr, 10);
    const itemBrand = item.brand ? item.brand.toLowerCase() : "";

    const matchesSearch = filterState.search === '' ||
      normalizeString(`${item.name} ${item.brand || ''}`).includes(filterState.search);
    const matchesGender = filterState.gender === 'all' || item.gender === filterState.gender;
    const matchesBrand = filterState.brand === 'all' || itemBrand === filterState.brand; 
    const matchesPrice = priceNum <= filterState.maxPrice;

    return matchesSearch && matchesGender && matchesBrand && matchesPrice;
  });

  // 2. Sort remaining items
  if (filterState.sortBy === 'price-asc') {
    filtered.sort((a, b) => {
      const priceA = parseInt(a.price.replace(/[^\d]/g, ''), 10);
      const priceB = parseInt(b.price.replace(/[^\d]/g, ''), 10);
      return priceA - priceB;
    });
  } else if (filterState.sortBy === 'price-desc') {
    filtered.sort((a, b) => {
      const priceA = parseInt(a.price.replace(/[^\d]/g, ''), 10);
      const priceB = parseInt(b.price.replace(/[^\d]/g, ''), 10);
      return priceB - priceA; 
    });
  }

  // 3. Render
  renderCatalog(filtered);
}

// ==========================================
// 6. Data Initialization
// ==========================================
async function loadCatalog() {
  try {
    const response = await fetch('catalog.json');
    if (!response.ok) throw new Error('Failed to load catalog data');
    
    catalogData = await response.json(); 
    
    populateBrandDropdown(); 
    applyTranslation(); 
  } catch (error) {
    console.error("Data load error:", error);
    if (catalogContainer) {
      catalogContainer.innerHTML = '<p class="empty-state error">Could not load the catalog. Check your connection and refresh the page.</p>';
    }
  }
}

// ==========================================
// 7. Event Listeners (UI Interactions)
// ==========================================
let searchTimeout;
if (searchBar) {
  searchBar.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      filterState.search = normalizeString(e.target.value);
      applyAllFilters();
    }, 300); 
  });
}

if (filterPills) {
  filterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      filterPills.forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      
      filterState.gender = e.target.getAttribute('data-value');
      applyAllFilters();
    });
  });
}

let sheetTimer;
function toggleSheet(show) {
  if (!filterOverlay || !advancedFiltersSheet) return;
  clearTimeout(sheetTimer);
  if (show) {
    filterOverlay.classList.remove('hidden');
    advancedFiltersSheet.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      filterOverlay.classList.add('active');
      advancedFiltersSheet.classList.add('open');
      btnCloseFilters.focus();
    }));
  } else {
    filterOverlay.classList.remove('active');
    advancedFiltersSheet.classList.remove('open');
    sheetTimer = setTimeout(() => {
      filterOverlay.classList.add('hidden');
      advancedFiltersSheet.classList.add('hidden');
    }, 300);
    btnOpenFilters.focus();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && advancedFiltersSheet && advancedFiltersSheet.classList.contains('open')) toggleSheet(false);
});

if (btnOpenFilters) btnOpenFilters.addEventListener('click', () => toggleSheet(true));
if (btnCloseFilters) btnCloseFilters.addEventListener('click', () => toggleSheet(false));
if (filterOverlay) filterOverlay.addEventListener('click', () => toggleSheet(false));

if (priceSlider && priceDisplay) {
  priceSlider.addEventListener('input', (e) => {
    priceDisplay.textContent = `MKD ${Number(e.target.value).toLocaleString('en-US')}`;
  });
}

if (btnApplyFilters && brandSelect && priceSlider && sortSelect) {
  btnApplyFilters.addEventListener('click', () => {
    filterState.brand = brandSelect.value;
    filterState.maxPrice = parseInt(priceSlider.value, 10);
    filterState.sortBy = sortSelect.value; 
    
    applyAllFilters();
    toggleSheet(false);
  });
}

if (scrollTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) scrollTopBtn.classList.add('show-btn');
    else scrollTopBtn.classList.remove('show-btn');
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ==========================================
// 8. Bootstrap Application
// ==========================================
window.addEventListener('load', hideLoader);
setTimeout(hideLoader, 3000); 

loadCatalog();