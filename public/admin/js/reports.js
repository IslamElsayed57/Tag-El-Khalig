/**
 * Taj El Khalig Sweets - Admin Reports & Analytics Controller
 * Date & branch filters, accounting rules (counts Completed & Ready orders only), and print handler.
 */

const AdminReports = (function() {
  let reportFilters = {
    dateRange: 'all',
    branchId: 'all',
    startDate: '',
    endDate: ''
  };

  return {
    async render() {
      const container = document.getElementById('view-reports');
      if (!container) return;

      const isAr = I18N.currentLang === 'ar';
      const currentUser = AdminApp.getCurrentUser();
      const branches = await TajAPI.getBranches();

      const reportData = await TajAPI.getReports(reportFilters);

      container.innerHTML = `
        <!-- Print-only Formal Letterhead Header (seen only when printing) -->
        <div class="print-only-header">
          <h1>${isAr ? 'حلواني تاج الخليج - تقرير المبيعات الرسمي' : 'Taj El Khalig Sweets - Official Sales Report'}</h1>
          <p>${isAr ? 'تاريخ استخراج التقرير' : 'Report Date'}: ${new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'full' })} | ${isAr ? 'العملة: جنيه مصري (EGP)' : 'Currency: Egyptian Pound (EGP)'}</p>
          <p><strong>${isAr ? 'قاعدة الحساب' : 'Calculation Rule'}:</strong> ${reportData.calculationRule}</p>
        </div>

        <!-- Accounting Rule Notice -->
        <div class="system-status-banner no-print">
          <div class="system-status-icon">⚖️</div>
          <div>
            <strong>${I18N.t('reportRuleNotice')}</strong>
          </div>
        </div>

        <!-- Filters & Print Toolbar -->
        <div class="admin-toolbar no-print">
          <div class="toolbar-filters">
            <select class="select-admin" id="reportDateFilter">
              <option value="all" ${reportFilters.dateRange === 'all' ? 'selected' : ''}>${I18N.t('allDates')}</option>
              <option value="today" ${reportFilters.dateRange === 'today' ? 'selected' : ''}>${I18N.t('today')}</option>
              <option value="thisMonth" ${reportFilters.dateRange === 'thisMonth' ? 'selected' : ''}>${I18N.t('thisMonth')}</option>
              <option value="custom" ${reportFilters.dateRange === 'custom' ? 'selected' : ''}>${I18N.t('customRange')}</option>
            </select>

            <div id="customDateRangeInputs" style="display:${reportFilters.dateRange === 'custom' ? 'flex' : 'none'}; gap:0.5rem;">
              <input type="date" class="select-admin" id="reportStartDate" value="${reportFilters.startDate}">
              <input type="date" class="select-admin" id="reportEndDate" value="${reportFilters.endDate}">
            </div>

            ${currentUser && currentUser.role === 'admin' ? `
              <select class="select-admin" id="reportBranchFilter">
                <option value="all" ${reportFilters.branchId === 'all' ? 'selected' : ''}>${I18N.t('allBranches')}</option>
                ${branches.map(b => `<option value="${b.id}" ${reportFilters.branchId === b.id ? 'selected' : ''}>${isAr ? b.nameAr : b.nameEn}</option>`).join('')}
              </select>
            ` : ''}
          </div>

          <div class="toolbar-actions">
            <button type="button" class="btn btn-primary" onclick="window.print()">
              🖨️ ${I18N.t('printReport')}
            </button>
          </div>
        </div>

        <!-- KPI Metrics Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrapper completed">💰</div>
            <div class="stat-info">
              <span class="stat-label">${I18N.t('totalSales')}</span>
              <span class="stat-value" style="color:var(--admin-primary);">${reportData.totalSales} ${I18N.t('egp')}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrapper ready">📦</div>
            <div class="stat-info">
              <span class="stat-label">${I18N.t('ordersCount')}</span>
              <span class="stat-value">${reportData.ordersCount}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrapper new">📊</div>
            <div class="stat-info">
              <span class="stat-label">${I18N.t('avgOrderValue')}</span>
              <span class="stat-value">${reportData.averageOrderValue} ${I18N.t('egp')}</span>
            </div>
          </div>
        </div>

        <!-- Sales Breakdown by Branch -->
        <div class="admin-table-container">
          <div style="padding:1.25rem; border-bottom:1px solid var(--admin-border);">
            <h4 style="font-weight:900; font-size:1.1rem; color:var(--admin-text);">${I18N.t('salesByBranch')}</h4>
          </div>
          <div class="table-responsive-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>${isAr ? 'اسم الفرع' : 'Branch Name'}</th>
                  <th>${isAr ? 'عدد الطلبات المؤكدة' : 'Confirmed Orders'}</th>
                  <th>${isAr ? 'إجمالي المبيعات (ج.م)' : 'Total Sales (EGP)'}</th>
                  <th>${isAr ? 'نسبة المساهمة' : 'Contribution %'}</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.branchBreakdown.map(b => {
                  const percent = reportData.totalSales > 0 ? Math.round((b.sales / reportData.totalSales) * 100) : 0;
                  return `
                    <tr>
                      <td><strong>${isAr ? b.nameAr : b.nameEn}</strong></td>
                      <td>${b.ordersCount} ${isAr ? 'طلب' : (b.ordersCount === 1 ? 'order' : 'orders')}</td>
                      <td><strong style="color:var(--admin-primary);">${b.sales} ${I18N.t('egp')}</strong></td>
                      <td>
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                          <div style="flex-grow:1; height:8px; background:var(--admin-border); border-radius:4px; overflow:hidden;">
                            <div style="width:${percent}%; height:100%; background:var(--admin-primary);"></div>
                          </div>
                          <span style="font-size:0.85rem; font-weight:700;">${percent}%</span>
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

      this.bindFilterEvents();
    },

    bindFilterEvents() {
      const dateFilter = document.getElementById('reportDateFilter');
      const branchFilter = document.getElementById('reportBranchFilter');
      const startInput = document.getElementById('reportStartDate');
      const endInput = document.getElementById('reportEndDate');

      if (dateFilter) {
        dateFilter.addEventListener('change', (e) => {
          reportFilters.dateRange = e.target.value;
          this.render();
        });
      }

      if (branchFilter) {
        branchFilter.addEventListener('change', (e) => {
          reportFilters.branchId = e.target.value;
          this.render();
        });
      }

      if (startInput) {
        startInput.addEventListener('change', (e) => {
          reportFilters.startDate = e.target.value;
          this.render();
        });
      }

      if (endInput) {
        endInput.addEventListener('change', (e) => {
          reportFilters.endDate = e.target.value;
          this.render();
        });
      }
    }
  };
})();

window.AdminReports = AdminReports;
