# Bharatiya Mazdoor Sangh – bharatiyamazdoorsangh.org

Static, mobile-first website (no build step). Data lives in `data/*.json`; pages render from it.

## Pages
Home · Who's Who (National Office Bearers: name, phone, email, photo) · National Karya Karini (structure, no names) · Federations (38 names, no leaders) · Press Notifications · Gallery

## Go live (GitHub Pages)
1. Create a repo, upload ALL files (this zip is under 100 files). Settings → Pages → Deploy from branch `main` / root. `CNAME` already says bharatiyamazdoorsangh.org; point the domain's DNS as GitHub Pages instructs.
2. Settings → Actions → General → Workflow permissions → **Read and write**.

## Daily sync at 00:00 IST
`.github/workflows/daily-sync.yml` runs `node scripts/sync.mjs` at 18:30 UTC (= 00:00 IST) every day, and has a manual "Run workflow" button.
* **bms.org.in** press releases + photos: works with no setup (public WordPress API).
* **Facebook @BMSkendra** photos, "Press" posts and Who's Who portraits: Facebook forbids scraping, so this uses the official Graph API and needs a **Page access token** from an admin of the page (permissions `pages_read_engagement`, `pages_read_user_content`; for a page you don't administer, Meta's "Page Public Content Access" review). Add it as repo secret `FB_PAGE_TOKEN` (and optionally variable `FB_PAGE_ID`, default `BMSkendra`). Without it the Facebook step is skipped; nothing breaks.
* "Press" = Facebook posts containing #press / "press release" / "press note" / "प्रेस" (change with `PRESS_PATTERN`).
* Who's Who photos: a post is used only if it names exactly one office bearer, has exactly one photo and reads like a portrait/greeting post (birthday, congratulations, elected, welcome…). Everything else lands in `data/whoswho-candidates.json` for review. To fix a photo by hand: set `photo` in `data/leaders.json` and `photo_locked: true`.

## To complete
* `phone` for each office bearer (not published on bms.org.in) – edit `data/leaders.json`.
* Shri Anish Mishra's email is printed malformed on bms.org.in – add the right one.
* Replace the simple placeholder emblem (`assets/img/icon.svg`, `logo()` in `assets/js/app.js`) with the official BMS logo.

## Languages
Header dropdown: English, हिन्दी (built-in strings) and 12 more Indian languages via Google Website Translator (bn, mr, gu, ta, te, kn, ml, or, pa, as, ur, ne). The choice is remembered. Footer carries a machine-translation disclaimer. Brand name is excluded from translation.

## Login entry points (Digital · Email · Admin)
Header "Login" menu, home-page section and `login.html`. Edit `data/site.json → logins`: set `email.url` and `admin.url` when the subdomains are ready (Digital already points to repository.bharatiyamazdoorsangh.org). Empty URL shows "Coming soon". Sign-in itself happens on those subdomains; this static site never collects passwords.

## Accessibility
Skip link, text size A−/A/A+, high-contrast toggle, keyboard focus styles, reduced-motion support.

## Blog, videos & reels
* `blog.html` lists posts from `data/blogs/*.json`; `write.html` prepares a post file (copy / download / optional "Publish on GitHub" if `repo` is set in `data/site.json`). Pushing a file to `data/blogs/` rebuilds `data/blogs.json` automatically.
* Optional: set repo variable `FB_AUTOPOST=true` and tick "share on Facebook" in a post to have the daily/push job publish it to the BMS Facebook page (needs a token with `pages_manage_posts`).
* `videos.html`: YouTube channel videos (public RSS, no token) plus Facebook videos and reels (Graph API token). Cards open an embedded player.

## Map
Contact box embeds Google Maps for Dattopant Thengadi Bhawan, 27 Deendayal Upadhyay Marg, New Delhi-110002, with "Open in Google Maps" and "Get directions" links.

## Brand assets (vector, for all future use)
`assets/brand/` holds the rebuilt BMS emblem, banner (emblem + wordmark) and slogan as SVG, plus a 3000 px emblem PNG. The site header now uses the local emblem SVG instead of hot-linking bms.org.in.

## Dattopant Thengadi Ji feature (home page + `story.html`)
* `data/thengadi.json` holds 26 stories — one per week, i.e. six months — with sources/links. The home page and `story.html` pick the story automatically from the week number (Monday 00:00 IST, counted from `epoch`), and the cycle repeats after the 26th story. No server job is needed. To add stories, append to `stories` and raise `cycle_weeks`.
* Put his photograph at `assets/img/thengadi.jpg` (portrait, about 800×1000). Until then the emblem is shown in its place.

## "With Union Ministers" box (home page)
`scripts/sync.mjs` marks gallery photos whose caption mentions a Union/Central Minister (`ministers: true`); the home page shows the latest 12 in a swipeable row with a lightbox. Facebook photos need the Page token, bms.org.in items work without it.

## Inspirations row & social icons
* Home page "Pranam — Our Inspirations" shows Bhagwan Vishwakarma, Bharat Mata and Dattopant Thengadi in that order (change order/captions in `data/site.json` → `inspirations`). Add the portraits as `assets/img/vishwakarma.jpg`, `assets/img/bharatmata.jpg`, `assets/img/thengadi.jpg` (about 800×1000); until then decorative placeholders show.
* Facebook (facebook.com/BMSkendra) and YouTube (youtube.com/@bmskendra23755) icons are in the header top bar and the footer "Follow" column.

## Notice Board & Downloads
- `notices.html` + home Notice Board: data in `data/notices.json` (curated items + auto-detected). `scripts/sync.mjs` checks Google News RSS and CGIT daily at 00:00 IST, mirrors direct PDF links to `assets/notices/`, and optionally uploads them to Google Drive (repo secret `GDRIVE_SA_JSON`, variable `GDRIVE_FOLDER_ID`, folder shared with the service account).
- `downloads.html`: list files in `data/downloads.json`; brand kit ZIP in `assets/downloads/`, common programme banner in `assets/brand/`.
