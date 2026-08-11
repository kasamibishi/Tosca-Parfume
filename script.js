const catalogContainer = document.getElementById('catalog');
const searchBar = document.getElementById('search-bar');
const waNumber = "38978204889";

let catalogData = [];

const scrollTopBtn = document.getElementById('scroll-top-btn');
const loader = document.getElementById('page-loader');

function normalizeString(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function renderCatalog(items) {
  if (!catalogContainer) return;

  if (items.length === 0) {
    catalogContainer.innerHTML = '<p class="no-results" style="text-align: center; color: #cda434; padding: 20px;">No perfumes found.</p>';
    return;
  }

  const htmlString = items.map(item => {
    const text = `Përshëndetje! Dëshiroj të porosis: ${item.name} (${item.price}).`;
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

    return `
      <div class="product-card">
        <img src="${item.image}" alt="${item.name}" loading="lazy" class="product-img">
        <h3 class="product-name">${item.name}</h3>
        <p class="product-price">${item.price}</p>
        <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-order">Order Now</a>
      </div>
    `;
  }).join('');

  catalogContainer.innerHTML = htmlString;
}

async function loadCatalog() {
  try {
    const response = await fetch('catalog.json');
    if (!response.ok) throw new Error('Failed to load catalog data');
    
    catalogData = await response.json(); 
    renderCatalog(catalogData); 
  } catch (error) {
    console.error("Data load error:", error);
    if (catalogContainer) {
      catalogContainer.innerHTML = '<p class="error" style="text-align: center; color: red;">Failed to load the catalog. Please refresh.</p>';
    }
  }
}

// 1. Centralized State Object
const filterState = {
  search: '',
  gender: 'all',
  brand: 'all',
  maxPrice: 4500
};

// Function to dynamically build the brand dropdown
function populateBrandDropdown() {
  const brandSelect = document.getElementById('brand-select');
  if (!brandSelect) return;

  const uniqueBrands = new Set();

  catalogData.forEach(item => {
    // Strict data enforcement: If brand doesn't exist, flag it as 'Unknown'
    const brandName = item.brand ? item.brand.trim() : 'Unknown';
    uniqueBrands.add(brandName);
  });

  // Remove 'Unknown' from the filter list if it exists, so clients don't see your data entry errors
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

// 2. The Core Filtering Engine
function applyAllFilters() {
  const filtered = catalogData.filter(item => {
    // 1. Data Normalization: Extract numerical price (THIS IS WHAT YOU DELETED)
    const rawPriceStr = item.price.replace(/[^\d]/g, ''); 
    const priceNum = parseInt(rawPriceStr, 10);
    
    // 2. Strict Brand Check: Now pulling from your clean, normalized JSON
    const itemBrand = item.brand ? item.brand.toLowerCase() : "";

    // 3. Condition Checks
    const matchesSearch = filterState.search === '' || normalizeString(item.name).includes(filterState.search);
    const matchesGender = filterState.gender === 'all' || item.gender === filterState.gender;
    const matchesBrand = filterState.brand === 'all' || itemBrand === filterState.brand; 
    const matchesPrice = priceNum <= filterState.maxPrice;

    // Must pass ALL conditions to be rendered
    return matchesSearch && matchesGender && matchesBrand && matchesPrice;
  });

  renderCatalog(filtered);
}function applyAllFilters() {
  const filtered = catalogData.filter(item => {
    // 1. Data Normalization: Extract numerical price (THIS IS WHAT YOU DELETED)
    const rawPriceStr = item.price.replace(/[^\d]/g, ''); 
    const priceNum = parseInt(rawPriceStr, 10);
    
    // 2. Strict Brand Check: Now pulling from your clean, normalized JSON
    const itemBrand = item.brand ? item.brand.toLowerCase() : "";

    // 3. Condition Checks
    const matchesSearch = filterState.search === '' || normalizeString(item.name).includes(filterState.search);
    const matchesGender = filterState.gender === 'all' || item.gender === filterState.gender;
    const matchesBrand = filterState.brand === 'all' || itemBrand === filterState.brand; 
    const matchesPrice = priceNum <= filterState.maxPrice;

    // Must pass ALL conditions to be rendered
    return matchesSearch && matchesGender && matchesBrand && matchesPrice;
  });

  renderCatalog(filtered);
}

// 3. Search Bar Event (Debounced to protect CPU)
let searchTimeout;
if (searchBar) {
  searchBar.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      filterState.search = normalizeString(e.target.value);
      applyAllFilters();
    }, 300); // Waits 300ms after typing stops before rendering
  });
}

// 4. Quick Filter Pills Event
const filterPills = document.querySelectorAll('#quick-filters-container .filter-pill[data-key="gender"]');
filterPills.forEach(pill => {
  pill.addEventListener('click', (e) => {
    // Update UI
    filterPills.forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    
    // Update State & Re-render
    filterState.gender = e.target.getAttribute('data-value');
    applyAllFilters();
  });
});

