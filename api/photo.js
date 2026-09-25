import { put, get, del } from "@vercel/blob";

// Dish & drink photos. Staff read; managers (PIN) upload, approve, hide.
//   GET  /api/photo?list=1            -> { "<id>": {src,v,type,by,at,status,note} }
//   GET  /api/photo?id=<id>&v=<ver>   -> the image (cached forever; v changes on replace)
//   POST /api/photo  header x-pin      body {action:"upload", id, type, data(base64), by, note?}
//                                           {action:"status", id, status:"ok"|"pending"|"hidden", note?}
//                                           {action:"delete", id}
const ACCESS = "private";
const INDEX = "photos/index.json";
const ID = /^[df]-[a-z0-9-]{1,60}$/;
const EXT = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

function creds() {
  const env = process.env;
  const tokenKey = Object.keys(env).find(k => /_READ_WRITE_TOKEN$/.test(k));
  const storeKey = Object.keys(env).find(k => /_STORE_ID$/.test(k));
  const o = {};
  if (tokenKey) o.token = env[tokenKey];
  else if (storeKey) o.storeId = env[storeKey];
  return o;
}
async function readBuf(pathname) {
  try {
    const r = await get(pathname, { access: ACCESS, useCache: false, ...creds() });
    if (!r || !r.stream) return null;
    return { buf: Buffer.from(await new Response(r.stream).arrayBuffer()), type: r.blob && r.blob.contentType };
  } catch (e) {
    if (e && /not\s*found/i.test(String(e.message || e))) return null;
    throw e;
  }
}
async function readIndex() {
  const r = await readBuf(INDEX);
  if (!r) return {};
  try { return JSON.parse(r.buf.toString("utf8")) || {}; } catch { return {}; }
}
async function writeIndex(idx) {
  await put(INDEX, JSON.stringify(idx), { access: ACCESS, addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", ...creds() });
}
const clean = (s, n) => String(s || "").replace(/[<>]/g, "").trim().slice(0, n);

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { list, id } = req.query;
      if (list !== undefined) {
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json(await readIndex());
      }
      if (!ID.test(String(id || ""))) return res.status(400).json({ error: "bad id" });
      const idx = await readIndex();
      const e = idx[id];
      if (!e || e.src !== "blob") return res.status(404).json({ error: "not found" });
      const f = await readBuf(`photos/${id}.${EXT[e.type] || "jpg"}`);
      if (!f) return res.status(404).json({ error: "not found" });
      res.setHeader("Content-Type", e.type || f.type || "image/jpeg");
      res.setHeader("Cache-Control", req.query.v ? "public, max-age=31536000, immutable" : "public, max-age=300");
      return res.status(200).end(f.buf);
    }

    if (req.method === "POST") {
      res.setHeader("Cache-Control", "no-store");
      const pin = req.headers["x-pin"];
      if (!process.env.MANAGER_PIN || pin !== process.env.MANAGER_PIN) return res.status(401).json({ error: "bad pin" });
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const id = String(body.id || "");
      if (!ID.test(id)) return res.status(400).json({ error: "bad id" });
      const idx = await readIndex();

      if (body.action === "upload") {
        const type = EXT[body.type] ? body.type : null;
        if (!type || !body.data) return res.status(400).json({ error: "bad image" });
        const buf = Buffer.from(String(body.data), "base64");
        if (buf.length < 2000 || buf.length > 3_000_000) return res.status(413).json({ error: "image size" });
        const old = idx[id];
        if (old && old.src === "blob" && old.type !== type) { try { await del(`photos/${id}.${EXT[old.type]}`, creds()); } catch {} }
        await put(`photos/${id}.${EXT[type]}`, buf, { access: ACCESS, addRandomSuffix: false, allowOverwrite: true, contentType: type, ...creds() });
        idx[id] = { src: "blob", v: Date.now(), type, by: clean(body.by, 40) || "Manager", at: Date.now(), status: "ok", note: clean(body.note, 200) };
      } else if (body.action === "status") {
        if (!["ok", "pending", "hidden"].includes(body.status)) return res.status(400).json({ error: "bad status" });
        idx[id] = { ...(idx[id] || { src: "seed" }), status: body.status, at: Date.now() };
        if (body.note !== undefined) idx[id].note = clean(body.note, 200);
      } else if (body.action === "delete") {
        const e = idx[id];
        if (e && e.src === "blob") { try { await del(`photos/${id}.${EXT[e.type] || "jpg"}`, creds()); } catch {} }
        delete idx[id];
      } else return res.status(400).json({ error: "bad action" });

      await writeIndex(idx);
      return res.status(200).json({ ok: true, entry: idx[id] || null });
    }
    res.status(405).json({ error: "method" });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
