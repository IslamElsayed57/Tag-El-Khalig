const json = (data, status = 200, headers = {}) => Response.json(data, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }
});
const encode = value => JSON.stringify(value);
const decode = value => JSON.parse(value);
const nowIso = () => new Date().toISOString();
const PUBLIC_EVENTS = new Set(['taj_products_updated', 'taj_categories_updated', 'taj_branches_updated', 'taj_settings_updated']);

const DEFAULT_CATEGORIES = [
  { id:'cat-oriental', nameAr:'حلويات شرقية فاخرة', nameEn:'Luxury Oriental Sweets', active:true, order:1 },
  { id:'cat-kunafa', nameAr:'كنافة وطواجن قشطة', nameEn:'Kunafa & Ashta Casseroles', active:true, order:2 },
  { id:'cat-basbousa', nameAr:'بسبوسة وهريسة بلدي', nameEn:'Egyptian Basbousa & Hareesa', active:true, order:3 },
  { id:'cat-western', nameAr:'تورت وجاتوه فرنسي', nameEn:'Cakes & French Gateaux', active:true, order:4 },
  { id:'cat-kahk', nameAr:'كحك وبسكويت العيد ومكسرات', nameEn:'Kahk, Eid Cookies & Nuts', active:true, order:5 }
];
const DEFAULT_PRODUCTS = [
  { id:'prod-1', categoryId:'cat-kunafa', nameAr:'كنافة نابلسية بالقشطة والفستق', nameEn:'Kunafa Nabulsi with Cream & Pistachio', descAr:'كنافة ذهبية مقرمشة محشوة بقشطة طازجة غنية ومسقية بشربات خفيف.', descEn:'Golden crispy kunafa filled with fresh cream and pistachio.', regularPrice:220, discountPrice:195, image:'assets/images/kunafa_plate.jpg', inStock:true, active:true, featured:true },
  { id:'prod-2', categoryId:'cat-basbousa', nameAr:'صينية بسبوسة ملكي باللوز البلدي', nameEn:'Royal Basbousa with Whole Almonds', descAr:'بسبوسة مصرية بالسمن البلدي ومحلاة بعسل نقي.', descEn:'Authentic Egyptian basbousa baked with baladi ghee.', regularPrice:180, discountPrice:160, image:'assets/images/basbousa_plate.jpg', inStock:true, active:true, featured:true },
  { id:'prod-3', categoryId:'cat-western', nameAr:'تورتة شوكولاتة فدج رويال', nameEn:'Royal Chocolate Fudge Cake', descAr:'طبقات كيك شوكولاتة غنية بحشوة الفدج.', descEn:'Rich chocolate cake layered with fudge ganache.', regularPrice:380, discountPrice:340, image:'assets/images/gateau_cake.jpg', inStock:true, active:true, featured:true },
  { id:'prod-4', categoryId:'cat-oriental', nameAr:'مشكل شرقي ملكي تاج الخليج', nameEn:'Taj El Khalig Royal Oriental Assortment', descAr:'علبة مشكلة تضم تشكيلة متميزة من أصناف الحلويات الشرقية.', descEn:'A luxury assortment of traditional oriental sweets.', regularPrice:290, discountPrice:null, image:'assets/images/hero_sweets.jpg', inStock:true, active:true, featured:true },
  { id:'prod-5', categoryId:'cat-kunafa', nameAr:'طاجن كنافة لوتس ونوتيلا', nameEn:'Lotus & Nutella Kunafa Casserole', descAr:'كنافة مقرمشة مع صوص اللوتس والشوكولاتة.', descEn:'Crunchy kunafa with Lotus spread and chocolate.', regularPrice:150, discountPrice:135, image:'assets/images/kunafa_plate.jpg', inStock:true, active:true },
  { id:'prod-6', categoryId:'cat-western', nameAr:'دستة جاتوه ميكس سوبر لوكس (12 قطعة)', nameEn:'Super Lux Mixed Gateaux (12 Pcs)', descAr:'تشكيلة راقية من قطع الجاتوه المتنوعة.', descEn:'An exquisite collection of assorted gourmet gateaux.', regularPrice:320, discountPrice:290, image:'assets/images/gateau_cake.jpg', inStock:true, active:true },
  { id:'prod-7', categoryId:'cat-basbousa', nameAr:'هريسة إسكندراني بالقشطة والمكسرات', nameEn:'Alexandrian Hareesa with Cream & Nuts', descAr:'هريسة إسكندراني بالسمن البلدي والقشطة.', descEn:'Traditional Alexandrian hareesa with cream and nuts.', regularPrice:175, discountPrice:null, image:'assets/images/basbousa_plate.jpg', inStock:true, active:true }
];
const DEFAULT_BRANCHES = [
  { id:'branch-tagamoa', nameAr:'فرع التجمع الخامس', nameEn:'Fifth Settlement Branch', addressAr:'شارع التسعين الجنوبي، القاهرة الجديدة', addressEn:'South 90th St, New Cairo', phone:'01023456781', managerAr:'أحمد الشناوي', managerEn:'Ahmed El Shennawy', mapUrl:'https://maps.google.com/?q=30.0194,31.4395', coordinates:{lat:30.0194,lng:31.4395}, deliveryEligible:true, active:true },
  { id:'branch-nasr', nameAr:'فرع مدينة نصر', nameEn:'Nasr City Branch', addressAr:'شارع عباس العقاد، مدينة نصر', addressEn:'Abbas El Akkad St, Nasr City', phone:'01023456782', managerAr:'محمود عبد الرحمن', managerEn:'Mahmoud Abdel Rahman', mapUrl:'https://maps.google.com/?q=30.0617,31.3368', coordinates:{lat:30.0617,lng:31.3368}, deliveryEligible:true, active:true }
];
const DEFAULT_SETTINGS = { shopNameAr:'حلواني تاج الخليج', shopNameEn:'Taj El Khalig Sweets', taglineAr:'أحلى طعم لأصالة الحلويات الشرقية والغربية', taglineEn:'The sweetest taste of authentic pastries', contactPhone:'19876', whatsappNumber:'01099887766', contactEmail:'info@tajelkhalig.com', facebookUrl:'https://facebook.com/tajelkhaligsweets', instagramUrl:'https://instagram.com/tajelkhaligsweets', tiktokUrl:'https://tiktok.com/@tajelkhaligsweets', deliveryFee:25, freeDeliveryThreshold:250, currencyAr:'ج.م', currencyEn:'EGP' };

