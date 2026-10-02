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
- `functions/api/[[path]].js` — same-origin Pages Functions API.
- `migrations/0001_init.sql` — D1 schema.
- `wrangler.jsonc` — Pages output and D1 binding.
- `server/server.mjs` — previous Node/SQLite server retained for reference; Cloudflare Pages uses the Functions API instead.

© 2026 Taj El Khalig Sweets
