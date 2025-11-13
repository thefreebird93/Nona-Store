

/* --- safety helpers inserted automatically ---
   safeGet(key) -> returns parsed JSON from localStorage or null safely
   sanitizeAndSet(key, obj) -> removes sensitive props (password, token) before storing
   safeSetHTML(el, html) -> removes any <script> tags before setting innerHTML
*/
function safeGet(key){
  try{
    var v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  }catch(e){
    console.error('safeGet parse error for', key, e);
    return null;
  }
}
function sanitizeAndSet(key, obj){
  try{
    if(obj && typeof obj === 'object'){
      var copy = JSON.parse(JSON.stringify(obj));
      if(copy.password) delete copy.password;
      if(copy.token) {
        // for client-only demo, don't store raw tokens; remove or shorten
        delete copy.token;
      }
      localStorage.setItem(key, JSON.stringify(copy));
    } else {
      localStorage.setItem(key, JSON.stringify(obj));
    }
  }catch(e){
    console.error('sanitizeAndSet error', e);
  }
}
function safeSetHTML(el, html){
  try{
    if(!el) return;
    // basic sanitize: remove script tags
    var clean = String(html).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    // if el is a selector string, try to resolve it
    try{
      if(typeof el === 'string'){
        var resolved = document.querySelector(el);
        if(resolved) resolved.innerHTML = clean;
        return;
      }
    }catch(e){}
    // otherwise assume element
    if(el && el.innerHTML !== undefined){
      el.innerHTML = clean;
    }
  }catch(e){
    console.error('safeSetHTML error', e);
  }
}
/* --- end helpers --- */


// Enhanced Cart Manager
class CartManager {
    constructor() {
        this.cart = [];
        this.init();
    }

    init() {
        this.loadCart();
        this.setupEventListeners();
        this.updateCartUI();
        this.createCartSidebar();
    }

    loadCart() {
        try {
            const cartData = localStorage.getItem('nonaBeautyCart');
            if (cartData) {
                this.cart = JSON.parse(cartData);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
        }
    }

    saveCart() {
        sanitizeAndSet('nonaBeautyCart', this.cart);
    }

    setupEventListeners() {
        // Cart icon click
        const cartIcon = document.getElementById('cartIcon');
        if (cartIcon) {
            cartIcon.addEventListener('click', () => {
                this.toggleCartSidebar();
            });
        }

        // Close cart when clicking overlay
        document.addEventListener('click', (e) => {
            const cartSidebar = document.getElementById('cartSidebar');
            const cartIcon = document.getElementById('cartIcon');
            
            if (cartSidebar && cartSidebar.classList.contains('open') && 
                !cartSidebar.contains(e.target) && 
                !cartIcon.contains(e.target)) {
                this.closeCartSidebar();
            }
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCartSidebar();
            }
        });
    }

    createCartSidebar() {
        // Create cart sidebar HTML if it doesn't exist
        if (!document.getElementById('cartSidebar')) {
            const cartSidebar = document.createElement('div');
            cartSidebar.id = 'cartSidebar';
            cartSidebar.className = 'cart-sidebar';
            safeSetHTML(cartSidebar, this.getCartSidebarHTML());
            
            const overlay = document.createElement('div');
            overlay.id = 'overlay';
            overlay.className = 'overlay';
            
            document.body.appendChild(cartSidebar);
            document.body.appendChild(overlay);
            
            this.setupCartSidebarEvents();
        }
    }

    getCartSidebarHTML() {
        return `
            <div class="cart-header">
                <h3>Your Cart</h3>
                <button class="close-cart">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="cart-body">
                <div id="emptyCart" class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <a href="products.html" class="btn btn-primary">Start Shopping</a>
                </div>
                <div id="cartItems" class="cart-items" style="display: none;"></div>
            </div>
            <div class="cart-footer">
                <div class="cart-total">
                    <span>Total:</span>
                    <span id="cartTotal">$0.00</span>
                </div>
                <button id="checkoutBtn" class="btn btn-primary btn-full">
                    Proceed to Checkout
                </button>
                <a href="products.html" class="btn btn-outline btn-full">
                    Continue Shopping
                </a>
            </div>
        `;
    }

