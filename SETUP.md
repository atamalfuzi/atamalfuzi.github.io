# Portfolio Setup & Deployment Guide
## Ata Malfuzi — Economic Data Science Portfolio

---

## Files included

| File | Purpose |
|---|---|
| `index.html` | Home page — hero, expertise overview, project + publication previews |
| `about.html` | Full bio, experience timeline, skills, education, certs, volunteering |
| `projects.html` | All projects with filter buttons (Energy / Econometrics / Data Eng / Policy / Research) |
| `research.html` | Publications, policy reports, coursework, awards |
| `contact.html` | Contact links + message form |
| `style.css` | All shared styles (dark theme, typography, layout) |
| `main.js` | Shared JS — scroll reveal, skill bars, project filters, mobile nav |

---

## Deploy to GitHub Pages (~5 minutes)

### Option A — Username site (recommended)
Your site lives at `https://ata-malfuzi.github.io`

1. Create a GitHub repo named exactly `ata-malfuzi.github.io`
2. Upload ALL files: `index.html`, `about.html`, `projects.html`, `research.html`, `contact.html`, `style.css`, `main.js`
   - Drag-and-drop all files at once in the GitHub web interface
3. Go to **Settings → Pages** → Branch: `main` → `/ (root)` → Save
4. Wait ~60 seconds → visit `https://ata-malfuzi.github.io`

### Option B — Project site
Your site lives at `https://ata-malfuzi.github.io/portfolio`

1. Create a repo named `portfolio`
2. Upload all files
3. Settings → Pages → `main` → `/ (root)` → Save

---

## What to personalise

### Immediate (before going live)

| What | File | What to find & replace |
|---|---|---|
| Your email | `contact.html`, `index.html` | `ata.malfuzi@example.com` |
| GitHub username | All files | `ata-malfuzi` |
| CV download link | `about.html`, `contact.html` | `YOUR_CV.pdf` (upload your CV too) |
| Contact form | `contact.html` | `YOUR_FORM_ID` (see Formspree instructions below) |
| Publication DOI | `research.html` | Replace `href="#"` with real DOI link |
| Project GitHub links | `projects.html` | Replace `href="#"` where you have public repos |

### Add your photo

1. Put `photo.jpg` in the same folder as the HTML files
2. In `about.html`, find the `<div class="about-photo-box">` block
3. Replace the entire div with:
   ```html
   <img src="photo.jpg" alt="Ata Malfuzi" />
   ```
4. Upload `photo.jpg` to your GitHub repo alongside the HTML files

### Activate the contact form (free)

1. Go to https://formspree.io → create free account
2. Click "New Form" → name it (e.g. "Portfolio Contact")
3. Copy the Form ID (8 chars, e.g. `xyzabcde`)
4. In `contact.html`, find:
   ```
   action="https://formspree.io/f/YOUR_FORM_ID"
   ```
5. Replace `YOUR_FORM_ID` with your real ID
6. Submissions arrive in your inbox — free plan allows 50/month

---

## Adding new projects

In `projects.html`, copy this block and paste inside `.projects-list`:

```html
<a href="https://github.com/ata-malfuzi/YOUR-REPO" target="_blank" class="proj-card reveal" data-cat="energy">
  <div class="proj-card-left">
    <div class="proj-type">Category · Type</div>
    <div class="proj-title">Project Title</div>
    <p class="proj-desc">Description of what the project does and why it matters.</p>
    <div class="proj-tech">
      <span class="tech-tag">R</span>
      <span class="tech-tag">Python</span>
    </div>
  </div>
  <div class="proj-card-right">
    <div>
      <div class="proj-year mono">2025</div>
      <div class="proj-org mono">Org</div>
    </div>
    <span class="proj-link">View repo →</span>
  </div>
</a>
```

The `data-cat` attribute controls which filter button shows/hides the card.
Valid values: `energy`, `econometrics`, `data-eng`, `policy`, `research`
(or add a new category by adding a new `.filter-btn` in the HTML)

---

## Updating the site later

**Via GitHub web interface (simplest):**
1. Go to your repo on github.com
2. Click the file you want to edit → pencil icon
3. Make your changes → Commit changes
4. Live within ~30 seconds

**Via command line:**
```bash
git add .
git commit -m "Update projects"
git push
```

---

## Custom domain (optional)

If you own `atamalfuzi.com` or similar:
1. GitHub repo → Settings → Pages → Custom domain → enter domain → Save
2. At your domain registrar, add a CNAME record pointing to `ata-malfuzi.github.io`
3. GitHub handles HTTPS automatically (free, via Let's Encrypt)

---

## Design notes

- **Colour accent** — the teal `#00d4a0` is in `style.css` as `--accent`. Change it once and the whole site updates.
- **Dark theme only** — the design is intentional for the technical/policy audience. If you want a light theme, change `--bg` to `#f8f6f1` and `--text` to `#0f0f0e` in the `:root` block.
- All fonts load from Google Fonts (Syne display, Instrument Serif, IBM Plex Mono, Inter body). No local files needed.
