# tejaldesae.com — How to Edit Content

A quick guide to changing text, images, and settings on the site without touching any logic.

---

## 📂 File Map

| What you want to change | File to edit |
|------------------------|-------------|
| Homepage copy, hero, testimonials, FAQ | `index.html` |
| Wealth Expansion Code page | `wealth-expansion-code.html` |
| Business Expansion Code page | `business-expansion-code.html` |
| Privacy Policy | `privacy-policy.html` |
| Terms & Conditions | `terms.html` |
| Refund & Cancellation Policy | `refund-policy.html` |
| Assessment questions & flow | `assessment.html` |
| Report archetypes & CTA | `report.html` |
| Colours, fonts, spacing | `css/variables.css` |
| Homepage layout & animations | `css/home-2026.css` |
| Counter animation & nav logic | `js/home.js` |
| Contact form submission logic | `js/lead-service.js` |

---

## ✏️ Editing Text on the Homepage

### Hero Headline & Subline
Open `index.html`, search for `<!-- ═══════════ HERO ═══════════ -->`.

```html
<h1 data-split>The era of quiet excellence is <b>over</b>.</h1>
```
Change the text between the tags. The `<b>` tag makes a word **bold**.

```html
<p class="sub reveal reveal-d1">We'll show you exactly <b>why you go quiet</b>...</p>
```

### Testimonials (Client Stories)
Search for `<!-- ═══════════ STORIES ═══════════ -->` in `index.html`.

Each testimonial is a `<div class="story">`:
```html
<div class="story reveal reveal-d1">
  <p>"Your quote text here ❤️✨"</p>
  <div class="by">Client · Wealth Expansion Code</div>
</div>
```
- Edit the text inside `<p>"..."</p>`
- Edit the attribution inside `<div class="by">...</div>`

### Stat Numbers (Shape of the Work)
Search for `<!-- ═══════════ THE FIGURES ═══════════ -->` in `index.html`.

```html
<div class="fg-n" data-count="25" data-suffix="">0</div>
```
- `data-count="25"` → the number it counts up to
- `data-suffix="+"` → adds a "+" after the number
- The label below: `<div class="fg-l">Years Leading Inside<br>Fortune 500</div>`

### FAQ Questions
Search for `<!-- ═══════════ FAQ ═══════════ -->` in `index.html`.

```html
<details>
  <summary>Who is this for?</summary>
  <p>Your answer text here.</p>
</details>
```
- `<summary>` = the question (clickable header)
- `<p>` inside = the answer (shown when expanded)
- To add a new FAQ: copy an existing `<details>` block and paste it below

### Contact Form Response Time
Search for `You'll hear back within` in `index.html`:
```html
<b>You'll hear back within 24–48 hours, Mon–Fri.</b>
```

---

## 🖼️ Changing Images

Images live in the `images/` folder. To swap one:

1. Drop your new image into `images/`
2. Search for the old filename in the HTML (e.g., `tejal-hero.jpg`)
3. Replace the `src="images/old-name.jpg"` with `src="images/new-name.jpg"`

Key images:
| Image | Used for |
|-------|----------|
| `Logo 256x256_Transparent.png` | Nav + footer logo (all pages) |
| `tejal-hero.jpg` | Homepage hero portrait |
| `tejal-about.jpg` | About section portrait |
| `art-container.svg` | The Method illustration |
| `art-wealth-code.svg` | Wealth Expansion Code illustration |
| `art-business-code.svg` | Business Expansion Code illustration |

---

## 💰 Changing Prices & Payment Links

### Razorpay Booking Link
Used in `report.html` and the program pages. Search for `razorpay`:

```javascript
// In report.html:
const RAZORPAY_BOOKING = 'https://pages.razorpay.com/manifested369';
```

In program pages, search for `rzp.io`:
```html
<a class="btn btn-ch" href="https://rzp.io/rzp/manifested369">Book Your Call →</a>
```

