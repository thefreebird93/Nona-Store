

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


// Enhanced Offers Manager
class OffersManager {
    constructor() {
        this.offers = [];
        this.bundles = [];
        this.coupons = [];
        this.filteredOffers = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadOffers();
        this.setupEventListeners();
        this.displayOffers();
        this.displayBundles();
        this.startCountdownTimer();
        this.initializeOfferBanner();
    }

    loadOffers() {
        // Try to load from localStorage first, then from JSON data
        const savedOffers = localStorage.getItem('nonaBeautyOffers');
        
        if (savedOffers) {
            this.offers = JSON.parse(savedOffers);
        } else {
            this.offers = this.getDefaultOffers();
            this.saveOffers();
        }

        this.bundles = this.getDefaultBundles();
        this.coupons = this.getDefaultCoupons();
        this.filteredOffers = this.getActiveOffers();
    }

    getDefaultOffers() {
        return [
            {
                id: '1',
                title: 'Mega Skincare Sale',
                description: 'Up to 50% off on selected skincare products. Transform your skincare routine with our premium collection.',
                discount: 50,
                type: 'percentage',
                category: 'skincare',
                startDate: '2024-01-01',
                endDate: '2024-01-31',
                isActive: true,
                featured: true,
                image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600',
                products: ['2', '3', '4', '5', '7', '9'],
                terms: 'Valid on selected skincare products only. Cannot be combined with other offers.',
                bannerImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800'
            },
            {
                id: '2',
                title: 'Buy 2 Get 1 Free - Haircare',
                description: 'Purchase any two haircare products and get one free. Perfect for your complete hair care routine.',
                discount: 100,
                type: 'bogo',
                category: 'haircare',
                startDate: '2024-01-15',
                endDate: '2024-02-15',
                isActive: true,
                featured: false,
                image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d5b6?w=600',
                products: ['1', '6', '10'],
                terms: 'Free product must be of equal or lesser value. Limited to one free product per transaction.',
                bannerImage: 'https://images.unsplash.com/photo-1625772299848-391b6a87d5b6?w=800'
            },
            {
                id: '3',
                title: 'Winter Perfume Collection - 25% OFF',
                description: 'Special discount on our winter perfume collection. Find your perfect seasonal fragrance.',
                discount: 25,
                type: 'percentage',
                category: 'perfumes',
                startDate: '2023-12-01',
                endDate: '2024-02-29',
                isActive: true,
                featured: true,
                image: 'https://images.unsplash.com/photo-1590736969955-1d0c72c9b6b8?w=600',
                products: ['3'],
                terms: 'Valid on winter collection perfumes only. While supplies last.',
                bannerImage: 'https://images.unsplash.com/photo-1590736969955-1d0c72c9b6b8?w=800'
            },
            {
                id: '4',
                title: 'Free Shipping on Orders Over $50',
                description: 'Enjoy free standard shipping on all orders above $50. Shop more, save more!',
                discount: 0,
                type: 'shipping',
                category: 'all',
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                isActive: true,
                featured: false,
                image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600',
                products: [],
                terms: 'Valid on standard shipping within the continental US. Excludes expedited shipping options.',
                bannerImage: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800'
            },
            {
                id: '5',
                title: 'New Customer Welcome Offer - 15% OFF',
                description: 'Special discount for first-time customers. Start your beauty journey with savings!',
                discount: 15,
                type: 'percentage',
                category: 'all',
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                isActive: true,
                featured: false,
                image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600',
                products: [],
                code: 'WELCOME15',
                terms: 'Valid for first-time customers only. One use per customer. Cannot be combined with other offers.',
                bannerImage: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800'
            },
            {
                id: '6',
                title: 'Lip Products Special - 30% OFF',
                description: 'Get gorgeous lips with 30% off all lip products including balms, glosses, and treatments.',
                discount: 30,
                type: 'percentage',
                category: 'lips',
                startDate: '2024-01-20',
                endDate: '2024-02-20',
                isActive: true,
                featured: true,
                image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600',
                products: ['4'],
                terms: 'Valid on all lip products. Limited time offer.',
                bannerImage: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800'
            }
        ];
    }

