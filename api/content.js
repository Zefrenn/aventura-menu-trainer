import { put, get } from "@vercel/blob";

// Live menu content edited from /manager → Menu. Staff read it; managers (PIN) publish.
//   GET  /api/content                    -> { v, data, by, at, note }   (data null = built-in files only)
//   GET  /api/content?log=1     (x-pin)  -> { log: [{v, by, at, note, sections}] }  newest first
//   GET  /api/content?version=V (x-pin)  -> that published version
//   POST /api/content           (x-pin)  body {action:"publish", base, data, by, note, force?}
// data: { drinks?, food?, wines?, facts?, allergy?, settings? } — only sections that differ from the
// built-in files are sent. Every publish is also kept as config/content-history/<v>.json.
const ACCESS = "private";
const FILE = "config/content.json";
const LOG = "config/content-log.json";
const HIST = v => `config/content-history/${v}.json`;
const SECTIONS = ["drinks", "food", "wines", "facts", "allergy"];

function creds() {
  const env = process.env;
  const tokenKey = Object.keys(env).find(k => /_READ_WRITE_TOKEN$/.test(k));
  const storeKey = Object.keys(env).find(k => /_STORE_ID$/.test(k));
  const o = {};
  if (tokenKey) o.token = env[tokenKey];
  else if (storeKey) o.storeId = env[storeKey];
  return o;
}
async function readJSON(pathname, fallback) {
  try {
    const r = await get(pathname, { access: ACCESS, useCache: false, ...creds() });
    if (!r || !r.stream) return fallback;
    return JSON.parse(await new Response(r.stream).text());
  } catch (e) {
    if (e && /not\s*found/i.test(String(e.message || e))) return fallback;
    throw e;
  }
}
const writeJSON = (pathname, obj) => put(pathname, JSON.stringify(obj), { access: ACCESS, addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", ...creds() });

// ---- cleaning: plain text only, sane sizes ----
const clean = (s, n = 2000) => String(s ?? "").replace(/[<>]/g, "").replace(/\r\n?/g, "\n").trim().slice(0, n);
const strList = (a, n = 40, len = 300) => (Array.isArray(a) ? a : []).map(x => clean(x, len)).filter(Boolean).slice(0, n);
const TAPE_KEY = /^[A-Z][A-Z0-9_]{0,20}$/;
const DIET_CODE = /^(VG|V|GF|DF|P)\*?$/;
function cleanItem(r, section) {
  if (!r || typeof r !== "object" || Array.isArray(r)) return null;
  const o = {};
  for (const [k, v] of Object.entries(r)) {
    if (!/^_?[a-zA-Z]{1,20}$/.test(k)) continue;
    if (k === "_coach") {
      if (typeof v === "string") { const c = clean(v, 600); if (c) o._coach = c; }
      else if (v && typeof v === "object") { const c = {}; for (const [ck, cv] of Object.entries(v)) if (/^[a-zA-Z]{1,20}$/.test(ck) && typeof cv === "string" && clean(cv, 600)) c[ck] = clean(cv, 600); o._coach = c; }
    } else if (k === "_diet") o._diet = strList(v, 10, 4).filter(x => DIET_CODE.test(x));
    else if (k === "_was") o._was = strList(v, 10, 300);
    else if (k === "colors") o.colors = strList(v, 6, 22).filter(x => TAPE_KEY.test(x));
    else if (k === "build") o.build = strList(v, 20, 200);
    else if (typeof v === "string" || typeof v === "number") { const c = clean(v); if (c || k === "x") o[k] = c; }
  }
  const named = section === "facts" || section === "allergy" ? o.q && o.a : o.name;
  if (!named) return null;
  if (section !== "allergy" && !o.cat) return null;
  if (section === "drinks" && !o.colors) o.colors = [];
  if (section === "drinks" && !o.build) o.build = [];
  if (section === "allergy") o.cat = "Allergens & Mods";
  return o;
}
function cleanData(d) {
  const out = {};
  if (!d || typeof d !== "object") return out;
  for (const k of SECTIONS) if (Array.isArray(d[k])) out[k] = d[k].slice(0, 400).map(r => cleanItem(r, k)).filter(Boolean);
  if (d.settings && typeof d.settings === "object") {
    const s = d.settings, o = {};
    if (typeof s.menus === "string") o.menus = clean(s.menus, 200);
    if (s.tape && typeof s.tape === "object") { o.tape = {}; for (const [k, v] of Object.entries(s.tape)) if (TAPE_KEY.test(k) && /^#[0-9a-f]{3,8}$/i.test(String(v))) o.tape[k] = String(v); }
    for (const key of ["dietNotes", "hides"]) if (s[key] && typeof s[key] === "object") { o[key] = {}; for (const [k, v] of Object.entries(s[key])) if (/^[a-zA-Z ]{1,20}$/.test(k) && typeof v === "string") o[key][k] = clean(v, 600); }
    out.settings = o;
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const pinOk = () => process.env.MANAGER_PIN && (req.headers["x-pin"] || req.query.pin) === process.env.MANAGER_PIN;
    if (req.method === "GET") {
      if (req.query.log !== undefined) {
        if (!pinOk()) return res.status(401).json({ error: "bad pin" });
        return res.status(200).json({ log: await readJSON(LOG, []) });
      }
      if (req.query.version !== undefined) {
        if (!pinOk()) return res.status(401).json({ error: "bad pin" });
        const v = String(req.query.version).replace(/\D/g, "");
        const doc = v && await readJSON(HIST(v), null);
        return doc ? res.status(200).json(doc) : res.status(404).json({ error: "not found" });
      }
      const doc = await readJSON(FILE, null);
      return res.status(200).json(doc || { v: 0, data: null, by: "", at: 0, note: "" });
    }
    if (req.method === "POST") {
      if (!pinOk()) return res.status(401).json({ error: "bad pin" });
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      if (body.action !== "publish") return res.status(400).json({ error: "bad action" });
      const cur = await readJSON(FILE, null);
      const curV = (cur && cur.v) || 0;
      if (!body.force && Number(body.base || 0) !== curV) return res.status(409).json({ error: "changed", current: { v: curV, by: cur && cur.by, at: cur && cur.at, note: cur && cur.note } });
      const data = cleanData(body.data);
      if (JSON.stringify(data).length > 3_000_000) return res.status(413).json({ error: "too big" });
      const v = Math.max(Date.now(), curV + 1);
      const doc = { v, data: Object.keys(data).length ? data : null, by: clean(body.by, 40) || "Manager", at: Date.now(), note: clean(body.note, 300) };
      await writeJSON(HIST(v), doc);
      await writeJSON(FILE, doc);
      const log = await readJSON(LOG, []);
      log.unshift({ v, by: doc.by, at: doc.at, note: doc.note, sections: Object.keys(data) });
      await writeJSON(LOG, log.slice(0, 200));
      return res.status(200).json({ ok: true, doc });
    }
    res.status(405).json({ error: "method" });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
