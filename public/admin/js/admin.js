/**
 * Taj El Khalig Sweets - Admin Dashboard Core Controller
 * Manages tabs, role checks, notifications, audio chime, and reactive syncing.
 */

// Escapes text before it is interpolated into innerHTML templates.
// Customer-supplied fields (name, address, notes) must pass through this.
function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

const AdminApp = (function() {
  let activeTab = 'orders';
  let currentUser = null;
  let isSoundEnabled = localStorage.getItem('taj_admin_sound') !== 'false';
  let unreadNotifications = [];

  // Web Audio API Synthesizer for notifications.
  // A single shared AudioContext is reused so repeating 1-second alerts
  // never exhaust the browser's AudioContext limit.
  let audioCtx = null;

  function getAudioContext() {
    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return null;
      if (!audioCtx || audioCtx.state === 'closed') audioCtx = new AudioContextCtor();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      return audioCtx;
    } catch (e) {
      console.warn('Audio context error', e);
      return null;
    }
  }

  function playNotificationChime() {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Play pleasant two-tone chime
      playTone(587.33, 0, 0.25); // D5
      playTone(880.00, 0.15, 0.4); // A5
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // Repeating alerts for unhandled new orders: the chime plays every second
  // until the order gets an action (status change) or is stopped manually
  // from the orders table.
  let pendingOrderAlerts = new Set();
  let orderAlertTimer = null;

  function ensureOrderAlertLoop() {
    if (orderAlertTimer) return;
    orderAlertTimer = setInterval(() => {
      if (pendingOrderAlerts.size === 0) {
        clearInterval(orderAlertTimer);
        orderAlertTimer = null;
        return;
      }
      playNotificationChime();
    }, 1000);
  }

  function startOrderAlert(orderId) {
    pendingOrderAlerts.add(String(orderId));
    ensureOrderAlertLoop();
  }

  function stopOrderAlert(orderId) {
    pendingOrderAlerts.delete(String(orderId));
    if (pendingOrderAlerts.size === 0 && orderAlertTimer) {
      clearInterval(orderAlertTimer);
      orderAlertTimer = null;
    }
  }

  function isOrderAlertActive(orderId) {
    return pendingOrderAlerts.has(String(orderId));
  }

  // Order events can arrive twice: instantly via BroadcastChannel from the
  // same browser, then again from the /events poll. The first delivery wins.
  const seenOrderEvents = new Set();

  function isDuplicateOrderEvent(key) {
    if (seenOrderEvents.has(key)) return true;
    seenOrderEvents.add(key);
    if (seenOrderEvents.size > 1000) seenOrderEvents.delete(seenOrderEvents.values().next().value);
    return false;
  }

  function orderMatchesWatchedBranch(order) {
    const watched = window.AdminOrders && typeof AdminOrders.getWatchedBranchId === 'function'
      ? AdminOrders.getWatchedBranchId()
      : 'all';
    return watched === 'all' || !order || !order.branchId || order.branchId === watched;
  }

  function addNotification(text) {
    unreadNotifications.unshift({
      id: Date.now(),
      text,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
    updateNotifBadge();
    playNotificationChime();
  }

  function updateNotifBadge() {
    const badge = document.getElementById('notifBadge');
    const list = document.getElementById('notifList');
    if (badge) {
      badge.textContent = unreadNotifications.length;
      badge.style.display = unreadNotifications.length > 0 ? 'flex' : 'none';
    }
    if (list) {
      if (unreadNotifications.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:1rem; color:var(--admin-text-muted); font-size:0.85rem;">لا توجد إشعارات جديدة</div>`;
      } else {
        list.innerHTML = unreadNotifications.map(n => `
          <div class="notif-item">
            <strong>🔔 ${escapeHtml(n.text)}</strong>
            <div style="font-size:0.75rem; color:var(--admin-text-muted); margin-top:2px;">${n.time}</div>
          </div>
        `).join('');
      }
    }
  }

  return {
    async init() {
      if (window.TAJ_CONFIG?.mode === 'remote') {
        try {
          currentUser = await TajAPI.getCurrentUser();
        } catch (error) {
          this.renderLogin(error.message || 'تعذر الاتصال بالخادم. تأكد من تشغيله ثم أعد المحاولة.');
          return;
        }
        if (!currentUser) {
          this.renderLogin();
          return;
        }
      } else {
        currentUser = await TajAPI.getCurrentUser();
      }
      this.renderUserBadge();
      this.bindTabNavigation();
      this.bindTopbarActions();
      this.bindDataSync();
      await this.restoreOrderAlerts();
      this.switchTab('orders');
      updateNotifBadge();
    },

    // After a refresh or re-login, resume the alert for every order
    // that nobody has acted on yet (status still "new").
    async restoreOrderAlerts() {
      try {
        const watched = window.AdminOrders && typeof AdminOrders.getWatchedBranchId === 'function'
          ? AdminOrders.getWatchedBranchId()
          : 'all';
        const result = await TajAPI.getOrders({ status: 'new', branchId: watched }, 1, 200);
        (result.orders || []).forEach(o => startOrderAlert(o.id));
      } catch (e) {
        console.warn('Could not restore order alerts', e);
      }
    },

    getCurrentUser() {
      return currentUser;
    },

    startOrderAlert,
    stopOrderAlert,
    isOrderAlertActive,

    async switchUser(userId) {
      currentUser = await TajAPI.setCurrentUser(userId);
      this.renderUserBadge();
      this.applyRoleRestrictions();
      // Reload current tab data with new role permissions
      this.switchTab(activeTab);
    },

    renderUserBadge() {
      const nameEl = document.getElementById('sidebarUserName');
      const roleBadge = document.getElementById('sidebarUserRole');
      const switcherSelect = document.getElementById('userSwitcherSelect');

      const displayName = I18N.currentLang === 'ar' ? currentUser.nameAr : (currentUser.nameEn || currentUser.nameAr);
      if (nameEl) nameEl.textContent = displayName;
      if (roleBadge) {
        roleBadge.className = `user-role-badge role-${currentUser.role}`;
        roleBadge.textContent = currentUser.role === 'admin' ? I18N.t('roleAdmin') : `${I18N.t('roleBranch')} (${displayName})`;
      }

      if (window.TAJ_CONFIG?.mode === 'remote') {
        const switcher = document.getElementById('userSwitcherSelect');
        const switcherWrap = switcher && switcher.closest('.user-switch-pill');
        if (switcherWrap) switcherWrap.style.display = 'none';
        const topbar = document.querySelector('.topbar-right');
        if (topbar && !document.getElementById('adminLogoutBtn')) {
          const logout = document.createElement('button');
          logout.type = 'button';
          logout.id = 'adminLogoutBtn';
          logout.className = 'control-btn';
          logout.setAttribute('data-i18n', 'logout');
          logout.textContent = I18N.t('logout');
          logout.addEventListener('click', async () => { await TajAPI.logout(); location.reload(); });
          topbar.prepend(logout);
        }
      } else TajAPI.getUsers().then(users => {
        if (switcherSelect) {
          switcherSelect.innerHTML = users.map(u => `
            <option value="${u.id}" ${u.id === currentUser.id ? 'selected' : ''}>
              ${u.nameAr} (${u.role})
            </option>
          `).join('');
        }
      });

      this.applyRoleRestrictions();
    },

    renderLogin(errorMessage = '') {
      const overlay = document.createElement('div');
      overlay.id = 'adminLoginOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:1rem;background:#160d13;color:#fff;font-family:Cairo,Arial,sans-serif;';
      overlay.innerHTML = `
        <form id="adminLoginForm" style="width:min(100%,420px);padding:2rem;border-radius:20px;background:#24151f;border:1px solid #533044;box-shadow:0 24px 70px #0008;">
          <h1 style="margin:0 0 .5rem;font-size:1.5rem;">تسجيل دخول الإدارة</h1>
          <p style="margin:0 0 1.5rem;color:#cbbac4;">سجّل الدخول باستخدام الحساب الذي أعدّه مسؤول النظام.</p>
          <label for="adminLoginUsername" style="display:block;margin:.75rem 0 .35rem;">اسم المستخدم</label>
          <input id="adminLoginUsername" name="username" autocomplete="username" required style="width:100%;padding:.8rem;border-radius:10px;border:1px solid #604253;background:#170e14;color:#fff;">
          <label for="adminLoginPassword" style="display:block;margin:.9rem 0 .35rem;">كلمة المرور</label>
          <input id="adminLoginPassword" name="password" type="password" autocomplete="current-password" required style="width:100%;padding:.8rem;border-radius:10px;border:1px solid #604253;background:#170e14;color:#fff;">
          <p id="adminLoginError" role="alert" style="min-height:1.5rem;margin:.75rem 0;color:#ff9eae;">${errorMessage}</p>
          <button type="submit" style="width:100%;padding:.85rem;border-radius:999px;background:#e4007c;color:#fff;font-weight:700;">دخول آمن</button>
        </form>`;
      document.body.appendChild(overlay);
      const form = document.getElementById('adminLoginForm');
      form.addEventListener('submit', async event => {
        event.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        const error = document.getElementById('adminLoginError');
        submit.disabled = true;
        try {
          await TajAPI.login(form.elements.username.value.trim(), form.elements.password.value);
          location.reload();
        } catch (reason) {
          error.textContent = reason.message || 'فشل تسجيل الدخول.';
          submit.disabled = false;
        }
      });
    },

    applyRoleRestrictions() {
      const isBranch = currentUser.role === 'branch';
      
      // Hide or disable restricted tabs for branch accounts
      const restrictedTabs = ['products', 'branches', 'accounts'];
      restrictedTabs.forEach(tab => {
        const tabLink = document.querySelector(`.sidebar-link[data-tab="${tab}"]`);
        if (tabLink) {
          if (isBranch) {
            tabLink.style.display = 'none';
          } else {
            tabLink.style.display = 'flex';
          }
        }
      });

      // If branch user was on restricted tab, send back to orders
      if (isBranch && restrictedTabs.includes(activeTab)) {
        this.switchTab('orders');
      }
    },

    bindTabNavigation() {
      document.querySelectorAll('.sidebar-link[data-tab]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const tab = link.getAttribute('data-tab');
          this.switchTab(tab);

          // Close sidebar on mobile
          const sidebar = document.getElementById('adminSidebar');
          if (sidebar) sidebar.classList.remove('show');
        });
      });

      // Mobile sidebar toggle
      const mobileToggle = document.getElementById('sidebarMobileToggle');
      const sidebar = document.getElementById('adminSidebar');
      if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
          sidebar.classList.toggle('show');
        });
      }
    },

    switchTab(tabName) {
      activeTab = tabName;

      // Update sidebar active state
      document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-tab') === tabName);
      });

      // Update title in topbar
      const titleEl = document.getElementById('pageTitle');
      const tabTitleMap = {
        orders: I18N.t('adminOrders'),
        customers: I18N.t('adminCustomers'),
        products: I18N.t('adminProducts'),
        branches: I18N.t('adminBranches'),
        accounts: I18N.t('adminAccounts'),
        reports: I18N.t('adminReports')
      };
      if (titleEl) titleEl.textContent = tabTitleMap[tabName] || tabName;

      // Hide all views and show target view
      document.querySelectorAll('.admin-tab-view').forEach(v => v.style.display = 'none');
      const targetView = document.getElementById(`view-${tabName}`);
      if (targetView) targetView.style.display = 'block';

      // Call module render
      switch (tabName) {
        case 'orders':
          if (window.AdminOrders) AdminOrders.render();
          break;
        case 'customers':
          if (window.AdminCustomers) AdminCustomers.render();
          break;
        case 'products':
          if (window.AdminProducts) AdminProducts.render();
          break;
        case 'branches':
          if (window.AdminBranches) AdminBranches.render();
          break;
        case 'accounts':
          if (window.AdminAccounts) AdminAccounts.render();
          break;
        case 'reports':
          if (window.AdminReports) AdminReports.render();
          break;
      }
    },

    bindTopbarActions() {
      // Sound Toggle
      const soundBtn = document.getElementById('soundToggleBtn');
      const updateSoundIcon = () => {
        if (soundBtn) {
          soundBtn.innerHTML = isSoundEnabled ? '🔔' : '🔕';
          soundBtn.setAttribute('title', isSoundEnabled ? I18N.t('muteSound') : I18N.t('unmuteSound'));
        }
      };
      updateSoundIcon();

      if (soundBtn) {
        soundBtn.addEventListener('click', () => {
          isSoundEnabled = !isSoundEnabled;
          localStorage.setItem('taj_admin_sound', isSoundEnabled);
          updateSoundIcon();
          if (isSoundEnabled) playNotificationChime();
        });
      }

      // Notification Bell Dropdown Toggle
      const notifBtn = document.getElementById('notifBtn');
      const notifDropdown = document.getElementById('notifDropdown');
      if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          notifDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
          notifDropdown.classList.remove('show');
        });

        notifDropdown.addEventListener('click', (e) => e.stopPropagation());
      }

      // Clear notifications button
      const clearNotifs = document.getElementById('clearNotifsBtn');
      if (clearNotifs) {
        clearNotifs.addEventListener('click', () => {
          unreadNotifications = [];
          updateNotifBadge();
        });
      }

      // User switcher select
      const switcherSelect = document.getElementById('userSwitcherSelect');
      if (switcherSelect) {
        switcherSelect.addEventListener('change', (e) => {
          this.switchUser(e.target.value);
        });
      }

      // Language Switcher
      const langBtn = document.getElementById('adminLangBtn');
      if (langBtn) {
        langBtn.addEventListener('click', () => {
          I18N.toggleLang();
          this.renderUserBadge();
          this.switchTab(activeTab);
        });
      }
    },

    bindDataSync() {
      // Listen to new orders placed on storefront
      window.addEventListener('taj_new_order', (e) => {
        const order = e.detail && e.detail.order;
        if (!order) return;
        if (isDuplicateOrderEvent('new:' + order.id)) return;
        if (!orderMatchesWatchedBranch(order)) return;
        addNotification(`طلب جديد #${order.id} من ${order.customerName} بقيمة ${order.total} ج.م`);
        startOrderAlert(order.id);
        if (activeTab === 'orders' && window.AdminOrders) {
          AdminOrders.render();
        }
        if (activeTab === 'reports' && window.AdminReports) {
          AdminReports.render();
        }
      });

      // Listen to status changes (any action on an order stops its alert)
      window.addEventListener('taj_order_status_changed', (e) => {
        const order = e.detail && e.detail.order;
        if (!order) return;
        if (isDuplicateOrderEvent('status:' + order.id + ':' + (order.updatedAt || order.status || ''))) return;
        stopOrderAlert(order.id);
        if (!orderMatchesWatchedBranch(order)) return;
        addNotification(`تم تحديث حالة الطلب #${order.id} إلى ${order.status}`);
        if (activeTab === 'orders' && window.AdminOrders) {
          AdminOrders.render();
        }
      });

      // General data update
      window.addEventListener('taj_data_synced', () => {
        this.switchTab(activeTab);
      });

      ['taj_products_updated','taj_categories_updated','taj_branches_updated','taj_settings_updated'].forEach(eventName => {
        window.addEventListener(eventName, () => this.switchTab(activeTab));
      });
    }
  };
})();

window.AdminApp = AdminApp;
