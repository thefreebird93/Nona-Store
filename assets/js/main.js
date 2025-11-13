

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


// Main JavaScript file for Nona Beauty - Complete and Enhanced
class NonaBeautyApp {
    constructor() {
        this.currentUser = null;
        this.cart = [];
        this.wishlist = [];
        this.products = [];
        this.init();
    }

    init() {
        this.loadUserData();
        this.loadProducts();
        this.loadCart();
        this.loadWishlist();
        this.setupEventListeners();
        this.setupMobileMenu();
        this.updateUI();
        this.checkAuthentication();
    }

    // إدارة المستخدم
    loadUserData() {
        try {
            const userData = localStorage.getItem('nonaBeautyUser');
            if (userData) {
                this.currentUser = JSON.parse(userData);
}
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    checkAuthentication() {
        // حماية الصفحات التي تتطلب تسجيل دخول
        const protectedPages = ['profile.html', 'admin.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage) && !this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        // منع الوصول إلى admin إذا لم يكن المستخدم مسؤولاً
        if (currentPage === 'admin.html' && this.currentUser && this.currentUser.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
    }

    // تحميل المنتجات
    loadProducts() {
        try {
            const productsData = localStorage.getItem('nonaBeautyProducts');
            if (productsData) {
                this.products = JSON.parse(productsData);
            } else {
                this.products = this.getSampleProducts();
                this.saveProducts();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = this.getSampleProducts();
        }
    }

    saveProducts() {
        sanitizeAndSet('nonaBeautyProducts', this.products);
    }

    // الحصول على المنتجات ذات الخصومات
    getDiscountedProducts() {
        return this.products.filter(product => product.discount && product.discount > 0);
    }

    // الحصول على المنتجات المميزة
    getFeaturedProducts() {
        return this.products.filter(product => product.featured);
    }

    // الحصول على المنتجات حسب الفئة
    getProductsByCategory(category) {
        if (category === 'all') return this.products;
        return this.products.filter(product => product.category === category);
    }

    // إدارة السلة
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
        this.showNotification('Product added to cart!', 'success');
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
        this.showNotification('Product removed from cart', 'info');
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

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCartItemsCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    // إدارة قائمة الأمنيات
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

    saveWishlist() {
        sanitizeAndSet('nonaBeautyWishlist', this.wishlist);
    }

    toggleWishlist(product) {
        const index = this.wishlist.findIndex(item => item.id === product.id);
        
        if (index === -1) {
            this.wishlist.push(product);
            this.showNotification('Product added to wishlist!', 'success');
        } else {
            this.wishlist.splice(index, 1);
            this.showNotification('Product removed from wishlist', 'info');
        }
        
        this.saveWishlist();
        this.updateWishlistUI();
    }

    isInWishlist(productId) {
        return this.wishlist.some(item => item.id === productId);
    }

    // تحديث واجهة المستخدم
    updateUI() {
        this.updateUserUI();
        this.updateCartUI();
        this.updateWishlistUI();
        this.updateNavigation();
    }

    updateUserUI() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');

        if (this.currentUser && userMenu) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            userMenu.style.display = 'flex';
            if (userName) userName.textContent = this.currentUser.name.split(' ')[0]; // الاسم الأول فقط
        } else if (userMenu) {
            userMenu.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'block';
            if (registerBtn) registerBtn.style.display = 'block';
        }
    }

    updateCartUI() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = this.getCartItemsCount();
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    updateWishlistUI() {
        const wishlistCount = document.querySelector('.wishlist-count');
        if (wishlistCount) {
            wishlistCount.textContent = this.wishlist.length;
            wishlistCount.style.display = this.wishlist.length > 0 ? 'flex' : 'none';
        }
    }

    updateNavigation() {
        // تحديث الروابط النشطة
        const currentPage = window.location.pathname.split('/').pop();
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });

        // إظهار/إخفاء رابط المدير
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.style.display = this.currentUser && this.currentUser.role === 'admin' ? 'block' : 'none';
        }
    }

