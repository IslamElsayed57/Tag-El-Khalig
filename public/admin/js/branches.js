/**
 * Taj El Khalig Sweets - Admin Branches & Settings Controller
 * Branches CRUD, Delivery Eligibility, Social Media & Delivery Thresholds.
 */

const AdminBranches = (function() {
  return {
    async render() {
      const container = document.getElementById('view-branches');
      if (!container) return;

      const isAr = I18N.currentLang === 'ar';
      const currentUser = AdminApp.getCurrentUser();

      // Branch accounts restricted
      if (currentUser && currentUser.role === 'branch') {
        container.innerHTML = `
          <div class="system-status-banner" style="background:var(--danger-bg); border-color:var(--danger); color:var(--danger);">
            <span>🚫 ${I18N.t('permissionRestrictedNotice')}</span>
          </div>
        `;
        return;
      }

      const [branches, settings] = await Promise.all([
        TajAPI.getBranches(),
        TajAPI.getSettings()
      ]);

      container.innerHTML = `
        <!-- Branches Section -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
          <h3 style="font-weight:900; font-size:1.25rem; color:var(--admin-text);">${isAr ? 'قائمة الفروع المسجلة' : 'Registered Branches'} (${branches.length})</h3>
          <button type="button" class="btn btn-primary btn-sm" onclick="AdminBranches.openBranchModal()">
            ➕ ${I18N.t('addBranch')}
          </button>
        </div>

        <div class="admin-table-container" style="margin-bottom:2.5rem;">
          <div class="table-responsive-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>${isAr ? 'اسم الفرع' : 'Branch Name'}</th>
                  <th>${isAr ? 'العنوان' : 'Address'}</th>
                  <th>${isAr ? 'رقم الهاتف' : 'Phone Number'}</th>
                  <th>${isAr ? 'مدير الفرع' : 'Branch Manager'}</th>
                  <th>${isAr ? 'خدمة التوصيل' : 'Delivery Service'}</th>
                  <th>${isAr ? 'الحالة' : 'Status'}</th>
                  <th>${I18N.t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                ${branches.map(b => `
                  <tr>
                    <td><strong>${isAr ? b.nameAr : b.nameEn}</strong></td>
                    <td style="font-size:0.85rem; max-width:240px;">${isAr ? b.addressAr : b.addressEn}</td>
                    <td dir="ltr" style="font-family:monospace; font-size:0.9rem;">${b.phone}</td>
                    <td>${(isAr ? b.managerAr : b.managerEn) || '—'}</td>
                    <td>
                      <span class="badge-status ${b.deliveryEligible ? 'completed' : 'cancelled'}">
                        ${b.deliveryEligible ? (isAr ? 'متاح للتوصيل' : 'Delivery Available') : (isAr ? 'استلام فقط' : 'Pickup Only')}
                      </span>
                    </td>
                    <td>
                      <button type="button" class="badge-status ${b.active ? 'ready' : 'cancelled'}" onclick="AdminBranches.toggleActive('${b.id}', ${!b.active})">
                        ${b.active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Disabled')}
                      </button>
                    </td>
                    <td>
                      <div style="display:flex; gap:0.4rem;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="AdminBranches.openBranchModal('${b.id}')" title="${isAr ? 'تعديل' : 'Edit'}">✏️</button>
                        <a href="${b.mapUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" title="${isAr ? 'خرائط Google' : 'Google Maps'}">🗺️</a>
                        <button type="button" class="btn btn-outline btn-sm" style="color:var(--danger); border-color:var(--danger);" onclick="AdminBranches.deleteBranch('${b.id}')" title="${isAr ? 'حذف' : 'Delete'}">🗑️</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Shop Settings Section -->
        <div style="background:var(--admin-surface); border:1px solid var(--admin-border); border-radius:var(--radius-lg); padding:2rem; box-shadow:var(--shadow-card);">
          <h3 style="font-weight:900; font-size:1.25rem; color:var(--admin-primary); margin-bottom:1.5rem;">
            ⚙️ ${I18N.t('shopSettingsTitle')}
          </h3>

          <form id="adminShopSettingsForm" onsubmit="AdminBranches.saveSettings(event)">
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem;">
              <div class="form-group">
                <label class="form-label">${I18N.t('contactPhone')}</label>
                <input type="text" class="form-control" id="settingContactPhone" value="${settings.contactPhone || ''}">
              </div>

              <div class="form-group">
                <label class="form-label">${I18N.t('whatsappNumber')}</label>
                <input type="text" class="form-control" id="settingWhatsappNumber" value="${settings.whatsappNumber || ''}">
              </div>

              <div class="form-group">
                <label class="form-label">${I18N.t('contactEmail')}</label>
                <input type="email" class="form-control" id="settingContactEmail" value="${settings.contactEmail || ''}">
              </div>

              <div class="form-group">
                <label class="form-label">${I18N.t('deliveryFeeDefault')}</label>
                <input type="number" step="1" class="form-control" id="settingDeliveryFee" value="${settings.deliveryFee || 25}">
              </div>

              <div class="form-group">
                <label class="form-label">${I18N.t('freeDeliveryThreshold')}</label>
                <input type="number" step="5" class="form-control" id="settingFreeThreshold" value="${settings.freeDeliveryThreshold || 250}">
              </div>

              <div class="form-group">
                <label class="form-label">${I18N.t('facebookUrl')}</label>
                <input type="url" class="form-control" id="settingFacebook" value="${settings.facebookUrl || ''}">
              </div>

              <div class="form-group">
                <label class="form-label">${I18N.t('instagramUrl')}</label>
                <input type="url" class="form-control" id="settingInstagram" value="${settings.instagramUrl || ''}">
              </div>

              <div class="form-group">
                <label class="form-label">${I18N.t('tiktokUrl')}</label>
                <input type="url" class="form-control" id="settingTiktok" value="${settings.tiktokUrl || ''}">
              </div>
            </div>

            <div style="margin-top:1.5rem; display:flex; justify-content:flex-end;">
              <button type="submit" class="btn btn-primary" style="padding:0.75rem 2.5rem;">
                💾 ${I18N.t('saveSettingsBtn')}
              </button>
            </div>
          </form>
        </div>
      `;
    },

    async openBranchModal(branchId = null) {
      const isAr = I18N.currentLang === 'ar';
      let branch = null;
      if (branchId) {
        branch = await TajAPI.getBranchById(branchId);
      }

      let modal = document.getElementById('adminBranchModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminBranchModal';
        modal.className = 'admin-modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="admin-modal-box">
          <div class="modal-header-admin">
            <h3 style="font-weight:900; font-size:1.25rem; color:var(--admin-primary);">
              ${branch ? (isAr ? 'تعديل بيانات الفرع' : 'Edit Branch') : I18N.t('addBranch')}
            </h3>
            <button type="button" class="drawer-close-btn" onclick="document.getElementById('adminBranchModal').classList.remove('active')">✕</button>
          </div>

          <form id="adminBranchForm" onsubmit="AdminBranches.saveBranchForm(event, '${branchId || ''}')">
            <div class="modal-body-admin">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label class="form-label">${I18N.t('branchNameAr')} <span class="required-star">*</span></label>
                  <input type="text" class="form-control" id="formBranchNameAr" required value="${branch ? branch.nameAr : ''}" placeholder="${isAr ? 'فرع مدينة نصر' : 'Nasr City Branch'}">
                </div>
                <div class="form-group">
                  <label class="form-label">${I18N.t('branchNameEn')} <span class="required-star">*</span></label>
                  <input type="text" class="form-control" id="formBranchNameEn" required value="${branch ? branch.nameEn : ''}" placeholder="Nasr City Branch">
                </div>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label class="form-label">${I18N.t('branchPhoneInput')} <span class="required-star">*</span></label>
                  <input type="tel" class="form-control" id="formBranchPhone" required value="${branch ? branch.phone : ''}" placeholder="01023456782">
                </div>
                <div class="form-group">
                  <label class="form-label">${I18N.t('branchManagerInput')}</label>
                  <input type="text" class="form-control" id="formBranchManager" value="${branch && branch.managerAr ? branch.managerAr : ''}">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">${I18N.t('branchAddressInput')} <span class="required-star">*</span></label>
                  <input type="text" class="form-control" id="formBranchAddressAr" required value="${branch ? branch.addressAr : ''}" placeholder="${isAr ? 'شارع عباس العقاد، تقاطع مصطفى النحاس، القاهرة' : 'Abbas El Akkad St., Mustafa El Nahas St. Intersection, Cairo'}">
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label class="form-label">${I18N.t('branchHours')} (عربي)</label>
                  <input type="text" class="form-control" id="formBranchHoursAr" value="${branch && branch.hoursAr ? branch.hoursAr : ''}" placeholder="${isAr ? 'يومياً من 9 صباحاً حتى 12 منتصف الليل' : 'Daily 9 AM - 12 AM'}">
                </div>
                <div class="form-group">
                  <label class="form-label">${I18N.t('branchHours')} (English)</label>
                  <input type="text" class="form-control" id="formBranchHoursEn" value="${branch && branch.hoursEn ? branch.hoursEn : ''}" placeholder="Daily 9 AM - 12 AM" dir="ltr">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">${I18N.t('branchMapUrl')}</label>
                <input type="url" class="form-control" id="formBranchMapUrl" value="${branch ? branch.mapUrl : ''}" placeholder="https://maps.google.com/?q=30.0617,31.3368">
              </div>

              <div style="display:flex; gap:2rem; margin-top:0.5rem;">
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                  <input type="checkbox" id="formBranchDeliveryEligible" ${!branch || branch.deliveryEligible ? 'checked' : ''}>
                  <span>${I18N.t('deliveryEligibility')}</span>
                </label>
                <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                  <input type="checkbox" id="formBranchActive" ${!branch || branch.active ? 'checked' : ''}>
                  <span>${isAr ? 'نشط ويظهر للمشترين' : 'Active and visible to customers'}</span>
                </label>
              </div>
            </div>

            <div class="modal-footer-admin">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('adminBranchModal').classList.remove('active')">${I18N.t('cancel')}</button>
              <button type="submit" class="btn btn-primary">${I18N.t('save')}</button>
            </div>
          </form>
        </div>
      `;

      modal.classList.add('active');
    },

    async saveBranchForm(event, branchId) {
      event.preventDefault();
      const payload = {
        nameAr: document.getElementById('formBranchNameAr').value,
        nameEn: document.getElementById('formBranchNameEn').value,
        phone: document.getElementById('formBranchPhone').value,
        managerAr: document.getElementById('formBranchManager').value,
        managerEn: document.getElementById('formBranchManager').value,
        addressAr: document.getElementById('formBranchAddressAr').value,
        addressEn: document.getElementById('formBranchAddressAr').value,
        hoursAr: document.getElementById('formBranchHoursAr').value.trim(),
        hoursEn: document.getElementById('formBranchHoursEn').value.trim(),
        mapUrl: document.getElementById('formBranchMapUrl').value,
        deliveryEligible: document.getElementById('formBranchDeliveryEligible').checked,
        active: document.getElementById('formBranchActive').checked
      };

      try {
        if (branchId) {
          await TajAPI.updateBranch(branchId, payload);
        } else {
          await TajAPI.createBranch(payload);
        }
        document.getElementById('adminBranchModal').classList.remove('active');
        this.render();
      } catch (err) {
        alert(I18N.t('error') + ': ' + err.message);
      }
    },

    async toggleActive(branchId, newStatus) {
      await TajAPI.updateBranch(branchId, { active: newStatus });
      this.render();
    },

    async deleteBranch(branchId) {
      if (confirm(I18N.currentLang === 'ar' ? 'هل أنت متأكد من حذف هذا الفرع؟' : 'Are you sure you want to delete this branch?')) {
        let branches = await TajAPI.getBranches();
        branches = branches.filter(b => b.id !== branchId);
        localStorage.setItem('taj_branches_v1', JSON.stringify(branches));
        window.dispatchEvent(new CustomEvent('taj_branches_updated'));
        this.render();
      }
    },

    async saveSettings(event) {
      event.preventDefault();
      const payload = {
        contactPhone: document.getElementById('settingContactPhone').value.trim(),
        whatsappNumber: document.getElementById('settingWhatsappNumber').value.trim(),
        contactEmail: document.getElementById('settingContactEmail').value.trim(),
        deliveryFee: parseFloat(document.getElementById('settingDeliveryFee').value) || 25,
        freeDeliveryThreshold: parseFloat(document.getElementById('settingFreeThreshold').value) || 250,
        facebookUrl: document.getElementById('settingFacebook').value.trim(),
        instagramUrl: document.getElementById('settingInstagram').value.trim(),
        tiktokUrl: document.getElementById('settingTiktok').value.trim()
      };

      await TajAPI.updateSettings(payload);
      alert(I18N.t('settingsSavedSuccess'));
    }
  };
})();

window.AdminBranches = AdminBranches;
