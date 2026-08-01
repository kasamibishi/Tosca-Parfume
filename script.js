const searchBar = document.getElementById('search-bar');
const productCards = document.querySelectorAll('.product-card');

searchBar.addEventListener('input', (e) => {
    const searchQuery = e.target.value.toLowerCase();

    productCards.forEach(card => {
        const productText = card.textContent.toLowerCase();

        if (productText.includes(searchQuery)) {
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

// Open Menu
menuIcon.addEventListener('click', () => {
    mobileMenu.classList.add('open-menu');
    menuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevents background scrolling
});

// Close Menu Function
function closeMenu() {
    mobileMenu.classList.remove('open-menu');
    menuOverlay.classList.remove('active');
    document.body.style.overflow = 'auto'; // Restores scrolling
}

closeMenuBtn.addEventListener('click', closeMenu);
menuOverlay.addEventListener('click', closeMenu);