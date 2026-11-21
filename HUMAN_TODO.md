# Campus Connect — Human TODO

Items only a human can finish (accounts, money, legal identity, Console clicks). When you complete a step, paste the non-secret confirmation (or “done”) under **Paste back**. Never commit secrets into git.

**Your status (2026-11-21):** M0 confirmed. Local `.env`, CLI, Redis, and Console checklist treated as done. Hosting is **AWS** (not Render). **M1 local** verified (`/`, `/seller`, `/api/cc/config`, `/healthz`, SDK bundle). Still open for full M1 accept: AWS staging URL. Also open: domain, Live keys, email provider, section-15 confirms.

---

## Already available — local wiring (do before or during M1)

### 1. Create a local `.env` (never commit)

1. Copy `.env-template` → `.env` in the repo root (M1 will also add `.env.example` with Campus Connect vars).
2. Paste **Test** values:

| Variable | Where to get it | Paste into |
|----------|-----------------|------------|
| `REACT_APP_SHARETRIBE_SDK_CLIENT_ID` | Console → Build → Applications → Marketplace API app → Client ID | `.env` |
| `SHARETRIBE_SDK_CLIENT_SECRET` | Same app → Client secret | `.env` |
| `SHARETRIBE_INTEGRATION_CLIENT_ID` | Console → Build → Applications → Integration API app → Client ID | `.env` (M1+) |
| `SHARETRIBE_INTEGRATION_CLIENT_SECRET` | Same app → Client secret | `.env` (M1+) |
| `REACT_APP_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys → **Publishable** (test) | `.env` |
| `REACT_APP_MARKETPLACE_ROOT_URL` | Local: `http://localhost:3000` | `.env` |
| `REACT_APP_MARKETPLACE_NAME` | `Campus Connect` | `.env` |
| `ALLOWED_EMAIL_DOMAINS` | `sdsu.edu` | `.env` (M1+) |

3. **Stripe secret key:** paste into Sharetribe Console → Build → Payments / Stripe (Test), **not** into the repo.
4. Leave `REACT_APP_MAPBOX_ACCESS_TOKEN` empty (location search disabled).

**Paste back:** “Test `.env` filled” (do not paste secrets here).

---

## Still needed — blocks M1 deploy / M2 processes

### 2. Writable GitHub remote for this fork

`origin` points at the Campus Connect repo. `upstream` remains `https://github.com/sharetribe/web-template.git`. `main` tracks `origin/main`.

**Paste back:** https://github.com/rced1/campus-connect

### 3. Sharetribe CLI API key

CLI is installed and logged in as `r_ced@yahoo.com`. The personal API key lives in Console under the account menu → **Manage API keys** (not under Build → Applications). Commands take the marketplace id with `-m`.

Needed to push `cc-booking` / `cc-pickup` and search schemas in **M2**.

**Paste back:** CLI logged into Test marketplace `trialmarketplace7-test`.

### 4. Redis for local + staging

Local Redis is Memurai (Windows Redis-compatible service), running on `127.0.0.1:6379`, start type Automatic. `.env` has `REDIS_URL=redis://127.0.0.1:6379`. Staging Redis is **ElastiCache** (see §5).

**Paste back:** local Redis running yes.

### 5. AWS account + staging deploy

Required for M1 acceptance (“deployed to a staging URL”). Hosting decision: **AWS** (see `DECISIONS.md`). Default stack: ECS Fargate (web + worker) + ALB + ElastiCache Redis.

1. Confirm an AWS account you can use (billing enabled) and an IAM principal that can create ECS, ECR, ELB, ElastiCache, VPC/networking, and SSM/Secrets Manager resources.
2. In M1 the agent adds `infra/` (CloudFormation or CDK) for: ECR image, ECS cluster, web service (min 2 tasks), worker service (1 task), ALB + `/healthz`, ElastiCache Redis, env from SSM/Secrets.
3. Set staging env the same as local, plus `QR_SIGNING_SECRET` (32+ random bytes, base64), `SENTRY_DSN` (optional until M8), and `REDIS_URL` pointing at ElastiCache.
4. Point a staging hostname (ALB DNS or custom domain) at the load balancer; set `REACT_APP_MARKETPLACE_ROOT_URL` to that HTTPS origin.