### Call Price
Search for `₹999` or `$9.99` — this appears in:
- `refund-policy.html` (policy text)
- Program pages (payment card)

---

## 🎨 Changing Colours

Open `css/variables.css`. All colours are defined as CSS custom properties:

```css
--forest:        #154230;   /* main emerald green */
--gold:          #e6d3a3;   /* champagne gold */
--sand:          #e4d9c4;   /* warm sand background */
--paper:         #FBFAF5;   /* page background */
```

To change a colour, just update the hex code. Everything using that variable updates automatically.

---

## 📝 Editing Legal Pages

All three legal pages follow the same structure:

```html
<h2>1. Section Title</h2>
<p>Section body text.</p>

<h2>2. Another Section</h2>
<p>More text here.</p>
<ul>
  <li>Bullet point</li>
  <li>Another bullet</li>
</ul>
```

- `<h2>` = section heading (numbered)
- `<p>` = paragraph
- `<ul><li>` = bullet list
- `<strong>` or `<b>` = **bold**
- `<a href="mailto:...">` = email link

---

## 🔧 Editing the Assessment

### Questions & Options
In `assessment.html`, search for `QUESTIONS`:

```javascript
const QUESTIONS = [
  { q: "Your question text here?",
    opts: [
      { text: "Option A text", cat: "A" },
      { text: "Option B text", cat: "B" },
      ...
    ]
  },
  ...
];
```

- `q:` = the question text
- `opts:` = array of answer options
- `cat:` = which archetype category this answer maps to (A=Guard, B=Prover, C=Hider, D=Giver, E=Gripper)

### Archetype Names & Descriptions
In `report.html`, search for `ARCHETYPES`:

```javascript
const ARCHETYPES = {
  A: {
    name: "The Guard",
    tag: "Deep down, more money feels risky...",
    body: ["Paragraph 1", "Paragraph 2"],
    gift: "Your gift description",
    next: "Your next step description",
    edge: { name: "Edge Name", desc: "Edge description" }
  },
  ...
};
```

---

## 🚀 Deploying Changes

The site is deployed on **Vercel**. When you push changes to the `main` branch on GitHub, Vercel automatically redeploys.

```bash
git add .
git commit -m "Update: brief description of changes"
git push origin main
```

The site will be live within ~60 seconds.

---

## ⚠️ Common Mistakes to Avoid

1. **Don't delete closing tags** — every `<div>` needs a `</div>`, every `<section>` needs a `</section>`
2. **Use `&amp;` for ampersands** — in HTML, write `&amp;` instead of `&` in text
3. **Keep quotes balanced** — if you open a `"`, make sure you close it
4. **Test on mobile** — after any text change, check it on a 375px viewport (Chrome DevTools → toggle device toolbar)
5. **Don't edit `.js` files** unless you know JavaScript — text-only changes should never need JS edits

---

## 📋 Quick Reference: Where Things Live

```
tejaldesae.com/
├── index.html                    ← Homepage
├── wealth-expansion-code.html    ← WEC program page
├── business-expansion-code.html  ← BEC program page
├── assessment.html               ← Expansion Quotient quiz
├── report.html                   ← Quiz results page
├── privacy-policy.html           ← Privacy policy
├── terms.html                    ← Terms & conditions
├── refund-policy.html            ← Refund policy
├── css/
│   ├── variables.css             ← Colours, fonts, spacing tokens
│   └── home-2026.css             ← All homepage + program page styles
├── js/
│   ├── home.js                   ← Animations, counters, nav, form
│   └── lead-service.js           ← Contact form submission
├── images/
│   ├── Logo 256x256_Transparent.png  ← Current logo
│   ├── tejal-hero.jpg            ← Hero portrait
│   ├── tejal-about.jpg           ← About portrait
│   └── art-*.svg                 ← Program illustrations
└── server/                       ← Backend (Express + PostgreSQL)
    ├── src/index.js              ← Server entry point
    └── .env                      ← API keys (never commit!)
```
