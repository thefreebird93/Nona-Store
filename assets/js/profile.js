

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


// Enhanced Profile Manager
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.orders = [];
        this.addresses = [];
        this.wishlist = [];
        this.init();
    }

    init() {
        this.loadUserData();
        this.loadOrders();
        this.loadAddresses();
        this.loadWishlist();
        this.setupEventListeners();
        this.setupNavigation();
        this.showActiveSection();
        this.populateUserData();
    }

    loadUserData() {
        try {
            const userData = localStorage.getItem('nonaBeautyUser');
            if (userData) {
                this.currentUser = JSON.parse(userData);
            } else {
                // Redirect to login if no user data
                window.location.href = 'login.html?redirect=profile';
                return;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            window.location.href = 'login.html';
        }
    }

    loadOrders() {
        try {
            const ordersData = localStorage.getItem('nonaBeautyOrders');
            if (ordersData) {
                this.orders = JSON.parse(ordersData);
                // Filter orders for current user
                this.orders = this.orders.filter(order => 
                    order.customer.id === this.currentUser.id
                ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            this.orders = [];
        }
    }

    loadAddresses() {
        try {
            if (this.currentUser.addresses) {
                this.addresses = this.currentUser.addresses;
            }
        } catch (error) {
            console.error('Error loading addresses:', error);
            this.addresses = [];
        }
    }

    loadWishlist() {
        try {
            const wishlistData = localStorage.getItem('nonaBeautyWishlist');
            if (wishlistData) {
                this.wishlist = JSON.parse(wishlistData);
            }
        } catch (error) {
            console.error('Error loading wishlist:', error);
            this.wishlist = [];
        }
    }

    setupEventListeners() {
        // Personal info form
        const personalInfoForm = document.getElementById('personalInfoForm');
        if (personalInfoForm) {
            personalInfoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updatePersonalInfo();
            });
        }

        // Add address button
        const addAddressBtn = document.getElementById('addAddressBtn');
        if (addAddressBtn) {
            addAddressBtn.addEventListener('click', () => {
                this.openAddAddressModal();
            });
        }

        // Password change form
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }

        // Newsletter preferences
        const newsletterForm = document.getElementById('newsletterForm');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateNewsletterPreferences();
            });
        }

        // Close modal events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('close-modal')) {
                this.closeModal();
            }
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.profile-nav .nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Show corresponding section
                this.showSection(sectionId);
                
                // Update URL hash
                window.location.hash = sectionId;
            });
        });

        // Handle URL hash on page load
        if (window.location.hash) {
            const sectionId = window.location.hash.substring(1);
            this.showSection(sectionId);
            
            // Update active nav link
            navLinks.forEach(link => {
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    }

    showActiveSection() {
        const defaultSection = 'personal-info';
        const activeSection = window.location.hash ? window.location.hash.substring(1) : defaultSection;
        this.showSection(activeSection);
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.profile-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Load section-specific content
            this.loadSectionContent(sectionId);
        }
    }

    loadSectionContent(sectionId) {
        switch (sectionId) {
            case 'personal-info':
                this.populatePersonalInfo();
                break;
            case 'orders':
                this.loadOrdersList();
                break;
            case 'addresses':
                this.loadAddressesList();
                break;
            case 'wishlist':
                this.loadWishlistItems();
                break;
            case 'security':
                this.populateSecuritySettings();
                break;
            case 'preferences':
                this.populatePreferences();
                break;
        }
    }

    populateUserData() {
        // Update user name in header
        const userNameElements = document.querySelectorAll('#userName, .profile-header h1');
        userNameElements.forEach(element => {
            if (element.id === 'userName') {
                element.textContent = this.currentUser.name.split(' ')[0];
            } else {
                element.textContent = `Welcome, ${this.currentUser.name}`;
            }
        });

        // Populate personal info
        this.populatePersonalInfo();
    }

    populatePersonalInfo() {
        if (!this.currentUser) return;

        const firstName = document.getElementById('firstName');
        const lastName = document.getElementById('lastName');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');

        if (firstName && lastName) {
            const nameParts = this.currentUser.name.split(' ');
            firstName.value = nameParts[0] || '';
            lastName.value = nameParts.slice(1).join(' ') || '';
        }

        if (email) email.value = this.currentUser.email || '';
        if (phone) phone.value = this.currentUser.phone || '';
    }

    updatePersonalInfo() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();

        // Validation
        if (!firstName || !lastName || !email || !phone) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (!this.validatePhone(phone)) {
            this.showNotification('Please enter a valid phone number', 'error');
            return;
        }

        // Check if email is already taken by another user
        const users = (safeGet('nonaBeautyUsers') || []);
        const emailExists = users.some(user => 
            user.email === email && user.id !== this.currentUser.id
        );

        if (emailExists) {
            this.showNotification('This email is already registered by another user', 'error');
            return;
        }

        // Update user data
        this.currentUser.name = `${firstName} ${lastName}`;
        this.currentUser.email = email;
        this.currentUser.phone = phone;

        // Update in users array
        const userIndex = users.findIndex(user => user.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = this.currentUser;
            sanitizeAndSet('nonaBeautyUsers', users);
        }

        // Update current user in localStorage
        sanitizeAndSet('nonaBeautyUser', this.currentUser);

        // Update main app if exists
        if (window.nonaBeautyApp) {
            window.nonaBeautyApp.currentUser = this.currentUser;
            window.nonaBeautyApp.updateUI();
        }

        this.showNotification('Personal information updated successfully!', 'success');
        this.populateUserData();
    }

    loadOrdersList() {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;

        if (this.orders.length === 0) {
            safeSetHTML(ordersList, `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <h3>No orders yet</h3>
                    <p>Start shopping to see your orders here</p>
                    <a href="products.html" class="btn btn-primary">Start Shopping</a>
                </div>
            `);
            return;
        }

        safeSetHTML(ordersList, this.orders.map(order => this.createOrderCard(order)).join(''));
    }

    createOrderCard(order) {
        const orderDate = new Date(order.createdAt).toLocaleDateString();
        const deliveryDate = new Date(order.estimatedDelivery).toLocaleDateString();
        const statusClass = this.getOrderStatusClass(order.status);

        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h4>Order #${order.id}</h4>
                        <span class="order-date">Placed on ${orderDate}</span>
                    </div>
                    <div class="order-status">
                        <span class="status-badge ${statusClass}">${order.status}</span>
                    </div>
                </div>
                <div class="order-details">
                    <div class="order-items">
                        ${order.items.slice(0, 2).map(item => `
                            <div class="order-item">
                                <img src="${item.image}" alt="${item.name}" class="item-image">
                                <span class="item-name">${item.name}</span>
                                <span class="item-quantity">Qty: ${item.quantity}</span>
                            </div>
                        `).join('')}
                        ${order.items.length > 2 ? `
                            <div class="more-items">+${order.items.length - 2} more items</div>
                        ` : ''}
                    </div>
                    <div class="order-summary">
                        <div class="order-total">
                            <strong>Total: ${this.formatPrice(order.total)}</strong>
                        </div>
                        <div class="order-actions">
                            <button class="btn btn-sm btn-outline" onclick="profileManager.viewOrderDetails('${order.id}')">
                                View Details
                            </button>
                            ${order.status === 'delivered' ? `
                                <button class="btn btn-sm btn-primary" onclick="profileManager.reorder('${order.id}')">
                                    Reorder
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                ${order.status === 'shipped' ? `
                    <div class="order-tracking">
                        <i class="fas fa-truck"></i>
                        <span>Estimated delivery: ${deliveryDate}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    loadAddressesList() {
        const addressesList = document.getElementById('addressesList');
        if (!addressesList) return;

        if (this.addresses.length === 0) {
            safeSetHTML(addressesList, `
                <div class="empty-state">
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>No addresses saved</h3>
                    <p>Add your first shipping address</p>
                </div>
            `);
            return;
        }

        safeSetHTML(addressesList, this.addresses.map(address => this.createAddressCard(address)).join(''));
    }

    createAddressCard(address) {
        return `
            <div class="address-card ${address.isDefault ? 'default' : ''}">
                <div class="address-header">
                    <h4>${address.type === 'home' ? 'Home' : address.type === 'work' ? 'Work' : 'Other'}</h4>
                    ${address.isDefault ? '<span class="default-badge">Default</span>' : ''}
                </div>
                <div class="address-details">
                    <p><strong>${address.firstName} ${address.lastName}</strong></p>
                    <p>${address.street}</p>
                    <p>${address.city}, ${address.state} ${address.zipCode}</p>
                    <p>${address.country}</p>
                    <p>Phone: ${address.phone}</p>
                </div>
                <div class="address-actions">
                    <button class="btn btn-sm btn-outline" onclick="profileManager.editAddress('${address.id}')">
                        Edit
                    </button>
                    ${!address.isDefault ? `
                        <button class="btn btn-sm btn-primary" onclick="profileManager.setDefaultAddress('${address.id}')">
                            Set as Default
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="profileManager.deleteAddress('${address.id}')">
                            Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    loadWishlistItems() {
        const wishlistContainer = document.getElementById('wishlistItems');
        if (!wishlistContainer) return;

        if (this.wishlist.length === 0) {
            safeSetHTML(wishlistContainer, `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <h3>Your wishlist is empty</h3>
                    <p>Save items you love for later</p>
                    <a href="products.html" class="btn btn-primary">Explore Products</a>
                </div>
            `);
            return;
        }

        safeSetHTML(wishlistContainer, this.wishlist.map(product => this.createWishlistItem(product)).join(''));
        this.attachWishlistEventListeners();
    }

    createWishlistItem(product) {
        const discountBadge = product.discount ? `
            <div class="product-badge">${product.discount}% OFF</div>
        ` : '';

        const originalPrice = product.originalPrice ? `
            <span class="original-price">${this.formatPrice(product.originalPrice)}</span>
        ` : '';

        return `
            <div class="wishlist-item" data-product-id="${product.id}">
                <div class="item-image">
                    <img src="${product.image}" alt="${product.name}">
                    ${discountBadge}
                </div>
                <div class="item-details">
                    <h4>${product.name}</h4>
                    <div class="item-price">
                        <span class="current-price">${this.formatPrice(product.price)}</span>
                        ${originalPrice}
                    </div>
                    <div class="item-rating">
                        <span class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}</span>
                        <span class="review-count">(${product.reviewCount})</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-primary add-to-cart" data-product-id="${product.id}">
                        Add to Cart
                    </button>
                    <button class="btn btn-outline remove-wishlist" data-product-id="${product.id}">
                        Remove
                    </button>
                </div>
            </div>
        `;
    }

    attachWishlistEventListeners() {
        // Add to cart from wishlist
        document.querySelectorAll('.wishlist-item .add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                this.addToCartFromWishlist(productId);
            });
        });

        // Remove from wishlist
        document.querySelectorAll('.wishlist-item .remove-wishlist').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                this.removeFromWishlist(productId);
            });
        });
    }

    populateSecuritySettings() {
        // Populate security form if exists
        const currentPassword = document.getElementById('currentPassword');
        if (currentPassword) {
            currentPassword.value = '';
        }
    }

    populatePreferences() {
        if (!this.currentUser.preferences) return;

        const newsletter = document.getElementById('newsletter');
        const productUpdates = document.getElementById('productUpdates');
        const specialOffers = document.getElementById('specialOffers');

        if (newsletter) newsletter.checked = this.currentUser.preferences.newsletter || false;
        if (productUpdates) productUpdates.checked = this.currentUser.preferences.productUpdates || false;
        if (specialOffers) specialOffers.checked = this.currentUser.preferences.specialOffers || false;
    }

    // Address Management
    openAddAddressModal() {
        this.openModal('addAddressModal');
    }

    editAddress(addressId) {
        const address = this.addresses.find(addr => addr.id === addressId);
        if (address) {
            // Populate edit form
            const modal = this.openModal('editAddressModal');
            // Here you would populate the form with address data
            this.showNotification('Edit address functionality coming soon', 'info');
        }
    }

    setDefaultAddress(addressId) {
        this.addresses.forEach(address => {
            address.isDefault = address.id === addressId;
        });

        this.updateUserAddresses();
        this.loadAddressesList();
        this.showNotification('Default address updated successfully!', 'success');
    }

    deleteAddress(addressId) {
        if (this.addresses.length <= 1) {
            this.showNotification('You must have at least one address', 'error');
            return;
        }

        const address = this.addresses.find(addr => addr.id === addressId);
        if (address && address.isDefault) {
            this.showNotification('Cannot delete default address. Set another as default first.', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this address?')) {
            this.addresses = this.addresses.filter(addr => addr.id !== addressId);
            this.updateUserAddresses();
            this.loadAddressesList();
            this.showNotification('Address deleted successfully', 'success');
        }
    }

    updateUserAddresses() {
        this.currentUser.addresses = this.addresses;
        
        // Update in localStorage
        sanitizeAndSet('nonaBeautyUser', this.currentUser);
        
        // Update in users array
        const users = (safeGet('nonaBeautyUsers') || []);
        const userIndex = users.findIndex(user => user.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = this.currentUser;
            sanitizeAndSet('nonaBeautyUsers', users);
        }
    }

    // Wishlist Management
    addToCartFromWishlist(productId) {
        const product = this.wishlist.find(item => item.id === productId);
        if (product) {
            if (window.cartManager) {
                window.cartManager.addToCart(product);
                this.showNotification('Product added to cart!', 'success');
            } else {
                this.showNotification('Cart functionality not available', 'error');
            }
        }
    }

    removeFromWishlist(productId) {
        this.wishlist = this.wishlist.filter(item => item.id !== productId);
        this.saveWishlist();
        this.loadWishlistItems();
        
        // Update main app if exists
        if (window.nonaBeautyApp) {
            window.nonaBeautyApp.wishlist = this.wishlist;
            window.nonaBeautyApp.saveWishlist();
            window.nonaBeautyApp.updateWishlistUI();
        }
        
        this.showNotification('Product removed from wishlist', 'info');
    }

    saveWishlist() {
        sanitizeAndSet('nonaBeautyWishlist', this.wishlist);
    }

    // Security
    changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (currentPassword !== this.currentUser.password) {
            this.showNotification('Current password is incorrect', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showNotification('New password must be at least 6 characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('New passwords do not match', 'error');
            return;
        }

        // Update password
        this.currentUser.password = newPassword;
        
        // Update in users array
        const users = (safeGet('nonaBeautyUsers') || []);
        const userIndex = users.findIndex(user => user.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            sanitizeAndSet('nonaBeautyUsers', users);
        }

        this.showNotification('Password updated successfully!', 'success');
        
        // Clear form
        document.getElementById('passwordForm').reset();
    }

    // Preferences
    updateNewsletterPreferences() {
        const newsletter = document.getElementById('newsletter').checked;
        const productUpdates = document.getElementById('productUpdates').checked;
        const specialOffers = document.getElementById('specialOffers').checked;

        this.currentUser.preferences = {
            newsletter,
            productUpdates,
            specialOffers
        };

        // Update in localStorage
        sanitizeAndSet('nonaBeautyUser', this.currentUser);
        
        // Update in users array
        const users = (safeGet('nonaBeautyUsers') || []);
        const userIndex = users.findIndex(user => user.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].preferences = this.currentUser.preferences;
            sanitizeAndSet('nonaBeautyUsers', users);
        }

        this.showNotification('Preferences updated successfully!', 'success');
    }

    // Utility Methods
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        return modal;
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    getOrderStatusClass(status) {
        const statusClasses = {
            'pending': 'status-pending',
            'confirmed': 'status-confirmed',
            'processing': 'status-processing',
            'shipped': 'status-shipped',
            'delivered': 'status-delivered',
            'cancelled': 'status-cancelled'
        };
        return statusClasses[status] || 'status-pending';
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhone(phone) {
        const phoneRegex = /^\+?[\d\s-()]{10,}$/;
        return phoneRegex.test(phone);
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

    // Placeholder methods for future implementation
    viewOrderDetails(orderId) {
        this.showNotification('Order details view coming soon', 'info');
    }

    reorder(orderId) {
        this.showNotification('Reorder functionality coming soon', 'info');
    }
}

// Initialize profile manager
document.addEventListener('DOMContentLoaded', function() {
    window.profileManager = new ProfileManager();
    
    // Add profile page specific styles
    if (!document.getElementById('profileStyles')) {
        const profileStyles = document.createElement('style');
        profileStyles.id = 'profileStyles';
        profileStyles.textContent = `
            .profile-header {
                text-align: center;
                margin-bottom: 40px;
            }

            .profile-header h1 {
                font-size: 36px;
                color: var(--primary-color);
                margin-bottom: 10px;
            }

            .profile-header p {
                color: var(--muted-text);
                font-size: 18px;
            }

            .empty-state {
                text-align: center;
                padding: 60px 20px;
                background: var(--white);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
            }

            .empty-state i {
                font-size: 64px;
                color: #e1e5e9;
                margin-bottom: 20px;
            }

            .empty-state h3 {
                color: var(--muted-text);
                margin-bottom: 10px;
            }

            .empty-state p {
                color: var(--muted-text);
                margin-bottom: 20px;
            }

            .order-card {
                background: var(--white);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                padding: 25px;
                margin-bottom: 20px;
            }

            .order-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
            }

            .order-info h4 {
                margin: 0 0 5px 0;
                color: var(--dark-text);
            }

            .order-date {
                color: var(--muted-text);
                font-size: 14px;
            }

            .status-badge {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: capitalize;
            }

            .status-pending { background: #fff3cd; color: #856404; }
            .status-confirmed { background: #d1ecf1; color: #0c5460; }
            .status-processing { background: #cce7ff; color: #004085; }
            .status-shipped { background: #d4edda; color: #155724; }
            .status-delivered { background: #d1ecf1; color: #0c5460; }
            .status-cancelled { background: #f8d7da; color: #721c24; }

            .order-details {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 30px;
                margin-bottom: 15px;
            }

            .order-items {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .order-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 8px;
            }

            .item-image {
                width: 40px;
                height: 40px;
                border-radius: 5px;
                object-fit: cover;
            }

            .item-name {
                flex: 1;
                font-size: 14px;
                font-weight: 500;
            }

            .item-quantity {
                font-size: 12px;
                color: var(--muted-text);
            }

            .more-items {
                text-align: center;
                padding: 10px;
                color: var(--primary-color);
                font-weight: 500;
                cursor: pointer;
            }

            .order-summary {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .order-total {
                font-size: 18px;
                text-align: right;
            }

            .order-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }

            .order-tracking {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 15px;
                background: #e7f3ff;
                border-radius: 8px;
                color: #0066cc;
                font-size: 14px;
            }

            .address-card {
                background: var(--white);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                padding: 25px;
                margin-bottom: 20px;
                border: 2px solid transparent;
            }

            .address-card.default {
                border-color: var(--primary-color);
            }

            .address-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .address-header h4 {
                margin: 0;
                color: var(--dark-text);
                text-transform: capitalize;
            }

            .default-badge {
                background: var(--primary-color);
                color: white;
                padding: 4px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 600;
            }

            .address-details p {
                margin: 5px 0;
                color: var(--muted-text);
            }

            .address-actions {
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }

            .wishlist-item {
                display: grid;
                grid-template-columns: 100px 1fr auto;
                gap: 20px;
                background: var(--white);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                padding: 20px;
                margin-bottom: 15px;
                align-items: center;
            }

            .wishlist-item .item-image {
                position: relative;
                width: 100px;
                height: 100px;
                border-radius: 8px;
                overflow: hidden;
            }

            .wishlist-item .item-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .wishlist-item .item-details h4 {
                margin: 0 0 10px 0;
                color: var(--dark-text);
            }

            .wishlist-item .item-price {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
            }

            .wishlist-item .current-price {
                font-weight: bold;
                color: var(--primary-color);
            }

            .wishlist-item .original-price {
                font-size: 14px;
                color: var(--muted-text);
                text-decoration: line-through;
            }

            .wishlist-item .item-rating {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }

            .wishlist-item .stars {
                color: #ffc107;
            }

            .wishlist-item .review-count {
                color: var(--muted-text);
            }

            .wishlist-item .item-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
                min-width: 120px;
            }

            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 3000;
                padding: 20px;
            }

            .modal.active {
                display: flex;
            }

            .modal-content {
                background: white;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                width: 100%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
            }

            .modal-header {
                padding: 20px 25px;
                border-bottom: 1px solid #e1e5e9;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .modal-header h3 {
                margin: 0;
                color: var(--dark-text);
            }

            .close-modal {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: var(--muted-text);
                padding: 5px;
            }

            .modal-body {
                padding: 25px;
            }

            .modal-footer {
                padding: 20px 25px;
                border-top: 1px solid #e1e5e9;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }

            @media (max-width: 768px) {
                .order-details {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }

                .order-actions {
                    justify-content: stretch;
                }

                .order-actions .btn {
                    flex: 1;
                }

                .wishlist-item {
                    grid-template-columns: 80px 1fr;
                }

                .wishlist-item .item-actions {
                    grid-column: 1 / -1;
                    flex-direction: row;
                    margin-top: 15px;
                }

                .address-actions {
                    flex-direction: column;
                }
            }

            @media (max-width: 480px) {
                .order-header {
                    flex-direction: column;
                    gap: 10px;
                }

                .order-info, .order-status {
                    width: 100%;
                }

                .wishlist-item {
                    grid-template-columns: 1fr;
                    text-align: center;
                }

                .wishlist-item .item-image {
                    margin: 0 auto;
                }
            }
        `;
        document.head.appendChild(profileStyles);
    }
});
[file content end]
