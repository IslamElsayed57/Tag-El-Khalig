/**
 * Taj El Khalig Sweets - Admin Products & Categories Controller
 * CRUD for categories and products, XLSX import/export, image upload preview, bulk delete.
 */

const AdminProducts = (function() {
  let selectedProductIds = new Set();
  let productFilterCat = 'all';
  let productSearch = '';

  return {
    async render() {
      const container = document.getElementById('view-products');
      if (!container) return;

      const isAr = I18N.currentLang === 'ar';
      const currentUser = AdminApp.getCurrentUser();

      // Branch users are NOT permitted to view/modify products
      if (currentUser && currentUser.role === 'branch') {
        container.innerHTML = `
          <div class="system-status-banner" style="background:var(--danger-bg); border-color:var(--danger); color:var(--danger);">
            <span>🚫 ${I18N.t('permissionRestrictedNotice')}</span>
          </div>
        `;
        return;
      }

      const [categories, products] = await Promise.all([
        TajAPI.getCategories(),
        TajAPI.getProducts({ categoryId: productFilterCat, search: productSearch })
      ]);

      const allProducts = await TajAPI.getProducts();

      container.innerHTML = `
        <!-- Top Action Buttons -->
        <div class="admin-toolbar" style="margin-bottom:1.5rem;">
          <div class="toolbar-actions" style="width:100%; justify-content:space-between;">
            <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
              <button type="button" class="btn btn-primary" onclick="AdminProducts.openProductModal()">
                ➕ ${I18N.t('addProduct')}
              </button>
              <button type="button" class="btn btn-gold" onclick="AdminProducts.openCategoryModal()">
                📁 ${I18N.t('addCategory')}
              </button>
            </div>

            <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
              <input type="file" id="importXlsxInput" accept=".xlsx" style="display:none;" onchange="AdminProducts.handleImport(event)">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('importXlsxInput').click()">
                📂 ${I18N.t('importCSV')}
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="TajAPI.exportProductsXLSX(AdminProducts.allProdsCache)">
                📤 ${I18N.t('exportCSV')}
              </button>
              <button type="button" class="btn btn-outline btn-sm" onclick="TajAPI.downloadProductsXLSXTemplate()">
                📄 ${I18N.t('downloadTemplate')}
              </button>
            </div>
          </div>
        </div>

        <!-- Categories Manager Accordion/Pills -->
        <div style="background:var(--admin-surface); border:1px solid var(--admin-border); border-radius:var(--radius-lg); padding:1.25rem; margin-bottom:1.5rem;">
          <h4 style="font-weight:800; font-size:1.05rem; margin-bottom:0.75rem; color:var(--admin-text); display:flex; justify-content:space-between; align-items:center;">
            <span>📁 ${isAr ? 'الأقسام المسجلة' : 'Registered Categories'} (${categories.length})</span>
            <span style="font-size:0.8rem; font-weight:600; color:var(--admin-text-muted);">${isAr ? 'الأقسام غير النشطة تُخفى تلقائياً من متجر العملاء' : 'Inactive categories are automatically hidden from the customer store'}</span>
          </h4>
          <div style="display:flex; flex-wrap:wrap; gap:0.6rem;">
            ${categories.map(cat => `
              <div style="display:inline-flex; align-items:center; gap:0.5rem; background:var(--admin-bg); border:1px solid ${cat.active ? 'var(--admin-border)' : 'var(--danger)'}; border-radius:var(--radius-full); padding:0.35rem 0.85rem; font-size:0.875rem;">
                <span style="font-weight:700;">${isAr ? cat.nameAr : cat.nameEn}</span>
                <span class="badge-status ${cat.active ? 'completed' : 'cancelled'}" style="font-size:0.65rem; padding:0.1rem 0.4rem;">
                  ${cat.active ? I18N.t('active') : I18N.t('inactive')}
                </span>
                <button type="button" style="color:var(--admin-primary); margin-inline-start:4px;" onclick="AdminProducts.editCategory('${cat.id}')" title="${isAr ? 'تعديل' : 'Edit'}">✏️</button>
                <button type="button" style="color:var(--danger);" onclick="AdminProducts.deleteCategory('${cat.id}')" title="${isAr ? 'حذف' : 'Delete'}">🗑️</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Products Filter & Search Toolbar -->
        <div class="admin-toolbar">
          <div class="toolbar-filters">
            <div class="search-box-admin">
              <span class="search-icon">🔍</span>
              <input type="text" id="adminProdSearchInput" value="${escapeHtml(productSearch)}" placeholder="${isAr ? 'بحث عن منتج بالاسم أو الوصف...' : 'Search products...'}">
            </div>

            <select class="select-admin" id="adminProdCatFilter">
              <option value="all" ${productFilterCat === 'all' ? 'selected' : ''}>${I18N.t('allCategories')}</option>
              ${categories.map(c => `<option value="${c.id}" ${productFilterCat === c.id ? 'selected' : ''}>${isAr ? c.nameAr : c.nameEn}</option>`).join('')}
            </select>
          </div>

          <div class="toolbar-actions">
            ${selectedProductIds.size > 0 ? `
              <button type="button" class="btn btn-primary btn-sm" style="background:var(--danger);" onclick="AdminProducts.confirmBulkDelete()">
                🗑️ ${I18N.t('bulkDelete')} (${selectedProductIds.size})
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Products Table -->
        <div class="admin-table-container">
          <div class="table-responsive-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th style="width:40px;">
                    <input type="checkbox" id="selectAllProdsCheckbox" ${products.length > 0 && selectedProductIds.size === products.length ? 'checked' : ''} onchange="AdminProducts.toggleSelectAll(this.checked)">
                  </th>
                  <th>${I18N.t('productImage')}</th>
                  <th>${I18N.t('productName')}</th>
                  <th>${I18N.t('productCategory')}</th>
                  <th>${I18N.t('regularPriceInput')}</th>
                  <th>${I18N.t('discountPriceInput')}</th>
                  <th>${isAr ? 'المخزون' : 'Stock'}</th>
                  <th>${isAr ? 'حالة النشر' : 'Publish Status'}</th>
                  <th>${I18N.t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                ${products.length === 0 ? `
                  <tr>
                    <td colspan="9" style="text-align:center; padding:3rem; color:var(--admin-text-muted);">
                      ${isAr ? 'لا توجد منتجات مسجلة تطابق الفلترة' : 'No registered products match the current filters'}
                    </td>
                  </tr>
                ` : products.map(p => {
                  const cat = categories.find(c => c.id === p.categoryId);
                  const isChecked = selectedProductIds.has(p.id);
                  return `
                    <tr>
                      <td>
                        <input type="checkbox" value="${p.id}" ${isChecked ? 'checked' : ''} onchange="AdminProducts.toggleSelectProduct('${p.id}', this.checked)">
                      </td>
                      <td>
                        <img src="${p.image.startsWith('../') ? p.image.replace('../', '') : p.image}" alt="${isAr ? p.nameAr : p.nameEn}" style="width:44px; height:44px; border-radius:8px; object-fit:cover;">
                      </td>
                      <td>
                        <strong>${isAr ? p.nameAr : p.nameEn}</strong>
                        <div style="font-size:0.75rem; color:var(--admin-text-muted);">${p.nameEn}</div>
                      </td>
                      <td>
                        <span style="font-size:0.85rem; background:var(--admin-bg); padding:0.2rem 0.6rem; border-radius:var(--radius-full);">
                          ${cat ? (isAr ? cat.nameAr : cat.nameEn) : '—'}
                        </span>
                      </td>
                      <td><strong>${p.regularPrice} ${I18N.t('egp')}</strong></td>
                      <td>
                        ${p.discountPrice ? `<strong style="color:var(--admin-primary);">${p.discountPrice} ${I18N.t('egp')}</strong>` : '<span style="color:var(--admin-text-muted);">—</span>'}
                      </td>
                      <td>
                        <button type="button" class="badge-status ${p.inStock ? 'completed' : 'cancelled'}" onclick="AdminProducts.toggleStock('${p.id}', ${!p.inStock})" title="${isAr ? 'اضغط للتبديل' : 'Click to toggle'}">
                          ${p.inStock ? (isAr ? 'متوفر' : 'In Stock') : (isAr ? 'غير متوفر' : 'Out of Stock')}
                        </button>
                      </td>
                      <td>
                        <button type="button" class="badge-status ${p.active ? 'ready' : 'cancelled'}" onclick="AdminProducts.toggleActive('${p.id}', ${!p.active})" title="${isAr ? 'اضغط للتبديل' : 'Click to toggle'}">
                          ${p.active ? (isAr ? 'نشط بالمتجر' : 'Active in Store') : (isAr ? 'معطل' : 'Disabled')}
                        </button>
                      </td>
                      <td>
                        <div style="display:flex; gap:0.4rem;">
                          <button type="button" class="btn btn-outline btn-sm" onclick="AdminProducts.openProductModal('${p.id}')" title="${I18N.t('edit')}">✏️</button>
                          <button type="button" class="btn btn-outline btn-sm" style="color:var(--danger); border-color:var(--danger);" onclick="AdminProducts.deleteProduct('${p.id}')" title="${I18N.t('delete')}">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      this.allProdsCache = allProducts;
      this.bindToolbarEvents();
    },

    bindToolbarEvents() {
      const searchInput = document.getElementById('adminProdSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          productSearch = e.target.value;
          this.render();
        });
      }

      const catFilter = document.getElementById('adminProdCatFilter');
      if (catFilter) {
        catFilter.addEventListener('change', (e) => {
          productFilterCat = e.target.value;
          this.render();
        });
      }
    },

    toggleSelectAll(checked) {
      TajAPI.getProducts({ categoryId: productFilterCat, search: productSearch }).then(prods => {
        if (checked) {
          prods.forEach(p => selectedProductIds.add(p.id));
        } else {
          selectedProductIds.clear();
        }
        this.render();
      });
    },

    toggleSelectProduct(id, checked) {
      if (checked) {
        selectedProductIds.add(id);
      } else {
        selectedProductIds.delete(id);
      }
      this.render();
    },

    async toggleStock(id, newStatus) {
      await TajAPI.updateProduct(id, { inStock: newStatus });
      this.render();
    },

    async toggleActive(id, newStatus) {
      await TajAPI.updateProduct(id, { active: newStatus });
      this.render();
    },

    async deleteProduct(id) {
      if (confirm(I18N.currentLang === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج نهائياً؟' : 'Are you sure you want to permanently delete this product?')) {
        await TajAPI.deleteProduct(id);
        selectedProductIds.delete(id);
        this.render();
      }
    },

    async confirmBulkDelete() {
      if (selectedProductIds.size === 0) return;
      if (confirm(I18N.t('confirmBulkDelete'))) {
        await TajAPI.bulkDeleteProducts(Array.from(selectedProductIds));
        selectedProductIds.clear();
        this.render();
      }
    },

    // Add / Edit Product Modal
    async openProductModal(productId = null) {
      const isAr = I18N.currentLang === 'ar';
      const categories = await TajAPI.getCategories();
      let product = null;

      if (productId) {
        product = await TajAPI.getProductById(productId);
      }

      let modal = document.getElementById('adminProductFormModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminProductFormModal';
        modal.className = 'admin-modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="admin-modal-box">
          <div class="modal-header-admin">
            <h3 style="font-weight:900; font-size:1.25rem; color:var(--admin-primary);">
              ${product ? (isAr ? 'تعديل بيانات المنتج' : 'Edit Product') : I18N.t('addProduct')}
            </h3>
            <button type="button" class="drawer-close-btn" onclick="document.getElementById('adminProductFormModal').classList.remove('active')">✕</button>
          </div>

          <form id="adminProductForm" onsubmit="AdminProducts.saveProductForm(event, '${productId || ''}')">
            <div class="modal-body-admin">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label class="form-label">${I18N.t('productNameAr')} <span class="required-star">*</span></label>
                  <input type="text" class="form-control" id="formProdNameAr" required value="${product ? product.nameAr : ''}" placeholder="${isAr ? 'كنافة أساور بالفستق' : 'Kunafa Asawer with Pistachio'}">
                </div>
                <div class="form-group">
                  <label class="form-label">${I18N.t('productNameEn')} <span class="required-star">*</span></label>
                  <input type="text" class="form-control" id="formProdNameEn" required value="${product ? product.nameEn : ''}" placeholder="Pistachio Kunafa Rings">
                </div>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label class="form-label">${I18N.t('productCategory')} <span class="required-star">*</span></label>
                  <select class="form-select" id="formProdCategory" required>
                    ${categories.map(c => `<option value="${c.id}" ${product && product.categoryId === c.id ? 'selected' : ''}>${isAr ? c.nameAr : c.nameEn}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">${I18N.t('regularPriceInput')} (${I18N.t('egp')}) <span class="required-star">*</span></label>
                  <input type="number" step="0.5" class="form-control" id="formProdRegPrice" required value="${product ? product.regularPrice : ''}">
                </div>
                <div class="form-group">
                  <label class="form-label">${I18N.t('discountPriceInput')} (${I18N.t('egp')})</label>
                  <input type="number" step="0.5" class="form-control" id="formProdDiscPrice" value="${product && product.discountPrice ? product.discountPrice : ''}">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">${isAr ? 'وصف المنتج (عربي)' : 'Product Description (Arabic)'}</label>
                <textarea class="form-control" id="formProdDescAr" rows="2">${product ? product.descAr : ''}</textarea>
              </div>

              <!-- Product Image Selector & Upload -->
              <div class="form-group">
                <label class="form-label">${I18N.t('productImage')}</label>
                <div style="display:flex; gap:1rem; align-items:center;">
                  <img id="formProdImgPreview" src="${product ? product.image : 'assets/images/kunafa_plate.jpg'}" alt="Preview" style="width:70px; height:70px; border-radius:8px; object-fit:cover; border:1px solid var(--admin-border);">
                  <div style="flex-grow:1;">
                    <input type="file" id="formProdImgFile" accept="image/*" class="form-control" onchange="AdminProducts.handleImageUpload(event)">
                    <small style="color:var(--admin-text-muted); font-size:0.75rem;">${isAr ? 'يمكنك رفع صورة من جهازك، أو اختيار أحد القوالب الجاهزة' : 'You can upload an image from your device, or choose one of the presets'}</small>
                  </div>
                </div>
                <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="AdminProducts.setPresetImage('assets/images/kunafa_plate.jpg')">${isAr ? 'صورة كنافة' : 'Kunafa Image'}</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="AdminProducts.setPresetImage('assets/images/basbousa_plate.jpg')">${isAr ? 'صورة بسبوسة' : 'Basbousa Image'}</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="AdminProducts.setPresetImage('assets/images/gateau_cake.jpg')">${isAr ? 'صورة تورتة وجاتوه' : 'Cake & Gateau Image'}</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="AdminProducts.setPresetImage('assets/images/hero_sweets.jpg')">${isAr ? 'صورة مشكل شرقي' : 'Mixed Oriental Sweets Image'}</button>
                </div>
              </div>

              <div style="display:flex; gap:2rem; margin-top:0.5rem;">
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                  <input type="checkbox" id="formProdInStock" ${!product || product.inStock ? 'checked' : ''}>
                  <span>${isAr ? 'متوفر في المخزون' : 'In Stock'}</span>
                </label>
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                  <input type="checkbox" id="formProdActive" ${!product || product.active ? 'checked' : ''}>
                  <span>${isAr ? 'نشط ويظهر للمشترين' : 'Active and visible to customers'}</span>
                </label>
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                  <input type="checkbox" id="formProdNew" ${product && product.isNew ? 'checked' : ''}>
                  <span>${isAr ? 'منتج جديد 🔥 (يظهر بوسم جديد)' : 'New arrival 🔥 (shown with a badge)'}</span>
                </label>
              </div>
            </div>

            <div class="modal-footer-admin">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('adminProductFormModal').classList.remove('active')">${I18N.t('cancel')}</button>
              <button type="submit" class="btn btn-primary">${I18N.t('save')}</button>
            </div>
          </form>
        </div>
      `;

      this.currentEditingImage = product ? product.image : 'assets/images/kunafa_plate.jpg';
      modal.classList.add('active');
    },

    setPresetImage(imgUrl) {
      this.currentEditingImage = imgUrl;
      const preview = document.getElementById('formProdImgPreview');
      if (preview) preview.src = imgUrl;
    },

    handleImageUpload(event) {
      const file = event.target.files && event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const image = new Image();
          image.onload = () => {
            const maxSide = 1200;
            const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            const context = canvas.getContext('2d');
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            this.currentEditingImage = canvas.toDataURL('image/webp', 0.76);
            const preview = document.getElementById('formProdImgPreview');
            if (preview) preview.src = this.currentEditingImage;
          };
          image.onerror = () => alert(I18N.currentLang === 'ar' ? 'تعذر قراءة الصورة. اختر صورة بصيغة JPG أو PNG أو WebP.' : 'Could not read the image. Choose a JPG, PNG or WebP image.');
          image.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },

    async saveProductForm(event, productId) {
      event.preventDefault();
      const payload = {
        nameAr: document.getElementById('formProdNameAr').value,
        nameEn: document.getElementById('formProdNameEn').value,
        categoryId: document.getElementById('formProdCategory').value,
        regularPrice: document.getElementById('formProdRegPrice').value,
        discountPrice: document.getElementById('formProdDiscPrice').value || null,
        descAr: document.getElementById('formProdDescAr').value,
        image: this.currentEditingImage || 'assets/images/kunafa_plate.jpg',
        inStock: document.getElementById('formProdInStock').checked,
        active: document.getElementById('formProdActive').checked,
        isNew: document.getElementById('formProdNew').checked
      };

      try {
        if (productId) {
          await TajAPI.updateProduct(productId, payload);
        } else {
          await TajAPI.createProduct(payload);
        }
        document.getElementById('adminProductFormModal').classList.remove('active');
        this.render();
      } catch (err) {
        alert(I18N.t('error') + ': ' + err.message);
      }
    },

    // Add / Edit Category Modal
    async openCategoryModal(categoryId = null) {
      const isAr = I18N.currentLang === 'ar';
      let category = null;
      if (categoryId) {
        const cats = await TajAPI.getCategories();
        category = cats.find(c => c.id === categoryId);
      }

      let modal = document.getElementById('adminCategoryModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminCategoryModal';
        modal.className = 'admin-modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="admin-modal-box">
          <div class="modal-header-admin">
            <h3 style="font-weight:900; font-size:1.25rem; color:var(--admin-primary);">
              ${category ? (isAr ? 'تعديل قسم' : 'Edit Category') : I18N.t('addCategory')}
            </h3>
            <button type="button" class="drawer-close-btn" onclick="document.getElementById('adminCategoryModal').classList.remove('active')">✕</button>
          </div>

          <form id="adminCategoryForm" onsubmit="AdminProducts.saveCategoryForm(event, '${categoryId || ''}')">
            <div class="modal-body-admin">
              <div class="form-group">
                <label class="form-label">${I18N.t('categoryNameAr')} <span class="required-star">*</span></label>
                <input type="text" class="form-control" id="formCatNameAr" required value="${category ? category.nameAr : ''}" placeholder="${isAr ? 'حلويات شرقية فاخرة' : 'Luxury Oriental Sweets'}">
              </div>
              <div class="form-group">
                <label class="form-label">${I18N.t('categoryNameEn')} <span class="required-star">*</span></label>
                <input type="text" class="form-control" id="formCatNameEn" required value="${category ? category.nameEn : ''}" placeholder="Luxury Oriental Sweets">
              </div>
              <div class="form-group">
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                  <input type="checkbox" id="formCatActive" ${!category || category.active ? 'checked' : ''}>
                  <span>${isAr ? 'نشط ويظهر في المتجر' : 'Active and shown in the store'}</span>
                </label>
              </div>
            </div>
            <div class="modal-footer-admin">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('adminCategoryModal').classList.remove('active')">${I18N.t('cancel')}</button>
              <button type="submit" class="btn btn-primary">${I18N.t('save')}</button>
            </div>
          </form>
        </div>
      `;

      modal.classList.add('active');
    },

    editCategory(id) {
      this.openCategoryModal(id);
    },

    async saveCategoryForm(event, categoryId) {
      event.preventDefault();
      const payload = {
        nameAr: document.getElementById('formCatNameAr').value,
        nameEn: document.getElementById('formCatNameEn').value,
        active: document.getElementById('formCatActive').checked
      };

      try {
        if (categoryId) {
          await TajAPI.updateCategory(categoryId, payload);
        } else {
          await TajAPI.createCategory(payload);
        }
        document.getElementById('adminCategoryModal').classList.remove('active');
        this.render();
      } catch (err) {
        alert(I18N.t('error') + ': ' + err.message);
      }
    },

    async deleteCategory(id) {
      try {
        if (confirm(I18N.currentLang === 'ar' ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this category?')) {
          await TajAPI.deleteCategory(id);
          this.render();
        }
      } catch (err) {
        alert('⚠️ ' + err.message);
      }
    },

    // XLSX Import Parser
    async handleImport(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      try {
        const rows = await TajAPI.readXLSX(await file.arrayBuffer());
        const dataRows = rows.slice(1).filter(r => r.slice(0, 3).some(v => String(v).trim() !== ''));
        if (!dataRows.length) {
          alert(I18N.currentLang === 'ar' ? 'الملف فارغ أو لا يحتوي على بيانات منتجات' : 'The file is empty or contains no product data');
          return;
        }

        const categories = await TajAPI.getCategories();
        const defaultCatId = categories[0] ? categories[0].id : 'cat-oriental';

        let importedCount = 0;
        for (const row of dataRows) {
          const catId = String(row[0] || '').trim() || defaultCatId;
          const nameAr = String(row[1] || '').trim() || 'منتج مستورد';
          const nameEn = String(row[2] || '').trim() || 'Imported Product';
          const regularPrice = parseFloat(row[3]) || 150;
          const discountPrice = (row[4] === '' || row[4] == null) ? null : parseFloat(row[4]);

          await TajAPI.createProduct({
            categoryId: catId,
            nameAr,
            nameEn,
            regularPrice,
            discountPrice,
            descAr: String(row[7] || ''),
            descEn: String(row[8] || ''),
            image: 'assets/images/kunafa_plate.jpg',
            inStock: String(row[5]) !== '0',
            active: String(row[6]) !== '0'
          });
          importedCount++;
        }

        alert(I18N.currentLang === 'ar' ? `تم استيراد ${importedCount} منتج بنجاح وتحديثها في المتجر.` : `Imported ${importedCount} product(s) successfully and updated them in the store.`);
        AdminProducts.render();
      } catch (err) {
        alert((I18N.currentLang === 'ar' ? 'خطأ أثناء قراءة ملف XLSX: ' : 'Error reading XLSX file: ') + err.message);
      }
      event.target.value = '';
    }
  };
})();

window.AdminProducts = AdminProducts;
