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
- Admin and branch permissions are checked on the server. Passwords use PBKDF2 (20,000 iterations; the count is stored per hash so it can be raised without breaking existing accounts); sessions use secure, HttpOnly, SameSite cookies.
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

## Storage model, images, and free-plan limits

### D1 tables
`branches`, `categories`, `products`, `orders`, `users`, `sessions`, `login_attempts`, `settings`, `events` (+ `sqlite_sequence`, auto-created by SQLite). Catalogue/settings tables are seeded from in-code defaults on first boot when empty.

### Product images (two supported forms)
- **Base64 in D1 (current default)**: the admin upload resizes in-browser (max side 1200px → WebP quality 0.76) and stores a `data:` URL inside `products.data.image`; the API rejects images longer than ~1.5M chars (≈1 MB) with 413.
- **Static files**: `image` may instead be a relative path such as `assets/images/kunafa_plate.jpg` (the 4 preset buttons do this); files under `public/assets/images/` are served by Pages free & unlimited and never count against D1.
- **Owner decision**: images stay in D1 for now; storage stays under the cap by bounding photo count/size and using the admin "old orders cleanup" feature (development log item 5). Moving photos to `public/assets/images/` later would free D1 entirely (requires linking each photo to its product — no upload-to-path UI yet, only the 4 presets).

### Free-plan limits (verified 2026-10)
| Item | Limit |
|---|---|
| Pages Functions / Workers requests | 100,000/day (static asset requests are free & unlimited) |
| CPU per Functions invocation | 10 ms |
| Pages builds | 500/month, 1 concurrent, 20 min timeout |
| D1 rows read | 5 million/day |
| D1 rows written | 100,000/day — **enforced since 2026-09-01**, queries error until 00:00 UTC |
| D1 storage | 5 GB per account / **500 MB per database** / 2 MB max row |
| D1 queries per invocation | 50 |

Storage math: an order row ≈ 1–2 KB (so ~200k+ orders fit if images stay bounded), a base64 photo ≈ 0.2–1.5 MB (worst case ≈ 330 photos in 500 MB). Code-level order caps: item quantity clamped 1–99, request body ≤ 2 MB, Egyptian mobile format (`01…`), order list pages ≤ 1000 rows. Each open dashboard tab polls `/api/events` every 10 s ≈ 8.6k requests/day; `events` rows are auto-deleted after 7 days inside `addEvent`.

## Development log (changes applied to this project)

### Latest session — 2026-10-05 (storefront features: sold-out wording, new-arrival flag, branch hours, most-ordered ranking)

1. **"نفدت الكمية" badge wording + client-side guards (owner items 1–2)**
   - The badge + disabled add-to-cart button and the server-side `inStock` rejection in `POST /orders` (both copies) already existed; this session reworded the badge to **"🚫 نفدت الكمية" / "🚫 Out of Stock"** (i18n `outOfStock` — Arabic string intentionally changed on request) and closed two client-side gaps: `cart.js` `addItem()` now refuses out-of-stock products with a toast (stale card / programmatic bypass), and the local-mock `createOrder()` in `public/assets/js/api.js` now validates items against the active catalog and rejects `inStock === false` with the server's exact message (`An item is no longer available`).
2. **"New arrival 🔥" product flag (owner item 3)**
   - `public/admin/js/products.js` — new "منتج جديد 🔥 (يظهر بوسم جديد)" checkbox in the add/edit product form, saved as `isNew`; entity fields pass through untouched in both server copies, so no server change was needed. Local-mock `createProduct` persists `isNew`.
   - `public/assets/js/storefront.js` — 🔥 `product-new-tag` badge on product cards; homepage banner section `#newArrivalsSection` ("وصل حديثاً 🔥", topmost product section on the homepage) renders flagged products (up to 6) and hides itself when none are flagged.
3. **Branch working hours (owner item 4)**
   - `public/admin/js/branches.js` — `hoursAr`/`hoursEn` inputs in the add/edit branch modal (right after address) included in the save payload; local-mock `createBranch` persists them (server pass-through, no server change).
   - Storefront branches page — 🕐 "أوقات العمل" row rendered directly under the address (uses the current language, falls back to the other one).
