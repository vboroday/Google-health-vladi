// Fitbit / Google Health widget for Scriptable (https://scriptable.app)
//
// Renders a small, medium or large Home Screen widget from a JSON summary
// served by your own endpoint (see ../routes/02-google-health-api.md and
// ../api/summary.example.json).
//
// Setup
//   1. Paste this file into a new Scriptable script named "Fitbit".
//   2. Set ENDPOINT and SECRET below, or leave MOCK = true to design the layout.
//   3. Add a Scriptable widget, choose this script. In "Parameter" you may pass
//      a comma-separated metric list to override METRICS, e.g.
//      "steps,caloriesOut,sleepScore". Add the widget several times with
//      different parameters to get several interchangeable tiles.

const MOCK = true;
const ENDPOINT = "https://YOUR-PROJECT.vercel.app/api/summary";
const SECRET = "change-me";           // sent as X-Widget-Secret header
const CACHE_MINUTES = 10;             // local cache to survive offline / rate limits

// Default metrics per widget size. Keys must exist in the JSON summary.
const METRICS = {
  small:  ["steps", "caloriesOut"],
  medium: ["steps", "caloriesOut", "activeZoneMinutes", "restingHeartRate"],
  large:  ["steps", "caloriesOut", "activeZoneMinutes", "distanceKm",
           "restingHeartRate", "sleepMinutes", "sleepScore", "readinessScore"],
};

// Display definitions: label, unit, goal key for a progress bar, formatter.
const DEFS = {
  steps:             { label: "Steps",      goal: "stepsGoal",    fmt: v => fmtInt(v) },
  caloriesOut:       { label: "Calories",   goal: "caloriesGoal", fmt: v => fmtInt(v), unit: "kcal" },
  activeZoneMinutes: { label: "Zone min",   goal: "azmGoal",      fmt: v => fmtInt(v) },
  distanceKm:        { label: "Distance",   fmt: v => v.toFixed(1), unit: "km" },
  floors:            { label: "Floors",     fmt: v => fmtInt(v) },
  restingHeartRate:  { label: "Resting HR", fmt: v => fmtInt(v), unit: "bpm" },
  sleepMinutes:      { label: "Sleep",      fmt: v => `${Math.floor(v / 60)}h ${v % 60}m` },
  sleepScore:        { label: "Sleep score",fmt: v => fmtInt(v), goalConst: 100 },
  readinessScore:    { label: "Readiness",  fmt: v => fmtInt(v), goalConst: 100 },
};

const COLORS = {
  bgTop: new Color("#0f172a"), bgBottom: new Color("#1e293b"),
  text: Color.white(), muted: new Color("#94a3b8"),
  bar: new Color("#334155"), fill: new Color("#22d3ee"), done: new Color("#4ade80"),
};

// ---------------------------------------------------------------------------

const size = config.widgetFamily || "medium";
const data = await loadSummary();
const metrics = pickMetrics(size);

const w = new ListWidget();
w.backgroundGradient = gradient(COLORS.bgTop, COLORS.bgBottom);
w.setPadding(14, 14, 12, 14);
w.refreshAfterDate = new Date(Date.now() + CACHE_MINUTES * 60 * 1000);

header(w, data);
w.addSpacer(6);

if (size === "small") {
  for (const key of metrics) { metricRow(w, key, data, true); w.addSpacer(4); }
} else {
  const cols = size === "large" ? 2 : 2;
  const perCol = Math.ceil(metrics.length / cols);
  const row = w.addStack(); row.layoutHorizontally(); row.spacing = 12;
  for (let c = 0; c < cols; c++) {
    const col = row.addStack(); col.layoutVertically(); col.spacing = 6;
    for (const key of metrics.slice(c * perCol, (c + 1) * perCol)) metricRow(col, key, data, false);
    col.addSpacer();
  }
}

w.addSpacer();
footer(w, data);

if (config.runsInWidget) Script.setWidget(w);
else if (size === "small") await w.presentSmall();
else if (size === "large") await w.presentLarge();
else await w.presentMedium();
Script.complete();

// ---------------------------------------------------------------------------

