// Makes every photo small for slow connections. Runs after sync.mjs (needs: npm i sharp).
// 1) remote press/gallery images -> local 640px WebP in assets/press/
// 2) oversized local images (>150 KB) are re-compressed in place (same file name)
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const log = (...a) => console.log("[optimise]", ...a);
const UA = { "user-agent": "Mozilla/5.0 (compatible; BMS-site-build)" };
const rd = async (f) => JSON.parse(await fs.readFile(path.join(ROOT, f), "utf8"));
const wr = (f, o) => fs.writeFile(path.join(ROOT, f), JSON.stringify(o, null, 2) + "\n");

async function localise(url) {
  const id = crypto.createHash("sha1").update(url).digest("hex").slice(0, 12);
  const rel = `assets/press/${id}.webp`, abs = path.join(ROOT, rel);
  try { await fs.access(abs); return rel; } catch {}
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await sharp(buf).rotate().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 60 }).toFile(abs);
  return rel;
}
async function slim(rel) {
  const abs = path.join(ROOT, rel);
  const st = await fs.stat(abs).catch(() => null);
  if (!st || st.size < 150 * 1024) return;
  const ext = path.extname(rel).toLowerCase();
  let p = sharp(await fs.readFile(abs)).rotate().resize({ width: 1400, withoutEnlargement: true });
  p = ext === ".png" ? p.png({ compressionLevel: 9, palette: true }) : ext === ".webp" ? p.webp({ quality: 70 }) : p.jpeg({ quality: 72, mozjpeg: true });
  const out = await p.toBuffer();
  if (out.length < st.size) { await fs.writeFile(abs, out); log("slimmed", rel, st.size, "->", out.length); }
}
for (const [file, key] of [["data/press.json", "image"], ["data/gallery.json", "src"]]) {
  let j; try { j = await rd(file); } catch { continue; }
  let changed = false;
  for (const it of j.items || []) {
    const v = it[key];
    if (!v) continue;
    if (/^https?:\/\//.test(v)) {
      try { it[key] = await localise(v); changed = true; log("localised", v.slice(0, 70)); }
      catch (e) { log("skip", v.slice(0, 70), e.message); }
    } else if (v.startsWith("assets/")) { try { await slim(v); } catch (e) { log("slim fail", v, e.message); } }
  }
  if (changed) await wr(file, j);
}
log("done");