4. **"Most ordered" ranking from real orders (owner item 5)**
   - New public **`GET /products/popular`** in both `functions/api/[[path]].js` and `server/server.mjs`: one SQL aggregation (`json_each(orders.data,'$.items')` + `SUM(quantity)`, `status<>'cancelled'` excluded, top 20 groups) joined in JS against active products in active categories → up to 8 products with `soldCount`. The `json_each` value/path semantics were verified against SQLite directly before shipping.
   - `public/assets/js/api.js` — `getPopularProducts()` in remote mode (new endpoint) and local mode (same counting rules over localStorage orders, cancelled excluded).
    - Homepage `#popularSection` ("الأكثر طلباً ⭐", below the new-arrivals banner) renders via `renderProductCard(p, isAr, soldCount)` — cards show "تم طلبه {count} مرة"; section hides when there are no counted orders.
5. **i18n + CSS (all new keys added to both `ar` and `en` tables)** — `newArrivalsBadge/Title`, `popularBadge/Title`, `newBadge`, `popularSoldCount`, `branchHours`; `outOfStock` reworded (item 1). New CSS: `.product-new-tag`, `.product-sold-count` (main.css), `.new-arrivals-section`, `.popular-section` (storefront.css). Existing sections/keys untouched. Verified with esprima (all eight touched JS files parse).
6. **Footer "طرق الدفع" column extended to the other section pages (owner request)**
   - `categories.html` and `branches.html` footers — the 4th column "خدمة العملاء" (phone/WhatsApp/email block) was replaced with the exact "طرق الدفع" payment column from `index.html` (same markup, same classes). All five payment keys already existed in both `ar` and `en` tables, and the styles live in `storefront.css` (loaded by both pages); the list uses plain flex + `space-between` so it renders correctly in RTL Arabic and LTR English.
   - Untouched: `branches.html`'s hero title still uses `contactTitle` (only the footer column was swapped); `cart.html` has no column footer (nothing to swap); contact details remain on the branches page's contact section. `storefront.js` field updaters (`.store-phone-display` etc.) no-op safely where those elements no longer exist.
7. **English product description dropped from the form; English UI shows the Arabic description (owner decision)**
   - `public/admin/js/products.js` — no English-description input in the add/edit product modal (owner: not needed). The save payload carries `descAr` only: an edit no longer writes `descEn` at all (the server merge keeps whatever is stored), and the create path no longer sets `descEn = nameEn` either — so the original bug (English description overwritten with the English name) is eliminated by never touching the field.
   - `public/assets/js/storefront.js` — product cards now render `descAr || descEn` in **both** languages: the English site shows the Arabic description (owner request), with `descEn` kept only as a safety net when a product has no Arabic description (e.g. an XLSX import that filled column 8 only).
   - Untouched: XLSX import still reads its `descEn` column, local search still matches `descEn`, seeds keep their English texts (all harmless — nothing displays them anymore). Server unchanged; verified with esprima.
