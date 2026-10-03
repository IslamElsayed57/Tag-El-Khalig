/**
 * Taj El Khalig Sweets - Admin Customers Controller
 * Aggregates customer data by phone number, cumulative spend, and order history.
 */

const AdminCustomers = (function() {
  let customerSearch = '';

  return {
    async render() {
      const container = document.getElementById('view-customers');
      if (!container) return;

      const isAr = I18N.currentLang === 'ar';
      const customers = await TajAPI.getCustomers(customerSearch);

      container.innerHTML = `
        <div class="admin-toolbar">
          <div class="toolbar-filters">
            <div class="search-box-admin">
              <span class="search-icon">🔍</span>
              <input type="text" id="customerSearchInput" value="${customerSearch}" placeholder="${isAr ? 'بحث باسم العميل أو رقم الهاتف...' : 'Search customer by name or phone...'}">
            </div>
          </div>
          <div class="toolbar-actions">
            <span style="font-weight:700; color:var(--admin-text-muted);">
              ${customers.length} ${isAr ? 'عميل مسجل' : 'Registered Customers'}
            </span>
          </div>
        </div>

        <div class="admin-table-container">
          <div class="table-responsive-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>${I18N.t('orderCustomer')}</th>
                  <th>${I18N.t('orderPhone')}</th>
                  <th>${I18N.t('customerOrdersCount')}</th>
                  <th>${I18N.t('customerTotalSpend')}</th>
                  <th>${I18N.t('lastOrder')}</th>
                  <th>${I18N.t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                ${customers.length === 0 ? `
                  <tr>
                    <td colspan="6" style="text-align:center; padding:3rem; color:var(--admin-text-muted);">
                      لا يوجد عملاء يطابقون البحث
                    </td>
                  </tr>
                ` : customers.map(c => `
                  <tr>
                    <td><strong>${c.name}</strong></td>
                    <td dir="ltr" style="font-family:monospace; font-size:0.95rem;">${c.phone}</td>
                    <td><span class="badge-status ready">${c.ordersCount} ${isAr ? 'طلبات' : 'orders'}</span></td>
                    <td><strong style="color:var(--admin-primary);">${c.totalSpend} ${I18N.t('egp')}</strong></td>
                    <td style="font-size:0.85rem; color:var(--admin-text-muted);">${new Date(c.lastOrderDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td>
                      <button type="button" class="btn btn-outline btn-sm" onclick="AdminCustomers.viewCustomerHistory('${c.phone}')">
                        📜 ${I18N.t('viewHistory')}
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      const searchInput = document.getElementById('customerSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          customerSearch = e.target.value;
          this.render();
        });
      }
    },

    async viewCustomerHistory(phone) {
      const customers = await TajAPI.getCustomers();
      const customer = customers.find(c => c.phone === phone);
      if (!customer) return;

      const isAr = I18N.currentLang === 'ar';
      let modal = document.getElementById('adminCustomerHistoryModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminCustomerHistoryModal';
        modal.className = 'admin-modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="admin-modal-box">
          <div class="modal-header-admin">
            <div>
              <h3 style="font-weight:900; font-size:1.3rem; color:var(--admin-primary);">${isAr ? 'سجل طلبات العميل' : 'Customer Order History'}: ${customer.name}</h3>
              <div dir="ltr" style="font-size:0.9rem; color:var(--admin-text-muted); font-family:monospace;">${customer.phone}</div>
            </div>
            <button type="button" class="drawer-close-btn" onclick="document.getElementById('adminCustomerHistoryModal').classList.remove('active')">✕</button>
          </div>

          <div class="modal-body-admin">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem; background:var(--admin-bg); padding:1rem; border-radius:var(--radius-md);">
              <div>
                <span style="font-size:0.85rem; color:var(--admin-text-muted);">${I18N.t('customerOrdersCount')}</span>
                <div style="font-size:1.4rem; font-weight:900;">${customer.ordersCount}</div>
              </div>
              <div>
                <span style="font-size:0.85rem; color:var(--admin-text-muted);">${I18N.t('customerTotalSpend')}</span>
                <div style="font-size:1.4rem; font-weight:900; color:var(--admin-primary);">${customer.totalSpend} ${I18N.t('egp')}</div>
              </div>
            </div>

            <h4 style="font-weight:800; margin-bottom:0.75rem;">${isAr ? 'الطلبات السابقة:' : 'Previous Orders:'}</h4>
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              ${customer.orders.map(order => `
                <div style="border:1px solid var(--admin-border); border-radius:var(--radius-md); padding:0.85rem; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div style="font-weight:800;">${isAr ? 'طلب' : 'Order'} #${order.id} - ${order.type === 'delivery' ? (isAr ? '🛵 توصيل' : '🛵 Delivery') : (isAr ? '🏬 استلام' : '🏬 Pickup')}</div>
                    <div style="font-size:0.8rem; color:var(--admin-text-muted);">${new Date(order.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')} - ${isAr ? order.branchNameAr : order.branchNameEn}</div>
                  </div>
                  <div style="text-align:end;">
                    <div style="font-weight:900; color:var(--admin-primary);">${order.total} ${I18N.t('egp')}</div>
                    <span class="badge-status ${order.status}">${AdminOrders.getStatusLabel(order.status)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="modal-footer-admin">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('adminCustomerHistoryModal').classList.remove('active')">
              ${I18N.t('close')}
            </button>
          </div>
        </div>
      `;

      modal.classList.add('active');
    }
  };
})();

window.AdminCustomers = AdminCustomers;
