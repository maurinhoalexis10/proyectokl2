// Cart functionality
let cart = [];

function formatPrice(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    // Update cart count
    cartCount.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
    
    // Check if cart is empty
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        cartTotal.textContent = '0';
    } else {
        cartItems.innerHTML = '';
        let total = 0;

        cart.forEach((item, index) => {
            total += item.price * item.qty;
            const li = document.createElement('li');
            li.className = 'cart-item';
            li.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-meta">x${item.qty} • ${item.tag}</div>
                    <button class="remove-btn" data-index="${index}">Eliminar</button>
                </div>
                <div class="cart-item-price">$${formatPrice(item.price * item.qty)}</div>
            `;
            cartItems.appendChild(li);
        });

        cartTotal.textContent = formatPrice(total);
    }

    // Add remove listeners
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.index);
            cart.splice(idx, 1);
            updateCartUI();
        });
    });
}

// Add to cart
document.addEventListener('click', function(e) {
    if (e.target && e.target.closest('.add-to-cart')) {
        const btn = e.target.closest('.add-to-cart');
        const name = btn.dataset.name;
        const price = parseInt(btn.dataset.price, 10);
        const tag = btn.dataset.tag || '';

        const existingIndex = cart.findIndex(it => it.name === name && it.tag === tag);
        if (existingIndex > -1) {
            cart[existingIndex].qty = (cart[existingIndex].qty || 1) + 1;
        } else {
            cart.push({ name, price, tag, qty: 1 });
        }

        updateCartUI();

        // Visual feedback
        const originalText = btn.innerHTML;
        btn.textContent = '✓ Agregado';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 1500);
    }
});

// Cart panel controls
document.addEventListener('DOMContentLoaded', function() {
    const cartIcon = document.getElementById('cart-icon');
    const cartPanel = document.getElementById('cart-panel');
    const closeBtn = document.getElementById('close-cart');
    const checkoutBtn = document.getElementById('checkout');

    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            cartPanel.style.display = 'block';
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            cartPanel.style.display = 'none';
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Tu carrito está vacío');
                return;
            }

            let text = 'Hola! Quiero realizar el siguiente pedido:%0A%0A';

            cart.forEach(item => {
                text += `✨ ${item.name} x${item.qty} (${item.tag}) - $${formatPrice(item.price * item.qty)}%0A`;
            });

            const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
            text += `%0A💎 Total: $${formatPrice(total)}`;

            const url = 'https://wa.me/56912345678?text=' + text;
            window.open(url, '_blank');

            // Clear cart
            cart = [];
            updateCartUI();
            cartPanel.style.display = 'none';
        });
    }

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});