

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


// Enhanced Products Manager
class ProductsManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentCategory = 'all';
        this.currentSort = 'featured';
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.searchQuery = '';
        this.init();
    }

    init() {
        this.loadProducts();
        this.setupEventListeners();
        this.displayProducts();
        this.loadCategories();
        this.handleURLParams();
    }

    loadProducts() {
        // Try to load from localStorage first
        const savedProducts = localStorage.getItem('nonaBeautyProducts');
        
        if (savedProducts) {
            this.products = JSON.parse(savedProducts);
        } else {
            // Load default products
            this.loadDefaultProducts();
        }
        
        this.filteredProducts = [...this.products];
    }

    loadDefaultProducts() {
        // Use products from main app or create default ones
        if (window.nonaBeautyApp && window.nonaBeautyApp.products.length > 0) {
            this.products = window.nonaBeautyApp.products;
        } else {
            this.products = [
                {
                    id: '1',
                    name: 'Sulfate-Free Shampoo 400ml',
                    price: 170,
                    originalPrice: 200,
                    discount: 15,
                    category: 'hair',
                    image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d5b6?w=400',
                    description: 'Gentle sulfate-free shampoo that cleanses without stripping natural oils. Perfect for daily use on all hair types.',
                    rating: 4.5,
                    reviewCount: 128,
                    inStock: true,
                    featured: true,
                    tags: ['hair', 'shampoo', 'sulfate-free', 'natural']
                },
                {
                    id: '2',
                    name: 'Hydrating Face Serum',
                    price: 350,
                    originalPrice: 420,
                    discount: 17,
                    category: 'face',
                    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
                    description: 'Powerful serum combining hyaluronic acid, niacinamide and alpha urea for glowing skin.',
                    rating: 4.8,
                    reviewCount: 89,
                    inStock: true,
                    featured: true,
                    tags: ['face', 'serum', 'hydrating', 'brightening']
                },
                {
                    id: '3',
                    name: 'Floral Elegance Perfume 50ml',
                    price: 400,
                    originalPrice: 500,
                    discount: 20,
                    category: 'perfumes',
                    image: 'https://images.unsplash.com/photo-1590736969955-1d0c72c9b6b8?w=400',
                    description: 'Elegant floral perfume with long-lasting fragrance for special occasions.',
                    rating: 4.7,
                    reviewCount: 156,
                    inStock: true,
                    featured: true,
                    tags: ['perfume', 'floral', 'elegance', 'long-lasting']
                },
                {
                    id: '4',
                    name: 'Nourishing Body Lotion',
                    price: 120,
                    originalPrice: 150,
                    discount: 20,
                    category: 'body',
                    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
                    description: 'Deeply hydrating body lotion for smooth and soft skin all day long.',
                    rating: 4.3,
                    reviewCount: 67,
                    inStock: true,
                    featured: false,
                    tags: ['body', 'lotion', 'moisturizing', 'hydrating']
                },
                {
                    id: '5',
                    name: 'Lip Care Balm',
                    price: 50,
                    category: 'lips',
                    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400',
                    description: 'Nourishing lip balm with natural ingredients for soft and hydrated lips.',
                    rating: 4.6,
                    reviewCount: 45,
                    inStock: true,
                    featured: false,
                    tags: ['lips', 'balm', 'care', 'moisturizing']
                },
                {
                    id: '6',
                    name: 'Hair Growth Oil',
                    price: 180,
                    originalPrice: 220,
                    discount: 18,
                    category: 'hair',
                    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400',
                    description: 'Natural hair oil that promotes hair growth and strength with essential nutrients.',
                    rating: 4.4,
                    reviewCount: 92,
                    inStock: true,
                    featured: false,
                    tags: ['hair', 'oil', 'growth', 'natural']
                },
                {
                    id: '7',
                    name: 'Anti-Aging Cream',
                    price: 280,
                    category: 'face',
                    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
                    description: 'Advanced anti-aging cream with retinol and collagen for youthful skin.',
                    rating: 4.6,
                    reviewCount: 78,
                    inStock: true,
                    featured: false,
                    tags: ['face', 'cream', 'anti-aging', 'retinol']
                },
                {
                    id: '8',
                    name: 'Body Scrub',
                    price: 90,
                    originalPrice: 120,
                    discount: 25,
                    category: 'body',
                    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400',
                    description: 'Exfoliating body scrub for smooth and radiant skin with natural ingredients.',
                    rating: 4.2,
                    reviewCount: 34,
                    inStock: true,
                    featured: false,
                    tags: ['body', 'scrub', 'exfoliating', 'natural']
                },
                {
                    id: '9',
                    name: 'Vitamin C Serum',
                    price: 320,
                    originalPrice: 380,
                    discount: 16,
                    category: 'face',
                    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
                    description: 'Brightening serum with Vitamin C for even skin tone and radiance.',
                    rating: 4.7,
                    reviewCount: 112,
                    inStock: true,
                    featured: true,
                    tags: ['face', 'serum', 'vitamin-c', 'brightening']
                },
                {
                    id: '10',
                    name: 'Hair Conditioner',
                    price: 140,
                    originalPrice: 170,
                    discount: 18,
                    category: 'hair',
                    image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d5b6?w=400',
                    description: 'Deep conditioning treatment for soft, manageable hair.',
                    rating: 4.5,
                    reviewCount: 87,
                    inStock: true,
                    featured: false,
                    tags: ['hair', 'conditioner', 'moisturizing']
                }
            ];
        }

        this.saveProducts();
    }

    saveProducts() {
        sanitizeAndSet('nonaBeautyProducts', this.products);
    }

    setupEventListeners() {
        // Filter toggle
        const filterToggle = document.getElementById('filterToggle');
        const filtersPanel = document.getElementById('filtersPanel');
        
        if (filterToggle && filtersPanel) {
            filterToggle.addEventListener('click', () => {
                filtersPanel.classList.toggle('active');
            });
        }

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.sortProducts();
                this.displayProducts();
                this.updateURLParams();
            });
        }

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreProducts();
            });
        }

        // Price range
        const priceRange = document.getElementById('priceRange');
        if (priceRange) {
            priceRange.addEventListener('input', (e) => {
                this.updatePriceDisplay(e.target.value);
                this.filterProducts();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.filterProducts();
            });
        }

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
    }

    handleURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Handle category filter from URL
        const category = urlParams.get('category');
        if (category) {
            this.currentCategory = category;
            this.applyCategoryFilter(category);
        }

        // Handle search query from URL
        const search = urlParams.get('search');
        if (search) {
            this.searchQuery = search;
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = search;
            this.filterProducts();
        }

        // Handle sort from URL
        const sort = urlParams.get('sort');
        if (sort) {
            this.currentSort = sort;
            const sortSelect = document.getElementById('sortSelect');
            if (sortSelect) sortSelect.value = sort;
            this.sortProducts();
        }
    }

    updateURLParams() {
        const urlParams = new URLSearchParams();
        
        if (this.currentCategory && this.currentCategory !== 'all') {
            urlParams.set('category', this.currentCategory);
        }
        
        if (this.searchQuery) {
            urlParams.set('search', this.searchQuery);
        }
        
        if (this.currentSort && this.currentSort !== 'featured') {
            urlParams.set('sort', this.currentSort);
        }

        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
    }

    loadCategories() {
        const categoriesContainer = document.querySelector('.categories-grid');
        const categoryFilters = document.getElementById('categoryFilters');
        
        const categories = [
            { id: 'hair', name: 'Hair Care', icon: 'fas fa-air-freshener' },
            { id: 'face', name: 'Skin Care', icon: 'fas fa-gem' },
            { id: 'lips', name: 'Lip Products', icon: 'fas fa-kiss-wink-heart' },
            { id: 'body', name: 'Body Care', icon: 'fas fa-spa' },
            { id: 'perfumes', name: 'Perfumes', icon: 'fas fa-wind' }
        ];

        // Load for categories grid (home page)
        if (categoriesContainer) {
            safeSetHTML(categoriesContainer, categories.map(category => `
                <div class="category-card" data-category="${category.id}">
                    <div class="category-icon">
                        <i class="${category.icon}"></i>
                    </div>
                    <h3>${category.name}</h3>
                    <p>Discover our amazing ${category.name.toLowerCase()} collection</p>
                </div>
            `).join(''));

            // Add click events to category cards
            document.querySelectorAll('.category-card').forEach(card => {
                card.addEventListener('click', () => {
                    const category = card.dataset.category;
                    window.location.href = `products.html?category=${category}`;
                });
            });
        }

        // Load for category filters (products page)
        if (categoryFilters) {
            safeSetHTML(categoryFilters, categories.map(category => `
                <label class="filter-option">
                    <input type="checkbox" class="category-filter" value="${category.id}" 
                           ${this.currentCategory === category.id ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    ${category.name}
                </label>
            `).join(''));

            // Re-attach event listeners after rendering
            document.querySelectorAll('.category-filter').forEach(filter => {
                filter.addEventListener('change', () => {
                    this.filterProducts();
                });
            });
        }
    }

    applyCategoryFilter(category) {
        this.currentCategory = category;
        
        // Update checkboxes
        document.querySelectorAll('.category-filter').forEach(checkbox => {
            checkbox.checked = checkbox.value === category;
        });
        
        this.filterProducts();
    }

    filterProducts() {
        let filtered = [...this.products];

        // Category filter
        const selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked'))
            .map(checkbox => checkbox.value);
        
        if (selectedCategories.length > 0) {
            filtered = filtered.filter(product => selectedCategories.includes(product.category));
            this.currentCategory = selectedCategories.length === 1 ? selectedCategories[0] : 'multiple';
        } else {
            this.currentCategory = 'all';
        }

        // Price filter
        const priceRange = document.getElementById('priceRange');
        if (priceRange) {
            const maxPrice = parseInt(priceRange.value);
            filtered = filtered.filter(product => product.price <= maxPrice);
        }

        // Discount filter
        const selectedDiscounts = Array.from(document.querySelectorAll('input[name="discount"]:checked'))
            .map(checkbox => parseInt(checkbox.value));
        
        if (selectedDiscounts.length > 0) {
            filtered = filtered.filter(product => 
                product.discount && selectedDiscounts.some(discount => product.discount >= discount)
            );
        }

        // Search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query) ||
                product.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        this.filteredProducts = filtered;
        this.currentPage = 1;
        this.sortProducts();
        this.displayProducts();
        this.updateURLParams();
        this.updateResultsCount();
    }

    clearFilters() {
        // Clear category filters
        document.querySelectorAll('.category-filter').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Clear price filter
        const priceRange = document.getElementById('priceRange');
        if (priceRange) {
            priceRange.value = 1000;
            this.updatePriceDisplay(1000);
        }

        // Clear discount filters
        document.querySelectorAll('input[name="discount"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Clear search
        this.searchQuery = '';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';

        this.currentCategory = 'all';
        this.filteredProducts = [...this.products];
        this.currentPage = 1;
        this.sortProducts();
        this.displayProducts();
        this.updateURLParams();
        this.updateResultsCount();

        // Close filters panel on mobile
        const filtersPanel = document.getElementById('filtersPanel');
        if (filtersPanel) {
            filtersPanel.classList.remove('active');
        }
    }

    sortProducts() {
        switch (this.currentSort) {
            case 'price-low':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'discount':
                this.filteredProducts.sort((a, b) => (b.discount || 0) - (a.discount || 0));
                break;
            case 'rating':
                this.filteredProducts.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                // Assuming newer products have higher IDs
                this.filteredProducts.sort((a, b) => parseInt(b.id) - parseInt(a.id));
                break;
            case 'featured':
            default:
                this.filteredProducts.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating);
                break;
        }
    }

    displayProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

        if (productsToShow.length === 0) {
            safeSetHTML(productsGrid, `
                <div class="no-products" style="grid-column: 1 / -1); text-align: center; padding: 60px 20px;">
                    <i class="fas fa-search" style="font-size: 64px; color: #e2e8f0; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--muted-text); margin-bottom: 10px;">No products found</h3>
                    <p style="color: var(--muted-text); margin-bottom: 20px;">Try adjusting your filters or search terms</p>
                    <button class="btn btn-primary" onclick="productsManager.clearFilters()">
                        Clear All Filters
                    </button>
                </div>
            `;
        } else {
            safeSetHTML(productsGrid, productsToShow.map(product => 
                this.createProductCard(product)
            ).join(''));

            // Add event listeners to product cards
            this.attachProductEventListeners();
        }

        // Update load more button
        this.updateLoadMoreButton();
        this.updateResultsCount();
    }

    createProductCard(product) {
        return window.nonaBeautyApp ? 
            window.nonaBeautyApp.createProductCard(product) : 
            this.createBasicProductCard(product);
    }

    createBasicProductCard(product) {
        const discountBadge = product.discount ? `
            <div class="product-badge">${product.discount}% OFF</div>
        ` : '';

        const originalPrice = product.originalPrice ? `
            <span class="original-price">${this.formatPrice(product.originalPrice)}</span>
        ` : '';

        // Create star rating
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
                    <i class="far fa-heart"></i>
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

    attachProductEventListeners() {
        // Use main app's event listeners if available
        if (window.nonaBeautyApp) {
            window.nonaBeautyApp.attachProductEventListeners();
            return;
        }

        // Fallback event listeners
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.closest('.add-to-cart').dataset.productId;
                this.addToCart(productId);
            });
        });

        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.closest('.view-details').dataset.productId;
                this.viewProductDetails(productId);
            });
        });

        document.querySelectorAll('.wishlist-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.closest('.wishlist-btn').dataset.productId;
                this.toggleWishlist(productId);
            });
        });
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            if (window.cartManager) {
                window.cartManager.addToCart(product);
            } else if (window.nonaBeautyApp) {
                window.nonaBeautyApp.addToCart(product);
            } else {
                this.showNotification('Product added to cart!', 'success');
            }
        }
    }

    viewProductDetails(productId) {
        // In a real app, this would navigate to product details page
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.showNotification(`Viewing details for: ${product.name}`, 'info');
            // window.location.href = `product-details.html?id=${productId}`;
        }
    }

    toggleWishlist(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            if (window.nonaBeautyApp) {
                window.nonaBeautyApp.toggleWishlist(product);
            } else {
                this.showNotification('Wishlist functionality requires main app', 'info');
            }
        }
    }

    loadMoreProducts() {
        this.currentPage++;
        this.displayProducts();
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn) return;

        const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
        
        if (this.currentPage >= totalPages || this.filteredProducts.length <= this.productsPerPage) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    updateResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            const startIndex = (this.currentPage - 1) * this.productsPerPage + 1;
            const endIndex = Math.min(this.currentPage * this.productsPerPage, this.filteredProducts.length);
            const total = this.filteredProducts.length;
            
            resultsCount.textContent = `Showing ${startIndex}-${endIndex} of ${total} products`;
        }
    }

    updatePriceDisplay(value) {
        const maxPrice = document.getElementById('maxPrice');
        if (maxPrice) {
            maxPrice.textContent = `${value} EGP`;
        }
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

    // Get featured products for home page
    getFeaturedProducts(limit = 6) {
        return this.products.filter(product => product.featured).slice(0, limit);
    }

    // Get products by category
    getProductsByCategory(category, limit = null) {
        const filtered = category === 'all' ? this.products : this.products.filter(product => product.category === category);
        return limit ? filtered.slice(0, limit) : filtered;
    }

    // Get products on sale
    getProductsOnSale(limit = null) {
        const filtered = this.products.filter(product => product.discount && product.discount > 0);
        return limit ? filtered.slice(0, limit) : filtered;
    }

    // Search products
    searchProducts(query) {
        if (!query) return this.products;
        
        const searchTerm = query.toLowerCase();
        return this.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }
}

