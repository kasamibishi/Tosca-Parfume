// ==========================================
// 1. DOM Elements & Application State
// ==========================================
const catalogContainer = document.getElementById('catalog');
const searchBar = document.getElementById('search-bar');
const scrollTopBtn = document.getElementById('scroll-top-btn');
const loader = document.getElementById('page-loader');
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
  sq: { orderBtn: "Porosit Tani", waText: "Përshëndetje! Dëshiroj të porosis:", searchPlaceholder: "Kërko parfume dhe brende..." },
  mk: { orderBtn: "Нарачај", waText: "Здраво! Сакам да нарачам:", searchPlaceholder: "Пребарај парфеми и брендови..." },
  en: { orderBtn: "Order Now", waText: "Hello! I would like to order:", searchPlaceholder: "Search perfumes and brands..." }
};

let currentLang = localStorage.getItem('tosca_lang') || 'en';

function applyTranslation() {
  const t = translations[currentLang];
  
  if (searchBar) searchBar.placeholder = t.searchPlaceholder;
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.lang === currentLang) btn.classList.add('active');
  });

  if (catalogData.length > 0) applyAllFilters();
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    currentLang = e.target.dataset.lang;
    localStorage.setItem('tosca_lang', currentLang);
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
  
  brandSelect.innerHTML = '<option value="all">All Brands</option>'; 
  sortedBrands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand.toLowerCase();
    option.textContent = brand;
    brandSelect.appendChild(option);
  });
}

function renderCatalog(items) {
  if (!catalogContainer) return;
  const t = translations[currentLang]; 

  if (items.length === 0) {
    catalogContainer.innerHTML = '<p class="no-results" style="text-align: center; color: #cda434; padding: 20px;">No results.</p>';
    return;
  }

  const htmlString = items.map(item => {
    const text = `${t.waText} ${item.name} (${item.price}).`;
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

    return `
      <div class="product-card">
        <img src="${item.image}" alt="${item.name}" loading="lazy" class="product-img">
        <h3 class="product-name">${item.name}</h3>
        <p class="product-price">${item.price}</p>
        <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-order">${t.orderBtn}</a>
      </div>
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

    const matchesSearch = filterState.search === '' || normalizeString(item.name).includes(filterState.search);
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
      catalogContainer.innerHTML = '<p class="error" style="text-align: center; color: red;">Failed to load the catalog. Please refresh.</p>';
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

function toggleSheet(show) {
  if (!filterOverlay || !advancedFiltersSheet) return;
  if (show) {
    filterOverlay.classList.remove('hidden');
    advancedFiltersSheet.classList.remove('hidden');
    setTimeout(() => {
      filterOverlay.classList.add('active');
      advancedFiltersSheet.classList.add('open');
    }, 10);
  } else {
    filterOverlay.classList.remove('active');
    advancedFiltersSheet.classList.remove('open');
    setTimeout(() => {
      filterOverlay.classList.add('hidden');
      advancedFiltersSheet.classList.add('hidden');
    }, 300); 
  }
}

if (btnOpenFilters) btnOpenFilters.addEventListener('click', () => toggleSheet(true));
if (btnCloseFilters) btnCloseFilters.addEventListener('click', () => toggleSheet(false));
if (filterOverlay) filterOverlay.addEventListener('click', () => toggleSheet(false));

if (priceSlider && priceDisplay) {
  priceSlider.addEventListener('input', (e) => {
    priceDisplay.textContent = `MKD ${e.target.value}`;
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