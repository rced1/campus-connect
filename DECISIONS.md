# Campus Connect — Decisions (M0)

Audit date: 2026-11-20. Base: Sharetribe Web Template **v12.8.0**. Prototype: [Campus-Connectsd/Sellers-Based-on-Buyers](https://github.com/Campus-Connectsd/Sellers-Based-on-Buyers). Spec: Campus Connect Implementation Brief (Nov 20, 2026).

When the brief and current Sharetribe docs disagree, **docs win**. When the brief and current template/SBB code disagree about product intent, **the brief wins** and we adapt the code. Cheap defaults are recorded here so later milestones do not re-litigate them.

---

## Architecture locks (follow the brief)

1. **One repo:** this web-template fork hosts SBB under `/campus/` (moved in M1). Do **not** port SBB to React.
2. **Data flow stays** `api.js → store.js → views → actions → app.js`. Views never call the network. Keep api method names/args/return shapes unless the brief §9 renames them.
3. **New server code** lives in `server/api/cc/*` and `server/cc/*`. Edit existing template files only where the brief requires it, each edit marked `// CC:`.
4. **Four running parts:** static campus pages, stateless web (2+), one events worker, Redis. Sharetribe holds marketplace data; Stripe holds money.
5. **Public catalog** via cached `GET /api/cc/catalog` (and related read routes). Per-user reads/writes use the browser Marketplace SDK with the shared session cookie. Live updates via SSE (`GET /api/cc/live`), not Sharetribe polling.
6. **Serving:** `GET /` → `campus/index.html`; `GET /seller` → `campus/seller.html`; deep links return the right HTML shell. Other paths fall through to the React app. Keep React pages for `/reset-password`, `/verify-email`, `/account/payments` (+ Stripe return). Operator login-as stays on the template’s **API** routes (`/api/initiate-login-as`, `/api/login-as`) — there is no React `/login-as` page in v12.8.0 (brief wording was imprecise; we keep the working API flow).
7. **Health check:** add `GET /healthz` (process up + Redis reachable). Keep existing `GET /_status.json` for compatibility.

---

## Brief vs template code

| Topic | Brief / intent | v12.8.0 today | Decision |
|--------|----------------|---------------|----------|
| Campus static + `/api/cc/*` | Serve SBB; mount CC routes | Not present | Add in M1+ |
| Redis | Required for cache, rate limit, SSE pub/sub, worker cursor | Not used (in-memory LRU for asset proxy only) | Add Redis in M1; fall back to short in-memory LRU if Redis is down |
| Privileged transition allow-list | Server allow-list in `initiate-privileged` / `transition-privileged` | No server allow-list; Console `:privileged?` + client `isPrivileged()` | **Add** the brief’s server allow-list in M2 (defense in depth). Keep client `isPrivileged` for React fallbacks |
| Processes | `cc-booking`, `cc-pickup`; reuse `default-download`, `default-inquiry` | Only stock defaults (+ negotiation) | Author and CLI-push in M2; register in `src/transactions/transaction.js`; extend `delete-account.js` |
| Booking complete timing | booking-end + **P1D** | `default-booking` uses **P2D** | Use **P1D** in `cc-booking` only |
| Instant book / tickets | `confirm-payment-instant` (confirm + accept-booking + capture) | Not in default-booking | Add in `cc-booking`; server allows only for tickets or `publicData.instantBook === true` |
| Provider cancel booking | `provider-cancel` from accepted | Operator cancel only | Add in `cc-booking` |
| Product pickup flow | Accept/decline → mark-ready → privileged `complete-pickup` + payout | Purchase: confirm captures immediately → purchased → mark-delivered / mark-received | New `cc-pickup` process per brief §7 |
| Line items reject unsellable | Reject wrong type/state | Preview endpoint only | Extend `transaction-line-items.js` in M2/M6 |
| Sitemap | Listings + stores | Template React sitemap | Replace listing/search React entries with campus sitemap later (M4+) |

---

## Brief vs Sharetribe docs (verified Nov 2026)

| Topic | Brief claim | Docs | Decision |
|--------|-------------|------|----------|
| Payment / booking / stock action names | `stripe-confirm-payment-intent`, `accept-booking`, `stripe-capture-payment-intent`, stock reservation actions, `stripe-create-payout` | [Transaction process actions](https://www.sharetribe.com/docs/references/transaction-process-actions/) — names match | Use brief action names; re-check ordering rules when writing `process.edn` in M2 |
| Events cursor | `events.query({ startAfterSequenceId })` | [Reacting to events](https://www.sharetribe.com/docs/how-to/events/reacting-to-events/) — confirmed | Persist cursor in Redis `cc:events:cursor` |
| SDSU auto-approval | Worker: verified email + domain in `ALLOWED_EMAIL_DOMAINS` → `users.approve` + `metadata.verified` | Console “Approve users who want to join” has **no** built-in email-domain auto-approve; Integration API has `users.approve` | Enable Console user approval; **custom worker** implements domain rule (brief is correct) |
| Image variants | `listing-card`, `listing-card-2x`, `square-small2x` | Template configures `listingImage.variantPrefix: 'listing-card'`; built-in `square-small` / `square-small2x` exist; card 2x is the prefixed scaled variant | Request variants the template already configures; map in `campus/shared/mappers.js`. If a named variant is missing in Test, define via `imageVariant.*` query params and note here |
| Event retention | 7 days Test / 90 days Live | Docs: history is limited; exact windows can change by plan | Treat brief windows as planning targets; alert if worker downtime > 2 days |
| Instant booking pattern | confirm + accept + capture in one transition | Docs + Sharetribe instant-booking examples support combining confirm/accept/capture | Keep brief’s `confirm-payment-instant` design |

No expensive “stop and ask” conflicts found for process/money shape beyond what the brief already specifies. Open **Confirm** items (commission, tickets policy, email sender, launch date) stay in `HUMAN_TODO.md` until written confirmation before Live (M9).

---

## Brief vs SBB prototype

| Topic | SBB today | Brief | Decision |
|--------|-----------|-------|----------|
| Categories | Learn, Create, Beauty, Tech, Lifestyle, Help, Events, **Furniture**, **Clothing**, Textbooks | Learn…Events, **Student-made**, Textbooks, **Dorm** | Console uses **brief** list. Local dot/icon map keys by category id/name; remap Furniture/Clothing → Student-made (or Dorm) when seeding demos only |
| Store id | Separate string (e.g. `maya-makes-photo`) | Store id = user id | Mappers expose `store.id === author.id`; drop prototype store ids |
| Listing discriminator | `kind`: service / product / ticket | `publicData.listingType` + process alias | `toListing` maps Sharetribe → SBB `kind` for views |
| Auth | Always “signed in” as mock buyer/seller | Real sign-in/up, pending approval, verify email | New `campus/shared/auth.js` + views (M3) |
| Checkout | Demo confirm, fake cards in `addPaymentMethod` | Stripe Elements + privileged initiate/confirm | Replace in M6; new signatures per §9 |
| Money | Dollars (numbers) in UI | Sharetribe Money (cents) on the wire | One helper: cents ↔ dollars; never float totals to the server |
| Session handoff | `sessionStorage` + `keepDemoData` | Deleted | Remove in M7 when mocks go; mode switch becomes plain `/` ↔ `/seller` links |
| Out features | Chores, ticket board, quick-sell, calendar connect, premium, withdraw, reschedule, buyer sell form | Flagged Out | `campus/shared/flags.js` default off; remove buyer sell form; hide calendar/premium |
| Content boards | Jobs/school services/agents/apartments in mock | `server/content/campus.json` + `GET /api/cc/content` | Jobs become content (no `postJob`); housing stays real listings (`sublease`) |
| XSS gaps cited in brief | seller attention title / conversation name | Partial: many fields use `escapeHtml`; still unsafe patterns (e.g. inbox empty-thread copy interpolates `active.name` without escape; emoji/accent class names; `framedMedia` alts) | Full `${…}` audit in M8; escape at every user-sourced interpolation |
| Routing | No History API | `pushState` deep links | Add in M3 with auth screens |
| `getSession` shape | `{ userId }` only | Richer session object (§9) | Expand return shape in M3; keep `userId` key |

### SBB `api` methods to keep / change / remove (for M4–M7)

**Keep (rewrite bodies):** `getSession`, `signOut`, `getCategories`, `getSchoolServices`, `getAgents`, `getApartments`, `getSellers`, `getStores`, `getListings`, `getAvailability`, `createListing`, `updateListing`, `duplicateListing`, `deleteListing`, `getJobs`, `getHousing`, `postHousing`, `getAccount`, `updateAccount`, `getPaymentMethods`, `addPaymentMethod` (new signature), `removePaymentMethod`, `getOrders`, `placeOrder` (split with `startCheckout`), `getConversations`, `openConversation`, `sendMessage`, `markConversationRead`, `getNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `createSupportCase`, `submitReport`, `getSellerOrders`, `updateOrderStatus`, `requestReview`, `scanTicket`, `getListingStats`, `getAnalytics`, `getReviews`, `replyToReview`, `getSellerSettings`, `updateSellerSettings`, `getSchedule`, `updateSchedule`, `updateSellerProfile`, `updateStore`, `getPayouts`, `subscribe`.

**Add:** `signIn`, `signUp`, `requestPasswordReset`, `resendVerification`, `getListing`, `startCheckout`, `leaveReview`, `getOrderQr`, `getMessages`, `getDeals`, `toggleSave`.

**Remove:** `getChores`, `postChore`, `offerOnChore`, `approveChore`, `payForChore`, `getTicketPosts`, `postTicket`, `sendTicketMessage`, `postJob`, `setDefaultPaymentMethod`, `rescheduleOrder`, `withdraw`, `updatePayoutMethod`, `getCalendar`, `connectCalendar`, `disconnectCalendar`, `keepDemoData`.

---

## Section 15 defaults (in effect until written override)

| Decision | Default |
|----------|---------|
| Commission | 10% seller / 0% buyer (Test). **Confirm before Live** |
| Minimum order | $5.00 |
| Currency / locale / TZ | USD, `en-US`, `America/Los_Angeles` |
| Browse | Public |
| Buy / sell / message | Approved users; `@sdsu.edu` auto-approved via worker |
| Tickets | Host/org attestation checkbox required. **Confirm before Live** |
| Store messaging | On, via hidden `store-contact` listing when store opens |
| Booking window | 60 days; 30-minute starts |
| Product request expiry / pickup auto-complete | 3 days / 3 days after ready |
| Max seats / items per order | 10 / 10 |
| Images per listing | 8 |
| SSE fallback | Refresh own orders/messages every 60s while visible if SSE down |
| Email sender | `Campus Connect <hello@yourdomain>` placeholder. **Confirm** |
| Launch | Mid-January 2027. **Confirm** |
| Analytics | Server metrics + credit counters only at launch |
| Language | English only |

---

## Dependencies

Adds require a one-line reason here. Prefer template-shipped packages over new libraries.

| Package | Why |
|---------|-----|
| `ioredis` | Redis client for cache, rate limit, SSE pub/sub, worker cursor (brief §8/§11). |
| `esbuild` (dev) | Bundle `sharetribe-flex-sdk` into `campus/vendor/sharetribe-sdk.js` without a second Webpack config. |

### M2 process notes (2026-11-21)

- `cc-booking` and `cc-pickup` created on Test (`trialmarketplace7-test`) as version 1 with aliases `release-1`.
- Search schemas pushed: `listingType`, `categoryLevel1`, `instantBook`, `accent` (public). `listingType` may already exist from Console (409 on first set is OK).
- Full end-to-end booking + pickup via SDK (with Stripe) is deferred to **M6** when checkout exists; M2 verifies processes via CLI + unit/allow-list tests.
- `cc-pickup` uses state name `cancelled` (brief spelling); provider cancel is two transitions (`provider-cancel-from-accepted` / `from-ready`) because EDN needs one source state per transition.

Expected later:

- **Playwright / k6**: e2e and load tests (M8).
- Small **QR decode** fallback library only if `BarcodeDetector` is insufficient (M6) — prefer built-in first.

---

## Git / remote

- Workspace `origin` currently points at `https://github.com/sharetribe/web-template.git`.
- Before M1 PRs: point a writable remote at **your** fork/org repo (or add `upstream` = Sharetribe and `origin` = Campus Connect). Record the chosen remote URL in the M1 PR description.
- Never commit secrets (`.env`, Stripe secret, Integration secrets, CLI key, `QR_SIGNING_SECRET`).

---

## Hosting (human override 2026-11-21)

**AWS instead of Render** (brief default was Render).

Default stack for M1+ (same shape as the brief: 2+ stateless web, 1 worker, managed Redis):

| Role | AWS service |
|------|-------------|
| Web (Node/Express, autoscaled 2–6) | **ECS Fargate** service behind an **Application Load Balancer** |
| Events worker (1 task) | **ECS Fargate** separate service in the same cluster |
| Redis | **ElastiCache** (Redis), persistence on for the worker cursor |
| Images / optional CDN | ALB + optional **CloudFront** later |
| Secrets / env | **SSM Parameter Store** or **Secrets Manager** (never in git) |
| Infra as code in repo | `infra/` (CloudFormation or CDK) — **not** `render.yaml` |

Sizing and exact CPU/memory follow brief §11 budgets; finalize in M1 IaC + RUNBOOK (M8–M9).

---

## M0 non-decisions (deferred)

- Exact ECS task sizes and whether to put CloudFront in front at launch: default to brief §11; finalize in `infra/` (M1) / RUNBOOK (M8–M9).
- Hosted translation/branding assets vs local CSS variables: SBB CSS already encodes brand; Console branding for any remaining React pages.
- Whether Test marketplace already has listing types — human fills Console per `CONSOLE_SETUP.md` after M0 confirm, before M2.