// 5. Bottom Sheet UI Management
const btnOpenFilters = document.getElementById('btn-open-filters');
const btnCloseFilters = document.getElementById('btn-close-filters');
const filterOverlay = document.getElementById('filter-overlay');
const advancedFiltersSheet = document.getElementById('advanced-filters');
const priceSlider = document.getElementById('price-slider');
const priceDisplay = document.getElementById('price-display');
const brandSelect = document.getElementById('brand-select');
const btnApplyFilters = document.getElementById('btn-apply-filters');

function toggleSheet(show) {
  if (show) {
    filterOverlay.classList.remove('hidden');
    advancedFiltersSheet.classList.remove('hidden');
    // small delay to allow display:block to apply before animating transform
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
    }, 300); // Matches transition duration
  }
}

btnOpenFilters.addEventListener('click', () => toggleSheet(true));
btnCloseFilters.addEventListener('click', () => toggleSheet(false));
filterOverlay.addEventListener('click', () => toggleSheet(false));

// Update price display dynamically as user drags slider
priceSlider.addEventListener('input', (e) => {
  priceDisplay.textContent = `MKD ${e.target.value}`;
});

// 6. Apply Advanced Filters
btnApplyFilters.addEventListener('click', () => {
  filterState.brand = brandSelect.value;
  filterState.maxPrice = parseInt(priceSlider.value, 10);
  
  applyAllFilters();
  toggleSheet(false);
});

if (scrollTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('show-btn');
    } else {
      scrollTopBtn.classList.remove('show-btn');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

function hideLoader() {
  if (loader && !loader.classList.contains('hide-loader')) {
    loader.classList.add('hide-loader');
    
    setTimeout(() => {
      loader.style.display = 'none';
    }, 400); 
  }
}

const translations = {
  sq: {
    orderBtn: "Porosit Tani",
    waText: "Përshëndetje! Dëshiroj të porosis:",
    searchPlaceholder: "Kërko parfume dhe brende..."
  },
  mk: {
    orderBtn: "Нарачај",
    waText: "Здраво! Сакам да нарачам:",
    searchPlaceholder: "Пребарај парфеми и брендови..."
  },
  en: {
    orderBtn: "Order Now",
    waText: "Hello! I would like to order:",
    searchPlaceholder: "Search perfumes and brands..."
  }
};

// 2. State Management (Check if they visited before, default to Albanian)
let currentLang = localStorage.getItem('tosca_lang') || 'en';

// 3. Update the UI instantly
function applyTranslation() {
  const t = translations[currentLang];
  
  // Update Search Bar Placeholder
  if (searchBar) {
    searchBar.placeholder = t.searchPlaceholder;
  }

  // Update active button styling
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.lang === currentLang) {
      btn.classList.add('active');
    }
  });

  if (catalogData.length > 0) {
    applyAllFilters();
  }
}

// 4. Update your existing renderCatalog function to use the dictionary
function renderCatalog(items) {
  if (!catalogContainer) return;
  const t = translations[currentLang]; // Pull correct language

  if (items.length === 0) {
    catalogContainer.innerHTML = '<p class="no-results" style="text-align: center; color: #cda434; padding: 20px;">No results.</p>';
    return;
  }

  const htmlString = items.map(item => {
    // Inject the translated WhatsApp text
    const text = `${t.waText} ${item.name} (${item.price}).`;
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

    return `
      <div class="product-card">
        <img src="${item.image}" alt="${item.name}" loading="lazy" class="product-img">
        <h3 class="product-name">${item.name}</h3>
        <p class="product-price">${item.price}</p>
        <!-- Inject the translated Button text -->
        <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-order">${t.orderBtn}</a>
      </div>
    `;
  }).join('');

  catalogContainer.innerHTML = htmlString;
}

// 5. Language Switcher Event Listeners
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    currentLang = e.target.dataset.lang;
    localStorage.setItem('tosca_lang', currentLang); // Save to browser
    applyTranslation(); // Execute UI update
  });
});

// Run this once when the page loads to set the initial state
applyTranslation();

window.addEventListener('load', hideLoader);
setTimeout(hideLoader, 3000); 

loadCatalog();

async function loadCatalog() {
  try {
    const response = await fetch('catalog.json');
    if (!response.ok) throw new Error('Failed to load catalog data');
    
    catalogData = await response.json(); 
    
    // BUILD THE DROPDOWN AUTOMATICALLY HERE
    populateBrandDropdown(); 
    
    renderCatalog(catalogData); 
  } catch (error) {
    console.error("Data load error:", error);
    if (catalogContainer) {
      catalogContainer.innerHTML = '<p class="error" style="text-align: center; color: red;">Failed to load the catalog. Please refresh.</p>';
    }
  }
}