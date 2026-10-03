export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export interface PublicResource {
  id: string;
  title: string;
  category: string;
  storagePath: string;
  fileSizeBytes: number;
}

export function isSafePdfPath(path: string): boolean {
  return path.length <= 500 && path.endsWith(".pdf")
    && path.split("/").every((segment) => /^[a-zA-Z0-9][a-zA-Z0-9 ._-]*$/.test(segment));
}

export function parsePublicResource(value: unknown): PublicResource | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = typeof row.id === "number" && Number.isSafeInteger(row.id) && row.id > 0
    ? String(row.id) : typeof row.id === "string" && /^[1-9]\d*$/.test(row.id) ? row.id : null;
  if (!id || row.status !== "published" || row.visibility !== "public"
    || typeof row.title !== "string" || !row.title.trim()
    || typeof row.category !== "string" || !row.category.trim()
    || typeof row.storage_path !== "string" || !isSafePdfPath(row.storage_path)
    || typeof row.file_size_bytes !== "number" || !Number.isSafeInteger(row.file_size_bytes)
    || row.file_size_bytes < 5 || row.file_size_bytes > MAX_PDF_BYTES) return null;
  return { id, title: row.title.trim(), category: row.category.trim(),
    storagePath: row.storage_path, fileSizeBytes: row.file_size_bytes };
}

export function formatFileSize(bytes: number): string {
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(2)} MB`
    : `${(bytes / 1_000).toFixed(1)} KB`;
}

export function resourceFilename(title: string): string {
  const name = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
  return `${name || "school-resource"}.pdf`;
}