// Initialize products manager
document.addEventListener('DOMContentLoaded', function() {
    window.productsManager = new ProductsManager();

    // Add products page specific styles
    if (!document.getElementById('productsStyles')) {
        const productsStyles = document.createElement('style');
        productsStyles.id = 'productsStyles';
        productsStyles.textContent = `
            .products-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                flex-wrap: wrap;
                gap: 20px;
            }

            .filters-section {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .filter-toggle {
                background: var(--white);
                border: 2px solid var(--primary-color);
                color: var(--primary-color);
                padding: 10px 20px;
                border-radius: var(--border-radius);
                cursor: pointer;
                font-weight: 500;
                transition: var(--transition);
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .filter-toggle:hover {
                background: var(--primary-color);
                color: white;
            }

            .sorting-section {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .sort-select {
                padding: 10px 15px;
                border: 2px solid #e1e5e9;
                border-radius: var(--border-radius);
                background: var(--white);
                font-size: 14px;
                cursor: pointer;
                min-width: 150px;
            }

            .filters-panel {
                background: var(--white);
                padding: 25px;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                margin-bottom: 30px;
                display: none;
            }

            .filters-panel.active {
                display: block;
            }

            .filter-group {
                margin-bottom: 25px;
            }

            .filter-group h4 {
                margin-bottom: 15px;
                color: var(--dark-text);
                font-size: 16px;
                font-weight: 600;
            }

            .filter-option {
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                padding: 8px 0;
                transition: var(--transition);
            }

            .filter-option:hover {
                color: var(--primary-color);
            }

            .price-filter {
                padding: 0 10px;
            }

            .price-values {
                display: flex;
                justify-content: space-between;
                margin-top: 10px;
                font-size: 14px;
                color: var(--muted-text);
            }

            .results-count {
                color: var(--muted-text);
                font-size: 14px;
                margin-bottom: 20px;
            }

            @media (max-width: 768px) {
                .products-controls {
                    flex-direction: column;
                    align-items: stretch;
                }

                .filters-section,
                .sorting-section {
                    width: 100%;
                    justify-content: space-between;
                }

                .filters-panel {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1000;
                    overflow-y: auto;
                    margin-bottom: 0;
                }
            }
        `;
        document.head.appendChild(productsStyles);
    }
});
[file content end]
