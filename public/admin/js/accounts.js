/**
 * Taj El Khalig Sweets - Admin Accounts & Permissions Controller
 * 2-role system: 'admin' (full access) vs 'branch' (scoped strictly to assigned branch).
 */

const AdminAccounts = (function() {
  return {
    async render() {
      const container = document.getElementById('view-accounts');
      if (!container) return;

      const isAr = I18N.currentLang === 'ar';
      const currentUser = AdminApp.getCurrentUser();

      // Branch users are restricted
      if (currentUser && currentUser.role === 'branch') {
        container.innerHTML = `
          <div class="system-status-banner" style="background:var(--danger-bg); border-color:var(--danger); color:var(--danger);">
            <span>🚫 ${I18N.t('permissionRestrictedNotice')}</span>
          </div>
        `;
        return;
      }

      const users = await TajAPI.getUsers();
      const branches = await TajAPI.getBranches();

      container.innerHTML = `
        <div class="system-status-banner">
          <div class="system-status-icon">🛡️</div>
          <div>
            <strong>${isAr ? 'نظام الصلاحيات والحماية (Role-Based Access Control):' : 'Permissions & Protection System (Role-Based Access Control):'}</strong>
            <p style="margin-top:0.25rem;">
              ${isAr ? 'يدعم النظام مستويين من الصلاحيات:' : 'The system supports two permission levels:'} <strong>admin</strong> ${isAr ? '(الوصول الكامل والتحكم بجميع الإعدادات والمنتجات والفروع)، و' : '(full access and control over all settings, products and branches), and'} <strong>branch</strong> ${isAr ? '(مقيد فقط بطلبات وتقارير الفرع التابع له، ومحجوب عنه كلياً تعديل المنتجات أو الأقسام أو الفروع أو إعدادات المتجر).' : '(limited strictly to the orders and reports of their assigned branch, and completely blocked from editing products, categories, branches or shop settings).'}
            </p>
          </div>
        </div>

        ${window.TAJ_CONFIG?.mode === 'remote' ? `
          <div style="margin-bottom:1.25rem;">
            <button type="button" class="btn btn-primary" onclick="AdminAccounts.openUserModal()">
              ➕ ${isAr ? 'إضافة مستخدم جديد' : 'Add New User'}
            </button>
          </div>
        ` : ''}

        <div class="admin-table-container">
          <div class="table-responsive-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>${I18N.t('accountUser')}</th>
                  <th>${isAr ? 'الاسم المعروض' : 'Display Name'}</th>
                  <th>${I18N.t('accountRole')}</th>
                  <th>${I18N.t('accountBranch')}</th>
                  <th>${isAr ? 'الحالة' : 'Status'}</th>
                  <th>${window.TAJ_CONFIG?.mode === 'remote' ? (isAr ? 'الحالة' : 'Status') : (isAr ? 'تبديل الحساب للاختبار' : 'Switch Account (Test)')}</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(u => {
                  const branch = branches.find(b => b.id === u.branchId);
                  const isCurrent = currentUser && currentUser.id === u.id;
                  return `
                    <tr style="${isCurrent ? 'background:var(--admin-primary-light); font-weight:700;' : ''}">
                      <td><code>${u.username}</code></td>
                      <td>${isAr ? u.nameAr : u.nameEn}</td>
                      <td>
                        <span class="user-role-badge role-${u.role}">
                          ${u.role === 'admin' ? I18N.t('roleAdmin') : I18N.t('roleBranch')}
                        </span>
                      </td>
                      <td>${branch ? (isAr ? branch.nameAr : branch.nameEn) : (isAr ? '— (جميع الفروع)' : '— (All Branches)')}</td>
                      <td>
                        <span class="badge-status ${u.active === false ? 'cancelled' : 'completed'}">${u.active === false ? (isAr ? 'معطل' : 'Disabled') : (isAr ? 'نشط' : 'Active')}</span>
                      </td>
                      <td>
                        ${window.TAJ_CONFIG?.mode === 'remote' ? (isCurrent ? (isAr ? 'جلسة الدخول الحالية' : 'Current Login Session') : `<button type="button" class="btn btn-outline btn-sm" onclick="AdminAccounts.setActive('${u.id}', ${u.active === false})">${u.active === false ? (isAr ? 'تفعيل الحساب' : 'Enable Account') : (isAr ? 'تعطيل الحساب' : 'Disable Account')}</button>`) : isCurrent ? `
                          <span style="color:var(--admin-primary); font-weight:800;">${isAr ? '👈 الحساب النشط حالياً' : '👈 Currently active account'}</span>
                        ` : `
                          <button type="button" class="btn btn-outline btn-sm" onclick="AdminApp.switchUser('${u.id}')">
                            ${isAr ? '🔄 تسجيل الدخول بهذا الحساب' : '🔄 Sign in with this account'}
                          </button>
                        `}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },
    async openUserModal() {
      const isAr = I18N.currentLang === 'ar';
      const branches = await TajAPI.getBranches();

      let modal = document.getElementById('adminUserModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminUserModal';
        modal.className = 'admin-modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="admin-modal-box">
          <div class="modal-header-admin">
            <h3 style="font-weight:900; font-size:1.25rem; color:var(--admin-primary);">${isAr ? 'إضافة مستخدم جديد' : 'Add New User'}</h3>
            <button type="button" class="drawer-close-btn" onclick="document.getElementById('adminUserModal').classList.remove('active')">✕</button>
          </div>

          <form id="createStaffAccountForm" onsubmit="AdminAccounts.saveUserForm(event)">
            <div class="modal-body-admin">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label class="form-label">${isAr ? 'اسم المستخدم' : 'Username'} <span class="required-star">*</span></label>
                  <input type="text" class="form-control" name="username" required autocomplete="off">
                </div>
                <div class="form-group">
                  <label class="form-label">${isAr ? 'الاسم بالعربية' : 'Arabic Name'} <span class="required-star">*</span></label>
                  <input type="text" class="form-control" name="nameAr" required>
                </div>
                <div class="form-group">
                  <label class="form-label">${isAr ? 'الاسم بالإنجليزية' : 'English Name'} <span class="required-star">*</span></label>
                  <input type="text" class="form-control" name="nameEn" required>
                </div>
                <div class="form-group">
                  <label class="form-label">${isAr ? 'كلمة مرور مؤقتة (12 حرفًا على الأقل)' : 'Temporary Password (min 12 characters)'} <span class="required-star">*</span></label>
                  <input type="password" class="form-control" name="password" minlength="12" required autocomplete="new-password">
                </div>
                <div class="form-group">
                  <label class="form-label">${isAr ? 'نوع الحساب' : 'Account Type'}</label>
                  <select class="form-control" name="role">
                    <option value="branch">Branch</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div class="form-group" id="staffBranchField">
                  <label class="form-label">${isAr ? 'الفرع' : 'Branch'} <span class="required-star">*</span></label>
                  <select class="form-control" name="branchId" required>${branches.filter(b=>b.active).map(b=>`<option value="${b.id}">${isAr?b.nameAr:b.nameEn}</option>`).join('')}</select>
                </div>
              </div>
              <p id="staffAccountMessage" role="status" style="margin:.75rem 0; min-height:1.2rem; color:var(--danger);"></p>
            </div>

            <div class="modal-footer-admin">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('adminUserModal').classList.remove('active')">${isAr ? 'إلغاء' : 'Cancel'}</button>
              <button type="submit" class="btn btn-primary">${isAr ? 'حفظ' : 'Save'}</button>
            </div>
          </form>
        </div>
      `;

      modal.classList.add('active');

      const form = document.getElementById('createStaffAccountForm');
      const role = form.elements.role;
      const branchField = document.getElementById('staffBranchField');
      const updateBranchRequirement = () => {
        branchField.style.display = role.value === 'branch' ? '' : 'none';
        form.elements.branchId.required = role.value === 'branch';
      };
      role.addEventListener('change', updateBranchRequirement);
      updateBranchRequirement();
    },
    async saveUserForm(event) {
      event.preventDefault();
      const form = event.target;
      const button = form.querySelector('button[type="submit"]');
      const message = document.getElementById('staffAccountMessage');
      button.disabled = true;
      message.textContent = '';
      const data = Object.fromEntries(new FormData(form));
      try {
        await TajAPI.createUser(data);
        document.getElementById('adminUserModal').classList.remove('active');
        await this.render();
      } catch (error) {
        message.textContent = error.message;
        button.disabled = false;
      }
    },
    async setActive(id, active) {
      try {
        await TajAPI.setUserActive(id, active);
        await this.render();
      } catch (error) {
        alert(error.message);
      }
    }
  };
})();

window.AdminAccounts = AdminAccounts;
