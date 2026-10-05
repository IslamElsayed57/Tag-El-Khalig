/**
 * Taj El Khalig Sweets - Storefront Controller
 * Manages Home, Categories & Menu, Branches & Contact, and dynamic updates.
 */

const Storefront = (function() {
  let activeCategoryFilter = 'all';
  let activeSearchQuery = '';

  return {
    async init() {
      this.bindGlobalNavigation();
      this.bindReactivity();
      this.loadPageSpecificContent();
    },

    bindGlobalNavigation() {
      // Mobile menu toggle
      const mobileToggle = document.getElementById('mobileMenuToggle');
      const mobileNav = document.getElementById('mobileNavDrawer');
      const mobileOverlay = document.getElementById('mobileNavOverlay');
      const mobileClose = document.getElementById('mobileMenuClose');

      if (mobileToggle && mobileNav && mobileOverlay) {
        mobileToggle.addEventListener('click', () => {
          mobileNav.classList.add('active');
          mobileOverlay.classList.add('active');
        });

        const closeMobileNav = () => {
          mobileNav.classList.remove('active');
          mobileOverlay.classList.remove('active');
        };

        if (mobileClose) mobileClose.addEventListener('click', closeMobileNav);
        mobileOverlay.addEventListener('click', closeMobileNav);
      }

      // Language buttons
      document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          I18N.toggleLang();
        });
      });
    },

    bindReactivity() {
      // Re-render when language changes
      window.addEventListener('taj_lang_changed', () => {
        this.loadPageSpecificContent();
        if (typeof TajCart !== 'undefined') TajCart.renderDrawer();
      });

      // Re-render when admin updates data
      window.addEventListener('taj_products_updated', () => this.loadPageSpecificContent());
      window.addEventListener('taj_categories_updated', () => this.loadPageSpecificContent());
      window.addEventListener('taj_branches_updated', () => this.loadPageSpecificContent());
      window.addEventListener('taj_settings_updated', () => this.loadPageSpecificContent());
      window.addEventListener('taj_data_synced', () => this.loadPageSpecificContent());
    },

    async loadPageSpecificContent() {
      try {
        await this.loadPageContent();
      } catch (err) {
        console.error('Taj storefront content load failed:', err);
        this.showLoadError();
      }
    },

    async loadPageContent() {
      const isAr = I18N.currentLang === 'ar';
      const settings = await TajAPI.getSettings();

      // Update shop headers, phones, and free delivery thresholds dynamically
      document.querySelectorAll('.store-phone-display').forEach(el => {
        el.textContent = settings.contactPhone || '19876';
        if (el.tagName === 'A') el.href = `tel:${settings.contactPhone}`;
      });

      document.querySelectorAll('.store-whatsapp-link').forEach(el => {
        const clean = (settings.whatsappNumber || '01099887766').replace(/[^0-9]/g, '');
        el.href = `https://wa.me/2${clean}`;
      });

      document.querySelectorAll('.store-email-link').forEach(el => {
        const email = settings.contactEmail || 'info@tajelkhalig.com';
        // On contact cards the link wraps an icon + label + value, so only
        // replace the value span; otherwise (plain footer link) replace the text.
        const val = el.querySelector('.channel-val');
        if (val) {
          val.textContent = email;
        } else {
          el.textContent = email;
        }
        el.href = `mailto:${email}`;
      });

      // Update free delivery banners
      const freeDeliveryBanners = document.querySelectorAll('.free-delivery-announcement');
      freeDeliveryBanners.forEach(b => {
        b.textContent = I18N.t('freeDeliveryBanner', { min: settings.freeDeliveryThreshold || 250 });
      });

      // Update top bar social media links
      const topBarSocial = document.getElementById('topBarSocialLinks');
      if (topBarSocial) {
        const cleanWhatsapp = (settings.whatsappNumber || '01099887766').replace(/[^0-9]/g, '');
        topBarSocial.innerHTML = `
          <span class="top-social-label">${isAr ? 'تابعنا:' : 'Follow us:'}</span>
          ${settings.facebookUrl ? `<a href="${settings.facebookUrl}" target="_blank" rel="noopener" class="top-social-icon facebook" title="Facebook"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>` : ''}
          ${settings.instagramUrl ? `<a href="${settings.instagramUrl}" target="_blank" rel="noopener" class="top-social-icon instagram" title="Instagram"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>` : ''}
          ${settings.tiktokUrl ? `<a href="${settings.tiktokUrl}" target="_blank" rel="noopener" class="top-social-icon tiktok" title="TikTok"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.19 1.18 2.16 2.37 2.38 1.14.24 2.4-.11 3.17-.98.66-.71.97-1.68.96-2.64.03-4.52.01-9.04.02-13.56z"/></svg></a>` : ''}
          <a href="https://wa.me/2${cleanWhatsapp}" target="_blank" rel="noopener" class="top-social-icon whatsapp" title="WhatsApp"><svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M23.45 8.53A10.45 10.45 0 0 0 6.98 21.12L5.5 26.5l5.5-1.44a10.45 10.45 0 0 0 12.45-16.53ZM16 24.56a8.55 8.55 0 0 1-4.36-1.2l-.31-.18-3.26.85.87-3.18-.2-.33A8.56 8.56 0 1 1 16 24.56Z"/><path fill="currentColor" d="M20.7 17.45c-.26-.13-1.55-.77-1.79-.85-.24-.09-.41-.13-.59.13-.17.26-.67.85-.82 1.02-.15.18-.3.2-.56.07-.26-.13-1.1-.4-2.1-1.28-.78-.7-1.3-1.56-1.45-1.82-.15-.26-.02-.4.11-.53.12-.11.26-.3.39-.44.13-.15.17-.26.26-.43.09-.18.05-.33-.02-.46-.06-.13-.58-1.4-.8-1.91-.21-.5-.42-.44-.58-.45h-.5c-.18 0-.46.07-.7.33-.24.26-.91.89-.91 2.17 0 1.28.93 2.52 1.06 2.7.13.17 1.83 2.8 4.44 3.93.62.27 1.1.43 1.48.55.62.2 1.19.17 1.64.1.5-.08 1.55-.64 1.77-1.25.22-.62.22-1.15.15-1.26-.06-.11-.24-.18-.5-.3Z"/></svg></a>
        `;
      }

      // Check current page
      if (document.getElementById('featuredProductsContainer')) {
        await this.renderHomePage(settings);
      }

      if (document.getElementById('categoriesMenuContainer')) {
        await this.renderCategoriesPage();
      }

      if (document.getElementById('branchesListContainer')) {
        await this.renderBranchesPage(settings);
      }
    },

    showLoadError() {
      const isAr = I18N.currentLang === 'ar';
      const message = isAr
        ? 'تعذر تحميل البيانات. تحقق من اتصالك ثم أعد تحميل الصفحة.'
        : 'Could not load data. Check your connection and reload the page.';
      const html = `<div class="no-results-box"><div class="no-results-icon">⚠️</div><p>${message}</p></div>`;
      ['featuredProductsContainer', 'categoriesMenuContainer', 'branchesListContainer'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const stillLoading = el.querySelector('[data-i18n="loading"]');
        if (stillLoading || !el.innerHTML.trim()) el.innerHTML = html;
      });
    },

    // 1. HOME PAGE
    async renderHomePage(settings) {
      const isAr = I18N.currentLang === 'ar';
      const container = document.getElementById('featuredProductsContainer');
      const catsContainer = document.getElementById('homeFeaturedCats');
      if (!container) return;

      const [products, categories] = await Promise.all([
        TajAPI.getProducts({ onlyActive: true }),
        TajAPI.getCategories(true)
      ]);

      // Render category quick pills on home page
      if (catsContainer) {
        catsContainer.innerHTML = categories.map(cat => `
          <a href="categories.html?cat=${cat.id}" class="home-cat-card">
            <span class="home-cat-icon">🍰</span>
            <span class="home-cat-name">${isAr ? cat.nameAr : cat.nameEn}</span>
          </a>
        `).join('');
      }

      // Render featured products
      const featured = products.filter(p => p.featured).slice(0, 6);
      const displayProds = featured.length > 0 ? featured : products.slice(0, 6);

      container.innerHTML = displayProds.map(p => this.renderProductCard(p, isAr)).join('');

      // New arrivals banner (products flagged isNew in the dashboard)
      const newArrivalsContainer = document.getElementById('newArrivalsContainer');
      if (newArrivalsContainer) {
        const newProds = products.filter(p => p.isNew).slice(0, 6);
        newArrivalsContainer.innerHTML = newProds.map(p => this.renderProductCard(p, isAr)).join('');
        const newArrivalsSection = document.getElementById('newArrivalsSection');
        if (newArrivalsSection) newArrivalsSection.style.display = newProds.length ? '' : 'none';
      }

      // Most-ordered products, computed server-side from real order quantities
      const popularContainer = document.getElementById('popularProductsContainer');
      const popularSection = document.getElementById('popularSection');
      if (popularContainer) {
        try {
          const popular = await TajAPI.getPopularProducts();
          popularContainer.innerHTML = popular.map(p => this.renderProductCard(p, isAr, p.soldCount)).join('');
          if (popularSection) popularSection.style.display = popular.length ? '' : 'none';
        } catch (err) {
          console.error('Failed to load popular products:', err);
          if (popularSection) popularSection.style.display = 'none';
        }
      }
    },

    // 2. CATEGORIES & MENU PAGE
    async renderCategoriesPage() {
      const isAr = I18N.currentLang === 'ar';
      const pillsContainer = document.getElementById('categoriesFilterPills');
      const menuContainer = document.getElementById('categoriesMenuContainer');
      const searchInput = document.getElementById('productSearchInput');
      if (!menuContainer) return;

      // Check URL param for default category
      const urlParams = new URLSearchParams(window.location.search);
      const catParam = urlParams.get('cat');
      if (catParam && activeCategoryFilter === 'all') {
        activeCategoryFilter = catParam;
      }

      const [categories, products] = await Promise.all([
        TajAPI.getCategories(true),
        TajAPI.getProducts({ 
          onlyActive: true, 
          categoryId: activeCategoryFilter,
          search: activeSearchQuery 
        })
      ]);

      // Category filter pills
      if (pillsContainer) {
        pillsContainer.innerHTML = `
          <button type="button" class="filter-pill ${activeCategoryFilter === 'all' ? 'active' : ''}" onclick="Storefront.setCategoryFilter('all')">
            ${I18N.t('allCategories')}
          </button>
          ${categories.map(cat => `
            <button type="button" class="filter-pill ${activeCategoryFilter === cat.id ? 'active' : ''}" onclick="Storefront.setCategoryFilter('${cat.id}')">
              ${isAr ? cat.nameAr : cat.nameEn}
            </button>
          `).join('')}
        `;
      }

      // Products grid or empty state
      if (products.length === 0) {
        menuContainer.innerHTML = `
          <div class="no-results-box">
            <div class="no-results-icon">🔍</div>
            <h3>${I18N.t('noProductsFound')}</h3>
            <p>${I18N.t('noProductsDesc')}</p>
            <button type="button" class="btn btn-outline" onclick="Storefront.resetFilters()">
              ${I18N.t('allCategories')}
            </button>
          </div>
        `;
        return;
      }

      // Group by category if "all" is selected, or display list
      if (activeCategoryFilter === 'all' && !activeSearchQuery) {
        let groupedHtml = '';
        categories.forEach(cat => {
          const catProducts = products.filter(p => p.categoryId === cat.id);
          if (catProducts.length > 0) {
            groupedHtml += `
              <div class="category-section" id="${cat.id}">
                <div class="category-section-header">
                  <h3 class="category-section-title">${isAr ? cat.nameAr : cat.nameEn}</h3>
                  <span class="category-count">${catProducts.length} ${isAr ? 'صنف' : 'items'}</span>
                </div>
                <div class="products-grid">
                  ${catProducts.map(p => this.renderProductCard(p, isAr)).join('')}
                </div>
              </div>
            `;
          }
        });
        menuContainer.innerHTML = groupedHtml;
      } else {
        menuContainer.innerHTML = `
          <div class="products-grid">
            ${products.map(p => this.renderProductCard(p, isAr)).join('')}
          </div>
        `;
      }

      // Search input handler
      if (searchInput && !searchInput.hasAttribute('data-bound')) {
        searchInput.setAttribute('data-bound', 'true');
        searchInput.addEventListener('input', (e) => {
          activeSearchQuery = e.target.value;
          this.renderCategoriesPage();
        });
      }
    },

    setCategoryFilter(catId) {
      activeCategoryFilter = catId;
      this.renderCategoriesPage();
    },

    resetFilters() {
      activeCategoryFilter = 'all';
      activeSearchQuery = '';
      const input = document.getElementById('productSearchInput');
      if (input) input.value = '';
      this.renderCategoriesPage();
    },

    // 3. BRANCHES & CONTACT PAGE
    async renderBranchesPage(settings) {
      const isAr = I18N.currentLang === 'ar';
      const container = document.getElementById('branchesListContainer');
      const socialContainer = document.getElementById('socialIconsHeader');
      if (!container) return;

      const branches = await TajAPI.getBranches(true);

      // Social icons
      if (socialContainer) {
        socialContainer.innerHTML = `
          ${settings.facebookUrl ? `<a href="${settings.facebookUrl}" target="_blank" rel="noopener" class="social-btn facebook" title="Facebook"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>` : ''}
          ${settings.instagramUrl ? `<a href="${settings.instagramUrl}" target="_blank" rel="noopener" class="social-btn instagram" title="Instagram"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>` : ''}
          ${settings.tiktokUrl ? `<a href="${settings.tiktokUrl}" target="_blank" rel="noopener" class="social-btn tiktok" title="TikTok"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.19 1.18 2.16 2.37 2.38 1.14.24 2.4-.11 3.17-.98.66-.71.97-1.68.96-2.64.03-4.52.01-9.04.02-13.56z"/></svg></a>` : ''}
          <a href="https://wa.me/2${(settings.whatsappNumber || '01099887766').replace(/[^0-9]/g, '')}" target="_blank" rel="noopener noreferrer" class="social-btn whatsapp" aria-label="WhatsApp" title="WhatsApp"><svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M23.45 8.53A10.45 10.45 0 0 0 6.98 21.12L5.5 26.5l5.5-1.44a10.45 10.45 0 0 0 12.45-16.53ZM16 24.56a8.55 8.55 0 0 1-4.36-1.2l-.31-.18-3.26.85.87-3.18-.2-.33A8.56 8.56 0 1 1 16 24.56Z"/><path fill="currentColor" d="M20.7 17.45c-.26-.13-1.55-.77-1.79-.85-.24-.09-.41-.13-.59.13-.17.26-.67.85-.82 1.02-.15.18-.3.2-.56.07-.26-.13-1.1-.4-2.1-1.28-.78-.7-1.3-1.56-1.45-1.82-.15-.26-.02-.4.11-.53.12-.11.26-.3.39-.44.13-.15.17-.26.26-.43.09-.18.05-.33-.02-.46-.06-.13-.58-1.4-.8-1.91-.21-.5-.42-.44-.58-.45h-.5c-.18 0-.46.07-.7.33-.24.26-.91.89-.91 2.17 0 1.28.93 2.52 1.06 2.7.13.17 1.83 2.8 4.44 3.93.62.27 1.1.43 1.48.55.62.2 1.19.17 1.64.1.5-.08 1.55-.64 1.77-1.25.22-.62.22-1.15.15-1.26-.06-.11-.24-.18-.5-.3Z"/></svg></a>
        `;
      }

      // Branches cards
      container.innerHTML = branches.map(b => {
        const hours = isAr ? (b.hoursAr || b.hoursEn) : (b.hoursEn || b.hoursAr);
        return `
        <div class="branch-card">
          <div class="branch-card-header">
            <div class="branch-pin-icon">🏛️</div>
            <h3 class="branch-name">${isAr ? b.nameAr : b.nameEn}</h3>
            ${b.deliveryEligible ? `<span class="branch-badge-delivery">🛵 ${I18N.t('deliveryEligibility')}</span>` : ''}
          </div>
          <div class="branch-card-body">
            <div class="branch-info-row">
              <span class="info-label">📍 ${I18N.t('branchAddress')}:</span>
              <span class="info-value">${isAr ? b.addressAr : b.addressEn}</span>
            </div>
            ${hours ? `
              <div class="branch-info-row">
                <span class="info-label">🕐 ${I18N.t('branchHours')}:</span>
                <span class="info-value">${hours}</span>
              </div>
            ` : ''}
            <div class="branch-info-row">
              <span class="info-label">📞 ${I18N.t('branchPhone')}:</span>
              <a href="tel:${b.phone}" class="info-value dir-ltr">${b.phone}</a>
            </div>
            ${b.managerAr ? `
              <div class="branch-info-row">
                <span class="info-label">👤 ${I18N.t('branchManager')}:</span>
                <span class="info-value">${isAr ? b.managerAr : b.managerEn}</span>
              </div>
            ` : ''}
          </div>
          <div class="branch-card-footer">
            <a href="${b.mapUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-block">
              🗺️ ${I18N.t('openInMaps')}
            </a>
          </div>
        </div>
      `;
      }).join('');

      // Contact form: opens WhatsApp with a formatted message to the shop's registered number
      const contactForm = document.getElementById('contactInquiryForm');
      if (contactForm && !contactForm.hasAttribute('data-bound')) {
        contactForm.setAttribute('data-bound', 'true');
        contactForm.addEventListener('submit', (e) => {
          e.preventDefault();

          const name = (document.getElementById('senderNameInput')?.value || '').trim();
          const phone = (document.getElementById('senderPhoneInput')?.value || '').trim();
          const message = (document.getElementById('senderMessageInput')?.value || '').trim();
          if (!name || !phone || !message) return;

          const cleanWhatsapp = (settings.whatsappNumber || '01099887766').replace(/[^0-9]/g, '');
          const text = encodeURIComponent([
            `${isAr ? 'الاسم' : 'Name'}: ${name}`,
            `${isAr ? 'رقم الهاتف' : 'Phone'}: ${phone}`,
            '',
            `${isAr ? 'الرسالة' : 'Message'}:`,
            message
          ].join('\n'));

          window.open(`https://wa.me/2${cleanWhatsapp}?text=${text}`, '_blank');
          contactForm.reset();
        });
      }
    },

    // Helper: Product Card HTML renderer
    renderProductCard(product, isAr, soldCount = 0) {
      const hasDiscount = product.discountPrice && product.discountPrice < product.regularPrice;
      const currentPrice = hasDiscount ? product.discountPrice : product.regularPrice;
      const percentOff = hasDiscount ? Math.round(((product.regularPrice - product.discountPrice) / product.regularPrice) * 100) : 0;

      return `
        <div class="product-card" data-product-id="${product.id}">
          <div class="product-card-media">
            <img src="${product.image}" alt="${isAr ? product.nameAr : product.nameEn}" class="product-card-img" loading="lazy">
            ${hasDiscount ? `<span class="product-discount-tag">${I18N.t('discountBadge', { percent: percentOff })}</span>` : ''}
            <span class="product-stock-tag ${product.inStock ? 'in-stock' : 'out-of-stock'}">
              ${product.inStock ? I18N.t('inStock') : I18N.t('outOfStock')}
            </span>
            ${product.isNew ? `<span class="product-new-tag">🔥 ${I18N.t('newBadge')}</span>` : ''}
          </div>
          <div class="product-card-content">
            <h4 class="product-title">${isAr ? product.nameAr : product.nameEn}</h4>
            <p class="product-desc">${product.descAr || product.descEn}</p>
            <div class="product-pricing">
              <span class="current-price">${currentPrice} ${I18N.t('egp')}</span>
              ${hasDiscount ? `<span class="regular-price">${product.regularPrice} ${I18N.t('egp')}</span>` : ''}
            </div>
            ${soldCount ? `<div class="product-sold-count">⭐ ${I18N.t('popularSoldCount', { count: soldCount })}</div>` : ''}
            <div class="product-card-actions">
              <button type="button" 
                      class="btn btn-primary btn-block btn-add-to-cart" 
                      data-product-id="${product.id}"
                      ${!product.inStock ? 'disabled' : ''}>
                <span class="cart-icon">🛒</span>
                <span>${I18N.t('addToCart')}</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }
  };
})();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Storefront.init());
  } else {
    Storefront.init();
  }
}
