# حلواني تاج الخليج | Taj El Khalig Sweets

Responsive Arabic/English sweets shop and admin dashboard built with HTML, CSS, and vanilla JavaScript. Cloudflare Pages serves the static storefront and admin UI; Pages Functions provide the same-origin API; Cloudflare D1 stores products, branches, orders, customers, accounts, and settings.

## Cloudflare deployment

The repository includes `wrangler.jsonc` with the D1 binding `DB` and database ID supplied for `tag-el-khalig`. The Pages build output is `public/`; the Worker API remains in `functions/` and is not exposed as a static file.

1. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git** and select `IslamElsayed57/Tag-El-Khalig`, production branch `main`.
2. Leave the build command empty and set the output directory to `public`. If Cloudflare offers to read `wrangler.jsonc`, allow it. The configuration declares the D1 binding.
3. In the Pages project, open **Settings → Variables and Secrets** and add production secrets `TAJ_ADMIN_USER` and `TAJ_ADMIN_PASSWORD`. Use a unique password of at least 16 characters. Do not commit these values.
4. Deploy the project. The first API request creates the D1 tables, inserts the starter catalogue/settings, and creates the first admin if both secrets are present. Open `/api/health` once, then sign in at `/admin/`.

The database currently has ID `c2b3d6fa-d455-4aa8-9122-e11ac1c9c2c8`. If Cloudflare asks to create a D1 binding manually, use variable name `DB` and select database `tag-el-khalig`. The SQL schema is also stored in `migrations/0001_init.sql` for manual review or setup.

### Local development

Install Node.js and Wrangler, then run:

```sh
npx wrangler pages dev public
```

Create a local `.dev.vars` file with `TAJ_ADMIN_USER` and `TAJ_ADMIN_PASSWORD` for the first local admin. `.dev.vars` is ignored by Git. Local D1 data is isolated from production.

### Data, authentication, and notifications

- Orders are priced and validated by the API before they are written to D1.
- Admin and branch permissions are checked on the server. Passwords use PBKDF2; sessions use secure, HttpOnly, SameSite cookies.
- The dashboard checks the event endpoint every 10 seconds while open to receive new-order, status, catalogue, branch, and settings updates. This polling approach works on the free Pages plan without a permanently running server.
- Uploaded product photos are resized in the browser and stored with the product record. Keep photos small; D1 has per-row and total free-tier storage limits.
- Cloudflare's free plan has daily request/read/write/storage quotas. When quotas are reached, some API/database operations can pause until limits reset. Review current limits before relying on it for high-volume production.

## Project layout

- `public/` — customer storefront, assets, and `/admin/` dashboard.
- `functions/api/[[path]].js` — same-origin Pages Functions API (**live production server**).
- `migrations/0001_init.sql` — D1 schema.
- `wrangler.jsonc` — Pages output and D1 binding.
- `server/server.mjs` — Node/SQLite copy of the API; **must be kept in parity** with the Functions API (every server-side change goes into both files).
- `public/assets/js/api.js` — API client; contains the remote implementation plus a full local (localStorage) fallback that mirrors server behavior.

## Development log (changes applied to this project)

### Latest session — 2026-10-03

1. **Mobile "Add to Cart" failure fix (root cause: HTTP 401)**
   - Symptom: on phones the storefront showed "⚠️ An error occurred" after tapping **Add to Cart**; the same flow worked on the owner's desktop.
   - Cause: the button handler (`public/assets/js/cart.js` → `bindGlobalAddToCart`) calls `TajAPI.getProductById` → `GET /api/products/:id`, but the single-entity routes sat **below** the auth gate and returned `401 Authentication required` for visitors without an admin `taj_session` cookie. Desktop passed only because that browser held an admin session on the same origin; phones never did. List routes (`/products`, `/categories`, `/branches`, `/settings`) and `POST /orders` were already public.
   - Fix: a public single-GET handler for `categories|products|branches` was added **before** the auth gate in `functions/api/[[path]].js` (~lines 192–193) with an identical mirror in `server/server.mjs` (~lines 259–263). Non-GET methods still fall through to the admin gate unchanged. Verified with esprima.