async function ensureSchema(db) {
  const existing=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").first();
  if(existing) return;
  const statements=[
    'CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, active INTEGER NOT NULL DEFAULT 1, data TEXT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, category_id TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, data TEXT NOT NULL)',
    'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
    'CREATE TABLE IF NOT EXISTS branches (id TEXT PRIMARY KEY, active INTEGER NOT NULL DEFAULT 1, data TEXT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL, branch_id TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, data TEXT NOT NULL)',
    'CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone)',
    'CREATE INDEX IF NOT EXISTS idx_orders_branch_date ON orders(branch_id, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
    "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name_ar TEXT NOT NULL DEFAULT '', name_en TEXT NOT NULL DEFAULT '', role TEXT NOT NULL CHECK(role IN ('admin','branch')), branch_id TEXT, active INTEGER NOT NULL DEFAULT 1)",
    'CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL)',
    'CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, branch_id TEXT, data TEXT NOT NULL, created_at INTEGER NOT NULL)',
    'CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at)',
    'CREATE TABLE IF NOT EXISTS login_attempts (ip_hash TEXT PRIMARY KEY, count INTEGER NOT NULL, blocked_until INTEGER NOT NULL)'
  ];
  await db.batch(statements.map(sql=>db.prepare(sql)));
}

async function seed(env) {
  const db = env.DB;
  try {
    const initialized=await db.prepare('SELECT id FROM settings WHERE id=1').first();
    if(!initialized){
      const statements=[
        ...DEFAULT_CATEGORIES.map(x=>db.prepare('INSERT OR IGNORE INTO categories(id,active,data) VALUES(?,?,?)').bind(x.id,1,encode(x))),
        ...DEFAULT_PRODUCTS.map(x=>db.prepare('INSERT OR IGNORE INTO products(id,category_id,active,data) VALUES(?,?,?,?)').bind(x.id,x.categoryId,1,encode(x))),
        ...DEFAULT_BRANCHES.map(x=>db.prepare('INSERT OR IGNORE INTO branches(id,active,data) VALUES(?,?,?)').bind(x.id,1,encode(x))),
        db.prepare('INSERT OR IGNORE INTO settings(id,data) VALUES(1,?)').bind(encode(DEFAULT_SETTINGS))
      ];
      await db.batch(statements);
    }
  } catch(e) { console.error('Taj seed data error:', e?.message || e); }
  try {
    const user = await db.prepare('SELECT id FROM users LIMIT 1').first();
    if (!user && env.TAJ_ADMIN_USER && env.TAJ_ADMIN_PASSWORD) {
      const password = String(env.TAJ_ADMIN_PASSWORD);
      if (password.length >= 16) {
        const passwordHash = await hashPassword(password);
        await db.prepare('INSERT OR IGNORE INTO users(id,username,password_hash,name_ar,name_en,role,active) VALUES(?,?,?,?,?,?,1)')
          .bind('user-admin', String(env.TAJ_ADMIN_USER), passwordHash, 'مدير النظام', 'Shop Administrator', 'admin').run();
        console.log('Taj: admin user created successfully.');
      } else {
        console.warn('Taj: TAJ_ADMIN_PASSWORD must be at least 16 characters. Admin not created.');
      }
    }
  } catch(e) { console.error('Taj admin user creation error:', e?.message || e); }
}

