import { put, list } from "@vercel/blob";

const PREFIX = "trainees/";
const slugify = n => String(n||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40);

async function readAll() {
  const out = [];
  let cursor;
  do {
    const res = await list({ prefix: PREFIX, cursor, limit: 1000 });
    for (const b of res.blobs) {
      try {
        const r = await fetch(b.url + "?t=" + Date.now(), { cache: "no-store" });
        if (r.ok) out.push(await r.json());
      } catch {}
    }
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);
  return out;
}

async function readOne(slug) {
  const res = await list({ prefix: PREFIX + slug + ".json", limit: 1 });
  const b = res.blobs.find(x => x.pathname === PREFIX + slug + ".json");
  if (!b) return null;
  const r = await fetch(b.url + "?t=" + Date.now(), { cache: "no-store" });
  return r.ok ? r.json() : null;
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
      const doc = await readOne(slug);
      return res.status(doc ? 200 : 404).json(doc || { error: "not found" });
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const slug = slugify(body && body.name);
      if (!slug || !body.items) return res.status(400).json({ error: "bad body" });
      const doc = { name: String(body.name).trim().slice(0,40), slug, items: body.items, quiz: body.quiz || {right:0,total:0}, started: body.started || Date.now(), updated: Date.now(), summary: body.summary || null };
      const s = JSON.stringify(doc);
      if (s.length > 400_000) return res.status(413).json({ error: "too large" });
      await put(PREFIX + slug + ".json", s, { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
      return res.status(200).json({ ok: true, updated: doc.updated });
    }
    res.status(405).json({ error: "method" });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
}
