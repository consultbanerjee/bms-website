// Weekly blog post, Sunday 07:00 IST. Needs the ANTHROPIC_API_KEY secret; without it this script does nothing.
import fs from "node:fs/promises"; import path from "node:path";
const ROOT = process.cwd(), KEY = process.env.ANTHROPIC_API_KEY, MODEL = process.env.BLOG_MODEL || "claude-sonnet-5-5";
const log = (...a) => console.log("[weekly]", ...a);
if (!KEY) { log("ANTHROPIC_API_KEY not set: skipping."); process.exit(0); }
const ist = new Date(Date.now() + 19800000), date = ist.toISOString().slice(0, 10);
const dir = path.join(ROOT, "data", "blogs"); await fs.mkdir(dir, { recursive: true });
const have = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
const posts = []; for (const f of have) { try { posts.push(JSON.parse(await fs.readFile(path.join(dir, f), "utf8"))); } catch {} }
if (posts.some((p) => p.date === date && p.auto)) { log("already posted for", date); process.exit(0); }
const read = async (f, d) => { try { return JSON.parse(await fs.readFile(path.join(ROOT, "data", f), "utf8")); } catch { return d; } };
const press = ((await read("press.json", {})).items || []).slice(0, 8).map((x) => `${x.date}: ${x.title}`).join("\n");
const done = posts.map((p) => p.title).slice(-60).join("\n");
const topics = (await read("blog-topics.json", { topics: [] })).topics || [];
const next = topics.find((t) => !posts.some((p) => p.topic === t)) || "";
const prompt = `You write the weekly Sunday blog post for the official website of Bharatiya Mazdoor Sangh (BMS), India's largest trade union.
Today is ${date}. Search the web (bms.org.in, BMS Facebook page BMSkendra, YouTube channel, labour.gov.in, ilo.org, news) and write ONE post of 450-650 words in plain, accurate English.
${next ? "Topic for this week: " + next : "Pick a fresh topic from the latest BMS press notifications below or a current labour-law / workers' welfare development."}
Latest BMS press notifications on the site:\n${press}\n
Posts already published (do not repeat):\n${done}\n
Rules: only state facts you verified in search results; no invented quotes, numbers or dates; paraphrase sources, quote at most 12 words; neutral, factual tone about BMS and the Government; no party-political attacks. End with a line "Sources:" listing the page titles and URLs you used.
Return ONLY JSON: {"title":"","summary":"(max 200 chars)","category":"","body":"markdown with ## headings"}`;
const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: MODEL, max_tokens: 4000, tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }], messages: [{ role: "user", content: prompt }] }) });
const j = await r.json(); if (!r.ok) { log("API error", JSON.stringify(j).slice(0, 300)); process.exit(1); }
const text = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
const m = text.match(/\{[\s\S]*\}/); if (!m) { log("no JSON in reply"); process.exit(1); }
const o = JSON.parse(m[0]); if (!o.title || !o.body) { log("incomplete post"); process.exit(1); }
const slug = o.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const post = { slug: `${date}-${slug}`, title: o.title, author: "Editorial Desk", date, time: "07:00", category: o.category || "Weekly", lang: "en", cover: "", summary: o.summary || "", share_to_facebook: false, auto: true, topic: next || undefined, body: o.body };
await fs.writeFile(path.join(dir, post.slug + ".json"), JSON.stringify(post, null, 1) + "\n"); log("written", post.slug);
