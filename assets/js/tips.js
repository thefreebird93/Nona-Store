

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


class TipsManager {
    constructor() {
        this.tips = [];
        this.filteredTips = [];
        this.currentCategory = 'all';
        this.currentPage = 1;
        this.tipsPerPage = 6;
        this.init();
    }

    init() {
        this.loadTips();
        this.setupEventListeners();
        this.displayTips();
        this.loadFeaturedArticle();
        this.loadPopularTips();
        this.setupCategoryNavigation();
    }

    loadTips() {
        // Try to load from localStorage first, then from JSON data
        const savedTips = localStorage.getItem('nonaBeautyTips');
        
        if (savedTips) {
            this.tips = JSON.parse(savedTips);
        } else {
            this.tips = this.getDefaultTips();
            this.saveTips();
        }

        this.filteredTips = [...this.tips];
    }

    getDefaultTips() {
        return [
            {
                id: '1',
                title: 'The Ultimate Daily Skincare Routine',
                excerpt: 'Discover the essential steps for maintaining healthy, glowing skin every day. Learn how to build a routine that works for your skin type.',
                content: `A consistent skincare routine is the foundation of healthy, radiant skin. Here's your step-by-step guide to the perfect daily routine:

                ## Morning Routine:
                1. **Cleanser**: Start with a gentle cleanser to remove overnight impurities
                2. **Toner**: Balance your skin's pH levels
                3. **Serum**: Apply targeted treatment for your skin concerns
                4. **Moisturizer**: Hydrate and protect your skin
                5. **Sunscreen**: Essential for preventing sun damage

                ## Evening Routine:
                1. **Double Cleanse**: Remove makeup and sunscreen first
                2. **Exfoliate**: 2-3 times per week for smooth skin
                3. **Treatment**: Use retinol or other active ingredients
                4. **Moisturize**: Repair and hydrate overnight

                Remember to choose products suitable for your skin type and be consistent with your routine!`,
                category: 'skincare',
                author: 'Dr. Emily Chen',
                publishDate: '2024-01-15',
                readTime: '8 min',
                image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600',
                featured: true,
                tags: ['skincare', 'routine', 'daily', 'basics', 'beauty'],
                products: ['2', '4', '6'],
                views: 1245,
                likes: 89
            },
            {
                id: '2',
                title: 'Winter Skincare: Protecting Your Skin in Cold Weather',
                excerpt: 'Learn how to adapt your skincare routine for the harsh winter months and keep your skin hydrated and healthy.',
                content: 'Winter weather can be particularly challenging for your skin. The cold air and low humidity can lead to dryness and irritation...',
                category: 'skincare',
                author: 'Dr. Sarah Mitchell',
                publishDate: '2023-12-10',
                readTime: '6 min',
                image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600',
                featured: false,
                tags: ['winter', 'skincare', 'dryness', 'protection', 'seasonal'],
                products: ['3', '5'],
                views: 892,
                likes: 67
            },
            {
                id: '3',
                title: '5 Natural Ingredients for Hair Growth',
                excerpt: 'Boost your hair growth with these powerful natural ingredients that promote healthy, strong hair.',
                content: 'If you\'re looking to promote healthy hair growth, nature has some amazing solutions. Here are five natural ingredients that can help...',
                category: 'haircare',
                author: 'James Wilson',
                publishDate: '2023-11-28',
                readTime: '5 min',
                image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600',
                featured: false,
                tags: ['haircare', 'growth', 'natural', 'ingredients', 'healthy'],
                products: ['1', '6'],
                views: 756,
                likes: 54
            },
            {
                id: '4',
                title: 'The 5-Minute Makeup Routine for Busy Mornings',
                excerpt: 'Look polished and put together even when you\'re short on time with this quick and effective makeup routine.',
                content: 'Mornings can be hectic, but that doesn\'t mean you have to skip makeup altogether. This 5-minute routine will have you looking fresh...',
                category: 'makeup',
                author: 'Maria Rodriguez',
                publishDate: '2023-11-15',
                readTime: '4 min',
                image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600',
                featured: false,
                tags: ['makeup', 'quick', 'routine', 'morning', 'easy'],
                products: ['7', '8'],
                views: 1123,
                likes: 78
            },
            {
                id: '5',
                title: 'Understanding Your Skin Type: A Complete Guide',
                excerpt: 'Learn how to identify your skin type and choose the right products for your specific needs.',
                content: 'Knowing your skin type is the first step toward building an effective skincare routine. Here\'s how to identify yours...',
                category: 'skincare',
                author: 'Dr. Emily Chen',
                publishDate: '2023-11-05',
                readTime: '7 min',
                image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600',
                featured: false,
                tags: ['skincare', 'types', 'guide', 'basics', 'diagnosis'],
                products: ['2', '3', '4'],
                views: 1345,
                likes: 92
            },
            {
                id: '6',
                title: 'The Benefits of Double Cleansing',
                excerpt: 'Why this Korean beauty technique is essential for clear, healthy skin and how to do it properly.',
                content: 'Double cleansing might sound like extra work, but it\'s a game-changer for your skincare routine. Here\'s why you should consider it...',
                category: 'skincare',
                author: 'Maria Rodriguez',
                publishDate: '2023-10-20',
                readTime: '5 min',
                image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
                featured: false,
                tags: ['cleansing', 'k-beauty', 'routine', 'deep-clean', 'technique'],
                products: ['2', '9'],
                views: 987,
                likes: 65
            },
            {
                id: '7',
                title: 'Essential Haircare Tips for Damaged Hair',
                excerpt: 'Restore and repair damaged hair with these proven techniques and product recommendations.',
                content: 'Damaged hair requires special care and attention. Learn how to restore your hair\'s health and vitality...',
                category: 'haircare',
                author: 'James Wilson',
                publishDate: '2023-10-15',
                readTime: '6 min',
                image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d5b6?w=600',
                featured: false,
                tags: ['haircare', 'repair', 'damaged', 'restoration', 'treatment'],
                products: ['1', '6', '10'],
                views: 834,
                likes: 47
            },
            {
                id: '8',
                title: 'Creating the Perfect Nighttime Skincare Routine',
                excerpt: 'Maximize your skin\'s repair process overnight with this effective nighttime routine.',
                content: 'Your skin does most of its repairing while you sleep. Make the most of this time with the right nighttime routine...',
                category: 'skincare',
                author: 'Dr. Emily Chen',
                publishDate: '2023-10-10',
                readTime: '5 min',
                image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600',
                featured: false,
                tags: ['skincare', 'night', 'routine', 'repair', 'overnight'],
                products: ['2', '7', '9'],
                views: 765,
                likes: 58
            }
        ];
    }