function b64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,''); }
function unb64(value) { const s=String(value).replaceAll('-','+').replaceAll('_','/'); return Uint8Array.from(atob(s+'='.repeat((4-s.length%4)%4)), c=>c.charCodeAt(0)); }
async function digest(value) { return b64(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))); }
const PASSWORD_ITERATIONS = 20000;
const LEGACY_PASSWORD_ITERATIONS = 10000;
async function pbkdf2Bits(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const result = await crypto.subtle.deriveBits({name:'PBKDF2', salt, iterations, hash:'SHA-256'}, key, 256);
  return b64(result);
}
async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  return `${PASSWORD_ITERATIONS}:${b64(salt)}:${await pbkdf2Bits(password, salt, PASSWORD_ITERATIONS)}`;
}
async function verifyPassword(password, stored) {
  const parts = String(stored || '').split(':');
  if (parts.length === 3) {
    const iterations = Number(parts[0]);
    if (!Number.isInteger(iterations) || iterations < 1000 || iterations > 100000) return false;
    return `${parts[0]}:${parts[1]}:${await pbkdf2Bits(password, unb64(parts[1]), iterations)}` === stored;
  }
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  return await pbkdf2Bits(password, unb64(parts[0]), LEGACY_PASSWORD_ITERATIONS) === parts[1];
}
function cookies(request) {
  return Object.fromEntries((request.headers.get('Cookie') || '').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),decodeURIComponent(x.slice(i+1))];}));
}
function safeUser(row) { return row && {id:row.id,username:row.username,nameAr:row.name_ar,nameEn:row.name_en,role:row.role,branchId:row.branch_id,active:Boolean(row.active)}; }
async function auth(request, env) {
  const token = cookies(request).taj_session;
  if (!token) return null;
  return safeUser(await env.DB.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1').bind(await digest(token), Date.now()).first());
}
async function body(request) {
  const length=Number(request.headers.get('Content-Length')||0);
  if(length>2_000_000) throw Object.assign(new Error('Request body too large'),{status:413});
  const reader=request.body&&request.body.getReader?request.body.getReader():null;
  if(!reader) return {};
  const decoder=new TextDecoder();let raw='';
  while(true){
    const chunk=await reader.read();
    if(chunk.done)break;
    raw+=decoder.decode(chunk.value,{stream:true});
    if(raw.length>2_000_000){try{await reader.cancel();}catch{}throw Object.assign(new Error('Request body too large'),{status:413});}
  }
  if(!raw) return {};
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error('Invalid JSON'),{status:400}); }
}
async function list(env, table, activeOnly=false) {
  const rows = await env.DB.prepare(`SELECT data FROM ${table}${activeOnly?' WHERE active=1':''}`).all();
  return rows.results.map(row=>decode(row.data));
}
function publicEventType(table) { return ({categories:'taj_categories_updated',products:'taj_products_updated',branches:'taj_branches_updated',settings:'taj_settings_updated'})[table]; }
async function addEvent(env, type, payload, branchId=null) {
  await env.DB.prepare('INSERT INTO events(type,branch_id,data,created_at) VALUES(?,?,?,?)').bind(type,branchId,encode(payload),Date.now()).run();
  await env.DB.prepare('DELETE FROM events WHERE created_at<?').bind(Date.now()-7*86400000).run();
}
function eventPayload(table, data) { return {[table.slice(0,-1)]:data}; }
function userBranch(user, branchId) { return user?.role==='admin' || user?.branchId===branchId; }

