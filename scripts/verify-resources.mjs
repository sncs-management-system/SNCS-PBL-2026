import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseEnv } from "node:util";

// Read-only live checks. Credentials stay in memory; only pass/fail results print.
const local = parseEnv(readFileSync(".env.local", "utf8"));
const base = process.env.VITE_SUPABASE_URL || local.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || local.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(base || "") || !key?.startsWith("sb_publishable_")) throw new Error("Configure the public Supabase URL and publishable key.");
const manifest = JSON.parse(readFileSync("docs/reference-site/resources-manifest.json", "utf8"));
const expected = manifest.resources.filter((resource) => resource.status === "published" && resource.visibility === "public");
if (expected.length !== 2) throw new Error("Expected two published TLC originals in the manifest.");
const request = (path) => fetch(new URL(path, base), { headers: { apikey: key }, signal: AbortSignal.timeout(30000) });
const response = await request("/rest/v1/resources?select=id,title,category,storage_path,file_size_bytes,status,visibility");
if (!response.ok) throw new Error(`Resource listing: HTTP ${response.status}`);
const rows = await response.json();
if (rows.length !== expected.length || rows.some((row) => row.status !== "published" || row.visibility !== "public")) throw new Error("Unexpected public records.");
for (const resource of expected) {
  const row = rows.find((item) => item.storage_path === resource.storagePath);
  if (!row || row.file_size_bytes !== resource.fileSizeBytes || row.title !== resource.title || row.category !== resource.category) throw new Error("Resource metadata mismatch.");
  const file = await request(`/storage/v1/object/public/resource-files/${resource.storagePath}`);
  if (!file.ok) throw new Error(`PDF retrieval: HTTP ${file.status}`);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length !== resource.fileSizeBytes || createHash("sha256").update(bytes).digest("hex") !== resource.sha256) throw new Error("PDF bytes do not match the reviewed original.");
  console.log(`PASS: ${resource.title} (${bytes.length} bytes; original SHA-256)`);
}
for (const select of ["uploaded_by", "updated_at", "*"]) {
  const denied = await request(`/rest/v1/resources?select=${select}&limit=1`);
  if (denied.ok) throw new Error(`Unexpected anonymous access to ${select}.`);
}
console.log("PASS: unfiltered anonymous listing contains only the two published/public forms; audit fields and wildcard reads denied.");
