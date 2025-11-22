// Cart functionality con efectos profesionales
let cart = [];

function formatPrice(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Efecto de confetti al agregar producto
function createConfetti(button) {
    const colors = ['#ff6bcb', '#ff8fd4', '#c084fc', '#ffc0e8'];
    for (let i = 0; i < 15; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 8px;
            height: 8px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
        `;
        
        const rect = button.getBoundingClientRect();
        confetti.style.left = rect.left + rect.width / 2 + 'px';
        confetti.style.top = rect.top + rect.height / 2 + 'px';
        
        document.body.appendChild(confetti);
        
        const angle = (Math.PI * 2 * i) / 15;
        const velocity = 100 + Math.random() * 100;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        let x = 0, y = 0, opacity = 1;
        const animation = setInterval(() => {
            x += vx * 0.016;
            y += vy * 0.016 + 200 * 0.016;
            opacity -= 0.02;
            
            confetti.style.transform = `translate(${x}px, ${y}px)`;
            confetti.style.opacity = opacity;
            
            if (opacity <= 0) {
                clearInterval(animation);
                confetti.remove();
            }
        }, 16);
    }
}

// Notificación toast elegante
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };
    
    const colors = {
        success: 'linear-gradient(135deg, #10b981, #059669)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)',
        info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        background: ${colors[type]};
        color: white;
        padding: 18px 28px;
        border-radius: 50px;
        box-shadow: 0 15px 45px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    toast.innerHTML = `
        <span style="font-size: 24px;">${icons[type]}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Añadir estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    // Animación del contador
    const newCount = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.style.transform = 'scale(1.3)';
    setTimeout(() => {
        cartCount.textContent = newCount;
        cartCount.style.transform = 'scale(1)';
    }, 150);
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <p style="font-size: 1.1rem; font-weight: 500;">Tu carrito está vacío</p>
                <p style="color: #9ca3af; margin-top: 10px;">¡Agrega productos hermosos!</p>
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
            li.style.animation = 'fadeInUp 0.4s ease backwards';
            li.style.animationDelay = `${index * 0.1}s`;
            li.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-meta">Cantidad: ${item.qty} • ${item.tag}</div>
                    <button class="remove-btn" data-index="${index}">
                        🗑️ Eliminar
                    </button>
                </div>
                <div class="cart-item-price">$${formatPrice(item.price * item.qty)}</div>
            `;
            cartItems.appendChild(li);
        });

        // Animación del total
        cartTotal.style.transform = 'scale(1.1)';
        setTimeout(() => {
            cartTotal.textContent = formatPrice(total);
            cartTotal.style.transform = 'scale(1)';
        }, 150);
    }

    // Listeners para eliminar
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.index);
            const item = cart[idx];
            cart.splice(idx, 1);
            updateCartUI();
            showToast(`${item.name} eliminado del carrito`, 'info');
        });
    });
}

// Agregar al carrito con efectos
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
        createConfetti(btn);
        showToast(`${name} agregado al carrito! ✨`, 'success');

        // Feedback visual en el botón
        const originalHTML = btn.innerHTML;
        const originalBg = btn.style.background;
        
        btn.innerHTML = '✓ Agregado!';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        btn.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = originalBg;
            btn.style.transform = 'scale(1)';
        }, 1500);
    }
});

// Controles del carrito
document.addEventListener('DOMContentLoaded', function() {
    // Loader de página
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = '<div class="loader-gem">💎</div>';
    document.body.insertBefore(loader, document.body.firstChild);

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
        closeBtn.addEventListener('click', () => {
            cartPanel.style.animation = 'slideOut 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            setTimeout(() => {
                cartPanel.style.display = 'none';
                cartPanel.style.animation = '';
            }, 400);
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showToast('Tu carrito está vacío', 'error');
                return;
            }

            let text = '¡Hola! 💎 Quiero realizar el siguiente pedido:%0A%0A';

            cart.forEach(item => {
                text += `✨ *${item.name}*%0A`;
                text += `   Cantidad: ${item.qty}%0A`;
                text += `   Categoría: ${item.tag}%0A`;
                text += `   Precio: $${formatPrice(item.price * item.qty)}%0A%0A`;
            });

            const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
            text += `━━━━━━━━━━━━━━━━%0A`;
            text += `💰 *TOTAL: $${formatPrice(total)}*%0A%0A`;
            text += `¡Gracias! 🌸`;

            const url = 'https://wa.me/56912345678?text=' + text;
            window.open(url, '_blank');

            showToast('Redirigiendo a WhatsApp... 📱', 'success');

            // Limpiar carrito
            cart = [];
            updateCartUI();
            
            setTimeout(() => {
                cartPanel.style.display = 'none';
            }, 1500);
        });
    }

    // Efecto scroll navbar
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });

    // Smooth scroll
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

    // Animación de entrada para elementos
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.product-card, .feature, .stat-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });
});

// Animación slideOut para el panel
const slideOutStyle = document.createElement('style');
slideOutStyle.textContent = `
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(slideOutStyle);