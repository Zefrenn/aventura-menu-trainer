import { put, list, get } from "@vercel/blob";

const PREFIX = "trainees/";
const slugify = n => String(n||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40);

// Works with either auth style Vercel gives a Blob store:
//  - a read/write token  (BLOB_READ_WRITE_TOKEN or <Prefix>_READ_WRITE_TOKEN)
//  - OIDC + store id     (BLOB_STORE_ID or <Prefix>_STORE_ID)
function creds() {
  const env = process.env;
  const tokenKey = Object.keys(env).find(k => /_READ_WRITE_TOKEN$/.test(k));
  const storeKey = Object.keys(env).find(k => /_STORE_ID$/.test(k));
  const o = {};
  if (tokenKey) o.token = env[tokenKey];
  else if (storeKey) o.storeId = env[storeKey];
  return o;
}
const ACCESS = "private";

async function readDoc(pathname) {
  try {
    const r = await get(pathname, { access: ACCESS, useCache: false, ...creds() });
    if (!r || !r.stream) return null;
    const text = await new Response(r.stream).text();
    return JSON.parse(text);
  } catch (e) {
    if (e && /not\s*found/i.test(String(e.message || e))) return null;
    throw e;
  }
}

async function readAll() {
  const out = []; let cursor;
  do {
    const res = await list({ prefix: PREFIX, cursor, limit: 1000, ...creds() });
    for (const b of res.blobs) { const d = await readDoc(b.pathname); if (d) out.push(d); }
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);
  return out;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const { name, all, pin } = req.query;
      if (all !== undefined) {
        if (!process.env.MANAGER_PIN || pin !== process.env.MANAGER_PIN) return res.status(401).json({ error: "bad pin" });
        const rows = await readAll();
        return res.status(200).json(rows.map(r => ({ name: r.name, slug: r.slug, updated: r.updated, started: r.started, summary: r.summary || null })));
      }
      const slug = slugify(name);
      if (!slug) return res.status(400).json({ error: "name required" });
      const doc = await readDoc(PREFIX + slug + ".json");
      return res.status(doc ? 200 : 404).json(doc || { error: "not found" });
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const slug = slugify(body && body.name);
      if (!slug || !body.items) return res.status(400).json({ error: "bad body" });
      const doc = { name: String(body.name).trim().slice(0,40), slug, items: body.items, quiz: body.quiz || {right:0,total:0}, started: body.started || Date.now(), updated: Date.now(), summary: body.summary || null };
      const s = JSON.stringify(doc);
      if (s.length > 400_000) return res.status(413).json({ error: "too large" });
      await put(PREFIX + slug + ".json", s, { access: ACCESS, addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", ...creds() });
      return res.status(200).json({ ok: true, updated: doc.updated });
    }
    res.status(405).json({ error: "method" });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
}
