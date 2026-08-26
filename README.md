# Tejal Desae — Website Guide

A plain‑English handbook for running and editing this website. No coding needed for the everyday stuff.

---

## ⚡ Start here (the only 3 things that matter)

| # | Task | Where | Urgent? |
|---|------|-------|---------|
| 1 | **Paste your 2 Razorpay payment links** | [Section 3](#3--add-your-razorpay-links) | ✅ Yes — payments don't work until you do |
| 2 | **Replace the sample testimonials** | [Section 5](#5--edit-text-photos--details) | ⚠️ Before launch |
| 3 | **(Optional) Turn on the backend** to save quiz sign‑ups | [Section 7](#7--the-backend-optional) | Only if you want to collect leads |

The site is **already live on Vercel** and works for visitors right now. The three items above are what's left.

---

## 📖 Contents

1. [What the website is](#1--what-the-website-is)
2. [How visitors move through it](#2--how-visitors-move-through-it)
3. [Add your Razorpay links](#3--add-your-razorpay-links)
4. [Change the price](#4--change-the-price)
5. [Edit text, photos & details](#5--edit-text-photos--details)
6. [How it's built (optional)](#6--how-its-built-optional)
7. [The backend (optional)](#7--the-backend-optional)
8. [The admin dashboard](#8--the-admin-dashboard)
9. [Publish your changes](#9--publish-your-changes)
10. [Go‑live checklist](#10--go-live-checklist)
11. [Help & FAQ](#11--help--faq)

---

## 1 · What the website is

A calm, editorial site for **Tejal Desae**, a wealth & identity mentor.

**The pages:**

| Page | File | What it does |
|------|------|--------------|
| Home | `index.html` | The main scrolling page: story, programs, about, stories, FAQ, contact |
| Wealth Expansion Code | `wealth-expansion-code.html` | Program page (5 Pillars / 90 days) + ₹999 call booking |
| Business Expansion Code | `business-expansion-code.html` | Program page (8 Pillars, founders) + ₹999 call booking |
| The Quiz | `assessment.html` | Free 8‑question "Expansion Quotient" |
| Full Result | `report.html` | The detailed results page |
| Privacy Policy | `privacy-policy.html` | Legal page |

> **Old program pages** (`money-energetics.html`, `wealth-oracle.html`, etc.) are kept in the folder but **not shown** on the site. Ignore them — they're just a backup in case you want that content later.

---

## 2 · How visitors move through it

```
Homepage
   │
   ├─► "Find out your Expansion Quotient"  →  Quiz (FREE)  →  Result
   │
   └─► "Programs"  →  pick a path
                         │
              ┌──────────┴──────────┐
        Wealth Expansion      Business Expansion
              │                     │
        "Book my call — ₹999"  (both open Razorpay in a new tab)
              │
      after paying, Razorpay returns them to the page, which unlocks:
         • not done the quiz yet →  "Find your Expansion Quotient →"
         • already done it       →  "See your results →"
```

**The one thing to remember:** the quiz is always **free**. The **₹999 is only to book a call**. Paying then nudges them into the free quiz so the call starts ahead.

---

## 3 · Add your Razorpay links

Both "Book my call" buttons currently point to a placeholder and **won't take money** until you do this. You'll paste one link into each of the two program files.

### Step 1 — Make the links in Razorpay

For **each** call (Wealth, then Business):

1. Razorpay Dashboard → **Payment Pages** (or Payment Links).
2. Create one for **₹999**.
3. Set its **"redirect after payment"** (a.k.a. success/callback URL) to the matching address:
   - Wealth → `https://tejaldesae.com/wealth-expansion-code.html?paid=1`
   - Business → `https://tejaldesae.com/business-expansion-code.html?paid=1`
   > The `?paid=1` at the end is what unlocks the quiz automatically after payment. Use your real domain.
4. Copy the public link (looks like `https://rzp.io/xxxx`).

### Step 2 — Paste each link into its file

In **`wealth-expansion-code.html`**, find this line (there's a comment above it pointing it out):

```html
<a class="btn btn-ch" id="payBtn" href="https://rzp.io/REPLACE-WITH-YOUR-9-99-LINK" ...>Book my call — ₹999 →</a>
```

Replace only the `https://rzp.io/REPLACE-WITH-YOUR-9-99-LINK` part with your **Wealth** link.

Do the same in **`business-expansion-code.html`** with your **Business** link.

Save, then [publish](#9--publish-your-changes). Done.

> **No redirect option in Razorpay?** No problem — under the button there's a small *"Completed payment? Continue →"* link the visitor can tap to unlock the quiz themselves.

---

## 4 · Change the price

Price is currently **₹999**. To change it, open **both** program files and use **Find & Replace** on `₹999`. It appears in 4 spots per file (description, top button, big price number, pay button). Make sure your Razorpay page charges the same amount.

---

## 5 · Edit text, photos & details

Open any file in a text editor, change the words, save, [publish](#9--publish-your-changes). Common edits:

| I want to change… | Where |
|-------------------|-------|
| **Testimonials** (they say "Sample · replace") | `index.html` → "Client stories" section |
| **Email / city / hours** | Footer of every page — search for `hello@tejaldesae.com` |
| **Instagram / YouTube / LinkedIn** | `index.html` footer |
| **Tejal's homepage photo** | Replace `images/tejal-hero.jpg` (keep the same name, portrait shape) |
| **Tejal's about photo** | Replace `images/tejal-about.jpg` |
| **Brand colours (green/gold)** | `css/variables.css` — change once, updates everywhere |

> The abstract artwork (sunrise, arches, rings) is drawn in code — `images/art-*.svg`. Leave it unless you want it redesigned.

---

## 6 · How it's built (optional)

Plain HTML, CSS and JavaScript — no framework, no build step. Fast and easy to host.

```
*.html                pages
css/variables.css     brand colours & fonts
css/home-2026.css     the main styling
js/home.js            animations, mobile menu, contact form, payment unlock
images/               photos + hand‑drawn SVG artwork
server/               OPTIONAL backend (Section 7) — not needed for the site to work
vercel.json           hosting + security settings
```

---

## 7 · The backend (optional)

**Skip this and the site still works.** Without it, the quiz still runs and shows results — it just doesn't **save** anyone's details for you.

**Turn it on when you want to:** collect every quiz‑taker's name/email/phone into a database, and view/export them from a private dashboard.

### Why not on Vercel?
Vercel serves **static pages only**. The backend is a small **Node app + database**, which needs a host that runs Node. Easiest option: **Railway** (it includes a free database). Render works too.

### Easiest setup — put everything on Railway

The backend can serve the website too, so one place runs it all:

1. Sign up at **railway.app** (with GitHub).
2. **New Project → Deploy from GitHub repo** → choose this repo.
3. **+ New → Database → PostgreSQL** (creates the database).
4. App service → **Settings → Root Directory** → set to `server`.
5. App service → **Variables** → add:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Reference the Postgres you just made (Railway has a button) |
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | a long random string (see below) |
   | `CSRF_SECRET` | another long random string |
   | `ALLOWED_ORIGINS` | `https://tejaldesae.com` |
   | `ADMIN_EMAIL` | your dashboard login email |
   | `ADMIN_PASSWORD` | a strong dashboard password |

   Make a random string by running (needs Node): `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

6. One‑time database setup — in Railway's shell, from the `server` folder:
   ```
   npm install
   npm run db:migrate   # creates the tables
   npm run db:seed      # creates your admin login
   ```
7. Open the Railway URL — the site loads **and** the quiz now saves sign‑ups.
8. Point `tejaldesae.com` at Railway (Settings → Domains).

> **Want to keep the site on Vercel and only host the backend on Railway?** Possible, but it needs small code + cookie changes so two domains can talk. The single‑Railway setup above is simpler and needs no code changes — recommended.

### Test it on your own computer
From the `server` folder:
```
cp .env.example .env     # then fill in the values
npm install
npm run db:migrate
npm run db:seed
npm start
```
Then open `http://localhost:3000` (site) and `http://localhost:3000/admin` (dashboard).

---

## 8 · The admin dashboard

Once the backend is on, go to **`/admin`** on your site (e.g. `https://tejaldesae.com/admin`) and log in with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

You can:
- See **every lead** (name, email, phone, program, quiz pattern, date)
- Open a lead for their full result
- **Export everything to CSV** (opens in Excel / Sheets)
- View a simple activity log

Log out when done, and keep the password private — anyone with it can see your leads.

---

## 9 · Publish your changes

The site is connected to **Vercel** (project **tejal-desae**).

- **Automatic:** if the project is linked to GitHub, just push your changes — Vercel republishes in about a minute.
- **Manual:** from the project folder, run `npx vercel --prod`.

Already set up for you in `vercel.json`: security headers, HTTPS, image caching, and a rule that keeps your private `server/` files (passwords, secrets) **off** the public site.

---

## 10 · Go‑live checklist

- [ ] Pasted **both** Razorpay links, redirects set to `…?paid=1` (§3)
- [ ] Price reads **₹999** everywhere and matches Razorpay (§4)
- [ ] Replaced the **sample testimonials** (§5)
- [ ] Footer **email & social links** correct (§5)
- [ ] *(Optional)* Backend on, `/admin` login works (§7–8)
- [ ] Privacy Policy reviewed by someone qualified (it's good‑faith, not legal advice)
- [ ] Re‑published after edits (§9)

---

## 11 · Help & FAQ

**Quiz shows a result but I got no lead.** Normal until the backend is on (§7). The site never breaks for the visitor — it just can't save the lead yet.

**Payment button does nothing / broken page.** The Razorpay placeholder isn't replaced yet (§3).

**Paid, but the quiz didn't unlock.** Best fix: set your Razorpay redirect URL to `…?paid=1` (§3, Step 1‑3) so it unlocks on its own. Otherwise the visitor taps the small **"Weren't redirected back after paying? Click here to continue"** link on the booking card.

**Is it mobile‑friendly?** Yes — every page is built and tested for phones.

**Change the colours?** In `css/variables.css`, then re‑publish.

---

*Keep this file with the project — it's the handover guide.*

---

## The assessment

The Expansion Quotient is open to anyone at **tejaldesae.com/assessment**. It
is the free lead magnet the page itself promises ("Free, always. You'll never
pay to see your result"), and it is also the prep step for a booked call —
the thank-you page links to it after payment.

- **Results live in the visitor's own browser.** `assessment.html` writes
  `tejal_eq_done`, `tejal_scores`, `tejal_top_type` and `tejal_lead_name` to
  localStorage; `report.html` reads them back. So someone can return to
  **tejaldesae.com/report** days later on the same browser and their result
  is still there, with no server involved.
- **A new device shows nothing**, because there is nowhere else the result
  is kept. `report.html` handles that by sending them to the assessment
  rather than rendering an empty page.

### Emailing the link to people who paid

There is no mailer in this repo, so the email has to come from a tool that
already sends one. Two places, both dashboard settings rather than code:

1. **The booking confirmation** from the scheduling app at
   `expansioncode.tejaldesae.com`, sent when they pick a slot. This is the
   natural home for it — "before we speak, take this".
2. **The Razorpay payment confirmation**, if your plan lets you customise it.

The link to paste in either is just:

    https://tejaldesae.com/assessment

### The magic-link backend (built, not wired up)

`api/` holds a complete Razorpay-webhook → signed-token → emailed-link
system, from when the plan was to gate these pages. Nothing calls it: the
assessment is open and the report reads localStorage. It is listed in
`.vercelignore` so it does not deploy. Delete `api/`, `package.json`,
`.env.example` and `js/gate.js` if you are sure you never want it.