    getDefaultBundles() {
        return [
            {
                id: 'bundle-1',
                name: 'Complete Skincare Routine',
                description: 'Everything you need for perfect skin - cleanser, toner, serum, and moisturizer in one complete set.',
                originalPrice: 120.00,
                bundlePrice: 89.99,
                discount: 25,
                image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600',
                products: [
                    { id: '2', name: 'Hydrating Face Serum', quantity: 1 },
                    { id: '7', name: 'Anti-Aging Cream', quantity: 1 },
                    { id: '9', name: 'Vitamin C Serum', quantity: 1 }
                ],
                isActive: true,
                savings: 'Save 30 EGP',
                features: ['Complete Routine', 'Premium Products', 'Money Saving']
            },
            {
                id: 'bundle-2',
                name: 'Luxury Haircare Set',
                description: 'Transform your hair with our premium haircare collection for nourished, shiny, and healthy hair.',
                originalPrice: 85.00,
                bundlePrice: 65.99,
                discount: 22,
                image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d5b6?w=600',
                products: [
                    { id: '1', name: 'Sulfate-Free Shampoo', quantity: 1 },
                    { id: '6', name: 'Hair Growth Oil', quantity: 1 },
                    { id: '10', name: 'Hair Conditioner', quantity: 1 }
                ],
                isActive: true,
                savings: 'Save 19 EGP',
                features: ['Complete Hair Care', 'Natural Ingredients', 'Value Pack']
            },
            {
                id: 'bundle-3',
                name: 'Body Care Essentials',
                description: 'Pamper your skin with our complete body care collection for silky smooth skin from head to toe.',
                originalPrice: 75.00,
                bundlePrice: 55.99,
                discount: 25,
                image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600',
                products: [
                    { id: '4', name: 'Nourishing Body Lotion', quantity: 1 },
                    { id: '8', name: 'Body Scrub', quantity: 1 }
                ],
                isActive: true,
                savings: 'Save 19 EGP',
                features: ['Exfoliate & Moisturize', 'Luxury Experience', 'Best Value']
            }
        ];
    }

    getDefaultCoupons() {
        return [
            {
                code: 'WELCOME10',
                discount: 10,
                type: 'percentage',
                minAmount: 0,
                maxDiscount: 50,
                validUntil: '2024-12-31',
                usageLimit: 1,
                usedCount: 0,
                isActive: true,
                description: '10% off your first order'
            },
            {
                code: 'SAVE20',
                discount: 20,
                type: 'percentage',
                minAmount: 100,
                maxDiscount: 100,
                validUntil: '2024-03-31',
                usageLimit: 1000,
                usedCount: 245,
                isActive: true,
                description: '20% off orders over 100 EGP'
            },
            {
                code: 'FREESHIP',
                discount: 0,
                type: 'shipping',
                minAmount: 0,
                maxDiscount: 0,
                validUntil: '2024-06-30',
                usageLimit: 5000,
                usedCount: 1234,
                isActive: true,
                description: 'Free standard shipping'
            }
        ];
    }

    saveOffers() {
        sanitizeAndSet('nonaBeautyOffers', this.offers);
    }