    setupCartSidebarEvents() {
        // Close cart button
        const closeCartBtn = document.querySelector('.close-cart');
        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', () => {
                this.closeCartSidebar();
            });
        }

        // Overlay click
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeCartSidebar();
            });
        }

        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.proceedToCheckout();
            });
        }
    }

    addToCart(product, quantity = 1) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                ...product,
                quantity: quantity,
                addedAt: new Date().toISOString()
            });
        }
        
        this.saveCart();
        this.updateCartUI();
        this.showNotification(`${product.name} added to cart!`, 'success');
        
        // Open cart sidebar when adding items
        if (this.cart.length === 1) {
            this.toggleCartSidebar();
        }
    }

    removeFromCart(productId) {
        const product = this.cart.find(item => item.id === productId);
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
        this.showNotification(`${product?.name || 'Product'} removed from cart`, 'info');
    }

    updateQuantity(productId, newQuantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = newQuantity;
                this.saveCart();
                this.updateCartUI();
            }
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartUI();
        this.showNotification('Cart cleared', 'info');
    }

    updateCartUI() {
        this.updateCartCount();
        this.updateCartSidebar();
        
        // Update main app if exists
        if (window.nonaBeautyApp) {
            window.nonaBeautyApp.updateCartUI();
        }
    }

    updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = this.getCartItemsCount();
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    updateCartSidebar() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        const emptyCart = document.getElementById('emptyCart');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (!cartItems) return;

        if (this.cart.length === 0) {
            if (emptyCart) emptyCart.style.display = 'flex';
            if (cartItems) cartItems.style.display = 'none';
            if (cartTotal) cartTotal.textContent = '$0.00';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        if (emptyCart) emptyCart.style.display = 'none';
        if (cartItems) cartItems.style.display = 'block';
        if (checkoutBtn) checkoutBtn.disabled = false;

        // Update cart items
        safeSetHTML(cartItems, this.cart.map(item => this.createCartItemHTML(item)).join(''));

        // Update total
        if (cartTotal) {
            cartTotal.textContent = this.formatPrice(this.calculateTotal());
        }

        // Attach event listeners to cart items
        this.attachCartItemEventListeners();
    }

    createCartItemHTML(item) {
        const originalPrice = item.originalPrice ? `
            <div class="item-original-price">${this.formatPrice(item.originalPrice)}</div>
        ` : '';

        const discount = item.discount ? `
            <div class="item-discount">${item.discount}% OFF</div>
        ` : '';

        const subtotal = item.price * item.quantity;

        return `
            <div class="cart-item" data-product-id="${item.id}">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}" 
                         onerror="this.src='https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200'">
                </div>
                <div class="item-details">
                    <h4 class="item-name">${item.name}</h4>
                    <div class="item-price">
                        <span class="current-price">${this.formatPrice(item.price)}</span>
                        ${originalPrice}
                    </div>
                    ${discount}
                    <div class="item-subtotal">Subtotal: ${this.formatPrice(subtotal)}</div>
                    <div class="item-actions">
                        <div class="quantity-controls">
                            <button class="quantity-btn decrease" data-product-id="${item.id}">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn increase" data-product-id="${item.id}">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="remove-item" data-product-id="${item.id}">
                            <i class="fas fa-trash"></i>
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachCartItemEventListeners() {
        // Decrease quantity buttons
        document.querySelectorAll('.quantity-btn.decrease').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.quantity-btn').dataset.productId;
                const item = this.cart.find(item => item.id === productId);
                if (item) {
                    this.updateQuantity(productId, item.quantity - 1);
                }
            });
        });

        // Increase quantity buttons
        document.querySelectorAll('.quantity-btn.increase').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.quantity-btn').dataset.productId;
                const item = this.cart.find(item => item.id === productId);
                if (item) {
                    this.updateQuantity(productId, item.quantity + 1);
                }
            });
        });

        // Remove item buttons
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.remove-item').dataset.productId;
                this.removeFromCart(productId);
            });
        });
    }

    calculateTotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    calculateDiscounts() {
        return this.cart.reduce((total, item) => {
            if (item.originalPrice) {
                return total + ((item.originalPrice - item.price) * item.quantity);
            }
            return total;
        }, 0);
    }

    getCartItemsCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    toggleCartSidebar() {
        const cartSidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('overlay');
        
        if (cartSidebar && overlay) {
            cartSidebar.classList.toggle('open');
            overlay.classList.toggle('active');
            document.body.style.overflow = cartSidebar.classList.contains('open') ? 'hidden' : '';
        }
    }

    closeCartSidebar() {
        const cartSidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('overlay');
        
        if (cartSidebar && overlay) {
            cartSidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty', 'error');
            return;
        }

        // Check if user is logged in
        const currentUser = safeGet('nonaBeautyUser');
        
        if (!currentUser) {
            this.showNotification('Please login to proceed with checkout', 'warning');
            this.closeCartSidebar();
            
            // Redirect to login page with return URL
            setTimeout(() => {
                window.location.href = 'login.html?redirect=checkout';
            }, 1500);
            return;
        }

        // Check if user has shipping address
        const hasAddress = currentUser.addresses && currentUser.addresses.length > 0;
        
        if (!hasAddress) {
            this.showNotification('Please add a shipping address first', 'warning');
            this.closeCartSidebar();
            
            setTimeout(() => {
                window.location.href = 'profile.html#addresses';
            }, 1500);
            return;
        }

        // Create order
        const order = {
            id: 'ORD-' + Date.now(),
            items: [...this.cart],
            total: this.calculateTotal(),
            discount: this.calculateDiscounts(),
            subtotal: this.calculateTotal() + this.calculateDiscounts(),
            customer: {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                phone: currentUser.phone
            },
            shippingAddress: currentUser.addresses.find(addr => addr.isDefault) || currentUser.addresses[0],
            status: 'pending',
            createdAt: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        };

        // Save order
        this.saveOrder(order);

        // Clear cart
        this.clearCart();
        this.closeCartSidebar();

        // Show success message
        this.showNotification('Order placed successfully! Redirecting to order details...', 'success');

        // Redirect to order confirmation
        setTimeout(() => {
            window.location.href = `order-confirmation.html?id=${order.id}`;
        }, 2000);
    }

    saveOrder(order) {
        const orders = (safeGet('nonaBeautyOrders') || []);
        orders.push(order);
        sanitizeAndSet('nonaBeautyOrders', orders);
    }

    getCartSummary() {
        return {
            items: this.cart.length,
            total: this.calculateTotal(),
            discount: this.calculateDiscounts(),
            itemsCount: this.getCartItemsCount(),
            subtotal: this.calculateTotal() + this.calculateDiscounts()
        };
    }

    formatPrice(price) {
        return `${price} EGP`;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        safeSetHTML(notification, `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `);

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Apply coupon code (placeholder for future implementation)
    applyCoupon(code) {
        const coupons = {
            'WELCOME10': { discount: 10, type: 'percentage', minAmount: 50 },
            'SAVE20': { discount: 20, type: 'percentage', minAmount: 100 },
            'FREESHIP': { discount: 0, type: 'shipping', description: 'Free Shipping' }
        };

        const coupon = coupons[code.toUpperCase()];
        
        if (coupon) {
            this.showNotification(`Coupon applied: ${code}`, 'success');
            return coupon;
        } else {
            this.showNotification('Invalid coupon code', 'error');
            return null;
        }
    }
}

// Initialize cart manager
document.addEventListener('DOMContentLoaded', function() {
    window.cartManager = new CartManager();
    
    // Add cart styles if not already added
    if (!document.getElementById('cartStyles')) {
        const cartStyles = document.createElement('style');
        cartStyles.id = 'cartStyles';
        cartStyles.textContent = `
            .cart-sidebar {
                position: fixed;
                top: 0;
                right: -400px;
                width: 380px;
                height: 100vh;
                background: white;
                box-shadow: -5px 0 15px rgba(0,0,0,0.1);
                z-index: 2000;
                transition: right 0.3s ease;
                display: flex;
                flex-direction: column;
            }
            
            .cart-sidebar.open {
                right: 0;
            }
            
            .overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 1999;
                display: none;
            }
            
            .overlay.active {
                display: block;
            }
            
            .cart-header {
                padding: 20px;
                border-bottom: 1px solid #e1e5e9;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .cart-header h3 {
                margin: 0;
                color: var(--dark-text);
            }
            
            .close-cart {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: var(--muted-text);
                padding: 5px;
            }
            
            .cart-body {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .empty-cart {
                text-align: center;
                padding: 40px 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
            }
            
            .empty-cart i {
                font-size: 48px;
                color: #e1e5e9;
            }
            
            .cart-items {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .cart-item {
                display: flex;
                gap: 15px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            
            .item-image {
                width: 80px;
                height: 80px;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .item-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .item-details {
                flex: 1;
            }
            
            .item-name {
                margin: 0 0 5px 0;
                font-size: 14px;
                font-weight: 600;
            }
            
            .item-price {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 5px;
            }
            
            .current-price {
                font-weight: bold;
                color: var(--primary-color);
            }
            
            .item-original-price {
                font-size: 12px;
                color: var(--muted-text);
                text-decoration: line-through;
            }
            
            .item-discount {
                font-size: 11px;
                background: var(--success-color);
                color: white;
                padding: 2px 6px;
                border-radius: 10px;
            }
            
            .item-subtotal {
                font-size: 12px;
                color: var(--muted-text);
                margin-bottom: 10px;
            }
            
            .item-actions {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .quantity-controls {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .quantity-btn {
                width: 30px;
                height: 30px;
                border: 1px solid #e1e5e9;
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 12px;
            }
            
            .quantity {
                font-weight: 600;
                min-width: 20px;
                text-align: center;
            }
            
            .remove-item {
                background: none;
                border: none;
                color: var(--danger-color);
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .cart-footer {
                padding: 20px;
                border-top: 1px solid #e1e5e9;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .cart-total {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 600;
                font-size: 18px;
                margin-bottom: 10px;
            }
            
            @media (max-width: 480px) {
                .cart-sidebar {
                    width: 100%;
                    right: -100%;
                }
            }
        `;
        document.head.appendChild(cartStyles);
    }
});
[file content end]

/* submitOrder - sends EmailJS email if configured and opens WhatsApp link */
function submitOrder(order){
  try{
    var cfg = getConfig();
    var orderId = order.id || Date.now();
    var emailData = {
      order_id: orderId,
      customer_name: order.customerName || order.name || 'Guest',
      customer_email: order.email || '',
      items: JSON.stringify(order.items || []),
      total: order.total || '',
      note: order.note || ''
    };
    // send via EmailJS if configured
    if(cfg && cfg.emailjs && cfg.emailjs.serviceId && cfg.emailjs.templateId && cfg.emailjs.userId){
      if(window.emailjs){ emailjs.init({ publicKey: cfg.emailjs.userId }); emailjs.send(cfg.emailjs.serviceId, cfg.emailjs.templateId, emailData).then(function(){}, function(err){console.error(err);}); }
    }
    // WhatsApp notification
    var wa = (cfg && cfg.socials && cfg.socials.whatsapp) ? cfg.socials.whatsapp : '01094004720';
    var num = wa.replace(/^0/, ''); if(num.length>0 && num[0]==='+' ) num = num.replace('+','');
    var waLink = 'https://wa.me/2' + num + '?text=' + encodeURIComponent('New order: ' + orderId + '\nName: ' + emailData.customer_name + '\nTotal: ' + emailData.total);
    window.open(waLink, '_blank');
    // save order
    var orders = safeGet('nonaBeautyOrders') || [];
    orders.push(order);
    sanitizeAndSet('nonaBeautyOrders', orders);
    alert('Order submitted. Admins notified.');
  }catch(e){ console.error(e); alert('Order submission failed'); }
}