let schemaReady=false;
export async function onRequest(context) {
  const {request,env}=context;
  try {
    if(!schemaReady){await ensureSchema(env.DB);await seed(env);schemaReady=true;}
    const url=new URL(request.url), path='/'+(url.pathname.split('/').slice(2).join('/')||''), method=request.method;
    const db=env.DB;
    if(method==='OPTIONS') return new Response(null,{status:204,headers:{Allow:'GET, POST, PUT, PATCH, DELETE, OPTIONS'}});
    const origin=request.headers.get('Origin');
    if(['POST','PUT','PATCH','DELETE'].includes(method) && origin && new URL(origin).host!==url.host) return json({error:'Cross-origin request rejected'},403);

    if(path==='/health' && method==='GET') return json({ok:true,storage:'d1',realtime:'polling'});
    if(path==='/auth/login' && method==='POST') {
      const input=await body(request), ip=request.headers.get('CF-Connecting-IP')||'unknown', ipHash=await digest(ip), attempt=await db.prepare('SELECT * FROM login_attempts WHERE ip_hash=?').bind(ipHash).first();
      if(attempt?.blocked_until>Date.now()) return json({error:'Too many sign-in attempts. Try again later.'},429);
      let row=await db.prepare('SELECT * FROM users WHERE username=? AND active=1').bind(String(input.username||'')).first();
      if(!row&&env.TAJ_ADMIN_USER&&env.TAJ_ADMIN_PASSWORD&&String(env.TAJ_ADMIN_PASSWORD).length>=16){
        const anyUser=await db.prepare('SELECT id FROM users LIMIT 1').first();
        if(!anyUser){await db.prepare('INSERT OR IGNORE INTO users(id,username,password_hash,name_ar,name_en,role,active) VALUES(?,?,?,?,?,?,1)').bind('user-admin',String(env.TAJ_ADMIN_USER),await hashPassword(String(env.TAJ_ADMIN_PASSWORD)),'مدير النظام','Shop Administrator','admin').run();row=await db.prepare('SELECT * FROM users WHERE username=? AND active=1').bind(String(input.username||'')).first();}
      }
      if(!row || !await verifyPassword(String(input.password||''),row.password_hash)) {
        const count=(attempt?.count||0)+1, blockedUntil=count>=8?Date.now()+900000:0;
        await db.prepare('INSERT INTO login_attempts(ip_hash,count,blocked_until) VALUES(?,?,?) ON CONFLICT(ip_hash) DO UPDATE SET count=excluded.count,blocked_until=excluded.blocked_until').bind(ipHash,blockedUntil?0:count,blockedUntil).run();
        return json({error:'Invalid username or password'},401);
      }
      await db.prepare('DELETE FROM login_attempts WHERE ip_hash=?').bind(ipHash).run();
      if(String(row.password_hash).split(':').length===2){try{await db.prepare('UPDATE users SET password_hash=? WHERE id=?').bind(await hashPassword(String(input.password||'')),row.id).run();}catch{}}
      const token=b64(crypto.getRandomValues(new Uint8Array(32)));
      await db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await digest(token),row.id,Date.now()+7*86400000).run();
      return json({user:safeUser(row)},200,{ 'Set-Cookie':`taj_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=604800` });
    }
    if(path==='/auth/logout' && method==='POST') {
      const token=cookies(request).taj_session; if(token) await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run();
      return json({ok:true},200,{'Set-Cookie':'taj_session=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0'});
    }
    if(path==='/auth/me' && method==='GET') return json({user:await auth(request,env)});
    if(path==='/events' && method==='GET') {
      const user=await auth(request,env); if(!user) return json({events:[],since:Number(url.searchParams.get('since')||0)});
      if(!url.searchParams.has('since')) { const latest=await db.prepare('SELECT COALESCE(MAX(id),0) AS id FROM events').first(); return json({events:[],since:latest.id}); }
      const since=Math.max(0,Number(url.searchParams.get('since')||0));
      const rows=await db.prepare('SELECT id,type,branch_id,data,created_at FROM events WHERE id>? ORDER BY id LIMIT 100').bind(since).all();
      const events=rows.results.filter(row=>PUBLIC_EVENTS.has(row.type)||userBranch(user,row.branch_id)).map(row=>({id:row.id,type:row.type,payload:decode(row.data),createdAt:row.created_at}));
      return json({events,since:rows.results.at(-1)?.id||since});
    }

    if(path==='/categories' && method==='GET') return json(await list(env,'categories',url.searchParams.get('active')==='1'));
    if(path==='/products' && method==='GET') {
      let rows=await list(env,'products',url.searchParams.get('active')==='1'); const categoryId=url.searchParams.get('categoryId'), search=(url.searchParams.get('search')||'').toLowerCase();
      if(categoryId&&categoryId!=='all') rows=rows.filter(x=>x.categoryId===categoryId);
      if(search) rows=rows.filter(p=>[p.nameAr,p.nameEn,p.descAr,p.descEn].some(x=>(x||'').toLowerCase().includes(search)));
      if(url.searchParams.get('active')==='1'){const ids=new Set((await list(env,'categories',true)).map(x=>x.id));rows=rows.filter(p=>ids.has(p.categoryId));}
      return json(rows);
    }
    if(path==='/branches' && method==='GET') return json(await list(env,'branches',url.searchParams.get('active')==='1'));
    if(path==='/products/popular' && method==='GET') {
      const rows=await db.prepare("SELECT json_extract(je.value,'$.productId') AS pid,COALESCE(SUM(CAST(json_extract(je.value,'$.quantity') AS INTEGER)),0) AS qty FROM orders o,json_each(o.data,'$.items') je WHERE o.status<>'cancelled' GROUP BY pid ORDER BY qty DESC LIMIT 20").all();
      const ids=new Set((await list(env,'categories',true)).map(x=>x.id)),byId=new Map((await list(env,'products',true)).filter(p=>ids.has(p.categoryId)).map(p=>[p.id,p]));
      const popular=[];const seen=new Set();
      for(const row of rows.results){const p=row.pid&&byId.get(row.pid),qty=Number(row.qty)||0;if(!p||qty<1||seen.has(p.id))continue;seen.add(p.id);popular.push({...p,soldCount:qty});if(popular.length>=8)break;}
      return json(popular);
    }
    if(path==='/settings' && method==='GET') return json(decode((await db.prepare('SELECT data FROM settings WHERE id=1').first()).data));

    if(path==='/orders' && method==='POST') {
      const input=await body(request), phone=String(input.customerPhone||'').replace(/\D/g,'');
      if(!/^01\d{9}$/.test(phone)||!String(input.customerName||'').trim()||!Array.isArray(input.items)||!input.items.length) return json({error:'Valid name, Egyptian mobile, and order items are required'},400);
      if(String(input.customerName||'').trim().length>120) return json({error:'Customer name must be 120 characters or fewer'},400);
      if(String(input.notes||'').trim().length>500) return json({error:'Order notes must be 500 characters or fewer'},400);
      const settings=decode((await db.prepare('SELECT data FROM settings WHERE id=1').first()).data), products=new Map((await list(env,'products',true)).map(p=>[p.id,p])), items=[];
      for(const item of input.items){const product=products.get(String(item.productId||item.id)),quantity=Math.max(1,Math.min(99,Math.floor(Number(item.quantity)||1)));if(!product||product.inStock===false)return json({error:'An item is no longer available'},400);const price=Number(product.discountPrice||product.regularPrice);items.push({productId:product.id,nameAr:product.nameAr,nameEn:product.nameEn,image:product.image,price,quantity});}
      const subtotal=items.reduce((s,x)=>s+x.price*x.quantity,0),type=input.type==='pickup'?'pickup':'delivery',deliveryFee=type==='delivery'&&subtotal<Number(settings.freeDeliveryThreshold||0)?Number(settings.deliveryFee||0):0;
      const branchRow=await db.prepare('SELECT data FROM branches WHERE id=? AND active=1').bind(String(input.branchId||'')).first();if(!branchRow)return json({error:'Please choose an active branch'},400);
      const branch=decode(branchRow.data);if(type==='delivery'&&!branch.deliveryEligible)return json({error:'Selected branch does not provide delivery'},400);if(type==='delivery'&&!String(input.address||'').trim())return json({error:'A delivery address is required'},400);if(String(input.address||'').trim().length>300)return json({error:'Delivery address must be 300 characters or fewer'},400);
      const createdAt=nowIso(),gpsIn=input.gpsCoordinates,gps=gpsIn&&Number.isFinite(gpsIn.lat)&&Number.isFinite(gpsIn.lng)?{lat:gpsIn.lat,lng:gpsIn.lng}:null,order={createdAt,customerName:String(input.customerName).trim(),customerPhone:phone,type,branchId:branch.id,branchNameAr:branch.nameAr,branchNameEn:branch.nameEn,deliveryFee,subtotal,total:subtotal+deliveryFee,status:'new',items,address:input.address||null,gpsCoordinates:gps,notes:String(input.notes||'').trim()};
      const result=await db.prepare('INSERT INTO orders(customer_name,customer_phone,branch_id,status,created_at,data) VALUES(?,?,?,?,?,?)').bind(order.customerName,phone,branch.id,'new',createdAt,encode(order)).run();order.id=String(result.meta.last_row_id);await db.prepare('UPDATE orders SET data=? WHERE id=?').bind(encode(order),result.meta.last_row_id).run();
      await addEvent(env,'taj_new_order',{order,branchId:branch.id},branch.id);return json(order,201);
    }

    const guestEntity=path.match(/^\/(categories|products|branches)\/([^/]+)$/);
    if(guestEntity&&method==='GET'){const row=await db.prepare(`SELECT data FROM ${guestEntity[1]} WHERE id=?`).bind(decodeURIComponent(guestEntity[2])).first();return row?json(decode(row.data)):json({error:'Not found'},404);}
    const user=await auth(request,env); if(!user)return json({error:'Authentication required'},401);
    const isAdmin=user.role==='admin', requireAdmin=()=>isAdmin;
    if(path==='/users'&&method==='GET') {if(!isAdmin)return json({error:'Administrator permission required'},403);const r=await db.prepare('SELECT * FROM users ORDER BY username').all();return json(r.results.map(safeUser));}
    if(path==='/users'&&method==='POST') {
      if(!isAdmin)return json({error:'Administrator permission required'},403);const input=await body(request);if(!input.username||String(input.password||'').length<12||!['admin','branch'].includes(input.role))return json({error:'Username, role, and a password of at least 12 characters are required'},400);
      if(input.role==='branch'&&!await db.prepare('SELECT id FROM branches WHERE id=? AND active=1').bind(input.branchId).first())return json({error:'Choose an active branch for this account'},400);
      const id=`user-${crypto.randomUUID()}`;try{await db.prepare('INSERT INTO users(id,username,password_hash,name_ar,name_en,role,branch_id,active) VALUES(?,?,?,?,?,?,?,1)').bind(id,String(input.username).trim(),await hashPassword(String(input.password)),String(input.nameAr||'').trim(),String(input.nameEn||'').trim(),input.role,input.role==='branch'?input.branchId:null).run();return json(safeUser(await db.prepare('SELECT * FROM users WHERE id=?').bind(id).first()),201);}catch{return json({error:'Username already exists'},409);}
    }
    const userStatus=path.match(/^\/users\/([^/]+)\/status$/);
    if(userStatus&&method==='PATCH') {if(!isAdmin)return json({error:'Administrator permission required'},403);const input=await body(request),id=decodeURIComponent(userStatus[1]);if(id===user.id&&input.active===false)return json({error:'You cannot deactivate the account you are currently using'},400);await db.prepare('UPDATE users SET active=? WHERE id=?').bind(input.active?1:0,id).run();if(!input.active)await db.prepare('DELETE FROM sessions WHERE user_id=?').bind(id).run();const row=await db.prepare('SELECT * FROM users WHERE id=?').bind(id).first();return row?json(safeUser(row)):json({error:'User not found'},404);}

    const entity=path.match(/^\/(categories|products|branches)(?:\/([^/]+))?$/);
    if(entity){const [,table,idRaw]=entity,id=idRaw?decodeURIComponent(idRaw):null;
      if(method==='GET'&&id){const row=await db.prepare(`SELECT data FROM ${table} WHERE id=?`).bind(id).first();return row?json(decode(row.data)):json({error:'Not found'},404);}
      if(['POST','PUT','PATCH','DELETE'].includes(method)){
        if(!requireAdmin())return json({error:'Administrator permission required'},403);
        if(method==='DELETE'){if(table==='categories'&&await db.prepare('SELECT id FROM products WHERE category_id=? AND active=1 LIMIT 1').bind(id).first())return json({error:'Deactivate or reassign active products first'},409);await db.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();await addEvent(env,publicEventType(table),{deletedId:id});return json({ok:true});}
        const input=await body(request);let data=input;
        if(method!=='POST'){const row=await db.prepare(`SELECT data FROM ${table} WHERE id=?`).bind(id).first();if(!row)return json({error:'Not found'},404);data={...decode(row.data),...input,id};}
        else data={...input,id:input.id||`${table.slice(0,-1)}-${crypto.randomUUID()}`};
        if(table==='products'&&!await db.prepare('SELECT id FROM categories WHERE id=?').bind(data.categoryId).first())return json({error:'Product category does not exist'},400);
        if(table==='products'&&String(data.image||'').startsWith('data:')&&String(data.image).length>1_500_000)return json({error:'Product images must be smaller than about 1 MB. Please choose a smaller image.'},413);
        const active=data.active===false?0:1;
        if(table==='categories') await db.prepare('INSERT INTO categories(id,active,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET active=excluded.active,data=excluded.data').bind(data.id,active,encode(data)).run();
        if(table==='products') await db.prepare('INSERT INTO products(id,category_id,active,data) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET category_id=excluded.category_id,active=excluded.active,data=excluded.data').bind(data.id,data.categoryId,active,encode(data)).run();
        if(table==='branches') await db.prepare('INSERT INTO branches(id,active,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET active=excluded.active,data=excluded.data').bind(data.id,active,encode(data)).run();
        await addEvent(env,publicEventType(table),eventPayload(table,data));return json(data,method==='POST'?201:200);
      }
    }
    if(path==='/settings'&&method==='PUT') {if(!isAdmin)return json({error:'Administrator permission required'},403);const input=await body(request),old=decode((await db.prepare('SELECT data FROM settings WHERE id=1').first()).data),settings={...old,...input};await db.prepare('UPDATE settings SET data=? WHERE id=1').bind(encode(settings)).run();await addEvent(env,'taj_settings_updated',{settings});return json(settings);}

    if(path==='/orders'&&method==='GET'){
      const page=Math.max(1,Number(url.searchParams.get('page')||1)),limit=Math.min(1000,Math.max(1,Number(url.searchParams.get('limit')||20))),clauses=[],values=[];
      if(!isAdmin){clauses.push('branch_id=?');values.push(user.branchId||'');}else if(url.searchParams.get('branchId')&&url.searchParams.get('branchId')!=='all'){clauses.push('branch_id=?');values.push(url.searchParams.get('branchId'));}
      const status=url.searchParams.get('status');if(status&&status!=='all'){clauses.push('status=?');values.push(status);}const q=url.searchParams.get('search');if(q){clauses.push('(customer_name LIKE ? OR customer_phone LIKE ? OR CAST(id AS TEXT) LIKE ?)');values.push(`%${q}%`,`%${q}%`,`%${q}%`);}const phone=url.searchParams.get('phone');if(phone){clauses.push('customer_phone=?');values.push(phone);}
      const range=url.searchParams.get('dateRange'),today=new Date().toISOString().slice(0,10);if(range==='today'){clauses.push('created_at>=?');values.push(`${today}T00:00:00.000Z`);}if(range==='yesterday'){const d=new Date();d.setUTCDate(d.getUTCDate()-1);clauses.push('created_at>=? AND created_at<?');values.push(`${d.toISOString().slice(0,10)}T00:00:00.000Z`,`${today}T00:00:00.000Z`);}if(range==='last7'){clauses.push('created_at>=?');values.push(new Date(Date.now()-7*86400000).toISOString());}if(range==='thisMonth'){clauses.push('created_at>=?');values.push(`${today.slice(0,7)}-01T00:00:00.000Z`);}
      const where=clauses.length?`WHERE ${clauses.join(' AND ')}`:'',count=await db.prepare(`SELECT COUNT(*) AS n FROM orders ${where}`).bind(...values).first(),rows=await db.prepare(`SELECT data FROM orders ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).bind(...values,limit,(page-1)*limit).all();return json({orders:rows.results.map(r=>decode(r.data)),totalCount:count.n,totalPages:Math.ceil(count.n/limit)||1,currentPage:page,limit});
    }
    if(path==='/orders/cleanup'&&method==='POST'){
      if(!isAdmin)return json({error:'Administrator permission required'},403);
      const input=await body(request),before=String(input.before||'');
      const cutoffMs=Date.parse(`${before}T00:00:00.000Z`);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(before)||isNaN(cutoffMs))return json({error:'Valid cutoff date is required'},400);
      const ordersDeleted=(await db.prepare('DELETE FROM orders WHERE created_at<?').bind(before).run()).meta.changes||0;
      const eventsDeleted=(await db.prepare('DELETE FROM events WHERE created_at<?').bind(cutoffMs).run()).meta.changes||0;
      return json({ok:true,ordersDeleted,eventsDeleted});
    }
    const orderMatch=path.match(/^\/orders\/([^/]+)$/);
    if(orderMatch&&method==='GET'){const row=await db.prepare('SELECT * FROM orders WHERE id=?').bind(Number(orderMatch[1])).first();if(!row||(!isAdmin&&row.branch_id!==user.branchId))return json({error:'Order not found'},404);return json(decode(row.data));}
    const statusMatch=path.match(/^\/orders\/([^/]+)\/status$/);
    if(statusMatch&&method==='PATCH'){const input=await body(request),id=Number(statusMatch[1]),row=await db.prepare('SELECT * FROM orders WHERE id=?').bind(id).first();if(!row||(!isAdmin&&row.branch_id!==user.branchId))return json({error:'Order not found'},404);if(!['new','ready','completed','cancelled'].includes(input.status))return json({error:'Invalid order status'},400);const order={...decode(row.data),status:input.status,updatedAt:nowIso()};await db.prepare('UPDATE orders SET status=?,data=? WHERE id=?').bind(input.status,encode(order),id).run();await addEvent(env,'taj_order_status_changed',{order,branchId:row.branch_id,newStatus:input.status},row.branch_id);return json(order);}
    if(path==='/customers'&&method==='GET'){
      const page=Math.max(1,Number(url.searchParams.get('page')||1)),limit=Math.min(200,Math.max(1,Number(url.searchParams.get('limit')||50))),clauses=[],values=[];
      if(!isAdmin){clauses.push('branch_id=?');values.push(user.branchId||'');}
      const q=url.searchParams.get('search');if(q){clauses.push('(customer_name LIKE ? OR customer_phone LIKE ?)');values.push(`%${q}%`,`%${q}%`);}
      const where=clauses.length?`WHERE ${clauses.join(' AND ')}`:'';
      const count=await db.prepare(`SELECT COUNT(DISTINCT customer_phone) AS n FROM orders ${where}`).bind(...values).first();
      const rows=await db.prepare(`SELECT customer_phone,customer_name,created_at,COUNT(*) AS orders_count,COALESCE(SUM(CASE WHEN status='cancelled' THEN 0 ELSE json_extract(data,'$.total') END),0) AS total_spend FROM orders ${where} GROUP BY customer_phone ORDER BY MAX(id) DESC LIMIT ? OFFSET ?`).bind(...values,limit,(page-1)*limit).all();
      return json({customers:rows.results.map(r=>({phone:r.customer_phone,name:r.customer_name,ordersCount:r.orders_count,totalSpend:r.total_spend,lastOrderDate:r.created_at})),totalCount:count.n,totalPages:Math.ceil(count.n/limit)||1,currentPage:page,limit});
    }
    if(path==='/reports'&&method==='GET'){
      const conditions=["status IN ('completed','ready')"],values=[];if(!isAdmin){conditions.push('branch_id=?');values.push(user.branchId||'');}else if(url.searchParams.get('branchId')&&url.searchParams.get('branchId')!=='all'){conditions.push('branch_id=?');values.push(url.searchParams.get('branchId'));}
      const start=url.searchParams.get('startDate'),end=url.searchParams.get('endDate'),range=url.searchParams.get('dateRange'),today=new Date().toISOString().slice(0,10);
      if(range==='today'){conditions.push('created_at>=?');values.push(`${today}T00:00:00.000Z`);}else if(range==='thisMonth'){conditions.push('created_at>=?');values.push(`${today.slice(0,7)}-01T00:00:00.000Z`);}else if(range==='custom'&&start){conditions.push('created_at>=?');values.push(new Date(start).toISOString());}if(range==='custom'&&end){conditions.push('created_at<=?');values.push(new Date(`${end}T23:59:59.999`).toISOString());}
      const where=`WHERE ${conditions.join(' AND ')}`;
      const agg=await db.prepare(`SELECT COUNT(*) AS n,COALESCE(SUM(json_extract(data,'$.total')),0) AS s FROM orders ${where}`).bind(...values).first();
      const groups=(await db.prepare(`SELECT branch_id,COUNT(*) AS n,COALESCE(SUM(json_extract(data,'$.total')),0) AS s FROM orders ${where} GROUP BY branch_id`).bind(...values).all()).results;
      const byBranch=new Map(groups.map(g=>[g.branch_id,g])),branches=await list(env,'branches'),branchFilter=(!isAdmin?String(user.branchId||''):(url.searchParams.get('branchId')&&url.searchParams.get('branchId')!=='all'?url.searchParams.get('branchId'):null));
      const breakdown=branches.filter(b=>branchFilter===null||b.id===branchFilter).map(b=>{const g=byBranch.get(b.id);return {branchId:b.id,nameAr:b.nameAr,nameEn:b.nameEn,sales:g?g.s:0,ordersCount:g?g.n:0};});
      return json({totalSales:agg.s,ordersCount:agg.n,averageOrderValue:agg.n?Math.round(agg.s/agg.n*100)/100:0,branchBreakdown:breakdown,calculationRule:'Only Completed and Ready orders are counted. New and Cancelled orders are excluded from sales totals.'});
    }
    return json({error:'API route not found'},404);
  } catch(error) {
    if(error?.status) return json({error:error.message},error.status);
    console.error('Taj API error:',error);
    return json({error:'Internal server error'},500);
  }
}
