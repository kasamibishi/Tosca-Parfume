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