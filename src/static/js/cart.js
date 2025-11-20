// static/js/cart.js
// Carrito simple: agregar, eliminar, ver total
let cart = [];

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function loadCart() {
    const raw = localStorage.getItem("cart");
    if (raw) {
        try {
            cart = JSON.parse(raw);
        } catch (e) {
            cart = [];
        }
    }
}

// Si quieres persistencia en el futuro, puedes cargar desde localStorage
// cart = JSON.parse(localStorage.getItem('cart') || '[]');

function formatPrice(n) {
    // formatea 8000 -> 8.000
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    cartCount.textContent = cart.length;
    cartItems.innerHTML = '';

    let total = 0;

    cart.forEach((item, index) => {
        total += item.price * (item.qty || 1);

        const li = document.createElement('li');
        li.innerHTML = `
            <div>
               <div class="item-name">${item.name}</div>
               <div class="item-meta">x${item.qty || 1} • ${item.tag ? item.tag : ''}</div>
            </div>
            <div>
               <div class="item-price">$${formatPrice(item.price * (item.qty || 1))}</div>
               <button class="remove" data-index="${index}">Eliminar</button>
            </div>
        `;
        cartItems.appendChild(li);
    });

    cartTotal.textContent = formatPrice(total);

    // listeners para eliminar
    document.querySelectorAll('.remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.index);
            cart.splice(idx, 1);
            updateCartUI();
        });
    });
}

// añadir al carrito
document.addEventListener('click', function (e) {
    if (e.target && e.target.matches('.add-to-cart')) {
    const btn = e.target;
    
    if (!btn.dataset.name || !btn.dataset.price) {
        console.error("Botón sin name o price, revisa HTML");
        return;
    }

    const name = btn.dataset.name;
    const price = parseInt(btn.dataset.price, 10);
    const tag = btn.dataset.tag || '';

        // si quieres manejar cantidades, busca si ya existe y aumenta qty
        const existingIndex = cart.findIndex(it => it.name === name && it.tag === tag);
        if (existingIndex > -1) {
            cart[existingIndex].qty = (cart[existingIndex].qty || 1) + 1;
        } else {
            cart.push({ name, price, tag, qty: 1 });
        }

        saveCart();
        updateCartUI();
    }
});

// abrir/cerrar panel
document.addEventListener('DOMContentLoaded', function () {
     loadCart();
     updateCartUI();
    const cartIcon = document.getElementById('cart-icon');
    const cartPanel = document.getElementById('cart-panel');
    const closeBtn = document.getElementById('close-cart');
    const checkoutBtn = document.getElementById('checkout');
    
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            cartPanel.style.display = 'block';
            updateCartUI();
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => cartPanel.style.display = 'none');
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Tu carrito está vacío');
                return;
            }

            let text = 'Hola! Quiero realizar el siguiente pedido:%0A';

            cart.forEach(item => {
                text += `- ${item.name} x${item.qty} (${item.tag}) - $${formatPrice(item.price * item.qty)}%0A`;
            });

            text += `Total: $${formatPrice(cart.reduce((s, i) => s + i.price * i.qty, 0))}`;

            const url = 'https://wa.me/56912345678?text=' + encodeURIComponent(text);

            window.open(url, '_blank');

            // limpiar carrito
            cart = [];
            saveCart();
            updateCartUI();
            cartPanel.style.display = 'none';
        });
    }
});