2. **Orders table: compact stop-alert button**
   - `public/admin/js/orders.js` — the "إيقاف التنبيه" / "Stop Alert" action button is now **icon-only** (🔕, `title` tooltip, `padding-inline:0.5rem`) and renders inline right before the "تفاصيل الطلب" button, so rows no longer break. No other change to the table.
3. **Reports: animated contribution bars**
   - `public/admin/js/reports.js` — the "نسبة المساهمة" bars now start at `width:0%` with `transition:width 0.8s ease`; the target lives in `data-bar-width` and a double `requestAnimationFrame` after render sets the final width, so bars animate 0 → target on every render/filter change. Labels and all other report markup unchanged.
4. **Customer order-history modal i18n**
   - `public/admin/js/customers.js` — three hardcoded Arabic strings in the history modal now follow the file's `isAr ? 'عربي' : 'English'` pattern: modal title (`سجل طلبات العميل` / `Customer Order History`), section heading (`الطلبات السابقة:` / `Previous Orders:`), and order line (`طلب #N - 🛵 توصيل/🏬 استلام` / `Order #N - 🛵 Delivery/🏬 Pickup`). The Arabic strings are byte-identical to before, so Arabic mode is untouched.
5. **Old-orders cleanup feature (admin-only)**
   - Purpose: keep D1 storage under the 500 MB free-plan cap by deleting orders older than a chosen date (product images stay in D1 by choice; `events` rows older than 7 days are already auto-purged by `addEvent`).
   - `functions/api/[[path]].js` — new `POST /orders/cleanup` route **below the auth gate with `isAdmin` 403**, validates `before` as `YYYY-MM-DD`, runs `DELETE FROM orders WHERE created_at<?` and `DELETE FROM events WHERE created_at<?` (epoch ms), returns `{ok, ordersDeleted, eventsDeleted}`.
   - `server/server.mjs` — parity route (orders only; the Node copy has no `events` table, returns `eventsDeleted:0`).
   - `public/assets/js/api.js` — `cleanupOrders(before)` added to both `localApi` (throws unless current user is admin) and `remoteApi`.
   - `public/admin/js/orders.js` — "🗑️ مسح الطلبات القديمة" button rendered only when `role === 'admin'` next to the XLSX export; opens `openCleanupModal()` (date input + confirm in `runCleanup()` with an "export XLSX first" warning) and re-renders on success.

### Earlier sessions (cumulative)