    saveTips() {
        sanitizeAndSet('nonaBeautyTips', this.tips);
    }

    setupEventListeners() {
        // Category filters
        const categoryLinks = document.querySelectorAll('.category-link');
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = e.target.dataset.category;
                this.filterByCategory(category);
                
                // Update active link
                categoryLinks.forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreTips');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreTips();
            });
        }

        // Newsletter form
        const newsletterForm = document.querySelector('.sidebar-newsletter');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSignup(newsletterForm);
            });
        }

        // Read more links
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('read-more') || e.target.closest('.read-more')) {
                e.preventDefault();
                const tipCard = e.target.closest('.tip-card');
                if (tipCard) {
                    const tipId = tipCard.dataset.tipId;
                    this.readTip(tipId);
                }
            }
        });

        // Featured article read more
        const featuredReadMore = document.querySelector('.featured-article .btn');
        if (featuredReadMore) {
            featuredReadMore.addEventListener('click', (e) => {
                e.preventDefault();
                const featuredTip = this.tips.find(tip => tip.featured);
                if (featuredTip) {
                    this.readTip(featuredTip.id);
                }
            });
        }
    }

    setupCategoryNavigation() {
        // Handle URL parameters for category filtering
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        
        if (category && this.isValidCategory(category)) {
            this.filterByCategory(category);
            
            // Update active category link
            document.querySelectorAll('.category-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.category === category) {
                    link.classList.add('active');
                }
            });
        }
    }

    isValidCategory(category) {
        const validCategories = ['all', 'skincare', 'haircare', 'makeup', 'wellness', 'seasonal'];
        return validCategories.includes(category);
    }

    loadFeaturedArticle() {
        const featuredArticle = this.tips.find(tip => tip.featured);
        if (featuredArticle) {
            this.displayFeaturedArticle(featuredArticle);
        }
    }

    displayFeaturedArticle(article) {
        const featuredArticle = document.querySelector('.featured-article');
        if (!featuredArticle) return;

        safeSetHTML(featuredArticle, `
            <div class="article-image">
                <img src="${article.image}" alt="${article.title}">
                <div class="article-badge">Featured</div>
            </div>
            <div class="article-content">
                <span class="article-category">${this.getCategoryName(article.category)}</span>
                <h2>${article.title}</h2>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-meta">
                    <span class="author">By ${article.author}</span>
                    <span class="date">${new Date(article.publishDate).toLocaleDateString()}</span>
                    <span class="read-time">${article.readTime}</span>
                </div>
                <div class="article-stats">
                    <span class="views"><i class="fas fa-eye"></i> ${article.views} views</span>
                    <span class="likes"><i class="fas fa-heart"></i> ${article.likes} likes</span>
                </div>
                <button class="btn btn-primary read-featured" data-tip-id="${article.id}">
                    Read Full Article
                </button>
            </div>
        `);

        // Add event listener to featured article button
        const readButton = featuredArticle.querySelector('.read-featured');
        if (readButton) {
            readButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.readTip(article.id);
            });
        }
    }

    filterByCategory(category) {
        this.currentCategory = category;
        this.currentPage = 1;

        if (category === 'all') {
            this.filteredTips = [...this.tips];
        } else {
            this.filteredTips = this.tips.filter(tip => tip.category === category);
        }

        this.displayTips();
        this.updateURL(category);
    }

    displayTips() {
        const tipsGrid = document.getElementById('tipsGrid');
        if (!tipsGrid) return;

        const startIndex = (this.currentPage - 1) * this.tipsPerPage;
        const endIndex = startIndex + this.tipsPerPage;
        const tipsToShow = this.filteredTips.slice(startIndex, endIndex);

        if (tipsToShow.length === 0) {
            safeSetHTML(tipsGrid, `
                <div class="no-tips" style="grid-column: 1 / -1); text-align: center; padding: 60px 20px;">
                    <i class="fas fa-newspaper" style="font-size: 64px; color: #e2e8f0; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--muted-text); margin-bottom: 10px;">No tips found</h3>
                    <p style="color: var(--muted-text);">Try selecting a different category</p>
                </div>
            `;
        } else {
            safeSetHTML(tipsGrid, tipsToShow.map(tip => this.createTipCard(tip)).join(''));
        }

        // Update load more button
        this.updateLoadMoreButton();
        this.updateResultsCount();
    }

    createTipCard(tip) {
        const isFeatured = tip.featured;
        const featuredClass = isFeatured ? 'featured' : '';

        return `
            <article class="tip-card ${featuredClass}" data-tip-id="${tip.id}">
                <div class="tip-image">
                    <img src="${tip.image}" alt="${tip.title}">
                    <div class="tip-category">${this.getCategoryName(tip.category)}</div>
                    ${isFeatured ? '<div class="featured-badge">Featured</div>' : ''}
                    <div class="tip-overlay">
                        <button class="btn btn-primary read-more">Read Article</button>
                    </div>
                </div>
                <div class="tip-content">
                    <h3>${tip.title}</h3>
                    <p class="tip-excerpt">${tip.excerpt}</p>
                    <div class="tip-meta">
                        <span class="author">
                            <i class="fas fa-user"></i>
                            ${tip.author}
                        </span>
                        <span class="date">
                            <i class="fas fa-calendar"></i>
                            ${new Date(tip.publishDate).toLocaleDateString()}
                        </span>
                        <span class="read-time">
                            <i class="fas fa-clock"></i>
                            ${tip.readTime}
                        </span>
                    </div>
                    <div class="tip-stats">
                        <span class="views"><i class="fas fa-eye"></i> ${tip.views}</span>
                        <span class="likes"><i class="fas fa-heart"></i> ${tip.likes}</span>
                    </div>
                    <div class="tip-tags">
                        ${tip.tags.slice(0, 3).map(tag => `
                            <span class="tag">${tag}</span>
                        `).join('')}
                    </div>
                </div>
            </article>
        `;
    }

    loadPopularTips() {
        const popularTipsContainer = document.querySelector('.popular-tips');
        if (!popularTipsContainer) return;

        const popularTips = [...this.tips]
            .sort((a, b) => b.views - a.views)
            .slice(0, 3);

        safeSetHTML(popularTipsContainer, popularTips.map(tip => `
            <div class="popular-tip" data-tip-id="${tip.id}">
                <div class="tip-image">
                    <img src="${tip.image}" alt="${tip.title}">
                </div>
                <div class="tip-content">
                    <h4>${tip.title}</h4>
                    <div class="tip-meta">
                        <span class="tip-date">${new Date(tip.publishDate).toLocaleDateString()}</span>
                        <span class="tip-views">${tip.views} views</span>
                    </div>
                </div>
            </div>
        `).join(''));

        // Add click events to popular tips
        popularTipsContainer.querySelectorAll('.popular-tip').forEach(tip => {
            tip.addEventListener('click', () => {
                const tipId = tip.dataset.tipId;
                this.readTip(tipId);
            });
        });
    }

    readTip(tipId) {
        const tip = this.tips.find(t => t.id === tipId);
        if (tip) {
            // Increment views
            tip.views++;
            this.saveTips();
            
            // Show tip details in modal
            this.showTipModal(tip);
        }
    }

    showTipModal(tip) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        safeSetHTML(modal, `
            <div class="modal-content tip-modal">
                <div class="modal-header">
                    <h3>${tip.title}</h3>
                    <button class="close-modal">&times);</button>
                </div>
                <div class="modal-body">
                    <div class="tip-hero">
                        <img src="${tip.image}" alt="${tip.title}" class="tip-hero-image">
                        <div class="tip-hero-content">
                            <span class="category-badge">${this.getCategoryName(tip.category)}</span>
                            <div class="tip-meta-large">
                                <span class="author">
                                    <i class="fas fa-user"></i>
                                    By ${tip.author}
                                </span>
                                <span class="date">
                                    <i class="fas fa-calendar"></i>
                                    ${new Date(tip.publishDate).toLocaleDateString()}
                                </span>
                                <span class="read-time">
                                    <i class="fas fa-clock"></i>
                                    ${tip.readTime} read
                                </span>
                            </div>
                            <div class="tip-stats-large">
                                <span class="views"><i class="fas fa-eye"></i> ${tip.views} views</span>
                                <span class="likes"><i class="fas fa-heart"></i> ${tip.likes} likes</span>
                            </div>
                        </div>
                    </div>
                    <div class="tip-content-full">
                        <div class="content-section">
                            <h4>Summary</h4>
                            <p>${tip.excerpt}</p>
                        </div>
                        <div class="content-section">
                            <h4>Full Content</h4>
                            <div class="tip-body">
                                ${this.formatTipContent(tip.content)}
                            </div>
                        </div>
                        ${tip.products && tip.products.length > 0 ? `
                            <div class="content-section">
                                <h4>Recommended Products</h4>
                                <div class="recommended-products">
                                    ${this.getProductCards(tip.products)}
                                </div>
                            </div>
                        ` : ''}
                        <div class="content-section">
                            <div class="tip-tags-large">
                                <strong>Tags:</strong>
                                ${tip.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="tipsManager.likeTip('${tip.id}')">
                        <i class="fas fa-heart"></i>
                        Like (${tip.likes})
                    </button>
                    <button class="btn btn-outline share-tip" data-tip-id="${tip.id}">
                        <i class="fas fa-share"></i>
                        Share
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

        // Share button
        const shareBtn = modal.querySelector('.share-tip');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareTip(tip);
            });
        }

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    formatTipContent(content) {
        // Convert markdown-like content to HTML
        return content
            .split('\n')
            .map(line => {
                if (line.startsWith('## ')) {
                    return `<h4>${line.substring(3)}</h4>`;
                } else if (line.startsWith('**') && line.endsWith('**')) {
                    return `<strong>${line.substring(2, line.length - 2)}</strong>`;
                } else if (line.trim() === '') {
                    return '<br>';
                } else if (line.match(/^\d+\.\s/)) {
                    return `<li>${line.substring(line.indexOf(' ') + 1)}</li>`;
                } else {
                    return `<p>${line}</p>`;
                }
            })
            .join('');
    }

    getProductCards(productIds) {
        if (!window.nonaBeautyApp) return '';

        const products = productIds.map(id => 
            window.nonaBeautyApp.products.find(p => p.id === id)
        ).filter(p => p);

        return products.map(product => `
            <div class="product-mini-card">
                <img src="${product.image}" alt="${product.name}">
                <div class="product-info">
                    <h5>${product.name}</h5>
                    <div class="price">${window.nonaBeautyApp.formatPrice(product.price)}</div>
                    <button class="btn btn-sm btn-primary" onclick="tipsManager.addProductToCart('${product.id}')">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    }

    likeTip(tipId) {
        const tip = this.tips.find(t => t.id === tipId);
        if (tip) {
            tip.likes++;
            this.saveTips();
            
            // Update like count in modal
            const likeBtn = document.querySelector(`[onclick="tipsManager.likeTip('${tipId}')"]`);
            if (likeBtn) {
                safeSetHTML(likeBtn, `<i class="fas fa-heart"></i> Like (${tip.likes})`);
            }
            
            this.showNotification('Thank you for your like!', 'success');
        }
    }

    shareTip(tip) {
        const shareUrl = `${window.location.origin}${window.location.pathname}?tip=${tip.id}`;
        const shareText = `Check out this beauty tip: ${tip.title}`;

        if (navigator.share) {
            navigator.share({
                title: tip.title,
                text: shareText,
                url: shareUrl
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.showNotification('Link copied to clipboard!', 'success');
            });
        }
    }

    addProductToCart(productId) {
        if (window.cartManager && window.nonaBeautyApp) {
            const product = window.nonaBeautyApp.products.find(p => p.id === productId);
            if (product) {
                window.cartManager.addToCart(product);
                this.showNotification('Product added to cart!', 'success');
            }
        }
    }

    loadMoreTips() {
        this.currentPage++;
        this.displayTips();
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreTips');
        if (!loadMoreBtn) return;

        const totalPages = Math.ceil(this.filteredTips.length / this.tipsPerPage);
        
        if (this.currentPage >= totalPages || this.filteredTips.length <= this.tipsPerPage) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    updateResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            const startIndex = (this.currentPage - 1) * this.tipsPerPage + 1;
            const endIndex = Math.min(this.currentPage * this.tipsPerPage, this.filteredTips.length);
            const total = this.filteredTips.length;
            
            resultsCount.textContent = `Showing ${startIndex}-${endIndex} of ${total} articles`;
        }
    }

    updateURL(category) {
        const url = new URL(window.location);
        if (category === 'all') {
            url.searchParams.delete('category');
        } else {
            url.searchParams.set('category', category);
        }
        window.history.replaceState({}, '', url);
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

        // Show loading state
        const button = form.querySelector('button');
        const originalText = button.innerHTML;
        safeSetHTML(button, '<i class="fas fa-spinner fa-spin"></i> Subscribing...');
        button.disabled = true;

        // Simulate API call
        setTimeout(() => {
            safeSetHTML(button, originalText);
            button.disabled = false;
            
            this.showNotification('Successfully subscribed to beauty insights!', 'success');
            form.reset();
            
            // Update user preferences if logged in
            if (window.nonaBeautyApp && window.nonaBeautyApp.currentUser) {
                window.nonaBeautyApp.currentUser.preferences = {
                    ...window.nonaBeautyApp.currentUser.preferences,
                    newsletter: true
                };
                sanitizeAndSet('nonaBeautyUser', window.nonaBeautyApp.currentUser);
            }
        }, 1500);
    }

    // Utility Methods
    getCategoryName(categoryId) {
        const categories = {
            skincare: 'Skincare',
            haircare: 'Haircare',
            makeup: 'Makeup',
            wellness: 'Wellness',
            seasonal: 'Seasonal Care'
        };
        return categories[categoryId] || categoryId;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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

    // Get featured tips for home page
    getFeaturedTips(limit = 3) {
        return this.tips.filter(tip => tip.featured).slice(0, limit);
    }

    // Get tips by category
    getTipsByCategory(category, limit = 3) {
        const filtered = category === 'all' ? this.tips : this.tips.filter(tip => tip.category === category);
        return filtered.slice(0, limit);
    }

    // Get popular tips
    getPopularTips(limit = 3) {
        return [...this.tips]
            .sort((a, b) => b.views - a.views)
            .slice(0, limit);
    }

    // Search tips
    searchTips(query) {
        if (!query) return this.tips;
        
        const searchTerm = query.toLowerCase();
        return this.tips.filter(tip =>
            tip.title.toLowerCase().includes(searchTerm) ||
            tip.excerpt.toLowerCase().includes(searchTerm) ||
            tip.content.toLowerCase().includes(searchTerm) ||
            tip.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            tip.author.toLowerCase().includes(searchTerm)
        );
    }
}