8. **Featured-products section and "صنف مميز" checkbox removed (owner request)**
   - `public/index.html` — the "المميز والأكثر طلباً" section (`#featuredProductsContainer`) was deleted; the homepage product sections are now just the new-arrivals banner and the most-ordered section. The shared `.featured-section` CSS class stays (still used by those two sections).
   - `public/admin/js/products.js` — the "صنف مميز بالصفحة الرئيسية" checkbox is gone from the add/edit product modal, and the save payload no longer carries `featured` (same pattern as `descEn`: an edit leaves the stored flag untouched, a create stores `false`).
   - `public/assets/js/storefront.js` — `renderHomePage()` no longer reads or filters `featured`; its page gate now triggers on `newArrivalsContainer`/`popularProductsContainer`, and `showLoadError()` targets `newArrivalsContainer` instead (it also unhides the element's `<section>` so a homepage load failure stays visible now that the always-shown featured grid is gone).
   - Untouched: seed products keep `featured:true/false`, local `createProduct` still passes `featured: !!productData.featured` (payload has no such field anymore → `false`), i18n `featuredBadge`/`featuredTitle` keys remain in both tables (unused but harmless, consistent with other retired keys), server untouched (entity pass-through never inspected `featured`). Verified: esprima on both touched JS files, index.html tag balance, zero remaining `featuredProductsContainer`/`formProdFeatured` references.
9. **Homepage section colors cleaned up (owner request — screenshot review)**
   - `public/assets/css/storefront.css` — `.new-arrivals-section`: the pink→orange `linear-gradient` background was replaced with plain white `var(--bg-surface)` (owner: match the categories quick-bar background from the attached screenshot, no tint), the harsh full-width `border-top: 3px solid var(--primary)` stripe was removed, and its `border-bottom` was dropped so the new-arrivals → most-ordered boundary is the single shared 1px `.featured-section` divider instead of a doubled one. `.popular-section` (beige `--bg-subtle`) untouched — the band order now reads cream (story) → white (new arrivals) → beige (most ordered) → footer, with neutral dividers between all of them (the footer keeps its own 3px pink accent line).
10. **Admin product/branch/staff modal footer buttons clipped (owner request — screenshot)**
    - `public/admin/css/admin.css` — root cause: in those modals the `.modal-body-admin` + `.modal-footer-admin` live *inside* the `<form>`, so the form — not the body — was the direct flex child of `.admin-modal-box`; its default `min-height: auto` kept it at full content height while the box's `max-height: 90vh` + `overflow: hidden` sliced through the Save/Cancel buttons. CSS-only fix (no markup/JS touched): `.admin-modal-box > form` is now itself a flex column (`flex: 1 1 auto; min-height: 0`) so the body scrolls inside and the footer stays pinned, and `.modal-header-admin`/`.modal-footer-admin` got `flex-shrink: 0` so neither can ever be squeezed (also hardens the form-less modals — customers, order details). The login form and the shop-settings form live outside `.admin-modal-box`, so the new selector does not affect them.
11. **Out-of-stock add-to-cart now answers with an alert (owner request)**
    - `public/assets/js/storefront.js` — the add-to-cart button on cards marked "نفدت الكمية" no longer carries the `disabled` attribute (a disabled button silently swallowed clicks); the button is clickable and reaches the guard.
    - `public/assets/js/cart.js` — the `addItem()` out-of-stock guard now shows `I18N.t('outOfStockAlert')` (it previously showed `'🚫 ' + outOfStock`, which doubled the 🚫 and used the badge wording instead of the requested alert).
     - `public/assets/js/i18n.js` — new key `outOfStockAlert` in **both** tables: `"🚫 المنتج نفذ"` / `"🚫 Product is sold out"`, so an English page gets an English toast. `outOfStock` (badge text) untouched. Verified: esprima on all three files + i18n tables stay symmetric (252/252 keys, same order).
12. **Full security/quality audit (owner's template: report first, fix after approval) + approved Group-1 fixes**
    - Audit PASS 1 completed with **no criticals** (parameterized SQL, auth gates in both copies, HttpOnly/SameSite=Strict cookies, CSRF origin check, login rate limit, no secrets in code); findings delivered as tables (security S1–S6, dependencies, duplication D1–D4, refactor/reuse candidates, health H1–H6).
    - **Applied (owner-approved Group 1, behavior-changing on purpose):** **S1** — `POST /orders` in *both* `functions/api/[[path]].js` and `server/server.mjs` now validates `gpsCoordinates`: `lat`/`lng` must be finite numbers (`Number.isFinite`), otherwise the stored value is `null` (previously any input shape was persisted, which made the admin order-details modal throw on `gpsCoordinates.lat.toFixed(4)`); **H1** — `server/server.mjs` deactivation loop now guards `client.user &&` (an unauthenticated `/api/events` SSE client has `user === null`, which previously threw a 500 during account deactivation).
    - Verified: esprima on both touched files + 7-case logic simulation (normal cart payload preserved; object/string/null/missing/bool → `null`). A live smoke test could **not** run here (no Node runtime in this environment); `smoke.mjs` was prepared in the temp dir for the owner (9 checks incl. the H1 SSE scenario) — not committed to the repo.
    - **Owner declined (deliberately left unchanged):** S2 order rate-limit, S4 social-link scheme validation, R2 unused-i18n-keys cleanup, H2 cache-header policy — "not important, no danger".
    - **Report-only / on hold:** S3 ids inside `onclick` (wide refactor, admin-only source), S5 unescaped product text (admin-only source), H3/H4, D1 duplication — two *real* drifts found: local `server.mjs` seeds only 3 products vs 7 in `functions/`, and its orders cleanup never prunes old events (`eventsDeleted` hardcoded 0). Dependencies: zero npm deps to audit; `wrangler` remains unpinned (informational — npm unavailable in this environment).

### Session — 2026-10-04 (two-pass security audit + approved fixes, PBKDF2 upgrade, SQL aggregation)

1. **Stored-XSS hardening — guest order fields rendered in the admin UI**
   - `public/admin/js/admin.js` — new global `escapeHtml()` helper (top of file) escaping `& < > " '`; the notification list now renders `escapeHtml(n.text)`.
   - `public/admin/js/orders.js` — customer name (table row + details modal), delivery address, and notes now pass through `escapeHtml()` at every `innerHTML` sink.
   - `public/admin/js/customers.js` — customer name in the table and in the history-modal title now escaped.
   - Server-side caps added to **both** `functions/api/[[path]].js` and `server/server.mjs` on `POST /orders`: `customerName` ≤ 120 chars, `notes` ≤ 500, `address` ≤ 300 (each → `400` above the limit). **Behavior change**: values above these limits used to be accepted unbounded.
2. **Request body cap enforced while streaming** (`functions/api/[[path]].js` → `body()`): the 2 MB limit was previously checked only against the `Content-Length` header (skipped for chunked uploads); the body is now read chunk-by-chunk and aborted with `413` at 2 MB. An empty body now yields `{}` instead of a 500.
3. **Parity fixes in `server/server.mjs`**:
   - `POST /api/orders/cleanup` now requires `Date.parse(before)` to be valid (mirrors production; `2026-99-99` can no longer mass-delete orders via lexicographic comparison).
   - Product `data:` images longer than 1.5M chars are now rejected with `413` (mirrors production). The Node copy still has no `events` table, so `eventsDeleted` stays `0`.
   - Verified with the esprima routine above (all five touched files parse).
4. **Safe cleanups (pass 2, approved): error handling + per-isolate schema flag**
   - `public/assets/js/storefront.js` — `loadPageSpecificContent()` now wraps the original body (renamed `loadPageContent()`) in try/catch; new `showLoadError()` fills a still-empty or still-loading page container with a bilingual error box instead of hanging on "جاري تحميل الحلويات...". The three page-render calls inside are now `await`ed so render failures reach the catch. Filters/search handlers still call `renderCategoriesPage()` unawaited — on those re-renders existing content stays put on failure (intentional).
   - `public/admin/js/customers.js` and `reports.js` — the `TajAPI` fetches are wrapped in try/catch that renders an in-container error message (same inline style as the existing empty states) and returns; previously a failed load left a blank/silent view.
   - `functions/api/[[path]].js` — module-level `schemaReady` flag: `ensureSchema` + `seed` now run once per isolate instead of on every request (~4 fewer D1 reads per call). Both functions are idempotent and `ensureSchema` errors leave the flag false so the next request retries.
5. **Reflected search inputs escaped (S3 follow-up)**
   - The three admin search boxes re-render the typed query into `value="..."`: `orders.js` (`filters.search`), `customers.js` (`customerSearch`), `products.js` (`productSearch`) — all now pass through `escapeHtml()`. Same self-XSS pattern; source is the admin's own typing only (no URL/external input reaches these fields). Search behavior unchanged — a query containing quotes or angle brackets now round-trips as literal text instead of breaking out of the attribute.
6. **Password hashing upgraded (S8 follow-up) — per-hash PBKDF2 iterations** (`functions/api/[[path]].js`)
   - Hash format now carries the cost: **`iterations:salt:hash`** (new, e.g. `20000:…:…`) vs the legacy 2-part **`salt:hash`** (implicitly 10,000). `verifyPassword` accepts both, with a `1000..100000` guard on parsed values; `hashPassword` writes the new format with `PASSWORD_ITERATIONS = 20000` (2×).
   - **Why 20k and not the OWASP 600k**: local measurement gave 10k ≈ 4.1 ms, 60k ≈ 23 ms; the free plan allows only **10 ms CPU per invocation** and PBKDF2 counts toward it (workerd cannot interrupt BoringSSL mid-run), while workerd also **hard-rejects >100,000 iterations with an error**. 20k stays inside the budget even if Workers CPUs were as slow as the test machine. Because the count is stored per hash, raising it later (e.g. after a plan upgrade) is a one-constant change; old hashes keep verifying and are upgraded on their next login.
   - **Behavior changes**: every new password (seed admin, lazy env-admin creation at login, `POST /users`) is written in the new format; an existing legacy hash is transparently **re-hashed to 20k on the first successful login** (one `UPDATE` inside try/catch — if that upgrade write fails, the login still succeeds on the old hash). Login requests get ~4 ms extra CPU in the worst case. `server/server.mjs` untouched — it uses scrypt (memory-hard, different algorithm), so the two copies were never format-compatible. Verified with esprima.
7. **`/customers` + `/reports`: SQL aggregation + pagination (H4 follow-up)**
   - `functions/api/[[path]].js` + `server/server.mjs` — both endpoints used to load **every matching order row (full JSON) into memory** and aggregate in JS. Now `/customers` aggregates in SQL (`GROUP BY customer_phone`, `COUNT(*)`, cancelled-excluding `SUM(json_extract(data,'$.total'))`, latest-name/date taken from the `MAX(id)` row per SQLite's bare-column rule) with `LIKE` search pushed down and `page`/`limit` paging (default 50, cap 200). **Response shape changed**: `{customers, totalCount, totalPages, currentPage, limit}` instead of a bare array, and the embedded per-customer `orders` array (the real memory cost) was dropped. `/reports` now computes totals with `COUNT(*)`/`SUM(json_extract(...))` and the branch breakdown with `GROUP BY branch_id`; its response shape is unchanged. `GET /orders` gained an exact `?phone=` (`customer_phone=?`) filter for the history modal.
   - `public/admin/js/customers.js` — toolbar count uses `totalCount`; the table renders 50 customers per page with the same pagination bar style as the orders view (`goToPage`); searching resets to page 1. The history modal now loads on demand (customer via `getCustomers(phone)` with an exact-phone `find`, orders via `getOrders({phone}, 1, 1000)`) instead of piggy-backing on the list response, and gained a try/catch.
   - `public/assets/js/api.js` — `getCustomers(search, page, limit)` returns the new envelope in both remote and local-mock modes (the mock paginates in JS); `getOrders` forwards `phone` in both modes.
   - Unchanged: branch-user scoping, search semantics (name/phone `LIKE`), spend-excludes-cancelled, newest-first ordering, reports numbers/formula. `json_extract` is available on D1 and on Node's built-in SQLite. Verified with esprima.

**Audit status at the end of this session (2026-10-04)**
- The audit ran in two passes: first a full written report with worked examples (zero files touched), then fixes applied group-by-group only after explicit owner approval. All seven log items above are deployed and verified by the owner.
- Pass-1 inventory: 11 security findings (S1–S11), 3 duplication notes (D1–D3), 3 refactor notes (R1–R3), 2 reusable helpers (U1–U2 — `escapeHtml()` and the streamed `body()` now exist), 6 health checks (H1–H6).
- **Still open: S5 only** — see "Known intentionally-unchanged" below (`verifyPassword` plain string compare in the Functions copy; documented as practically unexploitable over the network). Everything else is either fixed (log items 1–7 + earlier sessions) or closed by decision: D3 (unifying Node scrypt with Functions PBKDF2) rejected, D1's three API copies are this repo's deliberate parity convention, R1/R2 accepted as-is.

### Session — 2026-10-03

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
   - `public/admin/js/orders.js` — **icon-only 🗑️ button** (compact `padding-inline:0.5rem`, `title` tooltip, red outline) rendered only when `role === 'admin'`, placed in `toolbar-actions` beside the export button; opens `openCleanupModal()` (date input + confirm in `runCleanup()` with an "export XLSX first" warning) and re-renders on success.
6. **Orders toolbar: export button is admin-only with a shorter label**
   - `public/assets/js/i18n.js` — `exportExcel` reworded to **"تصدير الطلبات" / "Export Orders"** (was "تصدير كشيت إكسيل (XLSX)" / "Export as Excel (XLSX)"). The key is used only by the orders page, so nothing else changed.
   - `public/admin/js/orders.js` — the export button moved **inside the same `role === 'admin'` block** as the cleanup icon, so branch accounts see an empty actions area; `bindToolbarEvents` already null-guards both buttons, so no JS runs for them.

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
- **Auth shape**: server routes before the auth gate in `functions/api/[[path]].js` (health, login/logout/me, events, catalogue lists + single GET, `GET /products/popular`, settings, `POST /orders`) are public by design — storefront guests depend on them.

## Known intentionally-unchanged items

- Security audit of 2026-10-04 — **findings deliberately left open**: `verifyPassword` uses a plain string compare in the Functions copy (practically unexploitable over the network; the Node copy already uses `timingSafeEqual`). *(Resolved on 2026-10-04: PBKDF2 iteration raise — log item 6; SQL aggregation + pagination for `/customers` and `/reports` — log item 7.)*

- `customers.js` empty-search row (`لا يوجد عملاء يطابقون البحث`) still Arabic-only — it was not part of the photographed modal and was left untouched on request.
- The English `calculationRule` text still appears in Arabic UI mode when data comes from the API (legacy behavior, accepted).
- Not translated by decision: top announcement bar, "تابعنا:" header, brand text in the mobile drawer, page `<title>`/meta, login screen, notification panel wording, and the `منتج مستورد` fallback product name.

© 2026 Taj El Khalig Sweets
