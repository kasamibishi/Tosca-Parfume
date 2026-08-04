const catalogContainer = document.getElementById('catalog');
const searchBar = document.getElementById('search-bar');
const waNumber = "38978204889";

let catalogData = [];

const menuIcon = document.getElementById('menu-icon');
const mobileMenu = document.getElementById('mobile-menu');
const closeMenuBtn = document.getElementById('close-menu');
const menuOverlay = document.getElementById('menu-overlay');
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

if (searchBar) {
  searchBar.addEventListener('input', (e) => {
    const searchTerm = normalizeString(e.target.value);
    
    const filteredCatalog = catalogData.filter(item => {
      const normalizedProductName = normalizeString(item.name);
      return normalizedProductName.includes(searchTerm);
    });

    renderCatalog(filteredCatalog);
  });
}

function closeMenu() {
  if (mobileMenu && menuOverlay) {
    mobileMenu.classList.remove('open-menu');
    menuOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

if (menuIcon && mobileMenu && menuOverlay) {
  menuIcon.addEventListener('click', () => {
    mobileMenu.classList.add('open-menu');
    menuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
  
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
  menuOverlay.addEventListener('click', closeMenu);
}

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

  // Re-render the catalog so the buttons and WhatsApp links update
  if (catalogData.length > 0) {
    // If there is an active search, respect it during re-render
    const searchTerm = normalizeString(searchBar ? searchBar.value : '');
    if (searchTerm) {
      const filtered = catalogData.filter(item => normalizeString(item.name).includes(searchTerm));
      renderCatalog(filtered);
    } else {
      renderCatalog(catalogData);
    }
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