function pickMetrics(sz) {
  const param = (args.widgetParameter || "").trim();
  const list = param ? param.split(",").map(s => s.trim()).filter(Boolean) : METRICS[sz] || METRICS.medium;
  return list.filter(k => DEFS[k] && data[k] !== undefined);
}

function header(parent, d) {
  const s = parent.addStack(); s.centerAlignContent();
  const t = s.addText("Fitbit"); t.font = Font.semiboldSystemFont(13); t.textColor = COLORS.muted;
  s.addSpacer();
  const dt = s.addText(d.date || ""); dt.font = Font.systemFont(11); dt.textColor = COLORS.muted;
}

function footer(parent, d) {
  const s = parent.addStack();
  s.addSpacer();
  const when = d.updatedAt ? relTime(new Date(d.updatedAt)) : (d._stale ? "offline" : "");
  const t = s.addText(d._mock ? "mock data" : (d._stale ? `cached · ${when}` : when));
  t.font = Font.systemFont(9); t.textColor = COLORS.muted;
}

function metricRow(parent, key, d, big) {
  const def = DEFS[key]; const v = d[key];
  const goal = def.goalConst ?? (def.goal ? d[def.goal] : undefined);
  const col = parent.addStack(); col.layoutVertically(); col.spacing = 2;

  const line = col.addStack(); line.bottomAlignContent();
  const val = line.addText(def.fmt(v)); val.font = Font.boldSystemFont(big ? 22 : 18); val.textColor = COLORS.text;
  if (def.unit) { line.addSpacer(3); const u = line.addText(def.unit); u.font = Font.systemFont(10); u.textColor = COLORS.muted; }
  line.addSpacer();
  if (goal) { const p = line.addText(`${Math.round(100 * v / goal)}%`); p.font = Font.systemFont(10); p.textColor = COLORS.muted; }

  const lab = col.addText(def.label); lab.font = Font.systemFont(10); lab.textColor = COLORS.muted;

  if (goal) {
    const img = col.addImage(progressBar(Math.min(1, v / goal), big ? 120 : 140));
    img.imageSize = new Size(big ? 120 : 140, 4); img.cornerRadius = 2;
  }
}

function progressBar(frac, width) {
  const ctx = new DrawContext(); ctx.size = new Size(width, 4); ctx.opaque = false; ctx.respectScreenScale = true;
  ctx.setFillColor(COLORS.bar); ctx.fillRect(new Rect(0, 0, width, 4));
  ctx.setFillColor(frac >= 1 ? COLORS.done : COLORS.fill); ctx.fillRect(new Rect(0, 0, width * frac, 4));
  return ctx.getImage();
}

function gradient(a, b) { const g = new LinearGradient(); g.colors = [a, b]; g.locations = [0, 1]; return g; }
function fmtInt(v) { return Math.round(v).toLocaleString(); }
function relTime(dt) {
  const m = Math.round((Date.now() - dt.getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`;
}

async function loadSummary() {
  if (MOCK) return { ...mock(), _mock: true };
  const fm = FileManager.local();
  const cachePath = fm.joinPath(fm.cacheDirectory(), "fitbit-summary.json");
  try {
    const req = new Request(ENDPOINT);
    req.headers = { "X-Widget-Secret": SECRET, "Cache-Control": "no-cache" };
    req.timeoutInterval = 15;
    const json = await req.loadJSON();
    fm.writeString(cachePath, JSON.stringify(json));
    return json;
  } catch (e) {
    if (fm.fileExists(cachePath)) return { ...JSON.parse(fm.readString(cachePath)), _stale: true };
    return { ...mock(), _mock: true, _error: String(e) };
  }
}

function mock() {
  return {
    date: new Date().toISOString().slice(0, 10),
    steps: 7421, stepsGoal: 10000, caloriesOut: 1980, caloriesGoal: 2500,
    activeZoneMinutes: 28, azmGoal: 22, distanceKm: 5.6, floors: 9,
    restingHeartRate: 58, sleepMinutes: 412, sleepScore: 81, readinessScore: 74,
    updatedAt: new Date(Date.now() - 7 * 60000).toISOString(),
  };
}
