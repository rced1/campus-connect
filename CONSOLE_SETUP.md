# Campus Connect — Console setup (Test)

Numbered click-by-click checklist for the **Sharetribe Test** marketplace. Do this **after** you confirm M0 (`HUMAN_TODO.md`), and **before** M2 process push acceptance.

Sharetribe Console UI labels move occasionally. If a path differs, use search in Console and note the actual path back in `DECISIONS.md`.

**Legend**

- **Human** — must click in Console.
- **CLI (M2)** — agent pushes via Sharetribe CLI when files exist; still verify in Console.
- Values are from the Implementation Brief §§6–7 and 15.

---

## 0. Preconditions

1. [ ] Logged into Console for the **Test** marketplace named for Campus Connect.
2. [ ] Stripe Connect **test** mode connected (secret key in Console, not in git).
3. [ ] Marketplace API + Integration API applications exist (credentials in local `.env`).

---

## 1. Access control (Human)

**Path:** Build / General → **Access control** (or Marketplace settings → Access control).

1. [ ] Marketplace visibility: **Public** (everyone can browse).
2. [ ] Enable **Approve users who want to join** (pending users can browse; cannot post listings or start transactions until approved).
3. [ ] Do **not** rely on Console for `@sdsu.edu` auto-approval — that is the events worker (`ALLOWED_EMAIL_DOMAINS`). Leave non-SDSU users pending for manual approve in Manage → Users.

---

## 2. Branding (Human)

**Path:** Build → Branding / Design (hosted assets) or General branding.

Apply for any remaining React pages and Console emails:

| Token | Value |
|-------|--------|
| Marketplace name | Campus Connect |
| Tagline | Your campus is full of talent. |
| Primary / Campus Cobalt | `#3157FF` |
| Background / Warm White | `#FAFAF7` |
| Ink | `#151515` |
| Coral | `#FF6B6B` |
| Lilac | `#B28CFF` |
| Butter | `#F6C945` |
| Sky | `#67C7FF` |
| Headlines font | Manrope |
| Product / body font | Inter |

SBB CSS already encodes these for `/campus` pages; keep Console aligned so React fallbacks and emails match.

---

## 3. Commission (Human) — Confirm before Live

**Path:** Build → Transactions → Commission (hosted `transactions/commission.json`).

1. [ ] Provider (seller) commission: **10%**.
2. [ ] Customer (buyer) commission: **0%**.
3. [ ] Currency: **USD**.
4. [ ] Confirm this matches what you want in Test; written Live confirmation stays in `HUMAN_TODO.md` C1.

---

## 4. Payments / Stripe (Human)

1. [ ] Stripe connected in **Test** mode.
2. [ ] Payouts / Connect onboarding enabled for providers (Sellers use React `/account/payments` for onboarding).
3. [ ] Card payments enabled; no raw card data in Campus Connect code (Stripe Elements only).

---

## 5. Transaction processes (CLI in M2, then Human verify)

**CLI (M2):** From repo `ext/transaction-processes/`:

1. [ ] Create/push **`cc-booking`** (fork of `default-booking` with brief §7 changes).
2. [ ] Create/push **`cc-pickup`** (fork of `default-purchase` with brief §7 changes).
3. [ ] Leave **`default-download`** and **`default-inquiry`** as Sharetribe defaults (already in template).
4. [ ] Create aliases: `cc-booking/release-1`, `cc-pickup/release-1` (and ensure download/inquiry `release-1` aliases exist).

**Human verify in Console → Build → Transaction processes:**

5. [ ] `cc-booking` shows `confirm-payment-instant`, `provider-cancel`, complete at booking-end + **P1D**.
6. [ ] `cc-pickup` shows accept / decline / mark-ready / privileged `complete-pickup` / auto-complete / provider-cancel / reviews.
7. [ ] Email notification templates for new CC transitions exist (or are toggled on once uploaded).

---

## 6. Listing types (Human; wire after processes exist)

**Path:** Build → Listings → Listing types (or Content → Listing types).

Create these types with the exact `listingType` / process / unitType mapping:

| listingType id | Label | Process alias | unitType | Notes |
|----------------|-------|---------------|----------|--------|
| `service` | Service | `cc-booking/release-1` | `fixed` (preferred) or `hour` | Session length via priceVariants / bookingLengthInMinutes where used; one seat |
| `ticket` | Event ticket | `cc-booking/release-1` | `fixed` | Availability: exception at event time with seats = capacity; empty weekly plan; `availabilityType: multipleSeats` |
| `product` | Student-made product | `cc-pickup/release-1` | `item` | `stockType`: `multipleItems` (or `oneItem`); campus pickup |
| `download` | Digital download | `default-download/release-1` | `file` | Protected file on listing |
| `sublease` | Sublease | `default-inquiry/release-1` | `inquiry` | Price as text in publicData |
| `store-contact` | Store contact (hidden) | `default-inquiry/release-1` | `inquiry` | One per store; **exclude** from all public listing queries (`pub_listingType`) |

