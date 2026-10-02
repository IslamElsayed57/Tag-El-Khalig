/**
 * Taj El Khalig Sweets - Admin Orders Controller
 * Summary cards, 20-items pagination, filters, status transition, UTF-8 CSV export, details modal
 */

const AdminOrders = (function() {
  let currentPage = 1;
  const pageSize = 20;
  let filters = {
    search: '',
    status: 'all',
    dateRange: 'all',
    branchId: 'all'
  };

  return {
    async render() {
      const container = document.getElementById('view-orders');
      if (!container) return;

      const isAr = I18N.currentLang === 'ar';
      const currentUser = AdminApp.getCurrentUser();
      const branches = await TajAPI.getBranches();

      // Fetch all orders for current user/branch to calculate summary stats
      const allOrdersResult = await TajAPI.getOrders({
        branchId: currentUser && currentUser.role === 'branch' ? currentUser.branchId : 'all'
      }, 1, 1000);
      const allOrders = allOrdersResult.orders;

      const stats = {
        new: allOrders.filter(o => o.status === 'new').length,
        ready: allOrders.filter(o => o.status === 'ready').length,
        completed: allOrders.filter(o => o.status === 'completed').length,
        cancelled: allOrders.filter(o => o.status === 'cancelled').length
      };

      // Fetch paginated filtered orders
      const queryFilters = {
        ...filters,
        branchId: currentUser && currentUser.role === 'branch' ? currentUser.branchId : filters.branchId
      };
      const paginatedResult = await TajAPI.getOrders(queryFilters, currentPage, pageSize);
      const { orders, totalCount, totalPages } = paginatedResult;

      container.innerHTML = `
        <!-- Summary Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrapper new">🆕</div>
            <div class="stat-info">
              <span class="stat-label">${I18N.t('statNewOrders')}</span>
              <span class="stat-value">${stats.new}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrapper ready">👨‍🍳</div>
            <div class="stat-info">
              <span class="stat-label">${I18N.t('statReadyOrders')}</span>
              <span class="stat-value">${stats.ready}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrapper completed">✅</div>
            <div class="stat-info">
              <span class="stat-label">${I18N.t('statCompletedOrders')}</span>
              <span class="stat-value">${stats.completed}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrapper cancelled">❌</div>
            <div class="stat-info">
              <span class="stat-label">${I18N.t('statCancelledOrders')}</span>
              <span class="stat-value">${stats.cancelled}</span>
            </div>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="admin-toolbar">
          <div class="toolbar-filters">
            <div class="search-box-admin">
              <span class="search-icon">🔍</span>
              <input type="text" id="orderSearchInput" value="${filters.search}" placeholder="${isAr ? 'بحث باسم العميل أو رقم الهاتف أو رقم الطلب...' : 'Search by customer, phone, or order ID...'}">
            </div>

            <select class="select-admin" id="orderStatusFilter">
              <option value="all" ${filters.status === 'all' ? 'selected' : ''}>${I18N.t('allStatuses')}</option>
              <option value="new" ${filters.status === 'new' ? 'selected' : ''}>${I18N.t('statusNew')}</option>
              <option value="ready" ${filters.status === 'ready' ? 'selected' : ''}>${I18N.t('statusReady')}</option>
              <option value="completed" ${filters.status === 'completed' ? 'selected' : ''}>${I18N.t('statusCompleted')}</option>
              <option value="cancelled" ${filters.status === 'cancelled' ? 'selected' : ''}>${I18N.t('statusCancelled')}</option>
            </select>

            <select class="select-admin" id="orderDateFilter">
              <option value="all" ${filters.dateRange === 'all' ? 'selected' : ''}>${I18N.t('allDates')}</option>
              <option value="today" ${filters.dateRange === 'today' ? 'selected' : ''}>${I18N.t('today')}</option>
              <option value="yesterday" ${filters.dateRange === 'yesterday' ? 'selected' : ''}>${I18N.t('yesterday')}</option>
              <option value="last7" ${filters.dateRange === 'last7' ? 'selected' : ''}>${I18N.t('last7Days')}</option>
              <option value="thisMonth" ${filters.dateRange === 'thisMonth' ? 'selected' : ''}>${I18N.t('thisMonth')}</option>
            </select>

            ${currentUser && currentUser.role === 'admin' ? `
              <select class="select-admin" id="orderBranchFilter">
                <option value="all" ${filters.branchId === 'all' ? 'selected' : ''}>${I18N.t('allBranches')}</option>
                ${branches.map(b => `<option value="${b.id}" ${filters.branchId === b.id ? 'selected' : ''}>${isAr ? b.nameAr : b.nameEn}</option>`).join('')}
              </select>
            ` : ''}
          </div>

          <div class="toolbar-actions">
            <button type="button" class="btn btn-secondary btn-sm" id="exportOrdersCsvBtn">
              📥 ${I18N.t('exportExcel')}
            </button>
          </div>
        </div>

        <!-- Orders Table -->
        <div class="admin-table-container">
          <div class="table-responsive-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>${I18N.t('orderId')}</th>
                  <th>${I18N.t('date')}</th>
                  <th>${I18N.t('orderCustomer')}</th>
                  <th>${I18N.t('orderPhone')}</th>
                  <th>${I18N.t('orderType')}</th>
                  <th>${I18N.t('orderBranch')}</th>
                  <th>${I18N.t('orderTotal')}</th>
                  <th>${I18N.t('orderStatus')}</th>
                  <th>${I18N.t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                ${orders.length === 0 ? `
                  <tr>
                    <td colspan="9" style="text-align:center; padding:3rem; color:var(--admin-text-muted);">
                      لا توجد طلبات تطابق معايير البحث والفلترة
                    </td>
                  </tr>
                ` : orders.map(o => `
                  <tr>
                    <td><strong>#${o.id}</strong></td>
                    <td style="font-size:0.85rem; color:var(--admin-text-muted);">${new Date(o.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td><strong>${o.customerName}</strong></td>
                    <td dir="ltr" style="font-family:monospace; font-size:0.9rem;">${o.customerPhone}</td>
                    <td>
                      <span style="font-size:0.85rem; font-weight:700;">
                        ${o.type === 'delivery' ? '🛵 ' + I18N.t('fulfillmentDelivery') : '🏬 ' + I18N.t('fulfillmentPickup')}
                      </span>
                    </td>
                    <td>${isAr ? o.branchNameAr : o.branchNameEn}</td>
                    <td><strong>${o.total} ${I18N.t('egp')}</strong></td>
                    <td>
                      <span class="badge-status ${o.status}">
                        ${this.getStatusLabel(o.status)}
                      </span>
                    </td>
                    <td>
                      <button type="button" class="btn btn-outline btn-sm" onclick="AdminOrders.viewOrderDetails('${o.id}')">
                        👁️ ${I18N.t('orderDetails')}
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar (20 per page) -->
          <div class="pagination-wrapper">
            <div>
              <span>عرض <strong>${orders.length}</strong> من إجمالي <strong>${totalCount}</strong> طلب (20 طلب بالصفحة)</span>
            </div>
            <div class="pagination-controls">
              <button type="button" class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="AdminOrders.goToPage(${currentPage - 1})">
                ${isAr ? 'السابق' : 'Previous'}
              </button>
              <span style="padding:0 0.5rem; font-weight:700;">${currentPage} / ${totalPages}</span>
              <button type="button" class="page-btn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="AdminOrders.goToPage(${currentPage + 1})">
                ${isAr ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      `;

      this.bindToolbarEvents(allOrders);
    },

    bindToolbarEvents(allOrders) {
      const searchInput = document.getElementById('orderSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          filters.search = e.target.value;
          currentPage = 1;
          this.render();
        });
      }

      const statusFilter = document.getElementById('orderStatusFilter');
      if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
          filters.status = e.target.value;
          currentPage = 1;
          this.render();
        });
      }

      const dateFilter = document.getElementById('orderDateFilter');
      if (dateFilter) {
        dateFilter.addEventListener('change', (e) => {
          filters.dateRange = e.target.value;
          currentPage = 1;
          this.render();
        });
      }

      const branchFilter = document.getElementById('orderBranchFilter');
      if (branchFilter) {
        branchFilter.addEventListener('change', (e) => {
          filters.branchId = e.target.value;
          currentPage = 1;
          this.render();
        });
      }

      const exportBtn = document.getElementById('exportOrdersCsvBtn');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          TajAPI.exportOrdersCSV(allOrders);
        });
      }
    },

    goToPage(page) {
      currentPage = page;
      this.render();
    },

    getStatusLabel(status) {
      switch (status) {
        case 'new': return I18N.t('statusNew');
        case 'ready': return I18N.t('statusReady');
        case 'completed': return I18N.t('statusCompleted');
        case 'cancelled': return I18N.t('statusCancelled');
        default: return status;
      }
    },

    async viewOrderDetails(orderId) {
      const order = await TajAPI.getOrderById(orderId);
      if (!order) return;

      const isAr = I18N.currentLang === 'ar';
      let modal = document.getElementById('adminOrderModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminOrderModal';
        modal.className = 'admin-modal-overlay';
        document.body.appendChild(modal);
      }

      // Customer GPS link if provided
      let gpsHtml = '';
      if (order.gpsCoordinates) {
        const mapsUrl = `https://maps.google.com/?q=${order.gpsCoordinates.lat},${order.gpsCoordinates.lng}`;
        gpsHtml = `
          <div style="margin-top:0.5rem;">
            <a href="${mapsUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
              📍 ${I18N.t('viewOnMaps')} (${order.gpsCoordinates.lat.toFixed(4)}, ${order.gpsCoordinates.lng.toFixed(4)})
            </a>
          </div>
        `;
      }

      modal.innerHTML = `
        <div class="admin-modal-box">
          <div class="modal-header-admin">
            <div>
              <h3 style="font-weight:900; font-size:1.3rem; color:var(--admin-primary);">${I18N.t('orderDetailsTitle')} #${order.id}</h3>
              <span style="font-size:0.85rem; color:var(--admin-text-muted);">${new Date(order.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</span>
            </div>
            <button type="button" class="drawer-close-btn" onclick="document.getElementById('adminOrderModal').classList.remove('active')">✕</button>
          </div>
          
          <div class="modal-body-admin">
            <!-- Customer Details Block -->
            <div style="background:var(--admin-bg); border-radius:var(--radius-md); padding:1rem; margin-bottom:1.25rem;">
              <h4 style="font-size:0.95rem; font-weight:800; margin-bottom:0.6rem; color:var(--admin-text);">${I18N.t('customerDetails')}</h4>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.9rem;">
                <div><strong>${I18N.t('customerName')}:</strong> ${order.customerName}</div>
                <div><strong>${I18N.t('orderPhone')}:</strong> <a href="tel:${order.customerPhone}" dir="ltr">${order.customerPhone}</a></div>
                <div><strong>${I18N.t('orderType')}:</strong> ${order.type === 'delivery' ? I18N.t('fulfillmentDelivery') : I18N.t('fulfillmentPickup')}</div>
                <div><strong>${I18N.t('orderBranch')}:</strong> ${isAr ? order.branchNameAr : order.branchNameEn}</div>
              </div>
              ${order.address ? `
                <div style="margin-top:0.6rem; font-size:0.9rem;">
                  <strong>العنوان:</strong> ${order.address}
                  ${gpsHtml}
                </div>
              ` : ''}
              ${order.notes ? `
                <div style="margin-top:0.6rem; font-size:0.9rem; color:var(--admin-primary); background:var(--admin-primary-light); padding:0.5rem; border-radius:4px;">
                  <strong>📝 ${I18N.t('notes')}:</strong> ${order.notes}
                </div>
              ` : ''}
            </div>

            <!-- Items Ordered -->
            <h4 style="font-size:0.95rem; font-weight:800; margin-bottom:0.75rem;">${I18N.t('itemsOrdered')}</h4>
            <div style="display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1.25rem;">
              ${order.items.map(item => `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:0.6rem; border:1px solid var(--admin-border); border-radius:var(--radius-md);">
                  <div style="display:flex; align-items:center; gap:0.75rem;">
                    <img src="${item.image.startsWith('../') ? item.image.replace('../', '') : item.image}" alt="${isAr ? item.nameAr : item.nameEn}" style="width:48px; height:48px; border-radius:8px; object-fit:cover;">
                    <div>
                      <div style="font-weight:700; font-size:0.95rem;">${isAr ? item.nameAr : item.nameEn}</div>
                      <div style="font-size:0.85rem; color:var(--admin-text-muted);">${item.price} ${I18N.t('egp')} × ${item.quantity}</div>
                    </div>
                  </div>
                  <strong style="color:var(--admin-primary);">${item.price * item.quantity} ${I18N.t('egp')}</strong>
                </div>
              `).join('')}
            </div>

            <!-- Financial Breakdown -->
            <div style="background:var(--admin-bg); border-radius:var(--radius-md); padding:1rem; display:flex; flex-direction:column; gap:0.4rem; font-size:0.95rem;">
              <div style="display:flex; justify-content:space-between;">
                <span>${I18N.t('subtotalAmount')}:</span>
                <strong>${order.subtotal} ${I18N.t('egp')}</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span>${I18N.t('deliveryFeeAmount')}:</span>
                <span>${order.deliveryFee} ${I18N.t('egp')}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:1.2rem; font-weight:900; color:var(--admin-primary); border-top:1px dashed var(--admin-border); padding-top:0.5rem; margin-top:0.2rem;">
                <span>${I18N.t('totalAmount')}:</span>
                <span>${order.total} ${I18N.t('egp')}</span>
              </div>
            </div>

            <!-- Status Transition Selector -->
            <div style="margin-top:1.25rem;">
              <label class="form-label" style="font-weight:700; font-size:0.9rem;">${I18N.t('updateStatus')}:</label>
              <div style="display:flex; gap:0.75rem; margin-top:0.35rem;">
                <select class="form-select" id="orderStatusUpdateSelect">
                  <option value="new" ${order.status === 'new' ? 'selected' : ''}>${I18N.t('statusNew')}</option>
                  <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>${I18N.t('statusReady')}</option>
                  <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>${I18N.t('statusCompleted')}</option>
                  <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>${I18N.t('statusCancelled')}</option>
                </select>
                <button type="button" class="btn btn-primary" onclick="AdminOrders.saveOrderStatus('${order.id}')">
                  ${I18N.t('save')}
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer-admin">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('adminOrderModal').classList.remove('active')">
              ${I18N.t('close')}
            </button>
          </div>
        </div>
      `;

      modal.classList.add('active');
    },

    async saveOrderStatus(orderId) {
      const select = document.getElementById('orderStatusUpdateSelect');
      if (!select) return;

      const newStatus = select.value;
      try {
        await TajAPI.updateOrderStatus(orderId, newStatus);
        document.getElementById('adminOrderModal').classList.remove('active');
        this.render();
      } catch (err) {
        alert(I18N.t('error') + ': ' + err.message);
      }
    }
  };
})();

window.AdminOrders = AdminOrders;