// Initialize tips manager
document.addEventListener('DOMContentLoaded', function() {
    window.tipsManager = new TipsManager();
    
    // Add tips page specific styles
    if (!document.getElementById('tipsStyles')) {
        const tipsStyles = document.createElement('style');
        tipsStyles.id = 'tipsStyles';
        tipsStyles.textContent = `
            .tip-card {
                position: relative;
                transition: all 0.3s ease;
            }

            .tip-card.featured {
                border: 2px solid var(--primary-color);
            }

            .tip-image {
                position: relative;
                overflow: hidden;
                border-radius: var(--border-radius) var(--border-radius) 0 0;
            }

            .tip-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .tip-card:hover .tip-overlay {
                opacity: 1;
            }

            .featured-badge {
                position: absolute;
                top: 15px;
                left: 15px;
                background: var(--primary-color);
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                z-index: 2;
            }

            .tip-stats {
                display: flex;
                gap: 15px;
                margin: 10px 0;
                font-size: 12px;
                color: var(--muted-text);
            }

            .tip-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-top: 10px;
            }

            .tag {
                background: #f8f9fa;
                padding: 4px 8px;
                border-radius: 10px;
                font-size: 11px;
                color: var(--muted-text);
            }

            .article-stats {
                display: flex;
                gap: 15px;
                margin: 10px 0;
                font-size: 14px;
                color: var(--muted-text);
            }

            .tip-modal {
                max-width: 800px;
            }

            .tip-hero {
                position: relative;
                margin-bottom: 30px;
            }

            .tip-hero-image {
                width: 100%;
                height: 300px;
                object-fit: cover;
                border-radius: var(--border-radius);
            }

            .tip-hero-content {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(transparent, rgba(0,0,0,0.8));
                color: white;
                padding: 30px;
                border-radius: 0 0 var(--border-radius) var(--border-radius);
            }

            .category-badge {
                background: var(--primary-color);
                color: white;
                padding: 6px 12px;
                border-radius: 15px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 10px;
                display: inline-block;
            }

            .tip-meta-large {
                display: flex;
                gap: 20px;
                margin: 10px 0;
                flex-wrap: wrap;
            }

            .tip-stats-large {
                display: flex;
                gap: 20px;
            }

            .content-section {
                margin-bottom: 30px;
            }

            .content-section h4 {
                color: var(--primary-color);
                margin-bottom: 15px;
                font-size: 18px;
            }

            .tip-body {
                line-height: 1.8;
            }

            .tip-body h4 {
                color: var(--dark-text);
                margin: 20px 0 10px 0;
            }

            .tip-body p {
                margin-bottom: 15px;
            }

            .tip-body li {
                margin-bottom: 8px;
                position: relative;
                padding-left: 20px;
            }

            .tip-body li:before {
                content: '•';
                position: absolute;
                left: 0;
                color: var(--primary-color);
                font-weight: bold;
            }

            .recommended-products {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }

            .product-mini-card {
                display: flex;
                gap: 10px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: var(--border-radius);
                align-items: center;
            }

            .product-mini-card img {
                width: 60px;
                height: 60px;
                border-radius: 8px;
                object-fit: cover;
            }

            .product-mini-card .product-info {
                flex: 1;
            }

            .product-mini-card h5 {
                margin: 0 0 5px 0;
                font-size: 14px;
                color: var(--dark-text);
            }

            .product-mini-card .price {
                font-weight: bold;
                color: var(--primary-color);
                margin-bottom: 8px;
            }

            .tip-tags-large {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                align-items: center;
            }

            .popular-tip {
                display: flex;
                gap: 15px;
                padding: 15px;
                border-radius: var(--border-radius);
                transition: var(--transition);
                cursor: pointer;
            }

            .popular-tip:hover {
                background: #f8f9fa;
                transform: translateX(5px);
            }

            .popular-tip .tip-image {
                width: 80px;
                height: 80px;
                border-radius: 8px;
                overflow: hidden;
            }

            .popular-tip .tip-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .popular-tip .tip-content h4 {
                margin: 0 0 8px 0;
                font-size: 14px;
                color: var(--dark-text);
            }

            .popular-tip .tip-meta {
                display: flex;
                flex-direction: column;
                gap: 4px;
                font-size: 12px;
                color: var(--muted-text);
            }

            @media (max-width: 768px) {
                .tip-meta-large {
                    flex-direction: column;
                    gap: 10px;
                }

                .tip-stats-large {
                    flex-direction: column;
                    gap: 10px;
                }

                .tip-hero-content {
                    position: relative;
                    background: var(--dark-text);
                    border-radius: 0;
                }

                .tip-hero-image {
                    height: 200px;
                }

                .recommended-products {
                    grid-template-columns: 1fr;
                }

                .popular-tip {
                    flex-direction: column;
                    text-align: center;
                }

                .popular-tip .tip-image {
                    width: 100%;
                    height: 120px;
                }
            }
        `;
        document.head.appendChild(tipsStyles);
    }
});
