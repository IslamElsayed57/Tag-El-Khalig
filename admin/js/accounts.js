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
          <form id="createStaffAccountForm" class="admin-table-container" style="padding:1.25rem; margin-bottom:1.25rem;">
            <h3 style="margin-bottom:1rem;">إنشاء حساب دخول جديد</h3>
            <div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.8rem;">
              <label>اسم المستخدم<input name="username" required autocomplete="off"></label>
              <label>الاسم بالعربية<input name="nameAr" required></label>
              <label>الاسم بالإنجليزية<input name="nameEn" required></label>
              <label>كلمة مرور مؤقتة (12 حرفًا على الأقل)<input name="password" type="password" minlength="12" required autocomplete="new-password"></label>
              <label>نوع الحساب<select name="role"><option value="branch">Branch</option><option value="admin">Admin</option></select></label>
              <label id="staffBranchField">الفرع<select name="branchId" required>${branches.filter(b=>b.active).map(b=>`<option value="${b.id}">${isAr?b.nameAr:b.nameEn}</option>`).join('')}</select></label>
            </div>
            <p id="staffAccountMessage" role="status" style="margin:.75rem 0;"></p>
            <button type="submit" class="btn btn-primary">إنشاء الحساب</button>
          </form>
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
      const accountForm = document.getElementById('createStaffAccountForm');
      if (accountForm) {
        const role = accountForm.elements.role;
        const branchField = document.getElementById('staffBranchField');
        const updateBranchRequirement = () => {
          branchField.hidden = role.value !== 'branch';
          accountForm.elements.branchId.required = role.value === 'branch';
        };
        role.addEventListener('change', updateBranchRequirement);
        updateBranchRequirement();
        accountForm.addEventListener('submit', async event => {
          event.preventDefault();
          const button = accountForm.querySelector('button[type="submit"]');
          const message = document.getElementById('staffAccountMessage');
          button.disabled = true;
          const data = Object.fromEntries(new FormData(accountForm));
          try {
            await TajAPI.createUser(data);
            message.textContent = 'تم إنشاء الحساب. سلّم كلمة المرور المؤقتة للموظف بأمان.';
            await this.render();
          } catch (error) {
            message.textContent = error.message;
            button.disabled = false;
          }
        });
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
