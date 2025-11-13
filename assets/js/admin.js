

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


class AdminPanel {
    constructor() {
        this.currentPage = 'dashboard';
        this.products = [];
        this.orders = [];
        this.customers = [];
        this.offers = [];
        this.tips = [];
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupNavigation();
        this.showPage('dashboard');
        this.loadDashboardStats();
        this.loadRecentOrders();
        this.checkAdminAccess();
    }

    checkAdminAccess() {
        const currentUser = safeGet('nonaBeautyUser');
        if (!currentUser || currentUser.role !== 'admin') {
            window.location.href = 'login.html';
            return;
        }
    }

    loadData() {
        // Load products
        const savedProducts = localStorage.getItem('nonaBeautyProducts');
        if (savedProducts) {
            this.products = JSON.parse(savedProducts);
        } else {
            this.loadDefaultProducts();
        }

        // Load orders
        const savedOrders = localStorage.getItem('nonaBeautyOrders');
        if (savedOrders) {
            this.orders = JSON.parse(savedOrders);
        } else {
            this.orders = [];
        }

        // Load customers
        const savedCustomers = localStorage.getItem('nonaBeautyUsers');
        if (savedCustomers) {
            this.customers = JSON.parse(savedCustomers).filter(user => user.role === 'customer');
        } else {
            this.customers = [];
        }

        // Load offers
        const savedOffers = localStorage.getItem('nonaBeautyOffers');
        if (savedOffers) {
            this.offers = JSON.parse(savedOffers);
        } else {
            this.offers = [];
        }

        // Load tips
        const savedTips = localStorage.getItem('nonaBeautyTips');
        if (savedTips) {
            this.tips = JSON.parse(savedTips);
        } else {
            this.tips = [];
        }
    }

    loadDefaultProducts() {
        this.products = [
            {
                id: '1',
                name: 'Sulfate-Free Shampoo 400ml',
                category: 'hair',
                price: 170,
                originalPrice: 200,
                discount: 15,
                image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d5b6?w=400',
                description: 'Gentle sulfate-free shampoo that cleanses without stripping natural oils.',
                rating: 4.5,
                reviewCount: 128,
                stock: 45,
                status: 'inStock',
                featured: true,
                tags: ['hair', 'shampoo', 'sulfate-free'],
                sku: 'NB1001'
            },
            {
                id: '2',
                name: 'Hydrating Face Serum',
                category: 'face',
                price: 350,
                originalPrice: 420,
                discount: 17,
                image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
                description: 'Powerful serum combining hyaluronic acid and niacinamide for glowing skin.',
                rating: 4.8,
                reviewCount: 89,
                stock: 23,
                status: 'inStock',
                featured: true,
                tags: ['face', 'serum', 'hydrating'],
                sku: 'NB4002'
            },
            {
                id: '3',
                name: 'Floral Elegance Perfume 50ml',
                category: 'perfumes',
                price: 400,
                originalPrice: 500,
                discount: 20,
                image: 'https://images.unsplash.com/photo-1590736969955-1d0c72c9b6b8?w=400',
                description: 'Elegant floral perfume with long-lasting fragrance.',
                rating: 4.7,
                reviewCount: 156,
                stock: 15,
                status: 'inStock',
                featured: false,
                tags: ['perfume', 'floral', 'elegance'],
                sku: 'NB5002'
            }
        ];
        this.saveProducts();
    }

    saveProducts() {
        sanitizeAndSet('nonaBeautyProducts', this.products);
    }

    saveOffers() {
        sanitizeAndSet('nonaBeautyOffers', this.offers);
    }

    saveTips() {
        sanitizeAndSet('nonaBeautyTips', this.tips);
    }

