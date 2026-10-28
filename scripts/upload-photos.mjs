#!/usr/bin/env node
// Push a pro photo into Vercel Blob for ids that already have an older manager upload
// (a Blob photo wins over the seed for the same id, so the seed can't replace it on its own).
//
//   MANAGER_PIN=•••• node scripts/upload-photos.mjs            # uploads the ids below
//   MANAGER_PIN=•••• node scripts/upload-photos.mjs f-torrijas # or just the ids you name
//
// Reads img/p-<id>.webp, POSTs it to /api/photo with the manager PIN header. Nothing else is touched.
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = process.env.SITE || "https://aventura-menu-trainer.vercel.app";
const PIN = process.env.MANAGER_PIN;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// ids whose Blob copy (Sep 2026 phone shot) should be replaced by the Oct 2026 pro shot
const DEFAULT_IDS = {
  "f-quesos-y-charcuteria": "Board: three cheeses, jamón, chorizo, salami, membrillo, pickles, Marcona almonds, jam; baguette on the side.",
  "f-tarta-de-santiago":    "Wedge with powdered sugar + vanilla ice cream ramekin.",
};

if (!PIN) { console.error("Set MANAGER_PIN in the environment (never paste it into a file)."); process.exit(1); }
if (!/^[\x21-\x7e]+$/.test(PIN)) { console.error("MANAGER_PIN must be the real PIN (plain digits/letters) — replace the •••• placeholder."); process.exit(1); }
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(DEFAULT_IDS);
for (const id of ids) {
  if (!/^[df]-[a-z0-9-]{1,60}$/.test(id)) { console.error(`skip ${id}: not a photo id`); continue; }
  const file = resolve(ROOT, "img", `p-${id}.webp`);
  const data = (await readFile(file)).toString("base64");
  const body = { action: "upload", id, type: "image/webp", data, by: "Zefren", note: DEFAULT_IDS[id] || "Pro shoot, Oct 2026" };
  const r = await fetch(`${SITE}/api/photo`, { method: "POST", headers: { "content-type": "application/json", "x-pin": PIN }, body: JSON.stringify(body) });
  const text = await r.text();
  console.log(`${id}: ${r.status} ${text.slice(0, 200)}`);
  if (!r.ok) process.exitCode = 1;
}
