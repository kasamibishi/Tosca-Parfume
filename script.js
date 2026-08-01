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