    setupEventListeners() {
        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterOffers(filter);
                
                // Update active button
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Newsletter form
        const newsletterForm = document.getElementById('newsletterForm');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSignup(newsletterForm);
            });
        }

        // Coupon form
        const couponForm = document.getElementById('couponForm');
        if (couponForm) {
            couponForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.applyCouponCode(couponForm);
            });
        }

        // Bundle actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-bundle-to-cart')) {
                const bundleId = e.target.dataset.bundleId;
                this.addBundleToCart(bundleId);
            }
        });
    }

    initializeOfferBanner() {
        const featuredOffer = this.offers.find(offer => offer.featured && offer.isActive);
        if (featuredOffer) {
            this.displayOfferBanner(featuredOffer);
        }
    }

    displayOfferBanner(offer) {
        const offerBanner = document.getElementById('offerBanner');
        if (!offerBanner) return;

        const badgeType = this.getBadgeType(offer.type);
        const daysLeft = this.getDaysLeft(offer.endDate);

        safeSetHTML(offerBanner, `
            <div class="offer-banner-card">
                <div class="banner-content">
                    <div class="banner-badge">${badgeType}</div>
                    <h3>${offer.title}</h3>
                    <p>${offer.description}</p>
                    <div class="banner-meta">
                        <span class="time-left">
                            <i class="fas fa-clock"></i>
                            ${daysLeft > 0 ? `${daysLeft} days left` : 'Ending soon'}
                        </span>
                        <span class="offer-scope">
                            <i class="fas fa-tag"></i>
                            ${offer.category === 'all' ? 'All Products' : this.getCategoryName(offer.category)}
                        </span>
                    </div>
                    <button class="btn btn-primary" onclick="offersManager.applyOffer('${offer.id}')">
                        Shop Now & Save
                    </button>
                </div>
                <div class="banner-image">
                    <img src="${offer.bannerImage || offer.image}" alt="${offer.title}">
                </div>
            </div>
        `);
    }

    filterOffers(filter) {
        this.currentFilter = filter;
        
        if (filter === 'all') {
            this.filteredOffers = this.getActiveOffers();
        } else {
            this.filteredOffers = this.getActiveOffers().filter(offer => 
                offer.category === filter
            );
        }
        
        this.displayOffers();
    }

    displayOffers() {
        const offersGrid = document.getElementById('offersGrid');
        if (!offersGrid) return;

        if (this.filteredOffers.length === 0) {
            safeSetHTML(offersGrid, `
                <div class="no-offers" style="grid-column: 1 / -1); text-align: center; padding: 60px 20px;">
                    <i class="fas fa-tag" style="font-size: 64px; color: #e2e8f0; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--muted-text); margin-bottom: 10px;">No offers available</h3>
                    <p style="color: var(--muted-text);">Check back later for new promotions</p>
                </div>
            `;
            return;
        }

        safeSetHTML(offersGrid, this.filteredOffers.map(offer => this.createOfferCard(offer)).join(''));
    }

    createOfferCard(offer) {
        const badgeType = this.getBadgeType(offer.type);
        const daysLeft = this.getDaysLeft(offer.endDate);
        const timeLeftText = daysLeft > 0 ? `${daysLeft} days left` : 'Ending soon';
        const timeLeftClass = daysLeft < 3 ? 'urgent' : daysLeft < 7 ? 'ending-soon' : '';

        return `
            <div class="offer-card" data-offer-id="${offer.id}">
                <div class="offer-image">
                    <img src="${offer.image}" alt="${offer.title}">
                    <div class="offer-badge">${badgeType}</div>
                    <div class="time-left ${timeLeftClass}">${timeLeftText}</div>
                    ${offer.featured ? '<div class="featured-badge">Featured</div>' : ''}
                </div>
                <div class="offer-content">
                    <h3>${offer.title}</h3>
                    <p>${offer.description}</p>
                    <div class="offer-meta">
                        <span class="category">
                            <i class="fas fa-tag"></i>
                            ${this.getCategoryName(offer.category)}
                        </span>
                        <span class="valid-until">
                            <i class="fas fa-calendar"></i>
                            Valid until ${new Date(offer.endDate).toLocaleDateString()}
                        </span>
                    </div>
                    <div class="offer-actions">
                        <button class="btn btn-primary" onclick="offersManager.applyOffer('${offer.id}')">
                            Shop Now
                        </button>
                        <button class="btn btn-outline" onclick="offersManager.viewOfferDetails('${offer.id}')">
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    displayBundles() {
        const bundlesGrid = document.getElementById('bundlesGrid');
        if (!bundlesGrid) return;

        const activeBundles = this.bundles.filter(bundle => bundle.isActive);

        if (activeBundles.length === 0) {
            safeSetHTML(bundlesGrid, `
                <div class="no-bundles" style="grid-column: 1 / -1); text-align: center; padding: 40px;">
                    <p>No bundle deals available at the moment</p>
                </div>
            `;
            return;
        }

        safeSetHTML(bundlesGrid, activeBundles.map(bundle => this.createBundleCard(bundle)).join(''));
    }

    createBundleCard(bundle) {
        return `
            <div class="bundle-card" data-bundle-id="${bundle.id}">
                <div class="bundle-image">
                    <img src="${bundle.image}" alt="${bundle.name}">
                    <div class="bundle-badge">Bundle Deal</div>
                </div>
                <div class="bundle-content">
                    <h3>${bundle.name}</h3>
                    <p>${bundle.description}</p>
                    
                    <div class="bundle-features">
                        ${bundle.features.map(feature => `
                            <span class="feature-tag">
                                <i class="fas fa-check"></i>
                                ${feature}
                            </span>
                        `).join('')}
                    </div>
                    
                    <div class="bundle-products">
                        <h4>Includes:</h4>
                        <ul>
                            ${bundle.products.map(product => `
                                <li>${product.name}</li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div class="bundle-pricing">
                        <div class="price-comparison">
                            <span class="original-price">${this.formatPrice(bundle.originalPrice)}</span>
                            <span class="bundle-price">${this.formatPrice(bundle.bundlePrice)}</span>
                        </div>
                        <div class="savings">${bundle.savings}</div>
                    </div>
                    
                    <div class="bundle-actions">
                        <button class="btn btn-primary add-bundle-to-cart" data-bundle-id="${bundle.id}">
                            Add Bundle to Cart
                        </button>
                        <button class="btn btn-outline view-bundle-details" data-bundle-id="${bundle.id}">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    applyOffer(offerId) {
        const offer = this.offers.find(o => o.id === offerId);
        if (offer) {
            // Navigate to products page with offer filter
            if (offer.category !== 'all') {
                window.location.href = `products.html?category=${offer.category}&offer=${offerId}`;
            } else {
                window.location.href = `products.html?offer=${offerId}`;
            }
        }
    }

    viewOfferDetails(offerId) {
        const offer = this.offers.find(o => o.id === offerId);
        if (offer) {
            this.showOfferModal(offer);
        }
    }

    showOfferModal(offer) {
        // Create and show modal with offer details
        const modal = document.createElement('div');
        modal.className = 'modal active';
        safeSetHTML(modal, `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${offer.title}</h3>
                    <button class="close-modal">&times);</button>
                </div>
                <div class="modal-body">
                    <div class="offer-details">
                        <img src="${offer.image}" alt="${offer.title}" class="offer-detail-image">
                        <div class="offer-detail-content">
                            <p>${offer.description}</p>
                            <div class="offer-detail-meta">
                                <div class="detail-item">
                                    <strong>Discount:</strong>
                                    <span>${this.getBadgeType(offer.type)}</span>
                                </div>
                                <div class="detail-item">
                                    <strong>Valid Until:</strong>
                                    <span>${new Date(offer.endDate).toLocaleDateString()}</span>
                                </div>
                                <div class="detail-item">
                                    <strong>Category:</strong>
                                    <span>${this.getCategoryName(offer.category)}</span>
                                </div>
                            </div>
                            <div class="offer-terms">
                                <h4>Terms & Conditions:</h4>
                                <p>${offer.terms}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="offersManager.applyOffer('${offer.id}')">
                        Shop This Offer
                    </button>
                    <button class="btn btn-outline close-modal">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    addBundleToCart(bundleId) {
        const bundle = this.bundles.find(b => b.id === bundleId);
        if (bundle && window.cartManager) {
            // Add each product in the bundle to cart
            bundle.products.forEach(product => {
                const productData = this.getProductById(product.id);
                if (productData) {
                    window.cartManager.addToCart(productData, product.quantity);
                }
            });
            this.showNotification('Bundle added to cart!', 'success');
        }
    }

    getProductById(productId) {
        // This would typically come from your products data
        if (window.nonaBeautyApp) {
            return window.nonaBeautyApp.products.find(p => p.id === productId);
        }
        return null;
    }

    applyCouponCode(form) {
        const codeInput = form.querySelector('input[type="text"]');
        const code = codeInput.value.trim();

        if (!code) {
            this.showNotification('Please enter a coupon code', 'error');
            return;
        }

        const coupon = this.coupons.find(c => 
            c.code.toUpperCase() === code.toUpperCase() && 
            c.isActive && 
            new Date(c.validUntil) > new Date()
        );

        if (coupon) {
            if (coupon.usedCount >= coupon.usageLimit) {
                this.showNotification('This coupon has reached its usage limit', 'error');
                return;
            }

            // Apply coupon logic here
            coupon.usedCount++;
            this.showNotification(`Coupon applied successfully! ${coupon.description}`, 'success');
            codeInput.value = '';

            // Here you would typically update the cart total
            if (window.cartManager) {
                // window.cartManager.applyCoupon(coupon);
            }
        } else {
            this.showNotification('Invalid or expired coupon code', 'error');
        }
    }

    startCountdownTimer() {
        const countdownDate = new Date();
        countdownDate.setDate(countdownDate.getDate() + 7); // 7 days from now

        function updateCountdown() {
            const now = new Date().getTime();
            const distance = countdownDate - now;

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Update display
            const daysEl = document.getElementById('countdownDays');
            const hoursEl = document.getElementById('countdownHours');
            const minutesEl = document.getElementById('countdownMinutes');
            const secondsEl = document.getElementById('countdownSeconds');

            if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
            if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
            if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
            if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');

            if (distance < 0) {
                clearInterval(countdownTimer);
                // Reset timer for next week
                setTimeout(() => {
                    this.startCountdownTimer();
                }, 1000);
            }
        }

        // Update immediately and then every second
        updateCountdown();
        const countdownTimer = setInterval(updateCountdown, 1000);
    }

    handleNewsletterSignup(form) {
        const email = form.querySelector('input[type="email"]').value.trim();
        
        if (!email) {
            this.showNotification('Please enter your email address', 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Simulate API call
        this.showNotification('Subscribing...', 'info');
        
        setTimeout(() => {
            this.showNotification('Successfully subscribed to newsletter!', 'success');
            form.reset();
            
            // Update user preferences if logged in
            if (window.nonaBeautyApp && window.nonaBeautyApp.currentUser) {
                window.nonaBeautyApp.currentUser.preferences = {
                    ...window.nonaBeautyApp.currentUser.preferences,
                    newsletter: true
                };
                sanitizeAndSet('nonaBeautyUser', window.nonaBeautyApp.currentUser);
            }
        }, 1000);
    }

    // Utility Methods
    getActiveOffers() {
        const now = new Date();
        return this.offers.filter(offer => 
            offer.isActive && 
            new Date(offer.startDate) <= now && 
            new Date(offer.endDate) >= now
        );
    }

    getDaysLeft(endDate) {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }

    getBadgeType(offerType) {
        const types = {
            'percentage': 'Discount',
            'bogo': 'BOGO',
            'shipping': 'Free Shipping',
            'bundle': 'Bundle Deal'
        };
        return types[offerType] || 'Special Offer';
    }

    getCategoryName(categoryId) {
        const categories = {
            'hair': 'Hair Care',
            'face': 'Skin Care',
            'lips': 'Lip Products',
            'body': 'Body Care',
            'perfumes': 'Perfumes',
            'all': 'All Categories'
        };
        return categories[categoryId] || categoryId;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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

    // Get featured offers for home page
    getFeaturedOffers(limit = 3) {
        return this.getActiveOffers().filter(offer => offer.featured).slice(0, limit);
    }

    // Get offers by category
    getOffersByCategory(category, limit = null) {
        const filtered = this.getActiveOffers().filter(offer => 
            offer.category === category || category === 'all'
        );
        return limit ? filtered.slice(0, limit) : filtered;
    }
}

// Initialize offers manager
document.addEventListener('DOMContentLoaded', function() {
    window.offersManager = new OffersManager();
    
    // Add offers page specific styles
    if (!document.getElementById('offersStyles')) {
        const offersStyles = document.createElement('style');
        offersStyles.id = 'offersStyles';
        offersStyles.textContent = `
            .offers-banner {
                margin-bottom: 40px;
            }

            .offer-banner-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: var(--border-radius);
                overflow: hidden;
                display: flex;
                align-items: center;
                color: white;
                box-shadow: var(--shadow);
            }

            .banner-content {
                padding: 40px;
                flex: 1;
            }

            .banner-badge {
                background: rgba(255,255,255,0.2);
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 20px;
                display: inline-block;
                backdrop-filter: blur(10px);
            }

            .banner-content h3 {
                font-size: 32px;
                margin-bottom: 15px;
                line-height: 1.2;
            }

            .banner-content p {
                margin-bottom: 20px;
                opacity: 0.9;
                line-height: 1.6;
            }

            .banner-meta {
                display: flex;
                gap: 20px;
                margin-bottom: 25px;
                flex-wrap: wrap;
            }

            .banner-meta span {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                opacity: 0.9;
            }

            .banner-image {
                flex: 1;
                height: 300px;
                position: relative;
            }

            .banner-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .offers-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                flex-wrap: wrap;
                gap: 20px;
            }

            .offers-filter {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .filter-btn {
                padding: 10px 20px;
                border: 2px solid var(--primary-color);
                background: transparent;
                color: var(--primary-color);
                border-radius: var(--border-radius);
                cursor: pointer;
                transition: var(--transition);
                font-weight: 500;
            }

            .filter-btn.active,
            .filter-btn:hover {
                background: var(--primary-color);
                color: white;
            }

            .offers-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 30px;
                margin-bottom: 50px;
            }

            .offer-card {
                background: var(--white);
                border-radius: var(--border-radius);
                overflow: hidden;
                box-shadow: var(--shadow);
                transition: var(--transition);
                position: relative;
            }

            .offer-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 30px rgba(0,0,0,0.15);
            }

            .offer-image {
                position: relative;
                height: 200px;
                overflow: hidden;
            }

            .offer-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: var(--transition);
            }

            .offer-card:hover .offer-image img {
                transform: scale(1.05);
            }

            .offer-badge {
                position: absolute;
                top: 15px;
                right: 15px;
                background: var(--danger-color);
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                z-index: 2;
            }

            .featured-badge {
                position: absolute;
                top: 15px;
                left: 15px;
                background: var(--primary-color);
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                z-index: 2;
            }

            .time-left {
                position: absolute;
                bottom: 15px;
                left: 15px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 4px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 500;
            }

            .time-left.urgent {
                background: var(--danger-color);
            }

            .time-left.ending-soon {
                background: var(--warning-color);
                color: var(--dark-text);
            }

            .offer-content {
                padding: 25px;
            }

            .offer-content h3 {
                margin-bottom: 10px;
                color: var(--dark-text);
                font-size: 18px;
            }

            .offer-content p {
                color: var(--muted-text);
                margin-bottom: 15px;
                line-height: 1.5;
            }

            .offer-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                font-size: 12px;
                color: var(--muted-text);
            }

            .offer-meta span {
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .offer-actions {
                display: flex;
                gap: 10px;
            }

            .offer-actions .btn {
                flex: 1;
            }

            .bundles-section {
                margin: 60px 0;
            }

            .bundles-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 30px;
            }

            .bundle-card {
                background: var(--white);
                border-radius: var(--border-radius);
                overflow: hidden;
                box-shadow: var(--shadow);
                transition: var(--transition);
            }

            .bundle-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 30px rgba(0,0,0,0.15);
            }

            .bundle-image {
                position: relative;
                height: 200px;
            }

            .bundle-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .bundle-badge {
                position: absolute;
                top: 15px;
                right: 15px;
                background: var(--secondary-color);
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
            }

            .bundle-content {
                padding: 25px;
            }

            .bundle-content h3 {
                margin-bottom: 10px;
                color: var(--dark-text);
            }

            .bundle-content p {
                color: var(--muted-text);
                margin-bottom: 15px;
                line-height: 1.5;
            }

            .bundle-features {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 20px;
            }

            .feature-tag {
                background: #f8f9fa;
                padding: 6px 12px;
                border-radius: 15px;
                font-size: 12px;
                color: var(--muted-text);
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .bundle-products {
                margin-bottom: 20px;
            }

            .bundle-products h4 {
                margin-bottom: 8px;
                font-size: 14px;
                color: var(--dark-text);
            }

            .bundle-products ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .bundle-products li {
                padding: 4px 0;
                color: var(--muted-text);
                font-size: 13px;
                position: relative;
                padding-left: 15px;
            }

            .bundle-products li:before {
                content: '•';
                position: absolute;
                left: 0;
                color: var(--primary-color);
            }

            .bundle-pricing {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }

            .price-comparison {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 5px;
            }

            .original-price {
                color: var(--muted-text);
                text-decoration: line-through;
                font-size: 14px;
            }

            .bundle-price {
                font-size: 24px;
                font-weight: bold;
                color: var(--primary-color);
            }

            .savings {
                color: var(--success-color);
                font-weight: 600;
                font-size: 14px;
            }

            .bundle-actions {
                display: flex;
                gap: 10px;
            }

            .countdown-section {
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: white;
                padding: 40px;
                border-radius: var(--border-radius);
                text-align: center;
                margin: 40px 0;
            }

            .countdown-timer {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-top: 20px;
                flex-wrap: wrap;
            }

            .timer-item {
                background: rgba(255,255,255,0.2);
                padding: 20px;
                border-radius: var(--border-radius);
                min-width: 80px;
                backdrop-filter: blur(10px);
            }

            .timer-number {
                font-size: 32px;
                font-weight: bold;
                display: block;
                margin-bottom: 5px;
            }

            .timer-label {
                font-size: 12px;
                text-transform: uppercase;
                opacity: 0.9;
            }

            .coupon-section {
                background: var(--white);
                padding: 40px;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                text-align: center;
                margin: 40px 0;
            }

            .coupon-form {
                display: flex;
                gap: 10px;
                max-width: 400px;
                margin: 20px auto 0;
            }

            .coupon-form input {
                flex: 1;
                padding: 12px 15px;
                border: 2px solid #e1e5e9;
                border-radius: var(--border-radius);
                font-size: 16px;
            }

            .newsletter-section {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                padding: 60px 40px;
                border-radius: var(--border-radius);
                text-align: center;
                margin: 40px 0;
            }

            .newsletter-form {
                display: flex;
                gap: 10px;
                max-width: 400px;
                margin: 20px auto 0;
            }

            .newsletter-form input {
                flex: 1;
                padding: 12px 15px;
                border: none;
                border-radius: var(--border-radius);
                font-size: 16px;
            }

            .offer-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                align-items: start;
            }

            .offer-detail-image {
                width: 100%;
                border-radius: var(--border-radius);
            }

            .offer-detail-meta {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin: 20px 0;
            }

            .detail-item {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e1e5e9;
            }

            .offer-terms {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-top: 20px;
            }

            .offer-terms h4 {
                margin-bottom: 10px;
                color: var(--dark-text);
            }

            .offer-terms p {
                color: var(--muted-text);
                font-size: 14px;
                line-height: 1.5;
                margin: 0;
            }

            @media (max-width: 768px) {
                .offer-banner-card {
                    flex-direction: column;
                }

                .banner-content {
                    padding: 30px 25px;
                }

                .banner-image {
                    width: 100%;
                    height: 200px;
                }

                .offers-grid {
                    grid-template-columns: 1fr;
                }

                .bundles-grid {
                    grid-template-columns: 1fr;
                }

                .offer-details {
                    grid-template-columns: 1fr;
                }

                .coupon-form,
                .newsletter-form {
                    flex-direction: column;
                }

                .countdown-timer {
                    gap: 10px;
                }

                .timer-item {
                    min-width: 70px;
                    padding: 15px;
                }

                .timer-number {
                    font-size: 24px;
                }
            }

            @media (max-width: 480px) {
                .banner-content h3 {
                    font-size: 24px;
                }

                .offers-header {
                    flex-direction: column;
                    align-items: stretch;
                }

                .offers-filter {
                    justify-content: center;
                }

                .offer-actions {
                    flex-direction: column;
                }

                .bundle-actions {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(offersStyles);
    }
});
[file content end]
