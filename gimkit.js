// Gimkit Don't Look Down console helper
// Paste on the lobby Start game screen (after you already picked DLD and set 59 min).
// Do NOT paste on /kits — Play Live redirects and kills the script.
// Stop with: window.__gkh.stop()
(async function () {
  if (window.__gkh && window.__gkh.stop) window.__gkh.stop();

  var OPTIONS = {
    sessionMinutes: 59,          // how long to auto-play after Start game
    actionDelayMs: 1500,         // pause between in-game clicks
    verifyScans: 2               // same correct answer seen this many times before click
  };

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }
  function log(msg) {
    console.log("[gimkit]", msg);
  }
  function norm(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }
  function txt(el) {
    return (el && el.textContent || "").replace(/\s+/g, " ").trim();
  }
  function ownText(el) {
    return [...el.childNodes]
      .filter(function (n) { return n.nodeType === 3; })
      .map(function (n) { return n.textContent.trim(); })
      .join("");
  }
  function visible(el) {
    if (!el || !el.isConnected) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 20 || r.height < 12) return false;
    if (r.bottom < 0 || r.top > innerHeight) return false;
    var cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.1;
  }

  function reactClick(el) {
    if (!el) return false;
    var evt = {
      type: "click",
      preventDefault: function () {},
      stopPropagation: function () {},
      nativeEvent: new MouseEvent("click", { bubbles: true, cancelable: true, view: window }),
      target: el,
      currentTarget: el,
      bubbles: true,
      cancelable: true
    };
    var fiberKey = Object.keys(el).find(function (k) {
      return k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$");
    });
    var fiber = fiberKey ? el[fiberKey] : null;
    for (var d = 0; fiber && d < 45; d++) {
      var props = fiber.memoizedProps || fiber.pendingProps;
      if (props) {
        for (var n = 0; n < 4; n++) {
          var name = ["onClick", "onPointerUp", "onMouseUp", "onTouchEnd"][n];
          if (typeof props[name] === "function") {
            props[name](evt);
            return true;
          }
        }
      }
      fiber = fiber.return;
    }
    var node = el;
    for (var i = 0; node && i < 14; i++) {
      var key = Object.keys(node).find(function (k) { return k.startsWith("__reactFiber$"); });
      if (key) {
        var f = node[key];
        for (var d2 = 0; f && d2 < 20; d2++) {
          var p2 = f.memoizedProps || f.pendingProps;
          if (p2 && typeof p2.onClick === "function") {
            p2.onClick(evt);
            return true;
          }
          f = f.return;
        }
      }
      node = node.parentElement;
    }
    var r = el.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    var target = document.elementFromPoint(x, y) || el;
    var o = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, button: 0 };
    ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach(function (type) {
      target.dispatchEvent(new MouseEvent(type, o));
    });
    if (target.click) target.click();
    return true;
  }

  function clickMatching(re, opts) {
    opts = opts || {};
    var minW = opts.minW || 40;
    var minH = opts.minH || 18;
    var exactOwn = !!opts.exactOwn;
    var hits = [];
    var nodes = document.querySelectorAll("button, [role='button'], a, div, span, p, h1, h2, h3, h4");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!visible(el)) continue;
      var own = ownText(el);
      var t = (exactOwn ? own : (own || txt(el))).replace(/\s+/g, " ").trim();
      if (!t || !re.test(t)) continue;
      if (opts.maxLen && t.length > opts.maxLen) continue;
      var r = el.getBoundingClientRect();
      if (r.width < minW || r.height < minH) continue;
      hits.push({ el: el, t: t, area: r.width * r.height, top: r.top });
    }
    hits.sort(function (a, b) { return a.t.length - b.t.length || b.area - a.area; });
    if (!hits.length) return false;
    reactClick(hits[0].el);
    return hits[0].t;
  }

  // --- sniff isCorrect from fetch / XHR / WebSocket ---
  var sniff = { lastCorrect: null, byQuestion: {}, updatedAt: 0 };
  function pickQ(o) {
    return o.question || o.prompt || o.query || o.stem ||
      (o.type === "question" || o.kind === "question" ? o.text : null);
  }
  function pickA(o) {
    return o.text || o.answer || o.label || o.content || o.value || o.title;
  }
  function isTruthyCorrect(o) {
    return o.isCorrect === true || o.correct === true || o.is_correct === true ||
      o.isCorrect === "true" || o.correct === "true" || o.isCorrect === 1 || o.correct === 1;
  }
  function ingest(data) {
    if (data == null) return;
    var stack = [data];
    var seen = new WeakSet();
    while (stack.length) {
      var obj = stack.pop();
      if (!obj || typeof obj !== "object") continue;
      if (seen.has(obj)) continue;
      seen.add(obj);
      var qText = typeof pickQ(obj) === "string" ? pickQ(obj).trim() : "";
      var answers = obj.answers || obj.options || obj.choices || obj.responses;
      if (qText && Array.isArray(answers)) {
        answers.forEach(function (a) {
          if (!a || typeof a !== "object") return;
          var aText = pickA(a);
          if (!aText || typeof aText !== "string") return;
          if (isTruthyCorrect(a)) {
            sniff.byQuestion[norm(qText)] = aText.trim();
            sniff.lastCorrect = aText.trim();
            sniff.updatedAt = Date.now();
          }
        });
      }
      var aText = pickA(obj);
      if (aText && typeof aText === "string" && isTruthyCorrect(obj)) {
        sniff.lastCorrect = aText.trim();
        sniff.updatedAt = Date.now();
        if (qText) sniff.byQuestion[norm(qText)] = aText.trim();
      }
      if (Array.isArray(obj)) obj.forEach(function (x) { stack.push(x); });
      else Object.keys(obj).forEach(function (k) { stack.push(obj[k]); });
    }
  }
  function ingestText(text) {
    if (!text || typeof text !== "string") return;
    var t = text.trim();
    if (t.startsWith("{") || t.startsWith("[")) {
      try { ingest(JSON.parse(t)); return; } catch (e) {}
    }
    if (!/isCorrect|"correct"\s*:\s*true/i.test(text)) return;
    var chunks = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g) || [];
    chunks.slice(0, 80).forEach(function (chunk) {
      try { ingest(JSON.parse(chunk)); } catch (e) {}
    });
  }
  if (!window.__GKH_HOOK__) {
    window.__GKH_HOOK__ = true;
    var origFetch = window.fetch;
    window.fetch = async function () {
      var res = await origFetch.apply(this, arguments);
      try {
        var clone = res.clone();
        var type = clone.headers.get("content-type") || "";
        if (type.indexOf("json") !== -1) ingest(await clone.json());
        else ingestText(await clone.text());
      } catch (e) {}
      return res;
    };
    var origOpen = XMLHttpRequest.prototype.open;
    var origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__gkhUrl = String(url || "");
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      this.addEventListener("load", function () {
        try {
          if (this.responseType === "json" && this.response) ingest(this.response);
          else ingestText(this.responseText);
        } catch (e) {}
      });
      return origSend.apply(this, arguments);
    };
    var OrigWS = window.WebSocket;
    function GkhWebSocket(url, protocols) {
      var ws = new OrigWS(url, protocols);
      ws.addEventListener("message", function (ev) {
        try {
          if (typeof ev.data === "string") ingestText(ev.data);
        } catch (e) {}
      });
      return ws;
    }
    GkhWebSocket.prototype = OrigWS.prototype;
    Object.setPrototypeOf(GkhWebSocket, OrigWS);
    window.WebSocket = GkhWebSocket;
  }
  window.__GKH_STATE__ = sniff;

  function bodyText(n) {
    return (document.body && document.body.innerText || "").slice(0, n || 5000);
  }
  function sessionEnded() {
    return /game over|session ended|thanks for playing|host ended|no longer active|game has ended|time.?s up/i.test(bodyText(2500));
  }
  function looksLoggedOut() {
    var b = bodyText(1500);
    return /\/login/i.test(location.href) || (/sign in|log in/i.test(b) && !/play live/i.test(b));
  }
  function inActiveGame() {
    var b = bodyText(4000);
    return /answer questions?/i.test(b) || /height:\s*\d/i.test(b);
  }
  function onSettings() {
    var b = bodyText(4000);
    return /game duration/i.test(b) || (/duration/i.test(b) && /\b\d{1,2}\s*min/i.test(b) && /continue/i.test(b));
  }
  function startGameVisible() {
    return !!clickMatching(/^(start game|start hosting|go!)$/i, { minW: 50, minH: 20, exactOwn: true, dry: true });
  }

  function clickByRe(re, extra) {
    var t = clickMatching(re, extra || { maxLen: 40, minW: 50, minH: 20 });
    if (t) log("clicked " + t);
    return !!t;
  }

  function setDuration(minutes) {
    var mins = String(minutes);
    function fire(el, val) {
      el.focus && el.focus();
      if ("value" in el) el.value = val;
      else el.textContent = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("blur", { bubbles: true }));
    }
    function nearDuration(el) {
      var block = ((el.closest && (el.closest("div, section, form, label") || {}).innerText) ||
        (el.parentElement && el.parentElement.innerText) || "").slice(0, 400);
      return /game duration|time limit|duration/i.test(block);
    }
    var inputs = document.querySelectorAll("input, [role='spinbutton'], [contenteditable='true']");
    for (var i = 0; i < inputs.length; i++) {
      if (!nearDuration(inputs[i])) continue;
      fire(inputs[i], mins);
      var val = "value" in inputs[i] ? inputs[i].value : inputs[i].textContent;
      if (String(val) === mins) return true;
    }
    var nodes = document.querySelectorAll("label, span, div, p, h4, h5");
    for (var j = 0; j < nodes.length; j++) {
      var t = (nodes[j].textContent || "").trim();
      if (!/^game duration$/i.test(t) && !/game duration/i.test(t.slice(0, 40))) continue;
      var root = nodes[j].closest("div, section, form") || nodes[j].parentElement;
      var box = (root && root.querySelector("input, [role='spinbutton'], [contenteditable='true']")) ||
        nodes[j].querySelector("input");
      if (!box) continue;
      fire(box, mins);
      var v2 = "value" in box ? box.value : box.textContent;
      if (String(v2) === mins) return true;
    }
    // stepper + until it reads 59
    for (var c = 0; c < 70; c++) {
      var shown = readDuration();
      if (shown != null && shown >= minutes - 1) return true;
      var plus = null;
      var all = document.querySelectorAll("button, [role='button'], div, span");
      for (var k = 0; k < all.length; k++) {
        var el = all[k];
        var ot = ownText(el) || txt(el);
        if (!/^\+|plus|increase/i.test(ot) && ot !== "+") continue;
        if (!nearDuration(el) && !/duration|min/i.test((el.parentElement && el.parentElement.innerText) || "")) continue;
        if (!visible(el)) continue;
        plus = el;
        break;
      }
      if (!plus) break;
      reactClick(plus);
    }
    return readDuration() != null && readDuration() >= minutes - 1;
  }

  function readDuration() {
    var b = bodyText(4000);
    var m = b.match(/game duration[^\n]{0,40}?(\d{1,3})\s*(?:min|minutes?)?/i) ||
      b.match(/(\d{1,3})\s*min/i);
    if (!m) return null;
    var n = parseInt(m[1], 10);
    return n >= 1 && n <= 60 ? n : null;
  }

  function findTiles() {
    var out = [];
    var seen = {};
    var midY = innerHeight * 0.18;
    var els = document.querySelectorAll("button, [role='button'], div, span, p, li, label");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var t = txt(el);
      if (!t || t.length < 1 || t.length > 220) continue;
      if (/answer questions?|height:|shop|gimpro|continue|settings|loading|start game|start hosting/i.test(t)) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 48 || r.height < 28 || r.top < midY) continue;
      if (r.width > innerWidth * 0.75) continue;
      var k = norm(t);
      if (seen[k]) continue;
      seen[k] = 1;
      out.push({ el: el, t: t });
    }
    return out;
  }

  function findCorrect(tiles) {
    var methods = [];
    for (var i = 0; i < tiles.length; i++) {
      if (/not\s+correct|incorrect/i.test(tiles[i].t)) continue;
      if (/^this is correct$/i.test(tiles[i].t.trim())) {
        methods.push({ el: tiles[i].el, t: tiles[i].t, src: "label" });
        break;
      }
    }
    if (sniff.lastCorrect && Date.now() - (sniff.updatedAt || 0) < 15000) {
      for (var j = 0; j < tiles.length; j++) {
        if (norm(tiles[j].t) === norm(sniff.lastCorrect)) {
          methods.push({ el: tiles[j].el, t: tiles[j].t, src: "network" });
          break;
        }
      }
    }
    var scripts = document.querySelectorAll("script:not([src])");
    for (var k = 0; k < tiles.length; k++) {
      var t = tiles[k].t;
      for (var s = 0; s < scripts.length; s++) {
        var c = scripts[s].textContent || "";
        if (c.indexOf(t.slice(0, 20)) === -1) continue;
        var esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (new RegExp('"text"\\s*:\\s*"' + esc + '"[\\s\\S]{0,300}?"isCorrect"\\s*:\\s*true', "i").test(c)) {
          methods.push({ el: tiles[k].el, t: t, src: "json" });
          break;
        }
      }
    }
    if (!methods.length) return null;
    var labelHit = methods.filter(function (m) { return m.src === "label"; })[0];
    if (labelHit) return labelHit;
    var counts = {};
    methods.forEach(function (m) { counts[m.t] = (counts[m.t] || 0) + 1; });
    var winner = null;
    var best = 0;
    Object.keys(counts).forEach(function (k) {
      if (counts[k] > best) { best = counts[k]; winner = k; }
    });
    var need = methods.length >= 2 ? 2 : 1;
    if (best < need) return methods[0];
    return methods.filter(function (m) { return m.t === winner; })[0];
  }

  var verifyPass = 0;
  var verifyKey = "";
  function findCorrectVerified(tiles) {
    var fp = tiles.map(function (x) { return norm(x.t); }).sort().join("|");
    var hit = findCorrect(tiles);
    if (!hit) { verifyPass = 0; verifyKey = ""; return null; }
    var key = fp + "::" + norm(hit.t);
    if (key === verifyKey) verifyPass += 1;
    else { verifyKey = key; verifyPass = 1; }
    if (verifyPass < OPTIONS.verifyScans) return null;
    return hit;
  }

  function openQuestions() {
    if (findTiles().length >= 2) return false;
    return clickByRe(/answer questions?/i, { maxLen: 30, minW: 50, minH: 24 });
  }

  function clickContinue() {
    var hits = [];
    var els = document.querySelectorAll("*");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var own = ownText(el);
      var t = (own || txt(el)).trim();
      if (!/^continue(\s*\(\s*\d+\s*s\s*\))?$/i.test(t)) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 24 || r.height < 14) continue;
      if (r.bottom < 0 || r.top > innerHeight) continue;
      hits.push({ el: el, area: r.width * r.height, top: r.top });
    }
    hits.sort(function (a, b) { return b.area - a.area || b.top - a.top; });
    if (!hits[0]) return false;
    reactClick(hits[0].el);
    return true;
  }

  var stopped = false;
  var lastClickFp = "";
  var lastFp = "";
  var nextActionAt = 0;
  window.__gkh = {
    stop: function () { stopped = true; log("stopped"); },
    options: OPTIONS,
    sniff: sniff
  };

  function onLobby() {
    var b = bodyText(4000);
    return /start game|start hosting/i.test(b) && !inActiveGame();
  }

  async function setup() {
    if (inActiveGame() || findTiles().length >= 2) {
      log("already in game — starting auto-play");
      return true;
    }
    if (looksLoggedOut()) {
      log("not logged in. Sign in, set up DLD, paste on the Start game lobby.");
      return false;
    }
    if (/\/kits/i.test(location.pathname) || /play live/i.test(bodyText(2000))) {
      log("you are on kits. Play Live redirects and kills this paste.");
      log("set up Don't Look Down yourself, wait until the lobby shows Start game, then paste there.");
      return false;
    }
    if (onSettings()) {
      log("this is still the settings screen. Set duration to 59, click Continue, then paste on Start game.");
      return false;
    }
    if (!onLobby() && !/start game|start hosting|go!/i.test(bodyText(4000))) {
      log("no Start game button. Open the DLD lobby (Start game visible), then paste.");
      return false;
    }

    log("lobby — clicking Start game");
    for (var s = 0; s < 10; s++) {
      if (inActiveGame() || findTiles().length >= 2) break;
      var clicked =
        clickByRe(/^(start game|start hosting|go!)$/i, { maxLen: 24, minW: 50, minH: 20, exactOwn: true }) ||
        clickByRe(/start game|start hosting/i, { maxLen: 24, minW: 50, minH: 20 });
      if (clicked) log("clicked Start game");
      await sleep(1200);
    }
    for (var w = 0; w < 25; w++) {
      if (inActiveGame() || findTiles().length >= 2) break;
      await sleep(800);
    }
    if (!inActiveGame() && findTiles().length < 2) {
      log("Start game did not stay on this page. If a new tab opened, paste this script there. If you see Height / Answer Questions, paste again on that screen.");
      return false;
    }
    log("in game");
    return true;
  }

  async function tick() {
    if (!/gimkit\.com/i.test(location.hostname)) return { phase: "not-gimkit" };
    if (Date.now() < nextActionAt) return { phase: "waiting-delay" };
    var tiles = findTiles();
    if (tiles.length < 2) {
      if (clickContinue()) {
        nextActionAt = Date.now() + OPTIONS.actionDelayMs;
        return { phase: "continued-feedback" };
      }
      if (openQuestions()) {
        nextActionAt = Date.now() + OPTIONS.actionDelayMs;
        return { phase: "opened-questions" };
      }
      return { phase: "waiting" };
    }
    var fp = tiles.map(function (x) { return norm(x.t); }).sort().join("|");
    var answer = findCorrectVerified(tiles);
    if (!answer) {
      return { phase: findCorrect(tiles) ? "verifying" : "scanning", tiles: tiles.length };
    }
    if (fp !== lastFp) { lastFp = fp; lastClickFp = ""; }
    if (lastClickFp === fp) {
      if (clickContinue()) {
        lastClickFp = "";
        lastFp = "";
        nextActionAt = Date.now() + OPTIONS.actionDelayMs;
        return { phase: "continued", answer: answer.t };
      }
      return { phase: "idle", answer: answer.t };
    }
    reactClick(answer.el);
    lastClickFp = fp;
    nextActionAt = Date.now() + OPTIONS.actionDelayMs;
    return { phase: "answered", answer: answer.t };
  }

  log("console helper on " + location.pathname);
  if (!/gimkit\.com/i.test(location.hostname)) {
    log("open the Gimkit DLD lobby (Start game screen), then paste again.");
    return;
  }
  var ok = await setup();
  if (!ok) return;

  var startAt = Date.now();
  var sessionMs = OPTIONS.sessionMinutes * 60 * 1000;
  log("auto-playing for " + OPTIONS.sessionMinutes + " min (timer starts now)");

  while (!stopped && Date.now() - startAt < sessionMs) {
    if (sessionEnded()) { log("game ended"); break; }
    var t;
    try { t = await tick(); } catch (e) { log("tick error " + e.message); t = { phase: "error" }; }
    var elapsed = Math.floor((Date.now() - startAt) / 60000);
    if (t.phase === "answered") log("answer: " + t.answer + " (" + elapsed + "/" + OPTIONS.sessionMinutes + " min)");
    else if (t.phase === "continued" || t.phase === "continued-feedback") log("Continue clicked");
    else if (t.phase === "opened-questions") log("opened Answer Questions");
    else if (t.phase === "verifying") log("double-checking answer…");
    await sleep(Math.max(400, Math.floor(OPTIONS.actionDelayMs / 3)));
  }
  log(stopped ? "stopped" : "session complete");
})();
