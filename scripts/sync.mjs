// Daily sync for bharatiyamazdoorsangh.org  (Node 20+, no dependencies)
// Runs at 00:00 IST via .github/workflows/daily-sync.yml
//
// 1. Facebook (official Graph API) — needs FB_PAGE_TOKEN: photos -> gallery, "press" posts -> press, portraits -> Who's Who
// 2. bms.org.in WordPress public REST API — press releases fallback (no token needed)
//
// Facebook does not allow scraping; the Graph API with a Page access token is the supported route.
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const D = (f) => path.join(ROOT, "data", f);
const TOKEN = process.env.FB_PAGE_TOKEN || "";
const PAGE = process.env.FB_PAGE_ID || "BMSkendra";
const GV = process.env.FB_GRAPH_VERSION || "v21.0";
const PRESS_RE = new RegExp(process.env.PRESS_PATTERN || "(#press|press\\s*(release|note|statement|notification)|प्रेस)", "i");
const PORTRAIT_RE = new RegExp(process.env.PORTRAIT_PATTERN || "(birthday|जन्मदिन|शुभकामना|congratulat|बधाई|elected|appointed|नियुक्त|welcome|स्वागत)", "i");
const MAX_GALLERY = 400, MAX_PRESS = 300;

const readJson = async (f, d) => { try { return JSON.parse(await fs.readFile(D(f), "utf8")); } catch { return d; } };
const writeJson = (f, o) => fs.writeFile(D(f), JSON.stringify(o, null, 1) + "\n");
const log = (...a) => console.log("[sync]", ...a);
const first = (s) => (s || "").split(/\n+/).map((x) => x.trim()).filter(Boolean)[0] || "";
const rest = (s) => (s || "").split(/\n+/).map((x) => x.trim()).filter(Boolean).slice(1).join(" ").slice(0, 240);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function download(url, rel) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("download " + r.status);
  const ct = r.headers.get("content-type") || "";
  const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
  const out = rel + "." + ext;
  await fs.mkdir(path.dirname(path.join(ROOT, out)), { recursive: true });
  await fs.writeFile(path.join(ROOT, out), Buffer.from(await r.arrayBuffer()));
  return out;
}
const MIN_RE = /minister|मंत्री|mansukh|mandaviya|bhupender|nirmala|sitharaman|amit shah|rajnath|gadkari|piyush goyal|shivraj|scindia|karandlaje/i;
const STATE_RE = /chief minister|state minister|\bcm\b|मुख्यमंत्री/i;
const isMinisterial = (t = "") => MIN_RE.test(t) && (!STATE_RE.test(t) || /union|central|केंद्र|prime minister/i.test(t));
const upsert = (list, item, key = "id") => { const i = list.findIndex((x) => x[key] === item[key]); if (i >= 0) list[i] = { ...list[i], ...item }; else list.push(item); };

