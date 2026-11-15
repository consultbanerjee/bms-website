/* Bharatiya Mazdoor Sangh – site script (no dependencies) */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  var I18N = {
    en: { home: "Home", about: "About", whos: "Who's Who", kk: "Karya Karini", fed: "Federations", press: "Press", blog: "Blog", videos: "Videos", gallery: "Gallery", contact: "Contact",
      heroEyebrow: "India's largest trade union", heroH: "Industrialise the Nation. Labourise the Industry. Nationalise the Labour.", heroP: "Bharatiya Mazdoor Sangh — the organised voice of Indian workers since 1955, with federations in every major industry and affiliated unions across the country.",
      ctaA: "Latest Press Notifications", ctaB: "Know Our Leadership", latest: "Latest Press Notifications", all: "View all →", whosH: "Who's Who — National Office Bearers", kkH: "National Karya Karini — Structure", fedH: "Federations", galH: "From Our Gallery", minH: "With Union Ministers", contactH: "Contact Us", aboutH: "About BMS", blogH: "From the Blog", vidH: "Videos & Reels", quickH: "Quick Links", dirH: "Directories", connH: "Connect with BMS", newsH: "News & Spotlight", search: "Search BMS…" },
    hi: { home: "मुख्य पृष्ठ", about: "परिचय", whos: "हू'ज़ हू", kk: "राष्ट्रीय कार्यकारिणी", fed: "महासंघ", press: "प्रेस", blog: "ब्लॉग", videos: "वीडियो", gallery: "गैलरी", contact: "संपर्क",
      heroEyebrow: "भारत का सबसे बड़ा श्रमिक संगठन", heroH: "राष्ट्र का औद्योगीकरण। उद्योगों का श्रमिकीकरण। श्रमिकों का राष्ट्रीयकरण।", heroP: "भारतीय मज़दूर संघ — 1955 से भारतीय श्रमिकों की संगठित आवाज़; प्रत्येक प्रमुख उद्योग में महासंघ और देशभर में सम्बद्ध यूनियनें।",
      ctaA: "ताज़ा प्रेस विज्ञप्तियाँ", ctaB: "हमारा नेतृत्व", latest: "ताज़ा प्रेस विज्ञप्तियाँ", all: "सभी देखें →", whosH: "हू'ज़ हू — राष्ट्रीय पदाधिकारी", kkH: "राष्ट्रीय कार्यकारिणी — संरचना", fedH: "महासंघ", galH: "हमारी गैलरी", minH: "केंद्रीय मंत्रियों के साथ", contactH: "संपर्क करें", aboutH: "भारतीय मज़दूर संघ के बारे में", blogH: "ब्लॉग से", vidH: "वीडियो एवं रील्स", quickH: "त्वरित लिंक", dirH: "निर्देशिकाएँ", connH: "हमसे जुड़ें", newsH: "समाचार एवं विशेष", search: "खोजें…" }
  };
  var LANGS = [["en","English"],["hi","हिन्दी"],["bn","বাংলা"],["mr","मराठी"],["gu","ગુજરાતી"],["ta","தமிழ்"],["te","తెలుగు"],["kn","ಕನ್ನಡ"],["ml","മലയാളം"],["or","ଓଡ଼ିଆ"],["pa","ਪੰਜਾਬੀ"],["as","অসমীয়া"],["ur","اردو"],["ne","नेपाली"]];
  var cur = "en"; try { cur = localStorage.getItem("bms-lang") || "en"; } catch (e) {}
  var lang = cur === "hi" ? "hi" : "en"; // built-in UI strings exist for en/hi; everything else uses Google Translate
  function setCookie(v) { var h = location.hostname, d = "; path=/"; document.cookie = "googtrans=" + v + d; document.cookie = "googtrans=" + v + d + "; domain=" + h; }
  function applyTranslate() {
    if (cur === "en") { setCookie("/en/en; expires=Thu, 01 Jan 1970 00:00:00 GMT"); return; }
    setCookie("/en/" + cur);
    window.gtInit = function () { new google.translate.TranslateElement({ pageLanguage: "en", autoDisplay: false, includedLanguages: LANGS.map(function (l) { return l[0]; }).filter(function (c) { return c !== "en"; }).join(",") }, "gt"); };
    var s = document.createElement("script"); s.src = "https://translate.google.com/translate_a/element.js?cb=gtInit"; s.async = true; document.head.appendChild(s);
  }
  function chooseLang(code) { try { localStorage.setItem("bms-lang", code); } catch (e) {} if (code === "en") setCookie("/en/en; expires=Thu, 01 Jan 1970 00:00:00 GMT"); else setCookie("/en/" + code); location.reload(); }
  /* accessibility prefs */
  var fs = 100, hc = false; try { fs = +localStorage.getItem("bms-fs") || 100; hc = localStorage.getItem("bms-hc") === "1"; } catch (e) {}
  function applyA11y() { document.documentElement.style.fontSize = fs + "%"; document.body.classList.toggle("hc", hc); try { localStorage.setItem("bms-fs", fs); localStorage.setItem("bms-hc", hc ? "1" : "0"); } catch (e) {} }
  var t = function (k) { return (I18N[lang] || I18N.en)[k] || I18N.en[k] || k; };

  var data = {};
  function load(names) {
    return Promise.all(names.map(function (n) {
      return fetch("data/" + n + ".json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (j) { data[n] = j; }).catch(function () { data[n] = {}; });
    }));
  }

  function initials(name) {
    var w = name.replace(/^(Shri|Smt\.?|Miss|Dr\.?)\s+/i, "").split(/\s+/).filter(Boolean);
    return ((w[0] || "")[0] || "") + ((w.length > 1 ? w[w.length - 1][0] : "") || "");
  }
  function fmtDate(d, approx) {
    var dt = new Date(d + "T00:00:00"); if (isNaN(dt)) return "";
    var o = approx ? { month: "short", year: "numeric" } : { day: "numeric", month: "short", year: "numeric" };
    return dt.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", o);
  }
  function logo() {
    return '<span class="plate"><img class="logo" src="assets/brand/bms-emblem.svg" alt="Bharatiya Mazdoor Sangh logo" onerror="this.outerHTML=\'<svg width=42 height=42 viewBox=&quot;0 0 48 48&quot;><circle cx=24 cy=24 r=22 fill=&quot;#E8650A&quot;/><circle cx=24 cy=24 r=14 fill=none stroke=#fff stroke-width=3 stroke-dasharray=&quot;4 3&quot;/><circle cx=24 cy=24 r=6 fill=&quot;#7A1F0B&quot;/></svg>\'"></span>';
  }

  /* ---------- shell ---------- */
  var NAV = [["index.html", "home"], ["whos-who.html", "whos"], ["karya-karini.html", "kk"], ["federations.html", "fed"], ["press.html", "press"], ["blog.html", "blog"], ["videos.html", "videos"], ["gallery.html", "gallery"], ["index.html#contact", "contact"]];
  function shell() {
    var cur = (location.pathname.split("/").pop() || "index.html");
    var site = data.site || {};
    var nav = NAV.map(function (n) { var on = n[0] === cur ? ' aria-current="page"' : ""; return '<li><a href="' + n[0] + '"' + on + ">" + t(n[1]) + "</a></li>"; }).join("");
    var langOpts = LANGS.map(function (l) { return '<option value="' + l[0] + '"' + (l[0] === cur ? " selected" : "") + ">" + l[1] + "</option>"; }).join("");
    $("#hdr").innerHTML =
      '<div class="topbar"><div class="wrap"><a href="#main" class="skiplink">Skip to main content</a><span class="l"></span><span class="r">' +
      '<span class="a11y" role="group" aria-label="Accessibility tools"><button id="fm" aria-label="Decrease text size">A−</button><button id="fz" aria-label="Reset text size">A</button><button id="fp" aria-label="Increase text size">A+</button><button id="hc" aria-label="High contrast" aria-pressed="false">◐</button></span>' +
      '<label class="langsel notranslate" translate="no"><span class="vh">Language</span><select id="langSel" aria-label="Select language">' + langOpts + "</select></label>" +
      '<span class="soc"><a class="fb" href="' + esc(site.facebook) + '" rel="noopener" target="_blank" aria-label="BMS on Facebook" title="Facebook">' + FBI + '</a><a class="yt" href="' + esc(site.youtube) + '" rel="noopener" target="_blank" aria-label="BMS on YouTube" title="YouTube">' + YTI + '</a></span>' + '<a class="hide-sm" href="tel:' + esc((site.phone || "").replace(/[^0-9+]/g, "")) + '">☎ ' + esc(site.phone) + '</a><a class="hide-sm" href="https://wa.me/91' + esc(site.whatsapp) + '" rel="noopener" aria-label="Chat on WhatsApp">' + WA + 'WhatsApp</a><span class="lgn"><button id="lgnB" aria-haspopup="true" aria-expanded="false">🔒 Login ▾</button><div class="lgm" id="lgnM" hidden>' + loginLinks("lgi") + '</div></span></span></div></div>' +
      '<header class="site"><div class="wrap"><a class="brand notranslate" translate="no" href="index.html">' + logo() + '<span class="wm"><b>भारतीय मजदूर संघ</b><small>Bharatiya Mazdoor Sangh</small></span><em class="bslog">राष्ट्रहित · उद्योगहित · मजदूरहित</em></a>' +
      '<button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button><nav class="main" id="nav" aria-label="Primary"><ul>' + nav + "</ul></nav></div></header>" +
      '<div class="searchstrip"><div class="wrap"><form id="sf" role="search" autocomplete="off"><input id="sq" type="search" placeholder="' + t("search") + '" aria-label="Search the site"><button class="btn sm" type="submit">Search</button><div id="sr" class="sres" hidden></div></form>' +
      '<div class="trend"><b>Trending:</b> <a href="press.html">Press notifications</a><a href="whos-who.html">Who\'s Who</a><a href="federations.html">Federations</a><a href="https://www.bms.org.in/labour-codes/" rel="noopener">Labour Codes</a><a href="gallery.html">Gallery</a></div></div></div>';
    $("#langSel").onchange = function () { chooseLang(this.value); };
    $("#fm").onclick = function () { fs = Math.max(85, fs - 10); applyA11y(); };
    $("#fp").onclick = function () { fs = Math.min(150, fs + 10); applyA11y(); };
    $("#fz").onclick = function () { fs = 100; applyA11y(); };
    $("#hc").onclick = function () { hc = !hc; this.setAttribute("aria-pressed", hc); applyA11y(); };
    applyA11y();
    $("#lgnB").onclick = function (e) { e.stopPropagation(); var m = $("#lgnM"); m.hidden = !m.hidden; this.setAttribute("aria-expanded", !m.hidden); };
    document.addEventListener("click", function () { var m = $("#lgnM"); if (m) m.hidden = true; });
    setupSearch();
    var d = new Date().getFullYear();
    $("#ftr").innerHTML =
      '<div class="motto"><span>Nationalise the Labour</span><span>·</span><span>Labourise the Industry</span><span>·</span><span>Industrialise the Nation</span></div>' +
      '<footer class="site"><div class="wrap"><div class="cols"><div><h4>Bharatiya Mazdoor Sangh</h4><p><a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(site.address || "") + '" rel="noopener">' + esc(site.address) + '</a></p><p>Phone ' + esc(site.phone) + " · Fax " + esc(site.fax) + '<br><a class="walink" href="https://wa.me/91' + esc(site.whatsapp) + '" rel="noopener" aria-label="Chat on WhatsApp">WhatsApp ' + esc(site.whatsapp) + ' ' + WA + "</a></p></div>" +
      '<div><h4>Explore</h4><a href="whos-who.html">Who\'s Who</a><a href="karya-karini.html">Karya Karini</a><a href="federations.html">Federations</a><a href="press.html">Press Notifications</a><a href="blog.html">Blog</a><a href="videos.html">Videos &amp; Reels</a><a href="gallery.html">Gallery</a><a href="notices.html">Notice Board</a><a href="downloads.html">Downloads</a><a href="story.html">Thengadi Ji</a><a href="login.html">Login</a></div>' +
      '<div><h4>Follow</h4><a href="' + esc(site.facebook) + '" rel="noopener">' + FBI + ' Facebook @BMSkendra</a><a href="' + esc(site.twitter) + '" rel="noopener">X / Twitter</a><a href="' + esc(site.youtube) + '" rel="noopener">' + YTI + ' YouTube @bmskendra23755</a><a href="' + esc(site.app) + '" rel="noopener">Android App</a></div>' +
      '<div><h4>Useful links</h4><a href="https://www.bms.org.in" rel="noopener">bms.org.in</a><a href="http://tufbrics.org" rel="noopener">tufbrics.org</a><a href="http://ilo.org" rel="noopener">ilo.org</a><a href="http://labour.gov.in" rel="noopener">labour.gov.in</a><a href="https://register.eshram.gov.in/#/user/self" rel="noopener">eShram registration</a></div></div>' +
      '<div class="bot">© ' + d + " Bharatiya Mazdoor Sangh. All rights reserved.<br>Translation disclaimer: pages shown in languages other than English and Hindi are machine-translated by Google Translate and may be inaccurate; the English text is authoritative.</div></div></footer>" +
      '<div class="bar"><a href="index.html"><b>⌂</b>' + t("home") + '</a><a href="press.html"><b>📰</b>Press</a><a href="whos-who.html"><b>👥</b>Who\'s Who</a><a href="tel:' + esc((site.phone || "").replace(/[^0-9+]/g, "")) + '"><b>☎</b>Call</a></div>';
    $("#burger").onclick = function () { var o = $("#nav").classList.toggle("open"); this.classList.toggle("open", o); this.setAttribute("aria-expanded", o); };
    $$("#nav a").forEach(function (a) { a.addEventListener("click", function () { $("#nav").classList.remove("open"); $("#burger").classList.remove("open"); }); });
    $$("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
  }

  function loginLinks(cls) {
    var L = (data.site || {}).logins || {}, ic = { digital: "📚", email: "✉", admin: "🔐" };
    return ["digital", "email", "admin"].map(function (k) {
      var x = L[k]; if (!x) return "";
      return x.url ? '<a class="' + cls + '" href="' + esc(x.url) + '" rel="noopener"><i>' + ic[k] + "</i><span><b>" + esc(x.label) + "</b><small>" + esc(x.title) + "</small></span></a>"
        : '<span class="' + cls + ' off" aria-disabled="true"><i>' + ic[k] + "</i><span><b>" + esc(x.label) + "</b><small>" + esc(x.title) + " · Coming soon</small></span></span>";
    }).join("");
  }
  var FBI = '<svg class="soi" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07"/></svg>', YTI = '<svg class="soi" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8M9.6 15.6V8.4l6.2 3.6z"/></svg>';
  var WA = '<svg class="wai" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';
  function mapHtml(s) {
    var q = encodeURIComponent("Dattopant Thengadi Bhawan, 27 Deendayal Upadhyay Marg, New Delhi 110002");
    return '<div class="map"><iframe title="Map: Dattopant Thengadi Bhawan, New Delhi" src="https://maps.google.com/maps?q=' + q + '&hl=en&z=16&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>' +
      '<p class="maplinks"><a class="btn sm" href="https://www.google.com/maps/search/?api=1&query=' + q + '" rel="noopener">Open in Google Maps</a> <a class="btn sm ghost" href="https://www.google.com/maps/dir/?api=1&destination=' + q + '" rel="noopener">Get directions</a></p>';
  }
  function setupSearch() {
    var idx = [];
    ((data.press || {}).items || []).forEach(function (p) { idx.push({ t: p.title, k: "Press", u: p.url }); });
    ((data.leaders || {}).people || []).forEach(function (p) { idx.push({ t: p.name + " — " + p.role, k: "Who's Who", u: "whos-who.html" }); });
    ((data.federations || {}).federations || []).forEach(function (f) { idx.push({ t: f.name, k: "Federation", u: "federations.html" }); });
    ((data.blogs || {}).items || []).forEach(function (b) { idx.push({ t: b.title, k: "Blog", u: "blog.html#" + b.slug }); });
    ((data.videos || {}).items || []).forEach(function (v) { idx.push({ t: v.title, k: v.type === "reel" ? "Reel" : "Video", u: "videos.html" }); });
    [["Labour Notice Board — notices, circulars, gazette", "notices.html"], ["Downloads — brand kit & programme banner", "downloads.html"], ["Dattopant Thengadi Ji — weekly story", "story.html"], ["Who's Who", "whos-who.html"], ["National Karya Karini", "karya-karini.html"], ["Federations", "federations.html"], ["Press Notifications", "press.html"], ["Gallery", "gallery.html"], ["Contact", "index.html#contact"]].forEach(function (x) { idx.push({ t: x[0], k: "Page", u: x[1] }); });
    var box = $("#sr"), inp = $("#sq");
    function run() {
      var q = inp.value.trim().toLowerCase(); if (q.length < 2) { box.hidden = true; return; }
      var r = idx.filter(function (x) { return x.t.toLowerCase().indexOf(q) > -1; }).slice(0, 8);
      box.innerHTML = r.length ? r.map(function (x) { return '<a href="' + esc(x.u) + '"><small>' + esc(x.k) + "</small> " + esc(x.t) + "</a>"; }).join("") : "<p>No results</p>"; box.hidden = false;
    }
    inp.addEventListener("input", run);
    $("#sf").addEventListener("submit", function (e) { e.preventDefault(); run(); var a = box.querySelector("a"); if (a) location.href = a.getAttribute("href"); });
    document.addEventListener("click", function (e) { if (!e.target.closest("#sf")) box.hidden = true; });
  }

  /* tiny safe markdown */
  function md(src) {
    var s = esc(src || "").replace(/\r/g, "");
    var inl = function (t) { return t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/!\[([^\]]*)\]\((https?:[^)\s]+)\)/g, '<img loading="lazy" src="$2" alt="$1">').replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>'); };
    var out = [], list = null;
    s.split(/\n/).forEach(function (l) {
      var m;
      if ((m = l.match(/^(#{1,3})\s+(.*)$/))) { if (list) { out.push("</ul>"); list = null; } out.push("<h" + (m[1].length + 1) + ">" + inl(m[2]) + "</h" + (m[1].length + 1) + ">"); }
      else if ((m = l.match(/^[-*]\s+(.*)$/))) { if (!list) { out.push("<ul>"); list = 1; } out.push("<li>" + inl(m[1]) + "</li>"); }
      else if (!l.trim()) { if (list) { out.push("</ul>"); list = null; } }
      else { if (list) { out.push("</ul>"); list = null; } out.push("<p>" + inl(l) + "</p>"); }
    });
    if (list) out.push("</ul>"); return out.join("");
  }
  function blogCard(b) {
    return '<article class="card"><a class="im" href="blog.html#' + esc(b.slug) + '">' + (b.cover ? '<img loading="lazy" src="' + esc(b.cover) + '" alt="" onerror="this.remove()">' : '<div class="ph-b">✍</div>') + '</a><div class="bd"><time>' + fmtDate(b.date, false) + (b.category ? " · " + esc(b.category) : "") + '</time><h3><a href="blog.html#' + esc(b.slug) + '">' + esc(b.title) + "</a></h3><p>" + esc(b.summary || "") + '</p><span class="src">By ' + esc(b.author || "BMS") + "</span></div></article>";
  }
  function vidCard(v, i) {
    return '<button class="card vid' + (v.type === "reel" ? " reel" : "") + '" data-i="' + i + '" aria-label="Play ' + esc(v.title) + '"><span class="im">' + (v.thumb ? '<img loading="lazy" src="' + esc(v.thumb) + '" alt="" onerror="this.remove()">' : "") + '<b class="play">▶</b>' + (v.type === "reel" ? '<em class="rl">REEL</em>' : "") + '</span><span class="bd"><time>' + (v.date ? fmtDate(v.date, false) : (v.source === "facebook" ? "Facebook" : "YouTube")) + "</time><h3>" + esc(v.title) + "</h3></span></button>";
  }
  function embedUrl(v) {
    if (v.source === "youtube") return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(v.ref) + "?autoplay=1&rel=0";
    return "https://www.facebook.com/plugins/video.php?href=" + encodeURIComponent(v.ref) + "&show_text=false&autoplay=true&width=" + (v.type === "reel" ? 360 : 800);
  }
  function wireVideos(root, items) {
    var m = $("#vm");
    root.addEventListener("click", function (e) { var b = e.target.closest(".vid"); if (!b) return; var v = items[+b.getAttribute("data-i")]; if (!v) return;
      $("#vmBox").className = "vbox" + (v.type === "reel" ? " reel" : ""); $("#vmFrame").innerHTML = '<iframe title="' + esc(v.title) + '" src="' + esc(embedUrl(v)) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>';
      $("#vmCap").innerHTML = esc(v.title) + (v.source === "facebook" ? ' · <a href="' + esc(v.ref) + '" rel="noopener">Open on Facebook</a>' : ' · <a href="https://www.youtube.com/watch?v=' + esc(v.ref) + '" rel="noopener">Open on YouTube</a>'); m.classList.add("on"); });
    function close() { m.classList.remove("on"); $("#vmFrame").innerHTML = ""; }
    $("#vmX").onclick = close; m.addEventListener("click", function (e) { if (e.target === m) close(); }); document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }
  function vmHtml() { return '<div class="lb" id="vm" role="dialog" aria-modal="true"><button id="vmX" aria-label="Close">×</button><div id="vmBox" class="vbox"><div id="vmFrame"></div></div><p id="vmCap"></p></div>'; }
  /* ---------- components ---------- */
  var sorted = function (a) { return (a || []).slice().sort(function (x, y) { return (y.date || "") > (x.date || "") ? 1 : -1; }); };
  function pressCard(p) {
    return '<article class="card"><a class="im" href="' + esc(p.url) + '" rel="noopener">' + (p.image ? '<img loading="lazy" decoding="async" src="' + esc(p.image) + '" alt="" onerror="this.remove()">' : "") + '</a><div class="bd"><time>' + fmtDate(p.date, p.approx) + "</time><h3><a href=\"" + esc(p.url) + '" rel="noopener">' + esc(p.title) + "</a></h3><p>" + esc(p.summary || "") + '</p><span class="src">Source: ' + esc(p.source || "BMS") + "</span></div></article>";
  }
  function personCard(p, big) {
    var av = p.photo ? '<img class="avatar" loading="lazy" src="' + esc(p.photo) + '" alt="' + esc(p.name) + '">' : '<div class="avatar" aria-hidden="true">' + esc(initials(p.name)) + "</div>";
    var ph = p.phone ? '<a href="tel:' + esc(p.phone.replace(/[^0-9+]/g, "")) + '">☎ ' + esc(p.phone) + "</a>" : "<span>☎ —</span>";
    var em = p.email ? '<a href="mailto:' + esc(p.email) + '">✉ ' + esc(p.email) + "</a>" : "<span>✉ —</span>";
    return '<article class="card person' + (big ? " pres" : "") + '">' + av + '<div class="role">' + esc(p.role) + "</div><h3>" + esc(p.name) + '</h3><div class="c">' + ph + em + "</div></article>";
  }

  /* ---------- pages ---------- */
  function thIndex(t) {
    var n = (t.stories || []).length || 1, cyc = Math.min(t.cycle_weeks || n, n);
    var ist = new Date(Date.now() + 19800000), e = Date.parse((t.epoch || "2026-01-05") + "T00:00:00Z");
    var days = Math.floor((Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - e) / 864e5);
    var w = Math.floor(days / 7);
    return ((w % cyc) + cyc) % cyc;
  }
  function thLinks(s, max) { return '<ul class="thl">' + (s.links || []).slice(0, max || 9).map(function (l) { return '<li><a href="' + esc(l.url) + '" rel="noopener" target="_blank">' + esc(l.label) + " ↗</a></li>"; }).join("") + "</ul>"; }
  function thPhoto(t) { return '<div class="thph"><img src="' + esc(t.photo) + '" alt="' + esc(t.name) + '" onerror="this.parentNode.classList.add(\'nophoto\');this.remove()"><span class="thfb" aria-hidden="true"><img src="assets/brand/bms-emblem.svg" alt=""></span></div>'; }
  function ntNew(x, d) { var a = Date.parse(x.added || x.date); return a && (d - a) < 8 * 864e5; }
  function ntCard(x, d, full) {
    var dt = x.approx ? new Date(x.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : fmtDate(x.date, true);
    return '<article class="nt' + (x.urgent ? " urg" : "") + '"><div class="ntm"><span class="chip j-' + esc(x.jurisdiction) + '">' + esc(x.jurisdiction) + "</span>" + (x.state ? '<span class="chip st">' + esc(x.state) + "</span>" : "") + '<span class="chip cat">' + esc(x.category) + "</span><time>" + esc(dt) + "</time>" + (ntNew(x, d) ? '<span class="newb">NEW</span>' : "") + (x.auto ? '<span class="autob" title="Detected automatically — verify with the official source">Auto</span>' : "") + "</div><h3>" + esc(x.title) + "</h3><p>" + esc(x.summary) + '</p><div class="nta"><a class="btn sm" href="' + esc(x.source) + '" target="_blank" rel="noopener">Open notice ↗</a>' + (x.pdf ? '<a class="btn sm ghost" href="' + esc(x.pdf) + '" target="_blank" rel="noopener">PDF ↗</a>' : "") + (full && x.official ? '<a class="lnk" href="' + esc(x.official) + '" target="_blank" rel="noopener">Official portal ↗</a>' : "") + "</div></article>";
  }
  function ntDeadlines(nt, d) {
    var up = (nt.deadlines || []).filter(function (x) { return Date.parse(x.end || x.date) + 864e5 > d; }).sort(function (a, b) { return a.date > b.date ? 1 : -1; }).slice(0, 6);
    return "<h3>Important dates</h3><ul>" + (up.map(function (x) { var s = Date.parse(x.date), n = Math.ceil((s - d) / 864e5), when = s <= d && Date.parse(x.end || x.date) + 864e5 > d ? "Ongoing" : n <= 0 ? "Today" : n === 1 ? "Tomorrow" : "in " + n + " days"; return "<li><b>" + esc(fmtDate(x.date, true)) + (x.end ? " – " + esc(fmtDate(x.end, true)) : "") + '</b> <em class="' + (n <= 7 ? "soon" : "") + '">' + when + "</em><span>" + esc(x.label) + "</span></li>"; }).join("") || "<li>No upcoming dates.</li>") + "</ul>";
  }
  function ntNext() { var n = new Date(Date.now() + 19800000); n.setUTCHours(0, 0, 0, 0); n = new Date(n.getTime() + 864e5 - 19800000); return n.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
  var pages = {
    home: function () {
      var press = sorted((data.press || {}).items), f = press[0];
      $("#ticker").innerHTML = press.slice(0, 8).map(function (p) { return '<a href="' + esc(p.url) + '" rel="noopener">' + esc(p.title) + "</a>"; }).join("");
      var hs = press.filter(function (x) { return x.image; }).slice(0, 8); if (!hs.length) hs = press.slice(0, 8);
      if (hs.length) {
        var hc = $("#heroCard"), hi = 0, ht;
        hc.classList.add("slider");
        hc.innerHTML = '<div class="strk">' + hs.map(function (x) { return '<div class="sl">' + (x.image ? '<img src="' + esc(x.image) + '" alt="" onerror="this.remove()">' : "") + '<div><small>Latest · ' + fmtDate(x.date, x.approx) + '</small><a href="' + esc(x.url) + '" rel="noopener">' + esc(x.title) + "</a></div></div>"; }).join("") + '</div><div class="sdots">' + hs.map(function (x, i) { return '<button type="button" aria-label="Slide ' + (i + 1) + '" data-i="' + i + '"></button>'; }).join("") + "</div>";
        var trk = hc.querySelector(".strk"), dots = hc.querySelectorAll(".sdots button");
        var go = function (n) { hi = (n + hs.length) % hs.length; trk.style.transform = "translateX(-" + hi * 100 + "%)"; dots.forEach(function (d, i) { d.classList.toggle("on", i === hi); }); if (hs[hi].image) $("#heroBg").style.backgroundImage = "url('" + hs[hi].image + "')"; };
        var play = function () { clearInterval(ht); if (hs.length > 1) ht = setInterval(function () { go(hi + 1); }, 5000); };
        dots.forEach(function (d) { d.addEventListener("click", function () { go(+d.dataset.i); play(); }); });
        hc.addEventListener("mouseenter", function () { clearInterval(ht); }); hc.addEventListener("mouseleave", play);
        var tx = 0; hc.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; clearInterval(ht); }, { passive: true });
        hc.addEventListener("touchend", function (e) { var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) go(hi + (dx < 0 ? 1 : -1)); play(); });
        go(0); play();
      }
      var feds = (data.federations || {}).federations || [];
      $("#stats").innerHTML = [["1955", "Founded 23 July 1955"], ["~1 crore", "members (as stated by BMS)"], ["5,000+", "affiliated unions (as stated)"], [feds.length, "industry federations"]].map(function (s) { return '<div class="stat"><b>' + s[0] + "</b><span>" + s[1] + "</span></div>"; }).join("");
      $("#quick").innerHTML = [["👥", "Who's Who", "whos-who.html"], ["🏛", "Karya Karini", "karya-karini.html"], ["🏭", "Federations", "federations.html"], ["📰", "Press Notifications", "press.html"], ["📢", "Notice Board", "notices.html"], ["⬇", "Downloads", "downloads.html"], ["🖼", "Gallery", "gallery.html"], ["⚖", "Labour Codes", "https://www.bms.org.in/labour-codes/"], ["📖", "Vishwakarma Sanket", "https://www.bms.org.in/read-vishwakarma-sanket/"], ["📚", "Digital Library", "https://repository.bharatiyamazdoorsangh.org"], ["✅", "eShram Registration", "https://register.eshram.gov.in/#/user/self"], ["☎", "Contact", "#contact"]].map(function (q) { return '<a class="tile" href="' + esc(q[2]) + '"' + (q[2].indexOf("http") === 0 ? ' rel="noopener"' : "") + "><i>" + q[0] + "</i><span>" + esc(q[1]) + "</span></a>"; }).join("");
      var sp = press[0], rest = press.slice(1, 7);
      if (sp) $("#spot").innerHTML = '<a class="spf" href="' + esc(sp.url) + '" rel="noopener">' + (sp.image ? '<img loading="lazy" src="' + esc(sp.image) + '" alt="" onerror="this.remove()">' : "") + '<div class="spb"><time>' + fmtDate(sp.date, sp.approx) + "</time><h3>" + esc(sp.title) + "</h3><p>" + esc(sp.summary || "") + '</p></div></a><ul class="splist">' + rest.map(function (p) { return '<li><time>' + fmtDate(p.date, true) + '</time><a href="' + esc(p.url) + '" rel="noopener">' + esc(p.title) + "</a></li>"; }).join("") + "</ul>";
      $("#loginTiles").innerHTML = loginLinks("lcard");
      var vi = sorted((data.videos || {}).items).slice(0, 6);
      $("#vidGrid").innerHTML = vi.map(vidCard).join(""); $("#vmHost").innerHTML = vmHtml(); wireVideos($("#vidGrid"), vi);
      var bl = ((data.blogs || {}).items || []).slice(0, 3);
      $("#blogGrid").innerHTML = bl.map(blogCard).join("") || '<p class="empty">No posts yet.</p>';
      var SL = ["Tyag, Tapasya aur Balidan", "Workers Unite the World", "Bharat Mata Ki Jai"], si = 0; $("#slogan").textContent = SL[0];
      setInterval(function () { si = (si + 1) % SL.length; $("#slogan").textContent = SL[si]; }, 4000);
      $("#dirs").innerHTML = [["Who's Who", "Name, phone, email and photo of National Office Bearers", "whos-who.html"], ["Karya Karini", "Structure of the national organisation", "karya-karini.html"], ["Federation Directory", feds.length + " all-India federations", "federations.html"], ["Contact Directory", "Head office phone, WhatsApp and email", "#contact"]].map(function (d) { return '<a class="card dir" href="' + d[2] + '"><h3>' + esc(d[0]) + "</h3><p>" + esc(d[1]) + "</p></a>"; }).join("");
      var people = (data.leaders || {}).people || [];
      var top = people.filter(function (p) { return p.group === "President" || p.group === "General Secretaries"; });
      $("#whoGrid").innerHTML = top.slice(0, 4).map(function (p, i) { return personCard(p, i === 0); }).join("");
      var st = (data.structure || {}).tiers || [];
      $("#kkChips").innerHTML = st.map(function (s) { return '<span class="chip">' + esc(s.title) + ' <b>' + s.count + "</b></span>"; }).join("");
      $("#fedChips").innerHTML = feds.slice(0, 14).map(function (f) { return '<span class="chip n">' + esc(f.name) + "</span>"; }).join("") + '<a class="chip" href="federations.html">+ ' + Math.max(0, feds.length - 14) + " more</a>";
      var nt = data.notices, nbl = $("#nbList");
      if (nbl && nt) {
        var nd = Date.now(), its = sorted(nt.items);
        nbl.innerHTML = its.slice(0, 6).map(function (x) { return ntCard(x, nd, false); }).join("");
        $("#nbDates").innerHTML = '<p class="chk">Checked daily at 00:00 IST · next check ' + ntNext() + ' IST</p><a class="btn sm" href="notices.html">All notices →</a>';
      }
      var ib = $("#insp");
      if (ib) ib.innerHTML = ((data.site || {}).inspirations || []).map(function (p, i) { return '<figure class="ins"><div class="frame"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="this.remove()"><span class="fb" aria-hidden="true">' + ["🔨", "🇮🇳", "<img src=assets/brand/bms-emblem.svg alt=>"][i % 3] + '</span></div><figcaption><b class="notranslate" translate="no">' + esc(p.name_hi) + "</b><span>" + esc(p.name) + "</span><small>" + esc(p.note) + "</small></figcaption></figure>"; }).join("");
      var th = data.thengadi, tb = $("#thBox");
      if (tb && th && th.stories) {
        var cs = th.stories[thIndex(th)];
        tb.innerHTML = thPhoto(th) + '<div class="thtx"><span class="eyebrow">Remembering the founder · Week ' + cs.week + " of " + th.cycle_weeks + '</span><h2 class="thname notranslate" translate="no">' + esc(th.name_hi) + " <small>" + esc(th.name) + " · " + esc(th.years) + '</small></h2><blockquote class="thsl"><p class="hi notranslate" translate="no">' + esc(th.slogan_hi) + '</p><p>“' + th.slogan_en.map(esc).join(". ") + '.”</p></blockquote><div class="thst"><h3>' + esc(cs.title) + "</h3><p>" + esc(cs.summary) + '</p></div><div class="thact"><a class="btn" href="story.html?w=' + cs.week + '">Read the full story →</a><a class="btn ghost" href="story.html#all">All ' + th.cycle_weeks + " stories</a></div>" + thLinks(cs, 3) + "</div>";
      }
      var allg = sorted((data.gallery || {}).items);
      var mins = allg.filter(function (x) { return x.ministers; }).slice(0, 12);
      var mr = $("#minRow");
      if (mr) {
        mr.innerHTML = mins.map(function (x, i) { return '<figure role="listitem" tabindex="0" data-i="' + i + '"><img loading="lazy" src="' + esc(x.src) + '" alt="' + esc(x.caption) + '" onerror="this.parentNode.remove()"><figcaption><b>' + esc(x.caption) + "</b><small>" + (x.date ? esc(fmtDate(x.date, true)) : "") + "</small></figcaption></figure>"; }).join("") || '<p class="empty">Photographs will appear here after the next daily update.</p>';
        var lbm = $("#lb");
        var openm = function (i) { var x = mins[i]; if (!x || !lbm) return; $("#lbImg").src = x.src; $("#lbCap").textContent = x.caption + (x.date ? " — " + fmtDate(x.date, true) : ""); lbm.classList.add("on"); };
        mr.addEventListener("click", function (e) { var f = e.target.closest("figure"); if (f) openm(+f.getAttribute("data-i")); });
        mr.addEventListener("keydown", function (e) { if (e.key === "Enter") { var f = e.target.closest("figure"); if (f) openm(+f.getAttribute("data-i")); } });
      }
      var g = ((data.gallery || {}).items || []).slice(0, 6);
      $("#galStrip").innerHTML = g.map(function (x) { return '<figure><img loading="lazy" src="' + esc(x.src) + '" alt="' + esc(x.caption) + '" onerror="this.parentNode.remove()"><figcaption>' + esc(x.caption) + "</figcaption></figure>"; }).join("");
      var s = data.site || {};
      $("#contactBox").innerHTML = "<h3>Head Office, New Delhi</h3><p>" + esc(s.address) + '</p><p>☎ <a href="tel:' + esc((s.phone || "").replace(/[^0-9+]/g, "")) + '">' + esc(s.phone) + "</a> · Fax " + esc(s.fax) + '<br>✉ <a href="mailto:' + esc(s.email) + '">' + esc(s.email) + '</a></p><p><a class="btn" href="https://wa.me/91' + esc(s.whatsapp) + '" rel="noopener" aria-label="Chat on WhatsApp">' + WA + 'WhatsApp ' + esc(s.whatsapp) + "</a></p>" + mapHtml(s);
    },
    whos: function () {
      var people = (data.leaders || {}).people || [], order = ["President", "General Secretaries", "Secretaries", "National Office Posts"], h = "";
      order.forEach(function (g) {
        var l = people.filter(function (p) { return p.group === g; }); if (!l.length) return;
        h += '<h2 class="grp">' + esc(g) + '</h2><div class="grid g4 pp">' + l.map(function (p) { return personCard(p, g === "President"); }).join("") + "</div>";
      });
      $("#people").innerHTML = h || '<p class="empty">No data.</p>';
    },
    kk: function () {
      var st = (data.structure || {}).tiers || [];
      $("#org").innerHTML = st.map(function (s, i) {
        var chips = (s.items || []).map(function (x) { return '<span class="chip">' + esc(x) + "</span>"; }).join("");
        var sec = (s.sectors || []).map(function (x) { return '<div class="sector"><b>' + esc(x.name) + '</b><div class="chips">' + x.areas.map(function (a) { return '<span class="chip n">' + esc(a) + "</span>"; }).join("") + "</div></div>"; }).join("");
        return (i ? '<div class="link"></div>' : "") + '<div class="tier"><h3>' + esc(s.title) + '<span class="cnt">' + s.count + "</span></h3><p>" + esc(s.desc || "") + "</p>" + (chips ? '<div class="chips">' + chips + "</div>" : "") + sec + "</div>";
      }).join("");
    },
    fed: function () {
      var feds = (data.federations || {}).federations || [];
      function draw(q) {
        var l = feds.filter(function (f) { return f.name.toLowerCase().indexOf(q.toLowerCase()) > -1; });
        $("#fedList").innerHTML = l.map(function (f) { return '<div class="card fed"><i>' + f.no + "</i><span>" + esc(f.name) + "</span></div>"; }).join("") || '<p class="empty">No federation found.</p>';
        $("#fedCount").textContent = l.length + " of " + feds.length;
      }
      $("#q").addEventListener("input", function (e) { draw(e.target.value); }); draw("");
    },
    press: function () {
      var items = sorted((data.press || {}).items), years = [];
      items.forEach(function (p) { var y = p.date.slice(0, 4); if (years.indexOf(y) < 0) years.push(y); });
      $("#filters").innerHTML = '<button class="on" data-y="">All</button>' + years.map(function (y) { return '<button data-y="' + y + '">' + y + "</button>"; }).join("");
      function draw(y) { var l = items.filter(function (p) { return !y || p.date.slice(0, 4) === y; }); $("#pressList").innerHTML = l.map(pressCard).join("") || '<p class="empty">Nothing here yet.</p>'; }
      $("#filters").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; $$("#filters button").forEach(function (x) { x.classList.toggle("on", x === b); }); draw(b.getAttribute("data-y")); });
      var u = (data.press || {}).updated; if (u) $("#upd").textContent = "Last updated: " + u;
      draw("");
    },
    blog: function () {
      var items = (data.blogs || {}).items || [], root = $("#blogRoot");
      function list() {
        document.title = "Blog | Bharatiya Mazdoor Sangh";
        var cats = []; items.forEach(function (b) { if (b.category && cats.indexOf(b.category) < 0) cats.push(b.category); });
        root.innerHTML = '<div class="filters" id="bf"><button class="on" data-c="">All</button>' + cats.map(function (c) { return '<button data-c="' + esc(c) + '">' + esc(c) + "</button>"; }).join("") + '</div><div class="grid g3" id="bl"></div><p class="note">Want to contribute? <a href="write.html">Write a blog</a>.</p>';
        function draw(c) { $("#bl").innerHTML = items.filter(function (b) { return !c || b.category === c; }).map(blogCard).join("") || '<p class="empty">No posts yet.</p>'; }
        $("#bf").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; $$("#bf button").forEach(function (x) { x.classList.toggle("on", x === b); }); draw(b.getAttribute("data-c")); }); draw("");
      }
      function post(slug) {
        fetch("data/blogs/" + encodeURIComponent(slug) + ".json").then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (p) {
          document.title = p.title + " | Bharatiya Mazdoor Sangh";
          var u = encodeURIComponent(location.href.split("#")[0] + "#" + p.slug);
          root.innerHTML = '<article class="post"><p><a href="blog.html">← All posts</a></p><time>' + fmtDate(p.date, false) + (p.category ? " · " + esc(p.category) : "") + "</time><h1>" + esc(p.title) + '</h1><p class="by">By ' + esc(p.author || "BMS") + "</p>" + (p.cover ? '<img class="cover" src="' + esc(p.cover) + '" alt="" onerror="this.remove()">' : "") + '<div class="md">' + md(p.body) + '</div><div class="share"><b>Share:</b> <a class="btn sm" href="https://www.facebook.com/sharer/sharer.php?u=' + u + '" rel="noopener">Facebook</a> <a class="btn sm ghost dk" href="https://wa.me/?text=' + encodeURIComponent(p.title) + "%20" + u + '" rel="noopener">WhatsApp</a></div></article>'; window.scrollTo(0, 0);
        }).catch(function () { root.innerHTML = '<p class="empty">Post not found. <a href="blog.html">Back to blog</a></p>'; });
      }
      function route() { var h = location.hash.slice(1); h ? post(h) : list(); }
      window.addEventListener("hashchange", route); route();
    },
    videos: function () {
      var items = sorted((data.videos || {}).items), cur = "";
      $("#vmHost").innerHTML = vmHtml();
      function draw() { var l = items.filter(function (v) { return !cur || v.type === cur; }); $("#vl").innerHTML = l.map(function (v) { return vidCard(v, items.indexOf(v)); }).join("") || '<p class="empty">Nothing here yet.</p>'; }
      $("#vf").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; $$("#vf button").forEach(function (x) { x.classList.toggle("on", x === b); }); cur = b.getAttribute("data-t"); draw(); });
      wireVideos($("#vl"), items); draw();
    },
    write: function () {
      var f = $("#wf"), site = data.site || {};
      function slugify(s) { return (s || "post").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "post"; }
      function obj() { var v = function (n) { return f.elements[n].value.trim(); }; var title = v("title"); return { slug: v("slug") || slugify(title), title: title, author: v("author"), date: v("date") || new Date().toISOString().slice(0, 10), category: v("category"), lang: v("lang"), cover: v("cover"), summary: v("summary"), share_to_facebook: f.elements.fb.checked, body: f.elements.body.value }; }
      function upd() { var o = obj(); $("#wp").innerHTML = "<h2>" + esc(o.title) + "</h2>" + md(o.body); $("#wj").textContent = JSON.stringify(o, null, 1); }
      f.addEventListener("input", upd); f.elements.date.value = new Date().toISOString().slice(0, 10); upd();
      $("#wc").onclick = function () { var t = $("#wj").textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { $("#wmsg").textContent = "Copied."; }, function () { $("#wmsg").textContent = "Select the text and copy it manually."; }); };
      $("#wd").onclick = function () { var o = obj(), b = new Blob([JSON.stringify(o, null, 1)], { type: "application/json" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = o.slug + ".json"; a.click(); };
      if (site.repo) { var g = $("#wg"); g.hidden = false; g.onclick = function () { var o = obj(); window.open("https://github.com/" + site.repo + "/new/main/data/blogs?filename=" + encodeURIComponent(o.slug + ".json") + "&value=" + encodeURIComponent(JSON.stringify(o, null, 1)), "_blank", "noopener"); }; }
    },
    login: function () { $("#loginPage").innerHTML = loginLinks("lcard"); },
    notices: function () {
      var nt = data.notices || {}, items = sorted(nt.items), root = $("#ntRoot"), d = Date.now();
      var states = []; items.forEach(function (x) { if (x.state && states.indexOf(x.state) < 0) states.push(x.state); }); states.sort();
      var cats = []; items.forEach(function (x) { if (cats.indexOf(x.category) < 0) cats.push(x.category); });
      var chk = nt.last_check ? new Date(nt.last_check).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " IST" : "—";
      root.innerHTML = '<div class="ntbar"><div class="chkbox"><b>Daily check</b><span>Runs automatically every day at 00:00 IST</span><span>Last check: ' + esc(chk) + " · Next: " + ntNext() + ' IST</span>' + ((data.site || {}).repo ? '<a class="lnk" href="https://github.com/' + esc(data.site.repo) + '/actions/workflows/daily-sync.yml" target="_blank" rel="noopener">Run check now ↗</a>' : "") + '</div><div class="ntstat"><b>' + items.length + "</b> notices<br><b>" + items.filter(function (x) { return ntNew(x, d); }).length + "</b> new this week</div></div>" +
        '<div class="ntf"><input id="ntq" type="search" placeholder="Search notices (e.g. minimum wages, EPFO, Maharashtra)…" aria-label="Search notices"><select id="ntj" aria-label="Jurisdiction"><option value="">Central + State</option><option>Central</option><option>State</option></select><select id="nts" aria-label="State"><option value="">All states</option>' + states.map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("") + '</select><select id="ntc" aria-label="Category"><option value="">All categories</option>' + cats.map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("") + '</select></div><div class="ntmain"><div id="ntList"></div><aside class="nbr">' + ntDeadlines(nt, d) + '<p class="chk">Notices are summarised from public sources and the official portals linked on each card. Always confirm in the Gazette before acting. <a href="https://egazette.gov.in" target="_blank" rel="noopener">eGazette ↗</a> · <a href="https://labour.gov.in" target="_blank" rel="noopener">Ministry of Labour ↗</a> · <a href="https://clc.gov.in" target="_blank" rel="noopener">Chief Labour Commissioner ↗</a></p></aside></div>';
      function draw() {
        var q = $("#ntq").value.toLowerCase(), j2 = $("#ntj").value, s2 = $("#nts").value, c2 = $("#ntc").value;
        var r = items.filter(function (x) { return (!j2 || x.jurisdiction === j2) && (!s2 || x.state === s2) && (!c2 || x.category === c2) && (!q || (x.title + " " + x.summary + " " + x.state + " " + x.category + " " + (x.tags || []).join(" ")).toLowerCase().indexOf(q) >= 0); });
        $("#ntList").innerHTML = r.map(function (x) { return ntCard(x, d, true); }).join("") || '<p class="empty">No notices match.</p>';
      }
      ["ntq", "ntj", "nts", "ntc"].forEach(function (i) { $("#" + i).addEventListener("input", draw); }); draw();
    },
    downloads: function () {
      var dl = data.downloads || { items: [] }, root = $("#dlRoot"), groups = [];
      dl.items.forEach(function (x) { if (groups.indexOf(x.group) < 0) groups.push(x.group); });
      var feat = dl.items.filter(function (x) { return x.featured; });
      root.innerHTML = '<div class="dlfeat">' + feat.map(function (x) { return '<a class="dlf" href="' + esc(x.file) + '" download><span class="dlt">' + esc(x.type) + "</span><b>" + esc(x.title) + "</b><span>" + esc(x.desc) + "</span><em>⬇ Download · " + esc(x.size) + "</em></a>"; }).join("") + "</div>" +
        '<div class="dlprev"><h3>Common programme banner</h3><img src="assets/brand/bms-programme-banner-3200px.png" alt="BMS common programme banner" loading="lazy"><p>Open the SVG in Canva, Inkscape or Illustrator and replace “Programme Title”, venue, date and time. Keep the emblem, name, slogan and address strip unchanged.</p></div>' +
        groups.map(function (g) { return "<h3 class=\"dlh\">" + esc(g) + '</h3><div class="dlgrid">' + dl.items.filter(function (x) { return x.group === g; }).map(function (x) { return '<div class="dlc"><span class="dlt">' + esc(x.type) + "</span><b>" + esc(x.title) + "</b><p>" + esc(x.desc) + '</p><a class="btn sm" href="' + esc(x.file) + '" download>Download · ' + esc(x.size) + "</a></div>"; }).join("") + "</div>"; }).join("") +
        '<h3 class="dlh">Other resources</h3><div class="dlgrid">' + (dl.links || []).map(function (x) { return '<div class="dlc"><b>' + esc(x.title) + '</b><a class="btn sm ghost" href="' + esc(x.url) + '">Open →</a></div>'; }).join("") + '</div><p class="chk">Use the logo only for official BMS work. Photographs of leaders and events are available on the Gallery page; add further files to <code>assets/downloads/</code> and list them in <code>data/downloads.json</code>.</p>';
    },
    story: function () {
      var t = data.thengadi || {}, S = t.stories || [], root = $("#stRoot");
      if (!S.length) { root.innerHTML = '<p class="empty">Stories are not available yet.</p>'; return; }
      var cur = thIndex(t), q = parseInt((location.search.match(/[?&]w=(\d+)/) || [])[1], 10);
      var idx = q >= 1 && q <= S.length ? q - 1 : cur, s = S[idx];
      document.title = s.title + " | Dattopant Thengadi Ji | Bharatiya Mazdoor Sangh";
      var prev = S[(idx + S.length - 1) % S.length], next = S[(idx + 1) % S.length];
      root.innerHTML = '<div class="stgrid"><article class="post"><p><a href="index.html">← Home</a></p><span class="eyebrow dk">' + esc(s.tag) + " · Week " + s.week + " of " + S.length + (idx === cur ? " · This week" : "") + "</span><h1>" + esc(s.title) + '</h1><p class="lead2">' + esc(s.summary) + '</p><div class="md">' + md(s.body) + '</div><h3>Relevant links</h3>' + thLinks(s) + '<p class="stnav"><a class="btn ghost" href="story.html?w=' + prev.week + '">← ' + esc(prev.title) + '</a><a class="btn" href="story.html?w=' + next.week + '">' + esc(next.title) + ' →</a></p></article><aside>' + thPhoto(t) + '<h2 class="thname notranslate" translate="no">' + esc(t.name_hi) + "<small>" + esc(t.name) + "<br>" + esc(t.years) + '</small></h2><blockquote class="thsl"><p class="hi notranslate" translate="no">' + esc(t.slogan_hi) + "</p><p>“" + (t.slogan_en || []).map(esc).join(". ") + '.”</p></blockquote><p class="note">A new story is shown every week (Monday, IST). The ' + S.length + ' stories cover six months and are then repeated from the first.</p></aside></div><section id="all"><h2>All ' + S.length + ' stories</h2><ol class="starch">' + S.map(function (x, i) { return '<li class="' + (i === cur ? "now" : "") + '"><a href="story.html?w=' + x.week + '"><b>' + x.week + "</b> " + esc(x.title) + (i === cur ? " <em>this week</em>" : "") + "</a></li>"; }).join("") + "</ol></section>";
    },
    gallery: function () {
      var items = sorted((data.gallery || {}).items);
      $("#mason").innerHTML = items.map(function (x, i) { return '<figure data-i="' + i + '" tabindex="0"><img loading="lazy" src="' + esc(x.src) + '" alt="' + esc(x.caption) + '" onerror="this.parentNode.remove()"><figcaption>' + esc(x.caption) + "</figcaption></figure>"; }).join("") || '<p class="empty">No photos yet.</p>';
      var lb = $("#lb");
      function open(i) { var x = items[i]; if (!x) return; $("#lbImg").src = x.src; $("#lbCap").textContent = x.caption + (x.date ? " — " + fmtDate(x.date, true) : ""); lb.classList.add("on"); }
      $("#mason").addEventListener("click", function (e) { var f = e.target.closest("figure"); if (f) open(+f.getAttribute("data-i")); });
      $("#mason").addEventListener("keydown", function (e) { if (e.key === "Enter") { var f = e.target.closest("figure"); if (f) open(+f.getAttribute("data-i")); } });
      $("#lbX").onclick = function () { lb.classList.remove("on"); };
      lb.addEventListener("click", function (e) { if (e.target === lb) lb.classList.remove("on"); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") lb.classList.remove("on"); });
    }
  };

  var page = document.body.getAttribute("data-page");
  load(["site", "press", "leaders", "structure", "federations", "gallery", "videos", "blogs", "thengadi", "notices", "downloads"]).then(function () {
    shell(); if (pages[page]) pages[page](); applyTranslate();
  });
})();
