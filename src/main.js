// Pledge Meter — live Kickstarter campaign stats on BUSY Bar (72x16)
// Pages (dial): hero, pledged, today, time left, backers, goal, average.
// OK: refresh now. Start: pause/resume auto-rotation. Back: exit.

const APP = "io.github.ddiepri.pledge_meter";
const API = "http://localhost/api";
const PRIO = 50;
const W = 72;
const log = (m) => console.error(APP + ": " + m);

// ---------- palette ----------
const GREEN = [5, 206, 120]; // Kickstarter green
function hex(rgb, k) {
  let s = "#";
  for (let i = 0; i < 3; i++) {
    const v = Math.max(0, Math.min(255, Math.round(rgb[i] * k)));
    s += (v < 16 ? "0" : "") + v.toString(16).toUpperCase();
  }
  return s;
}
const GRN = hex(GREEN, 1) + "FF";
const WHITE = "#FFFFFFFF";
const GREY = "#8C8C8CFF";
const ORANGE = "#FF7800FF";
const RED = "#E03C3CFF";

// ---------- type ----------
// Advance per character (glyph + 1px spacing), measured on the bar's fonts.
// Glyph tops sit 2px below y for extra_large/bold/small and 1px below y for tiny.
const CH = "0123456789$,.%+-:/ ABCDEFGHIJKLMNOPQRSTUVWXYZ!";
const ADV = {
  extra_large: [8,5,8,8,8,8,8,8,8,8,9,3,3,11,7,4,3,6,4,8,8,8,8,7,7,8,8,5,7,8,7,9,8,8,8,8,8,8,7,8,9,9,8,8,7,3],
  bold: [7,7,7,7,7,7,7,7,7,7,9,3,4,9,7,4,2,6,5,7,7,7,7,6,6,7,7,5,6,7,6,10,8,7,7,7,7,7,7,7,8,11,7,7,7,4],
  small: [4,3,4,4,4,4,4,4,4,4,4,2,2,5,4,3,2,3,2,5,5,5,5,5,5,5,5,2,4,5,4,6,5,5,5,5,5,5,4,5,4,6,4,4,4,2],
  tiny: [4,4,4,4,4,4,4,4,4,4,4,2,2,5,4,4,2,5,3,4,4,4,4,4,4,4,4,4,4,5,4,6,5,5,4,5,4,4,4,5,6,6,4,6,5,2],
};
const TOP = { extra_large: 2, bold: 2, small: 2, tiny: 1 };
function textW(font, s) {
  const t = ADV[font];
  let w = 0;
  for (let i = 0; i < s.length; i++) {
    const k = CH.indexOf(s[i]);
    w += k >= 0 ? t[k] : t[19];
  }
  return Math.max(0, w - 1);
}
// text whose glyph tops land on row `top`
const T = (id, s, x, top, font, color) => ({ id: id, type: "text", text: s, x: x, y: top - TOP[font], font: font, color: color });
const bmp = (id, data, x, y) => ({ id: id, type: "xpmbitmap", data: data, x: x, y: y });
function xpm(rows, colors) {
  const keys = Object.keys(colors);
  const head = ["! XPM2", rows[0].length + " " + rows.length + " " + (keys.length + 1) + " 1", ". c None"];
  for (const k of keys) head.push(k + " c " + colors[k]);
  return head.concat(rows).join("\n");
}

// ---------- numbers ----------
function fmt(v) {
  let int = String(Math.round(Math.abs(v)));
  let out = "";
  while (int.length > 3) {
    out = "," + int.slice(-3) + out;
    int = int.slice(0, -3);
  }
  return (v < 0 ? "-" : "") + int + out;
}
const rep = (c, n) => {
  let s = "";
  for (let i = 0; i < n; i++) s += c;
  return s;
};
// 3 significant digits: 4,700, 47.3K, 114K, 1.20M, 12.0M, 116M; round=true drops trailing zeros (12M)
function short(v, round) {
  const a = Math.abs(v);
  const sig = (x, u) => {
    const t = String(x >= 100 ? Math.round(x) : x.toFixed(x >= 10 ? 1 : 2));
    return (round ? t.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "") : t) + u;
  };
  if (a >= 999500) return sig(a / 1e6, "M");
  if (a >= 1e4) return sig(a / 1e3, "K");
  return fmt(a);
}

