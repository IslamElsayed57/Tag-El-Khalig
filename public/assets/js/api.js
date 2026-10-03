/**
 * Taj El Khalig Sweets - Data & API Layer
 * Uses the configured shared server API, with localStorage mock mode retained only
 * for pages that deliberately omit the server runtime configuration.
 */

const TajAPI = (function() {
  const STORAGE_KEYS = {
    PRODUCTS: 'taj_products_v1',
    CATEGORIES: 'taj_categories_v1',
    BRANCHES: 'taj_branches_v1',
    SETTINGS: 'taj_settings_v1',
    ORDERS: 'taj_orders_v1',
    CURRENT_USER: 'taj_current_user_v1',
    USERS: 'taj_users_v1'
  };
  const remoteMode = window.TAJ_CONFIG && window.TAJ_CONFIG.mode === 'remote';

  // Broadcast channel for instantaneous cross-tab reactivity
  let broadcastChannel = null;
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel('taj_sweets_channel');
  }

  function notifyChange(event, payload = {}) {
    window.dispatchEvent(new CustomEvent(event, { detail: payload }));
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ event, payload });
      } catch (e) {
        console.warn('Broadcast error', e);
      }
    }
  }

  // Initial Seed Data
  const defaultCategories = [
    { id: 'cat-oriental', nameAr: 'حلويات شرقية فاخرة', nameEn: 'Luxury Oriental Sweets', active: true, order: 1 },
    { id: 'cat-kunafa', nameAr: 'كنافة وطواجن قشطة', nameEn: 'Kunafa & Ashta Casseroles', active: true, order: 2 },
    { id: 'cat-basbousa', nameAr: 'بسبوسة وهريسة بلدي', nameEn: 'Egyptian Basbousa & Hareesa', active: true, order: 3 },
    { id: 'cat-western', nameAr: 'تورت وجاتوه فرنسي', nameEn: 'Cakes & French Gateaux', active: true, order: 4 },
    { id: 'cat-kahk', nameAr: 'كحك وبسكويت العيد ومكسرات', nameEn: 'Kahk, Eid Cookies & Nuts', active: true, order: 5 }
  ];

  const defaultProducts = [
    {
      id: 'prod-1',
      categoryId: 'cat-kunafa',
      nameAr: 'كنافة نابلسية بالقشطة والفستق',
      nameEn: 'Kunafa Nabulsi with Cream & Pistachio',
      descAr: 'كنافة ذهبية مقرمشة محشوة بقشطة طازجة غنية ومسقية بشربات خفيف، مغطاة بأفخر أنواع الفستق الحلبي.',
      descEn: 'Golden crispy shredded filo pastry stuffed with luscious fresh cream, drizzled with scented syrup and crushed pistachios.',
      regularPrice: 220,
      discountPrice: 195,
      image: 'assets/images/kunafa_plate.jpg',
      inStock: true,
      active: true,
      featured: true
    },
    {
      id: 'prod-2',
      categoryId: 'cat-basbousa',
      nameAr: 'صينية بسبوسة ملكي باللوز البلدي',
      nameEn: 'Royal Basbousa with Whole Almonds',
      descAr: 'بسبوسة مصرية دايبة بالسمن البلدي الفاخر ومحلاة بعسل نقي ومرصعة بحبات اللوز المحمص.',
      descEn: 'Authentic melt-in-the-mouth semolina cake baked with pure Egyptian baladi ghee and garnished with roasted whole almonds.',
      regularPrice: 180,
      discountPrice: 160,
      image: 'assets/images/basbousa_plate.jpg',
      inStock: true,
      active: true,
      featured: true
    },
    {
      id: 'prod-3',
      categoryId: 'cat-western',
      nameAr: 'تورتة شوكولاتة فدج رويال',
      nameEn: 'Royal Chocolate Fudge Cake',
      descAr: 'طبقات كيك الشوكولاتة البلجيكية الغنية مع حشوة جناش الفدج وجليز لامع وتوت طازج.',
      descEn: 'Decadent Belgian chocolate cake layered with rich fudge ganache, mirror chocolate glaze, and fresh berries.',
      regularPrice: 380,
      discountPrice: 340,
      image: 'assets/images/gateau_cake.jpg',
      inStock: true,
      active: true,
      featured: true
    },
    {
      id: 'prod-4',
      categoryId: 'cat-oriental',
      nameAr: 'مشكل شرقي ملكي تاج الخليج',
      nameEn: 'Taj El Khalig Royal Oriental Assortment',
      descAr: 'علبة مشكلة تضم تشكيلة متميزة من أصناف البقلاوة المورقة، أساور الفستق، وكنافة بورمة وبسبوسة.',
      descEn: 'A luxury mixed platter featuring flaky baklava diamonds, pistachio rings, rolled bourma, and almond basbousa.',
      regularPrice: 290,
      discountPrice: null,
      image: 'assets/images/hero_sweets.jpg',
      inStock: true,
      active: true,
      featured: true
    },
    {
      id: 'prod-5',
      categoryId: 'cat-kunafa',
      nameAr: 'طاجن كنافة لوتس ونوتيلا',
      nameEn: 'Lotus & Nutella Kunafa Casserole',
      descAr: 'كنافة مقرمشة ساخنة ممزوجة بصوص اللوتس المقرمش وشوكولاتة النوتيلا الإيطالية الفاخرة.',
      descEn: 'Crunchy warm kunafa smothered with rich Belgian Nutella chocolate and spiced Lotus Biscoff spread.',
      regularPrice: 150,
      discountPrice: 135,
      image: 'assets/images/kunafa_plate.jpg',
      inStock: true,
      active: true,
      featured: false
    },
    {
      id: 'prod-6',
      categoryId: 'cat-western',
      nameAr: 'دستة جاتوه ميكس سوبر لوكس (12 قطعة)',
      nameEn: 'Super Lux Mixed Gateaux (12 Pcs)',
      descAr: 'تشكيلة راقية من 12 قطعة جاتوه منوعة (موس شوكولاتة، تارت فواكه، ريد فيلفيت، وميلفيه كراميل).',
      descEn: 'Exquisite 12-piece gourmet gateaux collection including chocolate mousse, fruit tarts, red velvet, and millefeuille.',
      regularPrice: 320,
      discountPrice: 290,
      image: 'assets/images/gateau_cake.jpg',
      inStock: true,
      active: true,
      featured: false
    },
    {
      id: 'prod-7',
      categoryId: 'cat-basbousa',
      nameAr: 'هريسة إسكندراني بالقشطة والمكسرات',
      nameEn: 'Alexandrian Hareesa with Cream & Nuts',
      descAr: 'هريسة إسكندراني أصلية مكرملة بالسمن البلدي محشوة بطبقة وفيرة من القشطة البلدية الطازجة.',
      descEn: 'Traditional caramelized semolina Hareesa stuffed with rich Egyptian clotted cream and chopped hazelnuts.',
      regularPrice: 175,
      discountPrice: null,
      image: 'assets/images/basbousa_plate.jpg',
      inStock: true,
      active: true,
      featured: false
    },
    {
      id: 'prod-8',
      categoryId: 'cat-kahk',
      nameAr: 'علبة كحك العيد بالسمن البلدي (1 كجم)',
      nameEn: 'Eid Egyptian Kahk with Pure Ghee (1kg)',
      descAr: 'كحك مصري ناعم ودايب مخبوز بالسمن البلدي الأصلي، يقدم مع سكر البودرة المنخول.',
      descEn: 'Delicate melt-in-mouth traditional Egyptian Eid cookies crafted with pure clarified butter, with powdered sugar.',
      regularPrice: 260,
      discountPrice: 235,
      image: 'assets/images/hero_sweets.jpg',
      inStock: true,
      active: true,
      featured: false
    }
  ];

  const defaultBranches = [
    {
      id: 'branch-tagamoa',
      nameAr: 'فرع التجمع الخامس',
      nameEn: 'Fifth Settlement Branch',
      addressAr: 'شارع التسعين الجنوبي، بجوار كونكورد بلازا، القاهرة الجديدة',
      addressEn: 'South 90th St, next to Concord Plaza, New Cairo',
      phone: '01023456781',
      managerAr: 'أحمد الشناوي',
      managerEn: 'Ahmed El Shennawy',
      mapUrl: 'https://maps.google.com/?q=30.0194,31.4395',
      coordinates: { lat: 30.0194, lng: 31.4395 },
      deliveryEligible: true,
      active: true
    },
    {
      id: 'branch-nasr',
      nameAr: 'فرع مدينة نصر',
      nameEn: 'Nasr City Branch',
      addressAr: 'شارع عباس العقاد، تقاطع مصطفى النحاس، مدينة نصر، القاهرة',
      addressEn: 'Abbas El Akkad St, crossing Mostafa El Nahas, Nasr City, Cairo',
      phone: '01023456782',
      managerAr: 'محمود عبد الرحمن',
      managerEn: 'Mahmoud Abdel Rahman',
      mapUrl: 'https://maps.google.com/?q=30.0617,31.3368',
      coordinates: { lat: 30.0617, lng: 31.3368 },
      deliveryEligible: true,
      active: true
    },
    {
      id: 'branch-mohandessin',
      nameAr: 'فرع المهندسين',
      nameEn: 'Mohandessin Branch',
      addressAr: 'شارع جامعة الدول العربية، أمام نادي الصيد، الجيزة',
      addressEn: 'Gamet El Dewal El Arabia St, opposite Shooting Club, Giza',
      phone: '01023456783',
      managerAr: 'طارق فتحي',
      managerEn: 'Tarek Fathy',
      mapUrl: 'https://maps.google.com/?q=30.0528,31.2014',
      coordinates: { lat: 30.0528, lng: 31.2014 },
      deliveryEligible: true,
      active: true
    },
    {
      id: 'branch-maadi',
      nameAr: 'فرع المعادي',
      nameEn: 'Maadi Branch',
      addressAr: 'شارع النصر، أمام جراند مول، المعادي الجديدة، القاهرة',
      addressEn: 'El Nasr St, opposite Grand Mall, New Maadi, Cairo',
      phone: '01023456784',
      managerAr: 'ياسر فاروق',
      managerEn: 'Yasser Farouk',
      mapUrl: 'https://maps.google.com/?q=29.9737,31.2725',
      coordinates: { lat: 29.9737, lng: 31.2725 },
      deliveryEligible: true,
      active: true
    }
  ];

  const defaultSettings = {
    shopNameAr: 'حلواني تاج الخليج',
    shopNameEn: 'Taj El Khalig Sweets',
    taglineAr: 'أحلى طعم لأصالة الحلويات الشرقية والغربية',
    taglineEn: 'The Sweetest Taste of Authentic Oriental & Western Pastries',
    contactPhone: '19876',
    whatsappNumber: '01099887766',
    contactEmail: 'info@tajelkhalig.com',
    facebookUrl: 'https://facebook.com/tajelkhaligsweets',
    instagramUrl: 'https://instagram.com/tajelkhaligsweets',
    tiktokUrl: 'https://tiktok.com/@tajelkhaligsweets',
    deliveryFee: 25,
    freeDeliveryThreshold: 250,
    currencyAr: 'ج.م',
    currencyEn: 'EGP'
  };

  const defaultUsers = [
    {
      id: 'user-admin',
      username: 'admin',
      role: 'admin',
      nameAr: 'المدير العام',
      nameEn: 'General Administrator',
      branchId: null
    },
    {
      id: 'user-branch-nasr',
      username: 'branch_nasr',
      role: 'branch',
      nameAr: 'مدير فرع مدينة نصر',
      nameEn: 'Nasr City Branch Manager',
      branchId: 'branch-nasr'
    },
    {
      id: 'user-branch-tagamoa',
      username: 'branch_tagamoa',
      role: 'branch',
      nameAr: 'مدير فرع التجمع الخامس',
      nameEn: 'Fifth Settlement Branch Manager',
      branchId: 'branch-tagamoa'
    }
  ];

  const defaultOrders = [
    {
      id: '1024',
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      customerName: 'إسلام أحمد السيد',
      customerPhone: '01012345678',
      type: 'delivery',
      branchId: 'branch-nasr',
      branchNameAr: 'فرع مدينة نصر',
      branchNameEn: 'Nasr City Branch',
      deliveryFee: 25,
      subtotal: 355,
      total: 380,
      status: 'ready', // new, ready, completed, cancelled
      items: [
        { productId: 'prod-1', nameAr: 'كنافة نابلسية بالقشطة والفستق', nameEn: 'Kunafa Nabulsi', price: 195, quantity: 1, image: 'assets/images/kunafa_plate.jpg' },
        { productId: 'prod-2', nameAr: 'صينية بسبوسة ملكي باللوز البلدي', nameEn: 'Royal Basbousa', price: 160, quantity: 1, image: 'assets/images/basbousa_plate.jpg' }
      ],
      address: 'القاهرة، مدينة نصر، شارع الطيران عمارة 14 الدور الثالث شقة 5',
      gpsCoordinates: { lat: 30.0588, lng: 31.3321 },
      notes: 'الشربات يكون خفيف لو سمحتم والتوصيل في أقرب وقت'
    },
    {
      id: '1023',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      customerName: 'سارة محمد إبراهيم',
      customerPhone: '01122334455',
      type: 'pickup',
      branchId: 'branch-tagamoa',
      branchNameAr: 'فرع التجمع الخامس',
      branchNameEn: 'Fifth Settlement Branch',
      deliveryFee: 0,
      subtotal: 340,
      total: 340,
      status: 'completed',
      items: [
        { productId: 'prod-3', nameAr: 'تورتة شوكولاتة فدج رويال', nameEn: 'Royal Chocolate Fudge Cake', price: 340, quantity: 1, image: 'assets/images/gateau_cake.jpg' }
      ],
      address: null,
      gpsCoordinates: null,
      notes: 'استلام الساعة 7 مساءً بمناسبة عيد ميلاد'
    },
    {
      id: '1022',
      createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
      customerName: 'كريم عبد العزيز',
      customerPhone: '01234567890',
      type: 'delivery',
      branchId: 'branch-mohandessin',
      branchNameAr: 'فرع المهندسين',
      branchNameEn: 'Mohandessin Branch',
      deliveryFee: 0,
      subtotal: 580,
      total: 580,
      status: 'completed',
      items: [
        { productId: 'prod-4', nameAr: 'مشكل شرقي ملكي تاج الخليج', nameEn: 'Taj El Khalig Royal Oriental Assortment', price: 290, quantity: 2, image: 'assets/images/hero_sweets.jpg' }
      ],
      address: 'الجيزة، المهندسين، شارع شهاب عمارة 22',
      gpsCoordinates: { lat: 30.0489, lng: 31.2052 },
      notes: ''
    },
    {
      id: '1021',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      customerName: 'منى محمود حسن',
      customerPhone: '01098765432',
      type: 'delivery',
      branchId: 'branch-nasr',
      branchNameAr: 'فرع مدينة نصر',
      branchNameEn: 'Nasr City Branch',
      deliveryFee: 25,
      subtotal: 135,
      total: 160,
      status: 'cancelled',
      items: [
        { productId: 'prod-5', nameAr: 'طاجن كنافة لوتس ونوتيلا', nameEn: 'Lotus & Nutella Kunafa Casserole', price: 135, quantity: 1, image: 'assets/images/kunafa_plate.jpg' }
      ],
      address: 'مدينة نصر، حي السفارات',
      gpsCoordinates: null,
      notes: 'طلب العميل الإلغاء لظرف طارئ'
    }
  ];

  // Helper storage functions
  function getStored(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error('Storage read error for key:', key, e);
      return fallback;
    }
  }

  function setStored(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error for key:', key, e);
    }
  }

  // Initialize DB if not populated
  function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      setStored(STORAGE_KEYS.CATEGORIES, defaultCategories);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      setStored(STORAGE_KEYS.PRODUCTS, defaultProducts);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BRANCHES)) {
      setStored(STORAGE_KEYS.BRANCHES, defaultBranches);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      setStored(STORAGE_KEYS.SETTINGS, defaultSettings);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      setStored(STORAGE_KEYS.ORDERS, defaultOrders);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      setStored(STORAGE_KEYS.USERS, defaultUsers);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      setStored(STORAGE_KEYS.CURRENT_USER, defaultUsers[0]); // default to admin
    }
  }

  if (!remoteMode) initStorage();

  // Listen to cross-window storage events
  window.addEventListener('storage', (e) => {
    if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
      notifyChange('taj_data_synced', { key: e.key });
    }
  });

  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.event) {
        window.dispatchEvent(new CustomEvent(event.data.event, { detail: event.data.payload }));
      }
    };
  }

  // ---------------------------------------------------------------
  // Minimal real XLSX writer (no external libraries).
  // An .xlsx file is a ZIP package of Office Open XML parts; this builds
  // it with stored (uncompressed) entries so Excel opens it natively.
  // ---------------------------------------------------------------
  const CRC32_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC32_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function zipStore(entries) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    const u16 = v => [v & 0xFF, (v >>> 8) & 0xFF];
    const u32 = v => [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF];
    const dosDate = 22561; // 2024-01-01 in MS-DOS format

    entries.forEach(entry => {
      const nameBytes = encoder.encode(entry.name);
      const data = entry.data;
      const crc = crc32(data);

      const localHeader = new Uint8Array([].concat(
        u32(0x04034b50), u16(20), u16(0), u16(0),
        u16(0), u16(dosDate),
        u32(crc), u32(data.length), u32(data.length),
        u16(nameBytes.length), u16(0)
      ));
      localParts.push(localHeader, nameBytes, data);

      const centralHeader = new Uint8Array([].concat(
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0),
        u16(0), u16(dosDate),
        u32(crc), u32(data.length), u32(data.length),
        u16(nameBytes.length), u16(0), u16(0),
        u16(0), u16(0), u32(0), u32(offset)
      ));
      centralParts.push(centralHeader, nameBytes);

      offset += localHeader.length + nameBytes.length + data.length;
    });

    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const eocd = new Uint8Array([].concat(
      u32(0x06054b50), u16(0), u16(0),
      u16(entries.length), u16(entries.length),
      u32(centralSize), u32(offset), u16(0)
    ));

    return new Blob([...localParts, ...centralParts, eocd],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  function xmlEscape(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function columnRef(index) {
    let ref = '';
    let n = index + 1;
    while (n > 0) {
      const rem = (n - 1) % 26;
      ref = String.fromCharCode(65 + rem) + ref;
      n = Math.floor((n - 1) / 26);
    }
    return ref;
  }

  function buildSheetXml(rows) {
    const rowsXml = rows.map((row, r) => {
      const cells = row.map((value, c) => {
        const ref = columnRef(c) + (r + 1);
        if (typeof value === 'number' && Number.isFinite(value)) {
          return `<c r="${ref}"><v>${value}</v></c>`;
        }
        const text = value == null ? '' : String(value);
        return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(text)}</t></is></c>`;
      }).join('');
      return `<row r="${r + 1}">${cells}</row>`;
    }).join('');

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      `<sheetData>${rowsXml}</sheetData></worksheet>`;
  }

  function downloadXlsx(fileName, sheetName, rows) {
    const encoder = new TextEncoder();
    const parts = [
      ['[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '</Types>'],
      ['_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>'],
      ['xl/workbook.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        `<sheets><sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
      ['xl/_rels/workbook.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '</Relationships>'],
      ['xl/worksheets/sheet1.xml', buildSheetXml(rows)]
    ];

    const blob = zipStore(parts.map(([name, xml]) => ({ name, data: encoder.encode(xml) })));
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // ---------------------------------------------------------------
  // Minimal XLSX reader (no external libraries).
  // Parses the ZIP container (stored + deflate entries) and returns
  // the first worksheet as an array of rows of cell values.
  // ---------------------------------------------------------------
  async function unzipEntries(buffer) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);

    let eocdPos = -1;
    const scanStart = Math.max(0, bytes.length - 22 - 65535);
    for (let i = bytes.length - 22; i >= scanStart; i--) {
      if (view.getUint32(i, true) === 0x06054b50) { eocdPos = i; break; }
    }
    if (eocdPos < 0) throw new Error('ملف XLSX غير صالح');

    const entryCount = view.getUint16(eocdPos + 10, true);
    let ptr = view.getUint32(eocdPos + 16, true);
    const entries = {};

    for (let n = 0; n < entryCount; n++) {
      if (view.getUint32(ptr, true) !== 0x02014b50) break;
      const method = view.getUint16(ptr + 10, true);
      const compSize = view.getUint32(ptr + 20, true);
      const nameLen = view.getUint16(ptr + 28, true);
      const extraLen = view.getUint16(ptr + 30, true);
      const commentLen = view.getUint16(ptr + 32, true);
      const localOff = view.getUint32(ptr + 42, true);
      const name = new TextDecoder().decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
      entries[name] = { method, compSize, localOff };
      ptr += 46 + nameLen + extraLen + commentLen;
    }

    return { bytes, view, entries };
  }

  async function unzipEntry(z, name) {
    const entry = z.entries[name];
    if (!entry) return null;
    const off = entry.localOff;
    if (z.view.getUint32(off, true) !== 0x04034b50) throw new Error('ملف XLSX تالف');
    const nameLen = z.view.getUint16(off + 26, true);
    const extraLen = z.view.getUint16(off + 28, true);
    const start = off + 30 + nameLen + extraLen;
    const data = z.bytes.subarray(start, start + entry.compSize);

    if (entry.method === 0) return data;
    if (entry.method === 8) {
      if (typeof DecompressionStream === 'undefined') {
        throw new Error('متصفحك لا يدعم فك ضغط ملفات XLSX، جرّب متصفح أحدث');
      }
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }
    throw new Error('نوع ضغط غير مدعوم في ملف XLSX');
  }

  function parseXmlDoc(bytes) {
    const doc = new DOMParser().parseFromString(new TextDecoder().decode(bytes), 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('ملف XLSX تالف');
    return doc;
  }

  function elementText(el) {
    let text = '';
    const ts = el.getElementsByTagName('t');
    for (let i = 0; i < ts.length; i++) text += ts[i].textContent;
    return text;
  }

  function cellAddress(ref) {
    const m = /^([A-Z]+)(\d+)$/.exec(ref || '');
    if (!m) return null;
    let col = 0;
    for (let i = 0; i < m[1].length; i++) col = col * 26 + (m[1].charCodeAt(i) - 64);
    return { col: col - 1, row: parseInt(m[2], 10) - 1 };
  }

  async function parseXlsxBuffer(buffer) {
    const z = await unzipEntries(buffer);

    const shared = [];
    const sharedXml = await unzipEntry(z, 'xl/sharedStrings.xml');
    if (sharedXml) {
      const doc = parseXmlDoc(sharedXml);
      const sis = doc.getElementsByTagName('si');
      for (let i = 0; i < sis.length; i++) shared.push(elementText(sis[i]));
    }

    let sheetPath = 'xl/worksheets/sheet1.xml';
    const workbookXml = await unzipEntry(z, 'xl/workbook.xml');
    const relsXml = await unzipEntry(z, 'xl/_rels/workbook.xml.rels');
    if (workbookXml && relsXml) {
      const sheet = parseXmlDoc(workbookXml).getElementsByTagName('sheet')[0];
      const relsDoc = parseXmlDoc(relsXml);
      const rid = sheet && (sheet.getAttribute('r:id') ||
        sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
      if (rid) {
        const rels = relsDoc.getElementsByTagName('Relationship');
        for (let i = 0; i < rels.length; i++) {
          if (rels[i].getAttribute('Id') === rid) {
            const target = (rels[i].getAttribute('Target') || '').replace(/^\/+/, '');
            if (target) sheetPath = target.indexOf('xl/') === 0 ? target : 'xl/' + target;
            break;
          }
        }
      }
    }

    const sheetXml = await unzipEntry(z, sheetPath) || await unzipEntry(z, 'xl/worksheets/sheet1.xml');
    if (!sheetXml) throw new Error('لم يتم العثور على ورقة بيانات داخل الملف');

    const cells = parseXmlDoc(sheetXml).getElementsByTagName('c');
    const rowsMap = {};
    let maxRow = -1, maxCol = -1;

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const pos = cellAddress(cell.getAttribute('r'));
      if (!pos) continue;
      const type = cell.getAttribute('t');
      let value = '';
      if (type === 'inlineStr') {
        const is = cell.getElementsByTagName('is')[0];
        value = is ? elementText(is) : '';
      } else {
        const v = cell.getElementsByTagName('v')[0];
        const raw = v ? v.textContent : '';
        if (type === 's') value = shared[parseInt(raw, 10)] || '';
        else if (type === 'b') value = raw === '1' || raw === 'true';
        else if (raw === '') value = '';
        else if (type === 'str' || type === 'e') value = raw;
        else value = isNaN(Number(raw)) ? raw : Number(raw);
      }
      if (!rowsMap[pos.row]) rowsMap[pos.row] = [];
      rowsMap[pos.row][pos.col] = value;
      if (pos.row > maxRow) maxRow = pos.row;
      if (pos.col > maxCol) maxCol = pos.col;
    }

    const rows = [];
    for (let r = 0; r <= maxRow; r++) {
      const src = rowsMap[r] || [];
      const dense = [];
      for (let c = 0; c <= maxCol; c++) dense.push(src[c] === undefined ? '' : src[c]);
      rows.push(dense);
    }
    return rows;
  }

  // Public API methods (emulating async backend endpoints)
  const localApi = {
    // Current User & Authentication
    async getCurrentUser() {
      return getStored(STORAGE_KEYS.CURRENT_USER, defaultUsers[0]);
    },

    async getUsers() {
      return getStored(STORAGE_KEYS.USERS, defaultUsers);
    },

    async setCurrentUser(userId) {
      const users = await this.getUsers();
      const user = users.find(u => u.id === userId);
      if (user) {
        setStored(STORAGE_KEYS.CURRENT_USER, user);
        notifyChange('taj_auth_changed', { user });
        return user;
      }
      throw new Error('User not found');
    },

    // Categories
    async getCategories(onlyActive = false) {
      const cats = getStored(STORAGE_KEYS.CATEGORIES, defaultCategories);
      if (onlyActive) {
        return cats.filter(c => c.active !== false);
      }
      return cats;
    },

    async createCategory(catData) {
      const cats = await this.getCategories();
      const newCat = {
        id: 'cat-' + Date.now(),
        nameAr: catData.nameAr.trim(),
        nameEn: catData.nameEn.trim(),
        active: catData.active !== false,
        order: cats.length + 1
      };
      cats.push(newCat);
      setStored(STORAGE_KEYS.CATEGORIES, cats);
      notifyChange('taj_categories_updated', { category: newCat });
      return newCat;
    },

    async updateCategory(catId, updates) {
      const cats = await this.getCategories();
      const index = cats.findIndex(c => c.id === catId);
      if (index === -1) throw new Error('Category not found');
      cats[index] = { ...cats[index], ...updates };
      setStored(STORAGE_KEYS.CATEGORIES, cats);
      notifyChange('taj_categories_updated', { category: cats[index] });
      return cats[index];
    },

    async deleteCategory(catId) {
      // Safety rule: prevent deletion if active products exist in category
      const products = await this.getProducts();
      const activeProductsInCat = products.filter(p => p.categoryId === catId && p.active);
      if (activeProductsInCat.length > 0) {
        throw new Error('Cannot delete category containing active products. Please reassign or deactivate products first.');
      }

      let cats = await this.getCategories();
      cats = cats.filter(c => c.id !== catId);
      setStored(STORAGE_KEYS.CATEGORIES, cats);
      notifyChange('taj_categories_updated', { deletedId: catId });
      return true;
    },

    // Products
    async getProducts(filter = {}) {
      let prods = getStored(STORAGE_KEYS.PRODUCTS, defaultProducts);
      const categories = await this.getCategories();
      const activeCategoryIds = new Set(categories.filter(c => c.active).map(c => c.id));

      if (filter.onlyActive) {
        // Must be active AND belong to an active category!
        prods = prods.filter(p => p.active && activeCategoryIds.has(p.categoryId));
      }

      if (filter.categoryId && filter.categoryId !== 'all') {
        prods = prods.filter(p => p.categoryId === filter.categoryId);
      }

      if (filter.search) {
        const query = filter.search.toLowerCase().trim();
        prods = prods.filter(p => 
          (p.nameAr && p.nameAr.toLowerCase().includes(query)) ||
          (p.nameEn && p.nameEn.toLowerCase().includes(query)) ||
          (p.descAr && p.descAr.toLowerCase().includes(query)) ||
          (p.descEn && p.descEn.toLowerCase().includes(query))
        );
      }

      return prods;
    },

    async getProductById(id) {
      const prods = await this.getProducts();
      return prods.find(p => p.id === id) || null;
    },

    async createProduct(productData) {
      const prods = getStored(STORAGE_KEYS.PRODUCTS, defaultProducts);
      const newProd = {
        id: 'prod-' + Date.now(),
        categoryId: productData.categoryId,
        nameAr: productData.nameAr.trim(),
        nameEn: productData.nameEn.trim(),
        descAr: (productData.descAr || '').trim(),
        descEn: (productData.descEn || '').trim(),
        regularPrice: parseFloat(productData.regularPrice) || 0,
        discountPrice: productData.discountPrice ? parseFloat(productData.discountPrice) : null,
        image: productData.image || 'assets/images/kunafa_plate.jpg',
        inStock: productData.inStock !== false,
        active: productData.active !== false,
        featured: !!productData.featured
      };
      prods.unshift(newProd);
      setStored(STORAGE_KEYS.PRODUCTS, prods);
      notifyChange('taj_products_updated', { product: newProd });
      return newProd;
    },

    async updateProduct(id, updates) {
      const prods = getStored(STORAGE_KEYS.PRODUCTS, defaultProducts);
      const index = prods.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Product not found');
      prods[index] = { ...prods[index], ...updates };
      setStored(STORAGE_KEYS.PRODUCTS, prods);
      notifyChange('taj_products_updated', { product: prods[index] });
      return prods[index];
    },

    async deleteProduct(id) {
      let prods = getStored(STORAGE_KEYS.PRODUCTS, defaultProducts);
      prods = prods.filter(p => p.id !== id);
      setStored(STORAGE_KEYS.PRODUCTS, prods);
      notifyChange('taj_products_updated', { deletedId: id });
      return true;
    },

    async bulkDeleteProducts(ids) {
      const idSet = new Set(ids);
      let prods = getStored(STORAGE_KEYS.PRODUCTS, defaultProducts);
      prods = prods.filter(p => !idSet.has(p.id));
      setStored(STORAGE_KEYS.PRODUCTS, prods);
      notifyChange('taj_products_updated', { bulkDeletedIds: ids });
      return true;
    },

    // Branches & Settings
    async getBranches(onlyActive = false) {
      let branches = getStored(STORAGE_KEYS.BRANCHES, defaultBranches);
      if (onlyActive) {
        branches = branches.filter(b => b.active);
      }
      return branches;
    },

    async getBranchById(id) {
      const branches = await this.getBranches();
      return branches.find(b => b.id === id) || null;
    },

    async createBranch(branchData) {
      const branches = await this.getBranches();
      const newBranch = {
        id: 'branch-' + Date.now(),
        nameAr: branchData.nameAr.trim(),
        nameEn: branchData.nameEn.trim(),
        addressAr: branchData.addressAr.trim(),
        addressEn: branchData.addressEn.trim(),
        phone: branchData.phone.trim(),
        managerAr: (branchData.managerAr || '').trim(),
        managerEn: (branchData.managerEn || '').trim(),
        mapUrl: branchData.mapUrl || '',
        coordinates: branchData.coordinates || null,
        deliveryEligible: branchData.deliveryEligible !== false,
        active: branchData.active !== false
      };
      branches.push(newBranch);
      setStored(STORAGE_KEYS.BRANCHES, branches);
      notifyChange('taj_branches_updated', { branch: newBranch });
      return newBranch;
    },

    async updateBranch(id, updates) {
      const branches = await this.getBranches();
      const index = branches.findIndex(b => b.id === id);
      if (index === -1) throw new Error('Branch not found');
      branches[index] = { ...branches[index], ...updates };
      setStored(STORAGE_KEYS.BRANCHES, branches);
      notifyChange('taj_branches_updated', { branch: branches[index] });
      return branches[index];
    },

    async getSettings() {
      return getStored(STORAGE_KEYS.SETTINGS, defaultSettings);
    },

    async updateSettings(newSettings) {
      const current = await this.getSettings();
      const updated = { ...current, ...newSettings };
      setStored(STORAGE_KEYS.SETTINGS, updated);
      notifyChange('taj_settings_updated', { settings: updated });
      return updated;
    },

    // Orders
    async getOrders(filters = {}, page = 1, limit = 20) {
      let orders = getStored(STORAGE_KEYS.ORDERS, defaultOrders);

      // Branch user permission check: branch users can ONLY see orders for their assigned branch
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.role === 'branch' && currentUser.branchId) {
        orders = orders.filter(o => o.branchId === currentUser.branchId);
      } else if (filters.branchId && filters.branchId !== 'all') {
        orders = orders.filter(o => o.branchId === filters.branchId);
      }

      if (filters.status && filters.status !== 'all') {
        orders = orders.filter(o => o.status === filters.status);
      }

      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        orders = orders.filter(o => 
          (o.customerName && o.customerName.toLowerCase().includes(query)) ||
          (o.customerPhone && o.customerPhone.includes(query)) ||
          (o.id && o.id.toString().includes(query))
        );
      }

      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        if (filters.dateRange === 'today') {
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          orders = orders.filter(o => new Date(o.createdAt).getTime() >= startOfDay);
        } else if (filters.dateRange === 'yesterday') {
          const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
          const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          orders = orders.filter(o => {
            const t = new Date(o.createdAt).getTime();
            return t >= startOfYesterday && t < endOfYesterday;
          });
        } else if (filters.dateRange === 'last7') {
          const sevenDaysAgo = now.getTime() - (7 * 24 * 3600 * 1000);
          orders = orders.filter(o => new Date(o.createdAt).getTime() >= sevenDaysAgo);
        } else if (filters.dateRange === 'thisMonth') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          orders = orders.filter(o => new Date(o.createdAt).getTime() >= startOfMonth);
        }
      }

      // Sort newest first
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const totalCount = orders.length;
      const totalPages = Math.ceil(totalCount / limit) || 1;
      const startIndex = (page - 1) * limit;
      const paginatedOrders = orders.slice(startIndex, startIndex + limit);

      return {
        orders: paginatedOrders,
        totalCount,
        totalPages,
        currentPage: page,
        limit
      };
    },

    async getOrderById(id) {
      const orders = getStored(STORAGE_KEYS.ORDERS, defaultOrders);
      return orders.find(o => o.id.toString() === id.toString()) || null;
    },

    async createOrder(orderPayload) {
      const orders = getStored(STORAGE_KEYS.ORDERS, defaultOrders);
      
      // Determine next order ID (e.g. 1025)
      const existingIds = orders.map(o => parseInt(o.id, 10)).filter(n => !isNaN(n));
      const nextId = existingIds.length > 0 ? (Math.max(...existingIds) + 1).toString() : '1025';

      const newOrder = {
        id: nextId,
        createdAt: new Date().toISOString(),
        customerName: orderPayload.customerName.trim(),
        customerPhone: orderPayload.customerPhone.trim(),
        type: orderPayload.type, // 'delivery' or 'pickup'
        branchId: orderPayload.branchId,
        branchNameAr: orderPayload.branchNameAr || '',
        branchNameEn: orderPayload.branchNameEn || '',
        deliveryFee: parseFloat(orderPayload.deliveryFee) || 0,
        subtotal: parseFloat(orderPayload.subtotal) || 0,
        total: parseFloat(orderPayload.total) || 0,
        status: 'new',
        items: orderPayload.items || [],
        address: orderPayload.address || null,
        gpsCoordinates: orderPayload.gpsCoordinates || null,
        notes: (orderPayload.notes || '').trim()
      };

      orders.unshift(newOrder);
      setStored(STORAGE_KEYS.ORDERS, orders);

      // Fire events for audio and UI notifications
      notifyChange('taj_new_order', { order: newOrder });
      return newOrder;
    },

    async updateOrderStatus(orderId, newStatus) {
      const orders = getStored(STORAGE_KEYS.ORDERS, defaultOrders);
      const index = orders.findIndex(o => o.id.toString() === orderId.toString());
      if (index === -1) throw new Error('Order not found');

      orders[index].status = newStatus;
      orders[index].updatedAt = new Date().toISOString();
      setStored(STORAGE_KEYS.ORDERS, orders);

      notifyChange('taj_order_status_changed', { order: orders[index], newStatus });
      return orders[index];
    },

    // Customers cumulative aggregation
    async getCustomers(searchQuery = '') {
      const orders = getStored(STORAGE_KEYS.ORDERS, defaultOrders);
      const currentUser = await this.getCurrentUser();
      
      // Filter orders by branch if user is branch account
      let filteredOrders = orders;
      if (currentUser && currentUser.role === 'branch' && currentUser.branchId) {
        filteredOrders = orders.filter(o => o.branchId === currentUser.branchId);
      }

      // Group by phone number
      const customerMap = {};

      filteredOrders.forEach(o => {
        const phone = o.customerPhone;
        if (!customerMap[phone]) {
          customerMap[phone] = {
            phone: phone,
            name: o.customerName,
            ordersCount: 0,
            totalSpend: 0,
            lastOrderDate: o.createdAt,
            orders: []
          };
        }

        customerMap[phone].ordersCount += 1;
        // Only include in total spend if order was not cancelled
        if (o.status !== 'cancelled') {
          customerMap[phone].totalSpend += o.total;
        }
        if (new Date(o.createdAt) > new Date(customerMap[phone].lastOrderDate)) {
          customerMap[phone].lastOrderDate = o.createdAt;
          customerMap[phone].name = o.customerName; // update latest name
        }
        customerMap[phone].orders.push(o);
      });

      let customerList = Object.values(customerMap);

      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        customerList = customerList.filter(c => 
          (c.name && c.name.toLowerCase().includes(query)) ||
          (c.phone && c.phone.includes(query))
        );
      }

      customerList.sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));
      return customerList;
    },

    // Reports calculation
    async getReports(filters = {}) {
      const orders = getStored(STORAGE_KEYS.ORDERS, defaultOrders);
      const branches = await this.getBranches();
      const currentUser = await this.getCurrentUser();

      let targetOrders = orders;
      if (currentUser && currentUser.role === 'branch' && currentUser.branchId) {
        targetOrders = targetOrders.filter(o => o.branchId === currentUser.branchId);
      } else if (filters.branchId && filters.branchId !== 'all') {
        targetOrders = targetOrders.filter(o => o.branchId === filters.branchId);
      }

      // Date filtering
      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        if (filters.dateRange === 'today') {
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          targetOrders = targetOrders.filter(o => new Date(o.createdAt).getTime() >= start);
        } else if (filters.dateRange === 'thisMonth') {
          const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          targetOrders = targetOrders.filter(o => new Date(o.createdAt).getTime() >= start);
        } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
          const start = new Date(filters.startDate).getTime();
          const end = new Date(filters.endDate).getTime() + (24 * 3600 * 1000 - 1);
          targetOrders = targetOrders.filter(o => {
            const t = new Date(o.createdAt).getTime();
            return t >= start && t <= end;
          });
        }
      }

      // Only Completed & Ready orders count - New & Cancelled are strictly excluded
      const confirmedOrders = targetOrders.filter(o => o.status === 'completed' || o.status === 'ready');
      const totalSales = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
      const ordersCount = confirmedOrders.length;
      const averageOrderValue = ordersCount > 0 ? (totalSales / ordersCount) : 0;

      // Group by branch
      const branchStats = {};
      branches.forEach(b => {
        branchStats[b.id] = {
          branchId: b.id,
          nameAr: b.nameAr,
          nameEn: b.nameEn,
          sales: 0,
          ordersCount: 0
        };
      });

      confirmedOrders.forEach(o => {
        if (branchStats[o.branchId]) {
          branchStats[o.branchId].sales += o.total;
          branchStats[o.branchId].ordersCount += 1;
        }
      });

      return {
        totalSales,
        ordersCount,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        branchBreakdown: Object.values(branchStats),
        calculationRule: "يتم احتساب الطلبات المكتملة والجاهزة فقط، ويتم استبعاد الطلبات الجديدة (New) والملغاة (Cancelled) تماماً من إجمالي المبيعات."
      };
    },

    // XLSX Import / Export utility methods
    async readXLSX(buffer) {
      return parseXlsxBuffer(buffer);
    },

    exportOrdersXLSX(orders) {
      const num = v => { const n = Number(v); return Number.isFinite(n) ? n : ''; };
      const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Type', 'Branch', 'Subtotal', 'Delivery Fee', 'Total', 'Status', 'Address', 'Notes'];
      const rows = [
        headers,
        ...orders.map(o => [
          String(o.id),
          new Date(o.createdAt).toLocaleString('ar-EG'),
          o.customerName || '',
          String(o.customerPhone ?? ''),
          o.type === 'delivery' ? 'توصيل منزلي' : 'استلام من الفرع',
          o.branchNameAr || '',
          num(o.subtotal),
          num(o.deliveryFee),
          num(o.total),
          o.status || '',
          o.address || '',
          o.notes || ''
        ])
      ];

      downloadXlsx(`taj_orders_${new Date().toISOString().slice(0, 10)}.xlsx`, 'الطلبات', rows);
    },

    exportProductsXLSX(products) {
      const num = v => { const n = Number(v); return Number.isFinite(n) ? n : ''; };
      const headers = ['ID', 'Category ID', 'Name Arabic', 'Name English', 'Regular Price', 'Discount Price', 'In Stock', 'Active', 'Description Arabic', 'Description English'];
      const rows = [
        headers,
        ...products.map(p => [
          String(p.id),
          p.categoryId || '',
          p.nameAr || '',
          p.nameEn || '',
          num(p.regularPrice),
          p.discountPrice === '' || p.discountPrice == null ? '' : num(p.discountPrice),
          p.inStock ? 1 : 0,
          p.active ? 1 : 0,
          p.descAr || '',
          p.descEn || ''
        ])
      ];

      downloadXlsx(`taj_products_${new Date().toISOString().slice(0, 10)}.xlsx`, 'المنتجات', rows);
    },

    downloadProductsXLSXTemplate() {
      const headers = ['Category ID', 'Name Arabic', 'Name English', 'Regular Price', 'Discount Price', 'In Stock (1 or 0)', 'Active (1 or 0)', 'Description Arabic', 'Description English'];
      const sampleRow = ['cat-kunafa', 'كنافة بالمانجو والكريمة', 'Kunafa with Mango & Cream', 240, 210, 1, 1, 'كنافة مقرمشة بطبقات المانجو الطازجة والكريمة الغنية', 'Crispy kunafa layered with fresh mango and whipped cream'];
      downloadXlsx('taj_products_template.xlsx', 'المنتجات', [headers, sampleRow]);
    }
  };

  if (!remoteMode) return localApi;

  const apiBase = window.TAJ_CONFIG.apiBaseUrl.replace(/\/$/, '');
  let eventPollTimer = null;
  let eventPollGeneration = 0;
  let eventVisibilityHandler = null;
  async function request(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      credentials: 'same-origin',
      headers: { ...(options.body ? { 'Content-Type':'application/json' } : {}), ...(options.headers || {}) },
      ...options
    });
    const result = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || `Server request failed (${response.status})`);
    return result;
  }
  function connectEvents(authenticated = false) {
    eventPollGeneration++;
    const generation = eventPollGeneration;
    if (eventPollTimer) { clearInterval(eventPollTimer); eventPollTimer = null; }
    if (eventVisibilityHandler) { document.removeEventListener('visibilitychange', eventVisibilityHandler); eventVisibilityHandler = null; }
    if (!authenticated) return;
    let cursor = null;
    let inFlight = false;
    const poll = async () => {
      if (inFlight || generation !== eventPollGeneration || document.visibilityState === 'hidden') return;
      inFlight = true;
      try {
        const suffix = cursor === null ? '' : `?since=${encodeURIComponent(cursor)}`;
        const result = await request(`/events${suffix}`);
        if (generation !== eventPollGeneration) return;
        cursor = result.since;
        (result.events || []).forEach(item => {
          window.dispatchEvent(new CustomEvent(item.type, { detail:item.payload }));
        });
      } catch { /* Retry on the next interval; temporary network errors stay out of the UI. */ }
      finally { inFlight = false; }
    };
    poll();
    eventPollTimer = setInterval(poll, 10000);
    // Catch up immediately when the dashboard tab becomes visible again
    // instead of waiting out the rest of the 10-second interval.
    eventVisibilityHandler = () => { if (document.visibilityState === 'visible') poll(); };
    document.addEventListener('visibilitychange', eventVisibilityHandler);
  }
  const query = values => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key,value]) => { if (value !== undefined && value !== null && value !== '') params.set(key, String(value)); });
    const encoded = params.toString(); return encoded ? `?${encoded}` : '';
  };
  const remoteMethods = {
    async getCurrentUser() { const result = await request('/auth/me'); connectEvents(Boolean(result.user)); return result.user; },
    async login(username, password) { const result = await request('/auth/login', { method:'POST', body:JSON.stringify({username,password}) }); connectEvents(true); return result.user; },
    async logout() { connectEvents(false); const result = await request('/auth/logout', { method:'POST', body:'{}' }); return result; },
    async getUsers() { return request('/users'); },
    async createUser(data) { return request('/users', {method:'POST',body:JSON.stringify(data)}); },
    async setUserActive(id, active) { return request(`/users/${encodeURIComponent(id)}/status`, {method:'PATCH',body:JSON.stringify({active})}); },
    async setCurrentUser() { throw new Error('Account switching is disabled for secure server accounts. Sign out and sign in with another account.'); },
    async getCategories(onlyActive = false) { return request(`/categories${query({active:onlyActive ? 1 : undefined})}`); },
    async createCategory(data) { return request('/categories', {method:'POST',body:JSON.stringify(data)}); },
    async updateCategory(id, data) { return request(`/categories/${encodeURIComponent(id)}`, {method:'PUT',body:JSON.stringify(data)}); },
    async deleteCategory(id) { return request(`/categories/${encodeURIComponent(id)}`, {method:'DELETE'}); },
    async getProducts(filter = {}) { return request(`/products${query({active:filter.onlyActive ? 1 : undefined, categoryId:filter.categoryId, search:filter.search})}`); },
    async getProductById(id) { return request(`/products/${encodeURIComponent(id)}`); },
    async createProduct(data) { return request('/products', {method:'POST',body:JSON.stringify(data)}); },
    async updateProduct(id, data) { return request(`/products/${encodeURIComponent(id)}`, {method:'PUT',body:JSON.stringify(data)}); },
    async deleteProduct(id) { return request(`/products/${encodeURIComponent(id)}`, {method:'DELETE'}); },
    async bulkDeleteProducts(ids) { for (const id of ids) await request(`/products/${encodeURIComponent(id)}`, {method:'DELETE'}); return true; },
    async getBranches(onlyActive = false) { return request(`/branches${query({active:onlyActive ? 1 : undefined})}`); },
    async getBranchById(id) { return request(`/branches/${encodeURIComponent(id)}`); },
    async createBranch(data) { return request('/branches', {method:'POST',body:JSON.stringify(data)}); },
    async updateBranch(id, data) { return request(`/branches/${encodeURIComponent(id)}`, {method:'PUT',body:JSON.stringify(data)}); },
    async getSettings() { return request('/settings'); },
    async updateSettings(data) { return request('/settings', {method:'PUT',body:JSON.stringify(data)}); },
    async getOrders(filters = {}, page = 1, limit = 20) { return request(`/orders${query({page,limit,branchId:filters.branchId,status:filters.status,search:filters.search,dateRange:filters.dateRange,startDate:filters.startDate,endDate:filters.endDate})}`); },
    async getOrderById(id) { return request(`/orders/${encodeURIComponent(id)}`); },
    async createOrder(data) {
      const order = await request('/orders', {method:'POST',body:JSON.stringify(data)});
      // Same-browser instant delivery: notify admin tabs right away while the
      // server event still travels to other devices through the /events poll.
      notifyChange('taj_new_order', { order });
      return order;
    },
    async updateOrderStatus(id, status) {
      const order = await request(`/orders/${encodeURIComponent(id)}/status`, {method:'PATCH',body:JSON.stringify({status})});
      notifyChange('taj_order_status_changed', { order, newStatus: status });
      return order;
    },
    async getCustomers(search = '') { return request(`/customers${query({search})}`); },
    async getReports(filters = {}) { return request(`/reports${query({branchId:filters.branchId,dateRange:filters.dateRange,startDate:filters.startDate,endDate:filters.endDate})}`); }
  };
  connectEvents();
  return new Proxy(localApi, { get(target, key) { return Object.prototype.hasOwnProperty.call(remoteMethods, key) ? remoteMethods[key] : target[key]; } });
})();

window.TajAPI = TajAPI;
