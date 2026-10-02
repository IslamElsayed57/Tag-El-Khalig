/**
 * Taj El Khalig Sweets - Cart & Checkout Engine
 * Manages items, animations, free delivery progress, GPS location, and order submission.
 */

const TajCart = (function() {
  const STORAGE_KEY = 'taj_cart_items_v1';
  let cartItems = [];
  let currentFulfillment = 'delivery'; // 'delivery' or 'pickup'
  let selectedBranchId = null;
  let customerGPS = null;

  function loadCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      cartItems = data ? JSON.parse(data) : [];
    } catch (e) {
      cartItems = [];
    }
    updateBadge();
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
    updateBadge();
    window.dispatchEvent(new CustomEvent('taj_cart_updated', { detail: { items: cartItems } }));
  }

  function updateBadge() {
    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(b => {
      b.textContent = totalCount;
      b.style.display = totalCount > 0 ? 'inline-flex' : 'none';
      b.classList.remove('badge-bump');
      void b.offsetWidth; // trigger reflow
      b.classList.add('badge-bump');
    });
  }

  return {
    init() {
      loadCart();
      this.bindCartDrawerEvents();
      this.bindGlobalAddToCart();
    },

    getItems() {
      return [...cartItems];
    },

    addItem(product, quantity = 1, triggerEl = null) {
      const existing = cartItems.find(i => i.id === product.id);
      const effectivePrice = product.discountPrice ? product.discountPrice : product.regularPrice;

      if (existing) {
        existing.quantity += quantity;
      } else {
        cartItems.push({
          id: product.id,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          price: effectivePrice,
          regularPrice: product.regularPrice,
          image: product.image,
          quantity: quantity
        });
      }

      saveCart();
      this.playAddAnimation(triggerEl);
      this.renderDrawer();
      this.openDrawer();
    },

    updateQuantity(productId, newQty) {
      const item = cartItems.find(i => i.id === productId);
      if (!item) return;

      if (newQty <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = newQty;
        saveCart();
        this.renderDrawer();
      }
    },

    removeItem(productId) {
      cartItems = cartItems.filter(i => i.id !== productId);
      saveCart();
      this.renderDrawer();
    },

    clearCart() {
      cartItems = [];
      saveCart();
      this.renderDrawer();
    },

    async getCalculations() {
      const settings = await TajAPI.getSettings();
      const subtotal = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      const threshold = settings.freeDeliveryThreshold || 250;
      
      let deliveryFee = 0;
      let freeDeliveryRemaining = 0;

      if (currentFulfillment === 'delivery') {
        if (subtotal >= threshold) {
          deliveryFee = 0;
          freeDeliveryRemaining = 0;
        } else {
          deliveryFee = settings.deliveryFee || 25;
          freeDeliveryRemaining = Math.max(0, threshold - subtotal);
        }
      } else {
        // Pickup is always 0 delivery fee
        deliveryFee = 0;
        freeDeliveryRemaining = 0;
      }

      const total = subtotal + deliveryFee;

      return {
        subtotal,
        deliveryFee,
        total,
        threshold,
        freeDeliveryRemaining,
        isFreeDelivery: currentFulfillment === 'delivery' && subtotal >= threshold
      };
    },

    playAddAnimation(triggerEl) {
      if (!triggerEl) return;
      // Elegant ripple & feedback
      triggerEl.classList.add('btn-bounce');
      setTimeout(() => triggerEl.classList.remove('btn-bounce'), 600);

      // Toast notification
      this.showToast(I18N.t('success') + ' - ' + I18N.t('addToCart'));
    },

    showToast(message) {
      let toast = document.getElementById('taj-global-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'taj-global-toast';
        toast.className = 'taj-toast';
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2500);
    },

    openDrawer() {
      const drawer = document.getElementById('cartDrawer');
      const overlay = document.getElementById('cartOverlay');
      if (drawer && overlay) {
        drawer.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    },

    closeDrawer() {
      const drawer = document.getElementById('cartDrawer');
      const overlay = document.getElementById('cartOverlay');
      if (drawer && overlay) {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    },

    async renderDrawer() {
      const container = document.getElementById('cartDrawerBody');
      const footer = document.getElementById('cartDrawerFooter');
      if (!container) return;

      const isAr = I18N.currentLang === 'ar';

      if (cartItems.length === 0) {
        container.innerHTML = `
          <div class="cart-empty-state">
            <div class="cart-empty-icon">🛍️</div>
            <h4>${I18N.t('cartEmpty')}</h4>
            <p>${I18N.t('cartEmptyDesc')}</p>
            <a href="categories.html" class="btn btn-primary" onclick="TajCart.closeDrawer()">${I18N.t('heroBtnExplore')}</a>
          </div>
        `;
        if (footer) footer.style.display = 'none';
        return;
      }

      if (footer) footer.style.display = 'block';

      const branches = await TajAPI.getBranches(true);
      if (!selectedBranchId && branches.length > 0) {
        selectedBranchId = branches[0].id;
      }

      const calc = await this.getCalculations();

      // Free delivery progress bar
      let freeDeliveryHtml = '';
      if (currentFulfillment === 'delivery') {
        const percent = Math.min(100, Math.round((calc.subtotal / calc.threshold) * 100));
        freeDeliveryHtml = `
          <div class="free-delivery-card">
            <div class="free-delivery-header">
              <span class="free-delivery-title">
                ${calc.isFreeDelivery 
                  ? I18N.t('freeDeliveryReached') 
                  : I18N.t('freeDeliveryRemaining', { amount: calc.freeDeliveryRemaining.toFixed(0) })}
              </span>
              <span class="free-delivery-percent">${percent}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill ${calc.isFreeDelivery ? 'completed' : ''}" style="width: ${percent}%;"></div>
            </div>
          </div>
        `;
      }

      // Items list
      const itemsHtml = cartItems.map(item => `
        <div class="cart-item" data-id="${item.id}">
          <img src="${item.image}" alt="${isAr ? item.nameAr : item.nameEn}" class="cart-item-img">
          <div class="cart-item-info">
            <h4 class="cart-item-title">${isAr ? item.nameAr : item.nameEn}</h4>
            <div class="cart-item-price">${item.price} ${I18N.t('egp')}</div>
            <div class="cart-item-qty-row">
              <div class="qty-control">
                <button type="button" class="qty-btn" onclick="TajCart.updateQuantity('${item.id}', ${item.quantity - 1})" aria-label="Decrease">-</button>
                <span class="qty-value">${item.quantity}</span>
                <button type="button" class="qty-btn" onclick="TajCart.updateQuantity('${item.id}', ${item.quantity + 1})" aria-label="Increase">+</button>
              </div>
              <button type="button" class="cart-remove-btn" onclick="TajCart.removeItem('${item.id}')" title="${I18N.t('delete')}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `).join('');

      // Fulfillment selection
      const fulfillmentHtml = `
        <div class="fulfillment-selector">
          <label class="form-label">${I18N.t('orderFulfillment')}</label>
          <div class="fulfillment-options">
            <button type="button" class="fulfillment-opt-btn ${currentFulfillment === 'delivery' ? 'active' : ''}" onclick="TajCart.setFulfillment('delivery')">
              🛵 ${I18N.t('fulfillmentDelivery')}
            </button>
            <button type="button" class="fulfillment-opt-btn ${currentFulfillment === 'pickup' ? 'active' : ''}" onclick="TajCart.setFulfillment('pickup')">
              🏬 ${I18N.t('fulfillmentPickup')}
            </button>
          </div>
        </div>
      `;

      // Branch & Location details
      const selectedBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

      let branchDetailsHtml = '';
      if (currentFulfillment === 'pickup') {
        branchDetailsHtml = `
          <div class="fulfillment-branch-box">
            <label class="form-label">${I18N.t('selectBranch')}</label>
            <select class="form-select" id="pickupBranchSelect" onchange="TajCart.setBranch(this.value)">
              ${branches.map(b => `<option value="${b.id}" ${b.id === selectedBranchId ? 'selected' : ''}>${isAr ? b.nameAr : b.nameEn}</option>`).join('')}
            </select>
            ${selectedBranch ? `
              <div class="branch-summary-card">
                <div class="branch-summary-item"><strong>📍 ${I18N.t('branchAddress')}:</strong> ${isAr ? selectedBranch.addressAr : selectedBranch.addressEn}</div>
                <div class="branch-summary-item"><strong>📞 ${I18N.t('branchPhone')}:</strong> <a href="tel:${selectedBranch.phone}">${selectedBranch.phone}</a></div>
                ${selectedBranch.managerAr ? `<div class="branch-summary-item"><strong>👤 ${I18N.t('branchManager')}:</strong> ${isAr ? selectedBranch.managerAr : selectedBranch.managerEn}</div>` : ''}
                <a href="${selectedBranch.mapUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm mt-2">
                  🗺️ ${I18N.t('openInMaps')}
                </a>
              </div>
            ` : ''}
          </div>
        `;
      } else {
        branchDetailsHtml = `
          <div class="fulfillment-delivery-box">
            <label class="form-label">${I18N.t('selectDeliveryBranch')}</label>
            <select class="form-select" id="deliveryBranchSelect" onchange="TajCart.setBranch(this.value)">
              ${branches.filter(b => b.deliveryEligible).map(b => `<option value="${b.id}" ${b.id === selectedBranchId ? 'selected' : ''}>${isAr ? b.nameAr : b.nameEn}</option>`).join('')}
            </select>

            <div class="gps-container">
              <button type="button" class="btn btn-outline btn-gps" id="gpsBtn" onclick="TajCart.detectGPSLocation()">
                <span class="gps-icon">📍</span>
                <span id="gpsBtnText">${I18N.t('gpsLocationBtn')}</span>
              </button>
              <div id="gpsStatusMessage" class="gps-status-msg" style="${customerGPS ? 'display:block;' : 'display:none;'}">
                ${customerGPS ? `✅ ${I18N.t('gpsSuccess')} (${customerGPS.lat.toFixed(4)}, ${customerGPS.lng.toFixed(4)})` : ''}
              </div>
            </div>

            <div class="form-group mt-3">
              <label class="form-label" for="deliveryAddressInput">${I18N.t('addressDetails')} <span class="required-star">*</span></label>
              <textarea class="form-control" id="deliveryAddressInput" rows="2" placeholder="${I18N.t('addressDetails')}"></textarea>
            </div>
          </div>
        `;
      }

      // Customer fields
      const customerFieldsHtml = `
        <div class="checkout-customer-fields">
          <div class="form-group">
            <label class="form-label" for="customerNameInput">${I18N.t('customerName')} <span class="required-star">*</span></label>
            <input type="text" class="form-control" id="customerNameInput" placeholder="${isAr ? 'مثال: محمد أحمد علي' : 'e.g. Mohamed Ahmed Ali'}">
          </div>
          <div class="form-group">
            <label class="form-label" for="customerPhoneInput">${I18N.t('customerPhone')} <span class="required-star">*</span></label>
            <input type="tel" class="form-control" id="customerPhoneInput" maxlength="11" placeholder="01012345678">
            <small class="form-hint">${isAr ? '11 رقماً تبدأ بـ 01' : '11 digits starting with 01'}</small>
          </div>
          <div class="form-group">
            <label class="form-label" for="orderNotesInput">${I18N.t('orderNotes')}</label>
            <textarea class="form-control" id="orderNotesInput" rows="2" placeholder="${isAr ? 'مثال: السكر خفيف، بدون شربات زيادة...' : 'e.g. Less syrup, please hurry...'}"></textarea>
          </div>
        </div>
      `;

      container.innerHTML = `
        ${freeDeliveryHtml}
        <div class="cart-items-wrapper">
          ${itemsHtml}
        </div>
        ${fulfillmentHtml}
        ${branchDetailsHtml}
        ${customerFieldsHtml}
      `;

      // Summary inside footer
      if (footer) {
        footer.innerHTML = `
          <div class="cart-summary-box">
            <div class="summary-line">
              <span>${I18N.t('cartSubtotal')}</span>
              <span>${calc.subtotal} ${I18N.t('egp')}</span>
            </div>
            <div class="summary-line">
              <span>${I18N.t('cartDeliveryFee')}</span>
              <span>${calc.deliveryFee === 0 ? (currentFulfillment === 'delivery' ? (isAr ? 'مجاناً 🎉' : 'Free 🎉') : '0 ' + I18N.t('egp')) : calc.deliveryFee + ' ' + I18N.t('egp')}</span>
            </div>
            <div class="summary-line grand-total">
              <span>${I18N.t('cartTotal')}</span>
              <span>${calc.total} ${I18N.t('egp')}</span>
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-block checkout-submit-btn" id="submitOrderBtn" onclick="TajCart.submitOrder()">
            <span class="btn-text">${I18N.t('placeOrderBtn')}</span>
            <span class="btn-spinner" style="display:none;">⏳</span>
          </button>
        `;
      }
    },

    setFulfillment(type) {
      currentFulfillment = type;
      this.renderDrawer();
    },

    setBranch(branchId) {
      selectedBranchId = branchId;
      this.renderDrawer();
    },

    detectGPSLocation() {
      const btn = document.getElementById('gpsBtn');
      const btnText = document.getElementById('gpsBtnText');
      const statusMsg = document.getElementById('gpsStatusMessage');
      const addressInput = document.getElementById('deliveryAddressInput');

      if (!navigator.geolocation) {
        if (statusMsg) {
          statusMsg.style.display = 'block';
          statusMsg.className = 'gps-status-msg text-danger';
          statusMsg.textContent = '❌ ' + I18N.t('gpsFailed');
        }
        return;
      }

      if (btnText) btnText.textContent = I18N.t('gpsLocating');
      if (btn) btn.disabled = true;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          customerGPS = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          if (btn) btn.disabled = false;
          if (btnText) btnText.textContent = I18N.t('gpsLocationBtn');
          if (statusMsg) {
            statusMsg.style.display = 'block';
            statusMsg.className = 'gps-status-msg text-success';
            statusMsg.textContent = `✅ ${I18N.t('gpsSuccess')} (${customerGPS.lat.toFixed(4)}, ${customerGPS.lng.toFixed(4)})`;
          }
          if (addressInput && !addressInput.value.trim()) {
            addressInput.value = `موقع GPS تم التقاطه: [${customerGPS.lat.toFixed(5)}, ${customerGPS.lng.toFixed(5)}] - يرجى كتابة اسم الشارع والعمارة`;
          }
        },
        (error) => {
          if (btn) btn.disabled = false;
          if (btnText) btnText.textContent = I18N.t('gpsLocationBtn');
          if (statusMsg) {
            statusMsg.style.display = 'block';
            statusMsg.className = 'gps-status-msg text-danger';
            statusMsg.textContent = '⚠️ ' + I18N.t('gpsFailed') + ` (${error.message || 'Permission Denied'})`;
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    },

    async submitOrder() {
      const isAr = I18N.currentLang === 'ar';
      const nameInput = document.getElementById('customerNameInput');
      const phoneInput = document.getElementById('customerPhoneInput');
      const addressInput = document.getElementById('deliveryAddressInput');
      const notesInput = document.getElementById('orderNotesInput');
      const submitBtn = document.getElementById('submitOrderBtn');

      if (!nameInput || !phoneInput) return;

      const customerName = nameInput.value.trim();
      const customerPhone = phoneInput.value.trim();
      const address = addressInput ? addressInput.value.trim() : '';
      const notes = notesInput ? notesInput.value.trim() : '';

      // Validation
      if (!customerName) {
        alert(I18N.t('nameValidationError'));
        nameInput.focus();
        return;
      }

      // Egyptian phone validation: exactly 11 digits, starts with 01
      const egyptPhoneRegex = /^01[0125][0-9]{8}$/;
      if (!egyptPhoneRegex.test(customerPhone)) {
        alert(I18N.t('phoneValidationError'));
        phoneInput.focus();
        return;
      }

      if (currentFulfillment === 'delivery' && !address) {
        alert(I18N.t('addressValidationError'));
        if (addressInput) addressInput.focus();
        return;
      }

      const branches = await TajAPI.getBranches(true);
      const branch = branches.find(b => b.id === selectedBranchId) || branches[0];
      if (!branch) {
        alert(I18N.t('branchValidationError'));
        return;
      }

      const calc = await this.getCalculations();

      // Disable button to prevent duplicate clicks
      if (submitBtn) {
        submitBtn.disabled = true;
        const spinner = submitBtn.querySelector('.btn-spinner');
        const text = submitBtn.querySelector('.btn-text');
        if (spinner) spinner.style.display = 'inline-block';
        if (text) text.textContent = I18N.t('loading');
      }

      try {
        const orderPayload = {
          customerName,
          customerPhone,
          type: currentFulfillment,
          branchId: branch.id,
          branchNameAr: branch.nameAr,
          branchNameEn: branch.nameEn,
          deliveryFee: calc.deliveryFee,
          subtotal: calc.subtotal,
          total: calc.total,
          items: cartItems.map(item => ({
            productId: item.id,
            nameAr: item.nameAr,
            nameEn: item.nameEn,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          address: currentFulfillment === 'delivery' ? address : null,
          gpsCoordinates: customerGPS,
          notes: notes
        };

        const savedOrder = await TajAPI.createOrder(orderPayload);

        // Clear cart on successful order
        this.clearCart();
        this.closeDrawer();

        // Show Order Success Modal
        this.showOrderSuccessModal(savedOrder);
      } catch (err) {
        alert(I18N.t('error') + ': ' + err.message);
        if (submitBtn) {
          submitBtn.disabled = false;
          const spinner = submitBtn.querySelector('.btn-spinner');
          const text = submitBtn.querySelector('.btn-text');
          if (spinner) spinner.style.display = 'none';
          if (text) text.textContent = I18N.t('placeOrderBtn');
        }
      }
    },

    showOrderSuccessModal(order) {
      const isAr = I18N.currentLang === 'ar';
      let modal = document.getElementById('orderSuccessModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'orderSuccessModal';
        modal.className = 'taj-modal-overlay';
        document.body.appendChild(modal);
      }

      const settingsPromise = TajAPI.getSettings();
      settingsPromise.then(settings => {
        const whatsappNumber = settings.whatsappNumber || '01099887766';
        const cleanWhatsapp = whatsappNumber.replace(/[^0-9]/g, '');
        const whatsappText = encodeURIComponent(`مرحباً حلواني تاج الخليج، أود تأكيد طلبي رقم #${order.id} باسم ${order.customerName} بقيمة ${order.total} ج.م.`);
        const whatsappUrl = `https://wa.me/2${cleanWhatsapp}?text=${whatsappText}`;

        modal.innerHTML = `
          <div class="taj-modal-card">
            <div class="modal-success-badge">🎉</div>
            <h3 class="modal-title">${I18N.t('orderSuccessTitle')}</h3>
            <div class="modal-order-number">
              <span class="order-number-title">${I18N.t('orderNumberLabel')}:</span>
              <strong class="order-number-badge">#${order.id}</strong>
            </div>
            <p class="modal-desc">${I18N.t('orderSuccessDesc')}</p>
            <div class="modal-details-summary">
              <div class="detail-row">
                <span>${I18N.t('orderCustomer')}:</span>
                <strong>${order.customerName}</strong>
              </div>
              <div class="detail-row">
                <span>${I18N.t('orderPhone')}:</span>
                <span dir="ltr">${order.customerPhone}</span>
              </div>
              <div class="detail-row">
                <span>${I18N.t('orderBranch')}:</span>
                <strong>${isAr ? order.branchNameAr : order.branchNameEn}</strong>
              </div>
              <div class="detail-row">
                <span>${I18N.t('orderTotal')}:</span>
                <strong>${order.total} ${I18N.t('egp')}</strong>
              </div>
            </div>
            <div class="modal-actions">
              <a href="${whatsappUrl}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-block">
                💬 ${I18N.t('orderWhatsappTrack')}
              </a>
              <button type="button" class="btn btn-primary btn-block mt-2" onclick="document.getElementById('orderSuccessModal').classList.remove('active')">
                ${I18N.t('continueShopping')}
              </button>
            </div>
          </div>
        `;

        modal.classList.add('active');
      });
    },

    bindCartDrawerEvents() {
      // Cart open triggers
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.cart-open-trigger');
        if (trigger) {
          e.preventDefault();
          this.renderDrawer();
          this.openDrawer();
        }

        // Cart close triggers
        if (e.target.closest('#cartDrawerClose') || e.target.matches('#cartOverlay')) {
          e.preventDefault();
          this.closeDrawer();
        }
      });

      // Close on Escape key press
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeDrawer();
        }
      });
    },

    bindGlobalAddToCart() {
      // Event delegation for dynamic product cards
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-add-to-cart');
        if (btn) {
          const productId = btn.getAttribute('data-product-id');
          if (productId) {
            TajAPI.getProductById(productId).then(product => {
              if (product) {
                this.addItem(product, 1, btn);
              }
            });
          }
        }
      });
    }
  };
})();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TajCart.init());
  } else {
    TajCart.init();
  }
}
