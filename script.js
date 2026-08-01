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

const searchBar = document.getElementById('search-bar');
const productCards = document.querySelectorAll('.product-card');
const waBtn = document.getElementById('wa-btn');
const waText = document.getElementById('wa-text');
const phoneNumber = '38975275325'; 

// 1. Existing Search Logic
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

// 2. WhatsApp Generation Logic
function generateWhatsAppLink(phone, name, price) {
    // Note: The price variable already includes "MKD" from your HTML.
    const text = `Përshëndetje! Dëshiroj të porosis: ${name} (${price}).`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

// 3. Card Click Logic
productCards.forEach(card => {
    card.addEventListener('click', () => {
        // Remove highlight from all cards, add to the clicked one
        productCards.forEach(c => c.classList.remove('selected-card'));
        card.classList.add('selected-card');

        // Extract data
        const productName = card.querySelector('.product-name').innerText;
        const productPrice = card.querySelector('.product-price').innerText;

        // Update the button URL
        waBtn.href = generateWhatsAppLink(phoneNumber, productName, productPrice);
        
        // Update the button text and expand it
        waText.innerText = `Porosit ${productName}`;
        waBtn.classList.add('active-order');
    });
});