// ---------- Flipper One (32x16) ----------
// handle loop, side grip, top button, status LEDs, touchpad, screen in a black bezel,
// five keys (green power), d-pad with centre button, back button, green LED strip
const F1_BODY = [
  "...........................HHHHH",
  "...........................E...E",
  "......OOO..................E...E",
  "...HHHHHHHHHHHHHHHHHHHHHHHHHHHHE",
  "..EKKKKKKKZZZZZZZZZZZZZKKKKKKKKE",
  "..EKbKKKKKZ###########ZKKOOOKKGE",
  ".EEKRKKKKKZ###########ZKOOOOOKGE",
  "EKKKKKKKKKZ###########ZOOrrrOOGE",
  "EKKOOOOOKKZ###########ZOOrCrOOKE",
  "EKOKKcKKOKZ###########ZOOrrrOOKE",
  "EKOKcccKOKZ###########ZKOOOOOKKE",
  "EKOKKcKKOKZZZZZZZZZZZZZKKOOOKKKE",
  "EKKOOOOOKKKKcKcKGKcKcKKKKKKKKOOE",
  ".EKKKKKKKKKKKKKKKKKKKKKKKKKKKOOE",
  "..EKKKKKKKKKKffffffffKKKKKKKKKKE",
  "...BBBBBBBBBBBBBBBBBBBBBBBBBBBB.",
];
// what the device's own 11x6 screen shows (rows 5..10, cols 11..21)
const F1_SCREENS = {
  pic: ["SSSSSSSSSkS", "SSSSSSSSSSS", "SkkkkkSSSSS", "SSSSSSSSSSS", "SkkkSkkkkSS", "SSSSSSSSSSS"],
  sand: ["SSkkkkkkkSS", "SSSkSSSkSSS", "SSSSkkkSSSS", "SSSSkkkSSSS", "SSSkSkSkSSS", "SSkkkkkkkSS"],
  up: ["SSSSSSSSSkS", "SSSSSSSSkSS", "SSSSSkSkSSS", "SSSSkSkSSSS", "SkSkSSSSSSS", "SSkSSSSSSSS"],
  wait: ["SSSSSSSSSSS", "SSSSSSSSSSS", "SSkSSkSSkSS", "SSSSSSSSSSS", "SSSSSSSSSSS", "SSSSSSSSSSS"],
  off: ["SSSkSSSkSSS", "SSSSkSkSSSS", "SSSSSkSSSSS", "SSSSkSkSSSS", "SSSkSSSkSSS", "SSSSSSSSSSS"],
  flash: ["WWWWWWWWWWW", "WWWWWWWWWWW", "WWWWWWWWWWW", "WWWWWWWWWWW", "WWWWWWWWWWW", "WWWWWWWWWWW"],
};
const F1_COLORS = { H: "#707070", E: "#4A4A4A", B: "#303030", K: "#242424", Z: "#000000", S: "#FFA24A", k: "#301400", O: "#FF7800", r: "#8A3A00", C: "#FFC890", c: "#6A6A6A", G: "#18E060", b: "#2F6BFF", R: "#FF3434", f: "#383838", W: "#FFFFFF" };
const f1Cache = {};
function flipper(screen) {
  if (!f1Cache[screen]) {
    const s = F1_SCREENS[screen];
    f1Cache[screen] = xpm(F1_BODY.map((r, y) => (y >= 5 && y <= 10 ? r.slice(0, 11) + s[y - 5] + r.slice(22) : r)), F1_COLORS);
  }
  return f1Cache[screen];
}
const F1W = 32;