/* ---------- Facebook ---------- */
async function facebook(gallery, press, leaders) {
  if (!TOKEN) { log("FB_PAGE_TOKEN not set — skipping Facebook (photos / who's who / FB press)."); return; }
  const fields = "id,message,created_time,permalink_url,full_picture,attachments{type,media{image{src}},subattachments{media{image{src}}}}";
  let url = `https://graph.facebook.com/${GV}/${encodeURIComponent(PAGE)}/posts?fields=${encodeURIComponent(fields)}&limit=50&access_token=${TOKEN}`;
  const posts = [];
  for (let n = 0; n < 4 && url; n++) { // up to ~200 recent posts
    const r = await fetch(url); const j = await r.json();
    if (j.error) { log("Graph API error:", j.error.message); break; }
    posts.push(...(j.data || [])); url = j.paging && j.paging.next;
  }
  log("facebook posts read:", posts.length);
  const cands = [];
  for (const p of posts) {
    const date = (p.created_time || "").slice(0, 10), y = date.slice(0, 4), m = date.slice(5, 7);
    const urls = [];
    const att = (p.attachments && p.attachments.data) || [];
    for (const a of att) {
      if (a.subattachments) for (const s of a.subattachments.data || []) { const u = s.media && s.media.image && s.media.image.src; if (u) urls.push(u); }
      else { const u = a.media && a.media.image && a.media.image.src; if (u) urls.push(u); }
    }
    if (!urls.length && p.full_picture) urls.push(p.full_picture);
    const saved = [];
    for (let i = 0; i < Math.min(urls.length, 8); i++) {
      const id = `fb-${p.id}-${i}`;
      const have = gallery.items.find((g) => g.id === id);
      if (have) { saved.push(have.src); continue; }
      try {
        const src = await download(urls[i], `assets/gallery/${y}/${m}/${p.id.replace(/\W/g, "_")}-${i}`);
        upsert(gallery.items, { id, src, caption: first(p.message).slice(0, 140) || "BMS", date, source: "facebook.com/BMSkendra", link: p.permalink_url });
        saved.push(src);
      } catch (e) { log("image skipped:", e.message); }
    }
    const msg = p.message || "";
    if (PRESS_RE.test(msg)) {
      upsert(press.items, { id: "fb-" + p.id, date, approx: false, title: first(msg).slice(0, 180), summary: rest(msg), url: p.permalink_url, image: saved[0] || "", source: "facebook.com/BMSkendra" });
    }
    // portrait candidates for Who's Who: exactly one office-bearer named, exactly one photo, portrait-style post
    const named = leaders.people.filter((l) => l.aliases.some((a) => new RegExp("(^|[^\\p{L}])" + esc(a) + "([^\\p{L}]|$)", "iu").test(msg)));
    if (named.length === 1 && urls.length === 1 && saved[0]) {
      cands.push({ id: named[0].id, name: named[0].name, date, post: p.permalink_url, image: saved[0], portraitStyle: PORTRAIT_RE.test(msg), text: first(msg).slice(0, 120) });
    }
  }
  // assign photos (strict) — never overwrite a locked photo
  const portraitFor = new Map();
  for (const c of cands.sort((a, b) => (a.date < b.date ? 1 : -1))) if (c.portraitStyle && !portraitFor.has(c.id)) portraitFor.set(c.id, c);
  let assigned = 0;
  for (const l of leaders.people) {
    const c = portraitFor.get(l.id);
    if (c && !l.photo_locked && l.photo !== c.image) { l.photo = c.image; l.photo_source = c.post; assigned++; }
  }
  log("who's who photos assigned:", assigned, "| candidates for manual review:", cands.length);
  await writeJson("whoswho-candidates.json", { updated: new Date().toISOString(), note: "Review: copy a good 'image' into leaders.json photo and set photo_locked=true.", candidates: cands });
}