Minimum order / price floors: enforce **$5.00** minimum in app + line-items validation (M6), not only Console.

---

## 7. Categories (Human)

**Path:** Build → Listings → Categories (`listing-categories` asset).

Create (order as shown):

1. Learn  
2. Create  
3. Beauty  
4. Tech  
5. Lifestyle  
6. Help  
7. Events  
8. Student-made  
9. Textbooks  
10. Dorm  

Local SBB UI keeps a **dot colour + icon map** keyed by category id/name in campus code (M4). Prototype had Furniture/Clothing — those are **not** Console categories; use Student-made / Dorm instead (`DECISIONS.md`).

---

## 8. Listing fields / publicData (Human)

**Path:** Build → Listings → Listing fields (extended data).

Ensure these **public** fields exist (types in brackets). Exact Console field keys should match what search schemas and the app read:

| Key | Type | Used by |
|-----|------|---------|
| `listingType` | enum | All (also often built-in listing type) |
| `transactionProcessAlias` | enum/text | All |
| `unitType` | enum | All |
| `categoryLevel1` | enum | All |
| `emoji` | text | All |
| `accent` | enum: coral, lilac, butter, sky, mint | All |
| `meeting` | text | Services, products, tickets |
| `availabilityNote` | text | Short human line |
| `tag` | text (optional) | Badge |
| `instantBook` | boolean | Services |
| `condition` | enum: New, Made to order | Products |
| `host` | text | Tickets |
| `eventStart` / `eventEnd` | datetime (ISO) | Tickets |
| `location` | text | Tickets |
| `dates` / `place` / `rentText` | text | Subleases |

Also configure any required built-in title/description/price per type.

**User publicData** (profile fields / extended data as Console allows): `handle`, `campusLine`, `certification`, `responseTime`, `accent`, `store{…}`, `reviewReplies`.  
**User privateData:** settings, sellerSettings, seen, notificationsSeenAt, saves — typically written only by the app; create fields if Console requires declarations.  
**User metadata (operator/Integration only):** `verified`, `awayPausedListingIds`.

---

## 9. Search schemas (CLI preferred in M2, Human verify)

Index **public data** for keyword search; **disable location search**.

| Schema key | Type |
|------------|------|
| `listingType` | enum |
| `categoryLevel1` | enum |
| `instantBook` | boolean |
| `accent` | enum |

**CLI (M2):** push schemas if the CLI in this environment supports it; otherwise Human creates them in Console → Search / Listing search.

1. [ ] Keyword search **on**.
2. [ ] Location / map search **off** (no Mapbox required).

---

## 10. Email notifications (Human)

**Path:** Build → Emails / Notifications.

1. [ ] Keep Sharetribe auth emails **on** (sign-up, verify, password reset).
2. [ ] After CC processes are pushed, enable templates for: new booking/instant booking, accept/decline, ready for pickup, cancelled, review-period, download receipt as applicable.
3. [ ] Tone: short, friendly, plain — “Campus Connect” voice (templates authored in repo under `ext/transaction-processes/*/templates`).

Sender address: set when domain is ready (`HUMAN_TODO.md` C3). Until then, Console default / provider sandbox is fine for Test.

---

## 11. Content & legal (Human)

1. [ ] Terms of Service and Privacy Policy pages — paste final text or URLs when available (blocks polished M9; stub OK in Test).
2. [ ] Include meetup safety rules and “never pay outside Campus Connect” in Terms (brief §12).
3. [ ] Support inbox address configured for operator replies (app emails use `SUPPORT_INBOX`).

---

## 12. Operator tools

1. [ ] Confirm **Login as user** redirect URI is `{MARKETPLACE_ROOT_URL}/api/login-as`.
2. [ ] Practice approving a pending non-SDSU user under Manage → Users (SDSU users should be auto-approved by the worker once M3 is live).

---

## Checklist summary — when Test is ready for M2

- [ ] Access control: public + user approval on  
- [ ] Branding colours/fonts/name/tagline set  
- [ ] Commission 10% / 0% USD  
- [ ] Stripe Test connected  
- [ ] `cc-booking` + `cc-pickup` pushed and aliased (CLI)  
- [ ] Six listing types wired  
- [ ] Ten categories created  
- [ ] Public fields + search schemas  
- [ ] Keyword on / location off  
- [ ] Auth emails on  

Paste completion notes into `HUMAN_TODO.md` §7.