    setupEventListeners() {
        // Search functionality
        const adminSearch = document.getElementById('adminSearch');
        if (adminSearch) {
            adminSearch.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Sidebar toggle for mobile
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Logout
        const adminLogoutBtn = document.getElementById('adminLogout');
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Export buttons
        const exportProductsBtn = document.getElementById('exportProducts');
        if (exportProductsBtn) {
            exportProductsBtn.addEventListener('click', () => {
                this.exportProducts();
            });
        }

        const exportOrdersBtn = document.getElementById('exportOrders');
        if (exportOrdersBtn) {
            exportOrdersBtn.addEventListener('click', () => {
                this.exportOrders();
            });
        }
    }

    setupNavigation() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href').substring(1);
                this.showPage(page);
            });
        });

        // Add Product Button
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.openAddProductModal();
            });
        }

        // Add Offer Button
        const addOfferBtn = document.getElementById('addOfferBtn');
        if (addOfferBtn) {
            addOfferBtn.addEventListener('click', () => {
                this.openAddOfferModal();
            });
        }

        // Add Tip Button
        const addTipBtn = document.getElementById('addTipBtn');
        if (addTipBtn) {
            addTipBtn.addEventListener('click', () => {
                this.openAddTipModal();
            });
        }

        // Modal Controls
        this.setupModalEvents();
        
        // Filter events
        this.setupFilterEvents();
    }

    setupModalEvents() {
        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Save Product
        const saveProductBtn = document.getElementById('saveProduct');
        if (saveProductBtn) {
            saveProductBtn.addEventListener('click', () => {
                this.saveProduct();
            });
        }

        // Save Offer
        const saveOfferBtn = document.getElementById('saveOffer');
        if (saveOfferBtn) {
            saveOfferBtn.addEventListener('click', () => {
                this.saveOffer();
            });
        }

        // Save Tip
        const saveTipBtn = document.getElementById('saveTip');
        if (saveTipBtn) {
            saveTipBtn.addEventListener('click', () => {
                this.saveTip();
            });
        }

        // Cancel buttons
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Close on overlay click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    setupFilterEvents() {
        // Products filters
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filterProducts();
            });
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filterProducts();
            });
        }

        // Orders filters
        const orderStatusFilter = document.getElementById('orderStatusFilter');
        if (orderStatusFilter) {
            orderStatusFilter.addEventListener('change', () => {
                this.filterOrders();
            });
        }

        // Customers filters
        const customerStatusFilter = document.getElementById('customerStatusFilter');
        if (customerStatusFilter) {
            customerStatusFilter.addEventListener('change', () => {
                this.filterCustomers();
            });
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }

    showPage(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(pageEl => {
            pageEl.classList.remove('active');
        });

        // Show selected page
        const targetPage = document.getElementById(page);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${page}`) {
                link.classList.add('active');
            }
        });

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = this.getPageTitle(page);
        }

        // Load page-specific content
        this.loadPageContent(page);

        this.currentPage = page;
        
        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 768) {
            this.toggleSidebar();
        }
    }

    getPageTitle(page) {
        const titles = {
            dashboard: 'Dashboard',
            products: 'Products Management',
            categories: 'Categories',
            orders: 'Orders Management',
            customers: 'Customers Management',
            offers: 'Offers & Discounts',
            blog: 'Blog & Tips',
            settings: 'Settings'
        };
        return titles[page] || 'Dashboard';
    }

    loadPageContent(page) {
        switch (page) {
            case 'dashboard':
                this.loadDashboardStats();
                this.loadRecentOrders();
                this.loadSalesChart();
                this.loadTopProducts();
                break;
            case 'products':
                this.loadProductsTable();
                this.loadProductFilters();
                break;
            case 'categories':
                this.loadCategoriesTable();
                break;
            case 'orders':
                this.loadOrdersTable();
                this.loadOrderFilters();
                break;
            case 'customers':
                this.loadCustomersTable();
                this.loadCustomerFilters();
                break;
            case 'offers':
                this.loadOffersTable();
                break;
            case 'blog':
                this.loadBlogTable();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    loadDashboardStats() {
        const stats = {
            totalSales: this.calculateTotalSales(),
            totalOrders: this.orders.length,
            totalCustomers: this.customers.length,
            totalProducts: this.products.length,
            salesChange: '+12%',
            ordersChange: '+8%',
            customersChange: '+15%',
            productsChange: '+5%'
        };

        // Update stats cards
        this.updateStatCard('sales', stats.totalSales, stats.salesChange);
        this.updateStatCard('orders', stats.totalOrders, stats.ordersChange);
        this.updateStatCard('customers', stats.totalCustomers, stats.customersChange);
        this.updateStatCard('products', stats.totalProducts, stats.productsChange);
    }

    calculateTotalSales() {
        return this.orders.reduce((total, order) => total + order.total, 0);
    }

    updateStatCard(type, value, change) {
        const statNumber = document.querySelector(`.stat-icon.${type} + .stat-info .stat-number`);
        const statChange = document.querySelector(`.stat-icon.${type} + .stat-info .stat-change`);
        
        if (statNumber) {
            if (type === 'sales') {
                statNumber.textContent = `$${value.toLocaleString()}`;
            } else {
                statNumber.textContent = value.toLocaleString();
            }
        }
        
        if (statChange) {
            statChange.textContent = change;
            statChange.className = `stat-change ${change.startsWith('+') ? 'positive' : 'negative'}`;
        }
    }

    loadSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        // Sample data - in real app, this would come from API
        const data = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Sales',
                data: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 32000, 30000, 35000, 40000, 45000],
                borderColor: '#d63384',
                backgroundColor: 'rgba(214, 51, 132, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };

        // Destroy existing chart if it exists
        if (this.salesChart) {
            this.salesChart.destroy();
        }

        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    loadTopProducts() {
        const topProductsContainer = document.getElementById('topProducts');
        if (!topProductsContainer) return;

        // Get top products by sales (simulated)
        const topProducts = this.products.slice(0, 5).map((product, index) => ({
            ...product,
            sales: Math.floor(Math.random() * 100) + 50
        })).sort((a, b) => b.sales - a.sales);
        
        safeSetHTML(topProductsContainer, topProducts.map((product, index) => `
            <div class="product-rank">
                <span class="rank">${index + 1}</span>
                <div class="product-info">
                    <span class="product-name">${product.name}</span>
                    <span class="product-sales">${product.sales} sales</span>
                </div>
                <span class="product-revenue">$${(product.price * product.sales).toLocaleString()}</span>
            </div>
        `).join(''));
    }

    loadRecentOrders() {
        const ordersTable = document.getElementById('recentOrdersTable');
        if (!ordersTable) return;

        const recentOrders = this.orders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        if (recentOrders.length === 0) {
            safeSetHTML(ordersTable, `
                <tr>
                    <td colspan="6" class="text-center">No recent orders</td>
                </tr>
            `);
            return;
        }

        safeSetHTML(ordersTable, recentOrders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer.name}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>$${order.total}</td>
                <td><span class="status-badge status-${order.status}">${this.formatOrderStatus(order.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.viewOrder('${order.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="adminPanel.editOrder('${order.id}')">Edit</button>
                </td>
            </tr>
        `).join(''));
    }

    loadProductsTable() {
        const productsTable = document.getElementById('productsTable');
        if (!productsTable) return;

        if (this.products.length === 0) {
            safeSetHTML(productsTable, `
                <tr>
                    <td colspan="8" class="text-center">No products found</td>
                </tr>
            `);
            return;
        }

        safeSetHTML(productsTable, this.products.map(product => `
            <tr>
                <td>
                    <img src="${product.image}" alt="${product.name}" class="product-image-small" 
                         onerror="this.src='https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100'">
                </td>
                <td>${product.name}</td>
                <td>${this.getCategoryName(product.category)}</td>
                <td>
                    $${product.price}
                    ${product.originalPrice ? `<br><small class="text-muted"><del>$${product.originalPrice}</del></small>` : ''}
                </td>
                <td>
                    ${product.discount ? `<span class="discount-badge">${product.discount}% OFF</span>` : 'No discount'}
                </td>
                <td>${product.stock}</td>
                <td>
                    <span class="status-badge status-${product.status}">
                        ${this.formatProductStatus(product.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join(''));
    }

    loadProductFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            const categories = ['hair', 'face', 'lips', 'body', 'perfumes'];
            safeSetHTML(categoryFilter, `
                <option value="all">All Categories</option>
                ${categories.map(category => `
                    <option value="${category}">${this.getCategoryName(category)}</option>
                `).join('')}
            `);
        }
    }

    loadOrdersTable() {
        const ordersTable = document.getElementById('ordersTable');
        if (!ordersTable) return;

        if (this.orders.length === 0) {
            safeSetHTML(ordersTable, `
                <tr>
                    <td colspan="7" class="text-center">No orders found</td>
                </tr>
            `);
            return;
        }

        safeSetHTML(ordersTable, this.orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer.name}</td>
                <td>${order.customer.email}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>$${order.total}</td>
                <td><span class="status-badge status-${order.status}">${this.formatOrderStatus(order.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="adminPanel.editOrder('${order.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join(''));
    }

    loadOrderFilters() {
        const statusFilter = document.getElementById('orderStatusFilter');
        if (statusFilter) {
            const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
            safeSetHTML(statusFilter, `
                <option value="all">All Status</option>
                ${statuses.map(status => `
                    <option value="${status}">${this.formatOrderStatus(status)}</option>
                `).join('')}
            `);
        }
    }

    loadCustomersTable() {
        const customersTable = document.getElementById('customersTable');
        if (!customersTable) return;

        if (this.customers.length === 0) {
            safeSetHTML(customersTable, `
                <tr>
                    <td colspan="6" class="text-center">No customers found</td>
                </tr>
            `);
            return;
        }

        safeSetHTML(customersTable, this.customers.map(customer => `
            <tr>
                <td>
                    <div class="customer-avatar">
                        ${customer.name.charAt(0).toUpperCase()}
                    </div>
                </td>
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.phone}</td>
                <td>${new Date(customer.createdAt).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge status-${customer.isActive ? 'active' : 'inactive'}">
                        ${customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
            </tr>
        `).join(''));
    }

    loadCustomerFilters() {
        const statusFilter = document.getElementById('customerStatusFilter');
        if (statusFilter) {
            safeSetHTML(statusFilter, `
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            `);
        }
    }

    loadOffersTable() {
        const offersTable = document.getElementById('offersTable');
        if (!offersTable) return;

        if (this.offers.length === 0) {
            safeSetHTML(offersTable, `
                <tr>
                    <td colspan="7" class="text-center">No offers found</td>
                </tr>
            `);
            return;
        }

        safeSetHTML(offersTable, this.offers.map(offer => `
            <tr>
                <td>${offer.title}</td>
                <td>${this.getCategoryName(offer.category)}</td>
                <td>
                    ${offer.type === 'percentage' ? `${offer.discount}% OFF` : 
                      offer.type === 'bogo' ? 'Buy 2 Get 1 Free' : 
                      offer.type === 'shipping' ? 'Free Shipping' : 'Special Offer'}
                </td>
                <td>${new Date(offer.startDate).toLocaleDateString()}</td>
                <td>${new Date(offer.endDate).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge status-${offer.isActive ? 'active' : 'inactive'}">
                        ${offer.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editOffer('${offer.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteOffer('${offer.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join(''));
    }

    loadBlogTable() {
        const blogTable = document.getElementById('blogTable');
        if (!blogTable) return;

        if (this.tips.length === 0) {
            safeSetHTML(blogTable, `
                <tr>
                    <td colspan="6" class="text-center">No blog posts found</td>
                </tr>
            `);
            return;
        }

        safeSetHTML(blogTable, this.tips.map(tip => `
            <tr>
                <td>${tip.title}</td>
                <td>${this.getCategoryName(tip.category)}</td>
                <td>${tip.author}</td>
                <td>${new Date(tip.publishDate).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge status-${tip.featured ? 'featured' : 'normal'}">
                        ${tip.featured ? 'Featured' : 'Normal'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editTip('${tip.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteTip('${tip.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join(''));
    }

    loadCategoriesTable() {
        const categoriesTable = document.getElementById('categoriesTable');
        if (!categoriesTable) return;

        const categories = [
            { id: 'hair', name: 'Hair Care', productCount: this.products.filter(p => p.category === 'hair').length },
            { id: 'face', name: 'Skin Care', productCount: this.products.filter(p => p.category === 'face').length },
            { id: 'lips', name: 'Lip Products', productCount: this.products.filter(p => p.category === 'lips').length },
            { id: 'body', name: 'Body Care', productCount: this.products.filter(p => p.category === 'body').length },
            { id: 'perfumes', name: 'Perfumes', productCount: this.products.filter(p => p.category === 'perfumes').length }
        ];

        safeSetHTML(categoriesTable, categories.map(category => `
            <tr>
                <td>${category.name}</td>
                <td>${category.productCount} products</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editCategory('${category.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteCategory('${category.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join(''));
    }

    loadSettings() {
        // Load settings form data
        const storeName = document.getElementById('storeName');
        const storeEmail = document.getElementById('storeEmail');
        const storePhone = document.getElementById('storePhone');
        const storeAddress = document.getElementById('storeAddress');

        if (storeName) storeName.value = 'Nona Beauty';
        if (storeEmail) storeEmail.value = 'info@nonabeauty.com';
        if (storePhone) storePhone.value = '+1 (555) 123-4567';
        if (storeAddress) storeAddress.value = '123 Beauty Street, New York, NY 10001';
    }

    // Product Management
    openAddProductModal() {
        this.openModal('addProductModal');
        this.resetProductForm();
    }

    resetProductForm() {
        const form = document.getElementById('productForm');
        if (form) {
            form.reset();
            document.querySelector('#addProductModal .modal-header h3').textContent = 'Add New Product';
            document.getElementById('saveProduct').textContent = 'Add Product';
            document.getElementById('productId').value = '';
        }
    }

    saveProduct() {
        const form = document.getElementById('productForm');
        if (!form) return;

        const productId = document.getElementById('productId').value;
        const formData = new FormData(form);
        
        const productData = {
            id: productId || 'product_' + Date.now(),
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            originalPrice: document.getElementById('productOriginalPrice').value ? 
                          parseFloat(document.getElementById('productOriginalPrice').value) : null,
            discount: document.getElementById('productDiscount').value ? 
                     parseInt(document.getElementById('productDiscount').value) : null,
            stock: parseInt(document.getElementById('productStock').value),
            description: document.getElementById('productDescription').value,
            image: document.getElementById('productImage').value || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
            status: document.getElementById('productStatus').value,
            featured: document.getElementById('productFeatured').checked,
            tags: document.getElementById('productTags').value.split(',').map(tag => tag.trim()),
            sku: document.getElementById('productSKU').value || 'NB' + Date.now().toString().slice(-6),
            rating: 4.5,
            reviewCount: 0
        };

        if (productId) {
            // Update existing product
            const index = this.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                this.products[index] = { ...this.products[index], ...productData };
            }
        } else {
            // Add new product
            this.products.push(productData);
        }

        this.saveProducts();
        this.loadProductsTable();
        this.closeModal();
        this.showNotification(`Product ${productId ? 'updated' : 'added'} successfully!`, 'success');
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.openModal('addProductModal');
            
            // Populate form with product data
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productOriginalPrice').value = product.originalPrice || '';
            document.getElementById('productDiscount').value = product.discount || '';
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productImage').value = product.image;
            document.getElementById('productStatus').value = product.status;
            document.getElementById('productFeatured').checked = product.featured;
            document.getElementById('productTags').value = product.tags ? product.tags.join(', ') : '';
            document.getElementById('productSKU').value = product.sku || '';

            document.querySelector('#addProductModal .modal-header h3').textContent = 'Edit Product';
            document.getElementById('saveProduct').textContent = 'Update Product';
        }
    }

    deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            this.products = this.products.filter(p => p.id !== productId);
            this.saveProducts();
            this.loadProductsTable();
            this.showNotification('Product deleted successfully!', 'success');
        }
    }

    // Offer Management
    openAddOfferModal() {
        this.openModal('addOfferModal');
        this.resetOfferForm();
    }

    resetOfferForm() {
        const form = document.getElementById('offerForm');
        if (form) {
            form.reset();
            document.querySelector('#addOfferModal .modal-header h3').textContent = 'Add New Offer';
            document.getElementById('saveOffer').textContent = 'Add Offer';
            document.getElementById('offerId').value = '';
        }
    }

    saveOffer() {
        const form = document.getElementById('offerForm');
        if (!form) return;

        const offerId = document.getElementById('offerId').value;
        
        const offerData = {
            id: offerId || 'offer_' + Date.now(),
            title: document.getElementById('offerTitle').value,
            description: document.getElementById('offerDescription').value,
            discount: parseInt(document.getElementById('offerDiscount').value),
            type: document.getElementById('offerType').value,
            category: document.getElementById('offerCategory').value,
            startDate: document.getElementById('offerStartDate').value,
            endDate: document.getElementById('offerEndDate').value,
            isActive: document.getElementById('offerActive').checked,
            featured: document.getElementById('offerFeatured').checked,
            image: document.getElementById('offerImage').value || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
            terms: document.getElementById('offerTerms').value,
            products: []
        };

        if (offerId) {
            // Update existing offer
            const index = this.offers.findIndex(o => o.id === offerId);
            if (index !== -1) {
                this.offers[index] = { ...this.offers[index], ...offerData };
            }
        } else {
            // Add new offer
            this.offers.push(offerData);
        }

        this.saveOffers();
        this.loadOffersTable();
        this.closeModal();
        this.showNotification(`Offer ${offerId ? 'updated' : 'added'} successfully!`, 'success');
    }

    editOffer(offerId) {
        const offer = this.offers.find(o => o.id === offerId);
        if (offer) {
            this.openModal('addOfferModal');
            
            // Populate form with offer data
            document.getElementById('offerId').value = offer.id;
            document.getElementById('offerTitle').value = offer.title;
            document.getElementById('offerDescription').value = offer.description;
            document.getElementById('offerDiscount').value = offer.discount;
            document.getElementById('offerType').value = offer.type;
            document.getElementById('offerCategory').value = offer.category;
            document.getElementById('offerStartDate').value = offer.startDate;
            document.getElementById('offerEndDate').value = offer.endDate;
            document.getElementById('offerActive').checked = offer.isActive;
            document.getElementById('offerFeatured').checked = offer.featured;
            document.getElementById('offerImage').value = offer.image;
            document.getElementById('offerTerms').value = offer.terms;

            document.querySelector('#addOfferModal .modal-header h3').textContent = 'Edit Offer';
            document.getElementById('saveOffer').textContent = 'Update Offer';
        }
    }

    deleteOffer(offerId) {
        if (confirm('Are you sure you want to delete this offer?')) {
            this.offers = this.offers.filter(o => o.id !== offerId);
            this.saveOffers();
            this.loadOffersTable();
            this.showNotification('Offer deleted successfully!', 'success');
        }
    }

    // Tip Management
    openAddTipModal() {
        this.openModal('addTipModal');
        this.resetTipForm();
    }

    resetTipForm() {
        const form = document.getElementById('tipForm');
        if (form) {
            form.reset();
            document.querySelector('#addTipModal .modal-header h3').textContent = 'Add New Tip';
            document.getElementById('saveTip').textContent = 'Add Tip';
            document.getElementById('tipId').value = '';
        }
    }

    saveTip() {
        const form = document.getElementById('tipForm');
        if (!form) return;

        const tipId = document.getElementById('tipId').value;
        
        const tipData = {
            id: tipId || 'tip_' + Date.now(),
            title: document.getElementById('tipTitle').value,
            excerpt: document.getElementById('tipExcerpt').value,
            content: document.getElementById('tipContent').value,
            category: document.getElementById('tipCategory').value,
            author: document.getElementById('tipAuthor').value,
            publishDate: document.getElementById('tipPublishDate').value,
            readTime: document.getElementById('tipReadTime').value,
            image: document.getElementById('tipImage').value || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
            featured: document.getElementById('tipFeatured').checked,
            tags: document.getElementById('tipTags').value.split(',').map(tag => tag.trim())
        };

        if (tipId) {
            // Update existing tip
            const index = this.tips.findIndex(t => t.id === tipId);
            if (index !== -1) {
                this.tips[index] = { ...this.tips[index], ...tipData };
            }
        } else {
            // Add new tip
            this.tips.push(tipData);
        }

        this.saveTips();
        this.loadBlogTable();
        this.closeModal();
        this.showNotification(`Tip ${tipId ? 'updated' : 'added'} successfully!`, 'success');
    }

    editTip(tipId) {
        const tip = this.tips.find(t => t.id === tipId);
        if (tip) {
            this.openModal('addTipModal');
            
            // Populate form with tip data
            document.getElementById('tipId').value = tip.id;
            document.getElementById('tipTitle').value = tip.title;
            document.getElementById('tipExcerpt').value = tip.excerpt;
            document.getElementById('tipContent').value = tip.content;
            document.getElementById('tipCategory').value = tip.category;
            document.getElementById('tipAuthor').value = tip.author;
            document.getElementById('tipPublishDate').value = tip.publishDate;
            document.getElementById('tipReadTime').value = tip.readTime;
            document.getElementById('tipImage').value = tip.image;
            document.getElementById('tipFeatured').checked = tip.featured;
            document.getElementById('tipTags').value = tip.tags ? tip.tags.join(', ') : '';

            document.querySelector('#addTipModal .modal-header h3').textContent = 'Edit Tip';
            document.getElementById('saveTip').textContent = 'Update Tip';
        }
    }

    deleteTip(tipId) {
        if (confirm('Are you sure you want to delete this tip?')) {
            this.tips = this.tips.filter(t => t.id !== tipId);
            this.saveTips();
            this.loadBlogTable();
            this.showNotification('Tip deleted successfully!', 'success');
        }
    }

    // Utility Methods
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    getCategoryName(categoryId) {
        const categories = {
            hair: 'Hair Care',
            face: 'Skin Care',
            lips: 'Lip Products',
            body: 'Body Care',
            perfumes: 'Perfumes',
            skincare: 'Skincare',
            haircare: 'Haircare',
            makeup: 'Makeup',
            wellness: 'Wellness',
            seasonal: 'Seasonal Care',
            all: 'All Categories'
        };
        return categories[categoryId] || categoryId;
    }

    formatProductStatus(status) {
        const statusMap = {
            inStock: 'In Stock',
            outOfStock: 'Out of Stock',
            onSale: 'On Sale'
        };
        return statusMap[status] || status;
    }

    formatOrderStatus(status) {
        const statusMap = {
            pending: 'Pending',
            confirmed: 'Confirmed',
            processing: 'Processing',
            shipped: 'Shipped',
            delivered: 'Delivered',
            cancelled: 'Cancelled'
        };
        return statusMap[status] || status;
    }

    filterProducts() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        let filteredProducts = this.products;

        if (categoryFilter !== 'all') {
            filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
        }

        if (statusFilter !== 'all') {
            filteredProducts = filteredProducts.filter(product => product.status === statusFilter);
        }

        this.displayFilteredProducts(filteredProducts);
    }

    displayFilteredProducts(products) {
        const productsTable = document.getElementById('productsTable');
        if (!productsTable) return;

        if (products.length === 0) {
            safeSetHTML(productsTable, `
                <tr>
                    <td colspan="8" class="text-center">No products match the selected filters</td>
                </tr>
            `);
            return;
        }

        safeSetHTML(productsTable, products.map(product => `
            <tr>
                <td>
                    <img src="${product.image}" alt="${product.name}" class="product-image-small">
                </td>
                <td>${product.name}</td>
                <td>${this.getCategoryName(product.category)}</td>
                <td>
                    $${product.price}
                    ${product.originalPrice ? `<br><small class="text-muted"><del>$${product.originalPrice}</del></small>` : ''}
                </td>
                <td>
                    ${product.discount ? `<span class="discount-badge">${product.discount}% OFF</span>` : 'No discount'}
                </td>
                <td>${product.stock}</td>
                <td>
                    <span class="status-badge status-${product.status}">
                        ${this.formatProductStatus(product.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join(''));
    }

    filterOrders() {
        const statusFilter = document.getElementById('orderStatusFilter').value;

        let filteredOrders = this.orders;

        if (statusFilter !== 'all') {
            filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
        }

        this.displayFilteredOrders(filteredOrders);
    }

    displayFilteredOrders(orders) {
        const ordersTable = document.getElementById('ordersTable');
        if (!ordersTable) return;

        if (orders.length === 0) {
            safeSetHTML(ordersTable, `
                <tr>
                    <td colspan="7" class="text-center">No orders match the selected filters</td>
                </tr>
            `);
            return;
        }

        safeSetHTML(ordersTable, orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer.name}</td>
                <td>${order.customer.email}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>$${order.total}</td>
                <td><span class="status-badge status-${order.status}">${this.formatOrderStatus(order.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="adminPanel.editOrder('${order.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join(''));
    }

    filterCustomers() {
        const statusFilter = document.getElementById('customerStatusFilter').value;

        let filteredCustomers = this.customers;

        if (statusFilter !== 'all') {
            filteredCustomers = filteredCustomers.filter(customer => 
                (statusFilter === 'active' && customer.isActive) ||
                (statusFilter === 'inactive' && !customer.isActive)
            );
        }

        this.displayFilteredCustomers(filteredCustomers);
    }

    displayFilteredCustomers(customers) {
        const customersTable = document.getElementById('customersTable');
        if (!customersTable) return;

        if (customers.length === 0) {
            safeSetHTML(customersTable, `
                <tr>
                    <td colspan="6" class="text-center">No customers match the selected filters</td>
                </tr>
            `);
            return;
        }

        safeSetHTML(customersTable, customers.map(customer => `
            <tr>
                <td>
                    <div class="customer-avatar">
                        ${customer.name.charAt(0).toUpperCase()}
                    </div>
                </td>
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.phone}</td>
                <td>${new Date(customer.createdAt).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge status-${customer.isActive ? 'active' : 'inactive'}">
                        ${customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
            </tr>
        `).join(''));
    }

    handleSearch(query) {
        if (this.currentPage === 'products') {
            const filteredProducts = this.products.filter(product =>
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                product.category.toLowerCase().includes(query.toLowerCase()) ||
                product.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
            );
            this.displayFilteredProducts(filteredProducts);
        } else if (this.currentPage === 'orders') {
            const filteredOrders = this.orders.filter(order =>
                order.customer.name.toLowerCase().includes(query.toLowerCase()) ||
                order.customer.email.toLowerCase().includes(query.toLowerCase()) ||
                order.id.toLowerCase().includes(query.toLowerCase())
            );
            this.displayFilteredOrders(filteredOrders);
        } else if (this.currentPage === 'customers') {
            const filteredCustomers = this.customers.filter(customer =>
                customer.name.toLowerCase().includes(query.toLowerCase()) ||
                customer.email.toLowerCase().includes(query.toLowerCase())
            );
            this.displayFilteredCustomers(filteredCustomers);
        }
    }

    exportProducts() {
        const dataStr = JSON.stringify(this.products, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'nona-beauty-products.json';
        link.click();
        URL.revokeObjectURL(url);
        this.showNotification('Products exported successfully!', 'success');
    }

    exportOrders() {
        const dataStr = JSON.stringify(this.orders, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'nona-beauty-orders.json';
        link.click();
        URL.revokeObjectURL(url);
        this.showNotification('Orders exported successfully!', 'success');
    }

    viewOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            this.showNotification(`Viewing order: ${orderId}`, 'info');
            // In a real app, you would show order details in a modal or separate page
        }
    }

    editOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            this.showNotification(`Editing order: ${orderId}`, 'info');
            // In a real app, you would open an order edit form
        }
    }

    editCategory(categoryId) {
        this.showNotification(`Editing category: ${this.getCategoryName(categoryId)}`, 'info');
    }

    deleteCategory(categoryId) {
        if (confirm('Are you sure you want to delete this category? Products in this category will not be deleted.')) {
            this.showNotification(`Category ${this.getCategoryName(categoryId)} deleted`, 'success');
        }
    }

    logout() {
        localStorage.removeItem('nonaBeautyUser');
        window.location.href = 'login.html';
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.admin-notification').forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = `admin-notification notification-${type}`;
        safeSetHTML(notification, `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `);

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#d63384'};
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

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.adminPanel = new AdminPanel();
});
