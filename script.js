function normalizeString(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const searchBar = document.getElementById('search-bar');
const productCards = document.querySelectorAll('.product-card');

searchBar.addEventListener('input', (e) => {
    
    const searchQuery = normalizeString(e.target.value);

    productCards.forEach(card => {
        const productName = card.querySelector('.product-name').textContent;
        
        const normalizedProductName = normalizeString(productName);

        if (normalizedProductName.includes(searchQuery)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

function generateWhatsAppLink(phoneNumber, productName, price) {
    const text = `Përshëndetje! Dëshiroj të porosis: ${productName} (${price} MKD).`;
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
}

const menuIcon = document.getElementById('menu-icon');
const mobileMenu = document.getElementById('mobile-menu');
const closeMenuBtn = document.getElementById('close-menu');
const menuOverlay = document.getElementById('menu-overlay');

menuIcon.addEventListener('click', () => {
    mobileMenu.classList.add('open-menu');
    menuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
});

function closeMenu() {
    mobileMenu.classList.remove('open-menu');
    menuOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

closeMenuBtn.addEventListener('click', closeMenu);
menuOverlay.addEventListener('click', closeMenu);

const scrollTopBtn = document.getElementById('scroll-top-btn');

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