/* ---------- bms.org.in (WordPress REST API, public) ---------- */
async function bmsOrgIn(press, gallery) {
  try {
    const base = "https://www.bms.org.in/wp-json/wp/v2";
    const cats = await (await fetch(`${base}/categories?search=press&per_page=20`)).json();
    const ids = (Array.isArray(cats) ? cats : []).map((c) => c.id).join(",");
    const q = ids ? `categories=${ids}&` : "";
    const posts = await (await fetch(`${base}/posts?${q}per_page=20&_embed=wp:featuredmedia`)).json();
    if (!Array.isArray(posts)) return log("bms.org.in: unexpected response");
    for (const p of posts) {
      const date = (p.date || "").slice(0, 10);
      const title = (p.title && p.title.rendered || "").replace(/<[^>]+>/g, "").replace(/&#8217;|&#8216;/g, "'").replace(/&#8211;/g, "–").replace(/&amp;/g, "&").trim();
      const summary = (p.excerpt && p.excerpt.rendered || "").replace(/<[^>]+>/g, "").replace(/&hellip;|\[…\]/g, "…").trim().slice(0, 240);
      const fm = p._embedded && p._embedded["wp:featuredmedia"] && p._embedded["wp:featuredmedia"][0];
      let image = fm && fm.source_url || "";
      const id = "bms-wp-" + p.id;
      const had = press.items.find((x) => x.id === id);
      if (image && !(had && had.image && had.image.startsWith("assets/"))) { try { image = await download(image, `assets/gallery/${date.slice(0, 4)}/${date.slice(5, 7)}/bmsorgin-${p.id}`); } catch { /* keep remote url */ } }
      else if (had) image = had.image;
      upsert(press.items, { id, date, approx: false, title, summary, url: p.link, image, source: "bms.org.in" });
      if (image) upsert(gallery.items, { id: "g-" + id, src: image, caption: title.slice(0, 140), date, source: "bms.org.in", link: p.link });
    }
    log("bms.org.in posts read:", posts.length);
  } catch (e) { log("bms.org.in skipped:", e.message); }
}


/* ---------- videos & reels ---------- */
async function videos(vids) {
  // YouTube channel RSS (public, no token)
  try {
    const xml = await (await fetch("https://www.youtube.com/feeds/videos.xml?channel_id=UCPVADMq30TttsrTvUl85LPA")).text();
    for (const e of xml.split("<entry>").slice(1, 16)) {
      const id = (e.match(/<yt:videoId>([^<]+)/) || [])[1]; if (!id) continue;
      const title = ((e.match(/<title>([^<]+)/) || [])[1] || "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      const date = ((e.match(/<published>([^<]+)/) || [])[1] || "").slice(0, 10);
      upsert(vids.items, { id: "yt-" + id, type: "video", source: "youtube", ref: id, title, date, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` });
    }
    log("youtube feed ok");
  } catch (e) { log("youtube feed skipped:", e.message); }
  if (!TOKEN) return;
  for (const [edge, type] of [["videos", "video"], ["video_reels", "reel"]]) {
    try {
      const u = `https://graph.facebook.com/${GV}/${encodeURIComponent(PAGE)}/${edge}?fields=id,title,description,created_time,permalink_url,picture&limit=25&access_token=${TOKEN}`;
      const j = await (await fetch(u)).json();
      if (j.error) { log(edge, "error:", j.error.message); continue; }
      for (const v of j.data || []) {
        const link = (v.permalink_url || "").startsWith("http") ? v.permalink_url : "https://www.facebook.com" + (v.permalink_url || "/" + v.id);
        upsert(vids.items, { id: "fb-v-" + v.id, type: /\/reel\//.test(link) ? "reel" : type, source: "facebook", ref: link, title: (v.title || first(v.description) || "BMS video").slice(0, 140), date: (v.created_time || "").slice(0, 10), thumb: v.picture || "" });
      }
      log("facebook", edge, (j.data || []).length);
    } catch (e) { log(edge, "skipped:", e.message); }
  }
}

/* ---------- blog index (+ optional opt-in autopost to the Facebook page) ---------- */
async function blogs() {
  const dir = path.join(ROOT, "data", "blogs"); let files = [];
  try { files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json")); } catch { return; }
  const items = [];
  for (const f of files) {
    try {
      const p = JSON.parse(await fs.readFile(path.join(dir, f), "utf8"));
      if (!p.slug) p.slug = f.replace(/\.json$/, "");
      if (process.env.FB_AUTOPOST === "true" && TOKEN && p.share_to_facebook && !p.fb_post_id) {
        const body = new URLSearchParams({ message: `${p.title}\n\n${p.summary || ""}`, link: `https://bharatiyamazdoorsangh.org/blog.html#${p.slug}`, access_token: TOKEN });
        const r = await (await fetch(`https://graph.facebook.com/${GV}/${encodeURIComponent(PAGE)}/feed`, { method: "POST", body })).json();
        if (r.id) { p.fb_post_id = r.id; await fs.writeFile(path.join(dir, f), JSON.stringify(p, null, 1) + "\n"); log("shared to facebook:", p.slug); } else log("autopost failed:", r.error && r.error.message);
      }
      const { body, ...meta } = p; items.push(meta);
    } catch (e) { log("bad blog file", f, e.message); }
  }
  items.sort((a, b) => (a.date < b.date ? 1 : -1));
  await writeJson("blogs.json", { updated: new Date().toISOString().slice(0, 10), items });
  log("blog index:", items.length);
}


/* ---------- Labour notices (daily) ---------- */
const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu","Ladakh","Puducherry","Chandigarh"];
const NOTICE_RE = /(notif|gazette|circular|minimum wage|\bVDA\b|labour code|labor code|code on (wages|social security)|industrial relations code|occupational safety|EPFO|\bEPF\b|ESIC|labour (department|commissioner|ministry)|bonus|gratuity|standing orders)/i;
const NOTICE_QUERIES = (process.env.NOTICE_QUERIES || "Ministry of Labour notification gazette|labour code rules notified state gazette|minimum wages notification VDA revised|EPFO circular|ESIC circular|labour department circular notification|Chief Labour Commissioner order").split("|");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const decode = (s) => s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const tag = (x, t) => { const m = x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? decode(m[1]).trim() : ""; };
const detectCategory = (t) => /minimum wage|\bVDA\b|dearness/i.test(t) ? "Minimum Wages" : /EPFO|\bEPF\b|ESIC|provident|pension/i.test(t) ? "EPFO / ESIC" : /code|rules|standing orders/i.test(t) ? "Codes & Rules" : /tribunal|CGIT/i.test(t) ? "Tribunal" : /bonus|gratuity|wages/i.test(t) ? "Wages / Bonus" : "Gazette";

async function mirrorPdf(item, nt) {
  if (!/\.pdf(\?|$)/i.test(item.source) || item.pdf) return;
  try {
    const r = await fetch(item.source);
    if (!r.ok || !(r.headers.get("content-type") || "").includes("pdf")) return;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) return;
    const rel = `assets/notices/${item.date.slice(0, 4)}/${item.date.slice(5, 7)}/${slug(item.title)}.pdf`;
    await fs.mkdir(path.dirname(path.join(ROOT, rel)), { recursive: true });
    await fs.writeFile(path.join(ROOT, rel), buf);
    item.pdf = rel;
    await driveUpload(rel, buf, item);
  } catch (e) { log("pdf mirror failed:", item.source, e.message); }
}

// Optional: copy PDFs to Google Drive. Needs repo secrets GDRIVE_SA_JSON (service-account key JSON) and
// GDRIVE_FOLDER_ID (the BMS_Kendra_Portal sub-folder shared with the service account as Editor).
async function driveUpload(rel, buf, item) {
  const sa = process.env.GDRIVE_SA_JSON, folder = process.env.GDRIVE_FOLDER_ID;
  if (!sa || !folder) return;
  try {
    const key = JSON.parse(sa), crypto = await import("node:crypto");
    const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const head = b64({ alg: "RS256", typ: "JWT" }), body = b64({ iss: key.client_email, scope: "https://www.googleapis.com/auth/drive", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3000 });
    const sig = crypto.createSign("RSA-SHA256").update(head + "." + body).sign(key.private_key, "base64url");
    const tk = await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: head + "." + body + "." + sig }) })).json();
    const bd = "bms" + now, meta = JSON.stringify({ name: `${item.date} ${item.state || item.jurisdiction} - ${item.title}`.slice(0, 120) + ".pdf", parents: [folder] });
    const payload = Buffer.concat([Buffer.from(`--${bd}\r\nContent-Type: application/json\r\n\r\n${meta}\r\n--${bd}\r\nContent-Type: application/pdf\r\n\r\n`), buf, Buffer.from(`\r\n--${bd}--`)]);
    const r = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true", { method: "POST", headers: { authorization: "Bearer " + tk.access_token, "content-type": `multipart/related; boundary=${bd}` }, body: payload });
    log("drive upload", r.status, rel);
  } catch (e) { log("drive upload failed:", e.message); }
}

async function notices(nt) {
  const today = new Date().toISOString().slice(0, 10), seen = new Set(nt.items.map((x) => slug(x.title)));
  const added = [];
  const add = (x) => { const k = slug(x.title); if (!k || seen.has(k)) return; seen.add(k); nt.items.push({ id: "a" + Date.now().toString(36) + added.length, auto: true, added: new Date().toISOString(), tags: [], pdf: "", urgent: false, ...x }); added.push(x.title); };
  for (const q of NOTICE_QUERIES) {
    try {
      const r = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:3d")}&hl=en-IN&gl=IN&ceid=IN:en`, { headers: { "user-agent": "Mozilla/5.0 BMS-notice-bot" } });
      if (!r.ok) { log("news rss", r.status, q); continue; }
      const xml = await r.text();
      for (const it of xml.split("<item>").slice(1, 15)) {
        const title = tag(it, "title").replace(/\s+-\s+[^-]+$/, ""), link = tag(it, "link"), src = tag(it, "source"), pub = tag(it, "pubDate");
        if (!title || !link || !NOTICE_RE.test(title)) continue;
        const st = STATES.find((s) => new RegExp("\\b" + s + "\\b", "i").test(title)) || "";
        const date = pub ? new Date(pub).toISOString().slice(0, 10) : today;
        add({ date, jurisdiction: st ? "State" : "Central", state: st, category: detectCategory(title), title: title.slice(0, 160), summary: `Reported by ${src || "news source"}. Open the notice for details and confirm in the official Gazette.`, source: link, official: st ? "https://egazette.gov.in" : "https://labour.gov.in" });
      }
    } catch (e) { log("notice query failed:", q, e.message); }
  }
  try { // Central Government Industrial Tribunal notices (server-rendered table)
    const r = await fetch("https://apps.labour.gov.in/cgit/notices-circulars");
    if (r.ok) {
      const html = await r.text();
      for (const row of html.split(/<tr[\s>]/i).slice(1, 8)) {
        const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim());
        const href = (row.match(/href="([^"]+)"/i) || [])[1];
        if (cells[1] && cells[1].length > 12) add({ date: today, jurisdiction: "Central", state: "", category: "Tribunal", title: "CGIT: " + cells[1].slice(0, 150), summary: "Notice from the Central Government Industrial Tribunal.", source: href ? new URL(href, "https://apps.labour.gov.in/cgit/").href : "https://apps.labour.gov.in/cgit/notices-circulars", official: "https://apps.labour.gov.in/cgit/notices-circulars" });
      }
    }
  } catch (e) { log("cgit failed:", e.message); }
  for (const x of nt.items.filter((i) => i.added && !i.pdf)) await mirrorPdf(x, nt);
  const cur = nt.items.filter((x) => x.curated), auto = nt.items.filter((x) => !x.curated).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 200);
  nt.items = [...cur, ...auto].sort((a, b) => (a.date < b.date ? 1 : -1));
  nt.last_check = new Date().toISOString(); nt.checks = (nt.checks || 0) + 1; nt.updated = today;
  log("notices: +" + added.length, "total", nt.items.length);
}

const gallery = await readJson("gallery.json", { items: [] });
const press = await readJson("press.json", { items: [] });
const leaders = await readJson("leaders.json", { people: [] });
await bmsOrgIn(press, gallery);
await facebook(gallery, press, leaders);
const vids = await readJson("videos.json", { items: [] });
await videos(vids);
vids.items = vids.items.sort((a, b) => ((a.date || "") < (b.date || "") ? 1 : -1)).slice(0, 200); vids.updated = new Date().toISOString().slice(0, 10);
await writeJson("videos.json", vids);
await blogs();
const nts = await readJson("notices.json", { items: [] });
await notices(nts);
await writeJson("notices.json", nts);
const byDate = (a, b) => (a.date < b.date ? 1 : -1);
for (const g of gallery.items) g.ministers = isMinisterial(g.caption);
gallery.items = gallery.items.sort(byDate).slice(0, MAX_GALLERY); gallery.updated = new Date().toISOString().slice(0, 10);
press.items = press.items.sort(byDate).slice(0, MAX_PRESS); press.updated = gallery.updated;
await writeJson("gallery.json", gallery); await writeJson("press.json", press); await writeJson("leaders.json", leaders);
log("done. gallery:", gallery.items.length, "press:", press.items.length);
