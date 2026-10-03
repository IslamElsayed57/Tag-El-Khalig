import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream, existsSync, mkdirSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = resolve(process.env.TAJ_DATA_DIR || join(ROOT, 'data'));
const DB_FILE = resolve(process.env.TAJ_DB_FILE || join(DATA_DIR, 'taj.sqlite'));
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '127.0.0.1';
const SECURE_COOKIE = process.env.NODE_ENV === 'production';
mkdirSync(dirname(DB_FILE), { recursive: true });

const db = new DatabaseSync(DB_FILE);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, active INTEGER NOT NULL, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, category_id TEXT NOT NULL, active INTEGER NOT NULL, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS branches (id TEXT PRIMARY KEY, active INTEGER NOT NULL, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL,
    branch_id TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL, data TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
  CREATE INDEX IF NOT EXISTS idx_orders_branch_date ON orders(branch_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    name_ar TEXT NOT NULL, name_en TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','branch')),
    branch_id TEXT, active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
`);
if (!db.prepare('PRAGMA table_info(categories)').all().some(column => column.name === 'active')) {
  db.exec('ALTER TABLE categories ADD COLUMN active INTEGER NOT NULL DEFAULT 1');
}

const encode = value => JSON.stringify(value);
const decode = value => JSON.parse(value);
const seed = (table, rows) => {
  const count = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
  if (count) return;
  const insert = {
    categories: db.prepare('INSERT INTO categories(id,active,data) VALUES(?,?,?)'),
    products: db.prepare('INSERT INTO products(id,category_id,active,data) VALUES(?,?,?,?)'),
    branches: db.prepare('INSERT INTO branches(id,active,data) VALUES(?,?,?)')
  }[table];
  for (const item of rows) {
    if (table === 'categories') insert.run(item.id, item.active === false ? 0 : 1, encode(item));
    if (table === 'products') insert.run(item.id, item.categoryId, item.active === false ? 0 : 1, encode(item));
    if (table === 'branches') insert.run(item.id, item.active === false ? 0 : 1, encode(item));
  }
};

const defaultCategories = [
  { id:'cat-oriental', nameAr:'حلويات شرقية فاخرة', nameEn:'Luxury Oriental Sweets', active:true, order:1 },
  { id:'cat-kunafa', nameAr:'كنافة وطواجن قشطة', nameEn:'Kunafa & Ashta Casseroles', active:true, order:2 },
  { id:'cat-basbousa', nameAr:'بسبوسة وهريسة بلدي', nameEn:'Egyptian Basbousa & Hareesa', active:true, order:3 },
  { id:'cat-western', nameAr:'تورت وجاتوه فرنسي', nameEn:'Cakes & French Gateaux', active:true, order:4 },
  { id:'cat-kahk', nameAr:'كحك وبسكويت العيد ومكسرات', nameEn:'Kahk, Eid Cookies & Nuts', active:true, order:5 }
];
const defaultProducts = [
  { id:'prod-1', categoryId:'cat-kunafa', nameAr:'كنافة نابلسية بالقشطة والفستق', nameEn:'Kunafa Nabulsi with Cream & Pistachio', descAr:'كنافة ذهبية مقرمشة محشوة بقشطة طازجة غنية ومسقية بشربات خفيف.', descEn:'Golden crispy kunafa filled with fresh cream and pistachio.', regularPrice:220, discountPrice:195, image:'assets/images/kunafa_plate.jpg', inStock:true, active:true, featured:true },
  { id:'prod-2', categoryId:'cat-basbousa', nameAr:'صينية بسبوسة ملكي باللوز البلدي', nameEn:'Royal Basbousa with Whole Almonds', descAr:'بسبوسة مصرية بالسمن البلدي ومحلاة بعسل نقي.', descEn:'Authentic Egyptian basbousa baked with baladi ghee.', regularPrice:180, discountPrice:160, image:'assets/images/basbousa_plate.jpg', inStock:true, active:true, featured:true },
  { id:'prod-3', categoryId:'cat-western', nameAr:'تورتة شوكولاتة فدج رويال', nameEn:'Royal Chocolate Fudge Cake', descAr:'طبقات كيك شوكولاتة غنية بحشوة الفدج.', descEn:'Rich chocolate cake layered with fudge ganache.', regularPrice:380, discountPrice:340, image:'assets/images/gateau_cake.jpg', inStock:true, active:true, featured:true }
];
const defaultBranches = [
  { id:'branch-tagamoa', nameAr:'فرع التجمع الخامس', nameEn:'Fifth Settlement Branch', addressAr:'شارع التسعين الجنوبي، القاهرة الجديدة', addressEn:'South 90th St, New Cairo', phone:'01023456781', managerAr:'أحمد الشناوي', managerEn:'Ahmed El Shennawy', mapUrl:'https://maps.google.com/?q=30.0194,31.4395', coordinates:{lat:30.0194,lng:31.4395}, deliveryEligible:true, active:true },
  { id:'branch-nasr', nameAr:'فرع مدينة نصر', nameEn:'Nasr City Branch', addressAr:'شارع عباس العقاد، مدينة نصر', addressEn:'Abbas El Akkad St, Nasr City', phone:'01023456782', managerAr:'محمود عبد الرحمن', managerEn:'Mahmoud Abdel Rahman', mapUrl:'https://maps.google.com/?q=30.0617,31.3368', coordinates:{lat:30.0617,lng:31.3368}, deliveryEligible:true, active:true }
];
const defaultSettings = { shopNameAr:'حلواني تاج الخليج', shopNameEn:'Taj El Khalig Sweets', taglineAr:'أحلى طعم لأصالة الحلويات الشرقية والغربية', taglineEn:'The sweetest taste of authentic pastries', contactPhone:'19876', whatsappNumber:'01099887766', contactEmail:'info@tajelkhalig.com', facebookUrl:'https://facebook.com/tajelkhaligsweets', instagramUrl:'https://instagram.com/tajelkhaligsweets', tiktokUrl:'https://tiktok.com/@tajelkhaligsweets', deliveryFee:25, freeDeliveryThreshold:250, currencyAr:'ج.م', currencyEn:'EGP' };
seed('categories', defaultCategories);
seed('products', defaultProducts);
seed('branches', defaultBranches);
if (!db.prepare('SELECT id FROM settings WHERE id=1').get()) db.prepare('INSERT INTO settings(id,data) VALUES(1,?)').run(encode(defaultSettings));

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split(':');
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}
const initialUsername = process.env.TAJ_ADMIN_USER;
const initialPassword = process.env.TAJ_ADMIN_PASSWORD;
const hasUsers = Boolean(db.prepare('SELECT id FROM users LIMIT 1').get());
if (!hasUsers && process.env.NODE_ENV === 'production' && (!initialUsername || !initialPassword)) {
  console.error('Set TAJ_ADMIN_USER and TAJ_ADMIN_PASSWORD before starting the production server for the first time.');
  process.exit(1);
}
if (!hasUsers && initialPassword && initialPassword.length < 16) {
  console.error('TAJ_ADMIN_PASSWORD must contain at least 16 characters when bootstrapping the first admin.');
  process.exit(1);
}
if (initialUsername && initialPassword && !db.prepare('SELECT id FROM users LIMIT 1').get()) {
  db.prepare('INSERT INTO users(id,username,password_hash,name_ar,name_en,role,active) VALUES(?,?,?,?,?,?,1)')
    .run('user-admin', initialUsername, hashPassword(initialPassword), 'مدير النظام', 'Shop Administrator', 'admin');
}

const clients = new Set();
const loginFailures = new Map();
function publish(type, payload) {
  const message = `event: ${type}\ndata: ${encode(payload)}\n\n`;
  const publicEvents = new Set(['taj_products_updated','taj_categories_updated','taj_branches_updated','taj_settings_updated']);
  for (const client of clients) {
    if (client.response.destroyed) { clients.delete(client); continue; }
    if (publicEvents.has(type) || (client.user && (client.user.role === 'admin' || (payload.branchId && payload.branchId === client.user.branchId)))) client.response.write(message);
  }
}
function json(res, status, data) {
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
  res.end(encode(data));
}
async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 2_000_000) throw Object.assign(new Error('Request body too large'), { status:413 });
  }
  return raw ? JSON.parse(raw) : {};
}
function cookie(req, key) {
  const part = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${key}=`));
  return part ? decodeURIComponent(part.slice(key.length + 1)) : null;
}
function publicUser(row) {
  return row && { id:row.id, username:row.username, nameAr:row.name_ar, nameEn:row.name_en, role:row.role, branchId:row.branch_id, active:Boolean(row.active) };
}
function auth(req, { admin = false } = {}) {
  const token = cookie(req, 'taj_session');
  if (!token) return null;
  const key = createHash('sha256').update(token).digest('hex');
  const row = db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1`).get(key, Date.now());
  if (!row || (admin && row.role !== 'admin')) return null;
  return publicUser(row);
}
function requireAuth(req, res, opts) {
  const user = auth(req, opts);
  if (!user) { json(res, 401, { error:'Authentication required' }); return null; }
  return user;
}
function parseList(table, activeOnly = false) {
  const rows = db.prepare(`SELECT data FROM ${table}${activeOnly ? ' WHERE active=1' : ''}`).all();
  return rows.map(row => decode(row.data));
}
function saveEntity(table, id, data) {
  const active = data.active === false ? 0 : 1;
  if (table === 'categories') db.prepare('INSERT INTO categories(id,active,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET active=excluded.active,data=excluded.data').run(id, active, encode(data));
  if (table === 'products') db.prepare('INSERT INTO products(id,category_id,active,data) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET category_id=excluded.category_id,active=excluded.active,data=excluded.data').run(id, data.categoryId, active, encode(data));
  if (table === 'branches') db.prepare('INSERT INTO branches(id,active,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET active=excluded.active,data=excluded.data').run(id, active, encode(data));
  return data;
}
function eventForTable(table) { return ({ categories:'taj_categories_updated', products:'taj_products_updated', branches:'taj_branches_updated', settings:'taj_settings_updated' })[table]; }

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = decodeURIComponent(url.pathname);
  const method = req.method || 'GET';
  if (method === 'OPTIONS') { res.writeHead(204, { 'Allow':'GET, POST, PUT, PATCH, DELETE, OPTIONS' }); res.end(); return; }
  if (['POST','PUT','PATCH','DELETE'].includes(method) && req.headers.origin && req.headers.host) {
    try { if (new URL(req.headers.origin).host !== req.headers.host) return json(res, 403, { error:'Cross-origin request rejected' }); }
    catch { return json(res, 403, { error:'Invalid request origin' }); }
  }

  if (path === '/api/health' && method === 'GET') return json(res, 200, { ok:true, storage:'sqlite', realtime:'sse' });
  if (path === '/api/auth/login' && method === 'POST') {
    const input = await body(req);
    const ip = req.socket.remoteAddress || 'unknown';
    const failures = loginFailures.get(ip) || { count:0, until:0 };
    if (failures.until > Date.now()) return json(res, 429, { error:'Too many sign-in attempts. Try again later.' });
    const row = db.prepare('SELECT * FROM users WHERE username=? AND active=1').get(String(input.username || ''));
    if (!row || !verifyPassword(String(input.password || ''), row.password_hash)) {
      failures.count++;
      if (failures.count >= 8) { failures.count=0; failures.until=Date.now()+15*60*1000; }
      loginFailures.set(ip, failures);
      return json(res, 401, { error:'Invalid username or password' });
    }
    loginFailures.delete(ip);
    const token = randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(createHash('sha256').update(token).digest('hex'), row.id, Date.now() + 7 * 86400000);
    res.setHeader('Set-Cookie', `taj_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${SECURE_COOKIE ? '; Secure' : ''}`);
    return json(res, 200, { user:publicUser(row) });
  }
  if (path === '/api/auth/logout' && method === 'POST') {
    const token = cookie(req, 'taj_session');
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(createHash('sha256').update(token).digest('hex'));
    res.setHeader('Set-Cookie', 'taj_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    return json(res, 200, { ok:true });
  }
  if (path === '/api/auth/me' && method === 'GET') {
    const user = auth(req);
    return user ? json(res, 200, { user }) : json(res, 200, { user:null });
  }

  if (path === '/api/events' && method === 'GET') {
    const user = auth(req);
    res.writeHead(200, { 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache', 'Connection':'keep-alive', 'X-Accel-Buffering':'no' });
    res.write('retry: 3000\n\n');
    const client = { response:res, user }; clients.add(client);
    const ping = setInterval(() => { if (!res.destroyed) res.write(': ping\n\n'); }, 20000);
    res.on('close', () => { clearInterval(ping); clients.delete(client); });
    return;
  }

  if (path === '/api/categories' && method === 'GET') return json(res, 200, parseList('categories', url.searchParams.get('active') === '1'));
  if (path === '/api/products' && method === 'GET') {
    let rows = parseList('products', url.searchParams.get('active') === '1');
    const categoryId = url.searchParams.get('categoryId'); const search = (url.searchParams.get('search') || '').toLowerCase();
    if (categoryId && categoryId !== 'all') rows = rows.filter(p => p.categoryId === categoryId);
    if (search) rows = rows.filter(p => [p.nameAr,p.nameEn,p.descAr,p.descEn].some(x => (x || '').toLowerCase().includes(search)));
    if (url.searchParams.get('active') === '1') { const activeIds = new Set(parseList('categories', true).map(c => c.id)); rows = rows.filter(p => activeIds.has(p.categoryId)); }
    return json(res, 200, rows);
  }
  if (path === '/api/branches' && method === 'GET') return json(res, 200, parseList('branches', url.searchParams.get('active') === '1'));
  if (path === '/api/settings' && method === 'GET') return json(res, 200, decode(db.prepare('SELECT data FROM settings WHERE id=1').get().data));

  if (path === '/api/orders' && method === 'POST') {
    const input = await body(req);
    const phone = String(input.customerPhone || '').replace(/\D/g, '');
    if (!/^01\d{9}$/.test(phone) || !String(input.customerName || '').trim() || !Array.isArray(input.items) || !input.items.length) return json(res, 400, { error:'Valid name, Egyptian mobile, and order items are required' });
    const settings = decode(db.prepare('SELECT data FROM settings WHERE id=1').get().data);
    const products = new Map(parseList('products', true).map(p => [p.id, p]));
    const items = [];
    for (const item of input.items) {
      const product = products.get(String(item.productId || item.id));
      const quantity = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
      if (!product || product.inStock === false) return json(res, 400, { error:'An item is no longer available' });
      const price = Number(product.discountPrice || product.regularPrice);
      items.push({ productId:product.id, nameAr:product.nameAr, nameEn:product.nameEn, image:product.image, price, quantity });
    }
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const type = input.type === 'pickup' ? 'pickup' : 'delivery';
    const deliveryFee = type === 'delivery' && subtotal < Number(settings.freeDeliveryThreshold || 0) ? Number(settings.deliveryFee || 0) : 0;
    const branch = db.prepare('SELECT data FROM branches WHERE id=? AND active=1').get(String(input.branchId || ''));
    if (!branch) return json(res, 400, { error:'Please choose an active branch' });
    const branchData = decode(branch.data);
    if (type === 'delivery' && !branchData.deliveryEligible) return json(res, 400, { error:'Selected branch does not provide delivery' });
    if (type === 'delivery' && !String(input.address || '').trim()) return json(res, 400, { error:'A delivery address is required' });
    const createdAt = new Date().toISOString();
    const orderData = { createdAt, customerName:String(input.customerName).trim(), customerPhone:phone, type, branchId:branchData.id, branchNameAr:branchData.nameAr, branchNameEn:branchData.nameEn, deliveryFee, subtotal, total:subtotal+deliveryFee, status:'new', items, address:input.address || null, gpsCoordinates:input.gpsCoordinates || null, notes:String(input.notes || '').trim() };
    const result = db.prepare('INSERT INTO orders(customer_name,customer_phone,branch_id,status,created_at,data) VALUES(?,?,?,?,?,?)').run(orderData.customerName, phone, branchData.id, 'new', createdAt, encode(orderData));
    orderData.id = String(result.lastInsertRowid);
    db.prepare('UPDATE orders SET data=? WHERE id=?').run(encode(orderData), result.lastInsertRowid);
    publish('taj_new_order', { order:orderData, branchId:branchData.id });
    return json(res, 201, orderData);
  }

  const guestEntity = path.match(/^\/api\/(categories|products|branches)\/([^/]+)$/);
  if (guestEntity && method === 'GET') {
    const row = db.prepare(`SELECT data FROM ${guestEntity[1]} WHERE id=?`).get(guestEntity[2]);
    return row ? json(res, 200, decode(row.data)) : json(res, 404, { error:'Not found' });
  }
  const user = requireAuth(req, res); if (!user) return;
  const isAdmin = user.role === 'admin';
  const requireAdmin = () => { if (!isAdmin) json(res, 403, { error:'Administrator permission required' }); return isAdmin; };

  if (path === '/api/users' && method === 'GET') {
    if (!requireAdmin()) return;
    const rows = db.prepare('SELECT * FROM users ORDER BY username').all().map(publicUser);
    return json(res, 200, rows);
  }
  if (path === '/api/users' && method === 'POST') {
    if (!requireAdmin()) return;
    const input = await body(req);
    if (!input.username || String(input.password || '').length < 12 || !['admin','branch'].includes(input.role)) return json(res, 400, { error:'Username, role, and a password of at least 12 characters are required' });
    if (input.role === 'branch' && !db.prepare('SELECT id FROM branches WHERE id=? AND active=1').get(input.branchId)) return json(res, 400, { error:'Choose an active branch for this account' });
    const id = `user-${randomBytes(10).toString('hex')}`;
    try {
      db.prepare('INSERT INTO users(id,username,password_hash,name_ar,name_en,role,branch_id,active) VALUES(?,?,?,?,?,?,?,1)').run(id, String(input.username).trim(), hashPassword(input.password), String(input.nameAr||'').trim(), String(input.nameEn||'').trim(), input.role, input.role === 'branch' ? input.branchId : null);
      return json(res, 201, publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(id)));
    } catch { return json(res, 409, { error:'Username already exists' }); }
  }
  const userStatusMatch = path.match(/^\/api\/users\/([^/]+)\/status$/);
  if (userStatusMatch && method === 'PATCH') {
    if (!requireAdmin()) return;
    const input = await body(req); const id = userStatusMatch[1];
    if (id === user.id && input.active === false) return json(res, 400, { error:'You cannot deactivate the account you are currently using' });
    db.prepare('UPDATE users SET active=? WHERE id=?').run(input.active ? 1 : 0, id);
    if (!input.active) {
      db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
      for (const client of clients) {
        if (client.user.id === id) { client.response.end(); clients.delete(client); }
      }
    }
    const updated = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    return updated ? json(res, 200, publicUser(updated)) : json(res, 404, { error:'User not found' });
  }

  const entityMatch = path.match(/^\/api\/(categories|products|branches)(?:\/([^/]+))?$/);
  if (entityMatch) {
    const [, table, id] = entityMatch;
    if (method === 'GET' && id) {
      const row = db.prepare(`SELECT data FROM ${table} WHERE id=?`).get(id);
      return row ? json(res, 200, decode(row.data)) : json(res, 404, { error:'Not found' });
    }
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      if (!requireAdmin()) return;
      if (method === 'DELETE') {
        if (table === 'categories' && db.prepare('SELECT id FROM products WHERE category_id=? AND active=1 LIMIT 1').get(id)) return json(res, 409, { error:'Deactivate or reassign active products first' });
        db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id);
        publish(eventForTable(table), { deletedId:id });
        return json(res, 200, { ok:true });
      }
      const input = await body(req);
      let data = input;
      if (method !== 'POST') {
        const old = db.prepare(`SELECT data FROM ${table} WHERE id=?`).get(id);
        if (!old) return json(res, 404, { error:'Not found' });
        data = { ...decode(old.data), ...input, id };
      } else {
        data = { ...input, id:input.id || `${table.slice(0,-1)}-${randomBytes(8).toString('hex')}` };
      }
      if (table === 'products' && !db.prepare('SELECT id FROM categories WHERE id=?').get(data.categoryId)) return json(res, 400, { error:'Product category does not exist' });
      saveEntity(table, data.id, data);
      publish(eventForTable(table), table === 'settings' ? { settings:data } : { [table.slice(0,-1)]:data });
      return json(res, method === 'POST' ? 201 : 200, data);
    }
  }
  if (path === '/api/settings' && method === 'PUT') {
    if (!requireAdmin()) return;
    const input = await body(req);
    const old = decode(db.prepare('SELECT data FROM settings WHERE id=1').get().data);
    const settings = { ...old, ...input };
    db.prepare('UPDATE settings SET data=? WHERE id=1').run(encode(settings));
    publish('taj_settings_updated', { settings });
    return json(res, 200, settings);
  }

  if (path === '/api/orders' && method === 'GET') {
    const page = Math.max(1, Number(url.searchParams.get('page') || 1)); const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get('limit') || 20)));
    const clauses = []; const values = [];
    if (!isAdmin) { clauses.push('branch_id=?'); values.push(user.branchId || ''); }
    else if (url.searchParams.get('branchId') && url.searchParams.get('branchId') !== 'all') { clauses.push('branch_id=?'); values.push(url.searchParams.get('branchId')); }
    const status = url.searchParams.get('status'); if (status && status !== 'all') { clauses.push('status=?'); values.push(status); }
    const q = url.searchParams.get('search'); if (q) { clauses.push('(customer_name LIKE ? OR customer_phone LIKE ? OR CAST(id AS TEXT) LIKE ?)'); values.push(`%${q}%`,`%${q}%`,`%${q}%`); }
    const range = url.searchParams.get('dateRange'); const now = new Date();
    const day = now.toISOString().slice(0,10);
    if (range === 'today') { clauses.push('created_at>=?'); values.push(`${day}T00:00:00.000Z`); }
    if (range === 'yesterday') { const yesterday=new Date(now); yesterday.setUTCDate(yesterday.getUTCDate()-1); clauses.push('created_at>=? AND created_at<?'); values.push(`${yesterday.toISOString().slice(0,10)}T00:00:00.000Z`,`${day}T00:00:00.000Z`); }
    if (range === 'last7') { clauses.push('created_at>=?'); values.push(new Date(Date.now()-7*86400000).toISOString()); }
    if (range === 'thisMonth') { clauses.push('created_at>=?'); values.push(`${day.slice(0,7)}-01T00:00:00.000Z`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const count = db.prepare(`SELECT COUNT(*) AS n FROM orders ${where}`).get(...values).n;
    const rows = db.prepare(`SELECT data FROM orders ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...values, limit, (page-1)*limit).map(row=>decode(row.data));
    return json(res, 200, { orders:rows, totalCount:count, totalPages:Math.ceil(count/limit)||1, currentPage:page, limit });
  }
  const orderMatch = path.match(/^\/api\/orders\/([^/]+)(?:\/status)?$/);
  if (orderMatch && method === 'GET') {
    const id = Number(orderMatch[1]); const row = db.prepare('SELECT * FROM orders WHERE id=?').get(id);
    if (!row || (!isAdmin && row.branch_id !== user.branchId)) return json(res, 404, { error:'Order not found' });
    return json(res, 200, decode(row.data));
  }
  const statusMatch = path.match(/^\/api\/orders\/([^/]+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    const input = await body(req); const id = Number(statusMatch[1]);
    const row = db.prepare('SELECT * FROM orders WHERE id=?').get(id);
    if (!row || (!isAdmin && row.branch_id !== user.branchId)) return json(res, 404, { error:'Order not found' });
    if (!['new','ready','completed','cancelled'].includes(input.status)) return json(res, 400, { error:'Invalid order status' });
    const order = { ...decode(row.data), status:input.status, updatedAt:new Date().toISOString() };
    db.prepare('UPDATE orders SET status=?,data=? WHERE id=?').run(input.status, encode(order), id);
    publish('taj_order_status_changed', { order, branchId:row.branch_id, newStatus:input.status });
    return json(res, 200, order);
  }

  if (path === '/api/customers' && method === 'GET') {
    const rows = db.prepare(`SELECT data FROM orders ${isAdmin ? '' : 'WHERE branch_id=?'} ORDER BY id DESC`).all(...(isAdmin ? [] : [user.branchId || ''])).map(r=>decode(r.data));
    const q = (url.searchParams.get('search') || '').toLowerCase(); const map = new Map();
    for (const order of rows) {
      if (!map.has(order.customerPhone)) map.set(order.customerPhone, { phone:order.customerPhone, name:order.customerName, ordersCount:0, totalSpend:0, lastOrderDate:order.createdAt, orders:[] });
      const customer = map.get(order.customerPhone); customer.ordersCount++; if (order.status !== 'cancelled') customer.totalSpend += order.total; customer.orders.push(order);
      if (new Date(order.createdAt) > new Date(customer.lastOrderDate)) { customer.name=order.customerName; customer.lastOrderDate=order.createdAt; }
    }
    return json(res, 200, [...map.values()].filter(c=>!q || c.name.toLowerCase().includes(q) || c.phone.includes(q)));
  }
  if (path === '/api/reports' && method === 'GET') {
    const conditions = ["status IN ('completed','ready')"]; const values=[];
    if (!isAdmin) { conditions.push('branch_id=?'); values.push(user.branchId||''); }
    else if (url.searchParams.get('branchId') && url.searchParams.get('branchId') !== 'all') { conditions.push('branch_id=?'); values.push(url.searchParams.get('branchId')); }
    const start=url.searchParams.get('startDate'); const end=url.searchParams.get('endDate');
    const range=url.searchParams.get('dateRange'); const today=new Date().toISOString().slice(0,10);
    if (range==='today') { conditions.push('created_at>=?'); values.push(`${today}T00:00:00.000Z`); }
    else if (range==='thisMonth') { conditions.push('created_at>=?'); values.push(`${today.slice(0,7)}-01T00:00:00.000Z`); }
    else if (range==='custom' && start) { conditions.push('created_at>=?'); values.push(new Date(start).toISOString()); }
    if (range==='custom' && end) { conditions.push('created_at<=?'); values.push(new Date(`${end}T23:59:59.999`).toISOString()); }
    const orders=db.prepare(`SELECT data FROM orders WHERE ${conditions.join(' AND ')}`).all(...values).map(r=>decode(r.data));
    const branches=parseList('branches'); const branchFilter=(!isAdmin?String(user.branchId||''):(url.searchParams.get('branchId')&&url.searchParams.get('branchId')!=='all'?url.searchParams.get('branchId'):null)); const breakdown=branches.filter(b=>branchFilter===null||b.id===branchFilter).map(b=>({branchId:b.id,nameAr:b.nameAr,nameEn:b.nameEn,sales:0,ordersCount:0}));
    for(const order of orders){const stat=breakdown.find(x=>x.branchId===order.branchId);if(stat){stat.sales+=order.total;stat.ordersCount++;}}
    const totalSales=orders.reduce((sum,o)=>sum+o.total,0); const ordersCount=orders.length;
    return json(res,200,{totalSales,ordersCount,averageOrderValue:ordersCount?Math.round(totalSales/ordersCount*100)/100:0,branchBreakdown:breakdown,calculationRule:'Only Completed and Ready orders are counted. New and Cancelled orders are excluded from sales totals.'});
  }

  return json(res, 404, { error:'API route not found' });
}

const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon' };
const server = createServer(async (req, res) => {
  try {
    if ((req.url || '').startsWith('/api/')) return await handle(req, res);
    const pathname = decodeURIComponent(new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname);
    const relative = normalize(pathname).replace(/^([/\\]|\.\.(?:[/\\]|$))+/, '');
    const file = resolve(ROOT, relative || 'index.html');
    if (!file.startsWith(ROOT)) return json(res, 403, { error:'Forbidden' });
    const info = await stat(file).catch(() => null);
    const target = info?.isDirectory() ? join(file, 'index.html') : file;
    if (!existsSync(target)) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type':mime[extname(target)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff' });
    createReadStream(target).pipe(res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) json(res, error.status || 500, { error:error.status ? error.message : 'Internal server error' });
    else res.end();
  }
});
server.listen(PORT, HOST, () => {
  console.log(`Taj El Khalig server listening at http://${HOST}:${PORT}`);
  if (!db.prepare('SELECT id FROM users LIMIT 1').get()) console.warn('No admin account exists. Set TAJ_ADMIN_USER and TAJ_ADMIN_PASSWORD, then restart the server.');
});