// ---------- settings ----------
const cfg = { project: "flipper-devices/flipper-one", name: "FLIPPER ONE", goal: 300000, deadline: "2026-12-17T16:00:00Z", milestone: 1000000, updateSec: 5, rotate: true, rotateSec: 8 };
const isF1 = () => /flipper-one/i.test(cfg.project);
async function loadSettings() {
  try {
    const j = await (await fetch(API + "/apps/settings?app_id=" + encodeURIComponent(APP))).json();
    const v = j.values || {};
    if (typeof v.project === "string" && v.project.indexOf("/") > 0) cfg.project = v.project.trim().replace(/^https?:\/\/www\.kickstarter\.com\/projects\//, "").replace(/[?#].*$/, "").replace(/\/$/, "");
    if (typeof v.name === "string") cfg.name = v.name.toUpperCase().slice(0, 14);
    if (typeof v.goal === "number") cfg.goal = v.goal;
    if (typeof v.deadline === "string" && v.deadline) cfg.deadline = v.deadline.trim();
    if (typeof v.milestone === "string") cfg.milestone = parseInt(v.milestone, 10) || 0;
    if (typeof v.update_sec === "string") cfg.updateSec = Math.max(5, parseInt(v.update_sec, 10) || 5);
    if (typeof v.rotate === "boolean") cfg.rotate = v.rotate;
    if (typeof v.rotate_sec === "number") cfg.rotateSec = v.rotate_sec;
  } catch (e) {
    log("settings: " + (e && e.message));
  }
}

// ---------- local time ----------
let tzMin = 0;
async function loadTz() {
  try {
    const j = await (await fetch(API + "/time")).json();
    const m = /([+-])(\d\d):?(\d\d)$/.exec(j.timestamp || "");
    if (m) tzMin = (m[1] === "-" ? -1 : 1) * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
  } catch (e) {}
}
function localMidnightUtc(now) {
  const d = new Date(now + tzMin * 60000);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - tzMin * 60000;
}
function parseDeadline(s) {
  const m = /^(\d{4})-(\d\d)-(\d\d)(?:[T ](\d\d):(\d\d)(?::(\d\d))?)?\s*(Z|UTC|[+-]\d\d:?\d\d)?$/i.exec(s);
  if (!m) return NaN;
  let t = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  const z = m[7];
  if (z && /^[+-]/.test(z)) {
    const zz = /([+-])(\d\d):?(\d\d)/.exec(z);
    t -= (zz[1] === "-" ? -1 : 1) * (+zz[2] * 60 + +zz[3]) * 60000;
  } else if (!z) t -= tzMin * 60000; // no zone given: bar's local time
  return t;
}

// ---------- data ----------
// history: [[t, pledged, backers], ...] one point per ~10 min, two days kept
let data = null; // { pledged, backers, state, at }
let hist = [];
let err = "";
try {
  data = JSON.parse(localStorage.getItem("pm:data") || "null");
  hist = JSON.parse(localStorage.getItem("pm:hist") || "[]");
} catch (e) {
  data = null;
  hist = [];
}
let lastSave = 0;
// flash-friendly: write at most every 5 minutes (and whenever a history point is added)
function save(force) {
  if (!force && Date.now() - lastSave < 5 * 60000) return;
  lastSave = Date.now();
  try {
    localStorage.setItem("pm:data", JSON.stringify(data));
    localStorage.setItem("pm:hist", JSON.stringify(hist));
  } catch (e) {}
}
let fetching = false;
async function refresh() {
  if (fetching) return;
  fetching = true;
  try {
    const r = await fetch("https://www.kickstarter.com/projects/" + cfg.project + "/stats.json");
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    const p = j.project || {};
    const pledged = parseFloat(p.pledged);
    if (!isFinite(pledged)) throw new Error("no pledged");
    const prev = data;
    data = { pledged: pledged, backers: p.backers_count | 0, state: p.state || "", at: Date.now(), project: cfg.project };
    const last = hist.length ? hist[hist.length - 1] : null;
    const point = !last || data.at - last[0] >= 10 * 60000;
    if (point) hist.push([data.at, pledged, data.backers]);
    else hist[hist.length - 1] = [last[0], pledged, data.backers];
    while (hist.length && data.at - hist[0][0] > 48 * 3600000) hist.shift();
    err = "";
    checkMilestone(prev);
    save(point);
  } catch (e) {
    err = (e && e.message) || "error";
    log("refresh: " + err);
  } finally {
    fetching = false;
  }
}
// history point at (or just before) time t; falls back to the oldest point we have
function pointAt(t) {
  let v = null;
  for (const h of hist) {
    if (h[0] <= t) v = h;
    else break;
  }
  return v || hist[0] || null;
}

// ---------- milestone celebration ----------
let party = 0; // frames left
let partyText = "";
function checkMilestone(prev) {
  if (!cfg.milestone || !prev || prev.project !== cfg.project) return;
  const a = Math.floor(prev.pledged / cfg.milestone);
  const b = Math.floor(data.pledged / cfg.milestone);
  if (b > a) {
    partyText = short(b * cfg.milestone, true);
    party = 30;
    animate();
  }
}

// ---------- building blocks ----------
const labelColor = () => (err ? RED : GREY);
// big digits in extra_large; thousands are grouped by a wider gap instead of commas
// (a comma's tail would run into the label row underneath)
const GROUP = 3;
function bigW(s) {
  const parts = s.split(",");
  let w = (parts.length - 1) * (GROUP + 1);
  for (const p of parts) w += textW("extra_large", p);
  return w;
}
function big(s, x, top, color) {
  const parts = s.split(",");
  const els = [];
  for (let i = 0; i < parts.length; i++) {
    els.push(T("a" + i, parts[i], x, top, "extra_large", color));
    x += textW("extra_large", parts[i]) + 1 + GROUP;
  }
  return els;
}
// a small value over a tiny label, right-aligned to the edge (value sits on the big digits' baseline)
function rightCol(value, color, label) {
  const vw = textW("small", value);
  const lw = textW("tiny", label);
  return { w: Math.max(vw, lw), els: [T("rv", value, W - vw, 5, "small", color), T("rl", label, W - lw, 12, "tiny", labelColor())] };
}
const label = (s, color) => T("l", s, 0, 12, "tiny", color || labelColor());
function leftTime() {
  const t = parseDeadline(cfg.deadline);
  if (!isFinite(t)) return null;
  const ms = t - Date.now();
  if (ms <= 0) return { n: 0, unit: "", over: true };
  const d = Math.floor(ms / 86400000);
  if (d >= 1) return { n: d, unit: d === 1 ? "DAY" : "DAYS" };
  const h = Math.floor(ms / 3600000);
  if (h >= 1) return { n: h, unit: h === 1 ? "HOUR" : "HOURS" };
  const m = Math.max(1, Math.ceil(ms / 60000));
  return { n: m, unit: m === 1 ? "MIN" : "MINS" };
}

// pledged counter rolls up to the new value whenever it changed since it was last shown
const ROLL_MS = 1400;
let roll = null; // { from, t0 }
let seen = null;
function pledgedNow() {
  if (!roll) return data.pledged;
  const k = (Date.now() - roll.t0) / ROLL_MS;
  if (k >= 1) {
    roll = null;
    return data.pledged;
  }
  return roll.from + (data.pledged - roll.from) * (1 - Math.pow(1 - k, 3));
}
function rollLoop() {
  if (!roll || stopped) return;
  render().then(() => setTimeout(rollLoop, 120));
}

// ---------- pages ----------
function pageHero() {
  const s = short(data.pledged);
  if (!isF1()) return [T("n", cfg.name || "KICKSTARTER", 0, 0, "small", GREY)].concat(big(s, 0, 6, GRN));
  return [bmp("f", flipper("pic"), 0, 0)].concat(big(s, F1W + 2 + Math.max(0, Math.floor((W - F1W - 2 - bigW(s)) / 2)), 3, GRN));
}
function pagePledged() {
  if (seen !== null && seen !== data.pledged && !roll) {
    roll = { from: seen, t0: Date.now() };
    setTimeout(rollLoop, 120);
  }
  seen = data.pledged;
  const digits = fmt(pledgedNow());
  const els = (bigW(digits) <= W ? big(digits, 0, 0, GRN) : [T("a", digits, 0, 1, "bold", GRN)]).concat([label("PLEDGED")]);
  const st = err ? "OFFLINE" : data.state && data.state !== "live" ? data.state.toUpperCase() : "LIVE";
  const sw = textW("tiny", st);
  els.push(T("st", st, W - sw, 12, "tiny", err ? RED : st === "LIVE" ? GRN : GREY));
  if (st === "LIVE" && Math.floor(Date.now() / 1000) % 2 === 0) els.push(bmp("dot", xpm(["gg", "gg"], { g: hex(GREEN, 1) }), W - sw - 4, 13));
  return els;
}
function hourBars(n, h) {
  const now = Date.now();
  const vals = [];
  for (let i = n - 1; i >= 0; i--) {
    const a = pointAt(now - (i + 1) * 3600000);
    const b = i === 0 ? hist[hist.length - 1] : pointAt(now - i * 3600000);
    vals.push(a && b && b[0] > a[0] ? Math.max(0, b[1] - a[1]) : 0);
  }
  const mx = Math.max.apply(null, vals.concat([1]));
  const rows = [];
  for (let y = 0; y < h; y++) {
    let r = "";
    for (let x = 0; x < n; x++) {
      const v = vals[x];
      // square-root scale: a quiet hour still shows next to a launch-day burst
      const top = v > 0 ? h - Math.max(1, Math.round(Math.sqrt(v / mx) * h)) : h - 1;
      r += y < top ? "." : v <= 0 ? "z" : x === n - 1 ? "w" : y === top ? "a" : "b";
    }
    rows.push(r);
  }
  return xpm(rows, { a: hex(GREEN, 1), b: hex(GREEN, 0.55), z: hex(GREEN, 0.18), w: "#FFFFFF" });
}
function pageToday() {
  const now = Date.now();
  const p0 = pointAt(localMidnightUtc(now));
  const d = p0 ? data.pledged - p0[1] : 0;
  const s = "+" + short(d);
  const els = big(s, 0, 0, GRN).concat([label("TODAY")]);
  const bw = Math.min(24, W - bigW(s) - 4);
  if (bw >= 8) {
    els.push(bmp("g", hourBars(bw, 11), W - bw, 0));
    const t = bw >= 24 ? "24H" : bw + "H";
    els.push(T("gl", t, W - textW("tiny", t), 12, "tiny", labelColor()));
  }
  return els;
}
function pageLeft() {
  const L = leftTime();
  const f1 = isF1();
  const x0 = f1 ? F1W + 2 : 0;
  const zone = W - x0;
  const els = f1 ? [bmp("f", flipper(L && L.over ? "up" : "sand"), 0, 0)] : [];
  if (!L) return els.concat([T("a", "SET", x0 + 2, 3, "small", GREY), T("b", "DEADLINE", x0 + 2, 9, "small", GREY)]);
  if (L.over) {
    const s = data.state === "successful" ? "FUNDED" : "ENDED";
    return els.concat([T("a", s, x0 + Math.floor((zone - textW("bold", s)) / 2), 5, "bold", data.state === "successful" ? GRN : WHITE)]);
  }
  const n = String(L.n);
  const nw = textW("extra_large", n);
  const lw = Math.max(textW("tiny", L.unit), textW("tiny", "TO GO"));
  const x = x0 + Math.max(0, Math.floor((zone - nw - 3 - lw) / 2));
  return els.concat([T("a", n, x, 3, "extra_large", WHITE), T("u", L.unit, x + nw + 3, 3, "tiny", WHITE), T("g", "TO GO", x + nw + 3, 9, "tiny", GREY)]);
}
function pageBackers() {
  const now = Date.now();
  const s = fmt(data.backers);
  const els = big(s, 0, 0, WHITE).concat([label(data.backers === 1 ? "BACKER" : "BACKERS")]);
  const p0 = pointAt(localMidnightUtc(now));
  if (p0) {
    const rc = rightCol("+" + fmt(data.backers - p0[2]), GRN, "TODAY");
    if (bigW(s) + 5 + rc.w <= W) return els.concat(rc.els);
  }
  return els;
}
function pageGoal() {
  const frac = data.pledged / cfg.goal;
  const pct = Math.floor(frac * 100) + "%";
  const done = frac >= 1;
  const els = big(pct, 0, 0, done ? GRN : WHITE);
  const rc = rightCol(short(cfg.goal, true), WHITE, "GOAL");
  const fits = bigW(pct) + 5 + rc.w <= W;
  if (fits) els.push.apply(els, rc.els);
  if (done) els.push(label("FUNDED", GRN));
  else {
    const bw = fits ? W - rc.w - 5 : W;
    const fill = Math.round(Math.min(1, frac) * bw);
    const row = rep("g", fill) + rep("e", bw - fill);
    els.push(bmp("bar", xpm([row, row], { g: hex(GREEN, 1), e: "#2A2A2A" }), 0, 13));
  }
  return els;
}
function pageAvg() {
  return big(fmt(data.backers ? data.pledged / data.backers : 0), 0, 0, WHITE).concat([label("PER BACKER")]);
}
// pledged per hour over the last hour (needs 20+ minutes of history)
function pace() {
  const now = Date.now();
  const h1 = pointAt(now - 3600000);
  if (!h1 || now - h1[0] < 20 * 60000) return null;
  return ((data.pledged - h1[1]) * 3600000) / (now - h1[0]);
}
const compact = (v) => (v >= 1e4 ? short(v) : v >= 1000 ? (v / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(Math.round(v)));
function pagePace() {
  const s = "+" + compact(Math.max(0, pace() || 0));
  const zone = W - F1W - 2;
  const x = F1W + 2 + Math.max(0, Math.floor((zone - bigW(s)) / 2));
  const lw = textW("tiny", "PER HOUR");
  return [bmp("f", flipper("up"), 0, 0)].concat(big(s, x, 0, GRN), [T("l", "PER HOUR", F1W + 2 + Math.max(0, Math.floor((zone - lw) / 2)), 12, "tiny", labelColor())]);
}
const PAGE_KEYS = ["hero", "pledged", "today", "left", "backers", "goal", "pace", "avg"];
function pages() {
  const list = [pageHero, pagePledged, pageToday, pageLeft, pageBackers];
  if (cfg.goal > 0) list.push(pageGoal);
  if (isF1() && pace() !== null) list.push(pagePace);
  list.push(pageAvg);
  return list;
}
function noData() {
  const f1 = isF1();
  const x0 = f1 ? F1W + 3 : 0;
  const els = f1 ? [bmp("f", flipper(err ? "off" : "wait"), 0, 0)] : [];
  if (!err) return els.concat([T("a", "LOADING", x0, 6, "small", GREY)]);
  return els.concat([T("a", "OFFLINE", x0, 3, "small", RED), T("b", err.toUpperCase().slice(0, 9), x0, 10, "tiny", GREY)]);
}
function partyEls() {
  const on = party % 4 < 2;
  const f1 = isF1();
  const x0 = f1 ? F1W + 2 : 0;
  const tw = bigW(partyText);
  const tx = x0 + Math.max(0, Math.floor((W - x0 - tw) / 2));
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = "";
    for (let x = 0; x < W; x++) {
      const clear = x < x0 || (y >= 2 && y <= 13 && x >= tx - 2 && x <= tx + tw + 1); // keep sparkles off the device and text
      const h = ((x * 73856093) ^ (y * 19349663) ^ (party * 83492791)) >>> 0;
      r += !clear && h % 29 === 0 ? (h & 64 ? "s" : "t") : ".";
    }
    rows.push(r);
  }
  const els = [bmp("p", xpm(rows, { s: "#FFFFFF", t: hex(GREEN, 1) }), 0, 0)];
  if (f1) els.push(bmp("f", flipper(on ? "flash" : "pic"), 0, 0));
  return els.concat(big(partyText, tx, 3, on ? GRN : WHITE));
}

// ---------- drawing ----------
let page = 0;
let paused = false;
let shownIds = [];
async function post(method, body) {
  try {
    const r = await fetch(API + "/display/draw", { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok && r.status !== 409) log("draw " + method + " HTTP " + r.status);
  } catch (e) {
    log("draw: " + (e && e.message));
  }
}
let drawing = false;
let shownKey = "";
let shownEls = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shift = (els, dy) => els.map((e) => Object.assign({}, e, { y: (e.y || 0) + dy }));
const SLIDE = [7, 12, 15]; // rows the old screen has moved up, per frame
async function render() {
  if (stopped || drawing) return;
  drawing = true;
  try {
    let els;
    let key;
    if (party > 0) (els = partyEls()), (key = "party");
    else if (!data || data.project !== cfg.project) (els = noData()), (key = "wait" + (err ? "e" : ""));
    else {
      const list = pages();
      page = ((page % list.length) + list.length) % list.length;
      els = list[page]();
      key = PAGE_KEYS[list[page] === pageHero ? 0 : list[page] === pagePledged ? 1 : list[page] === pageToday ? 2 : list[page] === pageLeft ? 3 : list[page] === pageBackers ? 4 : list[page] === pageGoal ? 5 : list[page] === pagePace ? 6 : 7];
    }
    // ids are namespaced per screen: the same id with another element type is refused by the bar
    for (const e of els) e.id = key + "." + e.id;
    const slide = shownKey && key !== shownKey && /^(hero|pledged|today|left|backers|goal|pace|avg)$/.test(key) && /^(hero|pledged|today|left|backers|goal|pace|avg)$/.test(shownKey);
    if (slide) {
      for (const d of SLIDE) {
        if (stopped) return;
        await post("POST", { application_name: APP, priority: PRIO, elements: shift(shownEls, -d).concat(shift(els, 16 - d)) });
        await sleep(40);
      }
    }
    const ids = els.map((e) => e.id);
    const stale = shownIds.filter((id) => ids.indexOf(id) < 0);
    if (stale.length) await post("DELETE", { application_name: APP, element_ids: stale });
    await post("POST", { application_name: APP, priority: PRIO, elements: els });
    shownIds = ids;
    shownKey = key;
    shownEls = els;
  } finally {
    drawing = false;
  }
}
function animate() {
  if (party <= 0 || stopped) return;
  render().then(() => {
    party--;
    setTimeout(party > 0 ? animate : render, 150);
  });
}

// ---------- input & timers ----------
let stopped = false;
const timers = [];
let lastFlip = Date.now();
let unbind;
function stop() {
  stopped = true;
  for (const t of timers) clearInterval(t);
  if (unbind) unbind();
}
unbind = listen("input", (e) => {
  if (stopped) return;
  if (e.key === "back") {
    if (e.action === "short") stop();
    return;
  }
  if (e.key === "encoder") {
    page += e.delta > 0 ? 1 : -1;
    lastFlip = Date.now();
    render();
  } else if (e.key === "ok" && e.action === "short") {
    refresh().then(render);
  } else if (e.key === "start" && e.action === "short") {
    paused = !paused;
    lastFlip = Date.now();
  }
});

async function main() {
  await loadSettings();
  await loadTz();
  render();
  await refresh();
  render();
  let lastRefresh = Date.now();
  let lastSettings = Date.now();
  timers.push(
    setInterval(() => {
      const now = Date.now();
      if (now - lastRefresh >= cfg.updateSec * 1000 && !fetching) {
        lastRefresh = now;
        refresh().then(render);
      }
      if (now - lastSettings >= 30000) {
        lastSettings = now;
        loadSettings();
      }
      if (cfg.rotate && !paused && party <= 0 && now - lastFlip >= cfg.rotateSec * 1000) {
        lastFlip = now;
        page++;
      }
      if (party <= 0) render();
    }, 1000)
  );
}

main();
