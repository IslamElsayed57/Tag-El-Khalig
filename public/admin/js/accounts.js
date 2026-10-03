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
            <strong>نظام الصلاحيات والحماية (Role-Based Access Control):</strong>
            <p style="margin-top:0.25rem;">
              يدعم النظام مستويين من الصلاحيات: <strong>admin</strong> (الوصول الكامل والتحكم بجميع الإعدادات والمنتجات والفروع)، و <strong>branch</strong> (مقيد فقط بطلبات وتقارير الفرع التابع له، ومحجوب عنه كلياً تعديل المنتجات أو الأقسام أو الفروع أو إعدادات المتجر).
            </p>
          </div>
        </div>

        ${window.TAJ_CONFIG?.mode === 'remote' ? `
          <div style="margin-bottom:1.25rem;">
            <button type="button" class="btn btn-primary" onclick="AdminAccounts.openUserModal()">
              ➕ إضافة مستخدم جديد
            </button>
          </div>
        ` : ''}

        <div class="admin-table-container">
          <div class="table-responsive-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>${I18N.t('accountUser')}</th>
                  <th>الاسم المعروض</th>
                  <th>${I18N.t('accountRole')}</th>
                  <th>${I18N.t('accountBranch')}</th>
                  <th>الحالة</th>
                  <th>${window.TAJ_CONFIG?.mode === 'remote' ? 'الحالة' : 'تبديل الحساب للاختبار'}</th>
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
                      <td>${branch ? (isAr ? branch.nameAr : branch.nameEn) : '— (جميع الفروع)'}</td>
                      <td>
                        <span class="badge-status ${u.active === false ? 'cancelled' : 'completed'}">${u.active === false ? 'معطل' : 'نشط'}</span>
                      </td>
                      <td>
                        ${window.TAJ_CONFIG?.mode === 'remote' ? (isCurrent ? 'جلسة الدخول الحالية' : `<button type="button" class="btn btn-outline btn-sm" onclick="AdminAccounts.setActive('${u.id}', ${u.active === false})">${u.active === false ? 'تفعيل الحساب' : 'تعطيل الحساب'}</button>`) : isCurrent ? `
                          <span style="color:var(--admin-primary); font-weight:800;">👈 الحساب النشط حالياً</span>
                        ` : `
                          <button type="button" class="btn btn-outline btn-sm" onclick="AdminApp.switchUser('${u.id}')">
                            🔄 تسجيل الدخول بهذا الحساب
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
            <h3 style="font-weight:900; font-size:1.25rem; color:var(--admin-primary);">إضافة مستخدم جديد</h3>
            <button type="button" class="drawer-close-btn" onclick="document.getElementById('adminUserModal').classList.remove('active')">✕</button>
          </div>

          <form id="createStaffAccountForm" onsubmit="AdminAccounts.saveUserForm(event)">
            <div class="modal-body-admin">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group">
                  <label class="form-label">اسم المستخدم <span class="required-star">*</span></label>
                  <input type="text" class="form-control" name="username" required autocomplete="off">
                </div>
                <div class="form-group">
                  <label class="form-label">الاسم بالعربية <span class="required-star">*</span></label>
                  <input type="text" class="form-control" name="nameAr" required>
                </div>
                <div class="form-group">
                  <label class="form-label">الاسم بالإنجليزية <span class="required-star">*</span></label>
                  <input type="text" class="form-control" name="nameEn" required>
                </div>
                <div class="form-group">
                  <label class="form-label">كلمة مرور مؤقتة (12 حرفًا على الأقل) <span class="required-star">*</span></label>
                  <input type="password" class="form-control" name="password" minlength="12" required autocomplete="new-password">
                </div>
                <div class="form-group">
                  <label class="form-label">نوع الحساب</label>
                  <select class="form-control" name="role">
                    <option value="branch">Branch</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div class="form-group" id="staffBranchField">
                  <label class="form-label">الفرع <span class="required-star">*</span></label>
                  <select class="form-control" name="branchId" required>${branches.filter(b=>b.active).map(b=>`<option value="${b.id}">${isAr?b.nameAr:b.nameEn}</option>`).join('')}</select>
                </div>
              </div>
              <p id="staffAccountMessage" role="status" style="margin:.75rem 0; min-height:1.2rem; color:var(--danger);"></p>
            </div>

            <div class="modal-footer-admin">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('adminUserModal').classList.remove('active')">إلغاء</button>
              <button type="submit" class="btn btn-primary">حفظ</button>
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