    // إعداد الأحداث
    setupEventListeners() {
        // زر تسجيل الخروج
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // أيقونة السلة
        const cartIcon = document.getElementById('cartIcon');
        if (cartIcon) {
            cartIcon.addEventListener('click', () => {
                this.toggleCartSidebar();
            });
        }

        // أيقونة قائمة الأمنيات
        const wishlistIcon = document.getElementById('wishlistIcon');
        if (wishlistIcon) {
            wishlistIcon.addEventListener('click', () => {
                window.location.href = 'profile.html#wishlist';
            });
        }

        // إغلاق السلة عند النقر خارجها
        document.addEventListener('click', (e) => {
            const cartSidebar = document.getElementById('cartSidebar');
            const cartIcon = document.getElementById('cartIcon');
            
            if (cartSidebar && cartSidebar.classList.contains('open') && 
                !cartSidebar.contains(e.target) && 
                !cartIcon.contains(e.target)) {
                this.closeCartSidebar();
            }
        });
    }

    // القائمة المتنقلة
    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mainNav = document.getElementById('mainNav');

        if (mobileMenuBtn && mainNav) {
            mobileMenuBtn.addEventListener('click', () => {
                mainNav.classList.toggle('active');
                safeSetHTML(mobileMenuBtn, mainNav.classList.contains('active') ? 
                    '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>');
            });

            // إغلاق القائمة عند النقر على رابط
            mainNav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mainNav.classList.remove('active');
                    safeSetHTML(mobileMenuBtn, '<i class="fas fa-bars"></i>');
                });
            });

            // إغلاق القائمة عند تغيير حجم النافذة
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    mainNav.classList.remove('active');
                    safeSetHTML(mobileMenuBtn, '<i class="fas fa-bars"></i>');
                }
            });
        }
    }

    // سلة التسوق الجانبية
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

    logout() {
        this.currentUser = null;
        localStorage.removeItem('nonaBeautyUser');
        this.updateUI();
        this.showNotification('Logged out successfully', 'info');
        
        // إذا كنا في صفحة محمية، نعيد التوجيه للصفحة الرئيسية
        const protectedPages = ['profile.html', 'admin.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    // الإشعارات
    showNotification(message, type = 'info') {
        // إزالة أي إشعارات سابقة
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        safeSetHTML(notification, `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `);

        // إضافة الأنماط
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        // إزالة الإشعار بعد 3 ثوان
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#d63384'
        };
        return colors[type] || '#d63384';
    }

    // بيانات المنتجات الافتراضية
    getSampleProducts() {
        return [
            {
                id: '1',
                name: 'Sulfate-Free Shampoo 400ml',
                price: 170,
                originalPrice: 200,
                discount: 15,
                category: 'hair',
                image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d5b6?w=400',
                description: 'Gentle sulfate-free shampoo for daily use on all hair types.',
                rating: 4.5,
                reviewCount: 128,
                featured: true,
                inStock: true,
                tags: ['hair', 'shampoo', 'sulfate-free']
            },
            {
                id: '2',
                name: 'Hydrating Face Serum',
                price: 350,
                originalPrice: 420,
                discount: 17,
                category: 'face',
                image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
                description: 'Deeply hydrating serum with vitamin C and hyaluronic acid.',
                rating: 4.8,
                reviewCount: 89,
                featured: true,
                inStock: true,
                tags: ['face', 'serum', 'hydrating']
            },
            {
                id: '3',
                name: 'Nourishing Body Lotion',
                price: 120,
                category: 'body',
                image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
                description: 'Rich body lotion for soft and smooth skin.',
                rating: 4.3,
                reviewCount: 67,
                featured: false,
                inStock: true,
                tags: ['body', 'lotion', 'moisturizing']
            },
            {
                id: '4',
                name: 'Lip Care Balm',
                price: 50,
                originalPrice: 65,
                discount: 23,
                category: 'lips',
                image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400',
                description: 'Moisturizing lip balm with natural ingredients.',
                rating: 4.6,
                reviewCount: 45,
                featured: false,
                inStock: true,
                tags: ['lips', 'balm', 'moisturizing']
            },
            {
                id: '5',
                name: 'Floral Perfume 50ml',
                price: 400,
                originalPrice: 500,
                discount: 20,
                category: 'perfumes',
                image: 'https://images.unsplash.com/photo-1590736969955-1d0c72c9b6b8?w=400',
                description: 'Elegant floral fragrance for everyday wear.',
                rating: 4.7,
                reviewCount: 156,
                featured: true,
                inStock: true,
                tags: ['perfume', 'floral', 'fragrance']
            },
            {
                id: '6',
                name: 'Hair Growth Oil',
                price: 180,
                originalPrice: 220,
                discount: 18,
                category: 'hair',
                image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400',
                description: 'Natural oil that promotes hair growth and strength.',
                rating: 4.4,
                reviewCount: 92,
                featured: false,
                inStock: true,
                tags: ['hair', 'oil', 'growth']
            },
            {
                id: '7',
                name: 'Anti-Aging Cream',
                price: 280,
                category: 'face',
                image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
                description: 'Advanced anti-aging cream with retinol.',
                rating: 4.6,
                reviewCount: 78,
                featured: false,
                inStock: true,
                tags: ['face', 'cream', 'anti-aging']
            },
            {
                id: '8',
                name: 'Body Scrub',
                price: 90,
                originalPrice: 120,
                discount: 25,
                category: 'body',
                image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400',
                description: 'Exfoliating body scrub for smooth skin.',
                rating: 4.2,
                reviewCount: 34,
                featured: false,
                inStock: true,
                tags: ['body', 'scrub', 'exfoliating']
            }
        ];
    }

    // وظائف مساعدة
    formatPrice(price) {
        return `${price} EGP`;
    }

    createProductCard(product) {
        const discountBadge = product.discount ? `
            <div class="product-badge">${product.discount}% OFF</div>
        ` : '';

        const originalPrice = product.originalPrice ? `
            <span class="original-price">${this.formatPrice(product.originalPrice)}</span>
        ` : '';

        const isInWishlist = this.isInWishlist(product.id);
        const wishlistIcon = isInWishlist ? 'fas' : 'far';

        // إنشاء نجوم التقييم
        let ratingStars = '';
        const fullStars = Math.floor(product.rating);
        const hasHalfStar = product.rating % 1 !== 0;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                ratingStars += '<span class="star"><i class="fas fa-star"></i></span>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                ratingStars += '<span class="star"><i class="fas fa-star-half-alt"></i></span>';
            } else {
                ratingStars += '<span class="star empty"><i class="fas fa-star"></i></span>';
            }
        }

        return `
            <div class="product-card" data-product-id="${product.id}">
                ${discountBadge}
                <button class="wishlist-btn" data-product-id="${product.id}">
                    <i class="${wishlistIcon} fa-heart"></i>
                </button>
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" 
                         onerror="this.src='https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400'">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="rating">
                        ${ratingStars}
                        <span class="review-count">(${product.reviewCount})</span>
                    </div>
                    <div class="product-price">
                        <span class="current-price">${this.formatPrice(product.price)}</span>
                        ${originalPrice}
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary add-to-cart" data-product-id="${product.id}">
                            Add to Cart
                        </button>
                        <button class="btn btn-outline view-details" data-product-id="${product.id}">
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // إرفاق الأحداث لمنتجات
    attachProductEventListeners() {
        // إضافة إلى السلة
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.closest('.add-to-cart').dataset.productId;
                const product = this.products.find(p => p.id === productId);
                if (product) {
                    this.addToCart(product);
                }
            });
        });

        // عرض التفاصيل
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.closest('.view-details').dataset.productId;
                const product = this.products.find(p => p.id === productId);
                if (product) {
                    // يمكن إضافة modal للتفاصيل أو الانتقال لصفحة المنتج
                    this.showNotification(`Viewing details for: ${product.name}`, 'info');
                    // window.location.href = `product-details.html?id=${productId}`;
                }
            });
        });

        // قائمة الأمنيات
        document.querySelectorAll('.wishlist-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.closest('.wishlist-btn').dataset.productId;
                const product = this.products.find(p => p.id === productId);
                if (product) {
                    this.toggleWishlist(product);
                    
                    // تحديث الأيقونة
                    const isInWishlist = this.isInWishlist(productId);
                    const icon = e.target.closest('.wishlist-btn').querySelector('i');
                    icon.className = `${isInWishlist ? 'fas' : 'far'} fa-heart`;
                }
            });
        });
    }

    // تهيئة الصفحة الرئيسية
    initializeHomePage() {
        // تحميل الفئات
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (categoriesGrid) {
            const categories = [
                { id: 'hair', name: 'Hair Care', icon: 'fas fa-air-freshener', description: 'Shampoo, conditioner, hair masks and oils' },
                { id: 'face', name: 'Skin Care', icon: 'fas fa-gem', description: 'Cleansers, toners, serums and creams' },
                { id: 'lips', name: 'Lip Products', icon: 'fas fa-kiss-wink-heart', description: 'Lip gloss, lip balm and lipstick' },
                { id: 'body', name: 'Body Care', icon: 'fas fa-spa', description: 'Shower gel, scrubs, lotion and body butter' },
                { id: 'perfumes', name: 'Perfumes', icon: 'fas fa-wind', description: 'Elegant fragrances for every occasion' }
            ];

            safeSetHTML(categoriesGrid, categories.map(category => `
                <div class="category-card" data-category="${category.id}">
                    <div class="category-icon">
                        <i class="${category.icon}"></i>
                    </div>
                    <h3>${category.name}</h3>
                    <p>${category.description}</p>
                </div>
            `).join(''));

            // إضافة أحداث النقر على الفئات
            document.querySelectorAll('.category-card').forEach(card => {
                card.addEventListener('click', () => {
                    const category = card.dataset.category;
                    window.location.href = `products.html?category=${category}`;
                });
            });
        }

        // تحميل المنتجات المميزة
        const featuredProducts = document.getElementById('featuredProducts');
        if (featuredProducts) {
            const featured = this.getFeaturedProducts().slice(0, 6);
            if (featured.length > 0) {
                safeSetHTML(featuredProducts, featured.map(product => 
                    this.createProductCard(product)
                ).join(''));
                this.attachProductEventListeners();
            }
        }

        // تحميل العروض الخاصة
        const specialOffers = document.getElementById('specialOffers');
        if (specialOffers) {
            const offers = this.getDiscountedProducts().slice(0, 3);
            if (offers.length > 0) {
                safeSetHTML(specialOffers, offers.map(offer => `
                    <div class="offer-card">
                        <div class="offer-image">
                            <img src="${offer.image}" alt="${offer.name}">
                            <div class="offer-badge">${offer.discount}% OFF</div>
                        </div>
                        <div class="offer-content">
                            <h3>${offer.name}</h3>
                            <p>${offer.description}</p>
                            <div class="product-price">
                                <span class="current-price">${this.formatPrice(offer.price)}</span>
                                <span class="original-price">${this.formatPrice(offer.originalPrice)}</span>
                            </div>
                            <button class="btn btn-primary" onclick="nonaBeautyApp.addToCart(window.nonaBeautyApp.products.find(p => p.id === '${offer.id}'))">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                `).join(''));
            }
        }
    }
}

// وظائف مساعدة عالمية
function formatPrice(price) {
    return `${price} EGP`;
}

function showLoading() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

function hideLoading() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

// تهيئة التطبيق عند تحميل DOM
document.addEventListener('DOMContentLoaded', function() {
    window.nonaBeautyApp = new NonaBeautyApp();
    
    // إخفاء شاشة التحميل
    setTimeout(() => {
        hideLoading();
    }, 1000);

    // تهيئة الصفحة الرئيسية
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        window.nonaBeautyApp.initializeHomePage();
    }
});

// معالجة أخطاء الصور
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.src = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400';
    }
}, true);
[file content end]
