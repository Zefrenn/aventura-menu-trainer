import { put, get } from "@vercel/blob";

// Manager-assigned quizzes. Staff only ever see quizzes a manager has made live.
//   GET  /api/quizzes                  -> { quizzes: [live quizzes], now }
//   GET  /api/quizzes?all=1  (x-pin)   -> { quizzes: [every quiz, drafts included], now }
//   POST /api/quizzes        (x-pin)   body {action:"save", quiz} | {action:"delete", id}
// Quiz: { id, title, note, sections:[filter values], count, hints, custom:[{q,a,wrong:[3]}],
//         status:"draft"|"live"|"closed", from?:ms, until?:ms, created, updated, by }
const ACCESS = "private";
const FILE = "config/quizzes.json";

function creds() {
  const env = process.env;
  const tokenKey = Object.keys(env).find(k => /_READ_WRITE_TOKEN$/.test(k));
  const storeKey = Object.keys(env).find(k => /_STORE_ID$/.test(k));
  const o = {};
  if (tokenKey) o.token = env[tokenKey];
  else if (storeKey) o.storeId = env[storeKey];
  return o;
}
async function readAll() {
  try {
    const r = await get(FILE, { access: ACCESS, useCache: false, ...creds() });
    if (!r || !r.stream) return [];
    const j = JSON.parse(await new Response(r.stream).text());
    return Array.isArray(j) ? j : [];
  } catch (e) {
    if (e && /not\s*found/i.test(String(e.message || e))) return [];
    throw e;
  }
}
async function writeAll(list) {
  await put(FILE, JSON.stringify(list), { access: ACCESS, addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", ...creds() });
}
const clean = (s, n) => String(s ?? "").replace(/[<>]/g, "").trim().slice(0, n);
const num = v => (v === null || v === undefined || v === "" || isNaN(+v)) ? null : +v;
// live = manager set it live, and today is inside its window (if it has one)
export const isLive = (q, now = Date.now()) => q.status === "live" && (!q.from || q.from <= now) && (!q.until || q.until > now);

function sanitize(q, old) {
  const custom = (Array.isArray(q.custom) ? q.custom : []).slice(0, 40).map(c => ({
    q: clean(c.q, 300), a: clean(c.a, 160),
    wrong: (Array.isArray(c.wrong) ? c.wrong : []).map(w => clean(w, 160)).filter(Boolean).slice(0, 3),
  })).filter(c => c.q && c.a && c.wrong.length >= 1);
  const sections = (Array.isArray(q.sections) ? q.sections : []).map(s => s === null ? "__all__" : clean(s, 40)).filter(Boolean).slice(0, 30);
  return {
    id: old ? old.id : (clean(q.id, 40).replace(/[^a-z0-9-]/gi, "") || "q" + Date.now().toString(36)),
    title: clean(q.title, 80) || "Quiz",
    note: clean(q.note, 400),
    sections,
    count: Math.max(3, Math.min(30, Math.round(num(q.count) || 10))),
    hints: q.hints !== false,
    custom,
    status: ["draft", "live", "closed"].includes(q.status) ? q.status : "draft",
    from: num(q.from), until: num(q.until),
    created: old ? old.created : Date.now(), updated: Date.now(),
    by: clean(q.by, 40) || (old && old.by) || "Manager",
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const pinOk = () => process.env.MANAGER_PIN && (req.headers["x-pin"] || req.query.pin) === process.env.MANAGER_PIN;
    if (req.method === "GET") {
      const list = await readAll(), now = Date.now();
      if (req.query.all !== undefined) {
        if (!pinOk()) return res.status(401).json({ error: "bad pin" });
        return res.status(200).json({ quizzes: list, now });
      }
      return res.status(200).json({ quizzes: list.filter(q => isLive(q, now)), now });
    }
    if (req.method === "POST") {
      if (!pinOk()) return res.status(401).json({ error: "bad pin" });
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const list = await readAll();
      if (body.action === "save" && body.quiz) {
        const i = list.findIndex(q => q.id === body.quiz.id);
        if (i < 0 && list.length >= 200) return res.status(413).json({ error: "too many quizzes" });
        const q = sanitize(body.quiz, i >= 0 ? list[i] : null);
        if (!q.sections.length && !q.custom.length) return res.status(400).json({ error: "pick at least one section or write a question" });
        if (i >= 0) list[i] = q; else list.unshift(q);
        await writeAll(list);
        return res.status(200).json({ ok: true, quiz: q });
      }
      if (body.action === "delete") {
        const next = list.filter(q => q.id !== body.id);
        await writeAll(next);
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: "bad action" });
    }
    res.status(405).json({ error: "method" });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