**Paste back:** AWS account id (or alias) you want used, preferred region (default `us-west-2`), and staging base URL once live.

**M1 note (2026-11-21):** Local M1 acceptance is done without a staging URL. AWS deploy is deferred — does **not** block M2 (processes/CLI). Revisit before claiming full M1 DoD / before load tests.

### 6. Generate `QR_SIGNING_SECRET`

```bash
# PowerShell example
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Or OpenSSL: `openssl rand -base64 48`. Set in staging/local env only.

**Paste back:** “QR secret set in env” (not the value).

---

## Still needed — Console (after you confirm M0, before M2)

### 7. Follow `CONSOLE_SETUP.md` on Test

Do the numbered checklist in [CONSOLE_SETUP.md](CONSOLE_SETUP.md) on the **Test** marketplace: listing types, categories, fields, search schemas, access control, branding, commission, Stripe Connect, email notification toggles.

**Paste back:** checklist items you completed / skipped, and any Console error text.

---

## Still needed — email & support (before M3 e2e / M7 support forms)

### 8. Transactional email provider

1. Create Postmark or Resend (or Sharetribe’s built-in email if you prefer for MVP).
2. Confirm Sharetribe Console email is sending (sign-up verification).
3. For app support/report emails: set `EMAIL_PROVIDER_API_KEY` and `SUPPORT_INBOX` (e.g. your team inbox).

**Paste back:** provider name + `SUPPORT_INBOX` address.

### 9. Email verification in Test

Sharetribe sends verification emails. For Playwright e2e (M3), either:

- Use a Test inbox you can read (provider test stream / Mailosaur / Console user tools), or  
- Temporarily use operator tools to mark verified while documenting the e2e approach in `DECISIONS.md`.

**Paste back:** chosen approach for reading verify links in Test.

**M3 note (2026-11-21):** Auth UI + session + worker auto-approve are in code (`m3-accounts` PR). Full M3 e2e still needs a readable verify path (this §) and Console “Approve users who want to join” on. Local smoke: sign up with `@sdsu.edu`, verify email, confirm worker sets approved + `metadata.verified`, then buy/message gates unlock.

---

## Confirm in writing before Live (M9) — section 15

Reply here or in chat with yes/override for each:

| # | Item | Default in `DECISIONS.md` | Your confirmation |
|---|------|---------------------------|-------------------|
| C1 | Commission | 10% seller / 0% buyer | |
| C2 | Tickets policy | Only events seller/org hosts; form requires attestation checkbox | |
| C3 | Email sender | `Campus Connect <hello@yourdomain>` — supply real domain + mailbox | |
| C4 | Launch date | Mid-January 2027, first week of spring classes | |
| C5 | Terms of Service + Privacy Policy text | Needed for legal pages | Provide URLs or paste final copy |
| C6 | Minimum order $5 / USD / LA timezone | As default | |

---

## Later — Live only (M9)

Do **not** do these until M8 hardening passes and you explicitly OK Live work.

1. Upgrade / create Sharetribe **Live** marketplace; create Live Marketplace + Integration API apps.
2. Stripe **live** Connect keys → Live Console only; publishable key → Live env.
3. Production domain + DNS → `REACT_APP_MARKETPLACE_ROOT_URL`; SSL; HSTS.
4. Re-run `CONSOLE_SETUP.md` on Live.
5. Point worker at Live Integration API; rotate `QR_SIGNING_SECRET` for Live.
6. One real **$1** order, then refund; never delete other Live data.
7. Written OK before any **live-mode** load test against Live Sharetribe.

**Paste back (when ready):** Live marketplace name, production URL, “$1 test order refunded”.

---

## Optional / nice-to-have

- Sentry project → `SENTRY_DSN` / `REACT_APP_SENTRY_DSN`.
- Cloudflare (or CDN) in front of staging/prod.
- Plausible later (explicitly out of launch analytics).

---

## What blocks which milestone

| Milestone | Blocked on human items |
|-----------|-------------------------|
| M0 | Your confirmation of this list |
| M1 | §1 `.env`, §2 git remote, §4 Redis local, §5 AWS staging accept |
| M2 | §3 CLI, §7 Console setup |
| M3 | §8–9 email / verify path |
| M6–M7 | Stripe Test already available; support inbox §8 |
| M9 | All Confirm rows + Live § items |