- **Admin "Add user" modal** (`public/admin/js/accounts.js`): inline form replaced with an "➕ إضافة مستخدم جديد" button (remote mode only) opening `openUserModal()` (uses `admin-modal-overlay`/`admin-modal-box` patterns; branch field hidden via inline `display` because `.form-group` is flex) and `saveUserForm()` with in-modal error display and refresh-on-success.
- **Reports accounting rule**: sales now count orders with status `completed` **or** `ready`, applied consistently in `public/assets/js/api.js` (`getReports`), `functions/api/[[path]].js` (`status IN ('completed','ready')`), `server/server.mjs`, plus localized `calculationRule` text (Arabic in the admin UI, English in the API default).
- **Branch filter for the "sales by branch" detail table**: `branchFilter` on the server (`null`/absent = all; a branch user is constrained to their own branch via `String(user.branchId||'')`) and `visibleBranches` client-side.
- **XLSX export/import without any external library**: zip/XLSX builders in `public/assets/js/api.js` (`downloadXlsx`, `unzipEntries`, `parseXlsxBuffer`, CRC32…), wired into `public/admin/js/orders.js` and `products.js` (export + import + template download).
- **New-order alert sound**: WebAudio via `getAudioContext`, `startOrderAlert`/`stopAlert`, `pendingOrderAlerts` queue, and duplicate suppression (`isDuplicateOrderEvent`); the table stop-alert button toggles it per order.
- **Event/notification reliability**: client `notifyChange` + `connectEvents` polling with `visibilitychange` refresh; server `PUBLIC_EVENTS` set (`taj_products_updated`, `taj_categories_updated`, `taj_branches_updated`, `taj_settings_updated`) so guests receive catalogue/branch/settings pushes without auth.
- **Storefront behavior**: footer WhatsApp/phone icon links hidden; contact form opens WhatsApp; language toggle button `Ar`/`Eng` calls `I18N.toggleLang()` + `renderUserBadge()` + re-renders the active tab; cart rendering fixed (immediate items HTML, try/catch fallback, `btn-bounce` + toast on add).
- **i18n rounds (Arabic default / full English)**:
  - Admin: `reports.js`, `products.js`, `branches.js`, `accounts.js` (modal, headers, badges, confirms via `I18N.currentLang === 'ar'`), `admin.js` (logout `data-i18n="logout"`, sidebar name/badge by language, `renderUserBadge()` on `taj_lang_changed`), `index.html` (data-i18n on labels/brand/badge). New keys: `systemNoticeLabel`, `sidebarBrand`, `sidebarBadge`, `logout`.
  - Storefront: ~24 new keys in `public/assets/js/i18n.js` (ar+en) covering footer (links/quick/phone/whatsapp/email/copyright/madeInEgypt/categories), map block, social bar, inquiry form placeholders, story badge, value pillars — applied across `index.html`, `categories.html`, `branches.html`, `cart.html`.

## Conventions for AI assistants working on this repo

- **Language**: reply to the user in Arabic (Egyptian dialect). Work requests usually include "من غير ما تغير أي حاجة/أي إعدادات تانية" — keep every diff minimal and scoped exactly to what was asked; do not refactor or restyle anything else.
- **No commits/pushes unless explicitly requested.** The user performs Cloudflare Pages deploys and hard refreshes manually, then verifies on phone + desktop.
- **Verification without Node**: this machine has no node/npm/git. Validate JS with Python + `esprima` after normalizing:
  - remove numeric separators (`2_000_000` → `2000000`)
  - `??=` → ` || `, `??` → `||`, `?.` → `.__opt__.`
  - `catch {` / `catch{` → `catch (e) {`
  - `for await (` → `for (`
  - neutralize `import.meta` (replace with a string literal)
  - call `esprima.parseModule(src)` (handles `export`/`import`); if a file still fails for an unrelated construct, parse the modified region in isolation.
- **Three-copy parity**: server logic exists in `functions/api/[[path]].js` (production), `server/server.mjs` (parity copy), and the local fallback in `public/assets/js/api.js`. Change them together.
- **i18n rules**: admin templates use either `I18N.t('key')` or inline `isAr ? 'عربي' : 'English'`; storefront uses `data-i18n`/`data-i18n-placeholder` attributes applied by `applyToDOM` in `i18n.js` plus the `taj_lang_changed` event. Any new key must be added to **both** the `ar` and `en` tables. Arabic strings must remain byte-identical when they already exist.
- **Runtime config**: `window.TAJ_CONFIG = { apiBaseUrl: '/api', mode: 'remote' }` in `public/assets/js/config.js` (switch to `mode: 'local'` only for offline/local-storage use).
- **Auth shape**: server routes before the auth gate in `functions/api/[[path]].js` (health, login/logout/me, events, catalogue lists + single GET, settings, `POST /orders`) are public by design — storefront guests depend on them.

## Known intentionally-unchanged items

- `customers.js` empty-search row (`لا يوجد عملاء يطابقون البحث`) still Arabic-only — it was not part of the photographed modal and was left untouched on request.
- The English `calculationRule` text still appears in Arabic UI mode when data comes from the API (legacy behavior, accepted).
- Not translated by decision: top announcement bar, "تابعنا:" header, brand text in the mobile drawer, page `<title>`/meta, login screen, notification panel wording, and the `منتج مستورد` fallback product name.

© 2026 Taj El Khalig Sweets
