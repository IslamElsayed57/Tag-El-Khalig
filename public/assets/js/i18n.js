/**
 * Taj El Khalig Sweets - i18n Language System
 * Complete Arabic (RTL) & English (LTR) dictionary and translator
 */

const I18N = {
  currentLang: localStorage.getItem('taj_lang') || 'ar',

  translations: {
    ar: {
      // General & Brand
      shopName: "حلواني تاج الخليج",
      tagline: "أحلى طعم لأصالة الحلويات الشرقية والغربية",
      currency: "ج.م",
      dayMode: "الوضع النهاري",
      nightMode: "الوضع الليلي",
      langSwitch: "English",
      sampleDataNotice: "أحلى طعم",
      viewDashboard: "لوحة التحكم",
      backToStore: "العودة للمتجر",
      all: "الكل",
      search: "بحث...",
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      edit: "تعديل",
      view: "عرض",
      active: "نشط",
      inactive: "غير نشط",
      actions: "الإجراءات",
      status: "الحالة",
      date: "التاريخ",
      close: "إغلاق",
      confirm: "تأكيد",
      loading: "جاري التحميل...",
      success: "تم بنجاح",
      error: "حدث خطأ ما",

      // Navigation
      navHome: "الرئيسية",
      navCategories: "الأقسام والمنتجات",
      navBranches: "خدمات التواصل والفروع",
      navCart: "السلة",

      // Home Hero & Intro
      heroTitle: "أصالة المذاق الشرقي ولمسات الحلويات الفاخرة",
      heroSubtitle: "ننتقي أجود أنواع السمن البلدي الطبيعي والفستق والمكسرات الفاخرة لنقدم لكم تجربة حلوى ملكية لا تُنسى في كل قطعة.",
      heroBtnOrder: "اطلب الآن أونلاين",
      heroBtnExplore: "استكشف الأقسام والحلويات",
      storyBadge: "حكايتنا مع المذاق",
      storyTitle: "عراقة الضيافة المصرية بحلّة عصرية",
      storyText1: "في حلواني تاج الخليج، بدأنا بتقديم أرقى ما أبدعه التراث المصري والشرقي من أصناف الكنافة والبسبوسة والشرقيات، ممزوجة بإتقان الحلويات الغربية والتورتات الكلاسيكية.",
      storyText2: "نحرص يومياً على استخدام مكونات طازجة 100%، وسمن بلدي صافٍ، وقشطة طازجة وذلك حسب طلبكم، لنضمن أن تصل كل علبة إلى موائدكم بأعلى معايير الجودة والبهجة التي تليق بكل احتفال ومناسبة عائلية.",
      featuredBadge: "المميز والأكثر طلباً",
      featuredTitle: "تشكيلة مختارة ترضي ذوقكم الرفيع",
      freeDeliveryBanner: "توصيل مجاني للطلبات بقيمة {min} ج.م فأكثر!",

      // Products & Categories
      allCategories: "جميع الأصناف",
      productSearchPlaceholder: "ابحث عن صنف، كنافة، بسبوسة، تورتة...",
      noProductsFound: "لم يتم العثور على منتجات مطابقة لبحثك",
      noProductsDesc: "جرب البحث بكلمات أخرى أو اختر فئة مختلفة.",
      regularPrice: "السعر الأصلي",
      currentPrice: "السعر",
      egp: "ج.م",
      addToCart: "إضافة للسلة",
      inStock: "متوفر طازج اليوم",
      outOfStock: "نفد مؤقتاً",
      discountBadge: "خصم {percent}%",

      // Cart & Checkout
      cartTitle: "سلة المشتريات",
      cartEmpty: "سلة المشتريات فارغة",
      cartEmptyDesc: "أضف أشهى الحلويات واستمتع بأحلى طعم مع أحبابك",
      cartSubtotal: "المجموع الفرعي",
      cartDeliveryFee: "رسوم التوصيل",
      freeDeliveryReached: "مبروك! حصلت على توصيل مجاني 🎉",
      freeDeliveryRemaining: "أضف منتجات بقيمة {amount} ج.م للحصول على توصيل مجاني!",
      cartTotal: "الإجمالي النهائي",
      checkoutBtn: "متابعة إتمام الطلب",
      orderFulfillment: "طريقة الاستلام",
      fulfillmentDelivery: "توصيل للمنزل",
      fulfillmentPickup: "استلام من الفرع",
      selectBranch: "اختر الفرع للاستلام",
      selectDeliveryBranch: "اختر الفرع الأقرب لتوصيل طلبك",
      gpsLocationBtn: "تحديد موقعي بدقة عبر GPS",
      gpsLocating: "جاري تحديد الموقع...",
      gpsSuccess: "تم التقاط موقعك الجغرافي بنجاح",
      gpsFailed: "تعذر الحصول على الموقع الجغرافي، يرجى كتابة العنوان يدوياً",
      addressDetails: "تفاصيل العنوان (المدينة، الحي، اسم الشارع، رقم العقار والشقة)",
      customerName: "اسم العميل بالكامل",
      customerPhone: "رقم هاتف العميل (11 رقم مصري يبدأ بـ 01)",
      orderNotes: "ملاحظات إضافية على الطلب (اختياري)",
      orderSummary: "ملخص الطلب",
      placeOrderBtn: "تأكيد وإرسال الطلب الآن",
      orderSuccessTitle: "تم استلام طلبك بنجاح!",
      orderNumberLabel: "رقم الطلب",
      orderSuccessDesc: "شكراً لثقتكم بحلواني تاج الخليج. يتم الآن تجهيز حلوياتكم الطازجة بكل حب وعناية.",
      orderWhatsappTrack: "متابعة الطلب عبر واتساب",
      continueShopping: "متابعة التسوق",
      phoneValidationError: "يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقماً (مثال: 01012345678)",
      nameValidationError: "يرجى إدخال اسم العميل بالكامل",
      addressValidationError: "يرجى إدخال تفاصيل العنوان للتوصيل",
      branchValidationError: "يرجى اختيار الفرع",

      // Contact & Branches
      contactTitle: "فروعنا وبيانات التواصل",
      contactSubtitle: "يسعدنا دائماً استقبالكم في فروعنا أو تلبية طلباتكم وتوصيلها أينما كنتم",
      callUs: "اتصل بنا",
      whatsappUs: "تواصل عبر واتساب",
      emailUs: "البريد الإلكتروني",
      ourBranches: "قائمة فروع حلواني تاج الخليج",
      branchManager: "مدير الفرع",
      branchPhone: "هاتف الفرع",
      branchAddress: "العنوان",
      openInMaps: "فتح الموقع في خرائط Google",
      sendInquiry: "أرسل لنا رسالة أو استفسار",
      senderName: "الاسم",
      senderPhone: "رقم الهاتف: ",
      senderMessage: "نص الرسالة أو الاستفسار",
      sendBtn: "إرسال الرسالة",

      // Dashboard Strings
      adminTitle: "لوحة تحكم تاج الخليج",
      adminOrders: "الطلبات",
      adminCustomers: "بيانات العملاء",
      adminProducts: "الأقسام والمنتجات",
      adminBranches: "الفروع وإعدادات المتجر",
      adminAccounts: "الحسابات والصلاحيات",
      adminReports: "التقارير والمبيعات",
      loggedAs: "الحساب الحالي:",
      roleAdmin: "مدير عام (Admin)",
      roleBranch: "حساب فرع (Branch)",
      switchUser: "تبديل الحساب",
      unreadNotifications: "التنبيهات",
      muteSound: "كتم الصوت",
      unmuteSound: "تشغيل التنبيه الصوتي",
      
      // Order Stats
      statNewOrders: "الطلبات الجديدة",
      statReadyOrders: "الطلبات الجاهزة",
      statCompletedOrders: "الطلبات المكتملة",
      statCancelledOrders: "الطلبات الملغاة",
      
      // Order Table
      orderId: "رقم الطلب",
      orderCustomer: "العميل",
      orderPhone: "رقم الهاتف: ",
      orderType: "نوع الطلب",
      orderBranch: "الفرع المعني",
      orderTotal: "الإجمالي",
      orderStatus: "حالة الطلب",
      orderDetails: "تفاصيل الطلب",
      statusNew: "جديد",
      statusReady: "جاهز",
      statusCompleted: "مكتمل",
      statusCancelled: "ملغي",
      exportExcel: "تصدير كشيت إكسيل (CSV)",
      filterDate: "فلترة بالتاريخ",
      filterStatus: "فلترة بالحالة",
      filterBranch: "فلترة بالفرع",
      allStatuses: "جميع الحالات",
      allBranches: "جميع الفروع",
      allDates: "جميع التواريخ",
      today: "اليوم",
      yesterday: "أمس",
      last7Days: "آخر 7 أيام",
      thisMonth: "هذا الشهر",
      customRange: "نطاق مخصص",
      
      // Order Details Modal
      orderDetailsTitle: "تفاصيل الطلب",
      itemsOrdered: "المنتجات المطلوبة",
      subtotalAmount: "المجموع الفرعي",
      deliveryFeeAmount: "رسوم التوصيل",
      totalAmount: "المجموع الإجمالي",
      customerDetails: "بيانات العميل",
      notes: "الملاحظات",
      customerGPS: "الموقع الجغرافي للعميل",
      viewOnMaps: "عرض على خرائط Google",
      updateStatus: "تغيير حالة الطلب",
      
      // Customers Tab
      customersTitle: "سجل العملاء التراكمي",
      customerOrdersCount: "عدد الطلبات",
      customerTotalSpend: "إجمالي الإنفاق",
      lastOrder: "آخر طلب",
      viewHistory: "سجل الطلبات",
      
      // Categories & Products Tab
      addCategory: "إضافة قسم جديد",
      addProduct: "إضافة منتج جديد",
      importCSV: "استيراد من إكسيل (CSV)",
      exportCSV: "تصدير المنتجات (CSV)",
      downloadTemplate: "تحميل نموذج CSV",
      selectAll: "تحديد الكل",
      bulkDelete: "حذف المحدد",
      productName: "اسم المنتج",
      productCategory: "القسم",
      regularPriceInput: "السعر الأساسي",
      discountPriceInput: "السعر المخفض (اختياري)",
      productDescription: "وصف المنتج",
      productImage: "صورة المنتج",
      categoryNameAr: "اسم القسم (بالعربية)",
      categoryNameEn: "اسم القسم (بالإنجليزية)",
      productNameAr: "اسم المنتج (بالعربية)",
      productNameEn: "اسم المنتج (بالإنجليزية)",
      uploadImageFile: "رفع صورة من الجهاز",
      orChoosePreset: "أو اختيار صورة جاهزة",
      confirmBulkDelete: "هل أنت متأكد من حذف المنتجات المحددة؟ لا يمكن التراجع عن هذا الإجراء.",
      
      // Branches & Settings Tab
      addBranch: "إضافة فرع جديد",
      branchNameAr: "اسم الفرع (بالعربية)",
      branchNameEn: "اسم الفرع (بالإنجليزية)",
      branchAddressInput: "العنوان التفصيلي",
      branchPhoneInput: "رقم هاتف الفرع",
      branchManagerInput: "اسم مدير الفرع",
      branchMapUrl: "رابط خرائط Google",
      deliveryEligibility: "متاح لخدمة توصيل الطلبات",
      shopSettingsTitle: "بيانات التواصل والإعدادات العامة للمتجر",
      facebookUrl: "رابط صفحة فيسبوك",
      instagramUrl: "رابط انستغرام",
      tiktokUrl: "رابط تيك توك",
      contactPhone: "هاتف خدمة العملاء الموحد",
      whatsappNumber: "رقم الواتساب للطلبات",
      contactEmail: "البريد الإلكتروني الرسمي",
      deliveryFeeDefault: "رسوم التوصيل الافتراضية (ج.م)",
      freeDeliveryThreshold: "الحد الأدنى للتوصيل المجاني (ج.م)",
      saveSettingsBtn: "حفظ إعدادات المتجر",
      settingsSavedSuccess: "تم حفظ الإعدادات وتحديثها على المتجر بنجاح",
      
      // Accounts Tab
      accountsTitle: "الحسابات وصلاحيات النظام",
      accountUser: "اسم المستخدم",
      accountRole: "الدور والوظيفة",
      accountBranch: "الفرع المرتبط",
      permissionRestrictedNotice: "تنبيه: حسابات الفروع تمتلك صلاحية عرض طلبات وتقارير فرعها فقط، ومحظور عليها تعديل الأقسام والمنتجات والفروع والإعدادات.",
      
      // Reports Tab
      reportsTitle: "تقارير المبيعات والأداء",
      reportRuleNotice: "قاعدة الحساب: يتم احتساب الطلبات المكتملة والجاهزة والجديدة فقط، ويتم استبعاد الطلبات الملغاة (Cancelled) تماماً من إجمالي المبيعات.",
      totalSales: "إجمالي المبيعات",
      ordersCount: "عدد الطلبات المؤكدة",
      avgOrderValue: "متوسط قيمة الطلب",
      salesByBranch: "مبيعات الفروع بالتفصيل",
      salesByDate: "المبيعات حسب التاريخ",
      printReport: "طباعة التقرير (A4)",
      
      // Missing services note
      systemNoticeTitle: "حالة الربط بالخادم",
      systemNoticeBody: "الموقع ولوحة التحكم متصلان بخادم Node.js وقاعدة SQLite مشتركة. تُحفظ الطلبات والبيانات على الخادم، وتصل إشعارات التغييرات للمستخدمين المسجلين عبر SSE."
    },

    en: {
      // General & Brand
      shopName: "Taj El Khalig Sweets",
      tagline: "The Sweetest Taste of Authentic Oriental & Western Pastries",
      currency: "EGP",
      dayMode: "Day Mode",
      nightMode: "Night Mode",
      langSwitch: "العربية",
      sampleDataNotice: "Preview Sample Data",
      viewDashboard: "Admin Dashboard",
      backToStore: "Back to Store",
      all: "All",
      search: "Search...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      view: "View",
      active: "Active",
      inactive: "Inactive",
      actions: "Actions",
      status: "Status",
      date: "Date",
      close: "Close",
      confirm: "Confirm",
      loading: "Loading...",
      success: "Operation successful",
      error: "An error occurred",

      // Navigation
      navHome: "Home",
      navCategories: "Categories & Menu",
      navBranches: "Branches & Contact",
      navCart: "Cart",

      // Home Hero & Intro
      heroTitle: "Authentic Egyptian Sweets & Gourmet Confectionery",
      heroSubtitle: "Handcrafted with 100% pure Egyptian baladi ghee, delicate sugar syrups, and premium pistachios to bring a royal dessert experience to every celebration.",
      heroBtnOrder: "Order Online Now",
      heroBtnExplore: "Explore Menu & Categories",
      storyBadge: "Our Heritage",
      storyTitle: "Timeless Egyptian Hospitality With Modern Artistry",
      storyText1: "At Taj El Khalig Sweets, our journey began with one vision: presenting Egypt's cherished confectionery heritage—golden Kunafa, glistening Basbousa, and flaky Baklava—alongside contemporary French gateaux and artisanal tarts.",
      storyText2: "Every day, our master pastry chefs bake using pure local ghee, fresh clotted cream (Ashta), and freshly cracked pistachios, ensuring every sweet box arrives at your gathering with pride and joy.",
      featuredBadge: "Best Sellers & Favorites",
      featuredTitle: "Hand-Picked Creations For Discerning Palates",
      freeDeliveryBanner: "Free delivery on all orders over {min} EGP!",

      // Products & Categories
      allCategories: "All Categories",
      productSearchPlaceholder: "Search for sweets, kunafa, basbousa, cake...",
      noProductsFound: "No products found matching your search",
      noProductsDesc: "Try searching with different keywords or clear category filters.",
      regularPrice: "Original Price",
      currentPrice: "Price",
      egp: "EGP",
      addToCart: "Add to Cart",
      inStock: "Fresh in Stock",
      outOfStock: "Temporarily Sold Out",
      discountBadge: "{percent}% OFF",

      // Cart & Checkout
      cartTitle: "Shopping Cart",
      cartEmpty: "Your Cart is Empty",
      cartEmptyDesc: "Add some delightful sweets and share sweetest moments with your loved ones!",
      cartSubtotal: "Subtotal",
      cartDeliveryFee: "Delivery Fee",
      freeDeliveryReached: "Congratulations! You unlocked Free Delivery 🎉",
      freeDeliveryRemaining: "Add {amount} EGP more to qualify for Free Delivery!",
      cartTotal: "Grand Total",
      checkoutBtn: "Proceed to Checkout",
      orderFulfillment: "Fulfillment Method",
      fulfillmentDelivery: "Home Delivery",
      fulfillmentPickup: "Branch Pickup",
      selectBranch: "Select Branch for Pickup",
      selectDeliveryBranch: "Select Branch Fulfilling Delivery",
      gpsLocationBtn: "Detect My Exact GPS Location",
      gpsLocating: "Locating your position...",
      gpsSuccess: "Location detected successfully",
      gpsFailed: "Could not retrieve GPS location. Please enter your address manually.",
      addressDetails: "Address Details (City, District, Street, Building, Floor/Apt)",
      customerName: "Customer Full Name",
      customerPhone: "Egyptian Phone Number (11 digits starting with 01)",
      orderNotes: "Special Instructions / Notes (Optional)",
      orderSummary: "Order Summary",
      placeOrderBtn: "Place Order Now",
      orderSuccessTitle: "Order Placed Successfully!",
      orderNumberLabel: "Order Number",
      orderSuccessDesc: "Thank you for choosing Taj El Khalig Sweets. Your fresh pastries are being prepared with utmost love and care.",
      orderWhatsappTrack: "Track via WhatsApp",
      continueShopping: "Continue Shopping",
      phoneValidationError: "Please enter a valid 11-digit Egyptian phone number (e.g. 01012345678)",
      nameValidationError: "Please enter your full name",
      addressValidationError: "Please enter delivery address details",
      branchValidationError: "Please select a branch",

      // Contact & Branches
      contactTitle: "Our Branches & Customer Care",
      contactSubtitle: "We are always delighted to welcome you at our branches or deliver our fresh sweets to your doorstep across Egypt.",
      callUs: "Call Us",
      whatsappUs: "Chat on WhatsApp",
      emailUs: "Email Us",
      ourBranches: "Taj El Khalig Sweets Branches",
      branchManager: "Branch Manager",
      branchPhone: "Branch Phone",
      branchAddress: "Address",
      openInMaps: "Open in Google Maps",
      sendInquiry: "Send Us an Inquiry",
      senderName: "Your Name",
      senderPhone: "Phone Number",
      senderMessage: "Your Message",
      sendBtn: "Send Message",

      // Dashboard Strings
      adminTitle: "Taj El Khalig Admin Dashboard",
      adminOrders: "Orders",
      adminCustomers: "Customers",
      adminProducts: "Categories & Products",
      adminBranches: "Branches & Settings",
      adminAccounts: "Accounts & Roles",
      adminReports: "Reports & Sales",
      loggedAs: "Logged in as:",
      roleAdmin: "General Admin",
      roleBranch: "Branch Account",
      switchUser: "Switch Account",
      unreadNotifications: "Notifications",
      muteSound: "Mute Sound",
      unmuteSound: "Enable Alert Sound",
      
      // Order Stats
      statNewOrders: "New Orders",
      statReadyOrders: "Ready Orders",
      statCompletedOrders: "Completed Orders",
      statCancelledOrders: "Cancelled Orders",
      
      // Order Table
      orderId: "Order #",
      orderCustomer: "Customer",
      orderPhone: "Phone",
      orderType: "Type",
      orderBranch: "Assigned Branch",
      orderTotal: "Total",
      orderStatus: "Status",
      orderDetails: "Details",
      statusNew: "New",
      statusReady: "Ready",
      statusCompleted: "Completed",
      statusCancelled: "Cancelled",
      exportExcel: "Export as Excel (CSV)",
      filterDate: "Date Filter",
      filterStatus: "Status Filter",
      filterBranch: "Branch Filter",
      allStatuses: "All Statuses",
      allBranches: "All Branches",
      allDates: "All Dates",
      today: "Today",
      yesterday: "Yesterday",
      last7Days: "Last 7 Days",
      thisMonth: "This Month",
      customRange: "Custom Range",
      
      // Order Details Modal
      orderDetailsTitle: "Order Details",
      itemsOrdered: "Items Ordered",
      subtotalAmount: "Subtotal",
      deliveryFeeAmount: "Delivery Fee",
      totalAmount: "Total Amount",
      customerDetails: "Customer Information",
      notes: "Notes",
      customerGPS: "Customer GPS Location",
      viewOnMaps: "View on Google Maps",
      updateStatus: "Update Order Status",
      
      // Customers Tab
      customersTitle: "Customer Cumulative Records",
      customerOrdersCount: "Total Orders",
      customerTotalSpend: "Total Spend",
      lastOrder: "Last Order",
      viewHistory: "Order History",
      
      // Categories & Products Tab
      addCategory: "Add New Category",
      addProduct: "Add New Product",
      importCSV: "Import from CSV",
      exportCSV: "Export Products (CSV)",
      downloadTemplate: "Download CSV Template",
      selectAll: "Select All",
      bulkDelete: "Delete Selected",
      productName: "Product Name",
      productCategory: "Category",
      regularPriceInput: "Regular Price",
      discountPriceInput: "Discount Price (Optional)",
      productDescription: "Description",
      productImage: "Product Image",
      categoryNameAr: "Category Name (Arabic)",
      categoryNameEn: "Category Name (English)",
      productNameAr: "Product Name (Arabic)",
      productNameEn: "Product Name (English)",
      uploadImageFile: "Upload Local Image",
      orChoosePreset: "Or Select Preset Image",
      confirmBulkDelete: "Are you sure you want to delete the selected products? This action cannot be undone.",
      
      // Branches & Settings Tab
      addBranch: "Add New Branch",
      branchNameAr: "Branch Name (Arabic)",
      branchNameEn: "Branch Name (English)",
      branchAddressInput: "Detailed Address",
      branchPhoneInput: "Branch Phone",
      branchManagerInput: "Branch Manager",
      branchMapUrl: "Google Maps URL",
      deliveryEligibility: "Eligible for Home Delivery",
      shopSettingsTitle: "Contact Channels & General Store Settings",
      facebookUrl: "Facebook Page URL",
      instagramUrl: "Instagram Profile URL",
      tiktokUrl: "TikTok Profile URL",
      contactPhone: "Unified Hotline",
      whatsappNumber: "WhatsApp Orders Phone",
      contactEmail: "Official Email Address",
      deliveryFeeDefault: "Default Delivery Fee (EGP)",
      freeDeliveryThreshold: "Free Delivery Minimum Order (EGP)",
      saveSettingsBtn: "Save Shop Settings",
      settingsSavedSuccess: "Settings saved and synchronized with storefront successfully",
      
      // Accounts Tab
      accountsTitle: "Accounts & System Permissions",
      accountUser: "Username",
      accountRole: "Role & Permission",
      accountBranch: "Assigned Branch",
      permissionRestrictedNotice: "Notice: Branch accounts are restricted to their branch orders and reports. Editing categories, products, branches, and store settings is disabled.",
      
      // Reports Tab
      reportsTitle: "Sales & Performance Reports",
      reportRuleNotice: "Calculation Rule: Only New, Ready, and Completed orders are calculated. Cancelled orders are excluded from total sales.",
      totalSales: "Total Sales",
      ordersCount: "Confirmed Orders Count",
      avgOrderValue: "Average Order Value",
      salesByBranch: "Sales Breakdown by Branch",
      salesByDate: "Sales Breakdown by Date",
      printReport: "Print Report (A4)",
      
      // Missing services note
      systemNoticeTitle: "Server connection status",
      systemNoticeBody: "The storefront and dashboard use a shared Node.js server and SQLite database. Orders and shop data are stored on the server, and signed-in users receive updates over SSE."
    }
  },

  t(key, params = {}) {
    const lang = this.currentLang;
    let text = (this.translations[lang] && this.translations[lang][key]) || 
               (this.translations.ar && this.translations.ar[key]) || key;
    
    // Replace interpolated params like {amount} or {percent}
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return text;
  },

  setLang(lang) {
    if (lang !== 'ar' && lang !== 'en') return;
    this.currentLang = lang;
    localStorage.setItem('taj_lang', lang);
    this.applyToDOM();
    // Dispatch event so any listening UI can re-render immediately
    window.dispatchEvent(new CustomEvent('taj_lang_changed', { detail: { lang } }));
  },

  toggleLang() {
    this.setLang(this.currentLang === 'ar' ? 'en' : 'ar');
  },

  applyToDOM() {
    const isAr = this.currentLang === 'ar';
    document.documentElement.lang = isAr ? 'ar' : 'en';
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    // Update elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', this.t(key));
      }
    });

    // Update elements with data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', this.t(key));
      }
    });

    // Update language toggle button label
    const langBtns = document.querySelectorAll('.lang-toggle-btn');
    langBtns.forEach(btn => {
      const label = btn.querySelector('.lang-label');
      if (label) {
        label.textContent = isAr ? 'Ar' : 'Eng';
      }
    });
  },

  init() {
    this.applyToDOM();
  }
};

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => I18N.init());
  } else {
    I18N.init();
  }
}
